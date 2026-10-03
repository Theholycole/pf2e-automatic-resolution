import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {compileAbility} from '../src/compiler/index.js';
import {validateAbilityPlan} from '../src/compiler/validate-plan.js';
import {composeInlinePersistentDamageRoll} from '../scripts/component-damage.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const root = fileURLToPath(new URL('../.cache/pf2e-test-fixtures/spells/spells/', import.meta.url));
const fixture = async path => JSON.parse(await readFile(`${root}${path}`, 'utf8'));

test('explicit saves combine structured initial damage with rank-scaled inline bleed', async () => {
    for (const [path, directCount] of [
        ['rank-1/grim-tendrils.json', 1],
        ['rank-1/ulcerous-canker.json', 2]
    ]) {
        const plan = compileAbility(await fixture(path));
        const proof = plan.compilerEvidence.inlinePersistentDamage;
        const ids = plan.resolution.sharedDamage.components.map(component => component.id);
        assert.equal(proof.kind, 'inline-persistent-plus-structured', path);
        assert.equal(ids.length, directCount, path);
        assert.deepEqual(proof.directComponentIds, ids, path);
        assert.deepEqual(plan.resolution.outcomes.criticalSuccess.damage,
            {mode:'none',multiplier:0,sourceComponentIds:[]}, path);
        assert.deepEqual(plan.resolution.outcomes.success.damage,
            {mode:'shared',multiplier:0.5,sourceComponentIds:ids}, path);
        for (const [degree, multiplier] of [['failure', 1], ['criticalFailure', 2]]) {
            const damage = plan.resolution.outcomes[degree].damage;
            assert.equal(damage.mode, 'mixed', path);
            assert.equal(damage.rollScope, 'combined', path);
            assert.deepEqual(damage.shared, {multiplier,sourceComponentIds:ids}, path);
            assert.equal(damage.formulas.length, 1, path);
            assert.match(damage.formulas[0].formula, /\[persistent,bleed\]$/, path);
            assert.equal(proof.sourceText[degree], plan.resolution.outcomes[degree].rawText, path);
        }
        assert.deepEqual(validateAbilityPlan(plan), [], path);
        assert.deepEqual(inspectSavePlan(plan), {supported:true,route:'degree-save',blockers:[]}, path);
    }
});

test('detached source rebinds structured IDs, direct types, inline amount, and heightening', async () => {
    const item = structuredClone(await fixture('rank-1/ulcerous-canker.json'));
    item._id = 'detached-inline-bleed';
    item.name = 'Grieving Laceration';
    item.system.slug = 'grieving-laceration';
    delete item._stats.compendiumSource;
    const [oldVoid, oldPoison] = Object.keys(item.system.damage);
    const [voidPart, poisonPart] = Object.values(item.system.damage);
    voidPart.formula = '2d4';
    voidPart.type = 'cold';
    poisonPart.formula = '2d4';
    poisonPart.type = 'mental';
    item.system.damage = {'new-cold':voidPart,'new-mental':poisonPart};
    item.system.heightening.damage = {
        'new-cold':item.system.heightening.damage[oldVoid],
        'new-mental':item.system.heightening.damage[oldPoison]
    };
    item.system.description.value = item.system.description.value
        .replaceAll('1d4 void damage', '2d4 cold damage')
        .replaceAll('1d4 poison damage', '2d4 mental damage')
        .replaceAll('void damage and poison damage', 'cold damage and mental damage');
    const plan = compileAbility(item);
    assert.deepEqual(plan.compilerEvidence.inlinePersistentDamage.directComponentIds,
        ['new-cold','new-mental']);
    assert.deepEqual(plan.resolution.outcomes.failure.damage.shared.sourceComponentIds,
        ['new-cold','new-mental']);
});

test('detached delivery wording compiles without a spell identity', async () => {
    const item = structuredClone(await fixture('rank-1/grim-tendrils.json'));
    item._id = 'detached-shadow-flow';
    item.name = 'Shadow Flow';
    delete item._stats.compendiumSource;
    item.system.description.value = item.system.description.value.replace(
        'Tendrils of darkness curl out from your fingertips and race through the air.',
        'Shadows of dusk surge out from your hands and flow through the air.');
    const plan = compileAbility(item);
    assert.equal(plan.compilerEvidence.inlinePersistentDamage.kind, 'inline-persistent-plus-structured');
    assert.equal(inspectSavePlan(plan).supported, true);
});

test('route rejects stale proof, changed direct components, and secondary damage composition', async () => {
    const base = compileAbility(await fixture('rank-1/grim-tendrils.json'));
    const mutations = [
        plan => {plan.resolution.outcomes.failure.rawText += ' Changed.';},
        plan => {plan.resolution.outcomes.failure.damage.shared.sourceComponentIds = ['other'];},
        plan => {plan.resolution.sharedDamage.components[0].formula = '3d4';},
        plan => {plan.lifecycle.durationSpec = {mode:'fixed',value:1,unit:'minutes'};},
        plan => {plan.lifecycle.controller = {required:true};},
        plan => {plan.resolution.outcomes.failure.followUps = [{kind:'save'}];}
    ];
    for (const [index, mutate] of mutations.entries()) {
        const plan = structuredClone(base);
        mutate(plan);
        assert.equal(inspectSavePlan(plan).supported, false, `mutation ${index}`);
    }
});

test('extra rules or contradictory inline damage cannot earn composition proof', async () => {
    const original = await fixture('rank-1/grim-tendrils.json');
    const mutations = [
        item => {item.system.description.value = item.system.description.value.replace(
            'no persistent bleed damage.', 'no persistent bleed damage. The target gains an action.');},
        item => {item.system.description.value = item.system.description.value.replace(
            'double persistent bleed damage.', 'triple persistent bleed damage.');},
        item => {item.system.description.value = item.system.description.value.replace(
            'persistent bleed damage increases by 1', 'persistent bleed damage increases by 2');},
        item => {item.system.description.value = item.system.description.value.replace(
            '@Damage[(@item.level)[bleed]]', '@Damage[(@item.level)[fire]]');},
        item => {item.system.description.value = item.system.description.value.replace(
            'Each living creature in the line must attempt', 'Each living creature in the line gains 1 action and must attempt');},
        item => {item.system.description.value = item.system.description.value.replace(
            'Tendrils of darkness curl out from your fingertips and race through the air.',
            'You silence all foes.');},
        item => {item.system.description.value = item.system.description.value.replace(
            'Tendrils of darkness curl out from your fingertips and race through the air.',
            'Foes lose reactions.');},
        item => {item.system.description.value = item.system.description.value.replace(
            'Tendrils of darkness curl out from your fingertips and race through the air.',
            'Only flying creatures are affected.');},
        item => {item.system.duration.value = '1 minute';},
        item => {item.system.duration.sustained = true;},
        item => {item.system.damage.extra = {...Object.values(item.system.damage)[0]};}
    ];
    for (const [index, mutate] of mutations.entries()) {
        const item = structuredClone(original);
        item._id = `detached-inline-negative-${index}`;
        delete item._stats.compendiumSource;
        mutate(item);
        assert.equal(compileAbility(item).compilerEvidence.inlinePersistentDamage, undefined, `mutation ${index}`);
    }
});

test('multi-type direct damage requires an initial-damage claim for both components', async () => {
    const original = await fixture('rank-1/ulcerous-canker.json');
    for (const [oldText, changedText] of [
        ['half the initial damage', 'half the void damage'],
        ['double initial damage', 'double void damage']
    ]) {
        const item = structuredClone(original);
        item.system.description.value = item.system.description.value.replace(oldText, changedText);
        assert.equal(compileAbility(item).compilerEvidence.inlinePersistentDamage, undefined, changedText);
    }
});

class NativeInstance {
    constructor(data) {Object.assign(this, data);this._evaluated=true;
        this.options ??= {flavor:this.persistent?`persistent,${this.type}`:this.type};}
    get formula() {return `${this.total}[${this.persistent?'persistent,':''}${this.type}]`;}
    get _formula() {return this.formula;}
    get head() {return {formula:this.rawHead ?? String(this.total)};}
    toJSON() {return {...this};}
    static fromData(data) {return new NativeInstance(data);}
}
class NativePool {
    constructor(rolls) {this.rolls=rolls;}
    static fromRolls(rolls) {return new NativePool(rolls);}
    get formula() {return `{${this.rolls.map(roll=>roll._formula).join(',')}}`;}
    toJSON() {return {rolls:this.rolls.map(roll => roll.toJSON())};}
}
class NativeRoll {
    constructor(instances, {total=0,options={},rawFormula=null}={}) {
        if (typeof instances === 'string') {
            const flavors=[...instances.matchAll(/\)\[([a-z,]+)\](?=,|\})/g)].map(match=>match[1].split(','));
            instances=flavors.map(parts=>new NativeInstance({
                type:parts.find(part=>part!=='persistent'&&part!=='damage')??'untyped',
                persistent:parts.includes('persistent'),total:0
            }));
        }
        this.instances=instances;this.total=total;this.options=options;this._evaluated=true;this._formula=rawFormula;
    }
    get formula() {return this.instances.map(instance=>instance.formula).join(' + ');}
    toJSON() {return {formula:this._formula ?? new NativePool(this.instances).formula,
        terms:[new NativePool(this.instances).toJSON()],total:this.total,options:{...this.options}};}
    static validate(formula) {return /^\{(?:\([^{}]+\)\[[a-z,]+\],?)+\}$/.test(formula);}
    static fromData(data) {return new NativeRoll(data.terms[0].rolls.map(NativeInstance.fromData),
        {total:data.total,options:data.options,rawFormula:data.formula.replaceAll('(1)', '1')});}
    alter(multiplier) {return new NativeRoll(this.instances.map(instance =>
        new NativeInstance({...instance,total:instance.total*multiplier})),
        {total:this.total*multiplier,options:{...this.options}});}
}
const classes={DamageRoll:NativeRoll,InstancePool:NativePool};

test('one native composition preserves direct order, options, minimum, and bleed instance', () => {
    const direct=new NativeRoll([
        new NativeInstance({type:'void',persistent:false,total:0}),
        new NativeInstance({type:'poison',persistent:false,total:0})
    ],{total:1,options:{increasedFrom:0,bypass:{resistance:{ignore:[{type:'void',max:3}]}}}});
    const persistent=new NativeRoll([new NativeInstance({type:'bleed',persistent:true,total:0,rawHead:'2 * (1)'})],
        {total:0,options:{}});
    const components=[
        {id:'void',type:'void',category:null,kinds:['damage']},
        {id:'poison',type:'poison',category:null,kinds:['damage']}
    ];
    const combined=composeInlinePersistentDamageRoll(direct,persistent,components,
        {multiplier:1,sourceComponentIds:['void','poison']},classes);
    assert.equal(combined.total,1);
    assert.deepEqual(combined.options,direct.options);
    assert.deepEqual(combined.instances.map(instance=>[instance.type,instance.persistent]),
        [['void',false],['poison',false],['bleed',true]]);
    assert.match(combined.formula,/\[persistent,bleed\]/);
    assert.equal(NativeRoll.validate(combined.toJSON().formula),true,
        'serialized formula must be native parser input, not a display label');
    assert.match(combined.toJSON().formula,/2 \* 1/,
        'native grouping normalization is accepted after semantic reparse');
    assert.deepEqual(NativeRoll.fromData(combined.toJSON()).instances.map(instance=>[instance.type,instance.persistent]),
        [['void',false],['poison',false],['bleed',true]]);
    assert.equal(direct.instances.length,2,'the stored direct roll is not mutated');
    const doubled=composeInlinePersistentDamageRoll(direct,persistent,components,
        {multiplier:2,sourceComponentIds:['void','poison']},classes);
    assert.equal(doubled.total,2);
    assert.equal(doubled.instances.at(-1).total,0,'persistent amount is independently rolled');
    assert.match(doubled.toJSON().formula,/\)\[void\],\(.*\)\[poison\],\(.*\)\[persistent,bleed\]\}$/);
    assert.equal(NativeRoll.validate(doubled.toJSON().formula),true);
});

test('native composition rejects ambiguous instances and unexpected persistent evaluation', () => {
    const components=[{id:'cold',type:'cold',category:null,kinds:['damage']}];
    const selected={multiplier:1,sourceComponentIds:['cold']};
    const direct=new NativeRoll([new NativeInstance({type:'cold',persistent:false,total:4})],{total:4});
    const persistent=new NativeRoll([new NativeInstance({type:'bleed',persistent:true,total:0})],{total:0});
    assert.throws(()=>composeInlinePersistentDamageRoll(new NativeRoll([], {total:4}),persistent,
        components,selected,classes),/missing or ambiguous/);
    assert.throws(()=>composeInlinePersistentDamageRoll(direct,new NativeRoll([
        new NativeInstance({type:'bleed',persistent:true,total:1})],{total:1}),
        components,selected,classes),/inline bleed/);
    assert.throws(()=>composeInlinePersistentDamageRoll(direct,persistent,components,
        {...selected,sourceComponentIds:['unknown']},classes),/structured direct/);
});
