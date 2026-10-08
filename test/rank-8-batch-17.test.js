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


// Rank 8, batch 17 (2026-10-05): the end of feature group 7 — Heaving Earth, Earth and Sky, Deluge, Amalgamizing Leap (teleport-spells.js).

test("Heaving Earth: the explosion's basic save with its push and Prone (a second target at 9th); the tremors' save on the card", async () => {
    const plan = compile(await spell("rank-7/heaving-earth"));
    assert.equal(supported(plan), true);
    assert.deepEqual([plan.resolution.outcomes.failure.forcedMovement.distance, plan.resolution.outcomes.failure.effects.map(effect => effect.slug)], [10, ["prone"]]);
    const tremors = plan.resolution.controls.parts[0];
    assert.deepEqual([tremors.key, tremors.plan.resolution.check.basic, tremors.plan.resolution.outcomes.failure.forcedMovement.distance], ["tremors", false, 10]);
    assert.ok(plan.resolution.reminders.some(reminder => /one more target/.test(reminder.text)));
});

test("Earth and Sky: PF2e's falling damage on the rows (50, doubled on a critical failure) and Prone; the caster's 100-foot rise", async () => {
    const plan = compile(await spell("rank-6/earth-and-sky"));
    assert.equal(supported(plan), true);
    assert.equal(plan.resolution.sharedDamage.formula, "(50)[bludgeoning]");
    assert.deepEqual(["success", "failure", "criticalFailure"].map(degree => plan.resolution.outcomes[degree].damage.multiplier), [1, 1, 2]);
    assert.deepEqual([plan.resolution.controls.parts[0].kind, plan.resolution.controls.parts[0].feet], ["elevate", 100]);
});

test("Deluge: the push from the burst's centre on a failure; the card's descent of 50 feet, 10 more each rank", async () => {
    const plan = compile(await spell("rank-8/deluge"));
    assert.equal(supported(plan), true);
    assert.deepEqual([plan.resolution.outcomes.failure.forcedMovement.direction, plan.resolution.outcomes.failure.forcedMovement.distance], ["from-center", 50]);
    const descend = plan.resolution.controls.parts[0];
    assert.deepEqual([descend.kind, descend.feet, descend.baseRank, descend.stepFeet], ["descend", 50, 8, 10]);
});

test("Amalgamizing Leap: Enfeebled 1 and Sickened 1 by row; the card's leap within 60 feet, the success's 20 temporary Hit Points, the fusion's 40 and +5 reach", async () => {
    const plan = compile(await spell("rank-8/amalgamizing-leap"));
    assert.equal(supported(plan), true);
    assert.deepEqual([plan.resolution.outcomes.success.effects[0].slug, plan.resolution.outcomes.criticalFailure.effects[0].slug], ["enfeebled", "sickened"]);
    const parts = Object.fromEntries(plan.resolution.controls.parts.map(part => [part.key, part]));
    assert.deepEqual([parts.leap.within, parts.piece.tempHp.base, parts.fuse.tempHP, parts.fuse.reach], [60, 20, 40, 5]);
    const forged = structuredClone(plan); forged.resolution.controls.parts[2].reach = "far";
    assert.equal(supported(forged), false);
});
