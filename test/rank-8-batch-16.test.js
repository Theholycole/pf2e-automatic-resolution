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


// Rank 8, batch 16 (2026-10-05): feature group 5, part 1 — a form's stat-block abilities around PF2e's Effect (form-riders.js): Monstrosity Form,
// Nature Incarnate and Qi Form.

test("Monstrosity Form: PF2e's Effect, the phoenix's switchable Shroud of Flame, the cave worm's turn-end recovery and the sea serpent's Spine Rake save", async () => {
    const plan = compile(await spell("rank-8/monstrosity-form"));
    assert.equal(plan.resolution.kind, "effect");
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const riders = plan.resolution.formRiders;
    assert.deepEqual(riders.auras.map(aura => [aura.option, aura.radius, aura.formula, aura.type, aura.events.join(","), aura.oncePerTurn, aura.toggle]), [["phoenix", 20, "2d6", "fire", "enter,turn-end", true, true]]);
    assert.deepEqual(riders.recovery.map(entry => [entry.option, entry.slugs]), [["cave-worm", ["paralyzed", "slowed", "stunned"]]]);
    const rake = plan.resolution.controls.parts.find(part => part.key === "spine-rake");
    assert.equal(rake.option, "sea-serpent");
    assert.equal(rake.plan.resolution.sharedDamage.formula, "(4d8+10)[slashing]");
    assert.equal(rake.plan.resolution.check.statistic ?? rake.plan.resolution.check.save, "reflex");
    assert.ok(plan.resolution.gmNotes.some(note => /enough space/.test(note)));
    // A different recovery list than the form's immunity proves isn't read.
    const changed = compile(withText(await spell("rank-8/monstrosity-form"), html => html.replace("You're also immune to being @UUID[Compendium.pf2e.conditionitems.Item.eIcWbB5o3pP6OIMe]{Immobilized}", "You're also immune to being @UUID[Compendium.pf2e.conditionitems.Item.eIcWbB5o3pP6OIMe]{Grabbed}")));
    assert.equal(changed.resolution.formRiders, undefined);
});

test("Nature Incarnate: the green man's Green Caress (each enemy but plants saves, Clumsy by its row) and the kaiju's Trample with the foot's damage", async () => {
    const plan = compile(await spell("rank-10/nature-incarnate"));
    assert.equal(plan.resolution.kind, "effect");
    const caress = plan.resolution.formRiders.auras[0];
    assert.deepEqual([caress.option, caress.radius, caress.save.statistic, caress.save.enemiesOnly, caress.save.exceptTrait, caress.save.rows.failure.value, caress.save.rows.criticalFailure.value, caress.save.rows.failure.rounds],
        ["green-man", 60, "fortitude", true, "plant", 1, 2, 1]);
    const trample = plan.resolution.controls.parts.find(part => part.key === "trample");
    assert.deepEqual([trample.option, trample.plan.resolution.sharedDamage.formula], ["kaiju", "(6d6+10)[bludgeoning]"]);
});

test("Qi Form: the corona's damage of PF2e's chosen type at a turn start, its Sustain between 5 and 30 feet; the Strike dice proved by PF2e's rule", async () => {
    const plan = compile(await spell("rank-9/qi-form"));
    assert.equal(plan.resolution.kind, "effect");
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const corona = plan.resolution.formRiders.auras[0];
    assert.deepEqual([corona.radius, corona.sizes, corona.formula, corona.typeFlag, corona.events], [5, [5, 30], "2d6", "kiFormDamage", ["turn-start"]]);
    assert.ok(plan.resolution.controls.parts.some(part => part.kind === "form-aura" && part.aura === "corona"));
    const changed = compile(withText(await spell("rank-9/qi-form"), html => html.replace("deal 1d6 additional damage", "deal 2d6 additional damage")));
    assert.equal(changed.resolution.formRiders, undefined);
});
