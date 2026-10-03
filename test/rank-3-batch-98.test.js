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


// Rank 3, batch 98 (2026-10-03): Bonewall Bulwark (a Large token with the stated AC and Hit Points, no saves; the limbs' spell attack of the item's
// damage at the start of each of the caster's turns against a creature within 5 feet of it; the cover is a note).

test("Bonewall Bulwark: the conjured wall and its turn-start attack", async () => {
    const plan = compile(await spell("rank-3/bonewall-bulwark"));
    assert.equal(plan.resolution.check.statistic, "spell-attack");
    assert.deepEqual([plan.resolution.repeatable.window, plan.resolution.repeatable.trigger, plan.resolution.repeatable.onCast, plan.resolution.repeatable.attacks], ["sustain", "turn-start", false, 10]);
    const wall = plan.resolution.conjuredCreature;
    assert.deepEqual([wall.name, wall.size, wall.ac, wall.saves, wall.reach, wall.rangeFeet], ["bulwark", "lg", 10, "none", 5, 5]);
    assert.deepEqual(wall.hp, { base: 30, step: 10, interval: 1, baseRank: 3 });
    assert.equal(plan.resolution.casterChoice, undefined);
    assert.equal(inspectSavePlan(plan).supported, true);
    // A heightening that differs from PF2e's isn't read.
    const other = compile(withText(await spell("rank-3/bonewall-bulwark"), html => html.replace("increases by 1d10", "increases by 2d10")));
    assert.equal(other.resolution.conjuredCreature, undefined);
});
