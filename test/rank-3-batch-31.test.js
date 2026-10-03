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

import {damagingWallAt} from '../src/compiler/damaging-wall.js';

// Rank 3, batch 31 (2026-10-02): Wall of Virtue — a damaging wall with two damage types (1d8 spirit and 1d8 vitality, +1d8 each per 2 ranks),
// its light a note and its counteract against magical darkness the card's button.

test('Wall of Virtue: both damage types in one roll at the cast rank, the darkness counteract', async () => {
    const plan = compile(await spell('rank-3/wall-of-virtue'));
    assert.equal(plan.resolution.kind, 'damaging-wall');
    assert.equal(plan.automation.level, 'automatic');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.equal(damagingWallAt(plan.resolution.damagingWall, 3).formula, '{1d8[spirit],1d8[vitality]}');
    assert.equal(damagingWallAt(plan.resolution.damagingWall, 5).formula, '{2d8[spirit],2d8[vitality]}');
    assert.equal(plan.resolution.damagingWall.counteract.target, 'magical darkness');
    // A step for only one type is refused.
    assert.notEqual(compile(withText(await spell('rank-3/wall-of-virtue'), html => html.replace(', and the vitality damage increases by 1d8', ''))).resolution.kind, 'damaging-wall');
});
