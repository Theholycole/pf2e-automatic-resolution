import test from "node:test";
import assert from "node:assert/strict";
import { coordinatorId, turnAdvance, addObligation, petrifyProgress, dueWorldTime } from "../scripts/ongoing-core.js";
import { OngoingRuntime } from "../scripts/ongoing-runtime.js";
const NS = 'pf2e-automatic-resolution';

test('one active GM coordinates; a player never inherits GM work', () => {
 assert.equal(coordinatorId([{id:'p',active:true,isGM:false}]),null);
 assert.equal(coordinatorId([{id:'z',active:true,isGM:true},{id:'a',active:true,isGM:true}]),'a');
});
test('turn boundaries detect ordinary progress, skips, backwards time and roster changes', () => {
 const a={combatId:'c',started:true,round:1,turn:1,roster:['a','b']};
 assert.equal(turnAdvance(a,{...a,round:2,turn:0}),'next');
 assert.equal(turnAdvance(a,{...a,round:3,turn:0}),'jump');
 assert.equal(turnAdvance(a,{...a,turn:0}),'backward');
 assert.equal(turnAdvance(a,{...a,roster:['b','a']}),'unknown');
});
test('Petrify tracks its own slowed contribution and preserves critical-success reduction of one',()=>{
 assert.deepEqual(petrifyProgress(2,'criticalSuccess',3),{value:1,end:null});
 assert.deepEqual(petrifyProgress(1,'success',3),{value:0,end:'recovered'});
 assert.deepEqual(petrifyProgress(1,'criticalFailure',3),{value:3,end:'petrified'});
 assert.deepEqual(petrifyProgress(1,'criticalFailure',4),{value:3,end:null});
 assert.throws(()=>petrifyProgress(1,'failure',null),/Confirm/);
});
test('obligations deduplicate a boundary; forward time crosses deadlines without replay on backwards time',()=>{
 const record={lastWorldTime:10,nextSaveAt:16};
 assert.equal(addObligation(record,{key:'c:1:a:end',kind:'save'}),true);
 assert.equal(addObligation(record,{key:'c:1:a:end',kind:'save'}),false);
 assert.equal(dueWorldTime(record,20),true);assert.equal(dueWorldTime(record,8),false);
});

function fixture(t) {
 const prior=Object.fromEntries(['game','foundry','JournalEntry','fromUuid'].map(k=>[k,globalThis[k]]));t.after(()=>Object.assign(globalThis,prior));
 const docs=new Map(),journals=[];let id=0;
 const gm={id:'gm',isGM:true,active:true};const users=[gm];users.contents=users;
 globalThis.game={user:gm,users,journal:{contents:journals},actors:{contents:[]},scenes:{contents:[]},time:{worldTime:0}};
 globalThis.foundry={utils:{deepClone:structuredClone,randomID:()=>`id${++id}`}};
 globalThis.fromUuid=async uuid=>docs.get(uuid)??null;
 globalThis.JournalEntry={create:async source=>{const j={id:`j${++id}`,flags:source.flags,getFlag(ns,key){return this.flags[ns][key];},async setFlag(ns,key,value){this.flags[ns][key]=structuredClone(value);}};journals.push(j);return j;}};
 const actor={uuid:'Actor.a',name:'A',items:[],reset(){},testUserPermission:()=>false};docs.set(actor.uuid,actor);game.actors.contents.push(actor);
 const metadata={castInstanceId:'cast',sourceActorUuid:actor.uuid,sourceItemName:'Guidance',sequence:{id:'guidance',transition:{event:'effect-ended'},successor:{uuid:'Compendium.immunity'}}};
 const effect={uuid:'Actor.a.Item.e',actor,name:'Guidance',system:{duration:{value:1,unit:'rounds'}},flags:{[NS]:{runtime:metadata}},async delete(){docs.delete(this.uuid);actor.items.splice(actor.items.indexOf(this),1);}};docs.set(effect.uuid,effect);actor.items.push(effect);
 return {docs,actor,effect,journals};
}
test('retained native expiry deletes owned contribution and creates one durable successor, even after reload/backwards time',async t=>{
 const f=fixture(t);let creations=0;
 const createSuccessor=async(actor,metadata,operationId)=>{creations++;const item={uuid:'Actor.a.Item.immunity',flags:{[NS]:{ongoingOperation:operationId}}};actor.items.push(item);return item;};
 const runtime=new OngoingRuntime();runtime.connect({createSuccessor},null,null);
 await runtime.reconcile({recover:true});
 f.effect.system.expired=true;game.time.worldTime=7;
 await runtime.reconcile();assert.equal(creations,1);assert.equal(f.docs.has(f.effect.uuid),false);
 assert.equal(f.journals[0].getFlag(NS,'ongoingCast').status,'ended');
 const reloaded=new OngoingRuntime();reloaded.connect({createSuccessor},null,null);game.time.worldTime=0;
 await reloaded.reconcile({recover:true});assert.equal(creations,1);
});
test('deleted primary is no longer the only source of pending successor work',async t=>{
 const f=fixture(t);const runtime=new OngoingRuntime();runtime.connect({createSuccessor:async()=>({uuid:'successor'})},null,null);
 await runtime.reconcile();await f.effect.delete();await runtime.deleted(f.effect);
 assert.equal(f.journals[0].getFlag(NS,'ongoingCast').entries[0].successor,'completed');
});
test('uncertain successor creation remains review, never retries after reload',async t=>{
 const f=fixture(t);let attempts=0;const runtime=new OngoingRuntime();runtime.connect({createSuccessor:async()=>{attempts++;throw Error('connection lost after write');}},null,null);
 await runtime.reconcile();f.effect.system.expired=true;
 await assert.rejects(runtime.reconcile(),/connection lost/);
 assert.equal(f.journals[0].getFlag(NS,'ongoingCast').status,'review');
 const reloaded=new OngoingRuntime();reloaded.connect({createSuccessor:async()=>{attempts++;}},null,null);
 await reloaded.reconcile({recover:true});assert.equal(attempts,1);
});
test('ordinary Shield expiry does not imply Shield Block was used',async t=>{
 const f=fixture(t);f.effect.flags[NS].runtime.sequence.transition.event='action-used';let creations=0;
 const runtime=new OngoingRuntime();runtime.connect({createSuccessor:async()=>{creations++;return {uuid:'immunity'};}},null,null);
 await runtime.reconcile();f.effect.system.expired=true;await runtime.reconcile();assert.equal(creations,0);
});
test('Sustain-like names on chat messages cannot establish an action-use transition',async t=>{
 const {EffectRuntime}=await import('../scripts/effect-runtime.js');const f=fixture(t);
 f.effect.flags[NS].runtime.sequence.transition={event:'action-used',actionLabel:'Shield Block',actionUuid:'Compendium.actions.Item.shield'};
 const runtime=new EffectRuntime();let calls=0;runtime.ongoing={actionUsed:async()=>{calls++;}};
 await runtime.handleActionMessage({actor:f.actor,item:{name:'Shield Block',uuid:'Actor.a.Item.unrelated'},content:''});assert.equal(calls,0);
 await runtime.handleActionMessage({actor:f.actor,item:{name:'Shield Block',uuid:'Compendium.actions.Item.shield'},content:''});assert.equal(calls,1);
});

test('ending preserves detached and permanent contributions',async t=>{
 const f=fixture(t),runtime=new OngoingRuntime();runtime.connect({},null,null);
 await runtime.reconcile();const j=f.journals[0],r=structuredClone(j.getFlag(NS,'ongoingCast'));
 r.entries[0].detached=true; r.entries.push({uuid:'permanent',status:'active',permanent:true});
 await runtime.save(j,r);await runtime.request('end',{castId:'cast',revision:r.revision});
 assert.equal(f.docs.has(f.effect.uuid),true);assert.equal(j.getFlag(NS,'ongoingCast').status,'ended');
});
test('stale controls and player GM corrections cannot change a cast',async t=>{
 const f=fixture(t),runtime=new OngoingRuntime();runtime.connect({},null,null);await runtime.reconcile();
 await assert.rejects(runtime.request('detach',{castId:'cast',uuid:f.effect.uuid,revision:-1}),/changed/);
 assert.equal(f.journals[0].getFlag(NS,'ongoingCast').entries[0].detached,undefined);
 game.user={id:'player',active:true,isGM:false};game.users.length=0;game.users.push(game.user);
 await assert.rejects(runtime.request('end',{castId:'cast'}),/active GM/);
});
test('reviewed timing may resume, but uncertain writes never do',async t=>{
 const f=fixture(t),runtime=new OngoingRuntime();runtime.connect({},null,null);await runtime.reconcile();const j=f.journals[0];
 await runtime.review(j,'missed clock',{resumable:true});
 await runtime.request('resume-reviewed',{castId:'cast'});assert.equal(j.getFlag(NS,'ongoingCast').status,'active');
 await runtime.review(j,'write interrupted');await assert.rejects(runtime.request('resume-reviewed',{castId:'cast'}),/Uncertain document writes/);
 assert.equal(j.getFlag(NS,'ongoingCast').status,'review');
});
test('grouped reminders are persisted once across coordinator reloads',async t=>{
 const f=fixture(t),runtime=new OngoingRuntime();runtime.connect({},null,null);await runtime.reconcile();const j=f.journals[0];
 const prior=globalThis.ChatMessage;t.after(()=>globalThis.ChatMessage=prior);const messages=[];globalThis.ChatMessage={create:async data=>messages.push(data)};
 const r=structuredClone(j.getFlag(NS,'ongoingCast'));r.obligations=[{key:'a',kind:'save',status:'pending'},{key:'b',kind:'sustain',status:'pending'}];await runtime.save(j,r);
 await runtime.reconcile();assert.equal(messages.length,1);assert.match(messages[0].content,/save/);assert.match(messages[0].content,/sustain/);
 const next=new OngoingRuntime();next.connect({},null,null);await next.reconcile({recover:true});assert.equal(messages.length,1);
});

test('Floating Flame persists exposure by actor UUID and only releases confirmed zero-damage recipients',async t=>{
 const {OngoingFamilies}=await import('../scripts/ongoing-families.js');const f=fixture(t),runtime=new OngoingRuntime();let count=0;
 const cards=new Map();game.messages={get:id=>cards.get(id)};
 const spell={uuid:'Actor.source.Item.spell',name:'Floating Flame',baseRank:2,system:{level:{value:2},damage:{a:{formula:'3d6',type:'fire'}},defense:{save:{statistic:'reflex'}}},actor:f.actor};f.docs.set(spell.uuid,spell);
 const saves={start:async()=>{const card={id:`card${++count}`,getFlag:()=>({dc:20}),setFlag:async()=>{}};cards.set(card.id,card);return{card};}};
 const family=new OngoingFamilies(runtime,saves,{});runtime.connect({},saves,family);
 const j=await runtime.begin({castId:'flame',kind:'floating-flame',sourceActorUuid:f.actor.uuid,sourceItemUuid:spell.uuid,rank:2,exposure:[],recipients:[]});await runtime.activate(j);
 const card=await family.prepareSave(j,[f.actor],'first');
 await family.finalizeSave(card,{targets:[{actorUuid:f.actor.uuid,damageResults:[{receipt:{status:'confirmed',damage:7}}]}]});
 assert.equal(await family.prepareSave(j,[f.actor],'second'),null);assert.equal(count,1);
 const exposure=structuredClone(j.getFlag(NS,'ongoingCast').exposure);assert.deepEqual(exposure,[{key:'null:0:Actor.a',cardId:'card1'}]);
 const r=structuredClone(j.getFlag(NS,'ongoingCast'));r.exposure=[];await runtime.save(j,r);
 const zero=await family.prepareSave(j,[f.actor],'zero');await family.finalizeSave(zero,{targets:[{actorUuid:f.actor.uuid,damageResults:[{receipt:{status:'confirmed',damage:0}}]}]});
 assert.ok(await family.prepareSave(j,[f.actor],'retry-after-zero'));assert.equal(count,3);
});

test('an unchanged idle encounter does not put out-of-combat spells into review on reload',async t=>{
 const {OngoingFamilies}=await import('../scripts/ongoing-families.js');const f=fixture(t),runtime=new OngoingRuntime();const family=new OngoingFamilies(runtime,{},{});runtime.connect({},null,family);
 game.combat={id:'idle',started:false,round:0,turn:0,turns:[]};f.docs.set('spell',{uuid:'spell'});
 const j=await runtime.begin({castId:'outside',kind:'petrify',sourceActorUuid:f.actor.uuid,sourceItemUuid:'spell',recipients:[{actorUuid:f.actor.uuid,status:'initial'}],exposure:[]});await runtime.activate(j);
 await runtime.reconcile({recover:true});assert.equal(j.getFlag(NS,'ongoingCast').status,'active');
});

test('new aura recipients can see their cast record before rolling',async t=>{
 const {OngoingFamilies}=await import('../scripts/ongoing-families.js');const f=fixture(t),runtime=new OngoingRuntime();game.users.push({id:'player',isGM:false});f.actor.testUserPermission=user=>user.id==='player';
 const spell={uuid:'spell',name:'Aura',system:{level:{value:1},damage:{a:{formula:'1d6',type:'fire'}},defense:{save:{statistic:'reflex'}}},actor:f.actor};f.docs.set('spell',spell);
 const j=await runtime.begin({castId:'aura',kind:'aura',sourceItemUuid:'spell',rank:1,recipientUuids:[],exposure:[]});let permissions;
 j.update=async update=>{permissions=update;};const family=new OngoingFamilies(runtime,{start:async()=>{assert.equal(permissions['ownership.player'],2);return{card:{id:'card',getFlag:()=>({dc:20}),setFlag:async()=>{}}};}},{});
 await family.prepareSave(j,[f.actor],'entry');assert.deepEqual(j.getFlag(NS,'ongoingCast').recipientUuids,[f.actor.uuid]);
});
test('excluding a recurring Petrify save preserves the previous slowed contribution and future saves',async t=>{
 const {OngoingFamilies}=await import('../scripts/ongoing-families.js');const f=fixture(t),runtime=new OngoingRuntime();const family=new OngoingFamilies(runtime,{},{});runtime.connect({},null,family);
 const j=await runtime.begin({castId:'petrify',kind:'petrify',recipients:[{actorUuid:f.actor.uuid,status:'recurring',value:1,effectUuid:f.effect.uuid}],obligations:[{key:'save',cardId:'card',recurring:true,status:'collecting'}]});await runtime.activate(j);
 await family.finalizeSave({id:'card'},{targets:[{actorUuid:f.actor.uuid,excluded:true}]});const r=j.getFlag(NS,'ongoingCast');assert.equal(r.recipients[0].status,'recurring');assert.equal(r.recipients[0].value,1);assert.equal(r.nextSaveAt,6);assert.ok(f.docs.has(f.effect.uuid));
});

test('a player Flame path unresolved at turn end stops before later-round attribution',async t=>{
 const {OngoingFamilies}=await import('../scripts/ongoing-families.js');const f=fixture(t),runtime=new OngoingRuntime();const family=new OngoingFamilies(runtime,{},{});runtime.connect({},null,family);
 f.actor.statuses=new Set();f.actor.hasCondition=()=>false;f.docs.set('spell',{});f.docs.set('region',{});
 game.combat={id:'combat',started:true,round:2,turn:0,combatant:{actor:f.actor},turns:[{id:'a',actor:f.actor,initiative:20},{id:'b',actor:{uuid:'Actor.b'},initiative:10}]};
 const j=await runtime.begin({castId:'flame',kind:'floating-flame',sourceActorUuid:f.actor.uuid,sourceItemUuid:'spell',regionUuid:'region',obligations:[{kind:'flame-path',key:'path',status:'pending'}],recipients:[]});await runtime.activate(j);
 game.combat.turn=1;game.combat.combatant={actor:{uuid:'Actor.b'}};
 await family.reconcile(j,structuredClone(j.getFlag(NS,'ongoingCast')),{clockEvent:true});assert.equal(j.getFlag(NS,'ongoingCast').status,'review');assert.match(j.getFlag(NS,'ongoingCast').reviewReason,/path/);
});
