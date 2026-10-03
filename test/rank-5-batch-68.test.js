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


// Rank 5, batch 68 (2026-10-03): Cloak of Colors (the adjacent creatures Dazzled; a melee hitter's Will save of the stated results, then immune until the end
// of its turn — PF2e's 0 rounds to the end of the turn).

test("Cloak of Colors: the flash", async () => {
    const plan = compile(await spell("rank-5/cloak-of-colors"));
    assert.equal(plan.resolution.kind, "flash-cloak");
    const data = plan.resolution.flashCloak;
    assert.deepEqual([data.seconds, data.radius, data.adjacent.name, data.statistic, data.trait], [60, 5, "Dazzled", "will", "incapacitation"]);
    assert.deepEqual([data.rows.failure.name, data.rows.criticalFailure.name, data.rows.success], ["Blinded", "Stunned", null]);
    assert.deepEqual(data.attackerPlan.resolution.temporaryImmunity.duration, { value: 0, unit: "rounds", expiry: "turn-end" });
    assert.ok(supported(data.attackerPlan));
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/cloak-of-colors"), html => html.replace("causes a brilliant flash of light.", "causes a brilliant flash of light and deafens it.")));
    assert.notEqual(other.resolution.kind, "flash-cloak");
});
