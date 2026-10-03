import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}, ...(e.system?.badge ? {badge: e.system.badge} : {})}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
const effects = await catalog();
const compile = source => compileAbility(source, {nativeEffectCatalog: effects});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };



// Rank 2, batch 23 (2026-09-30): a turn-start area exposing only creatures not immune to a damage type, whose PF2e Effect chooses by
// result a Dazzled and a weakness of the caster's level until the start of the creature's next turn (Veil of Spirits).

test('Veil of Spirits: turn-start exposure, the immunity check, Dismiss, and the degree-choice Effect by row', async () => {
    const {isExecutableLingeringPlan, lingeringExposurePlan, inspectSavePlan, validateActorTarget} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/veil-of-spirits'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.notImmune, plan.resolution.lingering.dismissible], [['turn-start'], 'spirit', true]);
    assert.equal(plan.lifecycle.dismissal?.action, 'Dismiss');
    const constraints = plan.targeting.actorConstraints;
    const creature = immunities => ({type: 'npc', isOfType: type => type === 'creature', traits: new Set(), attributes: {immunities}});
    assert.equal(validateActorTarget(constraints, creature([])).eligible, true);
    assert.equal(validateActorTarget(constraints, creature([{type: 'spirit'}])).eligible, false);
    const exposure = lingeringExposurePlan(plan);
    assert.equal(inspectSavePlan(exposure).supported, true);
    const rule = degree => plan.resolution.outcomes[degree].nativeEffects[0].outcomeRule;
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => [rule(degree).selectionValue, rule(degree).durationAnchor, rule(degree).durationOffset]),
        [['success', 'target-turn', 1], ['failure', 'target-turn', 1], ['critical-failure', 'target-turn', 1]]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.nativeEffects[0].outcomeRule.inherited, {levelWeakness: 'spirit'});
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].noteEffects.map(note => note.label)), [['No spiritsense'], ['No spiritsense']]);
});

test('Veil of Spirits: a weakness the text and the Effect disagree on is refused', async () => {
    const {proveDegreeChoiceRow, degreeChoiceRules} = await import('../src/compiler/degree-choice-effect.js');
    const rules = [{key: 'ChoiceSet', rollOption: 'veil', choices: [{value: 'failure'}, {value: 'critical-failure'}]},
        {key: 'GrantItem', uuid: 'Compendium.pf2e.conditionitems.Item.TkIyaNPgTZFBCCuh', inMemoryOnly: true},
        {key: 'Weakness', predicate: ['veil:failure'], type: 'spirit', value: '@item.origin.level'}];
    const row = 'The creature is dazzled and gains a weakness to spirit damage equal to half your level until the beginning of its next turn.';
    assert.equal(proveDegreeChoiceRow(degreeChoiceRules(rules, 'failure').active, row), null);
    rules[2].value = '(@item.origin.level / 2)';
    assert.ok(proveDegreeChoiceRow(degreeChoiceRules(rules, 'failure').active, row));
});

test('Dismissing the spell by its own noun ("You can Dismiss the veil.")', async () => {
    const plan = compile(withText(await spell('rank-2/veil-of-spirits'), text => text.replace('You can Dismiss the veil.', 'You can Dismiss the curtain.')));
    assert.equal(plan.lifecycle.dismissal ?? null, null);
    assert.ok(plan.automation.pendingCapabilities.includes('dismissal'));
});
