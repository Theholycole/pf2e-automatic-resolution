import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

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



// Rank 2, batch 19 (2026-09-30): a compulsion on its next turn, repeated with an end-of-turn save that shortens it (Charitable Urge); the
// "has no items" question; a willing-ally auto-failure reminder (Retrieving Hook).

test('Charitable Urge: Stunned 1, the next-turn compulsion, and the critical failure\'s 4-round note with its end-of-turn Will save', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {validNoteEffect} = await import('../scripts/note-effects.js');
    const plan = compile(await spell('rank-2/charitable-urge'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual(success.effects.map(effect => [effect.slug, effect.value]), [['stunned', 1]]);
    // "it can choose to be stunned for 1 round instead" is its option, not a grant.
    assert.deepEqual(failure.effects, []);
    assert.deepEqual([failure.noteEffects[0].label, failure.noteEffects[0].duration.anchor], ['Compelled', 'target-turn']);
    const note = criticalFailure.noteEffects[0];
    assert.deepEqual([note.duration.value, note.duration.unit, note.recurringSave.mode, note.recurringSave.statistic], [4, 'rounds', 'reduce', 'will']);
    assert.ok(validNoteEffect(note));
    assert.equal(validNoteEffect({...note, duration: {...note.duration, unit: 'minutes'}}), false);
    assert.deepEqual(plan.targeting.actorConstraints.predicates.map(predicate => predicate.kind), ['gm-confirmed']);
    assert.match(plan.targeting.actorConstraints.predicates[0].question, /items on its person/);
});

test('Retrieving Hook: the willing-ally auto-failure is a card reminder', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/retrieving-hook'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['auto-failure']);
    const forged = structuredClone(plan); forged.resolution.reminders[0].sourceText = 'Something else.';
    assert.equal(inspectSavePlan(forged).supported, false);
});
