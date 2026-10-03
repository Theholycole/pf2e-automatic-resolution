import {confirmedDamageSummary} from '../scripts/native-damage-receipt.js';
// Explicit disposable-world checks; spell names here select test fixtures only.
const NS = 'pf2e-automatic-resolution', KEY = 'phase23SpeedVerification';
const assert = (value, message) => { if (!value) throw Error(message); };
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;');

export async function run(macro) {
    assert(game.world.id === 'pftest' && game.user.isGM, 'Disposable pftest GM only.');
    const api = game.modules.get(NS).api;
    const saved = macro.getFlag(NS, KEY) ?? {results: [], actors: [], cases: {}};
    const persist = () => macro.setFlag(NS, KEY, saved);
    const show = result => new foundry.applications.api.DialogV2({window: {title: 'Phase 2–3 Speed family report'}, position: {width: 820},
        content: `<pre style="white-space:pre-wrap;max-height:65vh;overflow:auto">${escape(JSON.stringify(result, null, 2))}</pre>`,
        buttons: [{action: 'close', label: 'Close report'}]}).render(true);
    const record = async (label, fn) => {
        let result;
        try { result = {label, passed: true, at: new Date().toISOString(), details: await fn()}; }
        catch (error) { result = {label, passed: false, error: error.message, stack: error.stack}; }
        saved.results.push(result); await persist(); show(result);
    };
    const actor = async name => {
        const document = await Actor.create({name: `PFTEST P23 Speed ${name}`, type: 'npc', flags: {[NS]: {phase23SpeedFixture: true}},
            system: {details: {level: {value: 5}}, attributes: {hp: {value: 500, max: 500}, ac: {value: 20}},
                movement: {speeds: {land: {value: 25}}}, saves: {fortitude: {value: 10}, reflex: {value: 10}, will: {value: 10}}, traits: {value: ['humanoid']}}});
        saved.actors.push(document.id); await persist(); return document;
    };
    const token = async actor => {
        assert(canvas.scene, 'An active disposable test scene is required.');
        return (await canvas.scene.createEmbeddedDocuments('Token', [{...actor.prototypeToken.toObject(), actorId: actor.id, actorLink: true, x: 1100, y: 1100}]))[0];
    };
    // PF2e auto-heightens NPC spells to the caster's maximum rank (and clamps
    // loadVariant to it), so rank checks need a level 2r-1 caster.
    const setup = async (name, {custom = false, rank = null} = {}) => {
        const caster = await actor(`${name} caster`), casterToken = await token(caster);
        if (rank) await caster.update({'system.details.level.value': rank * 2 - 1});
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
    const heightenedDice=(spell,rank)=>{
        const component=Object.values(spell._source.system.damage??{})[0];if(!component)return null;
        const base=Number(/^(\d+)d/.exec(component.formula)[1]);
        const h=spell._source.system.heightening,step=Number(/^(\d+)d/.exec(Object.values(h?.damage??{})[0]??'0d0')[1]);
        return base+step*Math.floor((rank-spell.baseRank)/(h?.interval??1));
    };
    const names=['Chilling Spray','Magical Fetters','Tempest Touch'];
    const degrees=['criticalSuccess','success','failure','criticalFailure'];
    const expectedPenalty=(name,degree)=>({
        'Chilling Spray':[0,0,-5,-10], 'Magical Fetters':[0,-10,-10,-10], 'Tempest Touch':[0,-5,-10,-10]
    })[name][degrees.indexOf(degree)];
    const verify=(name,degree,recipient,card,index=0)=>{
        const s=state(card),penalty=expectedPenalty(name,degree);
        assert(s.status==='completed',`${name}: completed, got ${s.status}`);
        assert(recipient.system.movement.speeds.land.value===25+penalty,`${name}/${degree}: exact prepared Speed`);
        const clumsy=name==='Magical Fetters'?({criticalSuccess:0,success:1,failure:3,criticalFailure:3}[degree]):0;
        assert((recipient.getCondition('clumsy')?.value??0)===clumsy,`${name}/${degree}: Clumsy`);
        assert(recipient.hasCondition('slowed')===(name==='Magical Fetters'&&degree==='criticalFailure'),`${name}/${degree}: Slowed`);
        let expected=0;
        if(s.damage?.rollJSON&&degree!=='criticalSuccess'){
            const base=CONFIG.Dice.rolls.find(r=>r.name==='DamageRoll').fromData(s.damage.rollJSON);
            const multiplier={success:0.5,failure:1,criticalFailure:2}[degree];
            expected=multiplier===1?base.total:base.alter(multiplier,0).total;
        }
        assert(500-recipient.hitPoints.value===expected,`${name}/${degree}: native damage exactly once`);
        const effects=(s.targets[index].effectUuids??[]).map(uuid=>fromUuidSync(uuid)).filter(Boolean);
        if(penalty)assert(effects.some(e=>e.system.rules.some(r=>r.key==='FlatModifier')),'Owned modifier exists');
        if(name==='Magical Fetters'&&degree==='criticalFailure')assert(effects.every(e=>e.system.duration.value===1&&e.system.duration.unit==='minutes'),'Inherited Slowed, Clumsy and modifier all last one minute');
        return {name,degree,rank:s.castRank,cardId:card.id,damage:expected,speed:recipient.system.movement.speeds.land.value,clumsy,slowed:recipient.getCondition('slowed')?.value??0,effects:effects.map(e=>({uuid:e.uuid,duration:e.system.duration,rules:e.system.rules.map(r=>r.key)}))};
    };
    const actions=[
        ['environment','Record Speed test environment',()=>record('environment',async()=>({foundry:game.version,pf2e:game.system.version,module:game.modules.get(NS).version,world:game.world.id,modules:[...game.modules.values()].filter(m=>m.active).map(m=>m.id),removal:game.pf2e.settings.automation.removeEffects}))],
        ['degrees','Verify Speed family all degrees',()=>record('all-degrees',async()=>{
            const out=[];
            for(const name of names){
                const f=await setup(name),recipients=await Promise.all(degrees.map(d=>actor(`${name} ${d}`))),card=await cast(f,recipients,degrees);
                for(const [i,d]of degrees.entries())out.push(verify(name,d,recipients[i],card,i));
                assert(confirmedDamageSummary(state(card)).damage===recipients.reduce((n,a)=>n+500-a.hitPoints.value,0),'Group damage receipt exact');
                const before=recipients.map(a=>({hp:a.hitPoints.value,ids:a.items.map(i=>i.id).sort().join(',')}));
                try{await api.saves.finalize(card);}catch{}
                assert(recipients.every((a,i)=>a.hitPoints.value===before[i].hp&&a.items.map(j=>j.id).sort().join(',')===before[i].ids),'Duplicate finalize leaves HP and Effects unchanged');
            }return out;
        })],
        ['ranks','Verify Speed family every legal rank',()=>record('all-ranks',async()=>{
            const out=[];
            for(const name of names){const base=(await setup(name)).spell.baseRank;for(let rank=base;rank<=10;rank++){
                const f=await setup(name,{rank}),recipient=await actor(`${name} rank ${rank}`),card=await cast(f,[recipient],['criticalFailure'],rank);
                const formula=state(card).damage.formula,expected=heightenedDice(f.spell,rank);
                assert((f.spell.loadVariant({castRank:rank})??f.spell).rank===rank,`${name}: PF2e resolves rank ${rank}`);
                if(expected!=null)assert(Number(/^(\d+)d/.exec(formula)?.[1])===expected,`${name} rank ${rank}: ${expected} dice, got ${formula}`);
                out.push({...verify(name,'criticalFailure',recipient,card),formula});
            }}return out;
        })],
        ['iwr','Verify Speed survives cold damage immunity',()=>record('native-iwr',async()=>{
            const f=await setup('Chilling Spray'),out=[];
            for(const immune of [false,true]){
                const recipient=await actor(`cold IWR ${immune}`);
                await recipient.update(immune?{'system.attributes.immunities':[{type:'cold',exceptions:[]}]}:{'system.attributes.resistances':[{type:'cold',value:3,exceptions:[],doubleVs:[]}]});
                const card=await cast(f,[recipient],['criticalFailure']),s=state(card);
                const base=CONFIG.Dice.rolls.find(r=>r.name==='DamageRoll').fromData(s.damage.rollJSON),expected=immune?0:Math.max(0,base.alter(2,0).total-3);
                assert(500-recipient.hitPoints.value===expected&&confirmedDamageSummary(s).damage===expected,'Native cold IWR and receipt agree');
                assert(recipient.system.movement.speeds.land.value===15,'Speed rider independent of damage resistance or immunity');
                out.push({immune,damage:expected,speed:recipient.system.movement.speeds.land.value,cardId:card.id});
            }return out;
        })],
        ['timers','Verify independent condition and Speed expiry',()=>record('independent-expiry',async()=>{
            assert(!game.combat?.started,'No campaign combat during world-time fixture checks');
            const out=[];
            for(const [name,degree,seconds]of [['Chilling Spray','failure',12],['Magical Fetters','success',6],['Magical Fetters','criticalFailure',60]]){
                const f=await setup(name,{custom:true}),recipient=await actor(`${name} timer ${degree}`),card=await cast(f,[recipient],[degree]);
                verify(name,degree,recipient,card);const hp=recipient.hitPoints.value;
                await f.spell.delete();await game.time.advance(seconds-1);await api.ongoing.reconcile({clockEvent:true});
                assert(recipient.system.movement.speeds.land.value===25+expectedPenalty(name,degree),'Source deletion and pre-expiry retain penalty');
                if(name==='Magical Fetters')assert(recipient.hasCondition('clumsy')&&recipient.hasCondition('slowed')===(degree==='criticalFailure'),'Conditions retain independent timer');
                await game.time.advance(2);await api.ongoing.reconcile({clockEvent:true});
                assert(recipient.system.movement.speeds.land.value===25&&!recipient.hasCondition('clumsy')&&!recipient.hasCondition('slowed'),'All owned contributions expire');
                assert(recipient.hitPoints.value===hp,'Expiry never replays damage');out.push({name,degree,seconds,cardId:card.id,hp});
            }return out;
        })],
        ['boundaries','Verify generated Speed turn anchors',()=>record('turn-anchors',async()=>{
            const out=[];
            for(const sourceLater of [false,true])for(const who of ['your','its'])for(const boundary of ['start','end']){
                const f=await setup('Chilling Spray',{custom:true}),recipient=await actor(`anchor ${sourceLater} ${who} ${boundary}`),rt=await token(recipient);
                await f.spell.update({'system.description.value':f.spell.system.description.value.replaceAll('for 2 rounds',`until the ${boundary} of ${who} next turn`)});
                const previous=game.combat?.id,combat=await Combat.create({scene:canvas.scene.id,active:false});
                try{
                    await combat.activate();await combat.createEmbeddedDocuments('Combatant',[
                        {actorId:f.caster.id,tokenId:f.casterToken.id,sceneId:canvas.scene.id,initiative:sourceLater?10:20},
                        {actorId:recipient.id,tokenId:rt.id,sceneId:canvas.scene.id,initiative:sourceLater?20:10}
                    ]);await combat.startCombat();
                    const card=await cast(f,[recipient],['failure']),hp=recipient.hitPoints.value;
                    const anchor=who==='your'?f.caster:recipient,index=combat.turns.findIndex(c=>c.actorId===anchor.id);
                    const endStep=(index===0?2:1)+(boundary==='end'?1:0);
                    await f.spell.delete();
                    for(let step=1;step<=endStep;step++){
                        await combat.nextTurn();await api.ongoing.reconcile({clockEvent:true});
                        assert(recipient.system.movement.speeds.land.value===(step<endStep?20:25),`Exact ${who} ${boundary} boundary step ${step}/${endStep}`);
                    }
                    assert(recipient.hitPoints.value===hp,'Boundary expiry never repeats damage');out.push({sourceLater,who,boundary,endStep,cardId:card.id,hp});
                }finally{await combat.delete();if(previous)await game.combats.get(previous)?.activate();}
            }return out;
        })],
        ['independent-inheritance','Verify custom inherited and added lifetimes',()=>record('custom-inherited-lifetimes',async()=>{
            assert(!game.combat?.started,'No combat for world-time check');
            const f=await setup('Magical Fetters',{custom:true}),recipient=await actor('custom distinct inherited timer');
            await f.spell.update({'system.description.value':f.spell.system.description.value.replace('for the duration.','for 2 rounds.')});
            const card=await cast(f,[recipient],['criticalFailure']),s=state(card),hp=recipient.hitPoints.value;
            assert(s.status==='completed'&&recipient.system.movement.speeds.land.value===15&&recipient.getCondition('clumsy')?.value===3&&recipient.getCondition('slowed')?.value===1,'All inherited and added consequences apply');
            await f.spell.delete();await game.time.advance(13);await api.ongoing.reconcile({clockEvent:true});
            assert(!recipient.hasCondition('slowed')&&recipient.getCondition('clumsy')?.value===3&&recipient.system.movement.speeds.land.value===15,'Added two-round condition expires while inherited minute remains');
            await game.time.advance(48);await api.ongoing.reconcile({clockEvent:true});
            assert(!recipient.hasCondition('clumsy')&&recipient.system.movement.speeds.land.value===25,'Inherited contributions expire independently');
            assert(recipient.hitPoints.value===hp,'Independent expiration never repeats damage');return {cardId:card.id,hp,slowedSeconds:12,inheritedSeconds:60};
        })],
        ['preflight','Verify modifier preflight before any HP',()=>record('modifier-preflight',async()=>{
            const f=await setup('Chilling Spray'),recipients=[await actor('preflight first'),await actor('preflight second')];
            const {card}=await api.saves.start(f.spell,{sourceActor:f.caster,plan:await api.compile(f.spell),targets:await Promise.all(recipients.map(token)),castRank:1,dc:24,skipConfirmation:true});
            for(const [i,t]of state(card).targets.entries()){
                await api.saves.rollSave(card,t.id,{skipDialog:true});await api.saves.correctTarget(card,t.id,{action:'degree',degree:i?'criticalFailure':'failure'});
            }
            const snapshot=foundry.utils.deepClone(state(card));
            snapshot.outcomes.criticalFailure.modifiers[0].value=-99;
            await card.setFlag(NS,'basicSaveState',snapshot);
            let rejected=false,error;try{await api.saves.finalize(card);}catch(caught){rejected=true;error=caught.message;}
            assert(rejected&&recipients.every(a=>a.hitPoints.value===500&&a.system.movement.speeds.land.value===25),'Malformed second target blocks all HP and modifier writes');
            return {cardId:card.id,rejected,error,hp:recipients.map(a=>a.hitPoints.value),status:state(card).status};
        })],
        ['prepare-reload','Prepare custom repeated Speed casts for reload',()=>record('prepare-reload',async()=>{
            const f=await setup('Magical Fetters',{custom:true}),recipient=await actor('custom repeated Speed');
            const first=await cast(f,[recipient],['criticalFailure']),second=await cast(f,[recipient],['failure']);
            const [unrelated]=await recipient.createEmbeddedDocuments('Item',[{name:'PFTEST unrelated stronger Speed penalty',type:'effect',system:{duration:{value:-1,unit:'unlimited',expiry:null,sustained:false},rules:[{key:'FlatModifier',selector:'all-speeds',type:'status',value:-15}]}}]);
            assert(recipient.system.movement.speeds.land.value===10,'Native typed penalty stacking chooses strongest');
            saved.cases.reload={actorId:recipient.id,cardIds:[first.id,second.id],effects:[state(first).targets[0].effectUuids,state(second).targets[0].effectUuids],unrelatedId:unrelated.id,hp:recipient.hitPoints.value};
            await f.spell.delete();await persist();return saved.cases.reload;
        })],
        ['reload','Verify Speed ownership after reload',()=>record('reload-ownership',async()=>{
            const c=saved.cases.reload,recipient=game.actors.get(c.actorId);await api.ongoing.reconcile();
            assert(c.effects.flat().every(uuid=>fromUuidSync(uuid)),'Owned Effects survive reload and source deletion');
            assert(recipient.system.movement.speeds.land.value===10,'Unrelated stronger penalty remains effective');
            for(const uuid of c.effects[0])await fromUuidSync(uuid)?.delete();await api.ongoing.reconcile();
            assert(c.effects[1].every(uuid=>fromUuidSync(uuid)),'Ending first cast preserves second cast');
            assert(recipient.hasCondition('clumsy')&&!recipient.hasCondition('slowed'),'Only first cast Slowed removed');
            for(const uuid of c.effects[1])await fromUuidSync(uuid)?.delete();await api.ongoing.reconcile();
            assert(recipient.items.has(c.unrelatedId)&&recipient.system.movement.speeds.land.value===10&&!recipient.hasCondition('clumsy'),'Unrelated contribution survives both cast cleanups');
            assert(recipient.hitPoints.value===c.hp,'No damage replay after reload');return c;
        })],
        ['cleanup','Remove only Speed test fixtures',()=>record('fixture-cleanup',async()=>{
            const actors=saved.actors.map(id=>game.actors.get(id)).filter(a=>a?.getFlag(NS,'phase23SpeedFixture'));
            const ids=new Set(actors.map(a=>a.id)),uuids=new Set(actors.map(a=>a.uuid)),records=api.ongoing.records().filter(r=>uuids.has(r.sourceActorUuid));
            for(const r of records)await game.journal.get(r.journalId)?.update({[`flags.${NS}.ongoingCast.status`]:'ended'});
            for(const scene of game.scenes){const tokens=scene.tokens.filter(t=>ids.has(t.actorId)).map(t=>t.id);if(tokens.length)await scene.deleteEmbeddedDocuments('Token',tokens);}
            if(ids.size)await Actor.deleteDocuments([...ids],{[NS]:{ongoingCleanup:true}});
            for(const r of records)await game.journal.get(r.journalId)?.delete();saved.actors=[];
            assert(!game.actors.some(a=>a.getFlag(NS,'phase23SpeedFixture')),'No Speed fixture actors remain');
            return {actorsRemoved:ids.size,journalsRemoved:records.length,remainingFixtureActors:0};
        })],
        ['report','Show Speed family evidence',()=>show(saved)]
    ];
    new foundry.applications.api.DialogV2({window:{title:'Phase 2–3 Speed family verification'},position:{width:820},content:'<p>Disposable pftest only. Damage, Speed modifiers, conditions, inheritance, stacking and independent expiry.</p>',buttons:actions.map(([action,label,callback])=>({action,label,callback}))}).render(true);
}
