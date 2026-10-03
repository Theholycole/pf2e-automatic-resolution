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


// Rank 3, batch 57 (2026-10-02): Spirit Veil (the caster's Concealed for 1 minute with a note: Hidden from undead and the ending on a hostile
// action or Interacting with undead; Heightened (+1): one more willing target within 30 feet a rank, each Concealed too).

test("Spirit Veil: the caster's Concealed, and heightened targets", async () => {
    const plan = compile(await spell("rank-3/spirit-veil"));
    assert.equal(plan.resolution.kind, "condition-note");
    const note = plan.resolution.conditionNote;
    assert.deepEqual([note.recipient, note.condition.slug, note.duration.value, note.duration.unit], ["source", "concealed", 1, "minutes"]);
    assert.match(note.text, /Hidden from undead creatures/);
    assert.match(note.text, /the spell ends/);
    assert.deepEqual([note.heightenedTargets.interval, note.heightenedTargets.perStep, note.heightenedTargets.feet, note.heightenedTargets.baseRank], [1, 1, 30, 3]);
    // The second condition must be the observer's ("from undead creatures …"); a plain second grant isn't read.
    const other = compile(withText(await spell("rank-3/spirit-veil"), html => html.replace("from undead creatures regardless of what precise senses they have", "to undead creatures regardless of what precise senses they have")));
    assert.notEqual(other.resolution.kind, "condition-note");
});
