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


// Rank 7, batch 16 (2026-10-05): feature group 3, part 1 — areas whose save each creature makes once per casting (Infinitesimal Collapse Field,
// Repulsion) and Indolent Haze's lingering rows.
import { isExecutableLingeringPlan } from "../scripts/basic-save-core.js";

test("Infinitesimal Collapse Field: an enemies-only emanation, each row's conditions held while inside", async () => {
    const plan = compile(await spell("rank-7/infinitesimal-collapse-field"));
    assert.equal(plan.resolution.kind, "lantern-aura");
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const aura = plan.resolution.lanternAura;
    assert.deepEqual([aura.radius, aura.sustained, aura.enemiesOnly, aura.light, aura.statistic], [30, true, true, null, "fortitude"]);
    assert.deepEqual(Object.keys(aura.rows), ["success", "failure", "criticalFailure"]);
    assert.deepEqual(aura.rows.failure.conditions.map(c => [c.slug, c.value]), [["encumbered", null], ["slowed", 1]]);
    assert.deepEqual(aura.rows.criticalFailure.notes, ["It can't take reactions."]);
    // (A row the text doesn't support leaves the spell to the other routes.)
    const changed = compile(withText(await spell("rank-7/infinitesimal-collapse-field"), html => html.replace("and cannot take reactions", "and cannot take free actions")));
    assert.notEqual(changed.resolution.kind, "lantern-aura");
});

test("Repulsion: a radius of up to 40 feet, every creature saves once, the rows as notes", async () => {
    const plan = compile(await spell("rank-6/repulsion"));
    assert.equal(plan.resolution.kind, "lantern-aura");
    const aura = plan.resolution.lanternAura;
    assert.deepEqual([aura.radius, aura.radiusUpTo, aura.sustained, aura.enemiesOnly, aura.statistic], [40, 40, false, false, "will"]);
    assert.deepEqual(Object.keys(aura.rows), ["success", "failure", "criticalFailure"]);
    assert.deepEqual(aura.rows.criticalFailure.notes, aura.rows.failure.notes);
    assert.ok(/difficult terrain when moving closer/.test(aura.rows.success.notes[0]) && /of its own accord/.test(aura.rows.failure.notes[0]));
});

test("Indolent Haze: lingering exposures when cast and at turn end, Prone (Unconscious if already prone), sleepers' damage", async () => {
    const plan = compile(await spell("rank-7/indolent-haze"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.initial, lingering.events, lingering.dismissible], [true, ["turn-end"], true]);
    assert.deepEqual([lingering.sleeperDamage.dice, lingering.sleeperDamage.faces, lingering.sleeperDamage.type, lingering.sleeperDamage.step, lingering.sleeperDamage.baseRank],
        [6, 4, "spirit", { interval: 1, dice: 2 }, 7]);
    for (const degree of ["success", "failure"]) assert.equal(plan.resolution.outcomes[degree].effects.find(e => e.slug === "prone").insteadIfHeld.slug, "unconscious");
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => e.slug), ["prone", "unconscious"]);
    assert.equal(plan.resolution.outcomes.failure.noteEffects.at(-1).duration.offset, 1);
    // (The validator refuses a sleeper damage the text doesn't state.)
    const forged = structuredClone(plan); forged.resolution.lingering.sleeperDamage.slug = "prone";
    assert.equal(isExecutableLingeringPlan(forged), false);
});
