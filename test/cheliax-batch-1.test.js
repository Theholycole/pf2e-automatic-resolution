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

test('Glimpse the Netherworld: the basic Reflex save around the triggering enemy, persistent cold on a failure (double on a critical failure)', async () => {
    const plan = compile(await spell('rank-4/glimpse-the-netherworld'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].damage.formulas.map(entry => entry.formula)),
        [['(@item.level - 3)d6[persistent,cold]'], ['(2*((@item.level - 3)d6))[persistent,cold]']]);
    assert.equal(plan.resolution.outcomes.success.damage.formulas, undefined);
    assert.match(plan.resolution.reminders.find(reminder => reminder.kind === 'triggered-blast').text, /reduced to 0 Hit Points\. Place the 10-foot emanation on the triggering enemy/);
    // A persistent amount on another row is not read.
    const other = withText(await spell('rank-4/glimpse-the-netherworld'), text => text.replace('(double on a critical failure)', '(triple on a critical failure)'));
    assert.equal(inspectSavePlan(compile(other)).supported, false);
});

test('Pin the Spears in the Lamb: each target\'s save, the hold until it Escapes, the count a reminder', async () => {
    const plan = compile(await spell('rank-1/pin-the-spears-in-the-lamb'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const rows = plan.resolution.outcomes;
    assert.deepEqual(rows.success.modifiers.map(modifier => [modifier.selector, modifier.value, modifier.duration.value, modifier.duration.unit]), [['all-speeds', -10, 1, 'rounds']]);
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => rows[degree].effects.map(effect => [effect.slug, effect.duration.value, effect.duration.unit, effect.endsWhen?.[0]?.event])),
        [[['immobilized', 1, 'rounds', 'escape']], [['immobilized', 1, 'minutes', 'escape']]]);
    assert.match(plan.resolution.reminders.find(reminder => reminder.kind === 'targets-by-actions').text, /each a creature with a shadow/);
    // A row the reader doesn't know is left to the other readers.
    const other = withText(await spell('rank-1/pin-the-spears-in-the-lamb'), text => text.replace('for 1 minute.', 'for 1 minute and takes 1d6 damage.'));
    assert.equal(compile(other).resolution.reminders?.some(reminder => reminder.kind === 'targets-by-actions') ?? false, false);
});

test('Curse of Slippery Steps: its footing a note for the row\'s time (1 round, 1 hour, 24 hours)', async () => {
    const plan = compile(await spell('rank-1/curse-of-slippery-steps'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].noteEffects.map(note => [note.label, note.duration.value, note.duration.unit])),
        [[['Slippery steps', 1, 'rounds']], [['Slippery steps', 1, 'hours']], [['Slippery steps', 24, 'hours']]]);
    assert.match(plan.resolution.outcomes.failure.noteEffects[0].text, /Track it get a \+2 circumstance bonus/);
    assert.ok(plan.resolution.outcomes.failure.noteEffects.every(validNoteEffect));
});

test('Unending Tears: dazzled until it Interacts; the emotion effect suppressed (the GM) and, on a critical failure, silent while stupefied', async () => {
    const plan = compile(await spell('rank-4/unending-tears'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const rows = plan.resolution.outcomes;
    assert.deepEqual(rows.success.effects.map(effect => [effect.slug, effect.endsWhen?.[0]?.event]), [['dazzled', 'action']]);
    assert.deepEqual(rows.failure.effects.map(effect => [effect.slug, effect.value, effect.duration.value, effect.duration.unit]).sort(), [['dazzled', null, 1, 'minutes'], ['stupefied', 1, 1, 'minutes']]);
    assert.deepEqual(rows.criticalFailure.noteEffects.map(note => note.label), ['Emotion effect suppressed', "Can't speak"]);
    assert.deepEqual(rows.criticalFailure.noteEffects[1].withCondition, {slug: 'stupefied'});
    assert.ok([...rows.failure.noteEffects, ...rows.criticalFailure.noteEffects].every(validNoteEffect));
});

test('Choking Fog: the concealing fog, its suffocation the GM\'s note, Dismissed by the caster', async () => {
    const plan = compile(await spell('rank-4/choking-fog'));
    assert.equal(plan.resolution.kind, 'concealing-area');
    assert.equal(plan.automation.level, 'automatic');
    assert.deepEqual([plan.resolution.concealingArea.area, plan.resolution.concealingArea.durationSeconds, plan.resolution.concealingArea.dismissible], [{type: 'burst', value: 20}, 60, true]);
    assert.match(plan.resolution.concealingArea.notes[0], /hold their breath or begin to suffocate/);
});

test('Searing Rain: the steam cloud\'s concealing area, Dismissed by the caster, with the downpour\'s basic Reflex save for the creatures inside', async () => {
    const plan = compile(await spell('rank-5/searing-rain'));
    assert.equal(plan.resolution.kind, 'concealing-area');
    assert.equal(plan.automation.level, 'automatic');
    const cloud = plan.resolution.concealingArea;
    assert.deepEqual([cloud.area, cloud.durationSeconds, cloud.dismissible], [{type: 'burst', value: 20}, 60, true]);
    assert.equal(inspectSavePlan(cloud.savePlan).supported, true, JSON.stringify(inspectSavePlan(cloud.savePlan).blockers));
    assert.equal(cloud.savePlan.resolution.check.basic, true);
    assert.deepEqual(cloud.savePlan.resolution.sharedDamage.components.map(component => [component.formula, component.type, component.category ?? null]), [['6d6', 'bludgeoning', null], ['2d6', 'fire', 'persistent']]);
    // Another sentence leaves it to the other readers.
    const other = withText(await spell('rank-5/searing-rain'), text => text.replace('You can Dismiss this effect.', 'You can Dismiss this effect. The steam is hot.'));
    assert.notEqual(compile(other).resolution.kind, 'concealing-area');
});

test('Gloom Mantle: the caster Concealed when cast and on the first Sustain each round, its limits a note', async () => {
    const plan = compile(await spell('rank-1/gloom-mantle'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ['self-pulse', 'automatic']);
    const pulse = plan.resolution.selfPulse;
    assert.deepEqual([pulse.condition.slug, pulse.durationSeconds], ['concealed', 60]);
    assert.match(pulse.note, /can't use this concealed condition to Hide or Sneak, and loses it in an area of bright light/);
    const other = withText(await spell('rank-1/gloom-mantle'), text => text.replace('if you\'re ever in an area of bright light', 'if you Strike'));
    assert.notEqual(compile(other).resolution.kind, 'self-pulse');
});

test('Diabolical Mantle: PF2e\'s Effect, and the 4th-rank Translocate the caster can cast once from it', async () => {
    // (With PF2e's spell Effects: the plan applies PF2e's.)
    const {readdir} = await import('node:fs/promises');
    const nativeEffectCatalog = new Map();
    for (const name of await readdir(new URL('spell-effects/', base))) {
        const effect = JSON.parse(await readFile(new URL(`spell-effects/${name}`, base), 'utf8')); const rules = effect.system?.rules ?? [];
        nativeEffectCatalog.set(effect.name, {id: effect._id, name: effect.name, type: effect.type, sourceFile: `spell-effects/${name}`,
            automation: {ruleKeys: [...new Set(rules.map(rule => rule.key))], requiresConfiguration: rules.some(rule => rule.key === 'ChoiceSet'), removesAfterRoll: false},
            mechanics: {rules, duration: effect.system?.duration ?? null, start: effect.system?.start ?? null}});
    }
    const plan = compileAbility(await spell('rank-7/diabolical-mantle'), {nativeEffectCatalog, referencedSpells: new Map()});
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ['effect', 'automatic']);
    assert.deepEqual([plan.resolution.castGrant.name, plan.resolution.castGrant.rank, plan.resolution.castGrant.tradition, plan.resolution.castGrant.uses], ['Translocate', 4, 'divine', 1]);
});

test('Roar of Freedom: the enemies\' Will save with the GM\'s penalty for tyrants, allies PF2e\'s temporary Hit Points', async () => {
    const {readdir} = await import('node:fs/promises');
    const nativeEffectCatalog = new Map();
    for (const name of await readdir(new URL('spell-effects/', base))) {
        const effect = JSON.parse(await readFile(new URL(`spell-effects/${name}`, base), 'utf8')); const rules = effect.system?.rules ?? [];
        nativeEffectCatalog.set(effect.name, {id: effect._id, name: effect.name, type: effect.type, sourceFile: `spell-effects/${name}`,
            automation: {ruleKeys: [...new Set(rules.map(rule => rule.key))], requiresConfiguration: rules.some(rule => rule.key === 'ChoiceSet'), removesAfterRoll: false},
            mechanics: {rules, duration: effect.system?.duration ?? null, start: effect.system?.start ?? null}});
    }
    const plan = compileAbility(await spell('rank-8/roar-of-freedom'), {nativeEffectCatalog, referencedSpells: new Map()});
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.resolution.allySplit.tempHP, {base: 15, step: 5, rank: 8, duration: '1 minute'});
    assert.equal(plan.resolution.allySplit.healing, null);
    assert.deepEqual([plan.resolution.attackAdjustment.appliesTo, plan.resolution.attackAdjustment.choices.map(choice => choice.value)], ['save', [-2, 0]]);
    assert.deepEqual(plan.targeting.actorConstraints.predicates.map(predicate => predicate.kind), ['enemy-of-caster']);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => `${effect.slug}${effect.value}`).sort(), ['frightened2', 'stupefied2']);
});

test('Turnip Lantern: its duration from PF2e\'s Target field, PF2e\'s aura on the caster, and the caster\'s light', async () => {
    const {readdir} = await import('node:fs/promises');
    const nativeEffectCatalog = new Map();
    for (const name of await readdir(new URL('spell-effects/', base))) {
        const effect = JSON.parse(await readFile(new URL(`spell-effects/${name}`, base), 'utf8')); const rules = effect.system?.rules ?? [];
        nativeEffectCatalog.set(effect.name, {id: effect._id, name: effect.name, type: effect.type, sourceFile: `spell-effects/${name}`,
            automation: {ruleKeys: [...new Set(rules.map(rule => rule.key))], requiresConfiguration: rules.some(rule => rule.key === 'ChoiceSet'), removesAfterRoll: false},
            mechanics: {rules, duration: effect.system?.duration ?? null, start: effect.system?.start ?? null}});
    }
    const plan = compileAbility(await spell('rank-1/turnip-lantern'), {nativeEffectCatalog, referencedSpells: new Map()});
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.lifecycle.durationSpec.value, plan.lifecycle.durationSpec.unit], ['effect', 'automatic', 1, 'minutes']);
    assert.equal(plan.nativeEffects.onUse[0].label, 'Aura: Turnip Lantern');
    assert.deepEqual([plan.resolution.casterLight.bright, plan.resolution.casterLight.dim], [20, 40]);
});

test('Kiss the Ring: the GM\'s degree question for creatures ranked below the caster, frightened, compelled, and only a failure ends on the caster\'s hostility', async () => {
    const plan = compile(await spell('rank-6/kiss-the-ring'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.match(plan.resolution.degreeAdjustment.predicate.question, /rank below the caster in a shared hierarchical organization/);
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].noteEffects.map(note => note.label)),
        [['No hostile actions against the caster', 'Ends if the caster is hostile', 'Compelled'], ['No hostile actions against the caster', 'Compelled']]);
    assert.ok([...plan.resolution.outcomes.failure.noteEffects, ...plan.resolution.outcomes.criticalFailure.noteEffects].every(validNoteEffect));
});

test('Devil\'s Horseshoe: a ward the GM triggers for each fiend passing through, the rows\' conditions and the silver note', async () => {
    const {isExecutableStoredTriggerPlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/devils-horseshoe'));
    assert.equal(isExecutableStoredTriggerPlan(plan), true);
    assert.deepEqual([plan.resolution.storedTrigger.ward, plan.resolution.storedTrigger.endsOnTrigger, plan.resolution.storedTrigger.durationSeconds], [true, false, 28800]);
    const rows = plan.resolution.outcomes;
    assert.deepEqual(rows.failure.effects.map(effect => `${effect.slug}${effect.value}`).sort(), ['enfeebled1', 'stupefied1']);
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => rows[degree].noteEffects.map(note => `${note.duration.value} ${note.duration.unit}`)), [['1 rounds'], ['1 minutes'], ['10 minutes']]);
});
