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


// Rank 4, batch 128 (2026-10-03): Wall of Mirrors (the GM's wall; a striker's basic Will save of the item's damage on the card's control; the sections'
// statistics at the cast rank and the concealment notes).

test("Wall of Mirrors: the striking creature's save", async () => {
    const plan = compile(await spell("rank-4/wall-of-mirrors"));
    assert.equal(plan.resolution.kind, "struck-wall");
    const data = plan.resolution.struckWall;
    assert.deepEqual([data.statistic, data.length, data.height, data.section], ["will", 50, 20, { feet: 10, ac: 10, hardness: 10, hp: 40, step: { interval: 1, add: 10 } }]);
    assert.equal(supported(data.strikePlan), true);
    assert.equal(data.strikePlan.resolution.check.basic, true);
    // Different damage isn't read.
    const other = compile(withText(await spell("rank-4/wall-of-mirrors"), html => html.replace("takes 4d4 mental damage", "takes 4d6 mental damage")));
    assert.notEqual(other.resolution.kind, "struck-wall");
});
