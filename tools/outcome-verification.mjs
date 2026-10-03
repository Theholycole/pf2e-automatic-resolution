// Explicitly invoked disposable-world live evidence, never imported by production.
import { confirmedDamageSummary } from '../scripts/native-damage-receipt.js';
const NS='pf2e-automatic-resolution',KEY='outcomeVerification';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const assert=(v,m)=>{if(!v)throw Error(`FAIL: ${m}`);};
const state=c=>c.getFlag(NS,'basicSaveState');
export async function run(macro){
 if(game.world.id!=='pftest'||!game.user.isGM)throw Error('Disposable pftest GM only');
 const api=game.modules.get(NS).api;
 const saved=macro.getFlag(NS,KEY)??{results:[],cases:{}};
 const persist=()=>macro.setFlag(NS,KEY,saved);
 const show=data=>new foundry.applications.api.DialogV2({window:{title:'Outcome verification report'},position:{width:800},content:`<pre style="white-space:pre-wrap;max-height:65vh;overflow:auto">${esc(JSON.stringify(data,null,2))}</pre>`,buttons:[{action:'close',label:'Close report'}]}).render(true);
 const record=async(label,fn)=>{try{const details=await fn();saved.results.push({label,passed:true,at:new Date().toISOString(),details});}catch(e){saved.results.push({label,passed:false,error:e.message,stack:e.stack});}await persist();show(saved.results.at(-1));};
 const create=async(name,traits=['humanoid'])=>Actor.create({name:`PFTEST Outcomes ${name}`,type:'npc',system:{details:{level:{value:5}},attributes:{hp:{value:500,max:500},ac:{value:20}},saves:{fortitude:{value:10},reflex:{value:10},will:{value:10}},traits:{value:traits}}});
 const prepare=async(key,name,rank,actors)=>{
  const baseline=game.macros.get('mmDfXh9LdjNWFsBn').getFlag(NS,'correctionVerification');
  const caster=game.actors.get(baseline.casterId),scene=game.scenes.get(baseline.sceneId);
  const targets=[];for(const actor of actors){const [token]=await scene.createEmbeddedDocuments('Token',[{...actor.prototypeToken.toObject(),actorId:actor.id,actorLink:true,x:100+targets.length*150,y:900}]);targets.push(token);}
  const pack=game.packs.get('pf2e.spells-srd'),index=await pack.getIndex(),native=await pack.getDocument(index.find(i=>i.name===name)._id);
  const source=native.toObject();delete source._id;source.system.location={value:baseline.entryId};
  const [spell]=await caster.createEmbeddedDocuments('Item',[source]);
  const plan=await api.compile(spell);assert(api.saves.supports(plan),'executable spell');
  const message=await spell.toMessage(null,{create:true});
  const {card}=await api.saves.start(spell,{plan,sourceActor:caster,targets,dc:24,castRank:rank,sourceMessageId:message.id,skipConfirmation:true});
  saved.cases[key]={cardId:card.id,actorIds:actors.map(a=>a.id),rank,spellUuid:spell.uuid};await persist();return card;
 };
 const correct=(c,i,action,extra={})=>api.saves.correctTarget(c,state(c).targets[i].id,{action,...extra});
 const roll=async(c,i,degree)=>{await api.saves.rollSave(c,state(c).targets[i].id,{skipDialog:true});await correct(c,i,'degree',{degree});};
 const snapshot=c=>({cardId:c.id,state:state(c),total:confirmedDamageSummary(state(c))});
 const actions=[
 ['noise','Run Noise Blast mixed IWR and overkill',()=>record('noise-iwr',async()=>{
  const actors=await Promise.all(['resist','weak','immune','overkill'].map(n=>create(n)));
  await actors[0].update({'system.attributes.resistances':[{type:'sonic',value:3,exceptions:[],doubleVs:[]}]});
  await actors[1].update({'system.attributes.weaknesses':[{type:'sonic',value:5,exceptions:[]}]});
  await actors[2].update({'system.attributes.immunities':[{type:'sonic',exceptions:[]}]});
  await actors[3].update({'system.attributes.hp.value':1,'system.attributes.hp.temp':2});
  const card=await prepare('noise','Noise Blast',3,actors);
  for(const [i,d]of ['success','failure','failure','criticalFailure'].entries())await roll(card,i,d);
  await correct(card,1,'condition',{conditionIndex:0,changes:{duration:{mode:'fixed',value:2,unit:'rounds',expiry:'turn-end',anchor:'target-turn'}}});
  await api.saves.finalize(card);const s=state(card),raw=s.damage.total,expected=[Math.max(0,Math.floor(raw/2)-3),raw+5,0,raw*2];
  assert(/3d10/.test(s.damage.formula),'heightened 3d10');
  assert(JSON.stringify(s.targets.map(t=>t.damageResults[0]?.receipt.damage))===JSON.stringify(expected),'confirmed native adjustments');
  assert(confirmedDamageSummary(s).damage===expected.reduce((a,b)=>a+b,0),'group total');
  assert(actors[3].system.attributes.hp.value===0&&actors[3].system.attributes.hp.temp===0,'overkill consumes 2 temp and 1 HP');
  const effect=actors[1].items.find(i=>i.getFlag(NS,'outcomeEffect')?.castId===s.castId);
  assert(effect.system.duration.value===2&&effect.system.duration.expiry==='turn-end','adjusted native duration');
  return{...snapshot(card),expected,remainingHP:actors.map(a=>a.system.attributes.hp.value)};
 })],
 ['blood','Prepare Reblooded correction UI',()=>record('blood-prepared',async()=>{
  const actor=await create('undead overlap',['undead']);
  const existing=game.pf2e.ConditionManager.getCondition('clumsy').toObject();existing.system.value.value=1;const [condition]=await actor.createEmbeddedDocuments('Item',[existing]);saved.unrelatedCondition=condition.uuid;
  const card=await prepare('blood','Reblooded',3,[actor]);await roll(card,0,'failure');return snapshot(card);
 })],
 ['blood-finish','Verify correction and overlapping casts',()=>record('blood-overlap',async()=>{
  const card=game.messages.get(saved.cases.blood.cardId),actor=game.actors.get(saved.cases.blood.actorIds[0]);
  assert(state(card).targets[0].conditionOverrides?.[0]?.changes.value===3,'UI clumsy value 3 saved');
  await api.saves.finalize(card);assert(confirmedDamageSummary(state(card)).damage===0,'persistent excluded from total');
  const first=state(card).targets[0].effectUuids;assert(first.length===1,'first cast wrapper');
  const second=await prepare('blood2','Reblooded',5,[actor]);await roll(second,0,'criticalFailure');await api.saves.finalize(second);
  assert(state(second).targets[0].damageResults[0].formula.includes('3d6'),'Reblooded has no heightened damage change');
  assert(actor.items.filter(i=>i.getFlag(NS,'outcomeEffect')).length===2,'separate cast contributions');
  assert(actor.getCondition('clumsy').value===3,'native highest condition wins');
  const before=actor.items.filter(i=>i.type==='condition').map(i=>({uuid:i.uuid,slug:i.slug,value:i.value,grantedBy:i.flags.pf2e?.grantedBy}));
  await (await fromUuid(first[0])).delete();
  assert(await fromUuid(saved.unrelatedCondition),'unrelated condition preserved');
  assert(await fromUuid(state(second).targets[0].effectUuids[0]),'second cast survives');
  assert(actor.getCondition('clumsy').value===2,'remaining cast determines condition value');
  const after=actor.items.filter(i=>i.type==='condition').map(i=>({uuid:i.uuid,slug:i.slug,value:i.value,grantedBy:i.flags.pf2e?.grantedBy}));
  return{first:snapshot(card),second:snapshot(second),before,after,hp:actor.system.attributes.hp.value};
 })],
 ['safety','Run blocked and interrupted application checks',()=>record('safety',async()=>{
  const actors=await Promise.all(['confirmed partial','interrupted partial'].map(n=>create(n)));
  const card=await prepare('partial','Noise Blast',2,actors);
  await roll(card,0,'failure');await roll(card,1,'failure');
  // A missing saved token is a known blocker and must stop all recipients.
  const token=await fromUuid(state(card).targets[1].tokenUuid),source=token.toObject();await token.delete();
  let blocked;try{await api.saves.finalize(card);}catch(e){blocked=e.message;}
  assert(blocked?.includes('token')&&actors.every(a=>a.system.attributes.hp.value===500),'block before any damage');
  await token.parent.createEmbeddedDocuments('Token',[source],{keepId:true});
  const original=actors[1].applyDamage;actors[1].applyDamage=async()=>{throw Error('Injected uncertain application boundary');};
  let interrupted;try{await api.saves.finalize(card);}catch(e){interrupted=e.message;}finally{actors[1].applyDamage=original;}
  assert(interrupted?.includes('Injected'),'injected failure reached');const s=state(card),total=confirmedDamageSummary(s);
  assert(s.status==='review'&&total.incomplete&&total.damage===s.damage.total,'confirmed partial subtotal retained');
  assert(card.content.includes('incomplete confirmed subtotal'),'visible incomplete label');
  const before=actors.map(a=>a.system.attributes.hp.value);let replay;try{await api.saves.finalize(card);}catch(e){replay=e.message;}
  assert(replay&&JSON.stringify(before)===JSON.stringify(actors.map(a=>a.system.attributes.hp.value)),'no uncertain replay');
  const fresh=await prepare('duplicate','Noise Blast',2,[await create('duplicate guard')]);await roll(fresh,0,'failure');
  const duplicate=await Promise.allSettled([api.saves.finalize(fresh),api.saves.finalize(fresh)]);
  assert(duplicate[0].status==='fulfilled'&&duplicate[1].status==='rejected','duplicate finalization locked');
  assert(game.messages.filter(m=>m.getFlag(NS,'saveResult')?.castId===state(fresh).castId).length===1,'one result');
  return{blocked,interrupted,partial:snapshot(card),duplicate:snapshot(fresh)};
 })],
 ['report','Show outcome evidence',()=>show(saved)]
 ];
 new foundry.applications.api.DialogV2({window:{title:'Outcome verification controls'},position:{width:600},content:'<p>Explicit disposable pftest checks. Prepare Reblooded, adjust clumsy to 3 and duration to 2 rounds using GM controls, then run overlap verification.</p>',buttons:actions.map(([action,label,callback])=>({action,label,callback}))}).render(true);
}
