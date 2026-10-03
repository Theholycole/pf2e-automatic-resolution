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


// Rank 5, batch 67 (2026-10-03): Chromatic Wall (the color rolled at the cast rank; the crossing save of each color, its damage at the base and heightened
// rank; the borrowed spells; the reroll's save penalty).

test("Chromatic Wall: the colors", async () => {
    const plan = compile(await spell("rank-5/chromatic-wall"));
    assert.equal(plan.resolution.kind, "color-wall");
    const data = plan.resolution.colorWall;
    assert.deepEqual([data.seconds, data.highSeconds, data.lowDie, data.highDie, data.highFrom, data.extra], [600, 3600, 4, 8, 7, 10]);
    assert.deepEqual(data.colors.map(color => color.name), ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet"]);
    assert.deepEqual(data.reroll, { roll: 8, penalty: 2, type: "circumstance" });
    const green = data.colors[3];
    assert.equal(green.savePlan.resolution.sharedDamage.formula, "10[poison]");
    assert.equal(green.highPlan.resolution.sharedDamage.formula, "20[poison]");
    assert.equal(green.savePlan.resolution.check.statistic, "fortitude");
    assert.deepEqual(data.colors.slice(4, 6).map(color => color.borrowed.name), ["Petrify", "Warp Mind"]);
    assert.equal(data.colors[6].slowed.statistic, "will");
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/chromatic-wall"), html => html.replace("You can ignore the wall's effects.", "You can ignore the wall's effects and are quickened.")));
    assert.notEqual(other.resolution.kind, "color-wall");
});
