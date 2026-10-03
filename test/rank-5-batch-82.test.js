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


// Rank 5, batch 82 (2026-10-03): Blink Charge (the teleport and the Strike with PF2e's force dice, proved at both ranks; the failure's and critical failure's force;
// the range and the force by rank).

test("Blink Charge: the charge", async () => {
    const { blinkStrikeAt } = await import("../src/compiler/blink-strike.js");
    const plan = compile(await spell("rank-5/blink-charge"));
    assert.equal(plan.resolution.kind, "blink-strike");
    const data = plan.resolution.blinkStrike;
    assert.deepEqual([data.range, data.rangeStep, data.interval, data.push], [60, 60, 2, 5]);
    assert.deepEqual(blinkStrikeAt(data, 5, 5), { range: 60, failure: "1d8", criticalFailure: "1d8" });
    assert.deepEqual(blinkStrikeAt(data, 7, 5), { range: 120, failure: "2d8", criticalFailure: "2d8" });
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/blink-charge"), html => html.replace("The Strike deals full damage.", "The Strike deals full damage and the target is slowed.")));
    assert.notEqual(other.resolution.kind, "blink-strike");
});
