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


// Rank 4, batch 124 (2026-10-03): Life's Fresh Bloom (the sustained area's turn start: the living on the ground heal and get PF2e's proved Speed Effect;
// undead and nindoru fiends save against Sickened; the dice and value by rank).

test("Life's Fresh Bloom: the bloom", async () => {
    const plan = compile(await spell("rank-4/lifes-fresh-bloom"));
    assert.equal(plan.resolution.kind, "bloom-area");
    const data = plan.resolution.bloom;
    assert.deepEqual([data.seconds, data.exempt, data.harmedFiend, data.statistic, data.condition.slug], [30, "nindoru", "nindoru", "fortitude", "sickened"]);
    const { bloomAt } = await import("../src/compiler/bloom-area.js");
    assert.deepEqual([4, 6, 7, 10].map(rank => [bloomAt(data, rank).heal, bloomAt(data, rank).value]), [["1d6", 1], ["1d6", 1], ["1d8", 2], ["1d10", 3]]);
    assert.match(data.effect.uuid, /Life's Fresh Bloom/);
    // A different Speed bonus isn't proved.
    const other = compile(withText(await spell("rank-4/lifes-fresh-bloom"), html => html.replace("+5-foot status bonus", "+10-foot status bonus")));
    assert.notEqual(other.resolution.kind, "bloom-area");
});
