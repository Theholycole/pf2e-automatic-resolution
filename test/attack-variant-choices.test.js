import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
function mergeDeep(target, patch) {
    for (const [key, value] of Object.entries(patch)) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) ? mergeDeep(target[key], value) : value;
    return target;
}
const variant = (source, id) => {
    const item = structuredClone(source);
    item.system = mergeDeep(item.system, structuredClone(source.system.overlays[id].system ?? {}));
    delete item.system.overlays;
    return item;
};
const ids = source => Object.keys(source.system.overlays);
const supported = plan => inspectSavePlan(plan).supported;

test('the variant carries the damage type (Telekinetic Projectile)', async () => {
    const source = await fixture('cantrip/telekinetic-projectile.json');
    assert.equal(supported(compileAbility(source)), false); // untyped base: cast a variant
    for (const id of ids(source)) {
        const plan = compileAbility(variant(source, id));
        assert.equal(supported(plan), true, `${id}: ${JSON.stringify(inspectSavePlan(plan).blockers)}`);
        assert.equal(plan.resolution.outcomes.criticalSuccess.damage.multiplier, 2);
    }
    const fire = variant(source, ids(source)[0]); fire.system.damage['0'].type = 'fire';
    assert.equal(supported(compileAbility(fire)), false); // not one of the listed types
});

test('the variant carries the metal (Needle Darts)', async () => {
    const source = await fixture('cantrip/needle-darts.json');
    for (const id of ids(source)) {
        const plan = compileAbility(variant(source, id));
        assert.equal(supported(plan), true, `${id}: ${JSON.stringify(inspectSavePlan(plan).blockers)}`);
        assert.match(plan.resolution.outcomes.criticalSuccess.damage.formulas[0].formula, /@item\.level/);
    }
    // An extra rule after the attack is still refused.
    const extra = structuredClone(source);
    extra.system.description.value = extra.system.description.value.replace('returns to you after the attack.', 'returns to you after the attack. The target is pushed 5 feet.');
    assert.equal(supported(compileAbility(extra)), false);
});

test('the variant carries the action count and range (Horizon Thunder Sphere)', async () => {
    const source = await fixture('rank-1/horizon-thunder-sphere.json');
    const byTime = time => ids(source).find(id => source.system.overlays[id].system.time?.value === time);
    const two = compileAbility(variant(source, byTime('2')));
    assert.equal(supported(two), true, JSON.stringify(inspectSavePlan(two).blockers));
    assert.equal(two.resolution.outcomes.failure.damage.mode, 'none');
    assert.equal(two.resolution.outcomes.criticalSuccess.effects[0].slug, 'dazzled');
    const three = compileAbility(variant(source, byTime('3')));
    assert.equal(supported(three), true, JSON.stringify(inspectSavePlan(three).blockers));
    assert.equal(three.resolution.outcomes.failure.damage.multiplier, 0.5);
    assert.equal(three.resolution.outcomes.criticalFailure.damage.mode, 'none');
    // The two-round version (an area save as well) and a range that isn't the paragraph's are refused.
    assert.equal(supported(compileAbility(variant(source, byTime('2 rounds')))), false);
    const wrongRange = variant(source, byTime('2')); wrongRange.system.range.value = '60 feet';
    assert.equal(supported(compileAbility(wrongRange)), false);
});

test('the melee choice is its own variant (Ignition)', async () => {
    const source = await fixture('cantrip/ignition.json');
    const ranged = ids(source).find(id => !source.system.overlays[id].name);
    const melee = ids(source).find(id => /Melee/.test(source.system.overlays[id].name ?? ''));
    const plan = compileAbility(variant(source, ranged));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.resolution.outcomes.criticalSuccess.damage.formulas[0].heightening, {type: 'interval', interval: 1, formula: '1d4'});
    // The melee variant's critical persistent die (d6) isn't stated in the rows: refused.
    assert.equal(supported(compileAbility(variant(source, melee))), false);
});
