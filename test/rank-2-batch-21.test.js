import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}, ...(e.system?.badge ? {badge: e.system.badge} : {})}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
const effects = await catalog();
const compile = source => compileAbility(source, {nativeEffectCatalog: effects});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };



// Rank 2, batch 21 (2026-09-30): a turn-start cloud that is difficult terrain only for flying creatures (Ash Cloud); a held item's
// initial and persistent damage by row, with a Release that improves the result (Heat Metal); a 0-HP target's Dying increase or death and
// the caster's Effect when it dies (Death Knell).

test('Ash Cloud: a turn-start lingering area, fly-only difficult terrain, and the smell note', async () => {
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/ash-cloud'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.terrain.movement], [['turn-start'], false, ['fly']]);
    assert.deepEqual(lingering.notes, ["Creatures in the area can't detect anything using their sense of smell."]);
    const forged = structuredClone(plan); forged.resolution.lingering.terrain.movement = ['swim'];
    assert.equal(isExecutableLingeringPlan(forged), false);
});

test('Heat Metal: initial and persistent damage by row, and the Release question', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/heat-metal'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    const [initial, persistent] = plan.resolution.sharedDamage.components.map(component => component.id);
    assert.deepEqual([success.damage.multiplier, success.damage.sourceComponentIds], [0.5, [initial]]);
    assert.deepEqual([failure.damage.multiplier, failure.damage.sourceComponentIds], [1, [initial, persistent]]);
    assert.deepEqual([criticalFailure.damage.multiplier, criticalFailure.damage.sourceComponentIds], [2, [initial, persistent]]);
    const adjustment = plan.resolution.degreeAdjustment;
    assert.equal(adjustment.predicate.kind, 'gm-confirmed');
    assert.deepEqual(adjustment.map, {criticalSuccess: 'criticalSuccess', success: 'criticalSuccess', failure: 'success', criticalFailure: 'failure'});
});

test('Heat Metal: a row persistent wording other than the object\'s stays unproven', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = withText(await spell('rank-2/heat-metal'), text => text.replace('the object deals no persistent fire damage', 'the object deals half persistent fire damage'));
    assert.equal(inspectSavePlan(compile(source)).supported, false);
});

test('Death Knell: living and at 0 HP, Dying +1, death, and the caster\'s Effect when it dies', async () => {
    const {inspectSavePlan, validateActorTarget} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/death-knell'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.targeting.actorConstraints.predicates.map(predicate => predicate.kind), ['living-creature', 'hp-zero']);
    const actor = hp => ({type: 'npc', isOfType: type => type === 'creature', traits: new Set(['humanoid']), hitPoints: {value: hp}});
    assert.equal(validateActorTarget(plan.targeting.actorConstraints, actor(0)).eligible, true);
    assert.equal(validateActorTarget(plan.targeting.actorConstraints, actor(5)).eligible, false);
    const {success, failure} = plan.resolution.outcomes;
    assert.deepEqual(success.effects, []);
    assert.deepEqual(success.conditionIncreases.map(entry => [entry.slug, entry.amount]), [['dying', 1]]);
    assert.equal(failure.terminal.kind, 'death');
    assert.deepEqual(failure.nativeEffects, []);
    const kill = plan.resolution.killEffect;
    assert.deepEqual([kill.temporaryHP, kill.bonus, kill.duration.value, kill.duration.unit], [10, 1, 10, 'minutes']);
});

test('Death Knell: a forged benefit or increase is refused', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/death-knell'));
    const bonus = structuredClone(plan); bonus.resolution.killEffect.temporaryHP = 20;
    assert.equal(inspectSavePlan(bonus).supported, false);
    const increase = structuredClone(plan); increase.resolution.outcomes.success.conditionIncreases[0].amount = 2;
    assert.equal(inspectSavePlan(increase).supported, false);
    // A sentence whose numbers aren't the Effect's leaves the Effect on the rows (unsupported there).
    const source = withText(await spell('rank-2/death-knell'), text => text.replace('10 temporary HP', '15 temporary HP'));
    const other = compile(source);
    assert.equal(other.resolution.killEffect, undefined);
    assert.equal(inspectSavePlan(other).supported, false);
});
