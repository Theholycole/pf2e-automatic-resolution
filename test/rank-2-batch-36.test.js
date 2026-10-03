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



// Rank 2, batch 36 (2026-10-01): Feast of Ashes, Phantasmal Treasure, Shadow Zombie.

test('Feast of Ashes: the daily damage by the GM\'s control, the fatigue for the spell, heightened per row', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/feast-of-ashes'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const trigger = degree => plan.resolution.outcomes[degree].noteEffects[0].triggeredDamage;
    assert.deepEqual([trigger('failure').trigger, trigger('failure').dice, trigger('failure').heightening], ['daily', 1, {interval: 1, dice: 1}]);
    assert.deepEqual([trigger('criticalFailure').dice, trigger('criticalFailure').heightening], [2, {interval: 1, dice: 2}]);
    assert.deepEqual(plan.resolution.outcomes.failure.noteEffects[0].duration.value, 7);
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(effect => effect.slug), ['fatigued']);
});

test('Phantasmal Treasure: Fascinated by row, the Disbelieve note on each affected row, the critical failure\'s focus', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {validNoteEffect} = await import('../scripts/note-effects.js');
    const source = await spell('rank-2/phantasmal-treasure');
    const plan = compile(source);
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].noteEffects.filter(note => note.disbelieve).length), [1, 1, 1]);
    assert.equal(plan.resolution.outcomes.criticalFailure.noteEffects.length, 2);
    assert.equal(plan.resolution.outcomes.success.effects[0].duration.expiry, 'turn-end');
    assert.equal(validNoteEffect({...plan.resolution.outcomes.failure.noteEffects[0], disbelieve: {statistic: 'will', endsSpell: true}}), false);
    assert.equal(compile(withText(source, html => html.replace('If the target disbelieves the illusion, the spell ends.', 'If the target disbelieves the illusion, it takes 2d6 damage.'))).compilerEvidence?.illusionDisbelief, undefined);
});

test('Shadow Zombie: a zombie of the level limit (by rank) becomes the caster\'s minion with the stated statistics', async () => {
    const {inspectSavePlan, validateActorTarget} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/shadow-zombie'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const [note] = plan.resolution.outcomes.failure.noteEffects;
    assert.equal(note.minionControl, true);
    assert.deepEqual(note.rules, [{key: 'Resistance', type: 'physical', value: 8}, {key: 'Immunity', type: 'precision'}, {key: 'BaseSpeed', selector: 'fly', value: 10}]);
    assert.equal(plan.resolution.outcomes.criticalFailure.noteEffects[0].duration.value, 10);
    const constraints = {...plan.targeting.actorConstraints};
    const zombie = level => ({uuid: 'A', type: 'npc', level, system: {traits: {value: ['undead', 'zombie']}}});
    assert.equal(validateActorTarget({...constraints, castRank: 2}, zombie(1)).eligible, true);
    assert.equal(validateActorTarget({...constraints, castRank: 2}, zombie(3)).eligible, false);
    assert.equal(validateActorTarget({...constraints, castRank: 4}, zombie(5)).eligible, true);
    assert.equal(validateActorTarget({...constraints, castRank: 4}, {uuid: 'B', type: 'npc', level: 1, system: {traits: {value: ['humanoid']}}}).eligible, false);
});
