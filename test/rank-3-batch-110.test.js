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


// Rank 3, batch 110 (2026-10-03): Primal Chorus (the rule-set family: the caster's Effect for a day — a toggle for an encounter with an enemy that replied,
// the status bonus to that initiative roll, used up by it; the GM's Will saves and the Coerce communication notes).

test("Primal Chorus: the initiative bonus and its heightening", async () => {
    const plan = compile(await spell("rank-3/primal-chorus"));
    assert.equal(plan.resolution.kind, "rule-set");
    const data = plan.resolution.ruleSet;
    assert.equal(data.seconds, 86400);
    assert.deepEqual(data.rules, [{ key: "FlatModifier", selector: "initiative", type: "status", value: 1, predicate: ["primal-chorus-reply"] }]);
    assert.deepEqual(data.rankRules.map(entry => [entry.minRank, entry.rules[0].value]), [[5, 2], [7, 3], [9, 4]]);
    assert.deepEqual(data.consumeOn, { on: "check-with-option", option: "primal-chorus-reply" });
    // A bonus to another roll isn't read.
    const other = compile(withText(await spell("rank-3/primal-chorus"), html => html.replace("your next Initiative roll", "your next attack roll")));
    assert.notEqual(other.resolution.kind, "rule-set");
});
