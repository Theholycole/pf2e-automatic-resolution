import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {isExecutableBasicSavePlan, dualEnergyMode, targetParticipates, healingTargets, sharedDamageRequired} from '../scripts/basic-save-core.js';

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
const byTime = (source, time, kinds) => Object.keys(source.system.overlays).find(id => {
    const overlay = source.system.overlays[id].system;
    return overlay.time?.value === time && (!kinds || JSON.stringify(overlay.damage?.['0']?.kinds ?? null) === JSON.stringify(kinds));
});

test('heal or harm: each Heal and Harm variant compiles to its own route', async () => {
    for (const [name, energy, healed, harmed] of [['harm', 'void', 'undead-or-void-healing', 'living-creature'], ['heal', 'vitality', 'living-creature', 'undead-or-void-healing']]) {
        const source = await fixture(`rank-1/${name}.json`);
        // The base offering 1 to 3 actions is left to its variants.
        assert.notEqual(compileAbility(source).automation.level, 'automatic', name);
        for (const time of ['1', '3']) {
            const plan = compileAbility(variant(source, byTime(source, time)));
            assert.equal(plan.automation.level, 'automatic', `${name} ${time}: ${plan.automation.pendingCapabilities}`);
            assert.deepEqual(plan.resolution.dualMode, {energy}, name);
            assert.deepEqual(plan.targeting.actorConstraints.predicates, [], name);
            assert.ok(isExecutableBasicSavePlan(plan), `${name} ${time}`);
        }
        const healing = compileAbility(variant(source, byTime(source, '2', ['healing'])));
        assert.equal(healing.resolution.kind, 'healing', name);
        assert.equal(healing.resolution.healing.formula, '1d8+8', name);
        assert.deepEqual(healing.targeting.actorConstraints.predicates.map(p => p.kind), [healed], name);
        const damage = compileAbility(variant(source, byTime(source, '2', ['damage'])));
        assert.equal(damage.resolution.kind, 'save', name);
        assert.equal(damage.resolution.dualMode, undefined, name);
        assert.deepEqual(damage.targeting.actorConstraints.predicates.map(p => p.kind), [harmed], name);
        assert.ok(isExecutableBasicSavePlan(damage), name);
    }
});

test('heal or harm: a changed grammar or item data is refused', async () => {
    const source = await fixture('rank-1/harm.json');
    const one = variant(source, byTime(source, '1'));
    // A different energy in the damage data than in the text.
    const wrongType = structuredClone(one); wrongType.system.damage['0'].type = 'fire';
    assert.equal(compileAbility(wrongType).resolution.dualMode, undefined);
    // A 2-action healing variant without the extra 8 Hit Points.
    const two = variant(source, byTime(source, '2', ['healing'])); two.system.damage['0'].formula = '1d8';
    assert.notEqual(compileAbility(two).automation.level, 'automatic');
    // An extra rule in the text.
    const extra = structuredClone(one);
    extra.system.description.value = extra.system.description.value.replace('you restore that amount of Hit Points.', 'you restore that amount of Hit Points. The target becomes Frightened 1.');
    assert.equal(compileAbility(extra).resolution.dualMode, undefined);
    // A forged dual mode without the compiler's evidence isn't executable.
    const plan = compileAbility(one); delete plan.compilerEvidence.healOrHarm;
    assert.equal(isExecutableBasicSavePlan(plan), false);
});

test('heal or harm: the creature decides heal, harm or unaffected', () => {
    const actor = (traits, extra = {}) => ({traits: new Set(traits), isOfType: type => type === 'creature', system: {traits: {value: traits}, attributes: {hp: {}}}, ...extra});
    assert.equal(dualEnergyMode({energy: 'void'}, actor(['humanoid'])), 'damage');
    assert.equal(dualEnergyMode({energy: 'void'}, actor(['undead'])), 'healing');
    assert.equal(dualEnergyMode({energy: 'void'}, actor(['construct'])), 'unaffected');
    assert.equal(dualEnergyMode({energy: 'vitality'}, actor(['humanoid'])), 'healing');
    assert.equal(dualEnergyMode({energy: 'vitality'}, actor(['undead'])), 'damage');
    assert.equal(dualEnergyMode({energy: 'vitality'}, actor(['humanoid'], {hitPoints: {negativeHealing: true}})), 'damage');
    const state = {damage: {enabled: true}, targets: [{mode: 'healing'}, {mode: 'damage'}]};
    assert.equal(targetParticipates(state.targets[0]), false);
    assert.equal(targetParticipates(state.targets[1]), true);
    assert.equal(healingTargets(state).length, 1);
    // A healed target alone still needs the spell's roll.
    assert.equal(sharedDamageRequired({damage: {enabled: true}, targets: [{mode: 'healing'}]}), true);
});
