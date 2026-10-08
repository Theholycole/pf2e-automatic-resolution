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


// Rank 7, batch 14 (2026-10-05): control (feature group 2a) — Puppet Strings' forced actions, Possession, Temporary Possession, Song of the Fallen.
import { inspectIncarnatePlan, inspectParts } from "../scripts/basic-save-core.js";

test("Puppet Strings: the rows' conditions, the end-of-turn Fortitude note, and the controls card's forced Strike (the type picked) and Stride", async () => {
    const plan = compile(await spell("rank-7/puppet-strings"));
    assert.ok(supported(plan));
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(effect => `${effect.slug}${effect.value}`).sort(), ["clumsy1", "slowed1"]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => `${effect.slug}${effect.value}`).sort(), ["clumsy1", "slowed2"]);
    assert.deepEqual(plan.resolution.outcomes.failure.noteEffects[0].recurringSave, {timing: "turn-end", mode: "end", statistic: "fortitude"});
    const [strike, stride] = plan.resolution.controls.parts;
    assert.deepEqual([strike.kind, strike.count, strike.plan.resolution.check.statistic, strike.plan.resolution.casterChoice.values], ["attack", 1, "spell-attack", ["bludgeoning", "piercing", "slashing"]]);
    assert.equal(stride.kind, "note");
    assert.deepEqual(plan.resolution.controls.degrees, ["failure", "criticalFailure"]);
    assert.deepEqual(inspectParts(plan.resolution.controls.parts), []);
});

test("Possession: each possessed creature's note, the caster Unconscious with it, and the save when the body dies", async () => {
    const plan = compile(await spell("rank-7/possession"));
    assert.ok(supported(plan));
    assert.deepEqual(["success", "failure", "criticalFailure"].map(degree => plan.resolution.outcomes[degree].noteEffects[0].label),
        ["Possessed (riding along)", "Possessed (partial control)", "Possessed (full control)"]);
    const partial = plan.resolution.outcomes.failure.noteEffects[0].recurringSave;
    assert.deepEqual([partial.mode, partial.condition.slug, partial.condition.value, partial.endOnCriticalSuccess], ["turn-condition", "controlled", null, true]);
    assert.equal(plan.resolution.outcomes.criticalFailure.noteEffects[0].minionControl, true);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ["controlled"]);
    assert.equal(plan.resolution.casterNote.kind, "while-target-note");
    const died = plan.resolution.controls.parts.find(part => part.key === "body-died");
    assert.deepEqual(died.plan.resolution.outcomes.criticalFailure.effects.map(effect => [effect.slug, effect.duration.value, effect.duration.unit]), [["paralyzed", 24, "hours"]]);
});

test("Temporary Possession: Controlled and owned until the end of the caster's turn, Stunned 1 after, half its lost Hit Points the caster's; the thrall destroyed", async () => {
    const plan = compile(await spell("rank-8/temporary-possession"));
    assert.ok(supported(plan));
    const notes = ["success", "failure", "criticalFailure"].map(degree => plan.resolution.outcomes[degree].noteEffects[0]);
    assert.deepEqual(notes.map(note => note.label), ["Possessed (1 action)", "Possessed (2 actions)", "Possessed (3 actions)"]);
    assert.deepEqual([notes[0].thenCondition.slug, notes[0].thenCondition.value, notes[0].hpShare.fraction, notes[0].minionControl], ["stunned", 1, 0.5, true]);
    assert.deepEqual(plan.resolution.controls.parts.map(part => part.kind), ["destroy-thrall"]);
});

test("Song of the Fallen: the dead's Effect or the undead's save, one using up the other", async () => {
    const plan = compile(await spell("rank-10/song-of-the-fallen"));
    assert.equal(plan.resolution.kind, "incarnate");
    assert.deepEqual(inspectIncarnatePlan(plan), []);
    const [dead, undead] = plan.resolution.incarnate.phases;
    assert.deepEqual([dead.kind, dead.rules, dead.grants.map(grant => `${grant.slug}${grant.value}`), dead.endsInDeath, dead.count], ["effect", [{key: "TempHP", value: 60}], ["slowed1"], true, 4]);
    assert.equal(undead.plan.resolution.outcomes.criticalFailure.rawText.trim(), "The target dies.");
    assert.deepEqual([dead.alternative.group, undead.alternative.group], ["targets", "targets"]);
});
