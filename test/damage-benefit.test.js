import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {validateAbilityPlan} from '../src/compiler/validate-plan.js';
import {inspectSavePlan, isCasterDamageBenefit, isPostDamageDeath} from '../scripts/basic-save-core.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const DEATH = {kind: 'death', label: 'Dies at 0 HP', threshold: 0, requiresReductionBySource: true, automatic: true};

function detached(original, description = original.system.description.value, name = 'Custom Draining Spell') {
    const item = structuredClone(original);
    item._id = 'custom-draining-01';
    if (item._stats) delete item._stats.compendiumSource;
    item.name = name;
    item.system.slug = name.toLowerCase().replaceAll(' ', '-');
    item.system.description.value = description;
    return item;
}

test('the damage-derived family compiles exact benefits, terminals and recipients', async () => {
    const cases = [
        ['rank-3/vampiric-feast.json', {kind: 'temp-hp', aggregate: 'single-target', condition: 'always', fraction: 0.5, damageType: 'void', duration: {value: 1, unit: 'minutes'}}, null],
        ['rank-6/vampiric-exsanguination.json', {kind: 'temp-hp', aggregate: 'max-target', condition: 'always', fraction: 0.5, damageType: 'void', duration: {value: 1, unit: 'minutes'}}, null],
        ['rank-8/devour-life.json', {kind: 'heal-then-temp', aggregate: 'single-target', condition: 'always', fraction: 0.5, damageType: 'void', duration: {value: 1, unit: 'minutes'}}, DEATH],
        ['rank-1/all-encompassing-hunger.json', {kind: 'temp-hp', aggregate: 'single-target', condition: 'target-killed', fraction: 1, damageType: 'void', duration: {value: 1, unit: 'minutes'}}, DEATH]
    ];
    for (const [path, benefit, terminal] of cases) {
        const plan = compileAbility(await fixture(path));
        assert.deepEqual(validateAbilityPlan(plan), [], path);
        assert.deepEqual(inspectSavePlan(plan), {supported: true, route: 'degree-save', blockers: []}, path);
        const {sourceText, ...shape} = plan.resolution.casterBenefit;
        assert.deepEqual(shape, benefit, path);
        assert.ok(sourceText.length >= 2, path);
        assert.deepEqual(plan.resolution.postDamageTerminal, terminal, path);
    }
    const area = compileAbility(await fixture('rank-6/vampiric-exsanguination.json'));
    assert.deepEqual(area.targeting.actorConstraints.predicates, [{kind: 'living-creature'}]);
});

test('Vision of Death executes its proven death at 0 HP', async () => {
    const plan = compileAbility(await fixture('rank-4/vision-of-death.json'));
    assert.deepEqual(plan.resolution.postDamageTerminal, DEATH);
    assert.equal(inspectSavePlan(plan).supported, true);
});

test('detached renamed copies compile the same benefits', async () => {
    for (const path of ['rank-3/vampiric-feast.json', 'rank-8/devour-life.json']) {
        const original = compileAbility(await fixture(path)), copy = compileAbility(detached(await fixture(path)));
        assert.equal(inspectSavePlan(copy).supported, true, path);
        assert.deepEqual(copy.resolution.casterBenefit, original.resolution.casterBenefit, path);
    }
});

test('unproven benefit wording stays blocked', async () => {
    const feast = await fixture('rank-3/vampiric-feast.json');
    const text = feast.system.description.value;
    for (const [label, from, to] of [
        ['type mismatch', 'half the void damage the target takes', 'half the fire damage the target takes'],
        ['extra benefit sentence', 'You lose any remaining temporary Hit Points after 1 minute.', 'You lose any remaining temporary Hit Points after 1 minute. You also gain 5 temporary Hit Points.'],
        ['second duration', 'You lose any remaining temporary Hit Points after 1 minute.', 'You lose any remaining temporary Hit Points after 1 minute. These temporary Hit Points last for 1 minute.'],
        ['no duration', ' You lose any remaining temporary Hit Points after 1 minute.', ''],
        ['different aggregate', 'half the void damage the target takes (after applying resistances and the like)', 'half the total void damage dealt by this spell']
    ]) {
        assert.ok(text.includes(from), label);
        const plan = compileAbility(detached(feast, text.replace(from, to)));
        assert.equal(inspectSavePlan(plan).supported, false, label);
        assert.equal(plan.resolution.casterBenefit ?? null, null, label);
    }
    const two = structuredClone(feast); two.system.target.value = '2 living creatures';
    assert.equal(inspectSavePlan(compileAbility(detached(two))).supported, false, 'single-target benefit needs one target');
});

test('uncompiled caster benefits in save preambles block the route', async () => {
    // Soul Siphon's HP-lost benefit is compiled (cantrip-rank-1 batch 83); a wording it doesn't read stays a gap.
    const source = await fixture('rank-1/soul-siphon.json');
    source.system.description.value = source.system.description.value.replace('equal to the total amount of HP the target loses', 'equal to twice the HP the target loses');
    const plan = compileAbility(source);
    assert.ok(plan.automation.pendingCapabilities.includes('preamble:caster-benefit'));
    assert.equal(inspectSavePlan(plan).supported, false);
});

test('core contracts reject forged terminal and benefit shapes', async () => {
    const plan = compileAbility(await fixture('rank-3/vampiric-feast.json'));
    assert.equal(isCasterDamageBenefit(plan.resolution.casterBenefit, plan), true);
    for (const forged of [
        {fraction: 2}, {aggregate: 'sum'}, {damageType: 'fire'}, {kind: 'heal'}, {duration: {value: 0, unit: 'minutes'}},
        {condition: 'target-killed'}, {extra: true}
    ]) {
        const copy = structuredClone(plan);
        Object.assign(copy.resolution.casterBenefit, forged);
        assert.equal(inspectSavePlan(copy).supported, false, JSON.stringify(forged));
    }
    assert.equal(isPostDamageDeath(DEATH), true);
    assert.equal(isPostDamageDeath({...DEATH, threshold: 5}), false);
    assert.equal(isPostDamageDeath({...DEATH, requiresReductionBySource: false}), false);
});
