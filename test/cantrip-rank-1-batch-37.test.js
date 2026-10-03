import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {validNoteEffect} from '../scripts/note-effects.js';

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
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('Shroud of Night: "all creatures are Concealed to it" is a note, never Concealed on the target; a willing ally chooses', async () => {
    const plan = compileAbility(await spell('cantrip/shroud-of-night'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    for (const degree of ['failure', 'criticalFailure']) {
        const outcome = plan.resolution.outcomes[degree];
        assert.equal(outcome.effects.length, 0);
        const [note] = outcome.noteEffects;
        assert.equal(note.label, 'What it can see');
        assert.match(note.text, /^The target is shrouded in murky darkness\. It treats bright light as dim light, .* all creatures are Concealed to it\.$/);
        assert.deepEqual([note.duration.value, note.duration.unit, note.duration.sustained], [1, 'minutes', true]);
        assert.ok(validNoteEffect(note));
    }
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['willing-choice']);
});

test('perceived concealment: kept strict', async () => {
    const source = await spell('cantrip/shroud-of-night');
    // Another rule after the sentence isn't read.
    assert.equal(inspectSavePlan(compileAbility(withText(source, text => text.replace('to it.', 'to it. It takes a –2 status penalty to Perception.')))).supported, false);
    // Concealed on the target itself stays the ordinary condition, never this note.
    const own = compileAbility(withText(source, text => text.replace(/It treats bright light as dim light, and unless it has greater darkvision, all creatures are (@UUID\[[^\]]+\]\{Concealed\}) to it\./, 'It is $1.')));
    assert.equal((own.resolution.outcomes.failure.noteEffects ?? []).some(note => note.perceivedCondition), false);
});

test('Stumbling Curse: the skill penalty as a generated modifier, the Strides as notes; PF2e\'s identical Effect set aside', async () => {
    const plan = compileAbility(await spell('rank-1/stumbling-curse'), {nativeEffectCatalog: effects});
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    const penalty = success.noteEffects[0];
    assert.deepEqual(penalty.rules, [{key: 'FlatModifier', selector: 'athletics', type: 'status', value: -2}, {key: 'FlatModifier', selector: 'acrobatics', type: 'status', value: -2}]);
    assert.deepEqual([penalty.duration.value, penalty.duration.unit, penalty.duration.sustained], [1, 'minutes', true]);
    assert.deepEqual(failure.noteEffects.map(note => note.label), ['Skill penalty', 'Stumbling Strides']);
    assert.match(failure.noteEffects[1].text, /random direction/);
    assert.match(criticalFailure.noteEffects[1].text, /direction the caster controls/);
    assert.ok([success, failure, criticalFailure].every(outcome => outcome.nativeEffects.length === 0 && outcome.effects.length === 0));
    assert.equal(plan.compilerEvidence.setAsideEffect.reference, 'Spell Effect: Stumbling Curse');
    assert.ok([success, failure, criticalFailure].flatMap(outcome => outcome.noteEffects).every(validNoteEffect));
});

test('Stumbling Curse rules: kept strict', async () => {
    const source = await spell('rank-1/stumbling-curse');
    // A different penalty than the linked Effect's keeps the Effect (and stays blocked).
    assert.equal(inspectSavePlan(compileAbility(withText(source, text => text.replace('-2 status penalty', '-3 status penalty')), {nativeEffectCatalog: effects})).supported, false);
    // Other Stride wording isn't read.
    assert.equal(inspectSavePlan(compileAbility(withText(source, text => text.replace('in a random direction', 'toward you')), {nativeEffectCatalog: effects})).supported, false);
});
