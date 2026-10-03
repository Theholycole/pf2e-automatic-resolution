import {selectComponentDamageRoll} from '../scripts/component-damage.js';
import {confirmedDamageSummary} from '../scripts/native-damage-receipt.js';
// Explicit disposable-world checks; spell names here select test fixtures only.
const NS = 'pf2e-automatic-resolution', KEY = 'phase2CompositionVerification';
const assert = (value, message) => { if (!value) throw Error(message); };
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;');

export async function run(macro) {
    assert(game.world.id === 'pftest' && game.user.isGM, 'Disposable pftest GM only.');
    const api = game.modules.get(NS).api;
    const saved = macro.getFlag(NS, KEY) ?? {results: [], actors: [], cases: {}};
    const persist = () => macro.setFlag(NS, KEY, saved);
    const show = result => new foundry.applications.api.DialogV2({window: {title: 'Phase 2 composition report'}, position: {width: 820},
        content: `<pre style="white-space:pre-wrap;max-height:65vh;overflow:auto">${escape(JSON.stringify(result, null, 2))}</pre>`,
        buttons: [{action: 'close', label: 'Close report'}]}).render(true);
    const record = async (label, fn) => {
        let result;
        try { result = {label, passed: true, at: new Date().toISOString(), details: await fn()}; }
        catch (error) { result = {label, passed: false, error: error.message, stack: error.stack}; }
        saved.results.push(result); await persist(); show(result);
    };
    const actor = async name => {
        const document = await Actor.create({name: `PFTEST P2 Composition ${name}`, type: 'npc', flags: {[NS]: {phase2CompositionFixture: true}},
            system: {details: {level: {value: 5}}, attributes: {hp: {value: 500, max: 500}, ac: {value: 20}},
                movement: {speeds: {land: {value: 25}}}, saves: {fortitude: {value: 10}, reflex: {value: 10}, will: {value: 10}}, traits: {value: ['humanoid']}}});
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
            source.name = 'Custom composed spell'; source.system.slug = 'custom-composed-spell';
            delete source._stats.compendiumSource;
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
    const actions=[
        ['probe','Probe native composed damage and templates',()=>record('native-probe',async()=>{
            const out=[];
            for(const name of ['Ancient Dust','Bursting Bloom','Cutting Insult','Tempest Touch']){
                const fixture=await setup(name);
                for(const rank of [...new Set([fixture.spell.baseRank,Math.min(10,fixture.spell.baseRank+2)])]){
                    if(fixture.spell.isFocusSpell||fixture.spell.isCantrip)await fixture.caster.update({'system.details.level.value':rank*2-1});
                    const spell=fixture.spell.loadVariant({castRank:rank})??fixture.spell;
                    const prepared=await spell.getDamage({skipDialog:true}),roll=prepared?.template?.damage?.roll;
                    assert(roll,'Native spell damage exists');if(!roll._evaluated)await roll.evaluate();
                    out.push({name,rank,formula:roll.formula,total:roll.total,structured:spell.system.damage,base:prepared.template.damage.base,instances:roll.instances.map(i=>({type:i.type,persistent:i.persistent,formula:i.formula,total:i.total,evaluated:i._evaluated})),instancePool:Boolean(CONFIG.Dice.termTypes.InstancePool)});
                }
            }return out;
        })],
        ['projection','Verify native component projection',()=>record('native-projection',async()=>{
            const out=[],DamageRoll=CONFIG.Dice.rolls.find(r=>r.name==='DamageRoll'),InstancePool=CONFIG.Dice.termTypes.InstancePool;
            for(const name of ['Ancient Dust','Bursting Bloom','Cutting Insult']){
                const f=await setup(name),spell=f.spell,prepared=await spell.getDamage({skipDialog:true}),roll=prepared.template.damage.roll;await roll.evaluate();
                const components=Object.entries(spell.system.damage).map(([id,c])=>({id,...c}));
                const direct=components.find(c=>c.category!=='persistent'&&c.type!=='bleed'),persistent=components.find(c=>c!==direct);
                const directInstance=roll.instances.find(i=>!i.persistent);
                const directRoll=DamageRoll.fromTerms([InstancePool.fromRolls([directInstance.constructor.fromData(directInstance.toJSON())])]);
                const half=selectComponentDamageRoll(roll,components,{multiplier:0.5,sourceComponentIds:[direct.id]});
                const expectedHalf=directRoll.alter(0.5,0);
                assert(half.instances.length===1&&!half.instances[0].persistent,'Success selects only direct damage');
                assert(half.total===expectedHalf.total,`Native rounding/minimum preserved: projected ${half.total}, native ${expectedHalf.total}`);
                const critical=selectComponentDamageRoll(roll,components,{multiplier:2,sourceComponentIds:components.map(c=>c.id),componentMultipliers:{[persistent.id]:1}});
                assert(critical.instances.length===2&&critical.instances.filter(i=>i.persistent).length===1,'Combined critical roll retains persistent category');
                assert(critical.instances.find(i=>!i.persistent).total===directRoll.alter(2,0).instances[0].total,'Direct damage doubles');
                out.push({name,base:roll.formula,baseTotal:roll.total,half:half.formula,halfTotal:half.total,expectedHalf:expectedHalf.total,critical:critical.formula,criticalTotal:critical.total});
            }return out;
        })],
        ['degrees','Verify composed spells all save degrees',()=>record('all-degrees',async()=>{
            const out=[];
            for(const name of ['Ancient Dust','Bursting Bloom','Cutting Insult','Tempest Touch']){
                const f=await setup(name);
                for(const degree of ['criticalSuccess','success','failure','criticalFailure']){
                    const recipient=await actor(`${name} ${degree}`),card=await cast(f,[recipient],[degree]),s=state(card);
                    assert(s.status==='completed',`${name} ${degree}: completed, got ${s.status}`);
                    const delta=500-recipient.hitPoints.value;
                    if(degree!=='criticalSuccess'){
                        const DamageRoll=CONFIG.Dice.rolls.find(r=>r.name==='DamageRoll');
                        const base=DamageRoll.fromData(s.damage.rollJSON),factor={success:0.5,failure:1,criticalFailure:2}[degree];
                        const initial=base.instances.filter(i=>!i.persistent).reduce((sum,i)=>sum+Math.floor(i.total*factor),0);
                        const expected=(degree==='failure'&&base.options.increasedFrom===0)?1:initial;
                        assert(delta===expected,`Exact initial damage ${name}/${degree}: ${delta} versus ${expected}`);
                    }
                    assert(confirmedDamageSummary(s).damage===delta,'Receipt counts actual initial HP loss');
                    const persistent=recipient.items.filter(i=>i.type==='condition'&&i.slug==='persistent-damage');
                    assert(persistent.length===((name!=='Tempest Touch'&&['failure','criticalFailure'].includes(degree))?1:0),'Persistent damage only on failed degrees');
                    if(name==='Cutting Insult')assert((recipient.getCondition('frightened')?.value??0)===({criticalSuccess:0,success:1,failure:2,criticalFailure:3}[degree]),'Independent Frightened degree');
                    if(name==='Bursting Bloom')assert(recipient.hasCondition('encumbered')===['failure','criticalFailure'].includes(degree),'Independent Encumbered degree');
                    const native=recipient.items.filter(i=>i.getFlag(NS,'runtime')?.resolutionKind==='save');
                    if(name==='Tempest Touch'){
                        assert(native.length===(degree==='criticalSuccess'?0:1),'One native selected Effect');
                        if(native.length){
                            const selected=native[0].system.rules.find(r=>r.key==='ChoiceSet').selection;
                            assert(selected===(degree==='success'?-5:-10),'Native Speed choice matches degree');
                            assert(recipient.system.movement.speeds.land.value===25+selected,'Prepared native Speed modifier');
                        }
                    }
                    const hp=recipient.hitPoints.value,items=recipient.items.map(i=>i.id).sort().join(',');
                    try{await api.saves.finalize(card);}catch{}
                    assert(recipient.hitPoints.value===hp&&recipient.items.map(i=>i.id).sort().join(',')===items,'Duplicate finalization has no consequences');
                    out.push({name,degree,cardId:card.id,damage:delta,persistent:persistent.map(i=>({formula:i.system.persistent.formula,expectedValue:i.system.persistent.expectedValue})),speed:recipient.system.movement.speeds.land.value,effects:s.targets[0].effectUuids});
                }
            }return out;
        })],
        ['ranks','Verify composed spells all legal ranks',()=>record('all-ranks',async()=>{
            const out=[];
            for(const name of ['Ancient Dust','Bursting Bloom','Cutting Insult','Tempest Touch']){
                const f=await setup(name);
                for(let rank=f.spell.baseRank;rank<=10;rank++){
                    const recipient=await actor(`${name} rank${rank}`),card=await cast(f,[recipient],['criticalFailure'],rank),s=state(card);
                    assert(s.status==='completed',`${name} rank ${rank}: completed`);
                    assert(confirmedDamageSummary(s).damage===500-recipient.hitPoints.value,'Receipt matches immediate HP at every rank');
                    const persistent=recipient.items.find(i=>i.slug==='persistent-damage');
                    if(name==='Ancient Dust')assert(persistent.system.persistent.expectedValue===(1+Math.floor((rank-1)/2))*2,'Ancient persistent increases every two ranks and doubles');
                    if(name==='Cutting Insult')assert(persistent.system.persistent.expectedValue===(1+Math.floor((rank-2)/2))*2,'Insult persistent increases every two ranks and doubles');
                    if(name==='Bursting Bloom')assert(persistent.system.persistent.formula===`${1+Math.floor((rank-4)/2)}d6`,'Bloom persistent heightens but is not doubled');
                    out.push({name,rank,cardId:card.id,formula:s.damage.formula,persistent:persistent?{formula:persistent.system.persistent.formula,expectedValue:persistent.system.persistent.expectedValue}:null,damage:500-recipient.hitPoints.value});
                }
            }return out;
        })],
        ['preflight','Verify all-target preflight leaves HP unchanged',()=>record('all-target-preflight',async()=>{
            const f=await setup('Tempest Touch'),a=await actor('preflight first'),b=await actor('preflight second');
            const targets=await Promise.all([a,b].map(token)),plan=await api.compile(f.spell);
            const {card}=await api.saves.start(f.spell,{sourceActor:f.caster,plan,targets,castRank:1,dc:24,skipConfirmation:true});
            for(const [index,t]of state(card).targets.entries()){
                await api.saves.rollSave(card,t.id,{skipDialog:true});
                await api.saves.correctTarget(card,t.id,{action:'degree',degree:index?'failure':'success'});
            }
            const snapshot=foundry.utils.deepClone(state(card));
            snapshot.outcomes.failure.nativeEffects[0].document.mechanics.rules.find(r=>r.key==='FlatModifier').type='status';
            await card.setFlag(NS,'basicSaveState',snapshot);
            let rejected=false;try{await api.saves.finalize(card);}catch{rejected=true;}
            assert(a.hitPoints.value===500&&b.hitPoints.value===500,'Stale second-target template cannot damage first target');
            assert(![a,b].some(actor=>actor.items.some(i=>i.getFlag(NS,'runtime')?.resolutionKind==='save')),'No partial native Effects');
            assert(state(card).status!=='completed','Stale cast is not reported complete');
            return {cardId:card.id,rejected,status:state(card).status,hp:[a.hitPoints.value,b.hitPoints.value]};
        })],
        ['timing','Verify native Speed expiry and source deletion',()=>record('native-speed-timing',async()=>{
            const out=[];
            for(const sourceLater of [false,true]){
                const f=await setup('Tempest Touch'),recipient=await actor(`timing ${sourceLater}`),rt=await token(recipient);
                const previous=game.combat?.id,combat=await Combat.create({scene:canvas.scene.id,active:false});
                try{
                    await combat.activate();await combat.createEmbeddedDocuments('Combatant',[
                        {actorId:f.caster.id,tokenId:f.casterToken.id,sceneId:canvas.scene.id,initiative:sourceLater?10:20},
                        {actorId:recipient.id,tokenId:rt.id,sceneId:canvas.scene.id,initiative:sourceLater?20:10}
                    ]);await combat.startCombat();
                    const card=await cast(f,[recipient],['failure'],1),effect=fromUuidSync(state(card).targets[0].effectUuids[0]);
                    assert(effect.system.duration.value===(sourceLater?0:1),'Next-source-turn clock respects initiative order');
                    const hp=recipient.hitPoints.value;
                    await f.spell.delete();await api.ongoing.reconcile();
                    assert(recipient.system.movement.speeds.land.value===15,'Source item deletion preserves active penalty');
                    await combat.nextTurn();await api.ongoing.reconcile({clockEvent:true});
                    assert(recipient.system.movement.speeds.land.value===15,'Penalty remains before end of next caster turn');
                    if(!sourceLater){await combat.nextTurn();await api.ongoing.reconcile({clockEvent:true});assert(recipient.system.movement.speeds.land.value===15,'Penalty remains at caster next turn start');}
                    await combat.nextTurn();await api.ongoing.reconcile({clockEvent:true});
                    assert(recipient.system.movement.speeds.land.value===25,'Native penalty ends at caster next turn end');
                    assert(recipient.hitPoints.value===hp,'Expiry does not replay damage');
                    out.push({sourceLater,cardId:card.id,duration:effect.system.duration});
                }finally{await combat.delete();if(previous)await game.combats.get(previous)?.activate();}
            }return out;
        })],
        ['iwr','Verify composed damage uses native IWR',()=>record('native-iwr',async()=>{
            const f=await setup('Bursting Bloom'),out=[];
            for(const immune of [false,true]){
                const recipient=await actor(`IWR ${immune}`);
                await recipient.update(immune?{'system.attributes.immunities':[{type:'piercing',exceptions:[]}]}:{'system.attributes.resistances':[{type:'piercing',value:3,exceptions:[],doubleVs:[]}]});
                const card=await cast(f,[recipient],['criticalFailure']),s=state(card);
                const base=CONFIG.Dice.rolls.find(r=>r.name==='DamageRoll').fromData(s.damage.rollJSON);
                const expected=immune?0:Math.max(0,base.instances.find(i=>!i.persistent).total*2-3);
                assert(500-recipient.hitPoints.value===expected&&confirmedDamageSummary(s).damage===expected,'Native IWR and receipt agree with typed initial damage');
                assert(recipient.items.some(i=>i.slug==='persistent-damage')&&recipient.hasCondition('encumbered'),'Independent bleed and condition survive piercing immunity/resistance');
                assert(s.targets[0].damageResults.length===1,'One native damage application per target');
                out.push({immune,cardId:card.id,damage:expected});
            }return out;
        })],
        ['prepare-combined','Prepare combined outcome for reload',()=>record('prepare-combined',async()=>{
            const f=await setup('Tempest Touch',{custom:true}),recipient=await actor('combined reload'),plan=await api.compile(f.spell);
            // Tests the normalized executor interface; does not claim new source grammar.
            plan.resolution.outcomes.failure.effects.push({kind:'condition',slug:'clumsy',name:'Clumsy',value:1,duration:{mode:'fixed',value:2,unit:'minutes',expiry:'turn-start'}});
            const {card}=await api.saves.start(f.spell,{sourceActor:f.caster,plan,targets:[await token(recipient)],castRank:1,dc:24,skipConfirmation:true});
            await finalize(card,['failure']);
            assert(recipient.hasCondition('clumsy')&&recipient.system.movement.speeds.land.value===15,'Condition and native Effect coexist with damage');
            assert(state(card).targets[0].effectUuids.length===2,'Both independent effect documents recorded');
            saved.cases.combined={actorId:recipient.id,cardId:card.id,hp:recipient.hitPoints.value};
            await f.spell.delete();await persist();return saved.cases.combined;
        })],
        ['verify-combined','Verify combined outcome after reload',()=>record('combined-reload',async()=>{
            const c=saved.cases.combined,recipient=game.actors.get(c.actorId),card=game.messages.get(c.cardId);
            await api.ongoing.reconcile();
            assert(recipient.hasCondition('clumsy')&&recipient.system.movement.speeds.land.value===15,'Reload and source deletion preserve both effects');
            const native=recipient.items.find(i=>i.getFlag(NS,'runtime')?.resolutionKind==='save');
            await native.update({'system.start.value':game.time.worldTime-60});await api.ongoing.reconcile({clockEvent:true});
            assert(recipient.system.movement.speeds.land.value===25&&recipient.hasCondition('clumsy'),'Only the native penalty expires');
            assert(recipient.hitPoints.value===c.hp&&state(card).status==='completed','No damage replay after reload/expiry');
            return {...c,speed:recipient.system.movement.speeds.land.value,clumsy:recipient.getCondition('clumsy')?.value};
        })],
        ['cleanup','Remove only composition test fixtures',()=>record('fixture-cleanup',async()=>{
            const actors=saved.actors.map(id=>game.actors.get(id)).filter(a=>a?.getFlag(NS,'phase2CompositionFixture'));
            const ids=new Set(actors.map(a=>a.id)),uuids=new Set(actors.map(a=>a.uuid));const records=api.ongoing.records().filter(r=>uuids.has(r.sourceActorUuid));
            for(const r of records)await game.journal.get(r.journalId)?.update({[`flags.${NS}.ongoingCast.status`]:'ended'});
            for(const scene of game.scenes){const tokens=scene.tokens.filter(t=>ids.has(t.actorId)).map(t=>t.id);if(tokens.length)await scene.deleteEmbeddedDocuments('Token',tokens);}
            if(ids.size)await Actor.deleteDocuments([...ids],{[NS]:{ongoingCleanup:true}});
            for(const r of records)await game.journal.get(r.journalId)?.delete();saved.actors=[];
            return {actorsRemoved:ids.size,journalsRemoved:records.length};
        })],
        ['report','Show composition evidence',()=>show(saved)]
    ];
    new foundry.applications.api.DialogV2({window:{title:'Phase 2 composition verification'},position:{width:820},content:'<p>Disposable pftest only. Native roll and operation verification.</p>',buttons:actions.map(([action,label,callback])=>({action,label,callback}))}).render(true);
}
