import {confirmedDamageSummary} from '../scripts/native-damage-receipt.js';
// Explicit disposable-world checks; spell names here select test fixtures only.
const NS = 'pf2e-automatic-resolution', KEY = 'phase2ClauseVerification';
const assert = (value, message) => { if (!value) throw Error(message); };
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;');

export async function run(macro) {
    assert(game.world.id === 'pftest' && game.user.isGM, 'Disposable pftest GM only.');
    const api = game.modules.get(NS).api;
    const saved = macro.getFlag(NS, KEY) ?? {results: [], actors: [], cases: {}};
    const persist = () => macro.setFlag(NS, KEY, saved);
    const show = result => new foundry.applications.api.DialogV2({window: {title: 'Phase 2 clause family report'}, position: {width: 820},
        content: `<pre style="white-space:pre-wrap;max-height:65vh;overflow:auto">${escape(JSON.stringify(result, null, 2))}</pre>`,
        buttons: [{action: 'close', label: 'Close report'}]}).render(true);
    const record = async (label, fn) => {
        let result;
        try { result = {label, passed: true, at: new Date().toISOString(), details: await fn()}; }
        catch (error) { result = {label, passed: false, error: error.message, stack: error.stack}; }
        saved.results.push(result); await persist(); show(result);
    };
    const actor = async name => {
        const document = await Actor.create({name: `PFTEST P2 Clause ${name}`, type: 'npc', flags: {[NS]: {phase2ClauseFixture: true}},
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
            source.name = 'Custom compelling gesture'; source.system.slug = 'custom-compelling-gesture';
            delete source._stats.compendiumSource;
            source.system.description.value=source.system.description.value.replace('for 1 minute','for 2 minutes').replace('for 1 hour','for 2 hours');
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
    const ownEffects=card=>state(card).targets[0].effectUuids.map(uuid=>fromUuidSync(uuid)).filter(Boolean);
    const effectFor=(card,slug)=>ownEffects(card).find(e=>e.getFlag(NS,'outcomeEffect')?.conditions.some(c=>c.slug===slug));
    const actions=[
        ['baseline','Record clause family baseline',()=>record('baseline',async()=>({foundry:game.version,pf2e:game.system.version,world:game.world.id,modules:[...game.modules.values()].filter(m=>m.active).map(m=>m.id),removal:game.pf2e.settings.automation.removeEffects}))],
        ['degrees','Verify clause family all save degrees',()=>record('all-degrees',async()=>{
            const out=[];
            for(const name of ['Unraveling Blast','Touch of Obedience']){
                const fixture=await setup(name);
                for(const degree of ['criticalSuccess','success','failure','criticalFailure']){
                    const recipient=await actor(`${name} ${degree}`),card=await cast(fixture,[recipient],[degree],3),s=state(card);
                    const damage=name==='Unraveling Blast'?Math.floor((s.damage.total??0)*({criticalSuccess:0,success:0.5,failure:1,criticalFailure:2}[degree])):0;
                    assert(500-recipient.hitPoints.value===damage,'Exact native damage multiplier');
                    assert(confirmedDamageSummary(s).damage===damage,'Confirmed group damage total');
                    if(name==='Unraveling Blast'){
                        assert(recipient.hasCondition('off-guard')===['failure','criticalFailure'].includes(degree),'Off-guard on failure and critical failure');
                        assert(recipient.hasCondition('stunned')===(degree==='criticalFailure'),'Stunned only on critical failure');
                        if(degree==='criticalFailure')assert(recipient.getCondition('stunned')?.value===1&&effectFor(card,'stunned')?.system.duration.unit==='unlimited','Stunned 1 is action debt with no inherited Off-guard timer');
                    }else{
                        assert(recipient.hasCondition('stupefied')===(degree!=='criticalSuccess'),'Exact Stupefied branch');
                        if(degree!=='criticalSuccess')assert(recipient.getCondition('stupefied')?.value===(degree==='success'?1:2),'Exact Stupefied value');
                        assert(recipient.hasCondition('prone')===(degree==='criticalFailure'),'Exact Prone branch');
                        if(degree==='criticalFailure'){
                            assert(effectFor(card,'stupefied')?.system.duration.value===1&&effectFor(card,'stupefied')?.system.duration.unit==='minutes','Stupefied lasts one minute');
                            assert(effectFor(card,'prone')?.system.duration.unit==='unlimited','Prone has no inherited Stupefied timer');
                        }
                        const marker=recipient.items.find(i=>i.getFlag(NS,'spellImmunity'));
                        assert(marker?.system.duration.value===1&&marker?.system.duration.unit==='hours','One-hour immunity after every outcome');
                        const again=await cast(fixture,[recipient],[degree],3);
                        assert(state(again).targets[0].eligible===false,'Repeat cast respects immunity');
                    }
                    const hp=recipient.hitPoints.value,ids=recipient.items.map(i=>i.id).sort().join(',');
                    try{await api.saves.finalize(card);}catch{}
                    assert(recipient.hitPoints.value===hp&&recipient.items.map(i=>i.id).sort().join(',')===ids,'Duplicate finalization changes nothing');
                    out.push({name,degree,cardId:card.id,damage,effects:ownEffects(card).map(e=>({uuid:e.uuid,duration:e.system.duration,conditions:e.getFlag(NS,'outcomeEffect')?.conditions}))});
                }
            }return out;
        })],
        ['ranks','Verify clause family ranks 1 through 10',()=>record('all-ranks',async()=>{
            const out=[];
            for(const name of ['Unraveling Blast','Touch of Obedience']){
                const fixture=await setup(name);
                for(let rank=1;rank<=10;rank++){
                    const recipient=await actor(`${name} rank${rank}`),card=await cast(fixture,[recipient],['criticalFailure'],rank);
                    if(name==='Unraveling Blast')assert(state(card).damage.formula.startsWith(`${2+3*(rank-1)}d4`),'Native +3d4 per rank');
                    assert(recipient.getCondition(name==='Unraveling Blast'?'stunned':'stupefied')?.value===(name==='Unraveling Blast'?1:2),'Conditions do not heighten');
                    out.push({name,rank,cardId:card.id,formula:state(card).damage.formula});
                }
            }return out;
        })],
        ['timing','Verify independent turn timing and action debt',()=>record('turn-timing',async()=>{
            const blast=await setup('Unraveling Blast'),touch=await setup('Touch of Obedience');
            const failure=await actor('blast failure'),critical=await actor('blast critical'),success=await actor('touch success'),failedTouch=await actor('touch failure');
            // Both source spells use the same turn owner for this isolated encounter.
            const source=touch.spell.toObject();delete source._id;source.system.location.value=blast.spell.system.location.value;
            const [touchSpell]=await blast.caster.createEmbeddedDocuments('Item',[source]);
            const touchFixture={...blast,spell:touchSpell};
            const ft=await token(failure),ct=await token(critical),previous=game.combat?.id,combat=await Combat.create({scene:canvas.scene.id,active:false});
            try{
                await combat.activate();await combat.createEmbeddedDocuments('Combatant',[{actorId:blast.caster.id,tokenId:blast.casterToken.id,sceneId:canvas.scene.id,initiative:20},{actorId:failure.id,tokenId:ft.id,sceneId:canvas.scene.id,initiative:10},{actorId:critical.id,tokenId:ct.id,sceneId:canvas.scene.id,initiative:5}]);await combat.startCombat();
                const fcard=await cast(blast,[failure],['failure'],3),ccard=await cast(blast,[critical],['criticalFailure'],3);
                const scard=await cast(touchFixture,[success],['success'],3),tcard=await cast(touchFixture,[failedTouch],['failure'],3);
                await combat.nextTurn();await api.ongoing.reconcile({clockEvent:true});
                assert(!failure.hasCondition('off-guard')&&critical.hasCondition('off-guard'),'Failure ends at target turn; critical failure persists');
                await combat.nextTurn();await api.ongoing.reconcile({clockEvent:true});
                assert(critical.hasCondition('stunned')&&critical.hasCondition('off-guard'),'Stunned awaits confirmed lost action at recipient turn');
                await api.ongoing.request('condition-actions-lost',{castId:state(ccard).castId,effectUuid:effectFor(ccard,'stunned').uuid,lost:1});
                assert(!critical.hasCondition('stunned')&&critical.hasCondition('off-guard'),'Action debt resolved independently');
                await combat.nextTurn();await api.ongoing.reconcile({clockEvent:true});
                assert(!critical.hasCondition('off-guard')&&success.hasCondition('stupefied')&&failedTouch.hasCondition('stupefied'),'Caster turn start ends only Off-guard');
                await combat.nextTurn();await api.ongoing.reconcile({clockEvent:true});
                assert(!success.hasCondition('stupefied')&&!failedTouch.hasCondition('stupefied'),'Caster turn end expires both Stupefied branches');
                return {cards:[fcard.id,ccard.id,scard.id,tcard.id]};
            }finally{await combat.delete();if(previous)await game.combats.get(previous)?.activate();}
        })],
        ['regressions','Verify existing condition timing corrections',()=>record('existing-timing-corrections',async()=>{
            const out=[];
            for(const [name,untimed,timed,unit] of [["Eagle's Cry",'frightened','fleeing','rounds'],['Painful Vibrations','sickened','deafened','minutes']]){
                const fixture=await setup(name),recipient=await actor(`${name} timing`),card=await cast(fixture,[recipient],['criticalFailure'],fixture.spell.baseRank);
                const first=effectFor(card,untimed),second=effectFor(card,timed);
                assert(first&&second&&first.uuid!==second.uuid,'Distinct condition contributions');
                assert(first.system.duration.unit==='unlimited'&&second.system.duration.value===1&&second.system.duration.unit===unit,'Only later condition has the explicit timer');
                assert(recipient.hasCondition(untimed)&&recipient.hasCondition(timed),'Both native conditions applied');
                const hp=recipient.hitPoints.value;
                await second.delete();await api.ongoing.reconcile();
                assert(recipient.hasCondition(untimed)&&!recipient.hasCondition(timed)&&recipient.hitPoints.value===hp,'Removing timed contribution preserves independent condition and HP');
                out.push({name,cardId:card.id,untimedUuid:first.uuid,timedUuid:second.uuid});
            }return out;
        })],
        ['prone-regressions','Verify existing unlinked Prone corrections',()=>record('existing-prone-corrections',async()=>{
            const out=[];
            for(const name of ['Gravity Wave','Blazing Fissure','Stormburst']){
                const fixture=await setup(name),recipient=await actor(`${name} prone`),card=await cast(fixture,[recipient],['criticalFailure'],fixture.spell.baseRank);
                assert(recipient.hasCondition('prone')&&effectFor(card,'prone'),'Unlinked critical-failure Prone applied');
                assert(recipient.hitPoints.value<500,'Critical-failure damage retained');
                if(name==='Stormburst')assert(recipient.getCondition('stunned')?.value===1,'Stunned retained alongside Prone');
                out.push({name,cardId:card.id,proneUuid:effectFor(card,'prone').uuid});
            }return out;
        })],
        ['eligibility','Verify living targets and late eligibility',()=>record('living-eligibility',async()=>{
            const fixture=await setup('Touch of Obedience'),out=[];
            for(const trait of ['humanoid','undead','construct']){
                const recipient=await actor(`target ${trait}`);await recipient.update({'system.traits.value':[trait]});
                const card=await cast(fixture,[recipient],['criticalFailure'],3),eligible=trait==='humanoid';
                assert(state(card).targets[0].eligible===eligible&&recipient.hasCondition('stupefied')===eligible,'Living requirement enforced');
                assert(recipient.items.some(i=>i.getFlag(NS,'spellImmunity'))===eligible,'Ineligible target receives no immunity');out.push({trait,cardId:card.id});
            }
            const recipient=await actor('late undead'),target=await token(recipient);
            const {card}=await api.saves.start(fixture.spell,{sourceActor:fixture.caster,plan:await api.compile(fixture.spell),targets:[target],castRank:3,dc:24,skipConfirmation:true});
            const id=state(card).targets[0].id;await api.saves.rollSave(card,id,{skipDialog:true});await api.saves.correctTarget(card,id,{action:'degree',degree:'criticalFailure'});
            await recipient.update({'system.traits.value':['undead']});await api.saves.finalize(card);
            assert(!recipient.hasCondition('stupefied')&&!recipient.hasCondition('prone'),'Late eligibility rechecked');out.push({late:true,cardId:card.id});return out;
        })],
        ['custom','Prepare custom clause reload and expiry',()=>record('custom-source',async()=>{
            const fixture=await setup('Touch of Obedience',{custom:true}),recipient=await actor('custom recipient');
            const source=game.pf2e.ConditionManager.getCondition('stupefied').toObject();delete source._id;source.system.value.value=3;
            const [unrelated]=await recipient.createEmbeddedDocuments('Item',[source]);
            const card=await cast(fixture,[recipient],['criticalFailure'],3),stup=effectFor(card,'stupefied'),prone=effectFor(card,'prone'),marker=recipient.items.find(i=>i.getFlag(NS,'spellImmunity'));
            assert(stup.system.duration.value===2&&stup.system.duration.unit==='minutes'&&marker.system.duration.value===2&&marker.system.duration.unit==='hours','Changed custom durations compile independently');
            saved.cases.reload={actorUuid:recipient.uuid,stupUuid:stup.uuid,proneUuid:prone.uuid,markerUuid:marker.uuid,unrelatedId:unrelated.id,cardId:card.id,hp:recipient.hitPoints.value};
            await fixture.spell.delete();return saved.cases.reload;
        })],
        ['reload','Verify clause reload selective expiry and Prone removal',()=>record('reload-expiry',async()=>{
            const e=saved.cases.reload,recipient=await fromUuid(e.actorUuid),stup=await fromUuid(e.stupUuid),prone=await fromUuid(e.proneUuid),marker=await fromUuid(e.markerUuid);
            assert(stup&&prone&&marker&&recipient.hasCondition('prone'),'Source deletion and reload retain independent contributions');
            await stup.update({'system.start.value':game.time.worldTime-121});await api.ongoing.reconcile({clockEvent:true});
            assert((!(await fromUuid(e.stupUuid))||fromUuidSync(e.stupUuid).isExpired)&&recipient.hasCondition('prone'),'Two-minute expiry does not remove untimed Prone');
            assert(recipient.items.has(e.unrelatedId)&&recipient.getCondition('stupefied')?.value===3,'Unrelated Stupefied preserved');
            // This exercises native condition removal after a GM-confirmed Stand; it does not automate the action.
            await recipient.decreaseCondition('prone');await api.ongoing.reconcile();
            assert(!recipient.hasCondition('prone'),'Native Prone removal clears its own contribution');
            assert(await fromUuid(e.markerUuid),'Standing does not remove spell immunity');
            await marker.update({'system.start.value':game.time.worldTime-7201});await api.ongoing.reconcile({clockEvent:true});
            assert(!(await fromUuid(e.markerUuid))||fromUuidSync(e.markerUuid).isExpired,'Only the aged two-hour marker expires');
            assert(recipient.items.has(e.unrelatedId)&&recipient.hitPoints.value===e.hp,'Unrelated condition retained and no damage replay');return e;
        })],
        ['cleanup','Remove only clause family test fixtures',()=>record('fixture-cleanup',async()=>{
            const actors=saved.actors.map(id=>game.actors.get(id)).filter(a=>a?.getFlag(NS,'phase2ClauseFixture'));
            const ids=new Set(actors.map(a=>a.id)),uuids=new Set(actors.map(a=>a.uuid));const records=api.ongoing.records().filter(r=>uuids.has(r.sourceActorUuid));
            for(const r of records)await game.journal.get(r.journalId)?.update({[`flags.${NS}.ongoingCast.status`]:'ended'});
            for(const scene of game.scenes){const tokens=scene.tokens.filter(t=>ids.has(t.actorId)).map(t=>t.id);if(tokens.length)await scene.deleteEmbeddedDocuments('Token',tokens);}
            if(ids.size)await Actor.deleteDocuments([...ids],{[NS]:{ongoingCleanup:true}});
            for(const r of records)await game.journal.get(r.journalId)?.delete();saved.actors=[];
            return {actorsRemoved:ids.size,journalsRemoved:records.length};
        })],
        ['report','Show clause family evidence',()=>show(saved)]
    ];
    new foundry.applications.api.DialogV2({window:{title:'Phase 2 clause family verification'},position:{width:780},content:'<p>Disposable pftest only. Native saves and explicit GM outcomes. Reload after custom source preparation.</p>',buttons:actions.map(([action,label,callback])=>({action,label,callback}))}).render(true);
}
