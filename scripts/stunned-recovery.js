import {MODULE_ID} from './effect-runtime.js';
import {clone,escapeHTML} from './runtime-utils.js';
import {boundaryKey,addObligation} from './ongoing-core.js';

export function stunnedAfterActionLoss(value,lost) {
    if(!Number.isInteger(value)||value<1||!Number.isInteger(lost)||lost<1||lost>value)throw Error('Confirm a positive number of actions lost, no greater than this Stunned value.');
    return value-lost;
}
export function stunnedEntry(record,uuid) {
    return record.entries.find(e=>e.uuid===uuid&&!e.detached&&e.status==='active'&&e.metadata?.conditions?.length===1&&e.metadata.conditions[0].recovery==='stunned-actions');
}
export async function resolveStunned(ongoing,journal,record,data,user) {
    const entry=stunnedEntry(record,data.effectUuid),effect=entry&&await fromUuid(entry.uuid);
    if(record.status!=='active'||!effect)throw Error('This Stunned contribution is no longer active.');
    if(!user.isGM&&!effect.actor.testUserPermission(user,'OWNER'))throw Error('Only the recipient owner or GM can confirm lost actions.');
    const clock=ongoing.clock();
    if(clock.started&&clock.actorUuid!==effect.actor.uuid)throw Error('Confirm lost actions on the recipient’s turn when actions are regained.');
    const key=boundaryKey(clock,entry.uuid,`stunned-actions:${clock.started?'turn':clock.worldTime}`);
    if(record.obligations.some(o=>o.key===key))throw Error('Action loss was already confirmed at this point.');
    const grant=effect.flags.pf2e?.itemGrants?.[entry.metadata.conditions[0].ruleFlag];
    const condition=grant&&effect.actor.items.get(grant.id);
    if(!condition||condition.slug!=='stunned')throw Error('The native Stunned grant changed.');
    const next=stunnedAfterActionLoss(condition.value,Number(data.lost));
    addObligation(record,{key,kind:'stunned-actions',status:'applying',lost:Number(data.lost),actorUuid:effect.actor.uuid,confirmedBy:user.id});
    record.status='applying';await ongoing.save(journal,record);
    try {
        if(!next){await effect.delete({[MODULE_ID]:{ongoingCleanup:true}});entry.status='ended';entry.reason='actions-lost';}
        else {
            const rules=clone(effect._source.system.rules),rule=rules.find(r=>r.key==='GrantItem'&&r.flag===entry.metadata.conditions[0].ruleFlag);
            const alteration=rule?.alterations?.find(a=>a.property==='badge-value');if(!alteration)throw Error('The native Stunned value changed.');
            alteration.value=next;await effect.update({'system.rules':rules,name:`${record.name}: Stunned ${next}`});await condition.update({'system.value.value':next});
        }
        for(const obligation of record.obligations.filter(o=>o.effectUuid===entry.uuid&&o.kind==='stunned-reminder'))obligation.status='completed';
        record.obligations.find(o=>o.key===key).status='completed';record.status='active';
        if(record.entries.every(e=>e.status==='ended'||e.detached||e.permanent)){record.status='ended';record.endedAt=game.time.worldTime;}
        await ongoing.save(journal,record);return{status:'completed',remaining:next,actionsLost:Number(data.lost)};
    }catch(error){await ongoing.review(journal,`Stunned recovery interrupted: ${error.message}`);throw error;}
}
export async function stunnedControls(ongoing,journal,record) {
    if(record.status!=='active')return[];
    const result=[];
    for(const entry of record.entries.filter(e=>stunnedEntry(record,e.uuid))){
        const effect=await fromUuid(entry.uuid);if(!effect||(!game.user.isGM&&!effect.actor.isOwner))continue;
        result.push({action:`stunned-${journal.id}-${effect.id}`,label:`${effect.actor.name}: resolve Stunned action loss`,callback:async()=>{
            const grant=effect.flags.pf2e?.itemGrants?.[entry.metadata.conditions[0].ruleFlag],condition=grant&&effect.actor.items.get(grant.id);
            const value=condition?.value;if(!value)throw Error('The native Stunned condition is missing.');
            const lost=await foundry.applications.api.DialogV2.prompt({window:{title:'Confirm Stunned action loss'},content:`<p>${escapeHTML(effect.actor.name)} has Stunned ${value} from this cast. Confirm how many actions were lost when regaining actions. Account for quickened and other action rules. Actions lost to Stunned also count toward Slowed; do not subtract them twice. This records the loss and reduces only this cast's condition.</p><input name="lost" type="number" min="1" max="${value}" step="1" value="${Math.min(value,3)}">`,ok:{label:'Confirm actions lost',callback:(_event,button)=>Number(button.form.elements.lost.value)},rejectClose:false});
            if(lost!=null)return ongoing.request('condition-actions-lost',{castId:record.castId,revision:record.revision,effectUuid:entry.uuid,lost});
        }});
    }return result;
}
