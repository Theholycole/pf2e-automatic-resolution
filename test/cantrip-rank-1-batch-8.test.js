import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {spellNoteDurationAt, spellNoteText} from '../src/compiler/spell-note.js';
import {SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';
import {prepareSpellNoteEffectSource, spellNoteTargetLimit, validSpellNoteDuration} from '../scripts/note-effects.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const runtime = (text, extra = {}) => ({text, castId: 'cast1', castRank: 1, sourceActorUuid: 'Actor.caster', sourceItemUuid: 'Item.spell',
    sourceItemName: 'Spell', targetActorUuid: 'Actor.target', ...extra});

test('spell notes: spells with nothing mechanical become a note Effect for the spell\'s duration (user decision)', async () => {
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes('spell-note'));
    // (Sanctuary is automated since batch 165; a reworded one keeps the note route this test is about.)
    const sanctuarySource = await spell('rank-1/sanctuary');
    sanctuarySource.system.description.value = sanctuarySource.system.description.value.replace('the spell ends.</p>', 'the spell ends, as the GM rules.</p>');
    const sanctuary = compileAbility(sanctuarySource);
    assert.equal(sanctuary.resolution.kind, 'spell-note');
    assert.deepEqual([sanctuary.resolution.note.recipient, sanctuary.resolution.note.environment], ['target', false]);
    assert.deepEqual([sanctuary.resolution.note.duration.value, sanctuary.resolution.note.duration.unit], [1, 'minutes']);
    assert.match(sanctuary.resolution.note.text, /hostile/);
    // A wall placed in the world: the reminder goes on the caster, with a line to mark the area.
    // (Wall of Shrubs is automated since batch 171; Helpful Steps' ladder is still a note.)
    const shrubs = compileAbility(await spell('rank-1/helpful-steps'));
    assert.deepEqual([shrubs.resolution.note.recipient, shrubs.resolution.note.environment], ['source', true]);
    // Sustained: the Effect lasts the maximum and is flagged sustained.
    // (Summon Animal is automated since batch 166; a reworded one keeps the note route.)
    const summonSource = await spell('rank-1/summon-animal');
    summonSource.system.description.value = summonSource.system.description.value.replace('to fight for you.', 'to fight for you, as the GM allows.');
    const summon = compileAbility(summonSource);
    assert.equal(summon.resolution.note.duration.sustained, true);
    // Unlimited, and instantaneous (card only, no Effect).
    assert.equal(compileAbility(await spell('cantrip/sigil')).resolution.note.duration.mode, 'unlimited');
    const detect = compileAbility(await spell('cantrip/detect-magic'));
    assert.equal(detect.resolution.kind, 'spell-note');
    assert.equal(detect.resolution.note.duration, null);
});

test('spell notes: heightened text, duration and target count at the cast rank', async () => {
    // (Share Lore is automated since batch 164; a reworded one keeps the note route these helpers are for.)
    const loreSource = await spell('rank-1/share-lore');
    loreSource.system.description.value = loreSource.system.description.value.replace('for the duration of the spell.', 'for the duration of the spell, as far as the GM allows.');
    const lore = compileAbility(loreSource);
    const note = lore.resolution.note;
    assert.deepEqual(note.heightened.map(entry => entry.rank), [3, 5]);
    assert.doesNotMatch(spellNoteText(note, 1, 1), /Heightened/);
    // The highest fixed entry reached applies, not every one below it.
    const at5 = spellNoteText(note, 5, 1);
    assert.match(at5, /Heightened \(5\)/);
    assert.doesNotMatch(at5, /Heightened \(3\)/);
    assert.deepEqual([spellNoteDurationAt(note, 1).value, spellNoteDurationAt(note, 1).unit], [10, 'minutes']);
    assert.deepEqual([spellNoteDurationAt(note, 3).value, spellNoteDurationAt(note, 3).unit], [1, 'hours']);
    assert.deepEqual([spellNoteDurationAt(note, 5).value, spellNoteDurationAt(note, 5).unit], [8, 'hours']);
    assert.equal(spellNoteTargetLimit(note.target, spellNoteText(note, 1, 1)), 3);
    assert.equal(spellNoteTargetLimit(note.target, spellNoteText(note, 3, 1)), 5);
    // Interval entries count how many times they apply.
    assert.match(spellNoteText({text: 'Base.', heightened: [{step: 2, text: 'More.'}]}, 5, 1), /\(\+2\) ×2: More\./);
    for (const [target, limit] of [['1 creature', 1], ['up to 3 creatures', 3], ['you and up to 4 allies', 5], ['you and 1 ally', 2],
        ['1 or 2 willing creatures', 2], ['the triggering creature', 1], ['you and the triggering ally', 2], ['2 willing creatures', 2]])
        assert.equal(spellNoteTargetLimit(target), limit, target);
});

test('spell notes: the note Effect source', () => {
    const fixed = {recipient: 'target', environment: false, duration: {mode: 'fixed', value: 1, unit: 'minutes', expiry: 'turn-start', anchor: 'effect-start', offset: 0}};
    const source = prepareSpellNoteEffectSource(fixed, runtime('Line one.\nLine two.'));
    assert.equal(source.name, 'Spell Note: Spell');
    assert.deepEqual(source.system.rules, []);
    assert.deepEqual([source.system.duration.value, source.system.duration.unit, source.system.duration.sustained], [1, 'minutes', false]);
    assert.match(source.system.description.value, /<p>Line one\.<\/p><p>Line two\.<\/p>/);
    assert.doesNotMatch(source.system.description.value, /mark the spell's area/);
    const area = prepareSpellNoteEffectSource({...fixed, recipient: 'source', environment: true, area: {type: 'burst', value: 10},
        duration: {...fixed.duration, sustained: true}}, runtime('Text.'));
    assert.equal(area.name, 'Spell Note: Spell (area)');
    assert.match(area.system.description.value, /mark the spell's area on the map \(10-foot burst\)/);
    assert.match(area.system.description.value, /Sustained/);
    assert.equal(area.system.duration.sustained, true);
    const unlimited = prepareSpellNoteEffectSource({...fixed, duration: {mode: 'unlimited'}}, runtime('Text.'));
    assert.deepEqual([unlimited.system.duration.value, unlimited.system.duration.unit], [-1, 'unlimited']);
    // Refusals: no duration (instantaneous gets no Effect), no text, a malformed duration.
    assert.equal(validSpellNoteDuration(null), false);
    assert.throws(() => prepareSpellNoteEffectSource({...fixed, duration: null}, runtime('Text.')));
    assert.throws(() => prepareSpellNoteEffectSource(fixed, runtime('')));
    assert.throws(() => prepareSpellNoteEffectSource({...fixed, duration: {mode: 'fixed', value: 0, unit: 'minutes'}}, runtime('Text.')));
});

test('spell notes: kept strict — anything PF2e or the module could apply mechanically is never a note', async () => {
    // A save, damage, or a number PF2e could apply keeps the spell off the note route.
    const arc = compileAbility(await spell('cantrip/electric-arc'));
    assert.notEqual(arc.resolution.kind, 'spell-note');
    const source = await spell('rank-1/sanctuary');
    // (Batch 14: an unconditional bonus to the recipient is carried as a rule on the note, not refused.)
    const bonus = structuredClone(source);
    bonus.system.description.value = bonus.system.description.value.replace('</p>', ' The target gains a +1 status bonus to AC.</p>');
    assert.deepEqual(compileAbility(bonus).resolution.note.rules, [{key: 'FlatModifier', selector: 'ac', type: 'status', value: 1}]);
    const resistance = structuredClone(source);
    resistance.system.description.value = resistance.system.description.value.replace('</p>', ' The target gains resistance 5 to fire.</p>');
    assert.notEqual(compileAbility(resistance).resolution.kind, 'spell-note');
    const dice = structuredClone(source);
    dice.system.description.value = dice.system.description.value.replace('</p>', ' It deals 1d6 fire damage.</p>');
    assert.notEqual(compileAbility(dice).resolution.kind, 'spell-note');
});
