// Disposable PFTEST-only diagnostic. Not loaded by the production module.
const NS = 'pf2e-automatic-resolution';
const KEY = 'expiryExperiment';
const hooks = ['createItem', 'updateItem', 'deleteItem', 'updateActor', 'combatTurn', 'updateCombat', 'deleteCombat', 'updateWorldTime'];

export async function run(macro) {
    if (game.world.id !== 'pftest' || !game.user.isGM) throw new Error('This diagnostic requires a GM in disposable pftest.');
    const session = game.pf2eExpiryExperiment ??= { events: [], registrations: [], macroId: macro.id };
    let saved = macro.getFlag(NS, KEY) ?? { runs: [], actorIds: [], snapshots: [] };
    const log = (event, data) => session.events.push({ event, time: game.time.worldTime, client: game.user.id, activeGM: game.users.activeGM?.id, ...data });
    if (!session.registrations.length) {
        for (const name of hooks) {
            const id = Hooks.on(name, (...args) => {
                const doc = args[0];
                if (name.endsWith('Item') && !doc.actor?.name.startsWith('PFTEST Expiry')) return;
                if (name === 'updateActor' && !doc.name.startsWith('PFTEST Expiry')) return;
                log(name, { uuid: doc?.uuid, name: doc?.name, changes: name === 'updateWorldTime' ? args.slice(0,3) : name.startsWith('update') ? args[1] : undefined });
            });
            session.registrations.push([name,id]);
        }
        session.registrations.push(['renderApplicationV2', Hooks.on('renderApplicationV2', app => {
            const title = app.title ?? app.options?.window?.title ?? '';
            if (/Guidance|successor|Effect|Sequence/i.test(title) && !/Expiry investigation/.test(title)) log('renderApplicationV2', {title});
        })]);
        log('observer-installed', {version:game.version, system:game.system.version});
    }
    const persist = async () => {
        saved.events ??= [];
        saved.events.push(...session.events.splice(0));
        await macro.setFlag(NS, KEY, saved);
    };
    const snapshot = async label => {
        const data = {label, time:game.time.worldTime, removeExpired:game.settings.get('pf2e','automation.removeExpiredEffects'), effectiveRemoveExpired:game.pf2e.settings.automation.removeEffects, activeGM:game.users.activeGM?.id, temporaryGM:saved.testGMId ? {id:saved.testGMId,role:game.users.get(saved.testGMId)?.role,sourceRole:game.users.get(saved.testGMId)?._source.role} : null, combat:game.combat ? {id:game.combat.id,round:game.combat.round,turn:game.combat.turn} : null,
            actors:saved.actorIds.map(id=>game.actors.get(id)).filter(Boolean).map(actor=>({uuid:actor.uuid, updater:actor.primaryUpdater?.id, items:actor.items.filter(i=>['effect','condition'].includes(i.type)).map(i=>({uuid:i.uuid,name:i.name,type:i.type,expired:i.system.expired,remaining:i.remainingDuration,duration:i.system.duration,rules:i.rules?.map(r=>({key:r.key,ignored:r.ignored})),runtime:i.getFlag(NS,'runtime'),grantedBy:i.flags.pf2e?.grantedBy}))}))};
        saved.snapshots.push(data); await persist(); return data;
    };
    const esc = text => String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const show = data => new foundry.applications.api.DialogV2({window:{title:'Expiry investigation — report'},position:{width:850},content:'<pre style="white-space:pre-wrap;max-height:65vh;overflow:auto">'+esc(JSON.stringify(data,null,2))+'</pre>',buttons:[{action:'close',label:'Close'}]}).render(true);
    const prepare = async remove => {
        saved.originalSetting ??= game.settings.get('pf2e','automation.removeExpiredEffects');
        await game.settings.set('pf2e','automation.removeExpiredEffects',remove);
        const actor = await Actor.create({name:`PFTEST Expiry ${remove ? 'remove' : 'retain'} ${saved.runs.length+1}`,type:'character'});
        saved.actorIds.push(actor.id);
        const pack=game.packs.get('pf2e.spells-srd');
        const entry=(await pack.getIndex()).find(i=>i.name==='Guidance');
        if (!entry) throw new Error('Guidance not found');
        const spell=await pack.getDocument(entry._id);
        await game.modules.get(NS).api.execute(spell,{sourceActor:actor,targets:[actor],castRank:1,skipConfirmation:true});
        const guidance=actor.items.find(i=>i.type==='effect' && i.getFlag(NS,'runtime')?.sequence);
        if (!guidance) throw new Error('Guidance sequence was not created');
        const duration=foundry.utils.deepClone(guidance.system.duration);
        const conditions=game.packs.get('pf2e.conditionitems');
        const deafened=(await conditions.getIndex()).find(i=>i.name==='Deafened');
        if(!deafened) throw new Error('Native Deafened condition not found');
        await actor.createEmbeddedDocuments('Item',[
            {name:'PFTEST timed native Effect',type:'effect',system:{duration,rules:[{key:'RollOption',domain:'all',option:'pftest-expiry-probe'}]}},
            {name:'PFTEST timed Deafened wrapper',type:'effect',system:{duration,rules:[{key:'GrantItem',uuid:`Compendium.pf2e.conditionitems.Item.${deafened._id}`}]}}
        ]);
        saved.runs.push({actorId:actor.id,remove,started:game.time.worldTime,guidance:guidance.uuid,duration});
        show(await snapshot('prepared'));
    };
    const actions = [
        ['finish','Finish: restore setting and disable temporary GM',async()=>{if(game.user.id===saved.testGMId)throw new Error('Run Finish from the original Gamemaster');if(saved.originalSetting!==undefined)await game.settings.set('pf2e','automation.removeExpiredEffects',saved.originalSetting);const user=game.users.get(saved.testGMId);if(user?.name==='PFTEST Expiry GM2')await user.update({role:0});await snapshot('finished');for(const [name,id]of session.registrations)Hooks.off(name,id);session.registrations=[];show({finished:true,temporaryGMRole:user?.role,fixtureActors:saved.actorIds,traceMacro:macro.uuid});}],
        ['view-scene','Activate latest test scene',async()=>{const scene=game.scenes.get(saved.sceneId);if(!scene)throw new Error('Create a test encounter first');await scene.activate();show(await snapshot('test-scene-activated'));}],
        ['second-gm','Create authorized temporary test GM',async()=>{let user=game.users.find(u=>u.name==='PFTEST Expiry GM2');user??=await User.create({name:'PFTEST Expiry GM2',role:4,password:''});saved.testGMId=user.id;await persist();show({id:user.id,name:user.name,role:user.role});}],
        ['pause-combat','Pause encounter for world-time test',async()=>{const combat=game.combat;if(combat){saved.originalCombat??={id:combat.id,round:combat.round,turn:combat.turn};await combat.update({round:0,turn:null});}show(await snapshot('encounter-paused'));}],
        ['prepare-retain','Prepare with removal OFF',()=>prepare(false)],
        ['prepare-remove','Prepare with removal ON',()=>prepare(true)],
        ['advance','Advance world time 7 seconds',async()=>{await game.time.advance(7);await persist();show({advanced:true,note:'Use Snapshot after native asynchronous updates settle.'});}],
        ['back','Move world time backward 7 seconds',async()=>{await game.time.advance(-7);await persist();show({rewound:true,note:'Use Snapshot after native asynchronous updates settle.'});}],
        ['snapshot','Snapshot native state',async()=>show(await snapshot('observed'))],
        ['report','Show full trace',async()=>{await snapshot('trace-export');show(saved);}],
        ['restore','Restore original removal setting',async()=>{if(saved.originalSetting!==undefined) await game.settings.set('pf2e','automation.removeExpiredEffects',saved.originalSetting);show(await snapshot('setting-restored'));}],
        ['combat','Create isolated test encounter',async()=>{
            const actor=game.actors.get(saved.actorIds.at(-1)); if(!actor) throw new Error('Prepare a fixture first');
            const other=await Actor.create({name:'PFTEST Expiry initiative marker',type:'character'}); saved.actorIds.push(other.id);
            const scene=await Scene.create({name:'PFTEST Expiry laboratory',width:1500,height:1000,grid:{size:100,type:1,distance:5,units:'ft'}});
            const sources=[actor,other].map((a,i)=>({...a.prototypeToken.toObject(),actorId:a.id,actorLink:true,x:200+i*200,y:200}));
            const tokens=await scene.createEmbeddedDocuments('Token',sources);
            const combat=await Combat.create({scene:scene.id,active:true});
            await combat.createEmbeddedDocuments('Combatant',tokens.map((t,i)=>({actorId:t.actorId,tokenId:t.id,sceneId:scene.id,initiative:20-i*10})));
            await combat.startCombat(); saved.combatId=combat.id; saved.sceneId=scene.id; await persist();show(await snapshot('combat-started'));
        }],
        ['turn','Advance test encounter turn',async()=>{const combat=game.combats.get(saved.combatId);if(!combat)throw new Error('Create test encounter first');await combat.nextTurn();await persist();show({advanced:true});}],
        ['stop','Stop observer',async()=>{await persist();for(const [name,id] of session.registrations)Hooks.off(name,id);session.registrations=[];show({stopped:true});}]
    ];
    new foundry.applications.api.DialogV2({window:{title:'Expiry investigation — controls'},position:{width:650},content:'<p>Disposable PFTEST diagnostic. Snapshots and hook traces are stored on this macro. Reopen after a reload to reinstall observation. Native successor dialogs require explicit confirmation.</p>',buttons:actions.map(([action,label,callback])=>({action,label,callback:async()=>{try{await callback();}catch(error){show({error:error.message,stack:error.stack});}}}))}).render(true);
}
