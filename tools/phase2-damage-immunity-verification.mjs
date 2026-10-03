import {confirmedDamageSummary} from '../scripts/native-damage-receipt.js';
// Explicit disposable-world checks; spell names here select test fixtures only.
const NS = 'pf2e-automatic-resolution', KEY = 'phase2DamageImmunityVerification';
const assert = (value, message) => { if (!value) throw Error(message); };
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;');

export async function run(macro) {
    assert(game.world.id === 'pftest' && game.user.isGM, 'Disposable pftest GM only.');
    const api = game.modules.get(NS).api;
    const saved = macro.getFlag(NS, KEY) ?? {results: [], actors: [], cases: {}};
    const persist = () => macro.setFlag(NS, KEY, saved);
    const show = result => new foundry.applications.api.DialogV2({window: {title: 'Phase 2 damage and immunity report'}, position: {width: 820},
        content: `<pre style="white-space:pre-wrap;max-height:65vh;overflow:auto">${escape(JSON.stringify(result, null, 2))}</pre>`,
        buttons: [{action: 'close', label: 'Close report'}]}).render(true);
    const record = async (label, fn) => {
        let result;
        try { result = {label, passed: true, at: new Date().toISOString(), details: await fn()}; }
        catch (error) { result = {label, passed: false, error: error.message, stack: error.stack}; }
        saved.results.push(result); await persist(); show(result);
    };
    const actor = async name => {
        const document = await Actor.create({name: `PFTEST P2 Damage Immunity ${name}`, type: 'npc', flags: {[NS]: {phase2DamageImmunityFixture: true}},
            system: {details: {level: {value: 5}}, attributes: {hp: {value: 500, max: 500}, ac: {value: 20}},
                saves: {fortitude: {value: 10}, reflex: {value: 10}, will: {value: 10}}, traits: {value: ['humanoid']}}});
        saved.actors.push(document.id); await persist(); return document;
    };
    const token = async actor => {
        assert(canvas.scene, 'An active disposable test scene is required.');
        return (await canvas.scene.createEmbeddedDocuments('Token', [{...actor.prototypeToken.toObject(), actorId: actor.id, actorLink: true, x: 1100, y: 1100}]))[0];
    };
    const setup = async (name, {custom = false} = {}) => {
        const caster = await actor(`${name} caster`), casterToken = await token(caster);
        const [entry] = await caster.createEmbeddedDocuments('Item', [{name: 'General rules casting', type: 'spellcastingEntry',
            system: {tradition: {value: 'occult'}, prepared: {value: 'innate'}, spelldc: {dc: 24, value: 14}}}]);
        const pack = game.packs.get('pf2e.spells-srd'), index = await pack.getIndex(), row = index.find(item => item.name === name);
        assert(row, `Missing native fixture ${name}`);
        const source = (await pack.getDocument(row._id)).toObject(); delete source._id;
        source.system.location = {value: entry.id};
        if (custom) {
            source.name = 'Custom lingering pulse'; source.system.slug = 'custom-lingering-pulse';
            delete source._stats.compendiumSource;
            source.system.description.value=source.system.description.value.replace('(1+floor', '(3+floor');
        }
        const [spell] = await caster.createEmbeddedDocuments('Item', [source]);
        return {caster, casterToken, spell};
    };
    const finalize = async (card, degrees) => {
        const state = card.getFlag(NS, 'basicSaveState');
        for (const [index, target] of state.targets.entries()) {
            if (target.eligible === false) continue;
            await api.saves.rollSave(card, target.id, {skipDialog: true});
            await api.saves.correctTarget(card, target.id, {action: 'degree', degree: degrees[index] ?? degrees[0]});
        }
        await api.saves.finalize(card);
    };
    const cast = async (fixture, actors, degrees, rank = fixture.spell.baseRank) => {
        if (fixture.spell.isFocusSpell || fixture.spell.isCantrip) await fixture.caster.update({'system.details.level.value': rank * 2 - 1});
        const targets = await Promise.all(actors.map(token));
        const plan = await api.compile(fixture.spell);
        const {card} = await api.saves.start(fixture.spell, {sourceActor: fixture.caster, plan, targets, castRank: rank, dc: 24, skipConfirmation: true});
        await finalize(card, degrees); return card;
    };
    const state=card=>card.getFlag(NS,'basicSaveState');
    const persistent=recipient=>recipient.items.filter(item=>item.type==='condition'&&item.slug==='persistent-damage');
    const expected=(name,rank,degree)=>name==='Caustic Blast'
        ? degree==='criticalFailure'?1+Math.floor((rank-1)/2):0
        : ['failure','criticalFailure'].includes(degree)?Math.ceil(rank/2)*2.5*(degree==='criticalFailure'?2:1):0;
    const checkDamage=(card,recipient,name,rank,degree)=>{
        const s=state(card),multiplier={criticalSuccess:0,success:0.5,failure:1,criticalFailure:2}[degree];
        const initial=Math.floor((s.damage.total??0)*multiplier),items=persistent(recipient),amount=expected(name,rank,degree);
        assert(500-recipient.hitPoints.value===initial,`${name} ${degree}: expected initial ${initial}; observed ${500-recipient.hitPoints.value}; raw ${s.damage.total}`);
        assert(confirmedDamageSummary(s).damage===initial,'Group total excludes future persistent ticks');
        assert(items.length===(amount?1:0),'Exact persistent condition count');
        if(amount){assert(items[0].system.persistent.damage.expectedValue===amount,'Exact persistent damage formula and degree scaling');assert(items[0].system.persistent.dc===15,'Native DC 15 recovery');}
        return {name,rank,degree,cardId:card.id,initial,formula:s.damage.formula,persistent:items.map(i=>({uuid:i.uuid,formula:i.system.persistent.formula,type:i.system.persistent.damageType,expected:i.system.persistent.damage.expectedValue,dc:i.system.persistent.dc}))};
    };
    const actions=[
        ['formula','Verify native persistent formula classification',()=>record('native-formula-classification',async()=>{
            const DamageRoll=CONFIG.Dice.rolls.find(r=>r.name==='DamageRoll'),out=[];
            for(const formula of ['(1+floor((@item.rank -1)/2))[persistent,acid]','(ceil(@item.level/2))d4[persistent,poison]','(2*((ceil(@item.level/2))d4))[persistent,poison]']){
                const roll=new DamageRoll(formula,{item:{rank:3,level:3}});await roll.evaluate();
                assert(roll.instances.length===1&&roll.instances[0].persistent===true,'Annotation preserves persistent category on the entire expression');
                assert(roll.instances[0].type===(formula.includes('acid')?'acid':'poison')&&roll.total===0,'Correct type and no immediate damage');
                out.push({formula,type:roll.instances[0].type,persistent:roll.instances[0].persistent,total:roll.total});
            }return out;
        })],
        ['baseline','Record damage and immunity baseline',()=>record('baseline',async()=>({foundry:game.version,pf2e:game.system.version,world:game.world.id,activeModules:[...game.modules.values()].filter(m=>m.active).map(m=>m.id),removal:game.pf2e.settings.automation.removeEffects}))],
        ['degrees','Verify persistent family all save degrees',()=>record('persistent-degrees',async()=>{
            const out=[];
            for(const name of ['Caustic Blast','Puff of Poison']){
                const fixture=await setup(name);
                for(const degree of ['criticalSuccess','success','failure','criticalFailure']){
                    const recipient=await actor(`${name} ${degree}`),card=await cast(fixture,[recipient],[degree],3);
                    out.push(checkDamage(card,recipient,name,3,degree));
                    const hp=recipient.hitPoints.value,ids=recipient.items.map(i=>i.id).sort().join(',');
                    try{await api.saves.finalize(card);}catch(_){}
                    assert(recipient.hitPoints.value===hp&&recipient.items.map(i=>i.id).sort().join(',')===ids,'Duplicate resolution does not apply damage or persistent condition again');
                }
            }return out;
        })],
        ['ranks','Verify persistent family ranks 1 through 10',()=>record('persistent-ranks',async()=>{
            const out=[];
            for(const name of ['Caustic Blast','Puff of Poison']){
                const fixture=await setup(name);
                for(let rank=1;rank<=10;rank++){
                    const recipient=await actor(`${name} rank${rank}`),card=await cast(fixture,[recipient],['criticalFailure'],rank);
                    out.push(checkDamage(card,recipient,name,rank,'criticalFailure'));
                    assert(state(card).damage.formula.startsWith(`${Math.ceil(rank/2)}d${name==='Caustic Blast'?8:4}`),'Native initial damage heightens once');
                }
            }return out;
        })],
        ['immunity','Verify Deafness outcomes and repeat immunity',()=>record('deafness-degrees',async()=>{
            const fixture=await setup('Deafness'),out=[];
            for(const degree of ['criticalSuccess','success','failure','criticalFailure']){
                const recipient=await actor(`Deafness ${degree}`),card=await cast(fixture,[recipient],[degree],2),s=state(card);
                assert(recipient.hasCondition('deafened')===(degree!=='criticalSuccess'),'Correct Deafened branch');
                const marker=recipient.items.find(i=>i.getFlag(NS,'spellImmunity'));
                assert(marker?.system.duration.value===1&&marker?.system.duration.unit==='minutes','Each degree grants one-minute immunity');
                const effect=s.targets[0].effectUuids.map(uuid=>fromUuidSync(uuid)).find(i=>i?.getFlag(NS,'outcomeEffect')?.conditions.some(c=>c.slug==='deafened'));
                if(degree==='success')assert(effect?.system.duration.value===1&&effect?.system.duration.unit==='rounds','Success one round');
                if(degree==='failure')assert(effect?.system.duration.value===10&&effect?.system.duration.unit==='minutes','Failure ten minutes');
                if(degree==='criticalFailure')assert(effect?.system.duration.unit==='unlimited','Critical failure permanent');
                const again=await cast(fixture,[recipient],[degree],2);assert(state(again).targets[0].eligible===false,'Repeat spell excluded by immunity');
                assert(recipient.hitPoints.value===500,'Condition-only spell never changes HP');
                out.push({degree,cardId:card.id,repeatCardId:again.id,markerUuid:marker.uuid,effectUuid:effect?.uuid,duration:effect?.system.duration});
                if(degree==='criticalFailure')saved.cases.deafness={actorUuid:recipient.uuid,markerUuid:marker.uuid,effectUuid:effect.uuid,spellUuid:fixture.spell.uuid,casterUuid:fixture.caster.uuid};
            }
            return out;
        })],
        ['ranks-immunity','Verify Deafness legal ranks',()=>record('deafness-ranks',async()=>{
            const fixture=await setup('Deafness'),out=[];
            for(let rank=2;rank<=10;rank++){
                const recipient=await actor(`Deafness rank${rank}`),card=await cast(fixture,[recipient],['failure'],rank);
                assert(recipient.hasCondition('deafened'),'Condition at every rank');
                const marker=recipient.items.find(i=>i.getFlag(NS,'spellImmunity'));assert(marker?.system.duration.value===1,'Immunity duration does not heighten');
                out.push({rank,cardId:card.id});
            }return out;
        })],
        ['native','Verify persistent immunity and native stacking',()=>record('persistent-immunity-stacking',async()=>{
            const out=[];
            for(const [name,type] of [['Caustic Blast','acid'],['Puff of Poison','poison']]){
                const fixture=await setup(name),recipient=await actor(`${type} immune`);
                await recipient.update({'system.attributes.immunities':[{type}]});
                const card=await cast(fixture,[recipient],['criticalFailure'],3);
                assert(recipient.hitPoints.value===500&&persistent(recipient).length===0,'Native immunity suppresses initial and persistent damage');
                out.push({name,cardId:card.id});
            }
            const fixture=await setup('Caustic Blast'),recipient=await actor('persistent stacking');
            const source=game.pf2e.ConditionManager.getCondition('persistent-damage').toObject();delete source._id;
            source.system.persistent={formula:'9',damageType:'acid',dc:15};
            const [existing]=await recipient.createEmbeddedDocuments('Item',[source]);
            const other=structuredClone(source);other.system.persistent={formula:'3',damageType:'fire',dc:15};
            const [fire]=await recipient.createEmbeddedDocuments('Item',[other]);
            const card=await cast(fixture,[recipient],['criticalFailure'],3);
            const acid=persistent(recipient).filter(i=>i.active&&i.system.persistent.damageType==='acid');
            assert(acid.length===1&&acid[0].system.persistent.damage.expectedValue===9,'Native highest persistent damage takes precedence');
            assert(recipient.items.has(existing.id)&&recipient.items.has(fire.id),'Unrelated native contributions preserved');
            out.push({cardId:card.id,activeAcid:acid[0].uuid,fire:fire.uuid});return out;
        })],
        ['custom','Prepare custom persistent damage reload case',()=>record('custom-persistent',async()=>{
            const fixture=await setup('Caustic Blast',{custom:true}),recipient=await actor('custom persistent recipient');
            const card=await cast(fixture,[recipient],['criticalFailure'],3),items=persistent(recipient);
            assert(items.length===1&&items[0].system.persistent.damage.expectedValue===4,'Changed custom constant compiles and applies');
            saved.cases.reload={actorUuid:recipient.uuid,conditionUuid:items[0].uuid,cardId:card.id,hp:recipient.hitPoints.value};
            await fixture.spell.delete();return saved.cases.reload;
        })],
        ['reload','Verify persistent reload tick and recovery',()=>record('persistent-reload-tick-recovery',async()=>{
            const entry=saved.cases.reload,recipient=await fromUuid(entry.actorUuid),condition=await fromUuid(entry.conditionUuid),card=game.messages.get(entry.cardId);
            assert(condition?.system.persistent.damage.expectedValue===4&&recipient.hitPoints.value===entry.hp,'Reload preserves native condition without damage replay');
            const previous=new Set(game.messages.map(m=>m.id));
            await condition.onEndTurn();
            const message=game.messages.find(m=>!previous.has(m.id)&&m.flags.pf2e?.origin?.uuid===condition.uuid&&m.rolls?.length);
            assert(message,'Native end-turn damage roll created');
            assert(recipient.hitPoints.value===entry.hp,'Native damage roll awaits application');
            await recipient.applyDamage({damage:message.rolls[0],token:recipient.getActiveTokens()[0]?.document,skipIWR:false});
            assert(entry.hp-recipient.hitPoints.value===4,'Native persistent tick applies expected damage');
            assert(confirmedDamageSummary(state(card)).damage===500-entry.hp,'Original group total does not absorb later native ticks');
            const beforeRecovery=new Set(game.messages.map(m=>m.id));await condition.rollRecovery();
            await new Promise(resolve=>setTimeout(resolve,100));
            const recovery=game.messages.find(m=>!beforeRecovery.has(m.id)&&m.isCheckRoll);
            assert(recovery,'Native flat recovery check created');
            const degree=recovery.flags.pf2e?.context?.outcome;
            const recovered=['success','criticalSuccess'].includes(degree);
            assert(Boolean(await fromUuid(entry.conditionUuid))===!recovered,'Native recovery outcome controls condition removal');
            return {cardId:entry.cardId,tickCardId:message.id,recoveryCardId:recovery.id,recoveryDegree:degree,recovered,hp:recipient.hitPoints.value};
        })],
        ['recovery-success','Verify native successful persistent recovery',()=>record('persistent-recovery-success',async()=>{
            const entry=saved.cases.reload,recipient=await fromUuid(entry.actorUuid),hp=recipient.hitPoints.value,out=[];
            if(!(await fromUuid(entry.conditionUuid))){const previous=saved.results.findLast(r=>r.label==='persistent-reload-tick-recovery');assert(previous?.passed&&previous.details?.recovered,'Prior successful native recovery evidence required');return {alreadyRecovered:true,cardId:previous.details.recoveryCardId};}
            for(let attempt=0;attempt<20;attempt++){
                const condition=await fromUuid(entry.conditionUuid);
                if(!condition){assert(out.length,'A live persistent condition is required');break;}
                assert(condition.system.persistent.dc===15,'Use the ordinary native recovery DC');
                const before=new Set(game.messages.map(m=>m.id));await condition.rollRecovery();
                await new Promise(resolve=>setTimeout(resolve,100));
                const message=game.messages.find(m=>!before.has(m.id)&&m.isCheckRoll),degree=message?.flags.pf2e?.context?.outcome;
                assert(message,'Recovery roll recorded');const recovered=['success','criticalSuccess'].includes(degree);
                assert(Boolean(await fromUuid(entry.conditionUuid))===!recovered,'Native flat-check result controls exact condition removal');
                out.push({cardId:message.id,degree});if(recovered)break;
            }
            assert(!(await fromUuid(entry.conditionUuid)),'A successful native recovery was observed within the test attempts');
            assert(recipient.hitPoints.value===hp,'Recovery does not replay damage');return out;
        })],
        ['expiry','Verify Deafness immunity expiry and permanent condition',()=>record('deafness-expiry',async()=>{
            const e=saved.cases.deafness,recipient=await fromUuid(e.actorUuid),marker=await fromUuid(e.markerUuid),permanent=await fromUuid(e.effectUuid);
            assert(marker&&permanent,'Reload preserves immunity and permanent condition');
            // Age only the disposable marker; do not move the world's clock.
            await marker.update({'system.start.value':game.time.worldTime-61});
            await api.ongoing.reconcile({clockEvent:true});
            assert(!(await fromUuid(e.markerUuid))||fromUuidSync(e.markerUuid).isExpired,'One-minute marker expires');
            assert(recipient.hasCondition('deafened')&&await fromUuid(e.effectUuid),'Permanent Deafened survives immunity expiry');
            const spell=await fromUuid(e.spellUuid),caster=await fromUuid(e.casterUuid),target=await token(recipient);
            const {card}=await api.saves.start(spell,{sourceActor:caster,plan:await api.compile(spell),targets:[target],castRank:2,dc:24,skipConfirmation:true});
            assert(state(card).targets[0].eligible===true,'Target eligible again after immunity expiry');
            await finalize(card,['criticalSuccess']);return {cardId:card.id,permanentUuid:permanent.uuid};
        })],
        ['cleanup','Remove only damage and immunity test fixtures',()=>record('fixture-cleanup',async()=>{
            const actors=saved.actors.map(id=>game.actors.get(id)).filter(a=>a?.getFlag(NS,'phase2DamageImmunityFixture'));
            const ids=new Set(actors.map(a=>a.id)),uuids=new Set(actors.map(a=>a.uuid));const records=api.ongoing.records().filter(r=>uuids.has(r.sourceActorUuid));
            for(const r of records)await game.journal.get(r.journalId)?.update({[`flags.${NS}.ongoingCast.status`]:'ended'});
            for(const scene of game.scenes){const tokens=scene.tokens.filter(t=>ids.has(t.actorId)).map(t=>t.id);if(tokens.length)await scene.deleteEmbeddedDocuments('Token',tokens);}
            if(ids.size)await Actor.deleteDocuments([...ids],{[NS]:{ongoingCleanup:true}});
            for(const r of records)await game.journal.get(r.journalId)?.delete();saved.actors=[];
            return {actorsRemoved:ids.size,journalsRemoved:records.length};
        })],
        ['report','Show damage and immunity evidence',()=>show(saved)]
    ];
    new foundry.applications.api.DialogV2({window:{title:'Phase 2 damage and immunity verification'},position:{width:780},content:'<p>Disposable pftest only. Native saves followed by explicit GM degree selection. Reload between custom preparation and persistence checks.</p>',buttons:actions.map(([action,label,callback])=>({action,label,callback}))}).render(true);
}
