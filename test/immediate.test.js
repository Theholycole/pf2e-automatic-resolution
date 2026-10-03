import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateChoices,recordCheck,correctTarget,saveDegree,needsSave,readiness,PROFILES,checkAudience} from '../scripts/immediate-core.js';
import {ImmediateRuntime} from '../scripts/immediate-runtime.js';
const state=()=>({kind:'disintegrate',status:'collecting',targets:[{id:'a',revision:0,name:'A',mode:'damage',attack:null,save:null}]});
test('Force Barrage rank and action allocations are exact',()=>{
 validateChoices('force-barrage',1,3,[{shards:2},{shards:1}]);validateChoices('force-barrage',3,3,[{shards:4},{shards:2}]);
 assert.throws(()=>validateChoices('force-barrage',3,2,[{shards:3}]),/exactly 4/);
 assert.throws(()=>validateChoices('force-barrage',3,2,[{shards:3},{shards:-1}]),/exactly/);
 assert.throws(()=>validateChoices('heal',1,2,[{},{}]),/exactly one/);validateChoices('heal',3,3,[{},{}]);
 assert.throws(()=>validateChoices('disintegrate',5,2,[{}]),/legal/);
});
test('Disintegrate hit gates save; critical attack lowers its native save result only once',()=>{
 const s=state(),t=s.targets[0];assert.match(readiness(s),/attack/);
 assert.throws(()=>recordCheck(s,'a','save',{degree:'success'},0),/preceding/);
 recordCheck(s,'a','attack',{degree:'criticalSuccess',total:35},0);assert.equal(needsSave(s,t),true);assert.match(readiness(s),/Fortitude/);
 recordCheck(s,'a','save',{degree:'success',total:28},1);assert.equal(saveDegree(s,t),'failure');assert.equal(t.save.degree,'success');assert.equal(saveDegree(s,t),'failure');assert.equal(readiness(s),null);
});
test('target-bound checks reject stale or reassigned results; attack rerolls invalidate saves and overrides',()=>{
 const s=state(),t=s.targets[0];recordCheck(s,'a','attack',{degree:'success'},0);recordCheck(s,'a','save',{degree:'failure'},1);
 correctTarget(s,'a',{action:'degree',stage:'save',degree:'success',revision:2},'gm');assert.equal(t.save.degree,'failure');assert.equal(saveDegree(s,t),'success');
 assert.throws(()=>recordCheck(s,'other','attack',{degree:'success'},0),/changed/);
 assert.throws(()=>recordCheck(s,'a','attack',{degree:'success'},0),/changed/);
 recordCheck(s,'a','attack',{degree:'failure'},3);assert.equal(t.save,null);assert.equal(t.saveOverride,null);assert.equal(needsSave(s,t),false);assert.equal(readiness(s),null);
});
test('excluded checks survive restore, while applied steps remain locked',()=>{
 const s=state(),t=s.targets[0];recordCheck(s,'a','attack',{degree:'failure',total:10},0);correctTarget(s,'a',{action:'exclude',revision:1},'gm');assert.equal(t.attack.total,10);correctTarget(s,'a',{action:'exclude',revision:2},'gm');assert.equal(t.attack.total,10);
 s.status='review';assert.throws(()=>correctTarget(s,'a',{action:'exclude',revision:3},'gm'),/locked/);assert.throws(()=>recordCheck(s,'a','attack',{degree:'success'},3),/locked/);
});
test('Heal mixed recipients require saves only for affected undead',()=>{
 const s={kind:'heal',status:'collecting',targets:[{id:'a',name:'Living',mode:'healing'},{id:'b',name:'Undead',mode:'damage'}]};assert.match(readiness(s),/Undead/);s.targets[1].save={degree:'criticalSuccess'};assert.equal(readiness(s),null);
});
test('verified profiles reject altered mechanical fields before mutation',async t=>{
 const before=globalThis.fromUuid;t.after(()=>globalThis.fromUuid=before);
 for(const [kind,rank] of [['heal',1],['force-barrage',1],['disintegrate',6]]){
  const source=JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/rank-${rank}/${kind}.json`,import.meta.url),'utf8'));
  globalThis.fromUuid=async uuid=>uuid.endsWith(PROFILES[kind])?source:null;const runtime=new ImmediateRuntime();assert.equal(await runtime.verify(source),kind);
  const changed=structuredClone(source);changed.system.damage['0'].formula='999d20';await assert.rejects(runtime.verify(changed),/damage/);
 }
});

test('Heal Unaffected recipients need an explicit mode override; it invalidates only their save',()=>{
 const s={kind:'heal',status:'collecting',targets:[{id:'a',revision:0,mode:'unaffected',excluded:true,save:null},{id:'b',revision:0,mode:'damage',save:{degree:'success'}}]};
 assert.throws(()=>correctTarget(s,'a',{action:'exclude',revision:0},'gm'),/explicit/);
 correctTarget(s,'a',{action:'eligibility',mode:'damage',revision:0},'gm');assert.equal(needsSave(s,s.targets[0]),true);assert.equal(s.targets[0].eligibilityOverride.userId,'gm');assert.equal(s.targets[1].save.degree,'success');
});

test('player correction and finalization are rejected independently of cast ownership',async t=>{
 const previous=globalThis.game,previousFoundry=globalThis.foundry;t.after(()=>{globalThis.game=previous;globalThis.foundry=previousFoundry;});globalThis.foundry={utils:{deepClone:structuredClone}};
 const s=state(),card={getFlag:()=>structuredClone(s)};
 globalThis.game={user:{id:'gm',isGM:true},users:{contents:[{id:'gm',isGM:true,active:true}]},messages:{get:()=>card}};
 const runtime=new ImmediateRuntime();
 await assert.rejects(runtime.dispatch('finalize',{cardId:'card'}, {id:'player',isGM:false}),/Only the coordinating GM/);
 await assert.rejects(runtime.dispatch('correct',{cardId:'card',targetId:'a',correction:{action:'exclude',revision:0}}, {id:'player',isGM:false}),/Only the coordinating GM/);
 assert.equal(s.targets[0].revision,0);
});

test('private and blind checks narrow cast visibility without later public checks revealing them',()=>{
 const privateAudience=checkAudience(null,{whisper:['gm'],blind:false},['gm'],'player');assert.deepEqual(privateAudience,['gm','player']);
 const blind=checkAudience(privateAudience,{whisper:['gm'],blind:true},['gm'],'player');assert.deepEqual(blind,['gm']);
 assert.deepEqual(checkAudience(blind,{whisper:[],blind:false},['gm'],'other'),['gm']);
 assert.deepEqual(checkAudience(['a'],{whisper:['gm'],blind:true},['gm'],'b'),['gm']);
 assert.deepEqual(checkAudience(['gm','a'],{whisper:['gm'],blind:false},['gm'],'b'),['gm']);
});
