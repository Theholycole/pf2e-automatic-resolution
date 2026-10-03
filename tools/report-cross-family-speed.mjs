#!/usr/bin/env node
// Planning audit only: names/IDs below are output and test fixture identity, never dispatch.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {analyzeDescription} from '../src/compiler/description-parser.js';
const [reportPath,contentRoot,baselinePath]=process.argv.slice(2);
if(!reportPath||!contentRoot||!baselinePath)throw Error('Pass compiler report, official content root, and pre-batch supported-plan snapshot.');
const compiled=JSON.parse(await readFile(reportPath,'utf8'));
const baseline=JSON.parse(await readFile(baselinePath,'utf8'));
const before=new Set(baseline.supported.map(p=>p.id));
const census=JSON.parse(await readFile('reports/spell-enablement.json','utf8'));
const routes=new Map(census.rows.map(row=>[row.id,row]));
const catalog=JSON.parse(await readFile('reports/phase-spell-batches/catalog.json','utf8'));
const phases=new Map(catalog.batches.flatMap(b=>b.memberIds.map(id=>[id,b.phase])));
const textOf=source=>String(source.system.description.value).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const families=[
    {id:'speed-penalty',title:'Speed penalties',definition:'All nonritual, non-review source descriptions with explicit penalty/penalties/reduction to Speed wording, including possessives and all-Speeds variants (preambles and non-save workflows included).',match:(p,t)=>/\b(?:penalty|penalties|reduction) to (?:(?:all|of|its|their|his|her|your|the|target['’]s|creature['’]s|a)\s+){0,5}Speeds?\b/i.test(t)},
    {id:'damage-condition',title:'Saving throws combining direct damage and conditions',definition:'Primary saves with structured nonpersistent damage and at least one outcome condition.',match:p=>p.resolution.kind==='save'&&p.resolution.sharedDamage?.components?.some(c=>c.category!=='persistent'&&c.type!=='bleed')&&Object.values(p.resolution.outcomes).some(o=>o.effects?.length)},
    {id:'timed-condition',title:'Saving throws with fixed or turn-boundary conditions',definition:'Primary saves with an outcome condition whose compiled duration is fixed or turn-boundary.',match:p=>p.resolution.kind==='save'&&Object.values(p.resolution.outcomes).some(o=>o.effects?.some(e=>['fixed','turn-boundary'].includes(e.duration?.mode)))},
    {id:'inherited-duration',title:'Inherited save outcomes referring to an existing duration',definition:'Source save-degree clauses with an explicit As [degree] clause and a reference to the duration of the inherited effect or spell in that outcome.',match:(p,t,s)=>Object.values(analyzeDescription(s.system.description.value).sections).some(o=>/^As (?:critical )?(?:failure|success)\b/i.test(o.text??'')&&/\bfor (?:(?:(?:the |this |its |the spell['’]?s |spell['’]?s |the rest of (?:the )?spell['’]?s )?duration)|the duration of (?:the )?(?:spell|effect))\b/i.test(o.text??''))}
];
const members=new Map();
for(const p of compiled.plans){
    if(routes.get(p.source.id)?.ritual||phases.get(p.source.id)===9||!routes.has(p.source.id))continue;
    const source=JSON.parse(await readFile(path.join(contentRoot,p.source.sourceFile),'utf8'));
    const text=textOf(source),groupIds=families.filter(f=>f.match(p,text,source)).map(f=>f.id);
    if(!groupIds.length)continue;
    const assessment=inspectSavePlan(p),route=routes.get(p.source.id);
    members.set(p.source.id,{id:p.source.id,name:p.source.name,phase:phases.get(p.source.id),sourceFile:p.source.sourceFile,families:groupIds,route:route.route,enabledRoute:route.enabledRoute,sharedSave:assessment.supported,previousSharedSave:before.has(p.source.id),blockers:[...new Set([...(p.automation.pendingCapabilities??[]),...assessment.blockers.filter(b=>b.code!=='compiler-gap').map(b=>b.code)])],compiledSpeedDegrees:Object.entries(p.resolution.outcomes??{}).filter(([,o])=>o.modifiers?.length).map(([d])=>d)});
}
const current=compiled.plans.filter(p=>inspectSavePlan(p).supported);
const newlySupported=current.filter(p=>!before.has(p.source.id)).map(p=>({id:p.source.id,name:p.source.name}));
const currentIds=new Set(current.map(p=>p.source.id));
// A lost route is accepted only when documented as an intentional withdrawal.
const withdrawn=new Set(JSON.parse(await readFile('docs/planning/withdrawn-routes.json','utf8')).withdrawn.map(w=>w.id));
const regressions=baseline.supported.filter(p=>!currentIds.has(p.id)&&!withdrawn.has(p.id));
assert.equal(regressions.length,0,`Lost existing executable save routes: ${JSON.stringify(regressions)}`);
const rows=[...members.values()].sort((a,b)=>a.name.localeCompare(b.name));
const groups=families.map(({match,...f})=>({...f,members:rows.filter(r=>r.families.includes(f.id))}));
const output={generatedAt:compiled.generatedAt,baseline:baseline.generatedAt,scope:'All source-derived members of four overlapping families; excludes rituals and deferred Phase 9 review list. Route assessment is not live execution.',uniqueMembers:rows.length,executableSharedSaves:current.length,newlySupported,regressions,families:groups};
await writeFile('reports/phase-spell-batches/speed-cross-family-audit.json',JSON.stringify(output,null,2)+'\n');
const cell=s=>String(s).replaceAll('|','/');
let md='# Speed, damage, conditions and lifetime family audit\n\n';
md+=`Snapshot: ${compiled.generatedAt}. **${rows.length} unique spells** across four overlapping families. All members were compiled and checked by the production save capability gate. This is automated route/semantic coverage, not a claim that every member was live-tested. The 51 Phase 9 review spells remain deferred.\n\n`;
md+=`New executable shared saves: ${newlySupported.map(p=>p.name).join(', ')||'none'}. Existing shared-save regressions: ${regressions.length}. Total executable shared saves: ${current.length}.\n\n`;
md+='See [live and automated verification](../../docs/verification/phase-2-3-speed-family.md) for the tested mechanical matrix. Blocked members retain all outstanding rules; recognizing one modifier never authorizes a partial save application.\n\n';
for(const f of groups){
 md+=`## ${f.title}\n\n${f.definition}\n\n${f.members.length} members; ${f.members.filter(m=>m.enabledRoute).length} enabled routes (may be partial); ${f.members.filter(m=>m.sharedSave).length} executable shared saves.\n\n| Spell | Primary phase | Route | Shared save | Remaining gaps |\n| --- | --- | --- | --- | --- |\n`;
 for(const m of f.members)md+=`| ${cell(m.name)} | ${m.phase} | ${m.route} | ${m.sharedSave?'Supported':'Blocked'} | ${cell(m.blockers.join('; ')||'—')} |\n`;
 md+='\n';
}
await writeFile('reports/phase-spell-batches/speed-cross-family-audit.md',md);
console.log(JSON.stringify({uniqueMembers:rows.length,newlySupported,regressions,families:groups.map(f=>({id:f.id,total:f.members.length,sharedSaves:f.members.filter(m=>m.sharedSave).length}))},null,2));
