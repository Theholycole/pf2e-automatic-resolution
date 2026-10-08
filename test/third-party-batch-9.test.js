import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {executableCasterChoice, inspectSavePlan, isDamageTypeFrom, targetOutcomeNotes} from '../scripts/basic-save-core.js';
import {noteTextAt, validNoteEffect} from '../scripts/note-effects.js';

// Third-party batch 9 (2026-10-06): Quick Siphon (the caster's healing, ending one persistent bleed), Umbral Escape (the module's Effect proved, its
// immunity Effect granted), Shadow's Betrayal (a spell attack typed by the target's Strike, off-guard in the dark), Careless Swings (the caster's trait, a
// GM-played note), Shade of Night (the reduced vision's note, its text the cast rank's; Blinded on a critical failure).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', automation: {ruleKeys: [], requiresConfiguration: true, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: catalog, referencedSpells: new Map()});

test('Quick Siphon: 10 HP to the caster (+2 a rank, as PF2e heightens it); one persistent bleed may end', () => {
    const plan = compile('Quick Siphon');
    assert.deepEqual(plan.resolution.healing.endPersistent, {damageType: 'bleed', count: 1, optional: true});
    assert.equal(plan.resolution.healing.recipient, 'source');
    assert.equal(plan.resolution.healing.heighteningCorrection, undefined);
    // A flat step the data doesn't match is refused.
    const wrong = spell('Quick Siphon'); wrong.system.heightening.damage[Object.keys(wrong.system.heightening.damage)[0]] = '3';
    assert.equal(compileAbility(wrong, {nativeEffectCatalog: catalog, referencedSpells: new Map()}).resolution?.healing, undefined);
});

test("Umbral Escape: the module's resistance (as all-damage) on the caster, its immunity Effect granted with it", () => {
    const note = compile('Umbral Escape').resolution.effectNote;
    assert.equal(note.recipient, 'source');
    assert.match(note.grantedImmunity.label, /Immunity$/);
    assert.deepEqual(note.proof.ruleOverrides, [{index: 0, key: 'Resistance', patch: {type: 'all-damage'}}]);
    assert.deepEqual(note.proof.immunity, {value: 1, unit: 'minutes'});
    assert.equal(note.proof.notes.length, 3);
});

test("Shadow's Betrayal: a spell attack; the darkness question; the damage typed by the target's Strike", () => {
    const plan = compile("Shadow's Betrayal");
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    assert.deepEqual(plan.resolution.attackAdjustment.choices.map(choice => choice.value), [2, 0]);
    assert.equal(plan.resolution.damageTypeFrom.kind, 'target-strike');
    assert.ok(isDamageTypeFrom(plan.resolution.damageTypeFrom));
    assert.equal(plan.resolution.outcomes.criticalSuccess.damage.multiplier, 2);
});

test("Careless Swings: the caster's trait; the first Strike's (or every Strike's) note until the end of the target's next turn", () => {
    const plan = compile('Careless Swings');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.ok(executableCasterChoice(plan));
    const state = {casterChoice: {...plan.resolution.casterChoice, selected: 'move'}, outcomes: plan.resolution.outcomes};
    const [note] = targetOutcomeNotes(state, {degree: 'criticalFailure'});
    assert.equal(note.option, 'move');
    assert.match(note.text, /each of its Strikes has the move trait/);
    assert.ok(validNoteEffect(note));
    assert.equal(targetOutcomeNotes(state, {degree: 'success'}).length, 0);
});

test('Shade of Night: the vision note for 1 round or 1 minute, its text by rank; Blinded for 1 round on a critical failure; a willing ally picks', () => {
    const plan = compile('Shade of Night');
    assert.equal(inspectSavePlan(plan).supported, true);
    const note = plan.resolution.outcomes.failure.noteEffects[0];
    assert.ok(validNoteEffect(note));
    assert.equal(note.duration.value, 10);
    assert.match(noteTextAt(note, 1), /darkvision becomes low-light vision/);
    assert.match(noteTextAt(note, 3), /darkvision and low-light vision become no special vision/);
    assert.match(noteTextAt(note, 4), /greater darkvision becomes low-light vision/);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => `${effect.slug}:${effect.duration.value}`), ['blinded:1']);
    assert.equal(plan.resolution.outcomes.failure.effects.length, 0);
    assert.ok(plan.resolution.reminders.some(reminder => reminder.kind === 'willing-choice'));
});
