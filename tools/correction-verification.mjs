// Disposable pftest release checks. Invoked explicitly through a Foundry script macro.
const NS='pf2e-automatic-resolution', KEY='correctionVerification';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const state=card=>card.getFlag(NS,'basicSaveState');
const assert=(value,message)=>{if(!value)throw new Error(`FAIL: ${message}`);};
const eq=(a,b,message)=>assert(JSON.stringify(a)===JSON.stringify(b),`${message}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const rejects=async(fn,pattern)=>{let error;try{await fn();}catch(e){error=e;}assert(error&&pattern.test(error.message),`expected rejection ${pattern}, got ${error?.message}`);};
const hp=a=>a.system.attributes.hp.value;
const actorOf=async t=>(await fromUuid(t.tokenUuid??t.actorUuid))?.actor??await fromUuid(t.actorUuid);
export async function run(macro){
 if(game.world.id!=='pftest')throw Error('Disposable pftest only');
 const api=game.modules.get(NS).api;
 let saved=macro.getFlag(NS,KEY)??{results:[],cases:{},actors:[]};
 const persist=()=>macro.setFlag(NS,KEY,saved);
 const show=data=>new foundry.applications.api.DialogV2({window:{title:'Correction verification — report'},position:{width:850},content:`<pre style="white-space:pre-wrap;max-height:65vh;overflow:auto">${esc(JSON.stringify(data,null,2))}</pre>`,buttons:[{action:'close',label:'Close report'}]}).render(true);
 const record=async(label,fn)=>{try{const details=await fn();const result={label,passed:true,user:game.user.id,at:new Date().toISOString(),details};saved.results.push(result);await persist();show(result);}catch(e){const result={label,passed:false,error:e.message,stack:e.stack};saved.results.push(result);await persist();show(result);}};
 const create=async(name,undead=false)=>{
  const a=await Actor.create({name:`PFTEST Corrections ${name}`,type:'npc',system:{details:{level:{value:5}},attributes:{hp:{value:500,max:500},ac:{value:20}},saves:{fortitude:{value:10},reflex:{value:10},will:{value:10}},traits:{value:undead?['undead']:['humanoid']}}});saved.actors.push(a.id);return a;
 };
 const prepare=async(key,name,rank,targets)=>{
  const scene=game.scenes.get(saved.sceneId);
  targets=await Promise.all(targets.map(async(t,i)=>t.documentName==='Actor'?(await scene.createEmbeddedDocuments('Token',[{...t.prototypeToken.toObject(),actorId:t.id,actorLink:true,x:200+i*200,y:600}]))[0]:t));
  const caster=game.actors.get(saved.casterId);const pack=game.packs.get('pf2e.spells-srd');const index=await pack.getIndex();const native=await pack.getDocument(index.find(i=>i.name===name)._id);
  const source=native.toObject();delete source._id;source.system.location={value:saved.entryId};const [spell]=await caster.createEmbeddedDocuments('Item',[source]);
  const plan=await api.compile(spell);assert(api.saves.supports(plan),`${name} executable plan`);
  const message=await spell.toMessage(null,{create:true});
  const {card}=await api.saves.start(spell,{plan,sourceActor:caster,sourceMessageId:message.id,dc:24,castRank:rank,targets,skipConfirmation:true});
  saved.cases[key]={cardId:card.id,sourceMessageId:message.id,spellUuid:spell.uuid,rank,dc:24,expected:name==='Fireball'?'6d6 fire; half/full/double by effective degree':name==='Noise Blast'?'2d10 sonic; success half/no condition; failure full/deafened 1 round; critical failure double/deafened 1 minute/stunned 1':name==='Reblooded'?'1/2/3d6 persistent acid by degree, clumsy 1/2 for 1 minute; no immediate HP loss':'critical failure requires Fortitude; secondary failure death, success 12d6 mental/fleeing/frightened 4',initial:foundry.utils.deepClone(state(card))};await persist();return card;
 };
 const get=key=>{const card=game.messages.get(saved.cases[key]?.cardId);assert(card,`prepared ${key}`);return card;};
 const correct=(card,index,action,extra={})=>api.saves.correctTarget(card,state(card).targets[index].id,{action,...extra});
 const roll=(card,index,stage='primary')=>api.saves.rollSave(card,state(card).targets[index].id,{skipDialog:true,stage});
 const snapshot=async card=>({state:state(card),actors:await Promise.all(state(card).targets.map(async t=>{const a=await actorOf(t);return{uuid:a.uuid,hp:hp(a),traits:[...a.traits],items:a.items.filter(i=>['condition','effect'].includes(i.type)).map(i=>({uuid:i.uuid,name:i.name,slug:i.slug,value:i.system.value,duration:i.system.duration,persistent:i.system.persistent,grantedBy:i.flags.pf2e?.grantedBy}))};}))});
 const actions=[
 ['repair-fixtures','Prepare fresh token-based C2 C3 C4 fixtures',()=>record('fresh-token-fixtures',async()=>{await prepare('C2','Noise Blast',2,[await create('Noise success token'),await create('Noise failure token'),await create('Noise critical token')]);await prepare('C3','Phantasmal Killer',4,[await create('Secondary token')]);await prepare('C4','Reblooded',3,[await create('Living override token'),await create('Undead token',true),await create('Living blocked token')]);return saved.cases;})],
 ['setup','Prepare isolated correction fixtures',()=>record('setup',async()=>{
  assert(game.user.isGM,'GM setup');await macro.update({'ownership.default':2});saved.baseline={foundry:game.version,pf2e:game.system.version,module:game.modules.get(NS).version,removeExpired:game.settings.get('pf2e','automation.removeExpiredEffects'),effectiveRemoveExpired:game.pf2e.settings.automation.removeEffects};
  const caster=await create('Caster');saved.casterId=caster.id;
  const [entry]=await caster.createEmbeddedDocuments('Item',[{name:'Test spellcasting',type:'spellcastingEntry',system:{ability:{value:'cha'},tradition:{value:'arcane'},prepared:{value:'innate'},spelldc:{value:14,dc:24}}}]);saved.entryId=entry.id;
  const base=await create('Unlinked base');const linked=await create('Linked');const owner=await Actor.create({name:'PFTEST Corrections Player',type:'character',ownership:{utxVA4eu1cnQzlIj:3}});saved.actors.push(owner.id);saved.ownerId=owner.id;
  const scene=await Scene.create({name:'PFTEST Corrections laboratory',width:1800,height:1200,grid:{type:1,size:100,distance:5,units:'ft'}});saved.sceneId=scene.id;
  const tokens=await scene.createEmbeddedDocuments('Token',[{...base.prototypeToken.toObject(),actorId:base.id,actorLink:false,name:'Copy A',x:200,y:200},{...base.prototypeToken.toObject(),actorId:base.id,actorLink:false,name:'Copy B',x:400,y:200},{...linked.prototypeToken.toObject(),actorId:linked.id,actorLink:true,x:600,y:200},{...owner.prototypeToken.toObject(),actorId:owner.id,actorLink:true,x:800,y:200}]);await scene.activate();
  await prepare('C1','Fireball',3,tokens);
  await prepare('C2','Noise Blast',2,[await create('Noise success'),await create('Noise failure'),await create('Noise critical')]);
  await prepare('C3','Phantasmal Killer',4,[await create('Secondary')]);
  await prepare('C4','Reblooded',3,[await create('Living override'),await create('Undead',true),await create('Living blocked')]);
  await prepare('C5','Fireball',3,[owner]);
  return{baseline:saved.baseline,cases:saved.cases,sceneId:scene.id,ownerId:owner.id};
 })],
 ['c1','Run C1 target identity and exclusion',()=>record('C1',async()=>{
  const card=get('C1');const rows=state(card).targets;const playerIndex=rows.findIndex(t=>t.actorUuid===`Actor.${saved.ownerId}`);const linkedIndex=rows.findIndex(t=>t.name==='PFTEST Corrections Linked');const copies=rows.map((t,i)=>t.tokenUuid&&t.actorUuid.startsWith('Scene.')?i:-1).filter(i=>i>=0);
  assert(rows[playerIndex].degree,'player-owned target must roll from player browser first');
  for(let i=0;i<rows.length;i++)if(i!==playerIndex)await roll(card,i);
  for(const [i,degree]of [[copies[0],'success'],[copies[1],'failure'],[linkedIndex,'criticalFailure']])await correct(card,i,'degree',{degree});
  const before=foundry.utils.deepClone(state(card).targets[copies[0]]);await correct(card,copies[0],'exclude');await correct(card,copies[0],'restore');eq(state(card).targets[copies[0]].saveTotal,before.saveTotal,'restored dice');eq(state(card).targets[copies[0]].degreeOverride,before.degreeOverride,'restored override');
  await correct(card,copies[1],'exclude');await correct(card,playerIndex,'exclude');
  const old=await snapshot(card);await api.saves.finalize(card);const result=await snapshot(card),total=result.state.damage.total;
  eq(result.actors.map((a,i)=>old.actors[i].hp-a.hp),rows.map((t,i)=>i===copies[0]?Math.floor(total/2):i===linkedIndex?total*2:0),'native HP deltas match effective degree and exclusions');
  eq(new Set(result.state.targets.map(t=>t.actorUuid)).size,4,'four separate persisted recipients');
  eq(result.state.targets.map(t=>t.applicationStatus),rows.map((t,i)=>i===copies[0]||i===linkedIndex?'applied':'pending'),'only participating targets applied');
  await rejects(()=>api.saves.finalize(card),/complete/);eq((await snapshot(card)).actors,result.actors,'repeated Finalize cannot damage twice');
  eq(game.messages.filter(m=>m.getFlag(NS,'basicSaveState')?.castId===result.state.castId).length,1,'one collector');assert(result.state.resultMessageId,'result card');
  return result;
 })],
 ['c2','Run C2 degree corrections and reroll',()=>record('C2',async()=>{
  const card=get('C2');for(let i=0;i<3;i++)await roll(card,i);
  await correct(card,0,'degree',{degree:'failure'});await correct(card,0,'degree',{degree:'success'});const original=foundry.utils.deepClone(state(card).targets[0]);
  await roll(card,0);eq(state(card).targets[0].degreeOverride,null,'reroll clears override');assert(state(card).targets[0].rollRevision>original.rollRevision,'native reroll recorded');
  for(const [i,degree]of ['success','failure','criticalFailure'].entries())await correct(card,i,'degree',{degree});
  const before=await snapshot(card);await api.saves.finalize(card);const after=await snapshot(card),total=after.state.damage.total;
  assert(/2d10/.test(after.state.damage.formula),'Noise Blast base 2d10');eq(after.actors.map((a,i)=>before.actors[i].hp-a.hp),[Math.floor(total/2),total,2*total],'sonic degree damage');
  eq(after.actors.map(a=>a.items.filter(i=>i.slug==='deafened').length),[0,1,1],'deafened only on failures');assert(after.actors[2].items.some(i=>i.slug==='stunned'),'critical failure stunned');
  return after;
 })],
 ['c3','Run C3 secondary branch corrections',()=>record('C3',async()=>{
  const card=get('C3');await roll(card,0);await correct(card,0,'degree',{degree:'criticalFailure'});await roll(card,0,'secondary');
  const secondary=foundry.utils.deepClone(state(card).targets[0].secondary);await correct(card,0,'degree',{stage:'secondary',degree:secondary.degree==='success'?'failure':'success'});eq(state(card).targets[0].secondary.saveTotal,secondary.saveTotal,'secondary dice retained');
  await correct(card,0,'degree',{degree:'success'});eq(state(card).targets[0].secondary,null,'secondary removed');await correct(card,0,'degree',{degree:'criticalFailure'});eq(state(card).targets[0].secondary.degree,null,'recreated secondary unrolled');await rejects(()=>api.saves.finalize(card),/secondary/);
  await roll(card,0,'secondary');await correct(card,0,'degree',{stage:'secondary',degree:'success'});
  const before=await snapshot(card);await api.saves.finalize(card);const after=await snapshot(card);const damage=after.state.targets[0].damageResults.reduce((sum,r)=>sum+r.total,0);eq(before.actors[0].hp-after.actors[0].hp,damage,'secondary success mental damage');assert(damage>=12&&damage<=72,'12d6 at rank 4');assert(after.actors[0].items.some(i=>i.slug==='frightened'&&i.value?.value===4),'frightened 4');assert(after.actors[0].items.some(i=>i.slug==='fleeing'),'fleeing');return after;
 })],
 ['c4','Run C4 eligibility overrides',()=>record('C4',async()=>{
  const card=get('C4');eq(state(card).targets.map(t=>t.eligible),[false,true,false],'native eligibility');
  await correct(card,0,'affected');await roll(card,0);await correct(card,0,'degree',{degree:'failure'});await correct(card,0,'unaffected');await correct(card,0,'affected');
  await roll(card,1);await correct(card,1,'unaffected');await correct(card,1,'affected');await correct(card,1,'degree',{degree:'success'});await correct(card,1,'unaffected');
  const before=await snapshot(card);await api.saves.finalize(card);const after=await snapshot(card);eq(after.actors.map(a=>a.hp),before.actors.map(a=>a.hp),'persistent damage has no immediate HP loss');assert(after.actors[0].items.some(i=>i.slug==='clumsy'&&i.value?.value===1),'living override receives clumsy 1');assert(after.actors[0].items.some(i=>i.slug==='persistent-damage'&&/2d6/.test(i.persistent?.formula)),'living override persistent acid');eq(after.actors.slice(1).map(a=>a.items.length),[0,0],'unaffected targets unchanged');eq(after.state.targets[0].originalEligibility.eligible,false,'original restriction retained');return after;
 })],
 ['incapacitation','Verify high-level secondary save and death branch',()=>record('C3-incapacitation-death',async()=>{
  const actor=await create('High-level secondary');await actor.update({'system.details.level.value':10});const card=await prepare('C3-high','Phantasmal Killer',4,[actor]);await roll(card,0);await correct(card,0,'degree',{degree:'criticalFailure'});await roll(card,0,'secondary');const secondary=foundry.utils.deepClone(state(card).targets[0].secondary);
  const base=secondary.saveTotal>=34?3:secondary.saveTotal>=24?2:secondary.saveTotal<=14?0:1;const natural=Math.max(0,Math.min(3,base+(secondary.saveNatural===20?1:secondary.saveNatural===1?-1:0)));const expected=['criticalFailure','failure','success','criticalSuccess'][Math.min(3,natural+1)];eq(secondary.degree,expected,'native incapacitation improves level-10 target result against rank-4 spell');
  await correct(card,0,'degree',{stage:'secondary',degree:'failure'});await api.saves.finalize(card);assert(actor.statuses.has('dead'),'secondary failure marks actor dead');return{nativeSecondary:secondary,expected,dead:actor.statuses.has('dead'),snapshot:await snapshot(card)};
 })],
 ['reload-prepare','Prepare C5 reload and stale revision',()=>record('C5-before-reload',async()=>{const card=get('C5');await roll(card,0);await correct(card,0,'degree',{degree:state(card).targets[0].degree==='failure'?'success':'failure'});saved.beforeReload=foundry.utils.deepClone(state(card));await persist();return saved.beforeReload;})],
 ['reload-check','Check C5 persistence and stale correction',()=>record('C5-after-reload',async()=>{const card=get('C5');eq(state(card),saved.beforeReload,'reload preserves entire cast');const revision=state(card).targets[0].revision;await correct(card,0,'exclude',{expectedRevision:revision});await rejects(()=>correct(card,0,'restore',{expectedRevision:revision}),/changed/);await correct(card,0,'restore');return state(card);})],
 ['stale-gm','Try stale correction after GM handoff',()=>record('C5-handoff-stale',async()=>{const card=get('C5');const before=foundry.utils.deepClone(state(card));await rejects(()=>correct(card,0,'exclude',{expectedRevision:saved.beforeReload.targets[0].revision}),/changed/);eq(state(card),before,'stale former-coordinator revision unchanged');await correct(card,0,'exclude',{expectedRevision:before.targets[0].revision});await correct(card,0,'restore');return{user:game.user.id,activeGMs:game.users.filter(u=>u.isGM&&u.active).map(u=>u.id),state:state(card)};})],
 ['tokenless','Verify tokenless damage guard live',()=>record('tokenless-damage-guard',async()=>{const a=await create('Tokenless safety');const caster=game.actors.get(saved.casterId),spell=await fromUuid(saved.cases.C1.spellUuid);const plan=await api.compile(spell);const {card}=await api.saves.start(spell,{plan,sourceActor:caster,targets:[a],dc:24,castRank:3,skipConfirmation:true});await roll(card,0);await correct(card,0,'degree',{degree:'failure'});const before=hp(a);await rejects(()=>api.saves.finalize(card),/token.*damage/i);eq(hp(a),before,'HP unchanged before native damage');eq(state(card).status,'collecting','safe failure remains correctable');return{actor:a.uuid,hp:hp(a),state:state(card)};})],
 ['cleanup','Disable temporary GM after verification',()=>record('cleanup',async()=>{assert(game.user.id!=='WCHvGCPipQMSG3pB','original GM only');await game.users.get('WCHvGCPipQMSG3pB').update({role:0});return{temporaryGMRole:game.users.get('WCHvGCPipQMSG3pB')._source.role};})],
 ['authority','Attempt correction from this client',async()=>{
  const card=get('C5'),before=foundry.utils.deepClone(state(card));let error;try{await correct(card,0,'exclude',{expectedRevision:before.targets[0].revision});}catch(e){error=e.message;}
  const report={user:game.user.id,isGM:game.user.isGM,activeGMs:game.users.filter(u=>u.active&&u.isGM).map(u=>u.id),error,stateUnchanged:JSON.stringify(before)===JSON.stringify(state(card)),cardId:card.id};show(report);
 }],
 ['finish-c5','Finalize C5 and reject late correction',()=>record('C5-completed-lock',async()=>{const card=get('C5');await correct(card,0,'unaffected');const attempts=await Promise.allSettled([api.saves.finalize(card),api.saves.finalize(card),correct(card,0,'affected')]);eq(attempts.map(a=>a.status),['fulfilled','rejected','rejected'],'concurrent finalization and correction');assert(/complete/.test(attempts[1].reason.message),'duplicate finalize locked');assert(/locked/.test(attempts[2].reason.message),'correction queued after finalization locked');await rejects(()=>correct(card,0,'affected'),/locked/);return await snapshot(card);})],
 ['audit','Audit completed case receipts and durations',()=>record('receipt-duration-audit',async()=>{
  for(const key of ['C1','C2','C3','C4','C5']){const c=get(key),s=state(c);eq(s.status,'completed',`${key} completed`);eq(game.messages.filter(m=>m.getFlag(NS,'saveResult')?.castId===s.castId).length,1,`${key} one result summary`);assert(game.messages.get(saved.cases[key].sourceMessageId),`${key} native source card retained`);assert(!game.messages.some(m=>['basic-save-damage','outcome-save-damage'].includes(m.getFlag(NS,'kind'))&&m.getFlag(NS,'castId')===s.castId),`${key} no separate module damage card`);}
  const noise=await snapshot(get('C2'));eq(noise.actors[1].items.find(i=>i.name==='Noise Blast: Deafened').duration,{value:1,unit:'rounds',expiry:'turn-start',sustained:false},'failure deafened duration');eq(noise.actors[2].items.find(i=>i.name==='Noise Blast: Deafened').duration,{value:1,unit:'minutes',expiry:'turn-start',sustained:false},'critical failure deafened duration');
  const blood=await snapshot(get('C4'));eq(blood.actors[0].items.find(i=>i.name==='Reblooded: Clumsy 1').duration,{value:1,unit:'minutes',expiry:'turn-start',sustained:false},'clumsy duration');return{cases:Object.keys(saved.cases),threeMainCardsPerCast:true,noise:noise.actors,blood:blood.actors};
 })],
 ['report','Show release evidence',()=>show(saved)]
 ];
 new foundry.applications.api.DialogV2({window:{title:'Correction verification — controls'},position:{width:650},content:'<p>Disposable pftest only. Run setup once, then each verification. Evidence persists on this macro. Authority probe can run on another client.</p>',buttons:actions.map(([action,label,callback])=>({action,label,callback}))}).render(true);
}
