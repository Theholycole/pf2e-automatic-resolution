import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {ruleValueAtRank} from '../src/compiler/degree-choice-effect.js';
import {inspectSavePlan, isExecutableStoredTriggerPlan, storedTriggerExposurePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;
const effects = (plan, degree) => plan.resolution.outcomes[degree].effects;
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}

test('Weird (any number of creatures) and Attacked from Within (a "varies" duration with self-limiting Frightened)', async () => {
    const weird = compileAbility(await spell('rank-9/weird'));
    assert.equal(supported(weird), true, JSON.stringify(inspectSavePlan(weird).blockers));
    assert.equal(weird.targeting.actorConstraints.complete, true);
    const within = compileAbility(await spell('rank-7/attacked-from-within'));
    assert.equal(supported(within), true, JSON.stringify(inspectSavePlan(within).blockers));
    assert.equal(within.lifecycle.durationSpec.mode, 'outcome');
});

test('Wails of the Damned: Drained rolled from 1d4', async () => {
    const plan = compileAbility(await spell('rank-9/wails-of-the-damned'));
    assert.equal(supported(plan), true);
    assert.equal(effects(plan, 'failure').find(effect => effect.slug === 'drained').valueRoll, '1d4');
    assert.equal(effects(plan, 'criticalFailure').find(effect => effect.slug === 'drained').value, 4);
});

test('Leaden Steps: a degree Effect with weakness at the rank, lasting the sustained spell; success ends sooner', async () => {
    const plan = compileAbility(await spell('rank-1/leaden-steps'), {nativeEffectCatalog: await catalog()});
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    const success = plan.resolution.outcomes.success.nativeEffects[0].outcomeRule;
    assert.deepEqual(success.durationOverride, {value: 1, unit: 'rounds', expiry: 'turn-end'});
    assert.ok(success.claims.some(claim => /can't be sustained/.test(claim)));
    assert.equal(plan.resolution.outcomes.failure.nativeEffects[0].outcomeRule.durationAnchor, 'effect-start');
    assert.deepEqual([ruleValueAtRank('1+@item.level', 1), ruleValueAtRank('2+@item.level', 1), ruleValueAtRank('ceil(@item.level/2)*2', 3)], [2, 3, 4]);
    assert.equal(ruleValueAtRank('@actor.level', 1), null);
});

test("Animus Mine and Bandit's Doom wait for their trigger", async () => {
    const mine = compileAbility(await spell('rank-2/animus-mine'));
    assert.equal(isExecutableStoredTriggerPlan(mine), true);
    assert.equal(supported(mine), false, 'never a one-time save');
    assert.equal(supported(storedTriggerExposurePlan(mine)), true);
    assert.deepEqual(mine.resolution.storedTrigger.rowNotes.map(note => note.degree), ['criticalFailure']);
    const doom = compileAbility(await spell('rank-5/bandits-doom'));
    assert.equal(isExecutableStoredTriggerPlan(doom), true);
    assert.equal(doom.resolution.storedTrigger.supersedes, true);
    // A trigger sentence with another rule is refused.
    const extra = await spell('rank-2/animus-mine');
    extra.system.description.value = extra.system.description.value.replace('You can Dismiss the spell.', 'You can Dismiss the spell. You gain a +1 status bonus to Will saves.');
    assert.equal(isExecutableStoredTriggerPlan(compileAbility(extra)), false);
});

test('Fear: Frightened 3 is not timed by the 1 round written after Fleeing', async () => {
    const plan = compileAbility(await spell('rank-1/fear'));
    const critical = effects(plan, 'criticalFailure');
    assert.equal(critical.find(effect => effect.slug === 'frightened').duration ?? null, null);
    assert.equal(critical.find(effect => effect.slug === 'fleeing').duration.value, 1);
});
