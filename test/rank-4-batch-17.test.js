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


// Rank 4, batch 17 (2026-10-02): tapped healing on the food route's card — Vital Beacon (four taps: the rank's d10s, d8s, d6s, d4s; its rule-less
// marker Effect replaced by the card), Healing Well (rank 5: five taps of the item's 4d8, +3 a rank).

test('Vital Beacon: four taps with weakening dice, then the spell ends', async () => {
    const plan = compile(await spell('rank-4/vital-beacon'));
    assert.equal(plan.automation.level, 'automatic');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const food = plan.resolution.healing.food;
    assert.deepEqual([food.verb, food.pieces.base, food.sequence.map(formula => /d(\d+)/.exec(formula)[1])], ['tap', 4, ['10', '8', '6', '4']]);
    // Without the end after the fourth, it isn't read.
    assert.equal(compile(withText(await spell('rank-4/vital-beacon'), html => html.replace(', after which the spell ends', ''))).resolution.healing?.food?.sequence ?? null, null);
});

test('Healing Well: five taps of the item\'s healing', async () => {
    const plan = compile(await spell('rank-5/healing-well'));
    assert.equal(plan.automation.level, 'automatic');
    assert.deepEqual([plan.resolution.healing.food.verb, plan.resolution.healing.food.pieces.base, plan.resolution.healing.formula], ['tap', 5, '4d8']);
    assert.notEqual(compile(withText(await spell('rank-5/healing-well'), html => html.replace('tapped five times', 'tapped often'))).resolution.healing?.food?.verb, 'tap');
});
