import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {compileAbility} from '../src/compiler/index.js';
import {isExecutableSavePlan} from '../scripts/basic-save-core.js';
const fixture=async name=>JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${name}.json`,import.meta.url)));
test('Enfeeble and Stupefy reach resolution with exact outcome durations',async()=>{
 for(const name of ['rank-1/enfeeble','rank-2/stupefy']) {
  const p=compileAbility(await fixture(name));
  assert.equal(isExecutableSavePlan(p),true,name);
  assert.equal(p.resolution.outcomes.success.effects[0].duration.anchor,'source-turn');
  assert.equal(p.resolution.outcomes.success.effects[0].duration.expiry,'turn-start');
  assert.equal(p.resolution.outcomes.failure.effects[0].duration.unit,'minutes');
 }
});
test('unknown timing alongside a compiled condition still blocks execution',async()=>{
 const source=await fixture('rank-1/enfeeble');
 source.system.description.value=source.system.description.value.replace('until the start of your next turn.','until the start of your next turn. At the end of every turn, the target takes 3 damage.');
 assert.equal(isExecutableSavePlan(compileAbility(source)),false);
});

import {sickenedAfterRecovery,emptyConditionSavePlan} from '../scripts/condition-spell-core.js';
test('Evil Eye recovery reduces severity but respects sight only while sustained',()=>{
 assert.equal(sickenedAfterRecovery(2,'success',{spellActive:true,visible:true}),1);
 assert.equal(sickenedAfterRecovery(2,'criticalSuccess',{spellActive:true,visible:true}),1);
 assert.equal(sickenedAfterRecovery(1,'success',{spellActive:true,visible:false}),0);
 assert.equal(sickenedAfterRecovery(1,'success',{spellActive:false,visible:true}),0);
 assert.equal(sickenedAfterRecovery(2,'failure',{spellActive:false}),2);
 assert.throws(()=>sickenedAfterRecovery(1,'success',{spellActive:true,visible:null}),/Review/);
 assert.equal(isExecutableSavePlan(emptyConditionSavePlan({name:'Evil Eye',uuid:'spell',baseRank:1})),true);
});

import {ConditionSpellRuntime} from '../scripts/condition-spell-runtime.js';
test('Evil Eye guards only its own active floor and permits independent recovery after ending',t=>{
 const NS='pf2e-automatic-resolution';
 const savedUi=globalThis.ui;t.after(()=>{globalThis.ui=savedUi;});globalThis.ui={notifications:{warn(){}}};
 const record={profile:'evil-eye',status:'active',spellActive:true,recipients:[{conditionUuid:'condition',visible:true}]};
 const runtime=new ConditionSpellRuntime({find:id=>id==='cast'?{getFlag:()=>record}:null},{});
 const item={uuid:'condition',getFlag:()=> 'cast'};
 assert.equal(runtime.protectCondition(item,{'system.value.value':0},{}),false);
 assert.equal(runtime.protectCondition(item,{'system.value.value':1},{}),undefined);
 assert.equal(runtime.protectCondition(item,null,{},true),false);
 record.recipients[0].visible=false;
 assert.equal(runtime.protectCondition(item,null,{},true),undefined);
 record.recipients[0].visible=null;
 assert.equal(runtime.protectCondition(item,null,{},true),false);
 record.spellActive=false;
 assert.equal(runtime.protectCondition(item,null,{},true),undefined);
 record.spellActive=true;
 assert.equal(runtime.protectCondition(item,null,{[NS]:{conditionRecovery:true}},true),undefined);
 assert.equal(runtime.protectCondition({getFlag:()=>undefined},null,{},true),undefined);
});
test('a complete degree table cannot hide immunity or ongoing rules in the preamble',async()=>{
 // (Expunge Blood's preamble is now read rule by rule — its blood question and bleeding Clumsy: test/rank-7-batch-12.test.js. Blanket of Stars'
 // preamble is its form, 2026-10-05: the module's Effect, and the table its aura's save — test/rank-6-batch-23.test.js.)
 for(const name of ['rank-6/blanket-of-stars']){
  const p=compileAbility(await fixture(name));
  assert.equal(isExecutableSavePlan(p),false,name);
  assert.equal(p.resolution.kind,'generated-form',name);
  assert.ok(p.resolution.formRiders.auras.some(aura=>aura.save?.rows?.failure),name);
 }
});
import {nativeConditionTiming} from '../scripts/condition-timing.js';
test('next-turn condition timing distinguishes upcoming recipient turn from next round',()=>{
 const duration={value:1,unit:'rounds',expiry:'turn-start',offset:1,anchor:'target-turn'};
 const clock={started:true,turn:1,turnActors:['before','caster','after']};
 assert.equal(nativeConditionTiming(duration,clock,'caster','after').value,0);
 assert.equal(nativeConditionTiming(duration,clock,'caster','before').value,1);
 assert.equal(nativeConditionTiming({...duration,anchor:'source-turn'},clock,'caster','after').value,1);
 assert.equal(nativeConditionTiming({...duration,offset:undefined},clock,'caster','after').value,1);
 assert.throws(()=>nativeConditionTiming(duration,clock,'caster','missing'),/ambiguous/);
});

test('Blindness compiles its all-outcome temporary immunity rather than dropping it',async()=>{
 const p=compileAbility(await fixture('rank-3/blindness'));
 assert.equal(isExecutableSavePlan(p),true);
 assert.deepEqual(p.resolution.temporaryImmunity.duration,{value:1,unit:'minutes'});
 assert.equal(p.resolution.temporaryImmunity.key,'blindness');
});

import {clingingIceSavePlan} from '../scripts/condition-spell-core.js';
test('Clinging Ice keeps native damage scaling separate from sustained speed penalties',async()=>{
 const source=await fixture('cantrip/clinging-ice');
 const plan=clingingIceSavePlan(source);
 assert.equal(isExecutableSavePlan(plan),true);
 assert.equal(plan.resolution.check.statistic,'reflex');
 assert.deepEqual(Object.values(plan.resolution.outcomes).map(o=>o.damage.multiplier),[0,.5,1,2]);
 assert.equal(plan.resolution.sharedDamage.components[0].type,'cold');
 assert.equal(plan.resolution.sharedDamage.components[0].formula,'1d4');
});
test('temporary immunity declarations require a usable key and bounded duration',async()=>{
 const plan=compileAbility(await fixture('rank-3/blindness'));
 for(const invalid of [{key:''},{duration:{value:0,unit:'minutes'}},{duration:{value:1,unit:'unlimited'}}]){
  const changed=structuredClone(plan);Object.assign(changed.resolution.temporaryImmunity,invalid);
  assert.equal(isExecutableSavePlan(changed),false);
 }
});

import {reconcileConditionRecovery} from '../scripts/condition-decay.js';
test('Frightened lifecycle persists one reduction per boundary and skips detached grants',async t=>{
 const saved={foundry:globalThis.foundry,fromUuid:globalThis.fromUuid};t.after(()=>Object.assign(globalThis,saved));
 globalThis.foundry={utils:{deepClone:structuredClone}};
 const condition={slug:'frightened',value:2,async update(change){this.value=change['system.value.value'];}};
 let deletions=0,updates=0;
 const effect={flags:{pf2e:{itemGrants:{condition1:{id:'condition'}}}},actor:{items:new Map([['condition',condition]])},
  _source:{system:{rules:[{key:'GrantItem',flag:'condition1',alterations:[{property:'badge-value',value:2}]}]}},
  async update(change){updates++;this._source.system.rules=change['system.rules'];},async delete(){deletions++;}};
 globalThis.fromUuid=async()=>effect;
 const clock={combatId:'combat',started:true,round:1,turn:0,actorUuid:'target',roster:['target','caster']};
 const record={name:'Test',status:'active',clock,obligations:[],entries:[{uuid:'effect',actorUuid:'target',status:'active',metadata:{conditions:[{recovery:'frightened',ruleFlag:'condition1'}]}}]};
 let now={...clock,turn:1,actorUuid:'caster'};
 const ongoing={clock:()=>now,async save(){},async review(_j,reason){throw Error(reason);}};
 await reconcileConditionRecovery(ongoing,{},record,{clockEvent:true});assert.equal(condition.value,1);assert.equal(updates,1);
 await reconcileConditionRecovery(ongoing,{},record);assert.equal(updates,1);assert.equal(record.obligations.length,1);
 now={...clock,round:2};await reconcileConditionRecovery(ongoing,{},record,{clockEvent:true});
 record.entries[0].detached=true;now={...now,turn:1,actorUuid:'caster'};
 await reconcileConditionRecovery(ongoing,{},record,{clockEvent:true});assert.equal(deletions,0);assert.equal(condition.value,1);
});

test('bounded critical-failure riders resolve while extra spell mechanics remain gated',async()=>{
 for(const name of ['cantrip/timber','rank-6/arrow-salvo','cantrip/daze']){
  const source=await fixture(name),plan=compileAbility(source);
  assert.equal(isExecutableSavePlan(plan),true,name);
  assert.equal(plan.resolution.check.basic,true);
  assert.equal(plan.resolution.outcomes.criticalFailure.effects.length,1);
  assert.equal(plan.resolution.outcomes.criticalFailure.damage.multiplier,2);
  source.system.description.value=source.system.description.value.replace('<hr', '<p>The target also takes 4 damage each turn.</p><hr');
  assert.equal(isExecutableSavePlan(compileAbility(source)),false,'additional mechanics cannot disappear');
 }
});
test('Evil Eye sight uses committed token position while movement is still animating',t=>{
 const previous=globalThis.fromUuidSync;t.after(()=>{globalThis.fromUuidSync=previous;});
 const token={id:'token',uuid:'token',x:0,y:0,_source:{x:0,y:0,elevation:0,hidden:false},actor:{uuid:'target',statuses:new Set()}};
 const scene={id:'scene',tokens:{contents:[token]},walls:{contents:[]},environment:{darknessLevel:0}};token.parent=scene;
 globalThis.fromUuidSync=uuid=>uuid==='token'?token:{statuses:new Set()};
 const runtime=new ConditionSpellRuntime({},{}),record={sourceActorUuid:'caster'},recipient={tokenUuid:'token',visible:false};
 recipient.visibilityFingerprint=runtime.visibilityFingerprint(record,recipient);
 assert.equal(runtime.currentVisibility(record,recipient),false);
 token._source.x=100;
 assert.equal(token.x,0,'rendered position has not moved yet');
 assert.equal(runtime.currentVisibility(record,recipient),null,'committed movement invalidates visibility immediately');
});

import {stunnedAfterActionLoss} from '../scripts/stunned-recovery.js';
test('numbered Stunned consumes confirmed lost actions rather than a round duration',()=>{
 assert.equal(stunnedAfterActionLoss(4,3),1);assert.equal(stunnedAfterActionLoss(1,1),0);
 for(const [value,lost] of [[2,3],[2,0],[1,0.5],[0,1]])assert.throws(()=>stunnedAfterActionLoss(value,lost),/Confirm/);
});
import {resolveStunned} from '../scripts/stunned-recovery.js';
test('Stunned action-loss controls reject non-owners and the wrong combat turn before writes',async t=>{
 const previous=globalThis.fromUuid;t.after(()=>{globalThis.fromUuid=previous;});
 const record={status:'active',entries:[{uuid:'effect',status:'active',metadata:{conditions:[{recovery:'stunned-actions'}]}}]};
 globalThis.fromUuid=async()=>({actor:{uuid:'recipient',testUserPermission:()=>false}});
 const ongoing={clock:()=>({started:true,actorUuid:'other'}),save:()=>{throw Error('unexpected mutation');}};
 await assert.rejects(resolveStunned(ongoing,{},record,{effectUuid:'effect',lost:1},{isGM:false}),/recipient owner/);
 await assert.rejects(resolveStunned(ongoing,{},record,{effectUuid:'effect',lost:1},{isGM:true}),/recipient’s turn/);
 record.entries[0].detached=true;
 await assert.rejects(resolveStunned(ongoing,{},record,{effectUuid:'effect',lost:1},{isGM:true}),/no longer active/);
});

import {validateActorTarget} from '../scripts/basic-save-core.js';
test('spell eligibility delegates cast-time traits to native PF2e immunity',()=>{
 const constraints={supportsActorTargets:true,complete:true,predicates:[],spellRollOptions:['item:type:spell','item:trait:mental']};
 const actor={isImmuneTo:item=>item.getRollOptions('item').includes('item:trait:mental')};
 assert.equal(validateActorTarget(constraints,actor).eligible,false);
 assert.equal(validateActorTarget({...constraints,spellRollOptions:[]},actor).eligible,true,'condition recovery is not another application of the original spell');
});

import {conditionProfileDigest,CONDITION_PROFILE_HASHES} from '../scripts/condition-spell-baseline.js';
test('condition adapters pin verified mechanics while allowing cosmetic item changes',async()=>{
 for(const [slug,rank] of Object.entries({'evil-eye':'cantrip',fear:'rank-1','clinging-ice':'cantrip',paralyze:'rank-3'})){
  const source=await fixture(`${rank}/${slug}`);
  assert.equal(await conditionProfileDigest(source),CONDITION_PROFILE_HASHES[slug]);
  source.name='Custom name';source.img='custom.webp';
  assert.equal(await conditionProfileDigest(source),CONDITION_PROFILE_HASHES[slug]);
  source.system.description.value+=' <p>The target is also doomed 1.</p>';
  assert.notEqual(await conditionProfileDigest(source),CONDITION_PROFILE_HASHES[slug]);
 }
});

import {sickenedEntry,assertSickenedRecovery,prepareSickenedRecovery} from '../scripts/sickened-recovery.js';
test('Sickened recovery binds the contribution, recipient and owner before mutating',async t=>{
 const oldFoundry=globalThis.foundry;t.after(()=>{globalThis.foundry=oldFoundry;});globalThis.foundry={utils:{deepClone:structuredClone}};
 const old=globalThis.fromUuidSync;t.after(()=>{globalThis.fromUuidSync=old;});
 const entry={uuid:'effect',status:'active',metadata:{conditions:[{recovery:'sickened',ruleFlag:'condition1'}]}},
  condition={slug:'sickened',value:2},effect={uuid:'effect',isExpired:false,flags:{pf2e:{itemGrants:{condition1:{id:'condition'}}}},actor:{uuid:'recipient',items:new Map([['condition',condition]]),testUserPermission:()=>false}},
  record={status:'active',entries:[entry],obligations:[{key:'recovery',cardId:'card',kind:'sickened-recovery',status:'collecting',effectUuid:'effect'}]},journal={getFlag:()=>record};
 globalThis.fromUuidSync=uuid=>uuid==='effect'?effect:null;
 assert.equal(assertSickenedRecovery(journal,'card',{targets:[{actorUuid:'recipient'}]}).condition,condition);
 assert.throws(()=>assertSickenedRecovery(journal,'card',{targets:[{actorUuid:'other'}]}),/original recipient/);
 await assert.rejects(prepareSickenedRecovery({},journal,{effectUuid:'effect'},{isGM:false}),/recipient owner/);
 entry.detached=true;assert.equal(sickenedEntry(record,'effect'),undefined);
 assert.throws(()=>assertSickenedRecovery(journal,'card',{targets:[{actorUuid:'recipient'}]}),/detached/);
 entry.detached=false;effect.isExpired=true;
 assert.throws(()=>assertSickenedRecovery(journal,'card',{targets:[{actorUuid:'recipient'}]}),/ended/);
});

import {clingingIceEffectMechanics,CLINGING_ICE_EFFECT_MECHANICS} from '../scripts/condition-spell-baseline.js';
test('Clinging Ice pins both its spell profile and native speed modifier',async()=>{
 const effect=JSON.parse(await readFile(new URL('../.cache/pf2e-test-fixtures/spell-effects/spell-effect-clinging-ice.json',import.meta.url)));
 assert.equal(clingingIceEffectMechanics(effect),CLINGING_ICE_EFFECT_MECHANICS);
 effect.system.rules.find(r=>r.key==='FlatModifier').selector='ac';
 assert.notEqual(clingingIceEffectMechanics(effect),CLINGING_ICE_EFFECT_MECHANICS);
});
