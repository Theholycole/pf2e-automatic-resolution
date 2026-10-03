import {composeInlinePersistentDamageRoll} from '../scripts/component-damage.js';
import {confirmedDamageSummary} from '../scripts/native-damage-receipt.js';
// Explicit disposable-world checks; spell names here select test fixtures only.
const NS = 'pf2e-automatic-resolution', KEY = 'phase23InlineVerification';
const assert = (value, message) => { if (!value) throw Error(message); };
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;');

export async function run(macro) {
    assert(game.world.id === 'pftest' && game.user.isGM, 'Disposable pftest GM only.');
    const api = game.modules.get(NS).api;
    const saved = macro.getFlag(NS, KEY) ?? {results: [], actors: [], cases: {}};
    const persist = () => macro.setFlag(NS, KEY, saved);
    const show = result => new foundry.applications.api.DialogV2({window: {title: 'Phase 2–3 inline family report'}, position: {width: 820},
        content: `<pre style="white-space:pre-wrap;max-height:65vh;overflow:auto">${escape(JSON.stringify(result, null, 2))}</pre>`,
        buttons: [{action: 'close', label: 'Close report'}]}).render(true);
    const record = async (label, fn) => {
        let result;
        try { result = {label, passed: true, at: new Date().toISOString(), details: await fn()}; }
        catch (error) { result = {label, passed: false, error: error.message, stack: error.stack}; }
        saved.results.push(result); await persist(); show(result);
    };
    const actor = async name => {
        const document = await Actor.create({name: `PFTEST P23 Inline ${name}`, type: 'npc', flags: {[NS]: {phase23InlineFixture: true}},
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
            source.name = 'Custom shared-rule spell'; source.system.slug = 'custom-shared-rule-spell';
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
    const nativeRoll=card=>CONFIG.Dice.rolls.find(r=>r.name==='DamageRoll').fromData(state(card).damage.rollJSON);
    const persistent=recipient=>recipient.items.filter(i=>i.slug==='persistent-damage');
    const ownEffects=card=>state(card).targets.flatMap(t=>t.effectUuids??[]).map(uuid=>fromUuidSync(uuid)).filter(Boolean);
    const effectFor=(card,slug)=>ownEffects(card).find(e=>e.getFlag(NS,'outcomeEffect')?.conditions.some(c=>c.slug===slug));
    const actions=[
        ['baseline','Record inline family baseline',()=>record('baseline',async()=>({foundry:game.version,pf2e:game.system.version,module:game.modules.get(NS).version,world:game.world.id,modules:[...game.modules.values()].filter(m=>m.active).map(m=>m.id),removal:game.pf2e.settings.automation.removeEffects}))],
        ['degrees','Verify inline family all save degrees',()=>record('all-degrees',async()=>{
            const out=[],degrees=['criticalSuccess','success','failure','criticalFailure'];
            for(const name of ['Grim Tendrils','Ulcerous Canker','Missed Cue']){
                const f=await setup(name),recipients=await Promise.all(degrees.map(d=>actor(`${name} ${d}`)));
                const card=await cast(f,recipients,degrees),s=state(card),base=nativeRoll(card);
                assert(s.status==='completed',`${name}: completed`);
                let total=0;
                for(const [index,degree] of degrees.entries()){
                    const recipient=recipients[index],factor=[0,0.5,1,2][index];
                    const expected=base.instances.filter(i=>!i.persistent).reduce((sum,i)=>sum+Math.floor(i.total*factor),0);
                    assert(500-recipient.hitPoints.value===expected,`${name}/${degree} exact initial damage`);total+=expected;
                    assert((s.targets[index].damageResults?.length??0)===(index?1:0),'One native damage application, no separate persistent HP workflow');
                    const bleed=persistent(recipient);
                    if(name==='Missed Cue'){
                        assert((recipient.getCondition('frightened')?.value??0)===index,'Frightened degree 0/1/2/3');
                        assert(recipient.hasCondition('slowed')===(index>=2),'Linked Slowed only on failures');
                    }else{
                        assert(bleed.length===(index>=2?1:0),'Persistent bleed on failed degrees only');
                        if(bleed.length)assert(bleed[0].system.persistent.expectedValue===(index===3?2:1),'Base persistent amount and critical multiplier');
                    }
                    out.push({name,degree,cardId:card.id,damage:expected,persistent:bleed.map(i=>i.system.persistent.formula),frightened:recipient.getCondition('frightened')?.value,slowed:recipient.getCondition('slowed')?.value});
                }
                assert(confirmedDamageSummary(s).damage===total,'Group receipt excludes future persistent ticks');
                const before=recipients.map(a=>({hp:a.hitPoints.value,ids:a.items.map(i=>i.id).sort().join(',')}));
                try{await api.saves.finalize(card);}catch{}
                assert(recipients.every((a,i)=>a.hitPoints.value===before[i].hp&&a.items.map(i=>i.id).sort().join(',')===before[i].ids),'Duplicate finalization changes nothing');
            }return out;
        })],
        ['ranks','Verify inline family every legal rank',()=>record('all-ranks',async()=>{
            const out=[];
            for(const name of ['Grim Tendrils','Ulcerous Canker','Missed Cue']){
                const f=await setup(name);
                for(let rank=f.spell.baseRank;rank<=10;rank++){
                    const recipient=await actor(`${name} rank${rank}`),card=await cast(f,[recipient],['criticalFailure'],rank),s=state(card),base=nativeRoll(card);
                    const dice=base.instances.filter(i=>!i.persistent).flatMap(i=>i.dice).reduce((n,d)=>n+d.number,0);
                    assert(dice===(name==='Ulcerous Canker'?2*Math.ceil(rank/2):2*rank),'Exact structured native dice heightening');
                    if(name!=='Missed Cue')assert(persistent(recipient)[0]?.system.persistent.expectedValue===2*(name==='Grim Tendrils'?rank:2*Math.ceil(rank/2)-1),'Exact inline persistent rank formula and multiplier');
                    else assert(recipient.getCondition('frightened')?.value===3&&recipient.getCondition('slowed')?.value===1,'Linked conditions do not heighten');
                    assert(confirmedDamageSummary(s).damage===500-recipient.hitPoints.value,'Exact confirmed initial HP total');
                    out.push({name,rank,cardId:card.id,formula:s.damage.formula,persistent:persistent(recipient).map(i=>i.system.persistent.formula)});
                }
            }return out;
        })],
        ['iwr','Verify inline damage IWR and living eligibility',()=>record('iwr-eligibility',async()=>{
            const out=[];
            for(const name of ['Grim Tendrils','Ulcerous Canker']){
                const f=await setup(name),recipient=await actor(`${name} resistant`),undead=await actor(`${name} undead`),construct=await actor(`${name} construct`);
                await recipient.update({'system.attributes.resistances':[{type:'void',value:3,exceptions:[],doubleVs:[]}]});
                await undead.update({'system.traits.value':['undead']});await construct.update({'system.traits.value':['construct']});
                const card=await cast(f,[recipient,undead,construct],['criticalFailure']),s=state(card),base=nativeRoll(card);
                const expected=base.instances.filter(i=>!i.persistent).reduce((sum,i)=>sum+Math.max(0,2*i.total-(i.type==='void'?3:0)),0);
                assert(500-recipient.hitPoints.value===expected&&confirmedDamageSummary(s).damage===expected,'One combined application respects typed IWR');
                assert(persistent(recipient).length===1,'Persistent contribution is retained separately from initial HP');
                assert(s.targets.slice(1).every(t=>t.eligible===false)&&undead.hitPoints.value===500&&construct.hitPoints.value===500,'Living predicate excludes undead and constructs');
                out.push({name,cardId:card.id,damage:expected});
            }return out;
        })],
        ['turns','Verify Frightened recovery and linked Slowed',()=>record('linked-turn-recovery',async()=>{
            const f=await setup('Missed Cue'),recipient=await actor('linked turn recovery'),rt=await token(recipient);
            const previous=game.combat?.id,combat=await Combat.create({scene:canvas.scene.id,active:false});
            try{
                await combat.activate();await combat.createEmbeddedDocuments('Combatant',[
                    {actorId:f.caster.id,tokenId:f.casterToken.id,sceneId:canvas.scene.id,initiative:20},
                    {actorId:recipient.id,tokenId:rt.id,sceneId:canvas.scene.id,initiative:10}
                ]);await combat.startCombat();
                const card=await cast(f,[recipient],['criticalFailure']),root=effectFor(card,'frightened'),linked=effectFor(card,'slowed');
                const hp=recipient.hitPoints.value;
                for(const expected of [2,1,0]){
                    await combat.nextTurn();await api.ongoing.reconcile({clockEvent:true});
                    assert(recipient.hasCondition('slowed'),'Slowed remains through the recipient turn');
                    await combat.nextTurn();await api.ongoing.reconcile({clockEvent:true});
                    assert((recipient.getCondition('frightened')?.value??0)===expected,`Frightened declines to ${expected}`);
                    assert(recipient.hasCondition('slowed')===(expected>0),'Only exact-root recovery ends Slowed');
                }
                assert(!fromUuidSync(root.uuid)&&!fromUuidSync(linked.uuid),'Both owned contributions finish');
                assert(recipient.hitPoints.value===hp,'Turn recovery never replays initial damage');
                return {cardId:card.id,hp,root:root.uuid,linked:linked.uuid};
            }finally{await combat.delete();if(previous)await game.combats.get(previous)?.activate();}
        })],
        ['prepare-reload','Prepare repeated custom casts for reload',()=>record('prepare-linked-reload',async()=>{
            const f=await setup('Missed Cue',{custom:true}),recipient=await actor('repeated custom casts');
            const first=await cast(f,[recipient],['criticalFailure']),second=await cast(f,[recipient],['failure']);
            const unrelated=[];
            for(const [slug,value] of [['frightened',5],['slowed',3]]){
                const source=game.pf2e.ConditionManager.getCondition(slug).toObject();delete source._id;source.system.value.value=value;
                unrelated.push((await recipient.createEmbeddedDocuments('Item',[source]))[0].id);
            }
            saved.cases.reload={actorId:recipient.id,cardIds:[first.id,second.id],roots:[effectFor(first,'frightened').uuid,effectFor(second,'frightened').uuid],linked:[effectFor(first,'slowed').uuid,effectFor(second,'slowed').uuid],unrelated,hp:recipient.hitPoints.value};
            await f.spell.delete();await persist();return saved.cases.reload;
        })],
        ['reload','Verify exact linked ownership after reload',()=>record('linked-reload',async()=>{
            const c=saved.cases.reload,recipient=game.actors.get(c.actorId);await api.ongoing.reconcile();
            assert([...c.roots,...c.linked].every(uuid=>fromUuidSync(uuid)),'All owned contributions survive reload and source deletion');
            await fromUuidSync(c.roots[0]).delete();await api.ongoing.reconcile();
            assert(!fromUuidSync(c.linked[0])&&fromUuidSync(c.roots[1])&&fromUuidSync(c.linked[1]),'Only first cast dependent ends when first root ends');
            await fromUuidSync(c.roots[1]).delete();await api.ongoing.reconcile();
            assert(!fromUuidSync(c.linked[1]),'Second cast clears its own dependent');
            assert(c.unrelated.every(id=>recipient.items.has(id))&&recipient.getCondition('frightened')?.value===5&&recipient.getCondition('slowed')?.value===3,'Stronger unrelated contributions preserved');
            assert(recipient.hitPoints.value===c.hp,'No replay after reload or recovery');return c;
        })],
        ['preflight','Verify combined-roll preflight before any HP',()=>record('combined-preflight',async()=>{
            const f=await setup('Grim Tendrils'),recipients=[await actor('preflight first'),await actor('preflight second')];
            const {card}=await api.saves.start(f.spell,{sourceActor:f.caster,plan:await api.compile(f.spell),targets:await Promise.all(recipients.map(token)),castRank:1,dc:24,skipConfirmation:true});
            for(const [i,t]of state(card).targets.entries()){
                await api.saves.rollSave(card,t.id,{skipDialog:true});await api.saves.correctTarget(card,t.id,{action:'degree',degree:i?'criticalFailure':'failure'});
            }
            await api.saves.rollDamage(card,{postMessage:false});
            const changed=foundry.utils.deepClone(state(card));
            // Seed evaluated native rolls for this deliberately corrupted-state test.
            // Outcome rolling is internal to finalize, not exposed on the public API.
            for(const entry of changed.damage.outcomeRolls){
                const roll=new (CONFIG.Dice.rolls.find(r=>r.name==='DamageRoll'))(entry.formula,f.spell.getRollData({castRank:1}));
                await roll.evaluate();entry.rollJSON=roll.toJSON();entry.total=roll.total;
                entry.rollOptions=[...changed.damage.rollOptions];
            }
            const bad=new (CONFIG.Dice.rolls.find(r=>r.name==='DamageRoll'))('1[fire]');await bad.evaluate();
            const criticalRollId=changed.outcomes.criticalFailure.damage.formulas[0].rollId;
            changed.damage.outcomeRolls.find(r=>r.id===criticalRollId).rollJSON=bad.toJSON();
            await card.setFlag(NS,'basicSaveState',changed);
            let rejected=false,error;try{await api.saves.finalize(card);}catch(caught){rejected=true;error=caught.message;}
            assert(error==='The native inline bleed instance is missing or ambiguous.','Failure must come from the deliberately malformed bleed instance');
            assert(rejected&&recipients.every(a=>a.hitPoints.value===500&&persistent(a).length===0),'Second target malformed roll stops first target HP/persistent writes');
            assert(state(card).status==='collecting','Failed preflight returns to collection');
            return {cardId:card.id,rejected,error,hp:recipients.map(a=>a.hitPoints.value),status:state(card).status};
        })],
        ['serialization','Verify native combined-roll serialization',()=>record('native-serialization',async()=>{
            const DamageRoll=CONFIG.Dice.rolls.find(r=>r.name==='DamageRoll'),out=[];
            for(const [formula,types] of [['2d4[void]',['void']],['{1d4[void],1d4[poison]}',['void','poison']],['0[void]',['void']]]){
                for(const multiplier of [1,2]){
                    const direct=new DamageRoll(formula),bleed=new DamageRoll(multiplier===1?'3[persistent,bleed]':'(2*((3)))[persistent,bleed]');
                    await direct.evaluate();await bleed.evaluate();
                    const components=types.map(type=>({id:type,type,category:null,kinds:['damage']}));
                    const combined=composeInlinePersistentDamageRoll(direct,bleed,components,{multiplier,sourceComponentIds:types});
                    const data=combined.toJSON();
                    assert(DamageRoll.validate(data.formula),'Serialized formula parses as a native DamageRoll');
                    const parsed=new DamageRoll(data.formula),restored=DamageRoll.fromData(data);
                    assert(JSON.stringify(parsed.instances.map(i=>[i.type,i.persistent]))===JSON.stringify(combined.instances.map(i=>[i.type,i.persistent])),`Raw formula classification: ${JSON.stringify({formula:data.formula,parsed:parsed.instances.map(i=>[i.type,i.persistent]),combined:combined.instances.map(i=>[i.type,i.persistent])})}`);
                    assert(parsed.instances.at(-1).expectedValue===3*multiplier,'Fresh parse retains the exact persistent amount');
                    assert(restored.total===combined.total&&JSON.stringify(restored.options)===JSON.stringify(combined.options),'Reload retains evaluated total and native options');
                    assert(combined.total===(multiplier===1?direct.total:direct.alter(multiplier,0).total),'Minimum and scaling remain native');
                    out.push({source:formula,multiplier,serialized:data.formula,total:restored.total});
                }
            }return out;
        })],
        ['cleanup','Remove only composition test fixtures',()=>record('fixture-cleanup',async()=>{
            const actors=saved.actors.map(id=>game.actors.get(id)).filter(a=>a?.getFlag(NS,'phase23InlineFixture'));
            const ids=new Set(actors.map(a=>a.id)),uuids=new Set(actors.map(a=>a.uuid));const records=api.ongoing.records().filter(r=>uuids.has(r.sourceActorUuid));
            for(const r of records)await game.journal.get(r.journalId)?.update({[`flags.${NS}.ongoingCast.status`]:'ended'});
            for(const scene of game.scenes){const tokens=scene.tokens.filter(t=>ids.has(t.actorId)).map(t=>t.id);if(tokens.length)await scene.deleteEmbeddedDocuments('Token',tokens);}
            if(ids.size)await Actor.deleteDocuments([...ids],{[NS]:{ongoingCleanup:true}});
            for(const r of records)await game.journal.get(r.journalId)?.delete();saved.actors=[];
            return {actorsRemoved:ids.size,journalsRemoved:records.length};
        })],
        ['report','Show inline family evidence',()=>show(saved)]
    ];
    new foundry.applications.api.DialogV2({window:{title:'Phase 2–3 inline family verification'},position:{width:820},content:'<p>Disposable pftest only. Shared inline damage and linked-condition verification.</p>',buttons:actions.map(([action,label,callback])=>({action,label,callback}))}).render(true);
}
