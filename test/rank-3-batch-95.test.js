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


// Rank 3, batch 95 (2026-10-03): Whirling Scarves (the caster's Effect grants Concealed — only against attacks, and the ranged DC, are notes; the
// card's snag control gives the attacker the circumstance penalty with the Strike it picks, until the end of that turn or of its next).

test("Whirling Scarves: Concealed, the snag and its heightening", async () => {
    const plan = compile(await spell("rank-3/whirling-scarves"));
    assert.equal(plan.resolution.kind, "rule-set");
    const data = plan.resolution.ruleSet;
    assert.equal(data.recipient, "self");
    assert.equal(data.seconds, 60);
    assert.deepEqual(data.rules, [{ key: "GrantItem", uuid: "Compendium.pf2e.conditionitems.Item.DmAIPqOBomZ7H95W", inMemoryOnly: true }]);
    assert.deepEqual([data.snag.value, data.snag.type, data.snag.dc], [1, "circumstance", 6]);
    assert.deepEqual(data.snag.step, { interval: 2, penalty: 1, dc: 1 });
    const { snagAt } = await import("../src/compiler/rule-sets.js");
    assert.deepEqual(snagAt(data.snag, 5, 3), { value: 2, dc: 7 });
    // A snag that lasts some other time isn't read.
    const other = compile(withText(await spell("rank-3/whirling-scarves"), html => html.replace("until the end of its turn", "until the end of your turn")));
    assert.notEqual(other.resolution.kind, "rule-set");
});
