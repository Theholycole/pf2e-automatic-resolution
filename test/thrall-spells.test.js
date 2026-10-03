import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, executableThrall} from '../scripts/basic-save-core.js';

const spell = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}.json`, import.meta.url), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;

test('Necrotic Bomb: an emanation around the thrall, which is destroyed', async () => {
    const plan = compileAbility(await spell('rank-1/necrotic-bomb'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual([plan.targeting.thrall.origin, plan.targeting.thrall.radius, plan.targeting.thrall.range, plan.targeting.thrall.destroyed], ['emanation', 10, 30, true]);
    assert.ok(plan.resolution.reminders.some(reminder => reminder.kind === 'thrall-destroyed'));
});

test("Bone Spear: a line from the thrall's space; Dead Weight: one creature within 15 feet of it", async () => {
    const spear = compileAbility(await spell('rank-1/bone-spear'));
    assert.equal(supported(spear), true);
    assert.deepEqual([spear.targeting.thrall.origin, spear.targeting.thrall.size], ['line', 15]);
    const weight = compileAbility(await spell('rank-1/dead-weight'));
    assert.equal(supported(weight), true, JSON.stringify(inspectSavePlan(weight).blockers));
    assert.deepEqual([weight.targeting.thrall.origin, weight.targeting.thrall.within, weight.targeting.thrall.maxTargets], ['within', 15, 1]);
});

test('thrall readings refuse mismatches', async () => {
    // The text's emanation must be the item's area.
    const bomb = await spell('rank-1/necrotic-bomb'); bomb.system.area.value = 15;
    assert.equal(compileAbility(bomb).targeting.thrall, undefined);
    assert.equal(supported(compileAbility(bomb)), false);
    // A tampered spec is refused.
    const plan = compileAbility(await spell('rank-1/necrotic-bomb'));
    assert.equal(executableThrall({...plan, targeting: {...plan.targeting, thrall: {...plan.targeting.thrall, radius: 20}}}), false);
    // Deathly Scream's narration ("While the sound is loud, …") has no rule in it (cantrip/rank-1 batch 1); a "While" sentence
    // with a rule is still an ongoing trigger.
    assert.equal(supported(compileAbility(await spell('rank-1/deathly-scream'))), true);
    const ruled = await spell('rank-1/deathly-scream');
    ruled.system.description.value = ruled.system.description.value.replace('only those closest can feel the true sting of death in it', 'creatures within it take a –1 status penalty to saves');
    assert.equal(supported(compileAbility(ruled)), false);
});
