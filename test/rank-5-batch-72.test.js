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


// Rank 5, batch 72 (2026-10-03): Moon Frenzy (PF2e's Effect proved at every rank; its land Speed bonus made every Speed's; the attacks' dice written at the
// cast rank; the card's Will save to end it).

test("Moon Frenzy: the frenzy", async () => {
    const plan = compile(await spell("rank-5/moon-frenzy"));
    assert.equal(plan.resolution.kind, "frenzy");
    const data = plan.resolution.frenzy;
    assert.deepEqual([data.seconds, data.maxTargets, data.end.statistic, data.end.trait], [60, 5, "will", "rage"]);
    assert.equal(data.ruleOverrides[0].patch.selector, "all-speeds");
    assert.deepEqual(data.strikes.dice, [{ rank: 0, dice: 2 }, { rank: 6, dice: 3 }, { rank: 10, dice: 4 }]);
    assert.equal(data.strikes.indexes.length, 2);
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/moon-frenzy"), html => html.replace("and weakness 5 to silver.", "and weakness 5 to silver and cold iron.")));
    assert.notEqual(other.resolution.kind, "frenzy");
});
