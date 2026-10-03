import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, bloodlineDamageType, bloodlineRollMatches} from '../scripts/basic-save-core.js';

const spell = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}.json`, import.meta.url), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;

test('Dragon Breath: the item DamageAlteration types the damage by the draconic bloodline', async () => {
    const source = await spell('rank-3/dragon-breath');
    const plan = compileAbility(source);
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual([plan.resolution.bloodlineDamage.bloodline, plan.resolution.bloodlineDamage.part], ['draconic', 'type']);
    // A different alteration (another flag) is not the bloodline's: refused.
    const other = structuredClone(source); other.system.rules[0].value = '{actor|flags.system.somethingElse.damageType}';
    assert.equal(supported(compileAbility(other)), false);
    // Without the rule the sentence is unproved.
    const bare = structuredClone(source); bare.system.rules = [];
    assert.equal(supported(compileAbility(bare)), false);
});

test("Elemental Blast and Elemental Toss: the elemental bloodline's type, and a chosen area shape", async () => {
    const blast = compileAbility(await spell('rank-5/elemental-blast'));
    assert.equal(supported(blast), true, JSON.stringify(inspectSavePlan(blast).blockers));
    assert.equal(blast.resolution.bloodlineDamage.flag, 'elementalBloodline');
    const reminder = blast.resolution.reminders.find(entry => entry.kind === 'area-choice');
    assert.match(reminder.text, /a 10-foot burst within 30 feet, a 30-foot cone or a 60-foot line/);
    const toss = compileAbility(await spell('rank-1/elemental-toss'));
    assert.equal(supported(toss), true, JSON.stringify(inspectSavePlan(toss).blockers));
    assert.equal(toss.resolution.check.statistic, 'spell-attack');
    // A typed entry contradicts "damage according to your elemental influence".
    const typed = await spell('rank-1/elemental-toss'); typed.system.damage['0'].type = 'fire';
    assert.equal(compileAbility(typed).resolution.bloodlineDamage, undefined);
    // An area list without "of your choosing" is refused.
    const blastSource = await spell('rank-5/elemental-blast');
    blastSource.system.description.value = blastSource.system.description.value.replace(' in one of the various listed shapes of your choosing', '');
    assert.equal(supported(compileAbility(blastSource)), false);
});

test("Flurry of Claws: the item's DamageDice adds the bloodline's dice; two attacks share the penalty; targets within 10 feet", async () => {
    const source = await spell('rank-1/flurry-of-claws');
    const plan = compileAbility(source);
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual([plan.resolution.bloodlineDamage.part, plan.resolution.bloodlineDamage.die], ['extra', 'd4']);
    assert.equal(plan.resolution.check.sharedMultipleAttackPenalty, true);
    assert.equal(plan.targeting.actorConstraints.mutualWithin, 10);
    // The text's die must be the rule's.
    const wrong = structuredClone(source); wrong.system.rules[0].dieSize = 'd6';
    assert.equal(supported(compileAbility(wrong)), false);
});

test('bloodline runtime checks', () => {
    const draconic = {bloodline: 'draconic', flag: 'dragonBloodline', part: 'type'};
    assert.equal(bloodlineDamageType(draconic, {flags: {system: {dragonBloodline: {damageType: 'fire'}}}}), 'fire');
    assert.equal(bloodlineDamageType(draconic, {flags: {system: {}}}), null);
    assert.equal(bloodlineRollMatches(draconic, ['fire'], 'fire'), true);
    assert.equal(bloodlineRollMatches(draconic, ['untyped'], 'fire'), false);
    assert.equal(bloodlineRollMatches({...draconic, part: 'extra'}, ['slashing', 'fire'], 'fire'), true);
    assert.equal(bloodlineRollMatches({...draconic, part: 'extra'}, ['slashing'], 'fire'), false);
});
