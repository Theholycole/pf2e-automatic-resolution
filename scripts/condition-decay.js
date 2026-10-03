import {MODULE_ID} from './effect-runtime.js';
import {clone} from './runtime-utils.js';
import {turnAdvance, boundaryKey, addObligation} from './ongoing-core.js';

/** Track native condition recovery without replaying a completed turn boundary. */
export async function reconcileConditionRecovery(ongoing, journal, record, {clockEvent=false,recover=false}={}) {
    const tracked=record.entries.filter(e=>!e.detached&&e.status==='active'&&e.metadata?.conditions?.some(c=>['frightened','stunned-actions'].includes(c.recovery)));
    if(!tracked.length)return false;
    const clock=ongoing.clock(),advance=turnAdvance(record.clock,clock);
    if((clockEvent||recover)&&record.clock?.started&&!['same','next'].includes(advance)){
        await ongoing.review(journal,'Turn order changed. Review missed condition recovery; none was replayed.',{resumable:true});return true;
    }
    if(advance==='next')for(const entry of tracked.filter(e=>e.actorUuid===clock.actorUuid&&e.metadata.conditions.some(c=>c.recovery==='stunned-actions')))addObligation(record,{key:boundaryKey(clock,entry.uuid,'stunned-reminder'),kind:'stunned-reminder',effectUuid:entry.uuid,label:'Resolve Stunned action loss in Ongoing spells when regaining actions'});
    for(const entry of tracked.filter(e=>advance==='next'&&e.actorUuid===record.clock.actorUuid&&e.metadata.conditions.some(c=>c.recovery==='frightened'))){
        const effect=await fromUuid(entry.uuid);
        if(!effect)continue;
        const metadata=entry.metadata.conditions;
        if(metadata.length!==1) {await ongoing.review(journal,'This legacy Frightened contribution shares an Effect. Review its reduction manually.');return true;}
        const grant=effect.flags.pf2e?.itemGrants?.[metadata[0].ruleFlag];
        const condition=grant&&effect.actor.items.get(grant.id);
        if(!condition||condition.slug!=='frightened'){await ongoing.review(journal,'The native Frightened grant changed. Review before reducing it.');return true;}
        const key=boundaryKey(record.clock,entry.uuid,'frightened-decay');
        if(record.obligations.some(o=>o.key===key))continue;
        addObligation(record,{key,kind:'decay',status:'applying'});record.status='applying';await ongoing.save(journal,record);
        try {
            const next=Math.max(0,condition.value-1);
            if(next===0){
                await effect.delete({[MODULE_ID]:{ongoingCleanup:true}});entry.status='ended';entry.reason='frightened-recovered';
            }else{
                const rules=clone(effect._source.system.rules),rule=rules.find(r=>r.key==='GrantItem'&&r.flag===metadata[0].ruleFlag);
                if(!rule)throw Error('The native Frightened rule is missing.');
                const alteration=rule.alterations?.find(a=>a.property==='badge-value');
                if(!alteration)throw Error('The native Frightened value is missing.');
                alteration.value=next;
                await effect.update({'system.rules':rules,name:`${record.name}: Frightened ${next}`});
                await condition.update({'system.value.value':next});
            }
            record.obligations.find(o=>o.key===key).status='completed';record.status='active';
        }catch(error){await ongoing.review(journal,`Frightened reduction interrupted: ${error.message}`);return true;}
    }
    record.clock=clock;record.lastWorldTime=clock.worldTime;await ongoing.save(journal,record);
    return false;
}
