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


// Rank 9, batch 1 (2026-10-03): Frost Pillar, Uncontrollable Dance, Dimensional Excision.

test("Frost Pillar: a failure Restrained, a success unaffected; the ice and the step aside a reminder", async () => {
    const plan = compile(await spell("rank-6/frost-pillar"));
    assert.ok(supported(plan));
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(effect => effect.slug), ["restrained"]);
    assert.deepEqual(plan.resolution.outcomes.success.effects, []);
    assert.ok(plan.resolution.reminders.some(reminder => reminder.kind === "object-hold" && /Hardness 10/.test(reminder.text)));
});

test("Uncontrollable Dance: Off-Guard for the row's time, the dancing note lasting as long", async () => {
    const plan = compile(await spell("rank-8/uncontrollable-dance"));
    assert.ok(supported(plan));
    const success = plan.resolution.outcomes.success, failure = plan.resolution.outcomes.failure;
    assert.deepEqual([success.effects[0].slug, success.effects[0].duration.value, success.effects[0].duration.unit], ["off-guard", 3, "rounds"]);
    assert.deepEqual([success.noteEffects[0].duration.value, success.noteEffects[0].duration.unit], [3, "rounds"]);
    assert.deepEqual([failure.effects[0].duration.value, failure.effects[0].duration.unit], [1, "minutes"]);
    assert.ok(/at least 2 actions/.test(failure.noteEffects[0].text));
});

test("Dimensional Excision: both entries on the basic save, the home-plane question, death at 0 HP", async () => {
    const plan = compile(await spell("rank-9/dimensional-excision"));
    assert.ok(supported(plan));
    assert.equal(plan.resolution.check.basic, true);
    assert.deepEqual(plan.resolution.attackAdjustment.choices.map(choice => choice.value), [-4, 0]);
    assert.equal(plan.resolution.postDamageTerminal.kind, "death");
    assert.equal(plan.resolution.sharedDamage.components.filter(component => component.category === "persistent").length, 1);
});
