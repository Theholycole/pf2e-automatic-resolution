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


// Rank 8, batch 19 (2026-10-05): feature group 11 — triggers (trigger-cards.js, scripts/trigger-runtime.js): Bound in Death, Love's Sacrifice, Blinding
// Fury, Divinity Leech, Mimic Spell, Touch of Death, Unblinking Flame Emblem.
import { inspectIncarnatePlan, isExecutableSavePlan } from '../scripts/basic-save-core.js';

const phasesOf = plan => Object.fromEntries(plan.resolution.incarnate.phases.map(phase => [phase.key, phase]));
const card = async path => { const plan = compile(await spell(path)); assert.equal(plan.resolution.kind, "incarnate", path); assert.deepEqual(inspectIncarnatePlan(plan), [], path); return plan; };

test("Bound in Death and Love's Sacrifice: the life link (its leash, its round without damage, the Sustain's self-damage by rank); the sacrifice", async () => {
    const bound = await card("rank-6/bound-in-death");
    const parts = phasesOf(bound);
    assert.deepEqual([parts.link.kind, parts.link.range, parts.link.immunityRounds, parts.self.self, parts.self.formula], ["link", 120, 1, true, "(6 + 3 * floor((@item.rank - 6) / 2))d8"]);
    assert.deepEqual(bound.resolution.incarnate.lasting, { seconds: 60, sustained: true });
    const love = phasesOf(await card("rank-7/loves-sacrifice"));
    assert.deepEqual([love.sacrifice.kind, love.sacrifice.statistic], ["sacrifice", "will"]);
});

test("Blinding Fury and Divinity Leech: the fury's Hidden and its minute; the leech's save (Fatigued), its heal and its stunning rows", async () => {
    const fury = phasesOf(await card("rank-6/blinding-fury")).fury;
    assert.deepEqual([fury.hidden.slug, fury.minutes], ["hidden", 1]);
    const leech = await card("rank-9/divinity-leech");
    const parts = phasesOf(leech);
    assert.ok(parts.disrupt.leechTargets && isExecutableSavePlan(parts.disrupt.plan));
    assert.deepEqual(parts.disrupt.plan.resolution.outcomes.failure.effects.map(effect => effect.slug), ["fatigued"]);
    assert.deepEqual([parts.leech.tradition, parts.leech.heal, parts.leech.stunned.value, parts.leech.stunned.criticalRounds], ["divine", "6d6", 1, 1]);
});

test("Mimic Spell, Touch of Death and Unblinking Flame Emblem: the counteract and its minute; the mark, the word's rows; the emblem's dice by rank", async () => {
    const mimic = await card("rank-8/mimic-spell");
    assert.deepEqual([phasesOf(mimic).mimic.sustainMinutes, mimic.resolution.incarnate.lasting.sustained], [1, true]);
    const touch = await card("rank-8/touch-of-death");
    const word = phasesOf(touch).word;
    assert.deepEqual([word.success.value, word.success.perRank, word.failure.value, word.failure.perRank, word.immuneHours, word.traits], [1, 5, 3, 10, 24, ["auditory", "concentrate"]]);
    assert.ok(touch.resolution.incarnate.replaces);
    const emblem = await card("rank-7/unblinking-flame-emblem");
    const part = phasesOf(emblem).emblem;
    assert.deepEqual([part.bonus, part.die, part.critDie, part.heightened, part.rounds], [1, 6, 10, { minRank: 9, die: 8, critDie: 12 }, 3]);
    assert.deepEqual(emblem.resolution.incarnate.lasting, { seconds: 18, sustained: false });
});
