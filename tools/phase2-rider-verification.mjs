// Explicit disposable-world checks; spell names here select test fixtures only.
const NS = 'pf2e-automatic-resolution', KEY = 'phase2RiderVerification';
const assert = (value, message) => { if (!value) throw Error(message); };
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;');

export async function run(macro) {
    assert(game.world.id === 'pftest' && game.user.isGM, 'Disposable pftest GM only.');
    const api = game.modules.get(NS).api;
    const saved = macro.getFlag(NS, KEY) ?? {results: [], actors: [], cases: {}};
    const persist = () => macro.setFlag(NS, KEY, saved);
    const show = result => new foundry.applications.api.DialogV2({window: {title: 'Phase 2 rider family report'}, position: {width: 820},
        content: `<pre style="white-space:pre-wrap;max-height:65vh;overflow:auto">${escape(JSON.stringify(result, null, 2))}</pre>`,
        buttons: [{action: 'close', label: 'Close report'}]}).render(true);
    const record = async (label, fn) => {
        let result;
        try { result = {label, passed: true, at: new Date().toISOString(), details: await fn()}; }
        catch (error) { result = {label, passed: false, error: error.message, stack: error.stack}; }
        saved.results.push(result); await persist(); show(result);
    };
    const actor = async name => {
        const document = await Actor.create({name: `PFTEST P2 Rider ${name}`, type: 'npc', flags: {[NS]: {phase2RiderFixture: true}},
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
            source.name = 'Custom unsteady pulse'; source.system.slug = 'custom-unsteady-pulse';
            delete source._stats.compendiumSource;
            source.system.description.value = source.system.description.value.replace('Clumsy 2', 'Clumsy 3').replace('for 1 round', 'for 2 rounds');
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
    const setVitality = async (recipient, mode) => {
        const existing=recipient.items.filter(item=>item.getFlag(NS,'voidHealingFixture'));
        if(existing.length)await recipient.deleteEmbeddedDocuments('Item',existing.map(item=>item.id));
        await recipient.update({'system.traits.value': mode === 'undead' ? ['undead'] : mode === 'construct' ? ['construct'] : ['humanoid']});
        if(mode==='void-healing')await recipient.createEmbeddedDocuments('Item',[{name:'PFTEST native void-healing rule',type:'effect',flags:{[NS]:{voidHealingFixture:true}},
            system:{duration:{value:-1,unit:'unlimited',expiry:null},rules:[{key:'ActiveEffectLike',mode:'override',path:'system.attributes.hp.negativeHealing',value:true}]}}]);
        assert(recipient.hitPoints.negativeHealing===['undead','void-healing'].includes(mode),'Native prepared void-healing state matches fixture');
        return recipient;
    };
    const actions = [
        ['baseline','Record rider-family baseline',()=>record('baseline',async()=>({foundry:game.version,pf2e:game.system.version,world:game.world.id,
            activeModules:[...game.modules.values()].filter(m=>m.active).map(m=>m.id),removal:game.settings.get('pf2e','automation.removeExpiredEffects'),effectiveRemoval:game.pf2e.settings.automation.removeEffects}))],
        ['outcomes','Verify rider family all degrees and duplicate prevention',()=>record('all-degrees',async()=>{
            const out=[];
            for (const [name,slug,value,formula] of [['Tempest Surge','clumsy',2,'3d12'],['Updraft','prone',null,'6d6'],['Vitality Lash','enfeebled',1,'4d6']]) {
                const fixture=await setup(name);
                for (const degree of ['criticalSuccess','success','failure','criticalFailure']) {
                    const recipient=await actor(`${name} ${degree}`);
                    if(name==='Vitality Lash') await setVitality(recipient,'undead');
                    const card=await cast(fixture,[recipient],[degree],3),state=card.getFlag(NS,'basicSaveState');
                    const expected=name==='Vitality Lash'?degree==='criticalFailure':['failure','criticalFailure'].includes(degree);
                    assert(recipient.hasCondition(slug)===expected,`${name}: ${degree} condition branch`);
                    if(expected&&value!=null) assert(recipient.getCondition(slug).value===value,'Exact native condition value');
                    if(degree!=='criticalSuccess') {
                        assert(state.damage.formula.startsWith(formula),`${name}: rank 3 formula`);
                        assert(500-recipient.hitPoints.value===Math.floor(state.damage.total*({success:.5,failure:1,criticalFailure:2}[degree])),'Exact native degree damage');
                    } else assert(recipient.hitPoints.value===500,'Critical success preserves HP');
                    const hp=recipient.hitPoints.value,count=recipient.items.size;
                    try { await api.saves.finalize(card); } catch (_) {}
                    assert(recipient.hitPoints.value===hp&&recipient.items.size===count,'Duplicate finalize does not repeat damage or effects');
                    out.push({name,degree,cardId:card.id,castId:state.castId,formula:state.damage.formula,damage:500-hp,condition:expected});
                }
            }
            return out;
        })],
        ['eligibility','Verify vitality target predicates and late changes',()=>record('target-predicates',async()=>{
            const fixture=await setup('Vitality Lash'),out=[];
            for(const mode of ['living','construct','undead','void-healing']) {
                const recipient=await setVitality(await actor(`eligibility ${mode}`),mode);
                const card=await cast(fixture,[recipient],['criticalFailure'],3),state=card.getFlag(NS,'basicSaveState');
                const expected=['undead','void-healing'].includes(mode);
                assert(state.targets[0].eligible===expected,`${mode}: compiled eligibility`);
                assert(recipient.hasCondition('enfeebled')===expected,`${mode}: rider application`);
                assert((recipient.hitPoints.value<500)===expected,`${mode}: vitality native damage`);
                out.push({mode,cardId:card.id,eligible:state.targets[0].eligible,negativeHealing:recipient.system.attributes.hp.negativeHealing,traits:[...recipient.traits]});
            }
            const recipient=await setVitality(await actor('late eligibility'),'void-healing'),target=await token(recipient);
            await fixture.caster.update({'system.details.level.value':5});
            const {card}=await api.saves.start(fixture.spell,{sourceActor:fixture.caster,plan:await api.compile(fixture.spell),targets:[target],castRank:3,dc:24,skipConfirmation:true});
            const id=card.getFlag(NS,'basicSaveState').targets[0].id;
            await api.saves.rollSave(card,id,{skipDialog:true});await api.saves.correctTarget(card,id,{action:'degree',degree:'criticalFailure'});
            await setVitality(recipient,'living');
            await api.saves.finalize(card);
            assert(recipient.hitPoints.value===500&&!recipient.hasCondition('enfeebled'),'Finalization rechecks changed eligibility');
            out.push({lateChange:true,cardId:card.id}); return out;
        })],
        ['ranks','Verify rider family every legal rank',()=>record('legal-ranks',async()=>{
            const out=[];
            for(const [name,slug,value,formula] of [['Tempest Surge','clumsy',2,r=>`${r}d12`],['Updraft','prone',null,r=>`${2*r}d6`],['Vitality Lash','enfeebled',1,r=>`${r+1}d6`]]) {
                const fixture=await setup(name);
                for(let rank=1;rank<=10;rank++) {
                    const recipient=await actor(`${name} rank ${rank}`);if(name==='Vitality Lash')await setVitality(recipient,'undead');
                    const card=await cast(fixture,[recipient],['criticalFailure'],rank),state=card.getFlag(NS,'basicSaveState');
                    assert(state.castRank===rank&&state.damage.formula.startsWith(formula(rank)),`${name}: native rank ${rank} formula`);
                    assert(recipient.hasCondition(slug),'Condition at every legal rank');
                    if(value!=null)assert(recipient.getCondition(slug).value===value,'Condition value does not accidentally heighten');
                    out.push({name,rank,cardId:card.id,formula:state.damage.formula});
                }
            }
            return out;
        })],
        ['custom','Prepare custom condition, overlap and reload test',()=>record('custom-and-overlap',async()=>{
            const fixture=await setup('Tempest Surge',{custom:true}),recipient=await actor('custom recipient');
            const source=game.pf2e.ConditionManager.getCondition('clumsy').toObject();delete source._id;source.system.value.value=4;
            const [unrelated]=await recipient.createEmbeddedDocuments('Item',[source]);
            const card=await cast(fixture,[recipient],['failure'],2),state=card.getFlag(NS,'basicSaveState');
            const effect=await fromUuid(state.targets[0].effectUuids[0]);
            assert(effect.system.duration.value===2&&effect.system.duration.unit==='rounds','Custom duration interpreted');
            const owned=effect.flags.pf2e.itemGrants;const condition=Object.values(owned).map(g=>recipient.items.get(g.id)).find(c=>c?.slug==='clumsy');
            assert(condition?.value===3&&recipient.getCondition('clumsy').value===4,'Custom value and unrelated stronger condition coexist');
            saved.cases.reload={actorUuid:recipient.uuid,effectUuid:effect.uuid,unrelatedId:unrelated.id,conditionId:condition.id,cardId:card.id,hp:recipient.hitPoints.value};
            await fixture.spell.delete(); return saved.cases.reload;
        })],
        ['reload','Verify custom cast after reload and selective cleanup',()=>record('reload-and-cleanup',async()=>{
            const entry=saved.cases.reload;assert(entry,'Prepare custom case first.');await api.ongoing.reconcile({recover:true});
            const recipient=await fromUuid(entry.actorUuid),effect=await fromUuid(entry.effectUuid);
            assert(effect&&recipient.items.get(entry.conditionId)?.value===3,'Custom contribution survives source deletion and reload');
            await effect.delete();await api.ongoing.reconcile();
            assert(!recipient.items.has(entry.conditionId)&&recipient.items.has(entry.unrelatedId),'Own native contribution removed, unrelated preserved');
            assert(recipient.hitPoints.value===entry.hp,'No damage replay');return entry;
        })],
        ['expiry','Verify failure rider turn expiry and condition immunity',()=>record('expiry-and-immunity',async()=>{
            const fixture=await setup('Tempest Surge'),recipient=await actor('timed failure rider'),recipientToken=await token(recipient);
            const previous=game.combat?.id,combat=await Combat.create({scene:canvas.scene.id,active:false});
            try {
                await combat.activate();await combat.createEmbeddedDocuments('Combatant',[{actorId:fixture.caster.id,tokenId:fixture.casterToken.id,sceneId:canvas.scene.id,initiative:20},{actorId:recipient.id,tokenId:recipientToken.id,sceneId:canvas.scene.id,initiative:10}]);
                await combat.startCombat();
                const {card}=await api.saves.start(fixture.spell,{sourceActor:fixture.caster,plan:await api.compile(fixture.spell),targets:[recipientToken],castRank:3,dc:24,skipConfirmation:true});
                await finalize(card,['failure']);assert(recipient.getCondition('clumsy')?.value===2,'Failure rider created');
                await combat.nextTurn();await api.ongoing.reconcile({clockEvent:true});assert(recipient.hasCondition('clumsy'),'One-round rider persists through recipient turn');
                await combat.nextTurn();await api.ongoing.reconcile({clockEvent:true});assert(!recipient.hasCondition('clumsy'),'One-round rider expires at caster turn');
                const immune=await actor('immune clumsy');await immune.update({'system.attributes.immunities':[{type:'clumsy'}]});
                const immuneCard=await cast(fixture,[immune],['criticalFailure'],3);assert(!immune.hasCondition('clumsy')&&immune.hitPoints.value<500,'Native condition immunity does not suppress damage');
                return {cardId:card.id,immuneCardId:immuneCard.id,removal:game.pf2e.settings.automation.removeEffects};
            } finally {await combat.delete();if(previous)await game.combats.get(previous)?.activate();}
        })],
        ['cleanup','Remove only this rider-family test fixtures',()=>record('fixture-cleanup',async()=>{
            const actors=saved.actors.map(id=>game.actors.get(id)).filter(a=>a?.getFlag(NS,'phase2RiderFixture'));
            const ids=new Set(actors.map(a=>a.id)),uuids=new Set(actors.map(a=>a.uuid));const records=api.ongoing.records().filter(r=>uuids.has(r.sourceActorUuid));
            for(const r of records)await game.journal.get(r.journalId)?.update({[`flags.${NS}.ongoingCast.status`]:'ended'});
            for(const scene of game.scenes){const tokens=scene.tokens.filter(t=>ids.has(t.actorId)).map(t=>t.id);if(tokens.length)await scene.deleteEmbeddedDocuments('Token',tokens);}
            if(ids.size)await Actor.deleteDocuments([...ids],{[NS]:{ongoingCleanup:true}});
            for(const r of records)await game.journal.get(r.journalId)?.delete();saved.actors=[];
            return {actorsRemoved:ids.size,journalsRemoved:records.length};
        })],
        ['report','Show rider-family evidence',()=>show(saved)]
    ];
    new foundry.applications.api.DialogV2({window:{title:'Phase 2 rider family verification'},position:{width:780},
        content:'<p>Disposable pftest only. Explicit native-roll/GM-degree tests of shared rules. Reload after source changes.</p>',
        buttons:actions.map(([action,label,callback])=>({action,label,callback}))}).render(true);
}
