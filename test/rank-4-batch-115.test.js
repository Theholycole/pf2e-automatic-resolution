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


// Rank 4, batch 115 (2026-10-03): Bottle the Storm (resistance against the triggering effect only, the prevented damage stored; the Release a spell
// attack for that much; the fixed-rank resistances).

test("Bottle the Storm: the stored charge", async () => {
    const plan = compile(await spell("rank-4/bottle-the-storm"));
    assert.equal(plan.resolution.kind, "stored-charge");
    const data = plan.resolution.storedCharge;
    assert.deepEqual([data.type, data.seconds, data.range, data.immediateFrom], ["electricity", 60, 60, 7]);
    const { storedChargeResistance } = await import("../src/compiler/stored-burst.js");
    assert.deepEqual([4, 6, 7, 9, 10].map(rank => storedChargeResistance(data, rank)), [10, 10, 15, 15, 20]);
    // A different trigger type isn't read.
    const other = compile(withText(await spell("rank-4/bottle-the-storm"), html => html.replace("You would take electricity damage.", "You would take fire damage.")));
    assert.notEqual(other.resolution.kind, "stored-charge");
});
