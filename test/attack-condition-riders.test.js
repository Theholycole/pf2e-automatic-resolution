import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {reminderHTML} from '../scripts/strike-prelude-runtime.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;
const slugs = outcome => outcome.effects.map(effect => [effect.slug, effect.duration?.sourceText ?? null]);

test('hit and critical-hit conditions with their own durations (Inkshot)', async () => {
    const source = await fixture('rank-1/inkshot.json');
    const plan = compileAbility(source);
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    // The empty Target field is one creature ("… spell attack roll against the target").
    assert.equal(plan.targeting.target, '1 creature');
    assert.deepEqual(slugs(plan.resolution.outcomes.success), [['dazzled', 'for 1 round']]);
    assert.deepEqual(slugs(plan.resolution.outcomes.criticalSuccess), [['dazzled', 'for 1 minute']]);
    assert.equal(plan.resolution.outcomes.criticalSuccess.damage.multiplier, 2);
    assert.deepEqual(plan.resolution.outcomes.failure.effects, []);
    // "double the fire damage" must name the spell's own damage.
    const wrongType = structuredClone(source);
    wrongType.system.description.value = wrongType.system.description.value.replace('double the poison damage', 'double the fire damage');
    assert.notEqual(compileAbility(wrongType).resolution.check?.statistic, 'spell-attack');
    // A mark that isn't cosmetic stays a rule.
    const ruled = structuredClone(source);
    ruled.system.description.value = ruled.system.description.value.replace('The ink stain remains for 1 hour before fading', 'The target is Clumsy 1 for 1 hour');
    assert.notEqual(compileAbility(ruled).resolution.check?.statistic, 'spell-attack');
});

test('a reaction attack on the triggering creature dealing only persistent damage (Brine Dragon Bile)', async () => {
    const source = await fixture('rank-2/brine-dragon-bile.json');
    const plan = compileAbility(source);
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.targeting.actorConstraints.complete, true);
    const [entry] = plan.resolution.sharedDamage.components;
    assert.equal(entry.category, 'persistent');
    assert.deepEqual(plan.resolution.outcomes.success.damage.sourceComponentIds, [entry.id]);
    assert.equal(plan.resolution.outcomes.criticalSuccess.damage.multiplier, 2);
    assert.equal(plan.resolution.outcomes.failure.damage.mode, 'none');
    // The triggering creature is attacked only when the attack names it.
    const unnamed = structuredClone(source);
    unnamed.system.description.value = unnamed.system.description.value.replace("against the triggering creature's AC", "against the target's AC");
    assert.notEqual(compileAbility(unnamed).resolution.check?.statistic, 'spell-attack');
});

test('a condition for the duration that ends with the persistent damage (Blinding Foam)', async () => {
    const source = await fixture('rank-5/blinding-foam.json');
    const plan = compileAbility(source);
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    for (const degree of ['criticalSuccess', 'success']) {
        const [blinded] = plan.resolution.outcomes[degree].effects;
        assert.equal(blinded.slug, 'blinded');
        // No timer of its own: the spell's 1 minute, or sooner when the persistent acid damage ends.
        assert.equal(blinded.duration, null);
        assert.deepEqual(blinded.endsWhen, {event: 'persistent-damage-ended', damageType: 'acid'});
    }
    assert.equal(plan.lifecycle.durationSpec.value, 1);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['removal']);
    assert.match(reminderHTML(plan.resolution.reminders[0], String), /3 Interact actions.*remove its persistent damage condition/);
    // Without the sentence ending the spell with the persistent damage, "for the duration" isn't linked.
    const unlinked = structuredClone(source);
    unlinked.system.description.value = unlinked.system.description.value.replace(/When the target's persistent acid damage ends, the spell automatically ends\./, '');
    assert.notEqual(compileAbility(unlinked).resolution.check?.statistic, 'spell-attack');
    // A removal reminder is refused without a persistent-linked condition.
    const tampered = structuredClone(plan);
    for (const degree of ['criticalSuccess', 'success']) delete tampered.resolution.outcomes[degree].effects[0].endsWhen;
    assert.equal(inspectSavePlan(tampered).blockers.some(blocker => blocker.code === 'reminders'), true);
});
