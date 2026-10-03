import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {analyzeDescription} from '../src/compiler/description-parser.js';
import {compileNativeSpellEffects} from '../src/compiler/native-spell-effect-compiler.js';
import {compileDegreeSpeedNativeEffects} from '../src/compiler/native-outcome-effect-compiler.js';
import {analyzeResidualProse} from '../src/compiler/residual-prose.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {createNativeEffect, inspectCompiledNativeOutcomeEffect, inspectNativeOutcomeEffect,
    prepareNativeEffectSource, prepareNativeOutcomeEffectSource} from '../scripts/native-outcome-effects.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/${path}`, import.meta.url), 'utf8'));

function compilation(spell, template, lifecycle = {durationSpec: {mode: 'instantaneous'}}) {
    const description = analyzeDescription(spell.system.description.value);
    const catalog = new Map([[template.name, {
        id: template._id, name: template.name, type: template.type,
        mechanics: {duration: template.system.duration, rules: template.system.rules, start: template.system.start}
    }]]);
    const native = compileNativeSpellEffects({
        html: spell.system.description.value, sections: description.sections,
        hasPrimarySave: true, catalog
    });
    return compileDegreeSpeedNativeEffects(native, {sections: description.sections, lifecycle});
}

test('degree-selected native Speed Effect claims exact save clauses independently of damage', async () => {
    const spell = await fixture('spells/spells/rank-1/tempest-touch.json');
    const template = await fixture('spell-effects/spell-effect-tempest-touch.json');
    const compiled = compilation(spell, template);
    assert.deepEqual(Object.fromEntries(Object.entries(compiled.outcomes).map(([degree, effects]) =>
        [degree, effects.map(effect => effect.outcomeRule?.selectionValue)])), {
        criticalSuccess: [], success: [-5], failure: [-10], criticalFailure: [-10]
    });
    for (const degree of ['success', 'failure', 'criticalFailure']) {
        const section = analyzeDescription(spell.system.description.value).sections[degree];
        const effect = compiled.outcomes[degree][0];
        const coverage = analyzeResidualProse({
            rawText: section.text,
            damage: {mode: 'shared', multiplier: 1},
            effects: [], nativeEffects: [effect], followUps: []
        });
        assert.equal(coverage.fullyCompiled, true, degree);
    }
});

test('renamed source and changed matching native choice compile without spell identity', async () => {
    const spell = await fixture('spells/spells/rank-1/tempest-touch.json');
    const template = await fixture('spell-effects/spell-effect-tempest-touch.json');
    spell.name = 'Glacial Rebuke';
    spell.system.slug = 'glacial-rebuke';
    spell.system.description.value = spell.system.description.value.replace('–5-foot', '–7-foot');
    template.system.rules[0].choices.find(choice => choice.value === -5).value = -7;
    assert.equal(compilation(spell, template).outcomes.success[0].outcomeRule.selectionValue, -7);
    template.system.rules[0].choices.find(choice => choice.value === -7).value = -5;
    assert.equal(compilation(spell, template).outcomes.success.length, 0);
});

test('fixed two-round status Speed modifier is selected from matching custom prose and native data', async () => {
    const spell = await fixture('spells/spells/rank-1/tempest-touch.json');
    const template = await fixture('spell-effects/spell-effect-tempest-touch.json');
    spell.name = 'Lingering Drag';
    spell.system.description.value = spell.system.description.value
        .replaceAll('circumstance penalty', 'status penalty')
        .replaceAll('until the end of your next turn', 'for 2 rounds');
    template.system.rules[1].type = 'status';
    template.system.duration.value = 2;
    template.system.duration.expiry = 'turn-start';
    const effects = compilation(spell, template).outcomes;
    assert.equal(effects.success[0].outcomeRule.modifierType, 'status');
    assert.equal(effects.failure[0].outcomeRule.templateDuration.value, 2);
    const live = {...template, id: template._id};
    assert.equal(inspectNativeOutcomeEffect(effects.failure[0], live, {degree: 'failure'}).supported, true);
});

test('extra mechanics, changed duration, or unsupported native rules remain unclaimed', async () => {
    const baseSpell = await fixture('spells/spells/rank-1/tempest-touch.json');
    const baseTemplate = await fixture('spell-effects/spell-effect-tempest-touch.json');
    const mutated = structuredClone(baseSpell);
    mutated.system.description.value = mutated.system.description.value.replace(
        'until the end of your next turn.', 'until the end of your next turn and loses an action.');
    assert.equal(compilation(mutated, baseTemplate).outcomes.success.length, 0);
    const duration = structuredClone(baseTemplate);
    duration.system.duration.value = 2;
    assert.equal(compilation(baseSpell, duration).outcomes.success.length, 0);
    const extraRule = structuredClone(baseTemplate);
    extraRule.system.rules.push({key: 'GrantItem', uuid: 'Compendium.pf2e.conditionitems.Item.extra'});
    assert.equal(compilation(baseSpell, extraRule).outcomes.success.length, 0);
    assert.equal(compilation(baseSpell, baseTemplate, {durationSpec: {mode: 'sustained'}}).outcomes.success.length, 0);
});

test('runtime preflight pins native rule, duration, actor ownership, and degree choice before creation', async t => {
    const spell = await fixture('spells/spells/rank-1/tempest-touch.json');
    const sourceTemplate = await fixture('spell-effects/spell-effect-tempest-touch.json');
    const effect = compilation(spell, sourceTemplate).outcomes.failure[0];
    assert.equal(inspectCompiledNativeOutcomeEffect(effect, {degree: 'failure'}).supported, true);
    const template = {
        ...sourceTemplate, id: sourceTemplate._id,
        uuid: `Compendium.pf2e.spell-effects.Item.${sourceTemplate._id}`,
        toObject() { return structuredClone(sourceTemplate); }
    };
    const savedFoundry = globalThis.foundry;
    t.after(() => { globalThis.foundry = savedFoundry; });
    globalThis.foundry = {utils: {deepClone: structuredClone}};
    assert.equal(inspectNativeOutcomeEffect(effect, template, {degree: 'failure'}).supported, true);
    assert.equal(inspectNativeOutcomeEffect(effect, template, {degree: 'success'}).supported, false);
    const prepared = prepareNativeOutcomeEffectSource(effect, template, {
        degree: 'failure', castInstanceId: 'cast-1', castRank: 4,
        sourceActorUuid: 'Actor.caster', sourceItemUuid: 'Item.spell',
        sourceItemName: 'Glacial Rebuke', targetActorUuid: 'Actor.target', compilerVersion: 'test',
        effectStart: {value: 123, initiative: 20, started: false, turn: 0, turnActors: []}
    });
    assert.equal(prepared.system.rules[0].selection, -10);
    assert.equal(prepared.flags.system.rulesSelections.speedPenalty, -10);
    assert.equal(prepared.system.context.origin.actor, 'Actor.caster');
    assert.equal(prepared.system.context.target.actor, 'Actor.target');
    assert.equal(prepared.system.level.value, 4);
    assert.deepEqual(prepared.system.start, {value: 123, initiative: 20});
    assert.equal(prepared.flags['pf2e-automatic-resolution'].runtime.castInstanceId, 'cast-1');
    assert.equal(prepared._id, undefined);
    assert.equal(sourceTemplate.system.rules[0].selection, undefined);
    const actor = {name: 'Target', async createEmbeddedDocuments(_type, sources) { return [{uuid: 'Actor.target.Item.effect', source: sources[0]}]; }};
    assert.equal((await createNativeEffect(actor, prepared)).uuid, 'Actor.target.Item.effect');
    const changed = structuredClone(sourceTemplate);
    changed.system.rules[1].selector = 'land-speed';
    assert.equal(inspectNativeOutcomeEffect(effect, {...template, system: changed.system}, {degree: 'failure'}).supported, false);
    // Standalone native Effects keep the same origin/level/runtime envelope.
    const standalone = prepareNativeEffectSource(template, {
        castInstanceId: 'standalone', castRank: 4, sourceActorUuid: 'Actor.caster'
    });
    assert.equal(standalone.flags['pf2e-automatic-resolution'].runtime.castInstanceId, 'standalone');
});

test('next-source-turn native Effect timing follows combat order and is preflighted', async t => {
    const spell = await fixture('spells/spells/rank-1/tempest-touch.json');
    const sourceTemplate = await fixture('spell-effects/spell-effect-tempest-touch.json');
    const effect = compilation(spell, sourceTemplate).outcomes.success[0];
    assert.equal(effect.outcomeRule.durationAnchor, 'source-turn');
    assert.equal(effect.outcomeRule.durationOffset, 1);
    const template = {
        ...sourceTemplate, id: sourceTemplate._id,
        uuid: `Compendium.pf2e.spell-effects.Item.${sourceTemplate._id}`,
        toObject() { return structuredClone(sourceTemplate); }
    };
    const savedFoundry = globalThis.foundry;
    t.after(() => { globalThis.foundry = savedFoundry; });
    globalThis.foundry = {utils: {deepClone: structuredClone}};
    const runtime = {
        degree: 'success', castInstanceId: 'cast-timing', castRank: 1,
        sourceActorUuid: 'Actor.caster', targetActorUuid: 'Actor.target',
        effectStart: {value: 456, initiative: 15, started: true, turn: 0,
            turnActors: ['Actor.target', 'Actor.caster']}
    };
    assert.equal(prepareNativeOutcomeEffectSource(effect, template, runtime).system.duration.value, 0);
    runtime.effectStart.turn = 1;
    assert.equal(prepareNativeOutcomeEffectSource(effect, template, runtime).system.duration.value, 1);
    runtime.effectStart.turnActors = ['Actor.target', 'Actor.other'];
    assert.throws(() => prepareNativeOutcomeEffectSource(effect, template, runtime), /turn anchor is ambiguous/);
    delete runtime.effectStart;
    assert.throws(() => prepareNativeOutcomeEffectSource(effect, template, runtime), /requires cast timing/);
});

test('native preflight rejects changed optional rule mechanics rather than silently applying them', async () => {
    const spell = await fixture('spells/spells/rank-1/tempest-touch.json');
    const sourceTemplate = await fixture('spell-effects/spell-effect-tempest-touch.json');
    const effect = compilation(spell, sourceTemplate).outcomes.failure[0];
    for (const alteration of [
        rule => { rule.predicate = ['self:condition:frightened']; },
        rule => { rule.removeAfterRoll = true; }
    ]) {
        const changed = structuredClone(sourceTemplate);
        alteration(changed.system.rules[1]);
        assert.equal(inspectNativeOutcomeEffect(effect, {
            ...changed, id: changed._id
        }, {degree: 'failure'}).supported, false);
    }
});

test('save capability composes shared damage, a condition, and a native Speed Effect in one outcome', async () => {
    const spell = await fixture('spells/spells/rank-1/tempest-touch.json');
    const template = await fixture('spell-effects/spell-effect-tempest-touch.json');
    const nativeEffect = compilation(spell, template).outcomes.failure[0];
    const outcome = (damage, effects = [], nativeEffects = []) => ({
        damage, effects, nativeEffects, followUps: [], decisions: [], manualInstructions: [],
        terminal: null, semanticCoverage: {fullyCompiled: true}
    });
    const none = {mode: 'none', multiplier: 0, sourceComponentIds: []};
    const shared = multiplier => ({mode: 'shared', multiplier, sourceComponentIds: ['0']});
    const condition = {
        kind: 'condition', slug: 'clumsy', name: 'Clumsy', value: 1,
        duration: {mode: 'fixed', value: 2, unit: 'rounds', expiry: 'turn-start'}
    };
    const plan = {
        compilerVersion: 'test', source: {name: 'Composed Outcome', uuid: 'Actor.caster.Item.spell'},
        rank: 1, automation: {level: 'guided', pendingCapabilities: [], delegatedCapabilities: []},
        targeting: {actorConstraints: {sourceText: '1 creature', supportsActorTargets: true,
            complete: true, predicates: []}},
        lifecycle: {durationSpec: {mode: 'instantaneous'}, controller: {required: false}},
        resolution: {
            kind: 'save', check: {statistic: 'fortitude', basic: false, dcSource: 'source-actor'},
            sharedDamage: {mode: 'pf2e-item-damage', rollOnce: true,
                components: [{id: '0', formula: '1d4', type: 'cold'}]},
            outcomes: {
                criticalSuccess: outcome(none),
                success: outcome(shared(0.5)),
                failure: outcome(shared(1), [condition], [nativeEffect]),
                criticalFailure: outcome(shared(2))
            }
        }
    };
    assert.deepEqual(inspectSavePlan(plan), {supported: true, route: 'degree-save', blockers: []});

    const unsupported = structuredClone(plan);
    unsupported.resolution.outcomes.failure.effects.push({kind: 'action-loss', value: 1});
    const inspection = inspectSavePlan(unsupported);
    assert.equal(inspection.supported, false);
    assert.ok(inspection.blockers.some(blocker => blocker.code === 'condition-composition'));
});
