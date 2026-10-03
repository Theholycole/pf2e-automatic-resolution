const NS='pf2e-automatic-resolution',KEY='phase23Verification';
const assert=(v,m)=>{if(!v)throw Error(m);};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
export async function run(macro){
 if(game.world.id!=='pftest'||!game.user.isGM)throw Error('Disposable pftest GM only');
 const api=game.modules.get(NS).api,saved=macro.getFlag(NS,KEY)??{results:[],cases:{}};
 const show=data=>new foundry.applications.api.DialogV2({window:{title:'Coverage verification report'},position:{width:850},content:`<pre style="white-space:pre-wrap;max-height:65vh;overflow:auto">${esc(JSON.stringify(data,null,2))}</pre>`,buttons:[{action:'close',label:'Close report'}]}).render(true);
 const record=async(label,fn)=>{try{saved.results.push({label,passed:true,details:await fn()});}catch(e){saved.results.push({label,passed:false,error:e.message,stack:e.stack});}await macro.setFlag(NS,KEY,saved);show(saved.results.at(-1));};
 const scene=game.scenes.get('pCgysuwHQ8wg9vST');
 const actor=async name=>Actor.create({name:`PFTEST Coverage ${name}`,type:'npc',system:{details:{level:{value:5}},attributes:{hp:{value:100,max:100},ac:{value:20}},abilities:{str:{mod:4}},saves:{fortitude:{value:10},reflex:{value:10},will:{value:10}},traits:{value:['humanoid']}}});
 const token=async a=>(await scene.createEmbeddedDocuments('Token',[{...a.prototypeToken.toObject(),actorId:a.id,actorLink:true,x:1000,y:1000}]))[0];
 const setup=async name=>{const a=await actor(`${name} caster`),t=await token(a),[entry]=await a.createEmbeddedDocuments('Item',[{name:'Coverage casting',type:'spellcastingEntry',system:{tradition:{value:'occult'},prepared:{value:'innate'},spelldc:{dc:24,value:14}}}]);const pack=game.packs.get('pf2e.spells-srd'),index=await pack.getIndex(),source=(await pack.getDocument(index.find(i=>i.name===name)._id)).toObject();delete source._id;source.system.location={value:entry.id};const [spell]=await a.createEmbeddedDocuments('Item',[source]);return{actor:a,token:t,spell};};
 const finalize=async(card,degrees)=>{const s=card.getFlag(NS,'basicSaveState');for(let i=0;i<s.targets.length;i++){await api.saves.rollSave(card,s.targets[i].id,{skipDialog:true});await api.saves.correctTarget(card,s.targets[i].id,{action:'degree',degree:degrees[i]});}await api.saves.finalize(card);};
 const actions=[
 ['cleanup','Remove authored Coverage fixtures from disposable pftest',()=>record('coverage-fixture-cleanup',async()=>{
  const actors=game.actors.filter(a=>a.name.startsWith('PFTEST Coverage ')),ids=new Set(actors.map(a=>a.id)),uuids=new Set(actors.map(a=>a.uuid)),records=api.ongoing.records().filter(r=>uuids.has(r.sourceActorUuid));
  for(const r of records){const j=game.journal.get(r.journalId);if(j)await j.update({[`flags.${NS}.ongoingCast.status`]:'ended'});}
  const combats=game.combats.filter(c=>c.combatants.size>0&&c.combatants.every(x=>ids.has(x.actorId)));for(const c of combats)await c.delete();
  let tokens=0;for(const scene of game.scenes){const tokenIds=scene.tokens.filter(t=>ids.has(t.actorId)).map(t=>t.id);if(tokenIds.length){await scene.deleteEmbeddedDocuments('Token',tokenIds);tokens+=tokenIds.length;}}
  if(actors.length)await Actor.deleteDocuments([...ids],{render:false,[NS]:{ongoingCleanup:true}});
  for(const r of records){const j=game.journal.get(r.journalId);if(j)await j.delete();}
  return{actorsRemoved:actors.length,tokensRemoved:tokens,encountersRemoved:combats.length,journalsRemoved:records.length,preserved:'Other actors, existing user roles/ownership, chat evidence and this verification macro'};
 })],
 ['no-gm-check','Verify no-GM Retch left no work applied and clean up',()=>record('player-retch-no-gm',async()=>{
  const c=saved.cases.playerRetch,r=api.ongoing.records().find(x=>x.castId===c.castId),effect=await fromUuid(c.effectUuid);assert(!r.obligations.some(o=>o.kind==='sickened-recovery'),'no recovery card prepared while no GM connected');assert(effect?.actor.items.get(effect.flags.pf2e.itemGrants.condition1.id)?.value===2,'Sickened unchanged');await api.ongoing.request('end',{castId:c.castId});return c;
 })],
 ['player-setup','Prepare shared Retch on existing player-owned test actor',()=>record('player-retch-setup',async()=>{
  for(const c of game.combats.filter(c=>c.active))await c.update({active:false});
  const a=game.actors.get('uOHSDD4ZhktlqCOP'),player=game.users.get('utxVA4eu1cnQzlIj');assert(a?.name==='PFTEST Corrections Player'&&a.testUserPermission(player,'OWNER'),'existing disposable player ownership');
  const f=await setup('Ashen Wind'),t=await token(a),{card}=await api.saves.start(f.spell,{sourceActor:f.actor,plan:await api.compile(f.spell),targets:[t],dc:24,skipConfirmation:true});await finalize(card,['criticalFailure']);
  const castId=card.getFlag(NS,'basicSaveState').castId,entry=api.ongoing.records().find(x=>x.castId===castId).entries.find(e=>e.metadata?.conditions?.[0]?.recovery==='sickened');saved.cases.playerRetch={castId,effectUuid:entry.uuid,actorUuid:a.uuid,originalCard:card.id};return saved.cases.playerRetch;
 })],
 ['player-check','Verify player Retch and remove its test contribution',()=>record('player-retch-result',async()=>{
  const c=saved.cases.playerRetch,r=api.ongoing.records().find(x=>x.castId===c.castId),o=r.obligations.find(o=>o.kind==='sickened-recovery'),card=o&&game.messages.get(o.cardId),save=card?.getFlag(NS,'basicSaveState');assert(save?.targets[0].degree,'player native save retained');
  assert(save.targets[0].lastSubmissionId&&Number.isInteger(save.targets[0].saveNatural),'inline player roll receipt retained; player identity is observed in the separate browser session');
  await api.saves.finalize(card);const expected={criticalSuccess:0,success:1,failure:2,criticalFailure:2}[save.targets[0].degree],effect=await fromUuid(c.effectUuid),condition=effect&&effect.actor.items.get(effect.flags.pf2e.itemGrants.condition1.id);assert((condition?.value??0)===expected,'GM finalization applies player save');
  if(effect)await api.ongoing.request('end',{castId:c.castId});return{...c,recoveryCard:card.id,degree:save.targets[0].degree,expected};
 })],
 ['access','Inspect existing player test ownership',()=>record('existing-player-ownership',async()=>game.users.filter(u=>!u.isGM&&u.role>0).map(u=>({id:u.id,name:u.name,actors:game.actors.filter(a=>a.testUserPermission(u,'OWNER')).map(a=>({id:a.id,name:a.name}))})))],
 ['sickened','Verify shared Sickened recovery preserves damage and Deafened',()=>record('shared-sickened-recovery',async()=>{
  const output=[];
  for(const name of ['Ashen Wind','Painful Vibrations']){
   const f=await setup(name),a=await actor(`${name} Retch`),t=await token(a),otherSource=game.pf2e.ConditionManager.getCondition('sickened').toObject();delete otherSource._id;otherSource.system.value.value=3;
   const [other]=await a.createEmbeddedDocuments('Item',[otherSource]);
   const {card}=await api.saves.start(f.spell,{sourceActor:f.actor,plan:await api.compile(f.spell),targets:[t],dc:24,skipConfirmation:true});await finalize(card,['criticalFailure']);
   const initial=card.getFlag(NS,'basicSaveState'),get=()=>api.ongoing.records().find(x=>x.castId===initial.castId),entry=get().entries.find(e=>e.metadata?.conditions?.[0]?.recovery==='sickened');assert(entry,'separate Sickened recovery contribution');
   const effect=await fromUuid(entry.uuid),grant=effect.flags.pf2e.itemGrants[entry.metadata.conditions[0].ruleFlag],own=a.items.get(grant.id);assert(own.value===2,'critical failure Sickened 2');
   const hp=a.system.attributes.hp.value,deafened=a.hasCondition('deafened');await f.spell.delete();
   let result=await api.ongoing.request('condition-retch',{castId:initial.castId,effectUuid:entry.uuid});await finalize(game.messages.get(result.cardId),['failure']);assert(own.value===2,'failed Retch leaves severity');
   result=await api.ongoing.request('condition-retch',{castId:initial.castId,effectUuid:entry.uuid});await finalize(game.messages.get(result.cardId),['success']);assert(own.value===1,'successful Retch reduces only own condition');
   result=await api.ongoing.request('condition-retch',{castId:initial.castId,effectUuid:entry.uuid});await finalize(game.messages.get(result.cardId),['criticalSuccess']);
   assert(!await fromUuid(effect.uuid)&&other.value===3,'recovery removes only owned wrapper');assert(a.system.attributes.hp.value===hp&&a.hasCondition('deafened')===deafened,'damage not replayed; Deafened retained');
   let blocked=false;try{await api.ongoing.request('condition-retch',{castId:initial.castId,effectUuid:entry.uuid});}catch{blocked=true;}assert(blocked,'no recovery after condition ended');output.push({name,cardId:card.id,castId:initial.castId,actorUuid:a.uuid,hp,deafened});
  }return output;
 })],
 ['source-loss','Verify Evil Eye recovery after original spell deletion',()=>record('recovery-source-loss',async()=>{
  const f=await setup('Evil Eye'),a=await actor('Evil Eye source loss'),t=await token(a),r=await api.ongoing.start(f.spell,{targets:[t]}),get=()=>api.ongoing.records().find(x=>x.castId===r.castId);
  await finalize(game.messages.get(get().obligations[0].cardId),['criticalFailure']);await api.ongoing.request('end',{castId:r.castId});await f.spell.delete();
  const result=await api.ongoing.request('roll',{castId:r.castId,actorUuid:a.uuid}),card=game.messages.get(result.cardId);
  assert(card.getFlag(NS,'basicSaveState').dc===24,'original DC retained after source removal');await finalize(card,['criticalSuccess']);
  assert(!a.hasCondition('sickened'),'retained recovery source resolves the native save and removes only its Sickened');return{castId:r.castId,cardId:card.id,actorUuid:a.uuid};
 })],
 ['profiles','Inspect loaded condition profile data',()=>record('profile-data',async()=>{
  const {conditionProfileMechanics}=await import('../scripts/condition-spell-baseline.js');const output={};
  for(const id of ['f45JpY7Ph2cAJGW2','4koZzrnMXhhosn0D','MraZBLJ4Be3ogmWL','DCQHaLrYXMI37dvW']){const spell=await fromUuid(`Compendium.pf2e.spells-srd.Item.${id}`);output[spell.slug]=JSON.parse(conditionProfileMechanics(spell));}return output;
 })],
 ['overlap','Verify Evil Eye overlap and GM detachment',()=>record('evil-eye-overlap',async()=>{
  const f=await setup('Evil Eye'),a=await actor('Evil Eye overlap'),t=await token(a),independent=game.pf2e.ConditionManager.getCondition('sickened').toObject();delete independent._id;independent.system.value.value=3;
  const [other]=await a.createEmbeddedDocuments('Item',[independent]),r=await api.ongoing.start(f.spell,{targets:[t]}),get=()=>api.ongoing.records().find(x=>x.castId===r.castId);await finalize(game.messages.get(get().obligations[0].cardId),['failure']);
  const own=await fromUuid(get().recipients[0].conditionUuid);assert(own._source.system.value.value===1&&other._source.system.value.value===3,'independent Sickened contributions retained');
  await api.ongoing.request('condition-visibility',{castId:r.castId,actorUuid:a.uuid,visible:true});await api.ongoing.request('detach',{castId:r.castId,uuid:own.uuid});
  await own.delete();await api.ongoing.reconcile();assert(!await fromUuid(own.uuid)&&other._source.system.value.value===3,'detached native condition can be managed manually without touching unrelated Sickened');
  assert(get().status==='ended','cast stops managing its detached last contribution');return{castId:r.castId,actorUuid:a.uuid,unrelatedCondition:other.uuid};
 })],
 ['immunity','Verify mental immunity prevents spell conditions and damage',()=>record('spell-immunity',async()=>{
  assert(game.pf2e.settings.iwr,'native IWR must be enabled for this test');
  const output=[];
  for(const name of ['Fear','Daze','Paralyze']){
   const f=await setup(name),a=await actor(`${name} mental immune`),t=await token(a);await a.update({'system.attributes.immunities':[{type:'mental'}]});
   let card,castId;
   if(name==='Daze')({card}=await api.saves.start(f.spell,{plan:await api.compile(f.spell),sourceActor:f.actor,targets:[t],dc:24,skipConfirmation:true}));
   else{const r=await api.ongoing.start(f.spell,{targets:[t]});castId=r.castId;card=game.messages.get(api.ongoing.records().find(x=>x.castId===castId).obligations[0].cardId);}
   assert(card.getFlag(NS,'basicSaveState').targets[0].eligible===false,'mental immune target is unaffected before rolling '+name);await api.saves.finalize(card);
   assert(a.system.attributes.hp.value===100&&!a.hasCondition('frightened')&&!a.hasCondition('stunned')&&!a.hasCondition('paralyzed'),'no damage or conditions '+name);
   output.push({name,cardId:card.id,actorUuid:a.uuid});
  }
  const f=await setup('Paralyze'),a=await actor('Paralyze late immunity'),t=await token(a),r=await api.ongoing.start(f.spell,{targets:[t]}),record=api.ongoing.records().find(x=>x.castId===r.castId),card=game.messages.get(record.obligations[0].cardId),target=card.getFlag(NS,'basicSaveState').targets[0];
  await api.saves.rollSave(card,target.id,{skipDialog:true});await api.saves.correctTarget(card,target.id,{action:'degree',degree:'failure'});await a.update({'system.attributes.immunities':[{type:'mental'}]});await api.saves.finalize(card);
  assert(!a.hasCondition('paralyzed')&&card.getFlag(NS,'basicSaveState').targets[0].eligible===false,'immunity gained after rolling is rechecked before mutation');output.push({lateImmunity:card.id});return output;
 })],
 ['ui','Prepare Evil Eye native chat walkthrough',()=>record('ui-setup',async()=>{
  for(const c of game.combats.filter(c=>c.active))await c.update({active:false});
  const f=await setup('Evil Eye'),a=await actor('Evil Eye chat recipient'),t=await token(a);t.object.setTarget(true,{releaseOthers:true});
  const message=await f.spell.toMessage(null,{create:true});saved.cases.uiEye={sourceCard:message.id,actorUuid:a.uuid,spellUuid:f.spell.uuid};return saved.cases.uiEye;
 })],
 ['ui-check','Verify native chat walkthrough result',()=>record('ui-result',async()=>{
  const c=saved.cases.uiEye,message=game.messages.get(c.sourceCard),castId=message.getFlag(NS,'ongoingCastId'),r=api.ongoing.records().find(x=>x.castId===castId);assert(r,'source card linked to durable cast');
  const card=game.messages.get(r.obligations.find(o=>!o.recovery).cardId),s=card.getFlag(NS,'basicSaveState'),a=await fromUuid(c.actorUuid);assert(s.status==='completed','normal chat finalization completed');
  const expected={failure:1,criticalFailure:2}[s.targets[0].degree]??0;assert((a.getCondition('sickened')?.value??0)===expected,'native condition matches finalized save');return{...c,castId,saveCard:card.id,degree:s.targets[0].degree,sickened:expected};
 })],
 ['paralyze','Verify Paralyze outcomes and recurring Will recovery',()=>record('paralyze',async()=>{
  const output=[];
  for(const degree of ['criticalSuccess','success','failure','criticalFailure']){
   const f=await setup('Paralyze'),a=await actor(`Paralyze ${degree}`),t=await token(a),combat=await Combat.create({scene:scene.id,active:false});await combat.activate();
   await combat.createEmbeddedDocuments('Combatant',[{actorId:f.actor.id,tokenId:f.token.id,sceneId:scene.id,initiative:20},{actorId:a.id,tokenId:t.id,sceneId:scene.id,initiative:10}]);await combat.startCombat();
   const r=await api.ongoing.start(f.spell,{targets:[t]}),get=()=>api.ongoing.records().find(x=>x.castId===r.castId),card=game.messages.get(get().obligations[0].cardId);await finalize(card,[degree]);
   if(degree==='criticalSuccess')assert(!a.hasCondition('stunned')&&!a.hasCondition('paralyzed'),'critical success unaffected');
   if(degree==='success')assert(a.getCondition('stunned')?.value===1&&!a.hasCondition('paralyzed'),'success Stunned 1');
   if(degree==='failure'){
    assert(a.hasCondition('paralyzed'),'failure Paralyzed');await combat.nextTurn();await combat.nextTurn();await api.ongoing.reconcile();assert(!a.hasCondition('paralyzed'),'failure ends at caster next turn');
   }
   if(degree==='criticalFailure'){
    assert(a.hasCondition('paralyzed'),'critical failure Paralyzed');
    await combat.nextTurn();await combat.nextTurn();await api.ongoing.reconcile();
    let due=get().obligations.find(o=>o.recovery&&o.status==='pending');assert(due,'end-turn recovery is due');
    let recovery=await api.ongoing.request('roll',{castId:r.castId,actorUuid:a.uuid,obligationKey:due.key});await finalize(game.messages.get(recovery.cardId),['success']);
    const effect=await fromUuid(get().recipients[0].conditionUuid);assert(effect.system.duration.value===3,'success shortens original four-round duration');
    await combat.nextTurn();await combat.nextTurn();await api.ongoing.reconcile();due=get().obligations.find(o=>o.recovery&&o.status==='pending');
    recovery=await api.ongoing.request('roll',{castId:r.castId,actorUuid:a.uuid,obligationKey:due.key});await finalize(game.messages.get(recovery.cardId),['criticalSuccess']);assert(!a.hasCondition('paralyzed'),'critical-success recovery ends paralysis');
   }
   output.push({degree,castId:r.castId,cardId:card.id});await combat.delete();
  }return output;
 })],
 ['stunned','Verify Daze damage and confirmed Stunned action loss',()=>record('stunned-recovery',async()=>{
  const f=await setup('Daze'),a=await actor('Daze recipient'),t=await token(a),combat=await Combat.create({scene:scene.id,active:false});await combat.activate();
  await combat.createEmbeddedDocuments('Combatant',[{actorId:f.actor.id,tokenId:f.token.id,sceneId:scene.id,initiative:20},{actorId:a.id,tokenId:t.id,sceneId:scene.id,initiative:10}]);await combat.startCombat();
  const {card}=await api.saves.start(f.spell,{plan:await api.compile(f.spell),sourceActor:f.actor,targets:[t],dc:24,skipConfirmation:true});await finalize(card,['criticalFailure']);
  const save=card.getFlag(NS,'basicSaveState'),effect=await fromUuid(save.targets[0].effectUuids[0]),get=()=>api.ongoing.records().find(r=>r.castId===save.castId);
  assert(a.getCondition('stunned')?.value===1&&effect.system.duration.unit==='unlimited','Stunned is action debt, not a round timer');
  const hp=a.system.attributes.hp.value;assert(hp<100,'Daze damage applied');await combat.nextTurn();await api.ongoing.reconcile();
  assert(a.hasCondition('stunned')&&get().obligations.some(o=>o.kind==='stunned-reminder'),'action loss waits for confirmation');
  await api.ongoing.request('condition-actions-lost',{castId:save.castId,effectUuid:effect.uuid,lost:1});assert(!a.hasCondition('stunned'),'confirmed loss removes debt');
  let blocked=false;try{await api.ongoing.request('condition-actions-lost',{castId:save.castId,effectUuid:effect.uuid,lost:1});}catch{blocked=true;}assert(blocked&&a.system.attributes.hp.value===hp,'duplicate recovery cannot replay damage or action loss');
  await combat.delete();return{cardId:card.id,castId:save.castId,actorUuid:a.uuid};
 })],
 ['riders','Verify Timber and Arrow Salvo critical-failure conditions',()=>record('basic-condition-riders',async()=>{
  const output=[];
  for(const [name,slug] of [['Timber','dazzled'],['Arrow Salvo','prone']]){
   const f=await setup(name),a=await actor(`${name} recipient`),t=await token(a),combat=await Combat.create({scene:scene.id,active:false});await combat.activate();await combat.createEmbeddedDocuments('Combatant',[{actorId:f.actor.id,tokenId:f.token.id,sceneId:scene.id,initiative:20},{actorId:a.id,tokenId:t.id,sceneId:scene.id,initiative:10}]);await combat.startCombat();
   const {card}=await api.saves.start(f.spell,{plan:await api.compile(f.spell),sourceActor:f.actor,targets:[t],dc:24,skipConfirmation:true});await finalize(card,['criticalFailure']);
   assert(a.hasCondition(slug),'critical failure applies native '+slug);assert(a.system.attributes.hp.value<100,'damage confirmed');
   if(name==='Timber'){await combat.nextTurn();await api.ongoing.reconcile();assert(a.hasCondition('dazzled'),'Dazzled remains through recipient turn');await combat.nextTurn();await api.ongoing.reconcile();assert(!a.hasCondition('dazzled'),'Dazzled ends after recipient turn');}await combat.delete();output.push({name,cardId:card.id,actorUuid:a.uuid,condition:slug});
  }return output;
 })],
 ['evil-edges','Verify Evil Eye save branches, sight changes and missed Sustain',()=>record('evil-eye-edges',async()=>{
  const output=[];
  for(const degree of ['criticalSuccess','success','failure','criticalFailure']){
   const f=await setup('Evil Eye'),a=await actor(`Evil Eye ${degree}`),t=await token(a),r=await api.ongoing.start(f.spell,{targets:[t]}),get=()=>api.ongoing.records().find(x=>x.castId===r.castId);
   const card=game.messages.get(get().obligations[0].cardId);await finalize(card,[degree]);
   const expected={failure:1,criticalFailure:2}[degree]??0;assert((a.getCondition('sickened')?.value??0)===expected,'correct initial degree');
   if(expected){
    await api.ongoing.request('condition-visibility',{castId:r.castId,actorUuid:a.uuid,visible:true});await t.update({x:t.x+100});
    let blocked=false,error=null;try{await api.ongoing.request('roll',{castId:r.castId,actorUuid:a.uuid});}catch(e){error=e.message;blocked=/visibility/.test(e.message);}assert(blocked,'movement requires fresh sight ruling '+JSON.stringify({error,visible:get().recipients[0].visible,fingerprint:get().recipients[0].visibilityFingerprint,token:{x:t._source.x,y:t._source.y}}));
    await api.ongoing.request('condition-visibility',{castId:r.castId,actorUuid:a.uuid,visible:false});
    const recovery=await api.ongoing.request('roll',{castId:r.castId,actorUuid:a.uuid});await finalize(game.messages.get(recovery.cardId),['criticalSuccess']);assert(!a.hasCondition('sickened'),'not visible allows full recovery');
   }assert(get().status==='ended','resolved condition closes record');output.push({degree,castId:r.castId});
  }
  const f=await setup('Evil Eye'),a=await actor('Evil Eye missed Sustain'),t=await token(a),combat=await Combat.create({scene:scene.id,active:false});await combat.activate();
  await combat.createEmbeddedDocuments('Combatant',[{actorId:f.actor.id,tokenId:f.token.id,sceneId:scene.id,initiative:20},{actorId:a.id,tokenId:t.id,sceneId:scene.id,initiative:10}]);await combat.startCombat();
  const r=await api.ongoing.start(f.spell,{targets:[t]}),get=()=>api.ongoing.records().find(x=>x.castId===r.castId);await finalize(game.messages.get(get().obligations[0].cardId),['failure']);
  await combat.nextTurn();await combat.nextTurn();await combat.nextTurn();await api.ongoing.reconcile();
  assert(!get().spellActive&&a.getCondition('sickened')?.value===1,'missed Sustain releases floor but retains Sickened');
  await combat.delete();output.push({missedSustain:r.castId});return output;
 })],
 ['decay','Verify Agonizing Despair Frightened decay and overlap',()=>record('frightened-decay',async()=>{
  const f=await setup('Agonizing Despair'),a=await actor('Agonizing Despair recipient'),t=await token(a),combat=await Combat.create({scene:scene.id,active:false});await combat.activate();
  await combat.createEmbeddedDocuments('Combatant',[{actorId:f.actor.id,tokenId:f.token.id,sceneId:scene.id,initiative:20},{actorId:a.id,tokenId:t.id,sceneId:scene.id,initiative:10}]);await combat.startCombat();
  const independent=game.pf2e.ConditionManager.getCondition('frightened').toObject();delete independent._id;independent.system.value.value=3;
  const [other]=await a.createEmbeddedDocuments('Item',[independent]);
  const {card}=await api.saves.start(f.spell,{plan:await api.compile(f.spell),sourceActor:f.actor,targets:[t],dc:24,skipConfirmation:true});await finalize(card,['failure']);
  const effect=await fromUuid(card.getFlag(NS,'basicSaveState').targets[0].effectUuids[0]),grant=effect.actor.items.get(effect.flags.pf2e.itemGrants.condition1.id);
  assert(grant.value===2,'spell owns Frightened 2');const hp=a.system.attributes.hp.value;
  await combat.nextTurn();await combat.nextTurn();await api.ongoing.reconcile();assert(grant.value===1,'owned contribution reduced once');
  await api.ongoing.reconcile();assert(grant.value===1,'reconciliation does not replay reduction');
  await combat.nextTurn();await combat.nextTurn();await api.ongoing.reconcile();
  assert(!await fromUuid(effect.uuid),'recovered contribution removed');assert(other.value===3&&a.hasCondition('frightened'),'unrelated Frightened preserved');assert(a.system.attributes.hp.value===hp,'damage not replayed');
  await combat.delete();return{cardId:card.id,actorUuid:a.uuid,unrelatedCondition:other.uuid};
 })],
 ['ice','Verify Clinging Ice damage, speed penalties and Sustain expiry',()=>record('clinging-ice',async()=>{
  const output=[];
  for(const [degree,penalty] of [['failure',5],['criticalFailure',10]]){
   const f=await setup('Clinging Ice'),a=await actor(`Clinging Ice ${degree}`),t=await token(a);
   await a.update({'system.attributes.speed.value':25});
   const combat=await Combat.create({scene:scene.id,active:false});await combat.activate();
   await combat.createEmbeddedDocuments('Combatant',[{actorId:f.actor.id,tokenId:f.token.id,sceneId:scene.id,initiative:20},{actorId:a.id,tokenId:t.id,sceneId:scene.id,initiative:10}]);await combat.startCombat();
   const r=await api.ongoing.start(f.spell,{targets:[t]}),get=()=>api.ongoing.records().find(x=>x.castId===r.castId),card=game.messages.get(get().obligations[0].cardId);
   await finalize(card,[degree]);assert(a.system.movement.speeds.land.value===25-penalty,'native speed penalty '+JSON.stringify(a.system.movement.speeds.land));
   const hp=a.system.attributes.hp.value;assert(hp<100,'initial cold damage');
   await combat.nextTurn();await combat.nextTurn();await api.ongoing.reconcile();
   await api.ongoing.request('sustain',{castId:r.castId});assert(a.system.attributes.hp.value===hp,'Sustain does not repeat initial damage');
   await combat.nextTurn();await combat.nextTurn();await combat.nextTurn();await api.ongoing.reconcile();
   assert(get().status==='ended'&&a.system.movement.speeds.land.value===25,'missed Sustain removes native speed penalty');
   output.push({degree,castId:r.castId,cardId:card.id,hp});await combat.delete();
  }return output;
 })],
 ['blindness','Verify Blindness next-turn expiry and temporary immunity',()=>record('blindness',async()=>{
  const f=await setup('Blindness'),a=await actor('Blindness recipient'),t=await token(a),combat=await Combat.create({scene:scene.id,active:false});await combat.activate();
  await combat.createEmbeddedDocuments('Combatant',[{actorId:f.actor.id,tokenId:f.token.id,sceneId:scene.id,initiative:20},{actorId:a.id,tokenId:t.id,sceneId:scene.id,initiative:10}]);await combat.startCombat();
  const plan=await api.compile(f.spell),{card}=await api.saves.start(f.spell,{plan,sourceActor:f.actor,targets:[t],dc:24,skipConfirmation:true});await finalize(card,['success']);
  assert(a.hasCondition('blinded'),'Blinded before target upcoming turn');
  await combat.nextTurn();await api.ongoing.reconcile();assert(!a.hasCondition('blinded'),'expires at upcoming target turn, not one full round later');
  const immune=a.itemTypes.effect.find(e=>e.getFlag(NS,'spellImmunity')?.key==='blindness');assert(immune,'immunity created on success');
  const repeated=await api.saves.start(f.spell,{plan,sourceActor:f.actor,targets:[t],dc:24,skipConfirmation:true});assert(repeated.card.getFlag(NS,'basicSaveState').targets[0].eligible===false,'repeated cast is unaffected while immune');
  await api.saves.finalize(repeated.card);await combat.delete();for(const other of game.combats.filter(c=>c.active))await other.update({active:false});await game.time.advance(61);await api.ongoing.reconcile({clockEvent:true});assert(!await fromUuid(immune.uuid),'immunity expires '+JSON.stringify({combat:game.combat?.id,effect:(await fromUuid(immune.uuid))?.toObject(),records:api.ongoing.records().filter(r=>r.name==='Blindness')}));
  const later=await api.saves.start(f.spell,{plan,sourceActor:f.actor,targets:[t],dc:24,skipConfirmation:true});assert(later.card.getFlag(NS,'basicSaveState').targets[0].eligible===true,'eligible after immunity');
  await finalize(later.card,['criticalSuccess']);assert(a.itemTypes.effect.some(e=>e.getFlag(NS,'spellImmunity')?.key==='blindness'),'immunity also applies on critical success');
  return{cardId:card.id,repeatCard:repeated.card.id,laterCard:later.card.id,actorUuid:a.uuid};
 })],
 ['fear','Verify Fear decay and separate Fleeing expiry',()=>record('fear',async()=>{
  const f=await setup('Fear'),a=await actor('Fear recipient'),t=await token(a),combat=await Combat.create({scene:scene.id,active:false});await combat.activate();
  await combat.createEmbeddedDocuments('Combatant',[{actorId:f.actor.id,tokenId:f.token.id,sceneId:scene.id,initiative:20},{actorId:a.id,tokenId:t.id,sceneId:scene.id,initiative:10}]);await combat.startCombat();
  const r=await api.ongoing.start(f.spell,{targets:[t],castRank:1}),get=()=>api.ongoing.records().find(x=>x.castId===r.castId);
  await finalize(game.messages.get(get().obligations[0].cardId),['criticalFailure']);assert(a.getCondition('frightened')?.value===3&&a.hasCondition('fleeing'),'critical failure applies both conditions');
  await combat.nextTurn();await api.ongoing.reconcile();assert(a.getCondition('frightened')?.value===3,'no early decay');
  await combat.nextTurn();await api.ongoing.reconcile();assert(a.getCondition('frightened')?.value===2&&!a.hasCondition('fleeing'),'end-turn decay distinct from one-round Fleeing '+JSON.stringify({frightened:a.getCondition('frightened')?.value,fleeing:a.hasCondition('fleeing'),record:get(),clock:{id:game.combat?.id,round:game.combat?.round,turn:game.combat?.turn,roster:game.combat?.turns.map(c=>c.id+':'+c.actor?.uuid+':'+c.initiative)},expectedCombat:combat.id,effects:a.itemTypes.effect.map(e=>({id:e.id,start:e.system.start,duration:e.system.duration,expired:e.isExpired}))}));
  for(let i=0;i<4;i++){await combat.nextTurn();await api.ongoing.reconcile();}
  assert(!a.hasCondition('frightened'),'three native reductions finish Fear');await combat.delete();return{...r,final:get()};
 })],
 ['evil','Verify Evil Eye floor, recovery and spell ending',()=>record('evil-eye',async()=>{
  const f=await setup('Evil Eye'),a=await actor('Evil Eye recipient'),t=await token(a),r=await api.ongoing.start(f.spell,{targets:[t]});
  const get=()=>api.ongoing.records().find(x=>x.castId===r.castId);
  await finalize(game.messages.get(get().obligations[0].cardId),['criticalFailure']);
  assert(a.getCondition('sickened')?.value===2,'critical failure Sickened 2');
  await api.ongoing.request('condition-visibility',{castId:r.castId,actorUuid:a.uuid,visible:true});
  let recovery=await api.ongoing.request('roll',{castId:r.castId,actorUuid:a.uuid});
  await finalize(game.messages.get(recovery.cardId),['criticalSuccess']);
  assert(a.getCondition('sickened')?.value===1,'sight floor limits critical-success recovery to 1');
  await a.decreaseCondition('sickened');assert(a.getCondition('sickened')?.value===1,'native decrement cannot bypass floor');
  await api.ongoing.request('sustain',{castId:r.castId});
  await api.ongoing.request('end',{castId:r.castId});
  assert(a.getCondition('sickened')?.value===1&&!get().spellActive,'ending releases floor without curing Sickened');
  recovery=await api.ongoing.request('roll',{castId:r.castId,actorUuid:a.uuid});
  await finalize(game.messages.get(recovery.cardId),['success']);
  assert(!a.hasCondition('sickened'),'normal recovery after ending');
  saved.cases.evil={...r,actorUuid:a.uuid};return{...r,final:get()};
 })],
 ['enfeeble','Verify Enfeeble and Stupefy outcomes',()=>record('condition-outcomes',async()=>{const out=[];for(const [name,slug]of [['Enfeeble','enfeebled'],['Stupefy','stupefied']]){const f=await setup(name),targets=[];for(let i=0;i<4;i++)targets.push(await token(await actor(`${name} degree ${i}`)));const combat=await Combat.create({scene:scene.id,active:false});await combat.activate();await combat.createEmbeddedDocuments('Combatant',[{actorId:f.actor.id,tokenId:f.token.id,sceneId:scene.id,initiative:20},...targets.map((t,i)=>({actorId:t.actor.id,tokenId:t.id,sceneId:scene.id,initiative:10-i}))]);await combat.startCombat();const {card}=await api.saves.start(f.spell,{plan:await api.compile(f.spell),sourceActor:f.actor,targets,dc:24,skipConfirmation:true});await finalize(card,['criticalSuccess','success','failure','criticalFailure']);const values=targets.map(t=>t.actor.getCondition(slug)?.value??0);assert(JSON.stringify(values)===JSON.stringify(name==='Enfeeble'?[0,1,2,3]:[0,1,2,3]),`${name} values ${values}`);const state=card.getFlag(NS,'basicSaveState'),effects=await Promise.all(state.targets.flatMap(t=>t.effectUuids??[]).map(u=>fromUuid(u)));assert(effects.length===3,'three wrappers');assert(effects.every(e=>e.getFlag(NS,'outcomeEffect').sourceActorUuid===f.actor.uuid),'caster identity retained');out.push({name,cardId:card.id,values,effects:effects.map(e=>({uuid:e.uuid,duration:e.system.duration,start:e.system.start}))});saved.cases[name]={actorUuid:f.actor.uuid,tokenUuid:f.token.uuid,spellUuid:f.spell.uuid,cardId:card.id,targetUuids:targets.map(t=>t.uuid)};await combat.delete();}return out;})],
 ['turn','Verify Enfeeble success expires at caster next turn',()=>record('caster-turn-expiry',async()=>{const f=await setup('Enfeeble'),a=await actor('Enfeeble turn target'),t=await token(a),combat=await Combat.create({scene:scene.id,active:false});await combat.activate();await combat.createEmbeddedDocuments('Combatant',[{actorId:f.actor.id,tokenId:f.token.id,sceneId:scene.id,initiative:20},{actorId:a.id,tokenId:t.id,sceneId:scene.id,initiative:10}]);await combat.startCombat();const {card}=await api.saves.start(f.spell,{plan:await api.compile(f.spell),sourceActor:f.actor,targets:[t],dc:24,skipConfirmation:true});await finalize(card,['success']);assert(a.getCondition('enfeebled')?.value===1,'condition initially applied');await combat.nextTurn();await api.ongoing.reconcile();assert(a.getCondition('enfeebled')?.value===1,'retained at recipient turn');await combat.nextTurn();await api.ongoing.reconcile();assert(!a.hasCondition('enfeebled'),'removed at next caster turn');await combat.delete();return{cardId:card.id,actor:a.uuid};})]
 ];
 const d=new foundry.applications.api.DialogV2({window:{title:'Coverage verification controls'},position:{width:700},content:actions.map(([id,label])=>`<button type="button" data-check="${id}">${label}</button>`).join(''),buttons:[{action:'close',label:'Close controls'}]});await d.render(true);d.element.querySelectorAll('[data-check]').forEach(b=>b.addEventListener('click',async()=>{await d.close();await actions.find(([id])=>id===b.dataset.check)[2]();}));
}
