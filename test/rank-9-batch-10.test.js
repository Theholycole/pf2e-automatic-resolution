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


// Rank 9, batch 10 (2026-10-05): feature group 5, part 3 — Arcane Explosion (the blast's basic save with its push; the caster's form after it).

test("Arcane Explosion: the 16d6 basic Fortitude blast with the failure's push; PF2e's Effect on the caster proved, its adjacent 6d6 force aura, maximum Hit Points at its end", async () => {
    const plan = compile(await spell("rank-9/arcane-explosion"));
    assert.equal(supported(plan), true);
    assert.equal(plan.resolution.check.basic, true);
    assert.deepEqual(plan.resolution.outcomes.failure.forcedMovement && [plan.resolution.outcomes.failure.forcedMovement.kind, plan.resolution.outcomes.failure.forcedMovement.distance], ["push", 10]);
    const form = plan.resolution.casterForm;
    assert.equal(form.effect.name, "Spell Effect: Arcane Explosion");
    assert.deepEqual(form.auras.map(aura => [aura.radius, aura.formula, aura.type, aura.events]), [[5, "6d6", "force", ["turn-end"]]]);
    assert.equal(form.endFullHp, true);
    assert.ok(plan.resolution.reminders.some(reminder => reminder.kind === "object-push" && /Prone/.test(reminder.text)));
    // A forged aura (no dice) is refused.
    const forged = structuredClone(plan); forged.resolution.casterForm.auras[0].formula = "lots";
    assert.equal(supported(forged), false);
    // A resistance the Effect doesn't prove isn't read.
    const changed = compile(withText(await spell("rank-9/arcane-explosion"), html => html.replace("except force damage, spirit damage", "except force damage, fire damage")));
    assert.equal(changed.resolution.casterForm, undefined);
});
