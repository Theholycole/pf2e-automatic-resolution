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


// Rank 7, batch 12 (2026-10-04): Orb of Twisting Fate, Beheading Buzz Saw, Expunge Blood.

test("Orb of Twisting Fate: the GM's note until the target's turn ends (success), with an end-of-turn save (failure, 10 rounds), or the whole minute", async () => {
    const plan = compile(await spell("rank-7/orb-of-twisting-fate"));
    assert.equal(supported(plan), true);
    const span = degree => plan.resolution.outcomes[degree].noteEffects.map(note => `${note.duration.value} ${note.duration.unit}`).join();
    assert.deepEqual([span("success"), span("failure"), span("criticalFailure")], ["1 rounds", "10 rounds", "1 minutes"]);
    assert.equal(plan.resolution.outcomes.failure.noteEffects[0].recurringSave.mode, "end");
    assert.equal(plan.resolution.outcomes.success.noteEffects[0].duration.anchor, "target-turn");
});

test("Beheading Buzz Saw: both entries scaled by the row (no critical success row: unaffected); the critical failure's death save; the head reminder", async () => {
    const plan = compile(await spell("rank-7/beheading-buzz-saw"));
    assert.equal(supported(plan), true);
    assert.deepEqual(["criticalSuccess", "success", "failure", "criticalFailure"].map(degree => plan.resolution.outcomes[degree].damage.multiplier ?? 0), [0, 0, 1, 2]);
    assert.equal(plan.resolution.sharedDamage.components.filter(component => component.category === "persistent").length, 1);
    assert.equal(plan.resolution.outcomes.criticalFailure.followUps[0].check.statistic, "fortitude");
    assert.match(plan.resolution.reminders.map(reminder => reminder.text).join(" "), /head it needs to live/);
});

test("Expunge Blood: the GM's blood question; Drained keeps its own recovery; Clumsy rises by 1 while the target has persistent bleed", async () => {
    const plan = compile(await spell("rank-6/expunge-blood"));
    assert.equal(supported(plan), true);
    assert.ok(plan.targeting.actorConstraints.predicates.some(predicate => predicate.kind === "gm-confirmed" && /blood/.test(predicate.question)));
    const failure = plan.resolution.outcomes.failure;
    assert.equal(failure.effects.find(effect => effect.slug === "drained").duration, null);
    assert.equal(failure.effects.find(effect => effect.slug === "clumsy").duration.unit, "minutes");
    assert.deepEqual(failure.noteEffects[0].rules[0].predicate, ["item:slug:clumsy", "self:condition:persistent-damage:bleed"]);
});
