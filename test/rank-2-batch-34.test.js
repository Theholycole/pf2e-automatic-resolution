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



// Rank 2, batch 34 (2026-10-01): Worm's Repast, Warrior's Regret, Pyrefowl Rebuke, Quench.

test("Worm's Repast: rows read apart, conditions ending with the persistent damage, and the non-skeletal undead's extra dice", async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-2/worms-repast');
    const plan = compile(source);
    assert.equal(inspectSavePlan(plan).supported, true);
    const {outcomes, traitVariant} = plan.resolution;
    assert.equal(outcomes.success.damage.multiplier, 1);
    assert.equal(outcomes.criticalFailure.damage.shared.multiplier, 2);
    assert.equal(outcomes.criticalFailure.damage.formulas[0].formula, '(floor(@item.level/2))d6[persistent,piercing]');
    assert.deepEqual(outcomes.criticalFailure.effects.map(effect => [effect.slug, effect.endsWhen?.event]), [['off-guard', 'persistent-damage-ended'], ['slowed', 'persistent-damage-ended']]);
    assert.equal(traitVariant.kind, 'persistent-extra');
    assert.deepEqual([traitVariant.trait, traitVariant.excludedTraits], ['undead', ['skeleton']]);
    assert.equal(traitVariant.outcomes.failure.damage.formulas[0].formula, '((floor(@item.level/2))d6 + (floor(@item.level/2)+1)d6)[persistent,piercing]');
    assert.equal(plan.lifecycle.durationSpec.mode, 'outcome');
    // A variant row with other dice is refused.
    const forged = structuredClone(plan); forged.resolution.traitVariant.outcomes.failure.damage.formulas[0].formula = '(10d6)[persistent,piercing]';
    assert.equal(inspectSavePlan(forged).supported, false);
    // A condition that doesn't end with the persistent damage isn't read.
    const changed = compile(withText(source, html => html.replace(' due to the pain for as long as it takes persistent damage', ' for 1 minute')));
    assert.notEqual(changed.resolution.traitVariant?.kind, 'persistent-extra');
});

test("Warrior's Regret: the GM's count of creatures damaged, once on a success, until a turn with none on a failure", async () => {
    const {inspectSavePlan, isTriggeredDamage} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/warriors-regret'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const trigger = degree => plan.resolution.outcomes[degree].noteEffects[0].triggeredDamage;
    assert.deepEqual([trigger('success').frequency, trigger('success').endsSpell, trigger('success').endsOnZero], ['once', true, false]);
    assert.deepEqual([trigger('failure').frequency, trigger('failure').endsOnZero], ['each', true]);
    assert.deepEqual([trigger('criticalFailure').frequency, trigger('criticalFailure').endsOnZero], ['each', false]);
    assert.deepEqual([trigger('failure').type, trigger('failure').maxCount, trigger('failure').heightening], ['mental', 4, {interval: 2, dice: 1}]);
    assert.equal(isTriggeredDamage({...trigger('success'), endsOnZero: true}), false);
    assert.equal(plan.resolution.outcomes.criticalSuccess.noteEffects?.length ?? 0, 0);
});

test('Pyrefowl Rebuke: the triggering creature\'s basic save, Dazzled on a critical failure, the caster\'s move by rank', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-2/pyrefowl-rebuke');
    const plan = compile(source);
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['dazzled']);
    const [reminder] = plan.resolution.reminders;
    assert.equal(reminder.kind, 'caster-movement');
    assert.deepEqual(reminder.rankFeet, {base: 10, step: 5, interval: 2, baseRank: 2});
    // Another movement wording isn't read.
    assert.equal(compile(withText(source, html => html.replace('directly away from it', 'toward it'))).compilerEvidence?.reactionBlast, undefined);
});

test('Quench: damage only to fire creatures, the counteract reminder and the surroundings', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-2/quench');
    const plan = compile(source);
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'trait', slug: 'fire', present: true}]);
    assert.deepEqual(plan.resolution.reminders.map(reminder => [reminder.kind, reminder.target ?? null]), [['counteract-spell', 'magical fire'], ['surroundings', null]]);
    assert.equal(plan.lifecycle.sustained, false);
    // An unknown extra sentence keeps it out.
    assert.equal(compile(withText(source, html => html.replace('Non-magical fires', 'Creatures in the area are pushed 10 feet. Non-magical fires'))).compilerEvidence?.traitAreaBlast, undefined);
});
