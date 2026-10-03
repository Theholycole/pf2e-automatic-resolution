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

import {hazardFormulaAt} from '../src/compiler/hazard-area.js';

// Rank 4, batch 16 (2026-10-02): Spike Stones — difficult (and hazardous) terrain for 1 hour; 3 piercing damage for each square a creature
// moving on the ground enters (+1 a rank), the GM's per-square control.

test('Spike Stones: terrain, the flat per-square damage at the cast rank', async () => {
    const plan = compile(await spell('rank-4/spike-stones'));
    assert.equal(plan.resolution.kind, 'hazard-area');
    assert.equal(plan.automation.level, 'automatic');
    const area = plan.resolution.hazardArea;
    assert.deepEqual([area.terrain, area.durationSeconds, area.control.enemiesOnly], [true, 3600, false]);
    assert.deepEqual([hazardFormulaAt(area, 4), hazardFormulaAt(area, 6)], ['3[piercing]', '5[piercing]']);
    // Another amount than the item's is refused.
    assert.notEqual(compile(withText(await spell('rank-4/spike-stones'), html => html.replace('takes 3 piercing', 'takes 4 piercing'))).resolution.kind, 'hazard-area');
});
