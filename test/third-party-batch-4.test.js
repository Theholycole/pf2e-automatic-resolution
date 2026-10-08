import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility, normalizeLegacyLinks} from '../src/compiler/compile-ability.js';
import {heightenedForVersion, selectGlyphVersion} from '../src/compiler/glyph-versions.js';
import {readConditionRider} from '../src/compiler/basic-feature-riders.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {validNoteEffect, validRowNoteRule} from '../scripts/note-effects.js';

// Third-party batch 4 (2026-10-06): Ray of Light's riders, effect-note proofs (Cosmic Tune, Virtue's Light, Glutton For Blood, Dual-Pattern Strike),
// plain degree headings (Explosive Crescendo), and the "Dynamic" spells' versions by action glyph.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', automation: {ruleKeys: [], requiresConfiguration: true, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = source => compileAbility(source, {nativeEffectCatalog: catalog, referencedSpells: new Map()});
function mergeDeep(target, patch) { for (const [key, value] of Object.entries(patch)) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) ? mergeDeep(target[key], value) : value; return target; }
const version = (name, time) => {
    const source = spell(name);
    const [, overlay] = Object.entries(source.system.overlays).find(([, entry]) => entry.system?.time?.value === String(time));
    const merged = structuredClone(source); merged.system = mergeDeep(merged.system, structuredClone(overlay.system)); delete merged.system.overlays;
    return merged;
};

test("Ray of Light: the GM's save question, Dazzled on a failure, Blinded then Dazzled for 11 rounds, the light and the line's length", () => {
    const plan = compile(spell('Ray of Light'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.attackAdjustment.choices.map(choice => choice.value), [-2, 0]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => `${effect.slug}:${effect.duration.value}`), ['blinded:1', 'dazzled:11']);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['area-light', 'area-size']);
});

test('effect-note proofs: Cosmic Tune, Virtue\'s Light, Glutton For Blood, Dual-Pattern Strike', () => {
    const tune = compile(spell('Cosmic Tune'));
    assert.equal(tune.resolution.effectNote.recipient, 'target');
    assert.ok(tune.resolution.effectNote.proof);
    const light = compile(spell("Virtue's Light"));
    assert.equal(light.resolution.effectNote.targetTrait, 'unholy');
    assert.equal(light.resolution.effectNote.proof.weaknessStacks, true);
    assert.equal(compile(spell('Glutton For Blood')).resolution.effectNote.recipient, 'source');
    const dual = compile(spell('Dual-Pattern Strike')).resolution.effectNote.proof;
    assert.equal(dual.confirm, 'Did both Strikes hit the target?');
    assert.deepEqual(dual.ruleOverrides.map(override => override.remove ? `remove ${override.index}` : `${override.index}:${override.patch.value}`), ['2:2+floor((@item.level - 1)/2)*1', 'remove 1']);
});

test('plain-text degree headings and a misspelt one read as PF2e\'s', () => {
    const fixed = normalizeLegacyLinks({type: 'spell', system: {description: {value: '<p>Failure The target is x.</p><p><strong>Critical Failura</strong> y</p>'}}});
    assert.equal(fixed.system.description.value, '<p><strong>Failure</strong> The target is x.</p><p><strong>Critical Failure</strong> y</p>');
    assert.equal(inspectSavePlan(compile(spell('Explosive Crescendo'))).supported, true);
});

test('Dynamic spells: each version its own text, damage and heightening', () => {
    assert.equal(heightenedForVersion('The damage increases by 1d6 for the one-action version or by 2d6 for the two-action and three-action versions.', 2), 'The damage increases by 2d6.');
    assert.equal(heightenedForVersion('The damage of the 2-action and 3-action versions of the spell increases by 1d8.', 1), '');
    assert.equal(heightenedForVersion('For the two-action and three-action versions of the spell, the damage increases by 1d6.', 3), 'The damage increases by 1d6.');
    const breathe = selectGlyphVersion(version('Dynamic Breathe Fire', 2));
    assert.match(breathe.system.description.value, /Creatures in the area take 2d6 fire damage with a basic Reflex save\./);
    assert.deepEqual(Object.values(breathe.system.heightening.damage), ['2d6']);
    for (const [name, times] of [['Dynamic Breathe Fire', [1, 2, 3]], ['Dynamic Daze', [1, 2, 3]], ['Dynamic Void Warp', [1, 2, 3]], ['Dynamic Haunting Hymn', [1, 2, 3]], ['Dynamic Lightning Bolt', [1, 2]], ['Dynamic Fireball', [1, 2]]])
        for (const time of times) assert.equal(inspectSavePlan(compile(version(name, time))).supported, true, `${name} ${time}`);
    // The one-action version's immunity is that version's own.
    assert.match(compile(version('Dynamic Void Warp', 1)).resolution.temporaryImmunity.key, /:1-action$/);
    // Daze's one-action version: off-guard to the caster's next attack.
    const note = compile(version('Dynamic Daze', 1)).resolution.outcomes.failure.noteEffects[0];
    assert.equal(note.consumedBySourceAttack, true);
    assert.ok(validNoteEffect(note));
});

test('condition riders in third-party wording', () => {
    const enfeebled = readConditionRider('On a failed save, the target is @UUID[Compendium.pf2e.conditionitems.Item.MIRkyAjyBeXivMa7]{Enfeebled 1} until the start of your next turn (@UUID[Compendium.pf2e.conditionitems.Item.MIRkyAjyBeXivMa7]{Enfeebled 2} on a critical failure).');
    assert.deepEqual([enfeebled.failure[0].value, enfeebled.criticalFailure[0].value], [1, 2]);
    assert.deepEqual(Object.keys(readConditionRider("If a target critically fails the save, it's also deafened for 1 minute.")), ['criticalFailure']);
    assert.equal(readConditionRider('If the target fails its save, it is also off-guard.'), null);
    assert.ok(validRowNoteRule({key: 'Weakness', type: ['bludgeoning', 'electricity'], value: '(@item.level+1)*2'}));
});
