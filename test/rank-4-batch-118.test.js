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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 4, batch 118 (2026-10-03): Chromatic Armor (the rolled colors' resistances at the cast rank and the light; the adjacent attacker's Will save,
// Dazzled until the end of its next turn, then temporarily immune until the end of its next turn).

test("Chromatic Armor: the colors and the attacker's save", async () => {
    const plan = compile(await spell("rank-4/chromatic-armor"));
    assert.equal(plan.resolution.kind, "color-armor");
    const data = plan.resolution.colorArmor;
    assert.deepEqual(data.colors.map(color => color.type), ["fire", "acid", "electricity", "poison", "sonic", "mental", "force"]);
    assert.deepEqual([data.rolls, data.light], [{ two: 2, three: 3 }, { bright: 20, dim: 40 }]);
    const { colorArmorResistance } = await import("../src/compiler/color-armor.js");
    assert.deepEqual([4, 6, 7, 10].map(rank => colorArmorResistance(data, rank, 4)), [5, 5, 10, 15]);
    assert.equal(supported(data.attackerPlan), true);
    assert.deepEqual(data.attackerPlan.resolution.temporaryImmunity.duration, { value: 1, unit: "rounds", expiry: "turn-end" });
    // An immunity of another length isn't supported for this route.
    const broken = structuredClone(data.attackerPlan); broken.resolution.temporaryImmunity.sourceText = "other";
    assert.equal(supported(broken), false);
});
