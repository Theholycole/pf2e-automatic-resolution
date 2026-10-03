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


// Rank 3, batch 106 (2026-10-03): Bone Flense (both of PF2e's Effects on the wielder with the weapon picked; the bleed dice made persistent and put on a
// skeleton toggle; Erupting Spurs granted).

test("Bone Flense: the imbued weapon", async () => {
    const plan = compile(await spell("rank-3/bone-flense"));
    assert.equal(plan.resolution.kind, "weapon-imbue");
    const data = plan.resolution.weaponImbue;
    assert.equal(data.effects.length, 2);
    assert.deepEqual(data.effects[0].ruleOverrides, [{ index: 1, key: "DamageDice", patch: { category: "persistent" } }]);
    assert.equal(data.effects[0].ruleAdditions[0].option, "bone-flense");
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    // Spurs damage that differs from PF2e's isn't read.
    const other = compile(withText(await spell("rank-3/bone-flense"), html => html.replace("Erupting Spurs increases by 4d6", "Erupting Spurs increases by 3d6")));
    assert.notEqual(other.resolution.kind, "weapon-imbue");
});
