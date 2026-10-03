#!/usr/bin/env node
// Corpus-wide regression checks. Test fixture names here are not runtime dispatch.
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan,isExecutableLingeringPlan,isExecutableStoredTriggerPlan} from '../scripts/basic-save-core.js';
const [contentRoot,reportPath,baselinePath]=process.argv.slice(2);
if(!contentRoot||!reportPath||!baselinePath)throw Error('Pass official fixture root, compiled report, and pre-batch snapshot.');
const audit=JSON.parse(await readFile('reports/phase-spell-batches/speed-cross-family-audit.json','utf8'));
const report=JSON.parse(await readFile(reportPath,'utf8'));
const baseline=JSON.parse(await readFile(baselinePath,'utf8'));
const oldIds=new Set(baseline.supported.map(p=>p.id));
// New routes are allowed only for spells recorded by an audited batch after
// this family's baseline (this batch's own additions plus later batches).
const progress=JSON.parse(await readFile('docs/planning/phase-batch-progress.json','utf8'));
const speedBatch=progress.batches.findIndex(b=>b.verification.endsWith('phase-2-3-speed-family.md'));
const allowedNew=new Set(progress.batches.slice(speedBatch).flatMap(b=>b.spellIds));
const newly=report.plans.filter(p=>inspectSavePlan(p).supported&&!oldIds.has(p.source.id));
assert.deepEqual(newly.filter(p=>!allowedNew.has(p.source.id)).map(p=>p.source.name),[],'Only audited complete spells may gain executable save routes');
// A lost route is accepted only when documented as an intentional withdrawal.
const withdrawn=new Set(JSON.parse(await readFile('docs/planning/withdrawn-routes.json','utf8')).withdrawn.map(w=>w.id));
for(const p of report.plans)if(oldIds.has(p.source.id)&&!withdrawn.has(p.source.id))assert(inspectSavePlan(p).supported,`Existing route regressed: ${p.source.name}`);
const catalog=new Map();
async function files(root){const out=[];for(const entry of await readdir(root,{withFileTypes:true})){const p=path.join(root,entry.name);if(entry.isDirectory())out.push(...await files(p));else if(entry.name.endsWith('.json'))out.push(p);}return out;}
for(const file of await files(path.join(contentRoot,'spell-effects'))){
 const e=JSON.parse(await readFile(file,'utf8')),rules=e.system.rules??[];
 catalog.set(e.name,{id:e._id,name:e.name,type:e.type,sourceFile:path.relative(contentRoot,file),automation:{ruleKeys:[...new Set(rules.map(r=>r.key).filter(Boolean))],requiresConfiguration:rules.some(r=>r.key==='ChoiceSet'),removesAfterRoll:rules.some(r=>r.removeAfterRoll!=null)},mechanics:{rules,duration:e.system.duration??null,start:e.system.start??null}});
}
const unique=new Map(audit.families.flatMap(f=>f.members.map(m=>[m.id,m]))),results=[];
for(const m of unique.values()){
 const item=JSON.parse(await readFile(path.join(contentRoot,m.sourceFile),'utf8'));
 const p=compileAbility(item,{nativeEffectCatalog:catalog,sourceFile:m.sourceFile});
 const actual=inspectSavePlan(p).supported;
 // An audited lingering area is resolved by the ongoing workflow, never as a one-time save.
 if(allowedNew.has(m.id)&&isExecutableLingeringPlan(p))assert.equal(actual,false,`${m.name}: lingering areas are not one-time saves`);
 // An audited stored-trigger spell saves only when its trigger happens, through the ongoing workflow.
 else if(allowedNew.has(m.id)&&isExecutableStoredTriggerPlan(p))assert.equal(actual,false,`${m.name}: stored triggers are not one-time saves`);
 // An audited spell on a route that isn't a save (a note, Effect + note, a generated Effect) never gets a one-time save.
 else if(allowedNew.has(m.id)&&!oldIds.has(m.id)&&p.resolution?.kind!=='save')assert.equal(actual,false,`${m.name}: non-save routes are not one-time saves`);
 // An audited spell resolved through its PF2e variants (Boneshaker's 2- and 3-action versions): the base card isn't a save of its own.
 else if(allowedNew.has(m.id)&&!oldIds.has(m.id)&&!actual&&(report.plans.find(x=>x.source.id===m.id)?.variantPlans??[]).some(v=>inspectSavePlan(v).supported))assert.ok(true);
 // A documented withdrawal (docs/planning/withdrawn-routes.json) overrides both the baseline and a later batch's audit.
 else assert.equal(actual,(oldIds.has(m.id)||allowedNew.has(m.id))&&!withdrawn.has(m.id),`${m.name}: full-family route expectation`);
 item.name='Detached family fixture';item._id='detachedFixture01';item.system.slug='detached-family-fixture';delete item._stats?.compendiumSource;
 const detached=compileAbility(item,{nativeEffectCatalog:catalog});
 assert.equal(inspectSavePlan(detached).supported,actual,`${m.name}: source identity must not control shared save routing`);
 results.push({id:m.id,name:m.name,families:m.families,supported:actual,detachedSupported:actual,passed:true});
}
const output={at:new Date().toISOString(),passed:true,uniqueMembers:results.length,baselineSharedSaves:oldIds.size,newlySupported:newly.map(p=>p.source.name),familyResults:audit.families.map(f=>({id:f.id,total:f.members.length,passed:f.members.length})),members:results};
await writeFile('docs/verification/phase-2-3-speed-corpus-results.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({...output,members:undefined},null,2));
