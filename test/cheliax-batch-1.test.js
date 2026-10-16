import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, targetOutcomeNotes} from '../scripts/basic-save-core.js';
import {validNoteEffect} from '../scripts/note-effects.js';

// PF2e 8.6's new spells (Lost Omens Cheliax, Infernal Inheritance), batch 1 (2026-10-16): The Night is Mine (also cast as a reaction), Piercing Jet (an attack
// whose damage ignores a low Hardness), Silver Spear (an implied attack, extra damage and a tether for fiends).
const base = new URL('../.cache/pf2e-test-fixtures-861/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('The Night is Mine: the basic Reflex save, and the reaction a reminder', async () => {
    const plan = compile(await spell('rank-1/the-night-is-mine'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.check.basic, true);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['reaction-cast']);
    assert.match(plan.resolution.reminders[0].text, /attempts to Hide/);
    // Kept strict: an action count other than the item's, or another reaction trigger, is not read.
    const other = withText(await spell('rank-1/the-night-is-mine'), text => text.replace('attempts to @UUID', 'casts a spell near @UUID'));
    assert.equal(compile(other).resolution.reminders, undefined);
});

test('Piercing Jet: a hit and a critical hit, the Hardness the GM\'s reminder', async () => {
    const plan = compile(await spell('rank-2/piercing-jet'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    assert.deepEqual(['criticalSuccess', 'success', 'failure'].map(degree => plan.resolution.outcomes[degree].damage.multiplier ?? 0), [2, 1, 0]);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['ignore-hardness']);
    assert.match(plan.resolution.reminders[0].text, /twice the spell's rank/);
});

test('Silver Spear: the attack trait\'s attack, extra spirit damage for a fiend, and its tether on a critical hit', async () => {
    const plan = compile(await spell('rank-6/silver-spear'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    assert.deepEqual(plan.resolution.conditionalDamage.map(entry => [entry.trait, entry.formula]), [['fiend', '(12+2*(@item.rank - 6))d6[spirit]']]);
    const [tether] = plan.resolution.outcomes.criticalSuccess.noteEffects;
    assert.deepEqual([tether.targetTrait, tether.castFlatCheck, tether.duration.value, tether.duration.unit], ['fiend', {dc: 11, trait: 'teleportation'}, 1, 'minutes']);
    assert.equal(validNoteEffect(tether), true);
    assert.equal(plan.resolution.outcomes.success.noteEffects?.length ?? 0, 0);
    // Only a fiend takes the note: the card's recorded traits.
    const state = {outcomes: plan.resolution.outcomes};
    assert.deepEqual(targetOutcomeNotes(state, {degree: 'criticalSuccess', traits: ['fiend', 'devil']}).map(note => note.label), ['Tethered']);
    assert.deepEqual(targetOutcomeNotes(state, {degree: 'criticalSuccess', traits: ['humanoid']}), []);
});

test('Spray of Salt: the persistent spirit damage on the failing rows for an ooze, unholy or water creature only', async () => {
    const plan = compile(await spell('rank-2/spray-of-salt'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.resolution.conditionalDamage.map(entry => [entry.formula, entry.traits, entry.degrees]),
        [['(@item.level)d4[persistent,spirit]', ['ooze', 'unholy', 'water'], ['failure', 'criticalFailure']]]);
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => [plan.resolution.outcomes[degree].damage.mode, plan.resolution.outcomes[degree].damage.multiplier]),
        [['shared', 0.5], ['shared', 1], ['shared', 2]]);
    // A different list on the two rows is not read.
    const other = withText(await spell('rank-2/spray-of-salt'), text => text.replace('if it has the ooze, unholy, or water trait', 'if it has the ooze or water trait'));
    assert.equal(compile(other).resolution.conditionalDamage, undefined);
});
