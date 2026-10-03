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


// Rank 4, batch 109 (2026-10-03): Spiritual Attunement (the plane picked on the card: remastered holy/unholy on the Strikes, resistance to the
// opposed one, +5 per 2 ranks; the Boneyard resists vitality and void).

test("Spiritual Attunement: the planes", async () => {
    const plan = compile(await spell("rank-4/spiritual-attunement"));
    assert.equal(plan.resolution.kind, "rule-set");
    const data = plan.resolution.ruleSet;
    assert.equal(data.choice.options.length, 9);
    const { ruleSetRules } = await import("../src/compiler/rule-sets.js");
    const at = (key, rank) => ruleSetRules({ ...data, chosen: data.choice.options.find(option => option.key === key) }, rank, 4);
    assert.deepEqual(at("heaven", 6).map(rule => [rule.key, rule.value, rule.type ?? null]), [["AdjustStrike", "holy", null], ["Resistance", 10, "unholy"]]);
    assert.deepEqual(at("abyss", 5).map(rule => [rule.key, rule.value, rule.type ?? null]), [["AdjustStrike", "unholy", null], ["Resistance", 5, "holy"]]);
    assert.deepEqual(at("boneyard", 4).map(rule => rule.type), ["vitality", "void"]);
    assert.deepEqual(at("axis", 4), []);
    assert.match(data.choice.options.find(option => option.key === "axis").notes.join(" "), /no lawful trait/);
    // A different resistance isn't read.
    const other = compile(withText(await spell("rank-4/spiritual-attunement"), html => html.replace("You gain resistance 5 to damage", "You gain resistance 5 and more to damage")));
    assert.notEqual(other.resolution.kind, "rule-set");
});
