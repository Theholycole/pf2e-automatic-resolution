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


// Rank 3, batch 96 (2026-10-03): Sign of Conviction (the spell attack on the cast and on every Sustain — any number a turn — of the deity's type the
// caster picks; the caster's Effect, made with the first attack, gives +1 status to AC and saves and Immobilized, and ends when the caster moves).

test("Sign of Conviction: repeated attacks and the caster's Effect", async () => {
    const plan = compile(await spell("rank-3/sign-of-conviction"));
    assert.equal(plan.resolution.check.statistic, "spell-attack");
    assert.deepEqual(plan.resolution.casterChoice.values, ["fire", "spirit", "cold", "force"]);
    assert.equal(plan.resolution.repeatable.window, "sustain");
    assert.equal(plan.resolution.repeatable.perTurn, "any");
    assert.equal(plan.resolution.repeatable.attacks, 31);
    assert.match(plan.resolution.sharedDamage.formula, /^\(2\+floor\(\(@item\.rank - 3\)\/2\)\*1\)d10\[untyped\]$/);
    const effect = plan.resolution.castEffect;
    assert.deepEqual(effect.rules.map(rule => `${rule.key}:${rule.selector ?? rule.uuid}:${rule.value ?? ""}`),
        ["FlatModifier:ac:1", "FlatModifier:saving-throw:1", "GrantItem:Compendium.pf2e.conditionitems.Item.eIcWbB5o3pP6OIMe:"]);
    assert.equal(effect.endsAfterMovement, true);
    assert.equal(inspectSavePlan(plan).supported, true);
    // A bonus to something else isn't read.
    const other = compile(withText(await spell("rank-3/sign-of-conviction"), html => html.replace("bonus to AC and saving throws", "bonus to attack rolls")));
    assert.equal(other.resolution.castEffect, undefined);
});
