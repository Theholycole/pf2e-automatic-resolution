import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isExecutableStoredTriggerPlan, storedTriggerExposurePlan} from '../scripts/basic-save-core.js';

const spell = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}.json`, import.meta.url), 'utf8'));

test('Needle of Vengeance: a trigger held on its target, any number of times while sustained', async () => {
    const plan = compileAbility(await spell('rank-1/needle-of-vengeance'));
    assert.equal(isExecutableStoredTriggerPlan(plan), true);
    const stored = plan.resolution.storedTrigger;
    assert.deepEqual([stored.held, stored.endsOnTrigger, stored.sustained, stored.durationSeconds], [true, false, true, 60]);
    assert.match(stored.notes[0], /Name yourself or one of your allies/);
    const exposure = storedTriggerExposurePlan(plan);
    assert.equal(inspectSavePlan(exposure).supported, true, JSON.stringify(inspectSavePlan(exposure).blockers));
    assert.deepEqual(exposure.targeting.actorConstraints.predicates, [{kind: 'enemy-of-caster'}]);
    // An extra rule in the text isn't a held trigger.
    const extra = await spell('rank-1/needle-of-vengeance');
    extra.system.description.value = extra.system.description.value.replace('Name yourself or one of your allies.', 'Name yourself or one of your allies. The named creature gains a +1 status bonus to AC.');
    assert.equal(isExecutableStoredTriggerPlan(compileAbility(extra)), false);
});

test('Forbidden Thought: once, on the target\'s next turn, then temporarily immune', async () => {
    const plan = compileAbility(await spell('cantrip/forbidden-thought'));
    assert.equal(isExecutableStoredTriggerPlan(plan), true);
    const stored = plan.resolution.storedTrigger;
    assert.deepEqual([stored.endsOnTrigger, stored.markerDuration.anchor, stored.markerDuration.expiry, stored.immunity.value, stored.immunity.unit], [true, 'target-turn', 'turn-end', 1, 'minutes']);
    const exposure = storedTriggerExposurePlan(plan);
    assert.equal(inspectSavePlan(exposure).supported, true, JSON.stringify(inspectSavePlan(exposure).blockers));
    assert.deepEqual(exposure.resolution.temporaryImmunity.duration, {value: 1, unit: 'minutes'});
    // A one-time trigger on a sustained spell isn't read.
    const sustained = await spell('cantrip/forbidden-thought');
    sustained.system.duration = {sustained: true, value: '1 minute'};
    assert.equal(isExecutableStoredTriggerPlan(compileAbility(sustained)), false);
});
