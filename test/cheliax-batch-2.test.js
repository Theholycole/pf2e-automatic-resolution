import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {heightenedPlanAt, inspectSavePlan, isExecutableLingeringPlan} from '../scripts/basic-save-core.js';

// PF2e 8.6's last new spells (Lost Omens Cheliax, Infernal Inheritance) and Summon Instrument's rewritten text (2026-10-16): Gift of Dusk (a curse whose last
// stage brings a creature), Tenebrous Freedom (a shadow taken back by a Grapple), Control Currents (a current flowing either way).
const base = new URL('../.cache/pf2e-test-fixtures-861/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const compile = (source, nativeEffectCatalog = new Map()) => compileAbility(source, {nativeEffectCatalog, referencedSpells: new Map()});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('Gift of Dusk: the curse handed off at stage 1 or 2, its stage 3 creature (a Greater Shadow from the 6th), the cast instantaneous', async () => {
    const source = await spell('rank-4/gift-of-dusk');
    const plan = compile(source);
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].affliction.stage), [1, 2]);
    assert.equal(plan.resolution.outcomes.success.effects[0].slug, 'enfeebled');
    assert.equal(plan.targeting.actorConstraints.predicates[0].kind, 'gm-confirmed');
    const creature = plan.resolution.afflictionHandoff.stageCreature;
    assert.deepEqual([creature.stage, creature.name, creature.locksStage, creature.endsCurseWhenSlain], [3, 'Shadow', true, true]);
    assert.match(creature.uuid, /pathfinder-monster-core\.Actor\.VotlWUsFKdOrHWF6$/);
    assert.equal(creature.note, "It can't create shadow spawn.");
    // (Pseudo Afflictions' list has no 8.6 spells: the stages in its terms, for the Effect the module makes — the last stage without a time.)
    assert.deepEqual(Object.entries(plan.resolution.afflictionHandoff.handlerStages).map(([stage, entry]) => [stage, entry.conditions.map(c => `${c.slug} ${c.value}`).join(), entry.duration.unit]),
        [['1', 'enfeebled 2', 'rounds'], ['2', 'enfeebled 3', 'rounds'], ['3', 'enfeebled 4', 'unlimited']]);
    const high = heightenedPlanAt(plan, 6).resolution.afflictionHandoff;
    assert.deepEqual([high.stageCreature.name, high.levelPatch], ['Greater Shadow', 11]);
    assert.equal(heightenedPlanAt(plan, 5).resolution.afflictionHandoff.stageCreature.name, 'Shadow');
    // Kept strict: the creature's stage worded otherwise isn't read, and narration about something the text never named stays residual.
    assert.equal(compile(withText(source, text => text.replace('hostile to the creature it was attached to', 'hostile to everyone'))).resolution.afflictionHandoff, undefined);
    assert.equal(inspectSavePlan(compile(withText(source, text => text.replace("The shadow's freedom is short lived.", "The moon's freedom is short lived.")))).supported, false);
});

test('Tenebrous Freedom: each row\'s conditions until the target Grapples against the spell DC, sustained, raised at the 8th', async () => {
    const source = await spell('rank-1/tenebrous-freedom');
    const plan = compile(source);
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.lifecycle.sustained, true);
    assert.deepEqual(plan.resolution.outcomes.criticalSuccess.effects, []);
    for (const degree of ['success', 'failure', 'criticalFailure']) {
        const effects = plan.resolution.outcomes[degree].effects;
        assert.deepEqual(effects.map(effect => [effect.slug, effect.value]), [['enfeebled', 2], ['clumsy', 2]]);
        assert.deepEqual(effects[0].endsWhen, [{event: 'escape', dc: 'spell', check: 'grapple'}]);
    }
    assert.deepEqual(heightenedPlanAt(plan, 8).resolution.outcomes.failure.effects.map(effect => effect.value), [3, 3]);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['detached-shadow']);
    assert.match(plan.resolution.reminders[0].text, /5 feet on a success, 10 on a failure or 15 on a critical failure/);
    assert.match(plan.resolution.dataNotes.join(' '), /doesn't mark this spell sustained/);
    // A Grapple ending only where the text says so: a plain Escape ending stays an Escape.
    const other = withText(source, text => text.replace('The shadow is otherwise intangible.', 'The shadow is otherwise solid.'));
    assert.notEqual(compile(other).compilerEvidence?.shadowDetach?.length, 9);
});

test('Control Currents: the current flowing away (a push) or toward the caster (a pull), farther from the 4th', async () => {
    const source = await spell('rank-1/control-currents');
    const plan = compile(source);
    assert.deepEqual(plan.resolution.lingeringModes.map(mode => mode.key), ['away', 'toward']);
    for (const mode of plan.resolution.lingeringModes) {
        assert.equal(isExecutableLingeringPlan(mode.plan), true, mode.key);
        assert.deepEqual(mode.plan.resolution.lingering.events, ['enter', 'turn-start']);
        assert.deepEqual(mode.plan.resolution.outcomes.success.forcedMovement ?? null, null);
        const move = mode.plan.resolution.outcomes.failure.forcedMovement;
        assert.deepEqual([move.kind, move.direction, move.distance, move.heightening.minRank, move.heightening.distance],
            mode.key === 'away' ? ['push', 'away', 10, 4, 20] : ['pull', 'toward', 10, 4, 20]);
    }
    assert.match(plan.resolution.dataNotes.join(' '), /from rank 2; the text says from the 4th/);
    assert.ok(plan.resolution.reminders.some(reminder => /body of water/.test(reminder.text)));
    assert.equal(compile(withText(source, text => text.replace('are moved 10 feet', 'are moved 10 feet up'))).resolution.lingeringModes, undefined);
});

test('Summon Instrument (PF2e 8.6 text): the instrument read from its own Effect\'s grants, the virtuoso one from the 5th', async () => {
    const source = await spell('cantrip/summon-instrument');
    const effect = JSON.parse(await readFile(new URL('spell-effects/spell-effect-summon-instrument.json', base), 'utf8'));
    const rules = effect.system.rules;
    const catalog = new Map([[effect.name, {id: effect._id, name: effect.name, type: effect.type, sourceFile: 'spell-effects/spell-effect-summon-instrument.json',
        automation: {ruleKeys: ['GrantItem'], requiresConfiguration: false, removesAfterRoll: false}, mechanics: {rules, duration: effect.system.duration, start: null}}]]);
    const plan = compile(source, catalog);
    assert.equal(plan.resolution.kind, 'conjured-item');
    const data = plan.resolution.conjuredItem;
    assert.equal(data.item.uuid, rules.find(rule => rule.predicate[0].lt).uuid);
    assert.deepEqual(data.steps.map(step => [step.minRank, step.uuid]), [[5, rules.find(rule => rule.predicate[0].gte).uuid]]);
    assert.deepEqual([data.held, data.replacesPrevious, data.seconds], [true, true, 3600]);
    // Without its Effect (nothing to read the items from), it isn't a conjured item.
    assert.notEqual(compile(source).resolution.kind, 'conjured-item');
});
