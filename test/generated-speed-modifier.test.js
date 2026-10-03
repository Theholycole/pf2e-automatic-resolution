import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {compileAbility} from '../src/compiler/index.js';
import {validateAbilityPlan} from '../src/compiler/validate-plan.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {inspectGeneratedSpeedProof,prepareGeneratedSpeedEffectSource} from '../scripts/generated-outcome-modifier.js';

const root=fileURLToPath(new URL('../.cache/pf2e-test-fixtures/spells/spells/',import.meta.url));
const fixture=async path=>JSON.parse(await readFile(`${root}${path}`,'utf8'));

test('damage and generated Speed penalties compose at separate durations for every save degree',async()=>{
    const plan=compileAbility(await fixture('rank-1/chilling-spray.json'));
    assert.deepEqual(validateAbilityPlan(plan),[]);
    assert.deepEqual(inspectSavePlan(plan),{supported:true,route:'degree-save',blockers:[]});
    assert.deepEqual(Object.fromEntries(Object.entries(plan.resolution.outcomes).map(([degree,outcome])=>
        [degree,{damage:outcome.damage.multiplier,speed:outcome.modifiers.map(m=>m.value)}])),{
        criticalSuccess:{damage:0,speed:[]},success:{damage:0.5,speed:[]},
        failure:{damage:1,speed:[-5]},criticalFailure:{damage:2,speed:[-10]}
    });
    for(const degree of ['failure','criticalFailure']){
        const modifier=plan.resolution.outcomes[degree].modifiers[0];
        assert.deepEqual(modifier.duration,{mode:'fixed',value:2,unit:'rounds',expiry:'turn-start',
            anchor:'effect-start',offset:0,sourceText:'for 2 rounds'});
        assert.equal(modifier.modifierType,'status');
        assert.equal(plan.resolution.outcomes[degree].semanticCoverage.fullyCompiled,true);
    }
});

test('condition, inherited Speed penalty, and Slowed keep independent degree lifetimes',async()=>{
    const plan=compileAbility(await fixture('rank-3/magical-fetters.json'));
    assert.deepEqual(validateAbilityPlan(plan),[]);
    assert.equal(inspectSavePlan(plan).supported,true);
    const outcomes=plan.resolution.outcomes;
    assert.deepEqual(outcomes.success.effects.map(e=>[e.slug,e.value,e.duration.value,e.duration.unit]),
        [['clumsy',1,1,'rounds']]);
    assert.deepEqual(outcomes.failure.effects.map(e=>[e.slug,e.value,e.duration.value,e.duration.unit]),
        [['clumsy',3,1,'minutes']]);
    assert.deepEqual(outcomes.criticalFailure.effects.map(e=>[e.slug,e.value,e.duration.value,e.duration.unit]),
        [['clumsy',3,1,'minutes'],['slowed',1,1,'minutes']]);
    assert.deepEqual(['success','failure','criticalFailure'].map(d=>outcomes[d].modifiers[0].value),
        [-10,-10,-10]);
    assert.deepEqual(['success','failure','criticalFailure'].map(d=>outcomes[d].modifiers[0].duration.unit),
        ['rounds','minutes','minutes']);
    assert.equal(outcomes.criticalFailure.modifiers[0].claimText,outcomes.failure.rawText);
    assert.equal(outcomes.criticalFailure.modifiers[0].inheritedFrom,'failure');
    const persisted=Object.fromEntries(Object.entries(outcomes).map(([degree,outcome])=>[degree,{
        rawText:outcome.rawText,damage:structuredClone(outcome.damage),
        modifiers:structuredClone(outcome.modifiers),
        effects:outcome.effects.map(effect=>({kind:effect.kind,slug:effect.slug,name:effect.name,
            value:effect.value,duration:structuredClone(effect.duration),raw:effect.raw}))
    }]));
    assert.equal(inspectGeneratedSpeedProof(plan.compilerEvidence.generatedSpeedPenalties,persisted,
        {lifecycle:plan.lifecycle}).supported,true,'saved-card snapshot must retain source proof');
});

test('inherited Speed survives an independent added-condition duration and condition identity',async()=>{
    const base=await fixture('rank-3/magical-fetters.json');
    const shorter=structuredClone(base);
    shorter.system.description.value=shorter.system.description.value.replace('for the duration.','for 2 rounds.');
    const changed=compileAbility(shorter);
    assert.equal(inspectSavePlan(changed).supported,true);
    assert.equal(changed.resolution.outcomes.criticalFailure.modifiers[0].duration.unit,'minutes');
    assert.equal(changed.resolution.outcomes.criticalFailure.effects.at(-1).duration.value,2);
    assert.equal(changed.resolution.outcomes.criticalFailure.effects.at(-1).duration.unit,'rounds');

    const renamed=structuredClone(base);
    renamed._id='detached-fetters-condition'; delete renamed._stats.compendiumSource;
    renamed.system.description.value=renamed.system.description.value.replace(
        'Compendium.pf2e.conditionitems.Item.xYTAsEpcJE1Ccni3]{Slowed 1}',
        'Compendium.pf2e.conditionitems.Item.e1XGnhKNSQIm5IXg]{Stupefied 2}');
    const renamedPlan=compileAbility(renamed);
    assert.equal(inspectSavePlan(renamedPlan).supported,true);
    assert.deepEqual(renamedPlan.resolution.outcomes.criticalFailure.effects.at(-1).duration,
        {mode:'fixed',value:1,unit:'minutes',expiry:null,anchor:'effect-start',offset:0,
            sourceText:'for the duration'});
    assert.equal(renamedPlan.resolution.outcomes.criticalFailure.effects.at(-1).slug,'stupefied');
    assert.equal(renamedPlan.resolution.outcomes.criticalFailure.effects.at(-1).value,2);
});

test('detached altered penalties and durations compile without source identity dispatch',async()=>{
    const item=structuredClone(await fixture('rank-1/chilling-spray.json'));
    item._id='detached-speed-cold'; item.name='Frost Scour';
    delete item._stats.compendiumSource;
    item.system.description.value=item.system.description.value
        .replace('–5-foot status penalty','–15-foot status penalty')
        .replace('–10-foot status penalty','–20-foot status penalty')
        .replaceAll('for 2 rounds','for 3 rounds');
    const plan=compileAbility(item);
    assert.equal(inspectSavePlan(plan).supported,true);
    assert.equal(plan.resolution.outcomes.failure.modifiers[0].value,-15);
    assert.equal(plan.resolution.outcomes.criticalFailure.modifiers[0].value,-20);
    assert.equal(plan.resolution.outcomes.failure.modifiers[0].duration.value,3);
});

test('generated native Effect has one typed FlatModifier and an owned independent lifetime',async()=>{
    const plan=compileAbility(await fixture('rank-1/chilling-spray.json'));
    const modifier=plan.resolution.outcomes.failure.modifiers[0];
    const source=prepareGeneratedSpeedEffectSource(modifier,{
        claimText:plan.resolution.outcomes.failure.rawText,degree:'failure',castId:'cast-1',castRank:4,
        effectStart:{value:123,initiative:17,started:false},sourceActorUuid:'Actor.caster',
        sourceItemUuid:'Actor.caster.Item.spell',sourceItemName:'Frost Scour',
        targetActorUuid:'Actor.target',compilerVersion:'test',operationId:'cast-1:target:speed:0'
    });
    assert.equal(source.type,'effect');
    assert.deepEqual(source.system.rules,[{key:'FlatModifier',selector:'all-speeds',type:'status',value:-5}]);
    assert.deepEqual(source.system.duration,{value:2,unit:'rounds',expiry:'turn-start',sustained:false});
    assert.deepEqual(source.system.start,{value:123,initiative:17});
    assert.equal(source.system.context.target.actor,'Actor.target');
    assert.equal(source.flags['pf2e-automatic-resolution'].runtime.castInstanceId,'cast-1');
});

test('unknown clauses, unsupported lifetimes, and changed proof remain blocked',async()=>{
    const base=await fixture('rank-1/chilling-spray.json');
    for(const [label,replace,withText] of [
        ['action','for 2 rounds.','for 2 rounds. The target loses a reaction.'],
        ['spell-end','for 2 rounds.','until the spell ends.'],
        ['area-exit','for 2 rounds.','until it leaves the area.']
    ]){
        const item=structuredClone(base);
        item.system.description.value=item.system.description.value.replace(replace,withText);
        assert.equal(inspectSavePlan(compileAbility(item)).supported,false,label);
    }
    const original=compileAbility(base);
    for(const mutate of [
        plan=>{plan.resolution.outcomes.failure.modifiers[0].value=-30;},
        plan=>{plan.resolution.outcomes.failure.rawText+=' Extra mechanics.';},
        plan=>{plan.resolution.outcomes.failure.modifiers[0].duration.value=9;},
        plan=>{plan.compilerEvidence.generatedSpeedPenalties.conditionEffects.failure.push({slug:'slowed'});}
    ]){
        const plan=structuredClone(original); mutate(plan);
        assert.equal(inspectSavePlan(plan).supported,false);
        assert.notDeepEqual(validateAbilityPlan(plan),[]);
    }
    for(const mutate of [
        modifier=>{modifier.value=-20;},
        modifier=>{modifier.duration.value=9;},
        modifier=>{modifier.modifierType='item';}
    ]){
        const plan=structuredClone(original);
        mutate(plan.resolution.outcomes.failure.modifiers[0]);
        mutate(plan.compilerEvidence.generatedSpeedPenalties.byDegree.failure[0]);
        assert.equal(inspectSavePlan(plan).supported,false,'paired proof mutation still contradicts source');
    }
    const conditionBase=compileAbility(await fixture('rank-3/magical-fetters.json'));
    for(const mutate of [
        effect=>{effect.value=3;},
        effect=>{effect.duration.value=3;}
    ]){
        const plan=structuredClone(conditionBase);
        mutate(plan.resolution.outcomes.success.effects[0]);
        mutate(plan.compilerEvidence.generatedSpeedPenalties.conditionEffects.success[0]);
        assert.equal(inspectSavePlan(plan).supported,false,'condition mutation cannot hide inside a Speed claim');
    }
    const inheritedCondition=structuredClone(conditionBase);
    inheritedCondition.resolution.outcomes.criticalFailure.effects.at(-1).value=3;
    inheritedCondition.compilerEvidence.generatedSpeedPenalties.conditionEffects.criticalFailure.at(-1).value=3;
    assert.equal(inspectSavePlan(inheritedCondition).supported,false,
        'inherited added condition must retain its source value');
    const conflicting=structuredClone(await fixture('rank-3/magical-fetters.json'));
    conflicting.system.description.value=conflicting.system.description.value.replace(
        'is clumsy 3 and takes a –10-foot status penalty to its Speed for 1 minute',
        'is clumsy 3 for 2 rounds and takes a –10-foot status penalty to its Speed for 1 minute');
    assert.equal(inspectSavePlan(compileAbility(conflicting)).supported,false);
    const contradiction=structuredClone(await fixture('rank-3/magical-fetters.json'));
    contradiction.system.description.value=contradiction.system.description.value.replace(
        'As failure, but the target is also @UUID[Compendium.pf2e.conditionitems.Item.xYTAsEpcJE1Ccni3]{Slowed 1} for the duration.',
        'As failure, but the target is unaffected.');
    const contradictoryPlan=compileAbility(contradiction);
    assert.ok(contradictoryPlan.automation.pendingCapabilities.includes('speed-modifier-inheritance'));
    assert.equal(inspectSavePlan(contradictoryPlan).supported,false);
    const missing=compileAbility(await fixture('rank-3/magical-fetters.json'));
    missing.resolution.outcomes.criticalFailure.modifiers=[];
    missing.compilerEvidence.generatedSpeedPenalties.byDegree.criticalFailure=[];
    assert.equal(inspectSavePlan(missing).supported,false,'inherited modifier cannot be deleted with proof');
});

test('Grasping Grave Speed proof cannot bypass a malformed Escape condition',async()=>{
    const plan=compileAbility(await fixture('rank-5/grasping-grave.json'));
    assert.equal(plan.resolution.outcomes.failure.modifiers[0].value,-10);
    assert.equal(inspectSavePlan(plan).supported,true);
    const broken=structuredClone(plan);
    broken.resolution.outcomes.criticalFailure.effects[0].endsWhen=[{event:'escape'},{event:'spell-ended'}];
    const route=inspectSavePlan(broken);
    assert.equal(route.supported,false);
    assert.ok(route.blockers.some(blocker=>blocker.code==='condition-composition'));
    assert.equal(inspectGeneratedSpeedProof(plan.compilerEvidence.generatedSpeedPenalties,
        plan.resolution.outcomes,{lifecycle:plan.lifecycle}).supported,true);
});
