import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan, isExecutableStoredTriggerPlan} from '../scripts/basic-save-core.js';
import {validNoteEffect, validRowNoteRule} from '../scripts/note-effects.js';

// Third-party batch 10 (2026-10-06): Siphoning Rivulet (the text's bleed now, the caster's temporary Hit Points), Unknowable Icon (a rune's stored trigger,
// every creature near it saving), Drown (the auditory/linguistic penalty, the held breath with its Interact re-save), Kinetic Tow (the GM's pull toward the
// caster's pick, the tether's re-save).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Siphoning Rivulet: 4d4 bleed now (+1d4 a rank), temporary Hit Points from the total bleed until the end of the next turn', () => {
    const plan = compile('Siphoning Rivulet');
    assert.equal(plan.resolution.kind, 'direct-damage');
    assert.equal(plan.resolution.damage.formula, '(4+floor((@item.rank - 4)/1)*1)d4[bleed]');
    assert.deepEqual(plan.resolution.damage.siphon, {plusTriggering: 'bleed', rounds: 1, expiry: 'turn-end'});
});

test('Unknowable Icon: the rune waits; its trigger is a basic Will save for every creature near it, Frightened 2 on a critical failure', () => {
    const plan = compile('Unknowable Icon');
    assert.ok(isExecutableStoredTriggerPlan(plan));
    assert.equal(plan.resolution.storedTrigger.area, true);
    assert.equal(plan.resolution.check.basic, true);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => `${effect.slug}:${effect.value}`), ['frightened:2']);
    assert.equal(plan.resolution.outcomes.criticalFailure.damage.multiplier, 2);
});

test('Drown: the –2 on auditory and linguistic checks; the held breath with its Interact re-save; the GM reminders', () => {
    const plan = compile('Drown');
    assert.equal(inspectSavePlan(plan).supported, true);
    const penalty = plan.resolution.outcomes.success.noteEffects[0];
    assert.ok(validNoteEffect(penalty) && validRowNoteRule(penalty.rules[0]));
    assert.deepEqual(penalty.rules[0].predicate, [{or: ['item:trait:auditory', 'item:trait:linguistic']}]);
    const bubble = plan.resolution.outcomes.criticalFailure.noteEffects[0];
    assert.equal(bubble.endSave.statistic, 'fortitude');
    assert.match(bubble.text, /half its usual rounds/);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['third-party-note', 'third-party-note']);
});

test("Kinetic Tow: the pull toward the caster's pick by row; the tether's Fortitude re-save", () => {
    const plan = compile('Kinetic Tow');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].forcedMovement.distance), [10, 15, 30]);
    assert.ok(['success', 'failure', 'criticalFailure'].every(degree => plan.resolution.outcomes[degree].forcedMovement.direction === 'chosen'));
    assert.equal(plan.resolution.outcomes.failure.noteEffects[0].endSave.statistic, 'fortitude');
    assert.equal(plan.resolution.outcomes.success.noteEffects.length, 0);
});
