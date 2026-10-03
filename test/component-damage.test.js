import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {compileAbility} from '../src/compiler/index.js';
import {inspectDegreeSavePlan} from '../scripts/basic-save-core.js';
import {selectComponentDamageRoll} from '../scripts/component-damage.js';

const root = fileURLToPath(new URL('../.cache/pf2e-test-fixtures/spells/spells/', import.meta.url));
const fixture = async path => JSON.parse(await readFile(`${root}${path}`, 'utf8'));
const damageFor = (plan, degree) => plan.resolution.outcomes[degree].damage;
const isPersistent = component => component.category === 'persistent' || component.type === 'bleed';

test('official two-component saves select initial and persistent damage independently', async () => {
    for (const [path, criticalPersistentMultiplier] of [
        ['cantrip/ancient-dust.json', 2],
        ['rank-2/cutting-insult.json', 2],
        ['rank-4/bursting-bloom.json', 1]
    ]) {
        const plan = compileAbility(await fixture(path));
        const components = plan.resolution.sharedDamage.components;
        const direct = components.find(component => !isPersistent(component));
        const persistent = components.find(isPersistent);
        assert.ok(direct && persistent, path);
        assert.equal(plan.compilerEvidence.componentSelectiveDamage.kind,
            'two-component-initial-persistent', path);
        assert.deepEqual(damageFor(plan, 'criticalSuccess'),
            {mode: 'none', multiplier: 0, sourceComponentIds: []}, path);
        assert.deepEqual(damageFor(plan, 'success'),
            {mode: 'shared', multiplier: 0.5, sourceComponentIds: [direct.id]}, path);
        assert.deepEqual(new Set(damageFor(plan, 'failure').sourceComponentIds),
            new Set([direct.id, persistent.id]), path);
        assert.equal(damageFor(plan, 'failure').multiplier, 1, path);
        assert.deepEqual(new Set(damageFor(plan, 'criticalFailure').sourceComponentIds),
            new Set([direct.id, persistent.id]), path);
        assert.equal(damageFor(plan, 'criticalFailure').multiplier, 2, path);
        assert.equal(damageFor(plan, 'criticalFailure').componentMultipliers?.[persistent.id] ?? 2,
            criticalPersistentMultiplier, path);
        assert.deepEqual(plan.resolution.sharedDamage.heightening,
            compileAbility(await fixture(path)).resolution.sharedDamage.heightening, path);
    }
});

test('component selection route requires intact source proof and exact structured selectors', async () => {
    const original = compileAbility(await fixture('cantrip/ancient-dust.json'));
    assert.equal(inspectDegreeSavePlan(original).supported, true);
    const [directId, persistentId] = original.compilerEvidence.componentSelectiveDamage.componentIds;
    const mutations = [
        plan => { delete plan.compilerEvidence.componentSelectiveDamage; },
        plan => { plan.compilerEvidence.componentSelectiveDamage.sourceText.failure += ' Extra rule.'; },
        plan => { plan.compilerEvidence.componentSelectiveDamage.byDegree.success.sourceComponentIds.push(persistentId); },
        plan => { plan.resolution.outcomes.success.damage.sourceComponentIds.push(persistentId); },
        plan => { plan.resolution.outcomes.criticalFailure.damage.componentMultipliers = {[persistentId]: 1}; },
        plan => { plan.resolution.sharedDamage.components.find(component => component.id === directId).category = 'persistent'; },
        plan => { plan.resolution.sharedDamage.components.find(component => component.id === persistentId).kinds = ['healing']; }
    ];
    for (const [index, mutate] of mutations.entries()) {
        const plan = structuredClone(original);
        mutate(plan);
        assert.equal(inspectDegreeSavePlan(plan).supported, false, `mutation ${index}`);
    }
});

test('detached renamed source uses changed component IDs, formulas, and types', async () => {
    const original = await fixture('rank-4/bursting-bloom.json');
    const custom = structuredClone(original);
    custom._id = 'custom-thorned-nova';
    custom.name = 'Thorned Nova';
    custom.system.slug = 'thorned-nova';
    delete custom._stats.compendiumSource;
    const [direct, persistent] = Object.values(custom.system.damage);
    direct.formula = '7d6';
    direct.type = 'cold';
    persistent.formula = '2d6';
    persistent.type = 'poison';
    const [oldDirect, oldPersistent] = Object.keys(original.system.damage);
    custom.system.damage = {'new-direct': direct, 'new-persistent': persistent};
    custom.system.heightening.damage = {
        'new-direct': original.system.heightening.damage[oldDirect],
        'new-persistent': original.system.heightening.damage[oldPersistent]
    };
    custom.system.heightening.interval = 3;
    custom.system.description.value = custom.system.description.value
        .replace('6d6 piercing damage', '7d6 cold damage')
        .replace('1d6 persistent bleed damage', '2d6 persistent poison damage')
        .replace('the persistent bleed damage increases', 'the persistent poison damage increases')
        .replace('Heightened (+2)', 'Heightened (+3)');
    const plan = compileAbility(custom);
    assert.equal(plan.source.name, 'Thorned Nova');
    assert.deepEqual(damageFor(plan, 'success').sourceComponentIds, ['new-direct']);
    assert.deepEqual(damageFor(plan, 'failure').sourceComponentIds,
        ['new-direct', 'new-persistent']);
    assert.deepEqual(damageFor(plan, 'criticalFailure').componentMultipliers,
        {'new-persistent': 1});
    assert.deepEqual(plan.compilerEvidence.componentSelectiveDamage.componentIds,
        ['new-direct', 'new-persistent']);
    assert.equal(plan.resolution.sharedDamage.heightening.interval, 3);
});

test('contradictory component grammar cannot earn selection proof', async () => {
    const original = await fixture('cantrip/ancient-dust.json');
    const mutations = [
        item => { item.system.description.value = item.system.description.value
            .replace('1 persistent void damage', '2 persistent void damage'); },
        item => { item.system.description.value = item.system.description.value
            .replace('no persistent damage.', 'no persistent damage. The target gains 1 action.'); },
        item => { item.system.description.value = item.system.description.value
            .replace('double the persistent damage.', 'triple the persistent damage.'); },
        item => { item.system.damage.extra = {...Object.values(item.system.damage)[0]}; },
        item => { item.system.heightening.damage.extra = '1d6'; },
        item => { item.system.description.value = item.system.description.value
            .replace('initial void damage increases by 1d6', 'initial void damage increases by 2d6'); },
        item => { item.system.description.value = item.system.description.value
            .replace('depending on its Fortitude save.', 'and takes 2 damage depending on its Fortitude save.'); }
    ];
    for (const [index, mutate] of mutations.entries()) {
        const item = structuredClone(original);
        item._id = `custom-ancient-${index}`;
        item.name = `Grey Dust ${index}`;
        delete item._stats.compendiumSource;
        mutate(item);
        assert.equal(compileAbility(item).compilerEvidence.componentSelectiveDamage, undefined, `mutation ${index}`);
    }
});

class NativeInstance {
    constructor(data) { Object.assign(this, data); this._evaluated = true; }
    toJSON() { return {...this}; }
    static fromData(data) { return new NativeInstance(data); }
}
class NativePool { static fromRolls(rolls) { return {rolls}; } }
class NativeRoll {
    constructor(instances) { this.instances = instances; this._evaluated = true; }
    static fromTerms([pool]) { return new NativeRoll(pool.rolls); }
    alter(multiplier) {
        return new NativeRoll(this.instances.map(instance =>
            new NativeInstance({...instance, scale: (instance.scale ?? 1) * multiplier})));
    }
}
const nativeClasses = {DamageRoll: NativeRoll, InstancePool: NativePool};

test('native projection selects and scales unique instances before one composed roll', () => {
    const components = [
        {id: 'persistent', type: 'void', category: 'persistent'},
        {id: 'direct', type: 'void', category: null}
    ];
    const original = new NativeRoll([
        new NativeInstance({type: 'void', persistent: true, total: 0, label: 'persistent'}),
        new NativeInstance({type: 'void', persistent: false, total: 4, label: 'direct'})
    ]);
    const success = selectComponentDamageRoll(original, components,
        {multiplier: 0.5, sourceComponentIds: ['direct']}, nativeClasses);
    assert.deepEqual(success.instances.map(instance => [instance.label, instance.scale]), [['direct', 0.5]]);
    const critical = selectComponentDamageRoll(original, components,
        {multiplier: 2, sourceComponentIds: ['direct', 'persistent'],
            componentMultipliers: {persistent: 1}}, nativeClasses);
    assert.deepEqual(critical.instances.map(instance => [instance.label, instance.scale]),
        [['direct', 2], ['persistent', undefined]]);
    assert.equal(original.instances[0].scale, undefined, 'selection does not mutate the stored roll');
});

test('complete uniform selection preserves PF2e evaluated minimum and original roll options', () => {
    const components = [
        {id: 'persistent', type: 'void', category: 'persistent'},
        {id: 'direct', type: 'void', category: null}
    ];
    const original = new NativeRoll([
        new NativeInstance({type: 'void', persistent: true, total: 0}),
        new NativeInstance({type: 'void', persistent: false, total: 0})
    ]);
    original.total = 1;
    original.options = {increasedFrom: 0};
    const full = selectComponentDamageRoll(original, components,
        {multiplier: 1, sourceComponentIds: ['direct', 'persistent']}, nativeClasses);
    assert.strictEqual(full, original, 'the native minimum and metadata remain attached');
    const double = selectComponentDamageRoll(original, components,
        {multiplier: 2, sourceComponentIds: ['direct', 'persistent']}, nativeClasses);
    assert.deepEqual(double.instances.map(instance => instance.scale), [2, 2],
        'uniform scaling follows the native complete-roll operation');
});

test('native projection fails closed on ambiguous, missing, and extra instances', () => {
    const components = [{id: 'direct', type: 'mental', category: null}];
    const selection = {multiplier: 1, sourceComponentIds: ['direct']};
    const instance = new NativeInstance({type: 'mental', persistent: false, total: 5});
    assert.throws(() => selectComponentDamageRoll(new NativeRoll([]), components, selection, nativeClasses), /omitted/);
    assert.throws(() => selectComponentDamageRoll(new NativeRoll([instance, instance]), components, selection, nativeClasses), /one-to-one/);
    assert.throws(() => selectComponentDamageRoll(new NativeRoll([new NativeInstance({type: 'fire', persistent: false})]),
        components, selection, nativeClasses), /one-to-one/);
    assert.throws(() => selectComponentDamageRoll(new NativeRoll([instance]), components,
        {...selection, sourceComponentIds: ['missing']}, nativeClasses), /unknown/);
    assert.throws(() => selectComponentDamageRoll(new NativeRoll([instance]),
        [...components, {id: 'other', type: 'mental', category: null}], selection, nativeClasses), /share one native signature/);
});
