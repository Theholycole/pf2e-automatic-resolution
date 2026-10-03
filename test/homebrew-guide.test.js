// Every example in docs/homebrew-spells.md, compiled as a detached homebrew
// spell. If a guide example stops compiling, this fails and the guide is stale.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isExecutableStoredTriggerPlan, storedTriggerExposurePlan} from '../scripts/basic-save-core.js';
import {isExecutableCarePlan} from '../scripts/affliction-care-core.js';
import {isExecutableMessagePlan} from '../scripts/message-core.js';
import {SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';

const root = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const C = id => `Compendium.pf2e.conditionitems.Item.${id}`;
const CLUMSY = C('i3OJZU2nk64Df3xm'), FRIGHTENED = C('TBSHQspnbcqxsmjL'), SLOWED = C('xYTAsEpcJE1Ccni3'),
    SICKENED = C('fesd1n5eVhpCSS18'), IMMOBILIZED = C('eIcWbB5o3pP6OIMe'), ENFEEBLED = C('MIRkyAjyBeXivMa7');

/** A homebrew spell: a real item shape with a new name, slug, ID and no compendium source. */
async function homebrew(basePath, {name, description, system = {}}) {
    const item = structuredClone(await read(`spells/spells/${basePath}`));
    item._id = 'homebrewGuide0001';
    if (item._stats) delete item._stats.compendiumSource;
    item.name = name;
    item.system.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    item.system.rules = [];
    Object.assign(item.system, system);
    item.system.description.value = description;
    return item;
}
const saveRoute = plan => inspectSavePlan(plan);

test('guide 1: a basic-save damage spell', async () => {
    const spell = await homebrew('cantrip/electric-arc.json', {name: 'Frost Lash',
        description: '<p>A whip of frost lashes the target, dealing 2d6 cold damage with a basic Reflex save.</p><hr /><p><strong>Heightened (+1)</strong> The damage increases by 1d6.</p>',
        system: {damage: {0: {applyMod: false, category: null, formula: '2d6', kinds: ['damage'], materials: [], type: 'cold'}},
            heightening: {type: 'interval', interval: 1, damage: {0: '1d6'}}, target: {value: '1 creature'}}});
    assert.equal(saveRoute(compileAbility(spell)).supported, true);
});

test('guide 2: a basic save with a degree rider', async () => {
    const spell = await homebrew('cantrip/electric-arc.json', {name: 'Numbing Bolt',
        description: `<p>A bolt of numbing cold deals 2d6 cold damage with a basic Fortitude save. On a critical failure, the target is also @UUID[${CLUMSY}]{Clumsy 1} for 1 round.</p>`,
        system: {damage: {0: {applyMod: false, category: null, formula: '2d6', kinds: ['damage'], materials: [], type: 'cold'}},
            defense: {save: {basic: true, statistic: 'fortitude'}}, heightening: null, target: {value: '1 creature'}}});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => [e.slug, e.value, e.duration?.value]), [['clumsy', 1, 1]]);
});

test('guide 3: a degree-table save with conditions, timers, Escape and a recurring save', async () => {
    const spell = await homebrew('rank-1/fear.json', {name: 'Grasping Dread',
        description: `<p>Shadowy hands clutch at the target, which must attempt a Will save.</p><hr />`
            + `<p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target is @UUID[${FRIGHTENED}]{Frightened 1}.</p>`
            + `<p><strong>Failure</strong> The target is @UUID[${FRIGHTENED}]{Frightened 2} and @UUID[${SLOWED}]{Slowed 1} for 1 round.</p>`
            + `<p><strong>Critical Failure</strong> The target is @UUID[${FRIGHTENED}]{Frightened 3} and @UUID[${IMMOBILIZED}]{Immobilized} until it Escapes (the DC is your spell DC).</p>`,
        system: {duration: {sustained: false, value: ''}, heightening: null}});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    const immobilized = plan.resolution.outcomes.criticalFailure.effects.find(e => e.slug === 'immobilized');
    assert.equal(immobilized.expirationMode, 'event');

    const recurring = await homebrew('rank-1/fear.json', {name: 'Lingering Chill',
        description: `<p>Biting cold seeps into the target, which must attempt a Fortitude save.</p><hr />`
            + `<p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target is @UUID[${ENFEEBLED}]{Enfeebled 1} for 1 round.</p>`
            + `<p><strong>Failure</strong> The target is @UUID[${ENFEEBLED}]{Enfeebled 2} for 1 minute. It can attempt a new Fortitude save at the end of each of its turns to end the enfeebled condition.</p>`
            + `<p><strong>Critical Failure</strong> As failure, but the target is @UUID[${ENFEEBLED}]{Enfeebled 3}.</p>`,
        system: {defense: {save: {basic: false, statistic: 'fortitude'}}, duration: {sustained: false, value: ''}, heightening: null}});
    assert.equal(saveRoute(compileAbility(recurring)).supported, true, JSON.stringify(saveRoute(compileAbility(recurring)).blockers));
});

test('guide 2b: basic-save phrasings (creature-type area damage, environment narration)', async () => {
    const undead = await homebrew('cantrip/electric-arc.json', {name: 'Sunburst Lite',
        description: '<p>A flare of sunlight scorches the dead. Each undead creature in the area takes 4d6 vitality damage.</p>',
        system: {damage: {0: {applyMod: false, category: null, formula: '4d6', kinds: ['damage'], materials: [], type: 'vitality'}},
            defense: {save: {basic: true, statistic: 'fortitude'}}, heightening: null, target: {value: ''}, area: {type: 'burst', value: 10}}});
    const plan = compileAbility(undead);
    assert.equal(saveRoute(plan).supported, true);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'trait', slug: 'undead', present: true}]);
    const wave = await homebrew('cantrip/electric-arc.json', {name: 'Little Wave',
        description: '<p>A wave sweeps away from you. You deal 3d6 bludgeoning damage to creatures in the area. The water also extinguishes non-magical fires in the area.</p>',
        system: {damage: {0: {applyMod: false, category: null, formula: '3d6', kinds: ['damage'], materials: [], type: 'bludgeoning'}},
            heightening: null, target: {value: ''}, area: {type: 'cone', value: 15}}});
    assert.equal(saveRoute(compileAbility(wave)).supported, true);
});

test('guide 3b: a terrestrial-only save with plus-damage on a critical failure', async () => {
    const spell = await homebrew('rank-1/shockwave.json', {name: 'Ground Ripple',
        description: '<p>The ground ripples beneath your foes. Terrestrial creatures in the affected area must attempt a Reflex save.</p><hr />'
            + '<p><strong>Critical Success</strong> The creature is unaffected.</p>'
            + '<p><strong>Success</strong> The creature is @UUID[Compendium.pf2e.conditionitems.Item.AJh5ex99aV6VTggg]{Off-Guard} until the start of its next turn.</p>'
            + '<p><strong>Failure</strong> The creature falls @UUID[Compendium.pf2e.conditionitems.Item.j91X7x0XSomq8d60]{Prone}.</p>'
            + '<p><strong>Critical Failure</strong> As failure, plus the creature takes 1d6 bludgeoning damage.</p>',
        system: {heightening: null}});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.equal(plan.targeting.actorConstraints.predicates.at(-1).kind, 'gm-confirmed');
    assert.equal(plan.resolution.outcomes.criticalFailure.damage.mode, 'shared');
});

test('guide 4: a buff that applies an official PF2e spell Effect', async () => {
    const spell = await homebrew('rank-3/heroism.json', {name: 'Minor Valor',
        description: '<p>You steel an ally, granting it a +1 status bonus to attack rolls, Perception checks, saving throws, and skill checks.</p>'
            + '<p>@UUID[Compendium.pf2e.spell-effects.Item.Spell Effect: Heroism]{Spell Effect: Heroism}</p>',
        system: {duration: {sustained: false, value: '1 minute'}, heightening: null}});
    const effect = await read('spell-effects/spell-effect-heroism.json');
    const profile = {id: effect._id, name: effect.name, type: effect.type, automation: {ruleKeys: ['FlatModifier'], requiresConfiguration: false, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules, duration: effect.system.duration}};
    const plan = compileAbility(spell, {nativeEffectCatalog: new Map([[profile.name, profile], [profile.id, profile]])});
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes(plan.resolution.kind));
    assert.equal(plan.nativeEffects.onUse[0].recipient.actor, 'target');
});

test('guide 4: a buff whose Heightened entry lengthens its duration', async () => {
    const spell = await homebrew('rank-4/fly.json', {name: 'Soaring Gift',
        description: '<p>The target can fly.</p><p>@UUID[Compendium.pf2e.spell-effects.Item.Spell Effect: Fly]{Spell Effect: Fly}</p>'
            + '<hr /><p><strong>Heightened (7th)</strong> The duration increases to 1 hour.</p>',
        system: {duration: {sustained: false, value: '5 minutes'}, heightening: null}});
    const effect = await read('spell-effects/spell-effect-fly.json');
    const profile = {id: effect._id, name: effect.name, type: effect.type, automation: {ruleKeys: [...new Set(effect.system.rules.map(rule => rule.key))], requiresConfiguration: false, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules, duration: effect.system.duration}};
    const plan = compileAbility(spell, {nativeEffectCatalog: new Map([[profile.name, profile], [profile.id, profile]])});
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes(plan.resolution.kind));
    assert.equal(plan.automation.level, 'automatic');
    assert.deepEqual(plan.resolution.applications[0].heightenedDuration.branches.map(branch => [branch.minRank, branch.maxRank, branch.value, branch.unit]), [[7, null, 1, 'hours']]);
});

test('guide 4b: an area buff for you and your allies', async () => {
    const spell = await homebrew('cantrip/courageous-anthem.json', {name: 'Rousing Chant',
        description: '<p>Your chant stirs your companions. You and all allies in the area gain a +1 status bonus to attack rolls, damage rolls, and saves against fear effects.</p>'
            + '<p>@UUID[Compendium.pf2e.spell-effects.Item.Spell Effect: Courageous Anthem]{Spell Effect: Courageous Anthem}</p>',
        system: {duration: {sustained: false, value: '1 round'}, area: {type: 'emanation', value: 30}, target: {value: ''}, heightening: null}});
    const effect = await read('spell-effects/spell-effect-courageous-anthem.json');
    const rules = effect.system.rules;
    const profile = {id: effect._id, name: effect.name, type: effect.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: false, removesAfterRoll: false},
        mechanics: {rules, duration: effect.system.duration}};
    const plan = compileAbility(spell, {nativeEffectCatalog: new Map([[profile.name, profile], [profile.id, profile]])});
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes(plan.resolution.kind));
    assert.deepEqual(plan.nativeEffects.onUse[0].recipient.area, {type: 'emanation', value: 30});
});

test('guide 4c: a buff for your animal companion', async () => {
    const spell = await homebrew('rank-1/magic-hide.json', {name: 'Bark Coat',
        description: '<p>Your animal companion grows a coat of bark, granting it a +1 status bonus to AC.</p>'
            + '<p>@UUID[Compendium.pf2e.spell-effects.Item.Spell Effect: Magic Hide]{Spell Effect: Magic Hide}</p>',
        system: {duration: {sustained: false, value: '1 minute'}, target: {value: 'your animal companion'}, heightening: null}});
    const effect = await read('spell-effects/spell-effect-magic-hide.json');
    const profile = {id: effect._id, name: effect.name, type: effect.type, automation: {ruleKeys: [...new Set(effect.system.rules.map(r => r.key))], requiresConfiguration: false, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules, duration: effect.system.duration}};
    const plan = compileAbility(spell, {nativeEffectCatalog: new Map([[profile.name, profile], [profile.id, profile]])});
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes(plan.resolution.kind));
});

test('guide 3c: a lingering damage area', async () => {
    const spell = await homebrew('rank-4/petal-storm.json', {name: 'Thorn Squall',
        description: '<p>A squall of thorns whirls through the area. A creature that enters the squall or starts its turn in the squall takes 2d10 piercing damage with a basic Reflex save. A creature can take damage from the thorns only once per round.</p>',
        system: {damage: {0: {applyMod: false, category: null, formula: '2d10', kinds: ['damage'], materials: [], type: 'piercing'}}, heightening: null,
            area: {type: 'burst', value: 15}, duration: {sustained: false, value: '1 minute'}}});
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const plan = compileAbility(spell);
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(plan.automation.pendingCapabilities));
    assert.deepEqual(plan.resolution.lingering.events, ['enter', 'turn-start']);
});

test('guide 3c: a sustained lingering emanation with concealment', async () => {
    const spell = await homebrew('rank-4/songbirds-call.json', {name: 'Moth Cloud',
        description: '<p>A swarm of moths flutters around you. All creatures within the moth cloud become concealed, and all creatures outside the moth cloud become concealed to creatures within it. A creature other than you that enters or ends its turn in the area takes 1d6 slashing damage as the moths batter it.</p>',
        system: {damage: {0: {applyMod: false, category: null, formula: '1d6', kinds: ['damage'], materials: [], type: 'slashing'}}, heightening: null,
            area: {type: 'emanation', value: 10}, duration: {sustained: true, value: '1 minute'}, defense: {save: {basic: true, statistic: 'reflex'}}}});
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const plan = compileAbility(spell);
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(plan.automation.pendingCapabilities));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.centre, lingering.sustained, lingering.concealment, lingering.excludeCaster], [['enter', 'turn-end'], 'caster', true, true, true]);
});

test('guide 3c: damage when cast and on each Sustain', async () => {
    const spell = await homebrew('rank-4/petal-storm.json', {name: 'Ember Vortex',
        description: '<p>Embers swirl through the area. When you Cast the Spell and the first time you Sustain it each round, each creature in the area takes 2d10 slashing damage (basic Reflex save).</p>',
        system: {duration: {sustained: true, value: '1 minute'}}});
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const plan = compileAbility(spell);
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(plan.automation.pendingCapabilities));
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.initial], [['sustain'], true]);
});

test('guide 3c: a lingering area with a degree-of-success table', async () => {
    const spell = await homebrew('rank-2/breath-of-drought.json', {name: 'Choking Dust',
        description: '<p>Choking dust fills the area. Each creature in the area when the spell is cast or that ends its turn in the area afterward must attempt a Fortitude save.</p>'
            + `<p><strong>Success</strong> The creature is unaffected.</p><p><strong>Failure</strong> The creature is @UUID[${SICKENED}]{Sickened 1}.</p>`
            + `<p><strong>Critical Failure</strong> The creature is @UUID[${SICKENED}]{Sickened 2}.</p>`,
        system: {duration: {sustained: false, value: '1 minute'}}});
    const {isExecutableLingeringPlan, lingeringExposurePlan} = await import('../scripts/basic-save-core.js');
    const plan = compileAbility(spell);
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(plan.automation.pendingCapabilities));
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.initial, plan.resolution.lingering.durationSeconds], [['turn-end'], true, 60]);
    assert.equal(lingeringExposurePlan(plan).resolution.outcomes.criticalFailure.effects[0].slug, 'sickened');
    // "Each enemy" narrows it to enemies of the caster; other qualifiers block it.
    const enemies = compileAbility(await homebrew('rank-2/breath-of-drought.json', {name: 'Choking Dust',
        description: spell.system.description.value.replace('Each creature in the area', 'Each enemy in the area'), system: {duration: {sustained: false, value: '1 minute'}}}));
    assert.equal(isExecutableLingeringPlan(enemies), true);
    assert.equal(enemies.resolution.lingering.enemiesOnly, true);
    const living = compileAbility(await homebrew('rank-2/breath-of-drought.json', {name: 'Choking Dust',
        description: spell.system.description.value.replace('Each creature in the area', 'Each living creature in the area'), system: {duration: {sustained: false, value: '1 minute'}}}));
    assert.equal(isExecutableLingeringPlan(living), false);
});

test('guide 3: enemies-only area saves', async () => {
    const spell = await homebrew('cantrip/shatter-mind.json', {name: 'Mind Needles',
        description: '<p>You deal 3d4 mental damage to all enemies in the area, with a basic Will save.</p>'});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.deepEqual(plan.targeting.actorConstraints.predicates.map(p => p.kind), ['enemy-of-caster']);
    // A qualified enemy group gets no enemy rule.
    const qualified = compileAbility(await homebrew('cantrip/shatter-mind.json', {name: 'Mind Needles',
        description: '<p>You deal 3d4 mental damage to all enemies in the area other than dragons, with a basic Will save.</p>'}));
    assert.equal(qualified.targeting.actorConstraints.predicates.some(p => p.kind === 'enemy-of-caster'), false);
});

test('guide 3c: different damage on Sustain', async () => {
    const spell = await homebrew('rank-2/animated-assault.json', {name: 'Debris Storm',
        description: '<p>Debris lifts from the ground and hurls itself around. This assault deals 2d10 bludgeoning damage (basic Reflex save) to each creature in the area. On subsequent rounds, the first time each round you Sustain this Spell, it deals @Damage[(floor(@item.level/2))d10[bludgeoning]] damage (basic Reflex save) to each creature in the area.</p>'});
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const plan = compileAbility(spell);
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(plan.automation.pendingCapabilities));
    assert.equal(plan.resolution.lingering.sustainDamage.formula, '(floor(@item.level/2))d10[bludgeoning]');
});

test('guide 3: one-sentence tables', async () => {
    const spell = await homebrew('cantrip/information-overload.json', {name: 'Sudden Dread',
        description: `<p>Dread fills the target. The target must succeed at a Will save or become @UUID[${FRIGHTENED}]{Frightened 1} (or @UUID[${FRIGHTENED}]{Frightened 2} on a critical failure).</p>`,
        system: {duration: {sustained: false, value: ''}}});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.deepEqual(['failure', 'criticalFailure'].map(d => plan.resolution.outcomes[d].effects.map(e => [e.slug, e.value])), [[['frightened', 1]], [['frightened', 2]]]);
});

test('guide 3: sustained spells with a table', async () => {
    const {isSustainedConditionPlan} = await import('../scripts/basic-save-core.js');
    const spell = await homebrew('rank-1/unexpected-windfall.json', {name: 'Leaden Coins',
        description: '<p>Heavy coins rain down. The target must attempt a Fortitude save.</p><p><strong>Critical Success</strong> The target is unaffected.</p>'
            + '<p><strong>Success</strong> The target is @UUID[Compendium.pf2e.conditionitems.Item.D5mg6Tc7Jzrj6ro7]{Encumbered} for 1 round.</p>'
            + '<p><strong>Failure</strong> The target is encumbered for the duration of the spell.</p><p><strong>Critical Failure</strong> As failure.</p>'});
    const plan = compileAbility(spell);
    assert.equal(isSustainedConditionPlan(plan), true);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    const blocked = compileAbility(await homebrew('rank-1/unexpected-windfall.json', {name: 'Leaden Coins',
        description: spell.system.description.value.replace('Heavy coins rain down.', 'Heavy coins rain down. Each time you Sustain the spell, more coins fall.')}));
    assert.ok(blocked.automation.pendingCapabilities.includes('sustain-effect'));
});

test('guide 3d: spell attacks', async () => {
    const spell = await homebrew('cantrip/divine-lance.json', {name: 'Light Bolt',
        description: "<p>A bolt of light streaks out. Make a ranged spell attack against the target's AC. On a hit, the target takes 2d4 spirit damage (double damage on a critical hit).</p>"});
    const plan = compileAbility(spell);
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    const table = compileAbility(await homebrew('rank-8/polar-ray.json', {name: 'Frost Ray',
        description: `<p>You fire a ray of frost. Make a spell attack roll against the target.</p><p><strong>Critical Success</strong> The target takes double damage and is @UUID[Compendium.pf2e.conditionitems.Item.4D2KBtexWXa6oUMR]{Drained 2}.</p><p><strong>Success</strong> The target takes full damage.</p>`}));
    assert.equal(saveRoute(table).supported, true, JSON.stringify(saveRoute(table).blockers));
    assert.deepEqual(['criticalSuccess', 'success', 'failure'].map(d => table.resolution.outcomes[d].damage?.multiplier ?? 0), [2, 1, 0]);
});

test('guide 3d: several targets with a shared penalty', async () => {
    const spell = await homebrew('cantrip/slashing-gust.json', {name: 'Twin Darts',
        description: "<p>Darts fly from your fingers.</p><p>Make a spell attack roll against each target's AC. This deals 2d4 slashing damage. If you're attacking two creatures, this counts as two attacks for your multiple attack penalty, but the penalty doesn't increase until after both attacks.</p><p><strong>Critical Success</strong> The target takes double damage.</p><p><strong>Success</strong> The target takes full damage.</p>"});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.equal(plan.resolution.check.sharedMultipleAttackPenalty, true);
});

test('guide 3: extra damage by creature trait', async () => {
    const spell = await homebrew('rank-4/holy-cascade.json', {name: 'Sacred Deluge',
        description: '<p>A torrent of blessed water crashes down, dealing 3d6 bludgeoning damage to creatures in the area. The water deals an additional @Damage[((@item.level*2)-2)d6[spirit]] damage to creatures with the unholy trait in the area.</p>'});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.equal(plan.resolution.conditionalDamage[0].trait, 'unholy');
});

test('guide 3d: pushes and pulls', async () => {
    const spell = await homebrew('cantrip/imaginary-weapon.json', {name: 'Force Hammer',
        description: "<p>A hammer of force swings out. Make a melee spell attack roll against your target's AC. If you hit, you deal 2d6 force damage. On a critical success, you deal double damage and can choose to detonate your weapon to push the target 10 feet away from you.</p>"});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.deepEqual(plan.resolution.outcomes.criticalSuccess.forcedMovement, {kind: 'push', distance: 10, upTo: false, optional: true, direction: 'away'});
});

test('guide 3d: persistent damage not doubled on a critical hit', async () => {
    const spell = await homebrew('rank-2/acid-arrow.json', {name: 'Corroding Bolt',
        description: '<p>An arrow of acid flies out. Make a spell attack against the target. On a hit, you deal 3d8 acid damage plus @Damage[(floor(@item.rank/2))d6[persistent,acid]] damage. On a critical hit, double the initial damage, but not the persistent damage.</p>'});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.equal(plan.resolution.outcomes.criticalSuccess.damage.shared.multiplier, 2);
});

test('guide 3d: silver damage', async () => {
    const spell = await homebrew('rank-1/moonbeam.json', {name: 'Silver Beam',
        description: `<p>You shine a silvery ray. Make a spell attack roll. The beam deals 2d6 fire damage. This is silver damage for the purposes of weaknesses, resistances, and the like.</p><p><strong>Critical Success</strong> The beam deals double damage.</p><p><strong>Success</strong> The beam deals full damage.</p>`});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    const noMaterial = structuredClone(spell); noMaterial.system.damage['0'].materials = [];
    assert.equal(saveRoute(compileAbility(noMaterial)).supported, false);
});

test('guide 3d: a spell attack with several damage entries and a miss row', async () => {
    const spell = await homebrew('cantrip/live-wire.json', {name: 'Copper Lash',
        description: '<p>A copper lash snaps at your foe. The lash deals 1d4 slashing damage and 1d4 electricity damage, depending on your spell attack roll against the target\'s AC.</p>'
            + '<p><strong>Critical Success</strong> The target takes double damage.</p><p><strong>Success</strong> The target takes full damage.</p>'
            + '<p><strong>Failure</strong> The target takes the electricity damage, but not the slashing damage.</p><p><strong>Critical Failure</strong> The target is unaffected.</p>'});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    const electricity = Object.entries(spell.system.damage).find(([, entry]) => entry.type === 'electricity')[0];
    assert.deepEqual(plan.resolution.outcomes.failure.damage.sourceComponentIds, [electricity]);
});

test('guide 3d: a condition that lasts while the persistent damage does', async () => {
    const spell = await homebrew('rank-2/sticky-fire.json', {name: 'Clinging Cinders',
        description: `<p>Cinders cling to your foe. Make a spell attack roll against the target's AC, dealing 1d8 fire damage and 1d8 persistent fire damage on a hit. The target is @UUID[${ENFEEBLED}]{Enfeebled 1} until they recover from their persistent fire damage.</p>`});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.deepEqual(plan.resolution.outcomes.success.effects[0].endsWhen, {event: 'persistent-damage-ended', damageType: 'fire'});
});

test('guide 3d: splash damage', async () => {
    const spell = await homebrew('cantrip/acid-splash.json', {name: 'Caustic Drop',
        description: '<p>A drop of acid bursts on your foe. Make a spell attack. If you hit, you deal 1d6 acid damage plus 1 splash acid damage. On a critical success, the target also takes @Damage[(ceil(@item.level/2))[persistent,acid]] damage.</p>'});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.equal(plan.resolution.splash.radius, 5);
});

test('guide 3d: a damage type carried by a PF2e variant', async () => {
    const spell = await homebrew('cantrip/telekinetic-projectile.json', {name: 'Flung Debris',
        description: '<p>You fling nearby debris. Make a spell attack roll against the target. If you hit, you deal 2d6 bludgeoning, piercing, or slashing damage—as appropriate for the debris.</p><hr /><p><strong>Critical Success</strong> You deal double damage.</p><p><strong>Success</strong> You deal full damage.</p>'});
    delete spell.system.overlays;
    spell.system.damage['0'].type = 'slashing';
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
});

test('guide 3e: a spell with a Strike', async () => {
    const spell = await homebrew('rank-1/thunderous-strike.json', {name: 'Quake Swing',
        description: `<p>You swing your massive weapon, creating a wave of sonic vibrations. Make a melee Strike with your two-handed weapon. Each creature in a 15-foot cone from you must attempt a basic Fortitude save against your spell DC or take 2 sonic damage. On a critical failure, the creature is knocked @UUID[Compendium.pf2e.conditionitems.Item.j91X7x0XSomq8d60]{Prone}. The target of your Strike must be within the cone or the effect fails.</p>`});
    spell.system.requirements = '';
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.equal(plan.resolution.strikePrelude.reach, 'melee');
});

test('guide 3e: a rider on the Strike result', async () => {
    const spell = await homebrew('rank-5/flowing-strike.json', {name: 'Riptide Rush',
        description: "<p>A wave of water carries you forward. You Stride up to 50 feet. This movement doesn't trigger reactions. You can make a Strike at any point during your Stride. If your Strike hits and deals damage, the wave flows after you to batter the target of your Strike, dealing 2d10 bludgeoning damage and pushing it 10 feet in a direction of your choice.</p>"});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.equal(plan.resolution.check.statistic, 'strike');
});

test('guide 3e: an Effect on you that changes the Strike', async () => {
    const effect = await read('spell-effects/effect-force-fling.json');
    const profile = {id: effect._id, name: effect.name, type: effect.type, sourceFile: 'spell-effects', automation: {ruleKeys: [...new Set(effect.system.rules.map(rule => rule.key))], requiresConfiguration: false, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules, duration: effect.system.duration, start: effect.system.start}};
    const spell = await homebrew('rank-1/force-fling.json', {name: 'Echo Blade',
        description: "<p>Make a melee Strike with a weapon you're holding, except that any physical damage the weapon would deal is force damage instead.</p><p>@UUID[Compendium.pf2e.spell-effects.Item.Effect: Force Fling]{Effect: Force Fling}</p>"});
    spell.system.requirements = '';
    const plan = compileAbility(spell, {nativeEffectCatalog: new Map([[profile.name, profile], [profile.id, profile]])});
    assert.equal(plan.resolution.kind, 'strike-effects');
    assert.equal(plan.automation.level, 'automatic');
});

test('guide 3d: an attack bonus against metal targets', async () => {
    const spell = await homebrew('rank-3/magnetic-acceleration.json', {name: 'Lodestone Dart',
        description: '<p>You fling a magnetized dart. Make a ranged spell attack roll; if the target is wearing metal armor or is made of metal, you gain a +1 circumstance bonus to your attack roll with lodestone dart. On a hit, the target takes 3d6 bludgeoning damage and 3d6 piercing damage, or double damage on a critical hit.</p>'});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.equal(plan.resolution.attackAdjustment.question, 'Is the target wearing metal armor or made of metal?');
});

test('guide 3d: a benefit for you carried by the spell\'s Effect', async () => {
    const effect = await read('spell-effects/spell-effect-spiked-carapace.json');
    const profile = {id: effect._id, name: effect.name, type: effect.type, sourceFile: 'spell-effects', automation: {ruleKeys: ['FlatModifier'], requiresConfiguration: false, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules, duration: effect.system.duration, start: effect.system.start}};
    const spell = await homebrew('rank-5/spiked-carapace.json', {name: 'Bone Bracer',
        description: "<p>Make a melee spell attack against a target's AC, dealing 5d8 piercing damage and 1d8 persistent bleed damage (double damage on a critical hit). You gain a +1 circumstance bonus to your AC for the duration.</p><p>@UUID[Compendium.pf2e.spell-effects.Item.Spell Effect: Spiked Carapace]{Spell Effect: Spiked Carapace}</p>"});
    const plan = compileAbility(spell, {nativeEffectCatalog: new Map([[profile.name, profile], [profile.id, profile]])});
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.equal(plan.resolution.casterEffect.when, 'always');
});

test('guide 4b: healing', async () => {
    const spell = await homebrew('rank-1/soothe.json', {name: 'Gentle Mending',
        description: "<p>You grace the target's mind, healing its wounds. The target regains 1d10+4 Hit Points when you Cast the Spell.</p>"});
    const plan = compileAbility(spell);
    assert.equal(plan.resolution.kind, 'healing');
    assert.equal(plan.automation.level, 'automatic', JSON.stringify(plan.automation.pendingCapabilities));
    assert.equal(plan.resolution.healing.formula, '1d10+4');
});

test('guide 4b: heal or harm', async () => {
    const description = '<p>You channel void energy to harm the living or heal the undead. If the target is a living creature, you deal 2d6 void damage to it, and it gets a basic Fortitude save. If the target is a willing undead creature, you restore that amount of Hit Points. The number of actions you spend when Casting this Spell determines its targets, range, area, and other parameters.</p>'
        + '<p>1 The spell has a range of touch.</p><p>2 (concentrate) The spell has a range of 60 feet. If you\'re healing an undead creature, increase the Hit Points restored by 6.</p>'
        + '<p>3 (concentrate) You disperse void energy in a @Template[emanation|distance:15]. This targets all living and undead creatures in the area.</p>';
    const base = await homebrew('rank-1/harm.json', {name: 'Grave Tide', description});
    delete base.system.overlays;
    const cast = (time, system) => { const item = structuredClone(base); Object.assign(item.system, {time: {value: time}}, system); return compileAbility(item); };
    const damage = kinds => ({damage: {'0': {...base.system.damage['0'], formula: '2d6', kinds}}});
    const touch = cast('1', {range: {value: 'touch'}, ...damage(['damage', 'healing'])});
    assert.deepEqual(touch.resolution.dualMode, {energy: 'void'});
    assert.equal(saveRoute(touch).supported, true, JSON.stringify(saveRoute(touch).blockers));
    const area = cast('3', {range: {value: ''}, area: {type: 'emanation', value: 15}, target: {value: 'all living and undead creatures'}, ...damage(['damage', 'healing'])});
    assert.equal(saveRoute(area).supported, true, JSON.stringify(saveRoute(area).blockers));
    const heal = cast('2', {range: {value: '60 feet'}, defense: null, target: {value: '1 willing undead creature'},
        damage: {'0': {...base.system.damage['0'], formula: '2d6+6', kinds: ['healing']}}});
    assert.equal(heal.resolution.kind, 'healing');
    assert.equal(heal.automation.level, 'automatic', JSON.stringify(heal.automation.pendingCapabilities));
    const harm = cast('2', {range: {value: '60 feet'}, target: {value: '1 living creature'}, ...damage(['damage'])});
    assert.equal(saveRoute(harm).supported, true, JSON.stringify(saveRoute(harm).blockers));
    // The base offering every action count isn't resolved; cast a variant.
    assert.equal(saveRoute(compileAbility(base)).supported, false);
});

test('guide 4b: healing or harm by creature, with a self / not-self Effect', async () => {
    const effect = await read('spell-effects/spell-effect-lay-on-hands.json');
    const profile = {id: effect._id, name: effect.name, type: effect.type, sourceFile: 'spell-effects', automation: {ruleKeys: ['FlatModifier', 'AdjustModifier'], requiresConfiguration: false, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules, duration: effect.system.duration, start: effect.system.start}};
    const catalog = new Map([[profile.name, profile], [profile.id, profile]]);
    const description = '<p>Your palm glows with vitality, mending the living and searing the undead.</p>'
        + '<ul><li><strong>Willing Living Creature</strong> The target regains 8 Hit Points. If the target is someone other than yourself, it also gains a +2 status bonus to AC for 1 round.</li>'
        + '<li><strong>Undead Creature</strong> The target takes 2d6 vitality damage with a basic Fortitude save; on a failure, the target also takes a –2 status penalty to AC for 1 round.</li></ul>'
        + '<p>@UUID[Compendium.pf2e.spell-effects.Item.Spell Effect: Lay on Hands]{Spell Effect: Lay on Hands}</p>';
    const base = await homebrew('rank-1/lay-on-hands.json', {name: 'Blessed Palm', description});
    delete base.system.overlays;
    const healing = structuredClone(base);
    Object.assign(healing.system, {defense: null, damage: {a: {applyMod: false, category: null, formula: '8', kinds: ['healing'], materials: [], type: 'vitality'}}});
    const healPlan = compileAbility(healing, {nativeEffectCatalog: catalog});
    assert.equal(healPlan.resolution.kind, 'effect');
    assert.equal(healPlan.automation.level, 'automatic', JSON.stringify(healPlan.automation.pendingCapabilities));
    assert.equal(healPlan.resolution.applications[0].recipientCondition, 'not-self');
    const harm = structuredClone(base);
    Object.assign(harm.system, {defense: {save: {basic: true, statistic: 'fortitude'}}, damage: {b: {applyMod: false, category: null, formula: '2d6', kinds: ['damage'], materials: [], type: 'vitality'}}});
    const harmPlan = compileAbility(harm, {nativeEffectCatalog: catalog});
    assert.equal(saveRoute(harmPlan).supported, true, JSON.stringify(saveRoute(harmPlan).blockers));
    assert.equal(harmPlan.resolution.outcomes.criticalFailure.nativeEffects.length, 1);
});

test('guide 4b: void or vitality by the creature', async () => {
    const lance = await homebrew('rank-7/execute.json', {name: 'Grave Lance',
        description: '<p>A spear of grave-cold pierces the target. The target takes 40 void damage with a basic Fortitude save. If the target is undead or otherwise has void healing, the spell loses the death and void traits and gains the vitality trait, and the target takes 40 vitality damage with a basic Fortitude save.</p>',
        system: {damage: {0: {applyMod: false, category: null, formula: '40', kinds: ['damage'], materials: [], type: 'void'}}, heightening: null, overlays: {}}});
    const lancePlan = compileAbility(lance);
    assert.equal(saveRoute(lancePlan).supported, true, JSON.stringify(saveRoute(lancePlan).blockers));
    assert.deepEqual(lancePlan.targeting.actorConstraints.predicates, [{kind: 'not-undead-or-void-healing'}]);
    const light = await homebrew('rank-8/divine-armageddon.json', {name: 'Grave Light',
        description: '<p>Grave light pours over the area. Creatures in the area take 6d6 void damage and 6d6 spirit damage. A creature harmed by vitality damage, such as one with void healing, takes vitality damage instead of void damage from this spell.</p>',
        system: {damage: {a: {applyMod: false, category: null, formula: '6d6', kinds: ['damage'], materials: [], type: 'void'}, b: {applyMod: false, category: null, formula: '6d6', kinds: ['damage'], materials: [], type: 'spirit'}}, heightening: null}});
    const lightPlan = compileAbility(light);
    assert.equal(saveRoute(lightPlan).supported, true, JSON.stringify(saveRoute(lightPlan).blockers));
    assert.equal(lightPlan.resolution.damageSwap.to, 'vitality');
});

test('guide 4b: healing from conjured food', async () => {
    const spell = await homebrew('rank-4/natures-bounty.json', {name: 'Glowing Plum',
        description: '<p>A glowing plum drops into your palm. A creature can consume the food with an Interact action to regain 2d8+6 Hit Points. If uneaten, the food crumbles to dust after 1 minute.</p>',
        system: {damage: {0: {applyMod: false, category: null, formula: '2d8+6', kinds: ['healing'], materials: [], type: 'vitality'}}, heightening: null}});
    const plan = compileAbility(spell);
    assert.equal(plan.resolution.healing?.recipient, 'consumer');
    assert.deepEqual(plan.resolution.healing.food.expires, {value: 1, unit: 'minute'});
});

test('guide 3: damage typed by the draconic bloodline', async () => {
    const spell = await homebrew('rank-3/dragon-breath.json', {name: 'Wyrm Sigh',
        description: '<p>You exhale a gust of draconic power, dealing 4d6 damage with a basic Reflex save. The damage type depends on the magical tradition related to the dragon that influenced your bloodline.</p>',
        system: {damage: {0: {applyMod: false, category: null, formula: '4d6', kinds: ['damage'], materials: [], type: 'untyped'}}, heightening: null}});
    spell.system.rules = [{key: 'DamageAlteration', mode: 'override', predicate: ['item:slug:wyrm-sigh'], property: 'damage-type', selectors: ['spell-damage'], slug: 'base', value: '{actor|flags.system.dragonBloodline.damageType}'}];
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.equal(plan.resolution.bloodlineDamage.flag, 'dragonBloodline');
});

test('guide 4c: a message with a reply', async () => {
    const spell = await homebrew('rank-5/sending.json', {name: 'Far Whisper',
        description: '<p>You send the creature a mental message of 25 words or fewer, and it can respond immediately with its own message of 25 words or fewer.</p>',
        system: {damage: {}, heightening: null}});
    const plan = compileAbility(spell);
    assert.equal(plan.resolution.kind, 'message');
    assert.equal(isExecutableMessagePlan(plan), true);
});

test('guide 3: a basic save cast through a thrall', async () => {
    const spell = await homebrew('rank-1/necrotic-bomb.json', {name: 'Grave Burst',
        description: '<p>Your thrall bursts with grave dust. Each creature within a 10-foot emanation of the thrall takes 2d6 void damage with a basic Fortitude save. This destroys the thrall.</p>',
        system: {damage: {0: {applyMod: false, category: null, formula: '2d6', kinds: ['damage'], materials: [], type: 'void'}}, heightening: null}});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.equal(plan.targeting.thrall.radius, 10);
});

test('guide 3: a spell that waits for its trigger', async () => {
    const spell = await homebrew('rank-2/animus-mine.json', {name: 'Warding Glyph',
        description: '<p>The first creature that uses a magical mental effect against you triggers the warding glyph, causing the spell to end. The warding glyph deals 4d8 mental damage to the triggering creature, which must attempt a Will save.</p><hr />'
            + '<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>'
            + `<p><strong>Failure</strong> The creature takes full damage and is @UUID[${C('dfCMdR4wnpbYNTix')}]{Stunned 1}.</p><p><strong>Critical Failure</strong> The creature takes double damage and is stunned 1. You're unaffected by the triggering mental effect.</p>`});
    const plan = compileAbility(spell);
    assert.equal(isExecutableStoredTriggerPlan(plan), true);
    assert.equal(saveRoute(plan).supported, false);
    assert.equal(saveRoute(storedTriggerExposurePlan(plan)).supported, true);
});

test('guide 3: persistent-only damage, a persistent lifetime and a GM-judged save bonus', async () => {
    const spell = await homebrew('rank-2/blood-runs-cold.json', {name: 'Frost Scorn',
        description: '<p>Your scorn freezes the target. The target takes 1d6 persistent cold damage with a Fortitude save. If the target can\'t hear you, it gains a +2 circumstance bonus to its save.</p><hr />'
            + '<p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target takes half the persistent cold damage.</p>'
            + `<p><strong>Failure</strong> The target takes the full persistent cold damage and is @UUID[${SLOWED}]{Slowed 1} until the persistent cold damage ends.</p>`
            + `<p><strong>Critical Failure</strong> The target takes double the persistent cold damage and is @UUID[${SLOWED}]{Slowed 2} until the persistent cold damage ends.</p>`});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.equal(plan.resolution.attackAdjustment.appliesTo, 'save');
    assert.equal(plan.resolution.outcomes.failure.effects[0].endsWhen.event, 'persistent-damage-ended');
});

test('guide 3: rolled rounds, a basic save with its own table, a reaction whose Target is its trigger', async () => {
    const spell = await homebrew('rank-1/split-the-tongue.json', {name: 'Liar\'s Sting',
        description: '<p>A lie stings the liar. The creature takes 1d8 piercing damage and must attempt a Fortitude save.</p><hr />'
            + '<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>'
            + `<p><strong>Failure</strong> The creature takes full damage and is @UUID[${C('e1XGnhKNSQIm5IXg')}]{Stupefied 1} for [[/r 1d4 #rounds]]{1d4 rounds}.</p>`
            + `<p><strong>Critical Failure</strong> As failure, but the creature takes double damage and is @UUID[${C('e1XGnhKNSQIm5IXg')}]{Stupefied 2} for 1d4 rounds.</p>`,
        system: {damage: {0: {applyMod: false, category: null, formula: '1d8', kinds: ['damage'], materials: [], type: 'piercing'}}, heightening: null}});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.equal(plan.resolution.outcomes.criticalFailure.effects.find(effect => effect.value === 2).duration.valueRoll, '1d4');
});

test('guide 5: an affliction handed to Pseudo Afflictions', async () => {
    const spell = await homebrew('rank-1/spider-sting.json', {name: 'Mire Fever',
        description: '<p>Your touch spreads a marsh fever. The target must attempt a Fortitude save.</p><hr />'
            + '<p><strong>Critical Success</strong> The target is unaffected.</p>'
            + `<p><strong>Success</strong> The target is @UUID[${SICKENED}]{Sickened 1}.</p>`
            + '<p><strong>Failure</strong> The target is afflicted with mire fever at stage 1.</p>'
            + '<p><strong>Critical Failure</strong> The target is afflicted with mire fever at stage 2.</p><hr />'
            + '<p><strong>Mire Fever</strong> (disease)</p><p><strong>Level</strong> 1</p><p><strong>Maximum Duration</strong> 6 days</p>'
            + `<p><strong>Stage 1</strong> @UUID[${SICKENED}]{Sickened 1} (1 day)</p><p><strong>Stage 2</strong> @UUID[${ENFEEBLED}]{Enfeebled 1} and sickened 1 (1 day)</p>`,
        system: {damage: {}, heightening: null, traits: {value: ['disease', 'manipulate'], rarity: 'common', traditions: []}}});
    const plan = compileAbility(spell);
    assert.equal(saveRoute(plan).supported, true, JSON.stringify(saveRoute(plan).blockers));
    assert.equal(plan.resolution.afflictionHandoff.name, 'Mire Fever');
});

test('guide 6: an affliction-care spell', async () => {
    const spell = await homebrew('rank-5/restorative-moment.json', {name: 'Quiet Recovery',
        description: '<p>A calm light settles over the target.</p><p>The target decreases the values of any @UUID[Compendium.pf2e.conditionitems.Item.4D2KBtexWXa6oUMR]{Drained} conditions it has by 1 and can immediately attempt one saving throw against each affliction it has with a stage length of 1 day or less. The target is then temporarily immune for 1 day.</p>'});
    assert.equal(isExecutableCarePlan(compileAbility(spell)), true);
});

test('guide pitfalls: an extra sentence the module can’t account for blocks the spell', async () => {
    const spell = await homebrew('cantrip/electric-arc.json', {name: 'Frost Lash Plus',
        description: '<p>A whip of frost lashes the target, dealing 2d6 cold damage with a basic Reflex save. The target also can\'t use reactions until your next turn.</p>',
        system: {damage: {0: {applyMod: false, category: null, formula: '2d6', kinds: ['damage'], materials: [], type: 'cold'}}, heightening: null, target: {value: '1 creature'}}});
    assert.equal(saveRoute(compileAbility(spell)).supported, false);
});
