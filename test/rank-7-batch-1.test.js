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


import {levelTierAt} from '../src/compiler/level-tiers.js';

// Rank 7, batch 1 (2026-10-03): Power Word Stun, Power Word Blind, Power Word Kill, Fatal Aria, Disappearance, Implosion, Suffocate.

test("Power Word Stun: tiers by level, shifted 2 per heightened rank; 10 minutes' immunity", async () => {
    const plan = compile(await spell("rank-8/power-word-stun"));
    const data = plan.resolution.levelTiers;
    assert.equal(plan.resolution.kind, "level-tiers");
    assert.equal(data.immunity.seconds, 600);
    assert.deepEqual(levelTierAt(data, 13, 8).outcome.rolled, { formula: "1d6", unit: "rounds" });
    assert.equal(levelTierAt(data, 16, 8).outcome.value, 1);
    assert.deepEqual(levelTierAt(data, 15, 9).outcome.rolled, { formula: "1d6", unit: "rounds" });
});

test("Power Word Blind: permanent, rolled minutes, then Dazzled", async () => {
    const data = compile(await spell("rank-7/power-word-blind")).resolution.levelTiers;
    assert.deepEqual(data.tiers.map(tier => [tier.outcome.name, !!tier.outcome.permanent]), [["Blinded", true], ["Blinded", false], ["Dazzled", false]]);
});

test("Power Word Kill and Fatal Aria: death, death or Dying, damage", async () => {
    const kill = compile(await spell("rank-9/power-word-kill")).resolution.levelTiers;
    assert.deepEqual(kill.tiers.map(tier => tier.outcome.kind), ["death", "death-or-dying", "damage-or-death"]);
    assert.equal(kill.tiers[1].outcome.stacks, true);
    assert.equal(levelTierAt(kill, 16, 10).outcome.kind, "death");
    const aria = compile(await spell("rank-10/fatal-aria")).resolution.levelTiers;
    assert.deepEqual([aria.immunity.seconds, aria.tiers[2].outcome.amount], [60, 50]);
});

test("Disappearance: the target Invisible", async () => {
    const plan = compile(await spell("rank-8/disappearance"));
    assert.deepEqual([plan.resolution.kind, plan.resolution.conditionNote.recipient, plan.resolution.conditionNote.condition.slug], ["condition-note", "target", "invisible"]);
});

test("Implosion: the button's basic save, distinct targets", async () => {
    const plan = compile(await spell("rank-9/implosion"));
    assert.equal(plan.resolution.kind, "repeat-save");
    assert.equal(plan.resolution.grantedActions[0].distinct, true);
    assert.ok(supported(plan.resolution.grantedActions[0].plan));
});

test("Suffocate: a breathing living target; Unconscious and the suffocation note", async () => {
    const plan = compile(await spell("rank-6/suffocate"));
    assert.ok(supported(plan));
    assert.deepEqual(plan.targeting.actorConstraints.predicates.map(predicate => predicate.kind), ["living-creature", "gm-confirmed"]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ["unconscious"]);
    assert.ok(["failure", "criticalFailure"].every(degree => plan.resolution.outcomes[degree].noteEffects.some(note => note.label === "Suffocation")));
});
