import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 5, batch 10 (2026-10-02): incarnates — each phase (Arrive, Depart) compiled as its own save plan: Incarnate Faerie Revelers (two Will
// tables; Depart's misfortune rows carry PF2e's RollTwice), Incarnate Skeletal Giant (Arrive's Fortitude table; Depart's 6d6 basic Reflex on up
// to 2 targets), Incarnate Shadow Minuet (rank 4: Arrive's rows as full/double of the item's 4d6; Depart's darkness a note).

const phasesOf = plan => Object.fromEntries(plan.resolution.incarnate.phases.map(phase => [phase.key, phase]));

test('Incarnate Faerie Revelers: two executable phases; Depart\'s RollTwice notes', async () => {
    const plan = compile(await spell('rank-5/incarnate-faerie-revelers'));
    assert.equal(plan.resolution.kind, 'incarnate');
    const {arrive, depart} = phasesOf(plan);
    assert.equal(supported(arrive.plan), true);
    assert.equal(supported(depart.plan), true);
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => depart.plan.resolution.outcomes[degree].noteEffects[0].rules[0].removeAfterRoll ?? false), [true, false]);
});

test('Incarnate Skeletal Giant: Depart up to 2 targets, 6d6 basic Reflex', async () => {
    const {arrive, depart} = phasesOf(compile(await spell('rank-5/incarnate-skeletal-giant')));
    assert.equal(supported(arrive.plan), true);
    assert.equal(supported(depart.plan), true);
    assert.equal(depart.plan.resolution.check.basic, true);
    assert.match(depart.reminder, /up to 2 different creatures within 30 feet/);
});

test('Incarnate Shadow Minuet: Arrive full/double of 4d6; Depart a note', async () => {
    const {arrive, depart} = phasesOf(compile(await spell('rank-4/incarnate-shadow-minuet')));
    assert.equal(supported(arrive.plan), true);
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => arrive.plan.resolution.outcomes[degree].damage.multiplier), [1, 2]);
    assert.ok(depart.note && !depart.plan);
    // A row's damage that isn't the item's is refused.
    assert.notEqual(compile(withText(await spell('rank-4/incarnate-shadow-minuet'), html => html.replace('8d6[spirit]', '10d6[spirit]'))).resolution.kind, 'incarnate');
});
