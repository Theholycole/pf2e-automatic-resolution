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



// Rank 2, batch 16 (2026-09-30): rank 1 spells heightened — fixed-rank entries that rewrite the rows as heightened variants (Sleep, Zenith
// Star, Mushroom Patch, Divine Plagues), a note's heightened counteract rolled from its card (Putrefy Food and Drink), Interposing Earth's
// 4th-rank barrier.

test('Sleep at 4th: Unconscious for 1 round / 1 minute, Prone, and the no-waking note', async () => {
    const {inspectSavePlan, heightenedPlanAt} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/sleep'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(plan.resolution.rankGate, undefined);
    const at4 = heightenedPlanAt(plan, 4);
    const row = degree => at4.resolution.outcomes[degree].effects.map(effect => [effect.slug, effect.duration ? `${effect.duration.value} ${effect.duration.unit}` : null]);
    assert.deepEqual(row('failure'), [['unconscious', '1 rounds'], ['prone', null]]);
    assert.deepEqual(row('criticalFailure'), [['unconscious', '1 minutes'], ['prone', null]]);
    assert.match(at4.resolution.outcomes.failure.noteEffects[0].text, /can't attempt Perception checks to wake up\. When the duration ends, the creature is sleeping normally/);
    // Below 4th, the base rows.
    assert.equal(heightenedPlanAt(plan, 3), plan);
});

test('Zenith Star at 4th, Mushroom Patch at 9th, Divine Plagues at 5th', async () => {
    const {heightenedPlanAt, isExecutableLingeringPlan, inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const zenith = compile(await spell('rank-1/zenith-star'));
    assert.match(heightenedPlanAt(zenith, 4).resolution.outcomes.criticalFailure.noteEffects[0].text, /You ignore the Concealed condition against targets marked by zenith star\.$/);
    const patch = compile(await spell('rank-1/mushroom-patch'));
    assert.equal(isExecutableLingeringPlan(patch), true);
    assert.deepEqual(heightenedPlanAt(patch, 9).resolution.outcomes.failure.effects.map(effect => effect.slug), ['blinded']);
    assert.deepEqual(heightenedPlanAt(patch, 8).resolution.outcomes.failure.effects.map(effect => effect.slug), ['dazzled']);
    const plagues = compile(await spell('rank-1/divine-plagues'));
    assert.equal(inspectSavePlan(plagues).supported, true);
    const at5 = heightenedPlanAt(plagues, 5).resolution.afflictionHandoff;
    assert.deepEqual(at5.traits, ['disease', 'virulent']);
    assert.match(at5.stages[1].text, /Slowed 1\} and clumsy 2, enfeebled 2, or stupefied 2/);
    assert.equal(heightenedPlanAt(plagues, 4).resolution.afflictionHandoff.traits.includes('virulent'), false);
});

test('Putrefy Food and Drink: the heightened counteracts; Interposing Earth: the 4th-rank barrier', async () => {
    const putrefy = compile(await spell('rank-1/putrefy-food-and-drink'));
    assert.deepEqual(putrefy.resolution.note.heightenedCounteract.map(entry => entry.rank), [2, 3]);
    const earth = compile(await spell('rank-1/interposing-earth'));
    assert.deepEqual(earth.resolution.interposingCover.raised, {rank: 4, reduction: 8, hardness: 8, hp: 20});
});
