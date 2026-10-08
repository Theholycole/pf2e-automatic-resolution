import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {executableCasterChoice, inspectSavePlan, targetOutcomeNotes} from '../scripts/basic-save-core.js';
import {validNoteEffect} from '../scripts/note-effects.js';

// Third-party batch 13 (2026-10-06): Beguile (the caster's voice or appearance; the conditions for the sustained spell; the GM's notes), Dream Come True (fantasy
// or nightmare; Stupefied while off-guard; the frightened floor; Confused while frightened; the row's own time where the item's "varies").
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Beguile: Fascinated and the pick\'s Dazzled or Deafened for the spell; the critical failure\'s note', () => {
    const plan = compile('Beguile');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.ok(executableCasterChoice(plan));
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(effect => `${effect.slug}:${effect.option ?? ''}`), ['fascinated:', 'dazzled:appearance', 'deafened:voice']);
    assert.ok(plan.resolution.outcomes.failure.effects.every(effect => effect.duration.mode === 'sustained'));
    assert.match(plan.resolution.outcomes.criticalFailure.noteEffects[0].text, /Step or Stride/);
    assert.equal(plan.resolution.outcomes.success.effects[0].duration.value, 1);
});

test('Dream Come True: fantasy or nightmare on every row; Stupefied ends with Off-Guard; the nightmare floor and confusion', () => {
    const plan = compile('Dream Come True');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.ok(executableCasterChoice(plan));
    assert.equal(plan.lifecycle.durationSpec.mode, 'instantaneous');
    const stupefied = plan.resolution.outcomes.criticalFailure.effects.find(effect => effect.slug === 'stupefied');
    assert.deepEqual([stupefied.value, stupefied.whileCondition], [2, 'off-guard']);
    const state = {casterChoice: {...plan.resolution.casterChoice, selected: 'nightmare'}, outcomes: plan.resolution.outcomes};
    const notes = targetOutcomeNotes(state, {degree: 'criticalFailure'});
    assert.deepEqual(notes.map(note => note.label), ['Nightmare', 'Dream come true', 'Nightmare confusion']);
    assert.ok(notes.every(validNoteEffect));
    assert.deepEqual(notes[0].conditionFloor, {slug: 'frightened', value: 1});
});
