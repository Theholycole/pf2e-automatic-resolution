import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {prepareNoteEffectSource, validNoteEffect} from '../scripts/note-effects.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
const notes = (plan, degree) => (plan.resolution.outcomes[degree].noteEffects ?? []).map(note => `${note.label}|${note.duration.value} ${note.duration.unit}|${note.duration.anchor}`);

test('note Effects: behaviour the module can\'t carry out, with the durations the text gives (user decision)', async () => {
    const effects = await catalog();
    const push = compileAbility(await spell('rank-1/charming-push'), {nativeEffectCatalog: effects});
    assert.equal(inspectSavePlan(push).supported, true, JSON.stringify(inspectSavePlan(push).blockers));
    assert.equal(push.resolution.outcomes.success.nativeEffects[0].outcomeRule.modifiers.predicate, 'against-origin');
    assert.deepEqual(notes(push, 'failure'), ['No hostile actions against the caster|1 rounds|source-turn']);
    assert.equal(push.resolution.outcomes.criticalFailure.effects[0].slug, 'stunned');
    const heart = compileAbility(await spell('rank-1/hollow-heart'));
    assert.deepEqual([notes(heart, 'success'), notes(heart, 'failure'), notes(heart, 'criticalFailure')],
        [['No allies|1 rounds|effect-start'], ['No allies|3 rounds|effect-start'], ['No allies|3 rounds|effect-start']]);
    const command = compileAbility(await spell('rank-1/command'));
    assert.equal(inspectSavePlan(command).supported, true, JSON.stringify(inspectSavePlan(command).blockers));
    assert.match(command.resolution.outcomes.failure.noteEffects[0].text, /run away .* can't Delay/);
    const hook = compileAbility(await spell('rank-1/hearts-hook'));
    assert.deepEqual(notes(hook, 'criticalFailure').map(note => note.split('|')[0]).sort(), ['Actions on its next turn', 'No Delay or reactions']);
    assert.match(hook.resolution.outcomes.criticalFailure.noteEffects.find(note => note.label === 'Actions on its next turn').text, /all its actions/);
    assert.deepEqual(hook.resolution.reminders.map(reminder => reminder.kind), ['caster-elects-success']);
});

test('note Effects never carry mechanical rules', async () => {
    // A clause with unread damage or an unlinked condition stays unaccounted (Impending Doom; Wilding Word's Sickened on a
    // trigger its own rule doesn't read — batch 35 reads "each time it damages you").
    // (Impending Doom's own text is a timeline since rank-3 batch 83; a wording the timeline doesn't read stays unaccounted.)
    const doomSource = structuredClone(await spell('rank-3/impending-doom'));
    doomSource.system.description.value = doomSource.system.description.value.replace('it takes half damage', 'it takes some damage');
    assert.equal(inspectSavePlan(compileAbility(doomSource)).supported, false, 'rank-3/impending-doom (unread wording)');
    const word = await spell('cantrip/wilding-word');
    word.system.description.value = word.system.description.value.replace('each time it damages you', 'each time it hits an ally');
    assert.equal(inspectSavePlan(compileAbility(word)).supported, false, 'cantrip/wilding-word (changed trigger)');
    // The runtime refuses a malformed note.
    assert.equal(validNoteEffect({label: 'x', text: 'y', sourceText: 'y', duration: {mode: 'spell'}}), false);
    const source = prepareNoteEffectSource({label: 'No allies', text: 'The target treats no other creature as an ally for 3 rounds.', sourceText: 's', duration: {mode: 'fixed', value: 3, unit: 'rounds', expiry: 'turn-start', anchor: 'effect-start'}},
        {castId: 'c', castRank: 2, sourceActorUuid: 'a', targetActorUuid: 'b', sourceItemUuid: 'i', sourceItemName: 'Hollow Heart'});
    assert.deepEqual([source.name, source.system.rules.length, source.system.duration.value], ['Hollow Heart: No allies', 0, 3]);
});
