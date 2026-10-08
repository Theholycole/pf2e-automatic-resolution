import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {nativeNumbers} from '../src/compiler/native-numbers.js';

// The numbers PF2e's own card rolls, in resolution.native, for pf2e-resolution-core's families and the simulator (2026-10-08): healing, the
// action-count variants and missiles, from PF2e's item data. Live play never reads them.
const root = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, root), 'utf8'));
const rolled = components => components.map(component => `${component.formula} ${component.type}`);

test('Heal: vitality healing for the living, and its 1-, 2- and 3-action variants', async () => {
    const native = compileAbility(await spell('rank-1/heal')).resolution.native;
    assert.deepEqual(rolled(native.healing.components), ['1d8 vitality']);
    assert.equal(native.healing.recipients, 'living');
    assert.deepEqual(native.healing.heightening, {damage: {0: '1d8'}, interval: 1, type: 'interval'});
    assert.deepEqual(native.byActions['1'], {targeting: {range: 'touch'}});
    // (The two 2-action overlays share their range, not their target line; the undead one only narrows the kinds: no damage change.)
    assert.deepEqual(native.byActions['2'].targeting, {range: '30 feet'});
    assert.deepEqual(rolled(native.byActions['2'].healing.components), ['1d8+8 vitality']);
    assert.deepEqual(native.byActions['2'].healing.heightening.damage, {0: '1d8+8'});
    assert.equal(native.byActions['2'].sharedDamage, undefined);
    assert.deepEqual(native.byActions['3'].targeting, {range: null, area: {type: 'emanation', value: 30}, target: 'all living and undead creatures'});
});

test('Harm heals the undead; live fields stay where they were', async () => {
    const plan = compileAbility(await spell('rank-1/harm'));
    assert.equal(plan.resolution.native.healing.recipients, 'undead');
    // (resolution.healing is live play's: it heals whenever it's set, so the native numbers never land there.)
    assert.equal(plan.resolution.healing, undefined);
});

test('a live healing keeps its fields, and its formula and heightening correction win over the data', async () => {
    const soothe = nativeNumbers(await spell('rank-1/soothe'), {healing: {formula: '1d10+4', damageType: 'untyped', recipient: 'target'}});
    assert.equal(soothe.healing.recipient, 'target');
    assert.equal(soothe.healing.recipients, 'willing');
    const breath = nativeNumbers(await spell('rank-5/breath-of-life'), {healing: {formula: '5d8', damageType: 'untyped', recipient: 'target',
        heighteningCorrection: {faces: 8, baseDice: 5, baseRank: 5, text: {interval: 2, dice: 1}, data: {interval: 1, dice: 1}}}});
    assert.deepEqual(breath.healing.heightening, {type: 'interval', interval: 2, damage: {0: '1d8'}});
    assert.deepEqual(rolled(breath.healing.components), ['5d8 untyped']);
});

test('Force Barrage: a shard per action, one more per 2 ranks, its damage per shard', async () => {
    const native = compileAbility(await spell('rank-1/force-barrage')).resolution.native;
    assert.deepEqual(native.missiles, {perActions: {1: 1, 2: 2, 3: 3}, perRanks: {interval: 2, extra: 1}});
    assert.deepEqual(rolled(native.sharedDamage.components), ['1d4+1 force']);
});

test('a spell PF2e rolls itself: its attack, damage, rows and damage-type pick (Telekinetic Projectile, Gouging Claw)', async () => {
    const projectile = compileAbility(await spell('cantrip/telekinetic-projectile')).resolution.native;
    assert.deepEqual(projectile.check, {statistic: 'spell-attack', basic: false});
    assert.deepEqual(rolled(projectile.sharedDamage.components), ['2d6 untyped']);
    assert.deepEqual(Object.values(projectile.outcomes).map(row => row.damage.multiplier), [2, 1, 0, 0]);
    assert.deepEqual(projectile.damageTypeChoices, {0: ['bludgeoning', 'piercing', 'slashing']});
    const claw = compileAbility(await spell('cantrip/gouging-claw')).resolution.native;
    assert.deepEqual(claw.outcomes.criticalSuccess.damage.sourceComponentIds, ['0', '3Pz4NTLXD2rzKgf4']);
});

test('damage only in the action overlays (Blazing Bolt), and variants by what the spell is cast at (Lay on Hands)', async () => {
    const bolt = compileAbility(await spell('rank-2/blazing-bolt')).resolution.native;
    assert.deepEqual(rolled(bolt.byActions['1'].sharedDamage.components), ['2d6 fire']);
    assert.deepEqual(rolled(bolt.byActions['3'].sharedDamage.components), ['4d6 fire']);
    assert.equal(bolt.byActions['2'].outcomes.criticalSuccess.damage.multiplier, 2);
    const hands = compileAbility(await spell('rank-1/lay-on-hands')).resolution.native;
    const [undead, healing] = ['Lay on Hands (Vs. Undead)', 'Lay on Hands (Healing)'].map(name => hands.variants.find(variant => variant.name === name));
    assert.deepEqual(undead.check, {statistic: 'fortitude', basic: true});
    assert.deepEqual(Object.values(undead.outcomes).map(row => row.damage.multiplier), [0, 0.5, 1, 2]);
    assert.deepEqual(rolled(healing.healing.components), ['6 vitality']);
    assert.equal(healing.healing.recipients, 'living');
});

test('an unsupported plan\'s linked spell Effect, with who gets it (Bless: you and allies in the area)', async () => {
    const plan = compileAbility(await spell('rank-1/bless'));
    assert.equal(plan.resolution.kind, 'unsupported');
    assert.deepEqual(plan.resolution.native.applications.map(({uuid, recipients, area}) => ({effect: uuid.split('.').pop(), recipients, area})),
        [{effect: 'Spell Effect: Bless', recipients: 'allies-in-area', area: {type: 'emanation', value: 15}}]);
});

test('a spell with nothing of the kind gets no native block', async () => {
    assert.equal(compileAbility(await spell('rank-3/fireball')).resolution.native, undefined);
});
