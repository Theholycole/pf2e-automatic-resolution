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


// Rank 4, batch 132 (2026-10-03): Chromatic Ray (the spell attack; the color rolled at the rank: damage, the green's and violet's saves, the borrowed spells,
// the intense color's condition and another color).

test("Chromatic Ray: the colors", async () => {
    const plan = compile(await spell("rank-4/chromatic-ray"));
    assert.equal(plan.resolution.kind, "color-ray");
    const data = plan.resolution.colorRay;
    assert.deepEqual([data.lowDie, data.highDie, data.highFrom, data.raise], [4, 8, 6, 10]);
    assert.deepEqual(data.colors.map(color => color.name), ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet", "Intense Color"]);
    assert.deepEqual(data.colors.slice(0, 4).map(color => color.damage.amount), [30, 40, 50, 25]);
    for (const color of data.colors.filter(entry => entry.savePlan)) assert.equal(supported(color.savePlan), true, color.name);
    assert.equal(data.colors[6].savePlan.resolution.outcomes.failure.forcedMovement.distance, 120);
    assert.deepEqual([data.colors[4].borrowed.name, data.colors[5].borrowed.name, data.colors[5].critical.name], ["Petrify", "Confusion", "Warp Mind"]);
    // A different raise isn't read.
    const other = compile(withText(await spell("rank-4/chromatic-ray"), html => html.replace("each increase by 10", "each increase by 20")));
    assert.notEqual(other.resolution.kind, "color-ray");
});
