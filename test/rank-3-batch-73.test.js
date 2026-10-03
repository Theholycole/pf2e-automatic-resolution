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


// Rank 3, batch 73 (2026-10-02): Enthrall (Will, sustained: the GM's circumstance bonus up to +4 asked per target; Fascinated for the sustained spell; the
// failure's save on disagreement ends only that creature's part, then immune 1 hour; a card for the newcomers on each Sustain).

test("Enthrall: the GM's bonus, Fascinated, the per-creature end save and the newcomers' card", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const { validNoteEffect } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-3/enthrall"));
    assert.deepEqual(plan.resolution.attackAdjustment.choices.map(c => c.value), [0, 1, 2, 3, 4]);
    assert.deepEqual(plan.resolution.chainSave, { perCast: true, repeatable: true, cascade: false, label: "creatures that came within range", sourceText: "Each creature that comes within range has to attempt a save when you Sustain the spell." });
    assert.equal(plan.resolution.laterImmunityKey, "enthrall");
    const note = d => plan.resolution.outcomes[d].noteEffects[0];
    assert.deepEqual(note("failure").endSave, { statistic: "will", label: "it disagrees with the caster", oncePerRound: false, scope: "creature", immunity: { value: 1, unit: "hours", key: "enthrall" } });
    assert.equal(note("criticalFailure").endSave, undefined);
    assert.ok(validNoteEffect(note("failure")));
    assert.equal(validNoteEffect({ ...note("failure"), endSave: { ...note("failure").endSave, scope: undefined } }), false);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another newcomer rule isn't read.
    const other = compile(withText(await spell("rank-3/enthrall"), html => html.replace("has to attempt a save when you Sustain the spell", "has to attempt a save at the start of its turn")));
    assert.equal(other.compilerEvidence.enthrallRows, undefined);
});
