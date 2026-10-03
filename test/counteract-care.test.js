import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {afflictionCounteractRank, carePlanAtRank, counteracts, isExecutableCarePlan} from '../scripts/affliction-care-core.js';

const spell = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}.json`, import.meta.url), 'utf8'));
const counteractOps = care => [...care.operations, ...care.modes.flatMap(mode => mode.operations)].filter(op => op.op === 'counteract');

test('counteract rules: degree reach and an affliction\'s counteract rank', () => {
    // Critical success: up to rank +3; success: up to +1; failure: below the rank; critical failure: nothing.
    assert.equal(counteracts(3, 2, 5), true); assert.equal(counteracts(3, 2, 6), false);
    assert.equal(counteracts(2, 2, 3), true); assert.equal(counteracts(2, 2, 4), false);
    assert.equal(counteracts(1, 2, 1), true); assert.equal(counteracts(1, 2, 2), false);
    assert.equal(counteracts(0, 5, 0), false);
    assert.equal(afflictionCounteractRank(3), 2); assert.equal(afflictionCounteractRank(4), 2); assert.equal(afflictionCounteractRank(null), null);
});

test('your own effects (Empty Inside): one emotion effect, any number at 5th rank', async () => {
    const plan = compileAbility(await spell('rank-1/empty-inside'));
    assert.equal(isExecutableCarePlan(plan), true, JSON.stringify(plan.automation));
    assert.equal(plan.resolution.recipient, 'self');
    assert.deepEqual(counteractOps(carePlanAtRank(plan.resolution, 1)).map(op => [op.source, op.traits, op.pick]), [['effect', ['emotion'], 1]]);
    assert.deepEqual(counteractOps(carePlanAtRank(plan.resolution, 5)).map(op => op.pick), ['any']);
    // "affecting you" with a Target is refused.
    const targeted = await spell('rank-1/empty-inside'); targeted.system.target.value = '1 creature';
    assert.equal(isExecutableCarePlan(compileAbility(targeted)), false);
});

test('a spell effect, area or item (Dispel Magic)', async () => {
    const plan = compileAbility(await spell('rank-2/dispel-magic'));
    assert.equal(isExecutableCarePlan(plan), true, JSON.stringify(plan.automation));
    assert.equal(plan.resolution.recipient, 'counteract-target');
    assert.deepEqual(plan.resolution.magicItem, {value: 10, unit: 'minutes'});
    assert.equal(plan.resolution.artifactFails, true);
    assert.deepEqual(counteractOps(plan.resolution).map(op => [op.source, op.otherTargets]), [['spell-effect', true]]);
    // The item rules come as a set.
    const partial = await spell('rank-2/dispel-magic');
    partial.system.description.value = partial.system.description.value.replace(" If the target is an artifact or similar item, you automatically fail.", "");
    assert.equal(isExecutableCarePlan(compileAbility(partial)), false);
});

test('damage then a counteract, with immunity rules (Purging Toxins)', async () => {
    const plan = compileAbility(await spell('rank-3/purging-toxins'));
    assert.equal(isExecutableCarePlan(plan), true, JSON.stringify(plan.automation));
    assert.deepEqual(plan.resolution.operations.map(op => op.op), ['damage', 'counteract']);
    assert.deepEqual(plan.resolution.operations[1].traits, ['disease', 'poison']);
    assert.deepEqual(plan.resolution.immunity, {value: 24, unit: 'hours'});
    assert.equal(plan.resolution.negatedByImmunity, 'poison');
    assert.equal(counteractOps(carePlanAtRank(plan.resolution, 5))[0].pick, 'any');
    // The damage must be the item's own "@item.rank" poison entry.
    const other = await spell('rank-3/purging-toxins'); Object.values(other.system.damage)[0].type = 'acid';
    assert.equal(isExecutableCarePlan(compileAbility(other)), false);
});

test('healing or a counteract, chosen when cast (Harmonize Self)', async () => {
    const plan = compileAbility(await spell('rank-2/harmonize-self'));
    assert.equal(isExecutableCarePlan(plan), true, JSON.stringify(plan.automation));
    assert.deepEqual(plan.resolution.modeChoice, ['heal', 'counteract']);
    assert.deepEqual(plan.resolution.modes.map(mode => mode.operations[0].op), ['heal', 'counteract']);
    // The Heightened (+1) sentence must be the healing entry's own interval heightening.
    const wrong = await spell('rank-2/harmonize-self'); wrong.system.heightening.damage['0'] = '6';
    assert.equal(isExecutableCarePlan(compileAbility(wrong)), false);
});

test('a stage reduction once per case, then a counteract at higher ranks (Cleanse Affliction)', async () => {
    const plan = compileAbility(await spell('rank-2/cleanse-affliction'));
    assert.equal(isExecutableCarePlan(plan), true, JSON.stringify(plan.automation));
    assert.equal(plan.resolution.oncePerExposure, true);
    assert.deepEqual(plan.resolution.operations.map(op => [op.op, op.traits]), [['reduce-affliction-stage', ['curse', 'disease', 'poison']]]);
    assert.deepEqual(counteractOps(carePlanAtRank(plan.resolution, 2)), []);
    assert.deepEqual(counteractOps(carePlanAtRank(plan.resolution, 3)).map(op => [op.source, op.traits]), [['chosen-affliction', ['disease', 'poison']]]);
    assert.deepEqual(counteractOps(carePlanAtRank(plan.resolution, 4)).map(op => op.traits), [['curse', 'disease', 'poison']]);
});

test('counteracting a spell as it is cast (Spell Riposte, Shadow Siphon, Nullify)', async () => {
    const riposte = compileAbility(await spell('rank-7/spell-riposte'));
    assert.equal(isExecutableCarePlan(riposte), true, JSON.stringify(riposte.automation));
    assert.equal(riposte.resolution.recipient, 'triggering-spell');
    assert.match(riposte.resolution.counteractOutcome.success, /continues with its caster as the target/);
    assert.match(riposte.resolution.counteractLimit, /aren't targeted/);
    assert.deepEqual(riposte.resolution.castingCondition, ["Trigger You're the target of a spell you're aware of."]);
    const siphon = compileAbility(await spell('rank-5/shadow-siphon'));
    assert.equal(isExecutableCarePlan(siphon), true, JSON.stringify(siphon.automation));
    assert.equal(siphon.resolution.counteractRankBonus, 2);
    assert.match(siphon.resolution.counteractOutcome.success, /half as much damage/);
    const nullify = compileAbility(await spell('rank-10/nullify'));
    assert.equal(isExecutableCarePlan(nullify), true, JSON.stringify(nullify.automation));
    assert.deepEqual(nullify.resolution.operations.map(op => [op.op, op.automatic ?? null]), [['counteract', true], ['lose-hp', null]]);
    assert.deepEqual([nullify.resolution.operations[1].dice, nullify.resolution.operations[1].faces], [1, 8]);
    // A Hit Point loss needs the triggering spell's counteract first.
    const tampered = structuredClone(nullify); tampered.resolution.operations.reverse();
    assert.equal(isExecutableCarePlan(tampered), false);
    // Outcome sentences without a counteract to go with are refused.
    const orphan = await spell('rank-5/shadow-siphon');
    orphan.system.description.value = orphan.system.description.value.replace('Attempt to counteract the target spell. ', '');
    assert.equal(isExecutableCarePlan(compileAbility(orphan)), false);
});

test('counteracting an item or a ward (Disjunction, Return To Essence)', async () => {
    const disjunction = compileAbility(await spell('rank-9/disjunction'));
    assert.equal(isExecutableCarePlan(disjunction), true, JSON.stringify(disjunction.automation));
    assert.deepEqual(disjunction.resolution.otherKinds, ['item']);
    assert.deepEqual(disjunction.resolution.counteractOutcome, {success: "It's deactivated for 1 week.", criticalSuccess: "It's destroyed."});
    assert.equal(disjunction.resolution.artifactFails, true);
    const essence = compileAbility(await spell('rank-7/return-to-essence'));
    assert.equal(isExecutableCarePlan(essence), true, JSON.stringify(essence.automation));
    assert.deepEqual(essence.resolution.otherKinds, ['spell']);
    assert.deepEqual([7, 8, 10].map(rank => carePlanAtRank(essence.resolution, rank).restoreSlot), [3, 4, 6]);
    assert.equal(essence.targeting.actorConstraints.complete, true);
});

test('suspend or suppress instead of ending (Delay Affliction, Sound Body) and a possession counteract (Luminous Stardust Healing)', async () => {
    const delay = compileAbility(await spell('rank-3/delay-affliction'));
    assert.equal(isExecutableCarePlan(delay), true, JSON.stringify(delay.automation));
    assert.deepEqual(delay.resolution.operations.map(op => op.op), ['heal', 'counteract']);
    assert.deepEqual(delay.resolution.operations[1].setAside, {mode: 'suspend', duration: {value: 1, unit: 'hours'}});
    assert.deepEqual(delay.resolution.immunity, {value: 1, unit: 'days'});
    // One more affliction per rank above 3rd.
    assert.deepEqual([3, 4, 6].map(rank => counteractOps(carePlanAtRank(delay.resolution, rank))[0].pick), [1, 2, 4]);
    const sound = compileAbility(await spell('rank-2/sound-body'));
    assert.equal(isExecutableCarePlan(sound), true, JSON.stringify(sound.automation));
    assert.deepEqual(sound.resolution.nearMiss, {ranks: 2, setAside: {mode: 'suppress', until: 'caster-next-turn-start', pauseDuration: true}});
    assert.deepEqual(sound.resolution.excludeTraits, ['curse', 'disease']);
    assert.deepEqual(counteractOps(carePlanAtRank(sound.resolution, 2))[0].grantsConditions, ['blinded', 'dazzled', 'deafened', 'enfeebled', 'sickened']);
    assert.deepEqual(counteractOps(carePlanAtRank(sound.resolution, 8))[0].grantsConditions.slice(5), ['drained', 'slowed', 'petrified', 'stunned']);
    // Without "The effect's duration doesn't elapse while it's suppressed." the near miss is refused.
    const partial = await spell('rank-2/sound-body');
    partial.system.description.value = partial.system.description.value.replace(" The effect's duration doesn't elapse while it's suppressed.", '');
    assert.equal(isExecutableCarePlan(compileAbility(partial)), false);
    const stardust = compileAbility(await spell('rank-2/luminous-stardust-healing'));
    assert.equal(isExecutableCarePlan(stardust), true, JSON.stringify(stardust.automation));
    assert.deepEqual(stardust.resolution.operations.map(op => [op.op, op.traits ?? null, op.optional ?? null]), [['heal', null, null], ['counteract', ['possession'], true]]);
    assert.match(stardust.resolution.counteractOutcome.success, /cast out/);
    assert.match(stardust.resolution.counteractOutcome.failure, /immune to being cast out/);
});

test('the near-miss family in other wordings (Clear Mind, Sure Footing)', async () => {
    const mind = compileAbility(await spell('rank-2/clear-mind'));
    assert.equal(isExecutableCarePlan(mind), true, JSON.stringify(mind.automation));
    assert.equal(mind.resolution.nearMiss.ranks, 2);
    assert.deepEqual(mind.resolution.excludeTraits, ['curse', 'disease']);
    assert.deepEqual(counteractOps(carePlanAtRank(mind.resolution, 8))[0].grantsConditions, ['fleeing', 'frightened', 'stupefied', 'confused', 'controlled', 'slowed', 'doomed', 'stunned']);
    const footing = compileAbility(await spell('rank-2/sure-footing'));
    assert.equal(isExecutableCarePlan(footing), true, JSON.stringify(footing.automation));
    assert.deepEqual(counteractOps(carePlanAtRank(footing.resolution, 6))[0].grantsConditions, ['clumsy', 'grabbed', 'paralyzed', 'immobilized', 'slowed', 'restrained', 'petrified']);
});

test('a poison or non-curse effect, with the target\'s Drained for +1 (Cleansing Flames)', async () => {
    const plan = compileAbility(await spell('rank-5/cleansing-flames'));
    assert.equal(isExecutableCarePlan(plan), true, JSON.stringify(plan.automation));
    const [op] = counteractOps(plan.resolution);
    assert.deepEqual([op.afflictionTraits, plan.resolution.excludeTraits], [['poison'], ['curse']]);
    assert.equal(op.grantsConditions.length, 8);
    assert.deepEqual(plan.resolution.empower, {condition: 'drained', bonus: 1, type: 'circumstance'});
    const tampered = structuredClone(plan); tampered.resolution.empower.type = 'status';
    assert.equal(isExecutableCarePlan(tampered), false);
});

test('you and up to 9 allies, one option for all (Soothing Ballad)', async () => {
    const plan = compileAbility(await spell('rank-7/soothing-ballad'));
    assert.equal(isExecutableCarePlan(plan), true, JSON.stringify(plan.automation));
    assert.deepEqual([plan.resolution.recipient, plan.resolution.maxTargets], ['targets', 10]);
    assert.deepEqual(plan.resolution.modes.map(mode => [mode.id, mode.operations[0].op, mode.operations[0].pick ?? null]),
        [['counteract-fear', 'counteract', 'any'], ['counteract-paralysis', 'counteract', 'any'], ['heal', 'heal', null]]);
    assert.deepEqual(plan.resolution.modes[1].operations[0].grantsConditions, ['paralyzed']);
    // The healing heightening must be the entry's own (1d8 per rank).
    const wrong = await spell('rank-7/soothing-ballad'); wrong.system.heightening.damage['0'] = '2d8';
    assert.equal(isExecutableCarePlan(compileAbility(wrong)), false);
});

test('standing wards (Spell Immunity, Veil of Privacy, Rigid Form, Spell Turning)', async () => {
    const immunity = compileAbility(await spell('rank-4/spell-immunity'));
    assert.equal(isExecutableCarePlan(immunity), true, JSON.stringify(immunity.automation));
    assert.deepEqual([immunity.resolution.recipient, immunity.resolution.ward.named, immunity.resolution.ward.untilDailyPreparations], ['target', true, true]);
    const veil = compileAbility(await spell('rank-3/veil-of-privacy'));
    assert.equal(isExecutableCarePlan(veil), true, JSON.stringify(veil.automation));
    assert.deepEqual([veil.resolution.ward.duration, veil.resolution.ward.cantripRank], [{value: 8, unit: 'hours'}, 1]);
    const rigid = compileAbility(await spell('rank-4/rigid-form'));
    assert.equal(isExecutableCarePlan(rigid), true, JSON.stringify(rigid.automation));
    assert.deepEqual([rigid.resolution.recipient, rigid.resolution.ward.reaction], ['self', true]);
    assert.deepEqual([4, 6].map(rank => carePlanAtRank(rigid.resolution, rank).ward.duration), [{value: 1, unit: 'minutes'}, {value: 10, unit: 'minutes'}]);
    const turning = compileAbility(await spell('rank-7/spell-turning'));
    assert.equal(isExecutableCarePlan(turning), true, JSON.stringify(turning.automation));
    assert.deepEqual([turning.resolution.ward.endsAfterUse, turning.resolution.ward.successText], [true, 'The spell is turned back on its caster.']);
    assert.equal(turning.resolution.ward.notes.length, 2);
    // A ward needs its spell's duration; "1 creature or object" is read only for a ward.
    const noDuration = await spell('rank-3/veil-of-privacy'); noDuration.system.duration.value = 'sustained';
    assert.equal(isExecutableCarePlan(compileAbility(noDuration)), false);
    const tampered = structuredClone(veil); tampered.resolution.ward.cantripRank = 2;
    assert.equal(isExecutableCarePlan(tampered), false);
});

test('area wards and seeing through (Planar Seal, Dispelling Globe, Truesight, Glimpse the Truth) and a timed suppression (Unblinking Flame Revelation)', async () => {
    const seal = compileAbility(await spell('rank-7/planar-seal'));
    assert.equal(isExecutableCarePlan(seal), true, JSON.stringify(seal.automation));
    assert.deepEqual([seal.resolution.recipient, seal.resolution.ward.untilDailyPreparations], ['self', true]);
    const globe = compileAbility(await spell('rank-4/dispelling-globe'));
    assert.equal(isExecutableCarePlan(globe), true, JSON.stringify(globe.automation));
    assert.deepEqual([globe.resolution.ward.rankOffset, globe.resolution.ward.duration], [-1, {value: 10, unit: 'minutes'}]);
    const truesight = compileAbility(await spell('rank-6/truesight'));
    assert.equal(isExecutableCarePlan(truesight), true, JSON.stringify(truesight.automation));
    assert.deepEqual([truesight.resolution.ward.secret, truesight.resolution.ward.seeThrough, truesight.resolution.ward.successText], [true, true, "You see through it (it doesn't end)."]);
    const glimpse = compileAbility(await spell('rank-4/glimpse-the-truth'));
    assert.equal(isExecutableCarePlan(glimpse), true, JSON.stringify(glimpse.automation));
    assert.deepEqual(glimpse.resolution.ward.duration, {value: 1, unit: 'rounds'});
    assert.equal(carePlanAtRank(glimpse.resolution, 7).ward.notes.length, 1);
    const flame = compileAbility(await spell('rank-3/unblinking-flame-revelation'));
    assert.equal(isExecutableCarePlan(flame), true, JSON.stringify(flame.automation));
    assert.deepEqual(counteractOps(flame.resolution).map(op => [op.traits, op.pick, op.secret, op.setAside]),
        [[['illusion'], 'any', true, {mode: 'suppress', duration: {value: 2, unit: 'rounds'}}]]);
    const tampered = structuredClone(globe); tampered.resolution.ward.rankOffset = 2;
    assert.equal(isExecutableCarePlan(tampered), false);
});

test('a lost spell slot as the counteract rank (Elemental Counter) and a counteract that sets off an explosion (Detonate Magic)', async () => {
    const counter = compileAbility(await spell('cantrip/elemental-counter'));
    assert.equal(isExecutableCarePlan(counter), true, JSON.stringify(counter.automation));
    assert.equal(counteractOps(counter.resolution)[0].rankFromLostSlot, true);
    assert.deepEqual(counter.resolution.elementCycle, {earth: ['plant', 'wood'], water: ['earth'], fire: ['water'], metal: ['fire'], plant: ['metal'], wood: ['metal']});
    assert.equal(counter.resolution.castingCondition.length, 2);
    const detonate = compileAbility(await spell('rank-9/detonate-magic'));
    assert.equal(isExecutableCarePlan(detonate), true, JSON.stringify(detonate.automation));
    assert.equal(detonate.resolution.explosionPlan.resolution.check.statistic, 'reflex');
    assert.equal(detonate.resolution.explosionPlan.resolution.check.basic, true);
    assert.deepEqual(detonate.resolution.explosion, {sentence: 'An explosion of magical force deals 8d6 force damage with a basic Reflex save.', formula: '8d6', damageType: 'force', statistic: 'reflex'});
    // The explosion's damage must be the item's entry.
    const other = await spell('rank-9/detonate-magic'); Object.values(other.system.damage)[0].type = 'fire';
    assert.equal(isExecutableCarePlan(compileAbility(other)), false);
    // Without the cycle sentence, the lost slot isn't read.
    const noCycle = await spell('cantrip/elemental-counter');
    noCycle.system.description.value = noCycle.system.description.value.replace(/ You can lose a plant[^<]+/, '');
    assert.equal(isExecutableCarePlan(compileAbility(noCycle)), false);
});
