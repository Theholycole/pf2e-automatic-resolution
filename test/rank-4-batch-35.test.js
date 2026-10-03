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


// Rank 4, batch 35 (2026-10-02): Dust Storm ("obscures vision, with the effect of Mist": Mist's concealment; damage as a creature enters or
// starts its turn inside, double for the water trait; the unbreathable air and liquid creatures are GM notes).

test("Dust Storm: Mist's concealment, the area's damage and the notes", async () => {
    const mist = await spell('rank-2/mist');
    const refs = new Map([[`Compendium.pf2e.spells-srd.Item.${mist._id}`, mist]]);
    const plan = compileAbility(await spell('rank-4/dust-storm'), {nativeEffectCatalog: effects, referencedSpells: refs});
    assert.equal(plan.resolution.kind, 'concealing-area');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const area = plan.resolution.concealingArea;
    assert.deepEqual(area.hazard, {count: 1, faces: 6, type: 'slashing', doubleTrait: 'water', step: {interval: 2, dice: 1}, baseRank: 4});
    assert.equal(area.notes.length, 2);
    // Without Mist's source the borrowed concealment isn't read.
    assert.notEqual(compile(await spell('rank-4/dust-storm')).resolution.kind, 'concealing-area');
    // Damage other than the item's is refused.
    const other = compileAbility(withText(await spell('rank-4/dust-storm'), html => html.replace('take 1d6 slashing damage', 'take 2d6 slashing damage')), {nativeEffectCatalog: effects, referencedSpells: refs});
    assert.notEqual(other.resolution.kind, 'concealing-area');
});
