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


// Rank 4, batch 80 (2026-10-02): Ranage's Circle (Fortitude: a Bound in stone note granting Clumsy 1 / 2 / 2 until the creature moves; Immobilized or
// Restrained until it Escapes at the spell DC; the adjacent difficult terrain a reminder).

test("Ranage's Circle: Clumsy notes until it moves, the hold until it Escapes", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const { validNoteEffect } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-4/ranages-circle"));
    const note = d => plan.resolution.outcomes[d].noteEffects?.[0];
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [note(d).rules[0].key, note(d).rules[0].alterations[0].value, note(d).duration.mode]),
        [["GrantItem", 1, "unlimited"], ["GrantItem", 2, "unlimited"], ["GrantItem", 2, "unlimited"]]);
    assert.ok(validNoteEffect(note("failure")));
    assert.equal(validNoteEffect({ ...note("failure"), rules: [{ ...note("failure").rules[0], alterations: [{ mode: "override", property: "badge-value", value: 9 }] }] }), false);
    assert.deepEqual(["failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].effects.map(e => [e.slug, e.endsWhen[0].event])), [[["immobilized", "escape"]], [["restrained", "escape"]]]);
    assert.ok(plan.resolution.reminders.some(r => /adjacent to the target is difficult terrain for 1 minute/.test(r.text)));
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another lifetime isn't read.
    const other = compile(withText(await spell("rank-4/ranages-circle"), html => html.replace("This condition lasts until they move from their current position.", "This condition lasts 1 minute.")));
    assert.equal(other.compilerEvidence.stoneBind, undefined);
});
