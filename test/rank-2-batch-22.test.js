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



// Rank 2, batch 22 (2026-09-30): initial and persistent damage by row with PF2e's fixed heightening levels and a Strike penalty lasting
// while the persistent damage does (Teeth to Terror); a cast-time basic save leaving terrain, Prone on a critical failure (Rime Slick);
// a target saving again on each Sustain, whose critical success stuns the caster and ends the spell (Mind Games).

test('Teeth to Terror: rows, fixed heightening levels read as (+2), and the jaws/teeth Strike penalty while persistent', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {validNoteEffect} = await import('../scripts/note-effects.js');
    const plan = compile(await spell('rank-2/teeth-to-terror'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    const [initial, persistent] = plan.resolution.sharedDamage.components.map(component => component.id);
    assert.deepEqual([success.damage.multiplier, success.damage.sourceComponentIds, success.noteEffects ?? []], [0.5, [initial], []]);
    // The critical failure is full damage, as the text says.
    assert.deepEqual([criticalFailure.damage.multiplier, criticalFailure.damage.sourceComponentIds], [1, [initial, persistent]]);
    const note = failure.noteEffects[0];
    assert.equal(note.whilePersistent, 'mental');
    assert.deepEqual(note.rules, [{key: 'FlatModifier', selector: 'strike-attack-roll', type: 'circumstance', value: -1, predicate: [{or: ['item:slug:jaws', 'item:slug:teeth']}]}]);
    assert.ok(validNoteEffect(note));
    assert.equal(validNoteEffect({...note, duration: {mode: 'fixed', value: 1, unit: 'minutes'}}), false);
    // On a row without the persistent damage, the note is refused.
    const moved = structuredClone(plan); moved.resolution.outcomes.success.noteEffects = [structuredClone(note)];
    assert.equal(inspectSavePlan(moved).supported, false);
});

test('Teeth to Terror: a fixed level that is not the text\'s step stays unproven', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-2/teeth-to-terror');
    const changed = structuredClone(source);
    const level = changed.system.heightening.levels['6'].damage;
    level[Object.keys(level).find(id => level[id].category === 'persistent')].formula = '4d4';
    assert.equal(inspectSavePlan(compile(changed)).supported, false);
});

test('Rime Slick: a cast-time area save, icy terrain, the object notes, and Prone on a critical failure', async () => {
    const {isExecutableLingeringPlan, lingeringExposurePlan, inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/rime-slick'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.terrain.movement], [[], true, ['walk']]);
    assert.equal(lingering.notes.length, 2);
    const exposure = lingeringExposurePlan(plan);
    assert.equal(inspectSavePlan(exposure).supported, true);
    assert.deepEqual(exposure.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['prone']);
    assert.deepEqual(exposure.resolution.outcomes.failure.effects, []);
});

test('Mind Games: a save when cast and on each Sustain; the critical success is the caster\'s Stunned 1 and the spell ends', async () => {
    const {isExecutableLingeringPlan, isCasterConditionEnd} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/mind-games'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.centre, plan.resolution.lingering.initial], [['sustain'], 'targets', true]);
    const critical = plan.resolution.outcomes.criticalSuccess;
    assert.equal(isCasterConditionEnd(critical), true);
    assert.equal(isCasterConditionEnd({...critical, casterConditions: [{...critical.casterConditions[0], value: 2}]}), false);
    assert.equal(isCasterConditionEnd({...critical, endsSpell: false}), false);
});
