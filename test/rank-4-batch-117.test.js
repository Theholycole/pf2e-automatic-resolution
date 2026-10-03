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


// Rank 4, batch 117 (2026-10-03): Variable Gravity (the gravity picked on the card, switched with an action; high gravity's Encumbered and +2 to saves
// and the DCs forced movement targets; low gravity's notes; an hour from 6th).

test("Variable Gravity: the gravities", async () => {
    const plan = compile(await spell("rank-4/variable-gravity"));
    assert.equal(plan.resolution.kind, "rule-set");
    const data = plan.resolution.ruleSet;
    assert.deepEqual(data.choice.options.map(option => [option.key, option.rules.length]), [["low", 0], ["normal", 0], ["high", 4]]);
    assert.deepEqual(data.secondsByRank, [{ rank: 6, seconds: 3600 }]);
    const { ruleSetRules } = await import("../src/compiler/rule-sets.js");
    const high = ruleSetRules({ ...data, chosen: data.choice.options[2] }, 4, 4);
    assert.deepEqual(high.filter(rule => rule.key === "FlatModifier").map(rule => [rule.selector, rule.value]), [["saving-throw", 2], ["fortitude-dc", 2], ["reflex-dc", 2]]);
    assert.match(data.choice.options[0].notes.join(" "), /jump double/);
    // A different bonus isn't read.
    const other = compile(withText(await spell("rank-4/variable-gravity"), html => html.replace("+2 status bonus", "+3 status bonus to attack rolls and")));
    assert.notEqual(other.resolution.ruleSet?.choice?.options?.length, 3);
});
