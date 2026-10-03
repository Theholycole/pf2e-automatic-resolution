import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const variant = (source, id) => {
    const item = structuredClone(source);
    const overlay = source.system.overlays[id].system;
    for (const [key, value] of Object.entries(overlay)) {
        item.system[key] = key === 'damage'
            ? Object.fromEntries(Object.entries(item.system.damage).map(([k, v]) => [k, {...v, ...(value[k] ?? {})}]))
            : value && typeof value === 'object' && !Array.isArray(value) ? {...item.system[key], ...value} : value;
    }
    delete item.system.overlays;
    return item;
};
const damage = (plan, degree) => plan.resolution.outcomes[degree].damage;
const selected = (plan, degree) => { const d = damage(plan, degree); return (d.mode === 'mixed' ? d.shared : d).sourceComponentIds; };

test('spell attack with two damage entries: a miss row keeps one entry (Live Wire)', async () => {
    const source = await fixture('cantrip/live-wire.json');
    const plan = compileAbility(source);
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const [slashing, electricity] = Object.keys(source.system.damage);
    assert.deepEqual(selected(plan, 'criticalSuccess'), [slashing, electricity]);
    assert.equal(damage(plan, 'criticalSuccess').mode, 'mixed');
    assert.deepEqual(selected(plan, 'success'), [slashing, electricity]);
    assert.deepEqual(selected(plan, 'failure'), [electricity]);
    assert.equal(damage(plan, 'criticalFailure').mode, 'none');
    assert.equal(plan.compilerEvidence.componentSelectiveDamage.kind, 'attack-component-rows');
    assert.equal(plan.compilerEvidence.componentSelectiveDamage.rowText.failure, 'The target takes the electricity damage, but not the slashing damage.');
    // A tampered selection fails inspection.
    const forged = structuredClone(plan); forged.resolution.outcomes.failure.damage.sourceComponentIds = [slashing, electricity];
    assert.equal(inspectSavePlan(forged).supported, false);
    // A miss row naming a type the spell doesn't deal is refused.
    const wrong = structuredClone(source);
    wrong.system.description.value = wrong.system.description.value.replace('takes the electricity damage', 'takes the fire damage');
    assert.equal(inspectSavePlan(compileAbility(wrong)).supported, false);
    // A damage list that doesn't name every entry is refused.
    const partial = structuredClone(source);
    partial.system.description.value = partial.system.description.value.replace('1d4 slashing damage and 1d4 electricity damage', '1d4 electricity damage');
    assert.equal(inspectSavePlan(compileAbility(partial)).supported, false);
});

test('spell attack with two damage entries: extra damage by trait and a critical speed penalty (Purifying Icicle)', async () => {
    const plan = compileAbility(await fixture('rank-1/purifying-icicle.json'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(selected(plan, 'criticalSuccess'), ['0', '1']);
    assert.equal(damage(plan, 'criticalSuccess').multiplier, 2);
    assert.deepEqual(plan.resolution.conditionalDamage.map(entry => [entry.trait, entry.formula]), [['undead', '(1+1*(@item.rank - 1))d4[vitality]']]);
    assert.equal(plan.resolution.outcomes.criticalSuccess.modifiers[0].value, -10);
    assert.equal(plan.resolution.outcomes.criticalSuccess.modifiers[0].modifierType, 'circumstance');
});

test('spell attack with a persistent entry and a chosen damage type (Gouging Claw variants)', async () => {
    const source = await fixture('cantrip/gouging-claw.json');
    // The base item (untyped, "your choice of") is left to its variants.
    assert.equal(inspectSavePlan(compileAbility(source)).supported, false);
    for (const id of Object.keys(source.system.overlays)) {
        const plan = compileAbility(variant(source, id));
        assert.equal(inspectSavePlan(plan).supported, true, `${id}: ${JSON.stringify(inspectSavePlan(plan).blockers)}`);
        assert.equal(selected(plan, 'criticalSuccess').length, 2);
        assert.equal(damage(plan, 'criticalSuccess').multiplier, 2);
    }
    // A variant whose type isn't one of the text's choices is refused.
    const other = variant(source, Object.keys(source.system.overlays)[0]); other.system.damage['0'].type = 'fire';
    assert.equal(inspectSavePlan(compileAbility(other)).supported, false);
});

test('spell attack with two damage entries: the critical hit\'s AC penalty lasts with its persistent spirit damage (Warshard Shot)', async () => {
    // (Was blocked until rank 5 batch 5: the row's rule is now a note Effect carrying the penalty, removed with the persistent damage.)
    const plan = compileAbility(await fixture('rank-5/warshard-shot.json'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.outcomes.criticalSuccess.noteEffects.map(note => [note.whilePersistent, note.rules]),
        [['spirit', [{key: 'FlatModifier', selector: 'ac', type: 'status', value: -1}]]]);
});
