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



// Rank 2, batch 12 (2026-09-30): a failing creature stuck to the caster's appendage (Frog Tongue): Off-Guard until it Escapes or the
// spell ends, a Stuck note, and the caster's auditory penalty note made per stuck creature and removed with its Off-Guard Effect.

test('Frog Tongue: the basic save, the failing rows\' Off-Guard until Escape, the Stuck note and the caster\'s penalty note', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/frog-tongue'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.equal(success.effects.length, 0);
    for (const outcome of [failure, criticalFailure]) {
        assert.deepEqual(outcome.effects.map(effect => [effect.slug, effect.duration.value, effect.duration.unit, JSON.stringify(effect.endsWhen), effect.expirationMode]),
            [['off-guard', 1, 'minutes', '[{"event":"escape","dc":"spell"}]', 'first']]);
        assert.match(outcome.noteEffects[0].text, /at least 10 slashing damage \(the tongue's AC is the caster's spell DC\)/);
    }
    const note = plan.resolution.casterNote;
    assert.deepEqual([note.kind, note.condition, note.degrees], ['while-target-condition', 'off-guard', ['failure', 'criticalFailure']]);
    assert.deepEqual(note.rules, [{key: 'FlatModifier', selector: 'all', type: 'circumstance', value: -2, predicate: [{or: ['item:trait:auditory', 'self:action:trait:auditory']}]}]);
});

test('The caster\'s penalty note: its rule shape, and its tie to the failing rows\' Escape lifetime', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {validNoteRule} = await import('../scripts/note-effects.js');
    const plan = compile(await spell('rank-2/frog-tongue'));
    const rule = plan.resolution.casterNote.rules[0];
    assert.equal(validNoteRule(rule), true);
    assert.equal(validNoteRule({...rule, predicate: [{or: ['item:trait:auditory', 'self:action:trait:visual']}]}), false);
    assert.equal(validNoteRule({...rule, value: -6}), false);
    // Without the failing rows' Escape lifetime the note has nothing to end with.
    const broken = structuredClone(plan); delete broken.resolution.outcomes.failure.effects[0].endsWhen;
    assert.ok(inspectSavePlan(broken).blockers.some(blocker => blocker.code === 'caster-note'));
    // A text that isn't the whole stuck rider stays a gap.
    const partial = compile(withText(await spell('rank-2/frog-tongue'), html => html.replace(/ If you move so that the affected creature is outside of the tongue's reach, the spell ends\./, '')));
    assert.equal(inspectSavePlan(partial).supported, false);
});
