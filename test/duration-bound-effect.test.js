import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';

const root = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
async function compileWithEffect(spellPath, effectFile) {
    const source = await read(`spells/spells/${spellPath}`), effect = await read(`spell-effects/${effectFile}`);
    const rules = effect.system?.rules ?? [];
    const profile = {id: effect._id, name: effect.name, type: effect.type, sourceFile: effectFile, automation: {
        ruleKeys: [...new Set(rules.map(rule => rule.key).filter(Boolean))],
        requiresConfiguration: rules.some(rule => rule.key === 'ChoiceSet'),
        removesAfterRoll: rules.some(rule => rule.removeAfterRoll != null)}, mechanics: {rules, duration: effect.system?.duration ?? null}};
    return compileAbility(source, {nativeEffectCatalog: new Map([[profile.name, profile], [profile.id, profile]])});
}
// Enabled as proven automation: Effect + note (user decision, counted apart) isn't this rule's route.
const enabled = plan => SUPPORTED_RESOLUTION_KINDS.includes(plan.resolution.kind) && plan.resolution.kind !== 'effect-note';

test('a duration-bound buff applies its single Effect to the target or, without a target, to the caster', async () => {
    const heroism = await compileWithEffect('rank-3/heroism.json', 'spell-effect-heroism.json');
    assert.ok(enabled(heroism));
    assert.deepEqual([heroism.nativeEffects.onUse[0].recipient.actor, heroism.nativeEffects.onUse[0].recipient.evidence], ['target', 'duration-bound-target']);
    const resist = await compileWithEffect('rank-2/resist-energy.json', 'spell-effect-resist-energy.json');
    assert.ok(enabled(resist));
    assert.equal(resist.automation.level, 'prompted', 'the energy type comes from PF2e’s ChoiceSet prompt');
    const wings = await compileWithEffect('rank-5/dragon-wings.json', 'spell-effect-dragon-wings.json');
    assert.ok(enabled(wings));
    assert.equal(wings.nativeEffects.onUse[0].recipient.actor, 'source');
});

test('the rule refuses another named recipient, mixed recipients, an embedded cast and incomplete Effects', async () => {
    // "Your eidolon gains Fast Healing": not the caster.
    assert.equal(enabled(await compileWithEffect('rank-2/lifelink-surge.json', 'spell-effect-lifelink-surge.json')), false);
    // Target plus "you gain the Dragon's Protection reaction".
    assert.equal(enabled(await compileWithEffect('rank-5/divine-dragons-watch.json', 'spell-effects-divine-dragons-watch.json')), false);
    // "You cast Ignition as part of casting flaming fusillade."
    assert.equal(enabled(await compileWithEffect('rank-6/flaming-fusillade.json', 'spell-effect-flaming-fusillade.json')), false);
    // (Sweet Dream is enabled since batch 133: its "falls Unconscious" sentence is PF2e's condition applied with the Effect, and waking
    // early is a GM note. With another condition sentence it stays refused.)
    const dream = await compileWithEffect('rank-1/sweet-dream.json', 'spell-effect-sweet-dream.json');
    assert.equal(dream.resolution.castCondition?.slug, 'unconscious');
});

test('a reaction applies its linked Effect to the explicit recipient when cast', async () => {
    const might = await compileWithEffect('rank-4/enduring-might.json', 'spell-effect-enduring-might.json');
    assert.ok(enabled(might));
    assert.deepEqual([might.nativeEffects.onUse[0].recipient.actor, might.nativeEffects.onUse[0].reactionCast], ['source', true]);
    const barrier = await compileWithEffect('rank-4/flame-barrier.json', 'spell-effect-flame-barrier.json');
    assert.ok(enabled(barrier));
    assert.equal(barrier.nativeEffects.onUse[0].recipient.actor, 'target');
    assert.equal(barrier.targeting.actorConstraints.complete, true, '"the creature that would take fire damage" is the caster-picked target');
    const absorption = await compileWithEffect('rank-4/energy-absorption.json', 'spell-effect-energy-absorption.json');
    assert.equal(absorption.automation.level, 'prompted');
});

test('reactions with mechanics outside their Effect stay blocked', async () => {
    for (const [spell, effect, why] of [
        ['rank-4/repel-metal.json', 'spell-effect-repel-metal.json', 'redirected Strike and immunity to this spell'],
        ['rank-2/warping-pull.json', 'spell-effect-warping-pull.json', 'teleport'],
        ['rank-3/battlefield-persistence.json', 'spell-effect-battlefield-persistence.json', 'incapacitation level adjustment'],
        // (Practice Makes Perfect re-grades the triggering check since batch 142; its unlimited Effect isn't applied.)
    ]) assert.equal(enabled(await compileWithEffect(spell, effect)), false, why);
    // (Bottle the Storm's follow-up spell attack is its own stored charge since rank 4 batch 115, not PF2e's Effect.)
    assert.equal((await compileWithEffect('rank-4/bottle-the-storm.json', 'spell-effect-bottle-the-storm.json')).resolution.kind, 'stored-charge');
    // (Community Restoration's division among allies is its own since rank 4 batch 116.)
    assert.equal((await compileWithEffect('rank-4/community-restoration.json', 'spell-effect-community-restoration.json')).resolution.kind, 'shared-temp-hp');
});

test('an area ally buff targets the caster (when named) and allies in its emanation', async () => {
    const courageous = await compileWithEffect('cantrip/courageous-anthem.json', 'spell-effect-courageous-anthem.json');
    assert.ok(enabled(courageous));
    assert.deepEqual([courageous.nativeEffects.onUse[0].recipient.actor, courageous.nativeEffects.onUse[0].recipient.includeSelf, courageous.nativeEffects.onUse[0].recipient.area],
        ['area-allies', true, {type: 'emanation', value: 60}]);
    const valiant = await compileWithEffect('rank-2/valiant-anthem.json', 'spell-effect-valiant-anthem.json');
    assert.ok(enabled(valiant));
    assert.equal(valiant.nativeEffects.onUse[0].recipient.includeSelf, false, '"Your allies in the area gain" excludes the caster');
    // An aura that applies "while within the emanation" is ongoing, not a cast-time grant.
    assert.equal(enabled(await compileWithEffect('rank-1/benediction.json', 'spell-effect-benediction.json')), false);
});

test('companion, eidolon and plural targets; native PF2e auras apply to their centre', async () => {
    const hide = await compileWithEffect('rank-1/magic-hide.json', 'spell-effect-magic-hide.json');
    assert.ok(enabled(hide));
    assert.equal(hide.nativeEffects.onUse[0].recipient.actor, 'target');
    assert.equal(hide.targeting.actorConstraints.complete, true, '"your animal companion" is a caster-picked target');
    const sphere = await compileWithEffect('rank-4/protectors-sphere.json', 'aura-protectors-sphere.json');
    assert.ok(enabled(sphere));
    assert.deepEqual([sphere.nativeEffects.onUse[0].recipient.actor, sphere.nativeEffects.onUse[0].recipient.evidence], ['source', 'native-aura-centre']);
    // Radius growth on Sustain isn't in the Effect. "The newer spell replaces the older one" is the runtime's replacement rule.
    assert.equal(enabled(await compileWithEffect('rank-1/protective-wards.json', 'aura-protective-wards.json')), false);
    const boost = await compileWithEffect('cantrip/boost-eidolon.json', 'spell-effect-boost-eidolon.json');
    assert.equal(enabled(boost), true);
    assert.deepEqual(boost.resolution.replaces.spells, ['Reinforce Eidolon']);
});
