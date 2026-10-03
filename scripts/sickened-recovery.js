import {MODULE_ID} from './effect-runtime.js';
import {clone,randomID} from './runtime-utils.js';
import {addObligation} from './ongoing-core.js';
import {emptyConditionSavePlan,sickenedAfterRecovery} from './condition-spell-core.js';
const state=j=>j.getFlag(MODULE_ID,'ongoingCast');
export function sickenedEntry(record,uuid) {
 return record.entries.find(e=>e.uuid===uuid&&e.status==='active'&&!e.detached&&e.metadata?.conditions?.length===1&&e.metadata.conditions[0].recovery==='sickened');
}
function contribution(record,uuid) {
 const entry=sickenedEntry(record,uuid),effect=entry&&fromUuidSync(uuid);
 if(record.status!=='active'||!effect||effect.isExpired)throw Error('This Sickened contribution ended or was detached.');
 const grant=effect.flags.pf2e?.itemGrants?.[entry.metadata.conditions[0].ruleFlag],condition=grant&&effect.actor.items.get(grant.id);
 if(!condition||condition.slug!=='sickened')throw Error('The native Sickened grant changed.');
 return{entry,effect,condition};
}
export async function prepareSickenedRecovery(family,journal,data,user) {
 const record=clone(state(journal)),{effect}=await contribution(record,data.effectUuid);
 if(!user.isGM&&!effect.actor.testUserPermission(user,'OWNER'))throw Error('Only the recipient owner or GM can Retch.');
 if(record.obligations.some(o=>o.kind==='sickened-recovery'&&o.status==='collecting'&&o.effectUuid===effect.uuid))throw Error('Finish the pending Retch save first.');
 const actor=await fromUuid(record.sourceActorUuid);
 if(!record.recoverySource||!actor||!Number.isFinite(record.dc))throw Error('Original recovery context unavailable; review this older cast manually.');
 const spell=new CONFIG.Item.documentClass(clone(record.recoverySource),{parent:actor}),plan=emptyConditionSavePlan(spell,'fortitude');
 plan.resolution.check.purpose='condition-recovery';plan.source.name=`${record.name} — Retch`;
 const {card}=await family.saves.start(spell,{sourceActor:actor,plan,targets:[effect.actor],castRank:record.rank,dc:record.dc,recoverySource:record.recoverySource,skipConfirmation:true});
 await card.setFlag(MODULE_ID,'ongoingCastId',record.castId);
 addObligation(record,{key:randomID(),kind:'sickened-recovery',status:'collecting',label:'Retch — 1 action',actorUuid:effect.actor.uuid,effectUuid:effect.uuid,cardId:card.id});
 await family.ongoing.save(journal,record);return{cardId:card.id};
}
export function assertSickenedRecovery(journal,cardId,saveState) {
 const record=state(journal),obligation=record.obligations.find(o=>o.cardId===cardId&&o.kind==='sickened-recovery');
 if(!obligation||obligation.status!=='collecting')throw Error('This Retch save is no longer collecting.');
 const current=contribution(record,obligation.effectUuid);
 if(saveState.targets.length!==1||saveState.targets[0].actorUuid!==current.effect.actor.uuid)throw Error('A Retch save must retain its original recipient.');
 return{record:clone(record),obligationKey:obligation.key,...current};
}
export async function finalizeSickenedRecovery(family,journal,card,saveState) {
 const {record,obligationKey,effect,condition}=await assertSickenedRecovery(journal,card.id,saveState);
 const entry=sickenedEntry(record,effect.uuid),obligation=record.obligations.find(o=>o.key===obligationKey),target=saveState.targets[0];
 if(target.excluded||target.eligible===false){obligation.status='completed';await family.ongoing.save(journal,record);return;}
 const next=sickenedAfterRecovery(condition.value,target.degree);
 record.status='applying';obligation.status='applying';await family.ongoing.save(journal,record);
 try{
  if(!next){await effect.delete({[MODULE_ID]:{ongoingCleanup:true}});entry.status='ended';entry.reason='sickened-recovered';}
  else if(next!==condition.value){
   const rules=clone(effect._source.system.rules),rule=rules.find(r=>r.key==='GrantItem'&&r.flag===entry.metadata.conditions[0].ruleFlag),alteration=rule?.alterations?.find(a=>a.property==='badge-value');
   if(!alteration)throw Error('Native Sickened value rule changed.');
   alteration.value=next;await effect.update({'system.rules':rules,name:`${record.name}: Sickened ${next}`});await condition.update({'system.value.value':next});
  }
  target.conditionResults=[{label:next?`Sickened ${next}`:'Sickened recovered',status:'applied',effectUuid:effect.uuid}];
  obligation.status='completed';record.status=record.entries.every(e=>e.status==='ended'||e.detached)?'ended':'active';
  if(record.status==='ended')record.endedAt=game.time.worldTime;
  await family.ongoing.save(journal,record);
  if(!next)await family.ongoing.reconcileLinks(journal);
 }catch(error){await family.ongoing.review(journal,`Sickened recovery interrupted: ${error.message}`);throw error;}
}
export async function sickenedControls(family,journal,record) {
 if(record.status!=='active'||!record.recoverySource)return[];
 const controls=[];
 for(const entry of record.entries.filter(e=>sickenedEntry(record,e.uuid))){
  const effect=await fromUuid(entry.uuid);if(!effect||(!game.user.isGM&&!effect.actor.isOwner))continue;
  controls.push({action:`retch-${journal.id}-${effect.id}`,label:`${effect.actor.name}: Retch — 1 action (${record.name})`,callback:async()=>{
   const pending=record.obligations.find(o=>o.kind==='sickened-recovery'&&o.effectUuid===effect.uuid&&o.status==='collecting');
   const {cardId}=pending??await family.ongoing.request('condition-retch',{castId:record.castId,revision:record.revision,effectUuid:effect.uuid});
   const card=game.messages.get(cardId);if(!card)throw Error('Recovery card unavailable.');
   for(const target of card.getFlag(MODULE_ID,'basicSaveState').targets)if(!target.degree)await family.saves.rollSave(card,target.id);
  }});
 }return controls;
}
