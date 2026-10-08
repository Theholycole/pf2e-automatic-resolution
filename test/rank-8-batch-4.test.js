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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 8, batch 4 (2026-10-03): Confusing Colors, Vibrant Pattern.
import { isExecutableLingeringPlan } from "../scripts/basic-save-core.js";

test("Confusing Colors: the lingering cloud (Dazzled inside, the GM's Seek/Interact control, no new saves while confused or stunned); the critical failure's Stunned 1d4 rounds and the later Confused as a note", async () => {
    const plan = compile(await spell("rank-8/confusing-colors"));
    const lingering = plan.resolution.lingering;
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([lingering.events, lingering.initial, lingering.memberCondition.slug, lingering.skipWhile.slugs, lingering.notes.length], [["enter", "turn-end"], true, "dazzled", ["confused", "stunned"], 1]);
    const [stun] = plan.resolution.outcomes.criticalFailure.effects;
    assert.deepEqual([stun.slug, stun.duration.valueRoll, plan.resolution.outcomes.criticalFailure.effects.length], ["stunned", "1d4", 1]);
    assert.equal(plan.resolution.outcomes.criticalFailure.noteEffects[0].label, "Then Confused");
});

test("Vibrant Pattern: a failure is Blinded for 1 minute, with a save at the end of each turn once outside the pattern", async () => {
    const plan = compile(await spell("rank-6/vibrant-pattern"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const [blind] = plan.resolution.outcomes.failure.effects;
    assert.deepEqual([blind.slug, blind.duration.value, blind.duration.unit, blind.recurringSave.outsideArea, blind.recurringSave.statistic], ["blinded", 1, "minutes", true, "will"]);
    assert.equal(plan.resolution.lingering.skipWhile.slug, "blinded");
});
