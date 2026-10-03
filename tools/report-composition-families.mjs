#!/usr/bin/env node
// Planning evidence: source-derived family membership, never runtime dispatch.
import {readFile,writeFile} from 'node:fs/promises';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
const path=process.argv[2];
if(!path)throw Error('Pass a freshly compiled official spell report.');
const compiled=JSON.parse(await readFile(path,'utf8'));
const census=JSON.parse(await readFile('reports/spell-enablement.json','utf8'));
const routes=new Map(census.rows.map(row=>[row.id,row]));
const persistent=component=>component.category==='persistent'||component.type==='bleed';
const families=[
    {id:'direct-persistent',title:'Direct and persistent damage',matches:plan=>{
        const components=plan.resolution.sharedDamage?.components??[];
        return components.some(persistent)&&components.some(component=>!persistent(component));
    }},
    {id:'inline-persistent',title:'Inline damage with persistent outcomes',matches:plan=>{
        const components=plan.resolution.sharedDamage?.components??[];
        return components.length>0&&components.every(component=>!persistent(component))
            && plan.compilerEvidence?.inlineDamage>0
            && Object.values(plan.resolution.outcomes??{}).some(outcome=>/\bpersistent\b|\bbleed\b/i.test(outcome.rawText??''));
    }},
    {id:'save-native-effect',title:'Saving throws with linked native Effects',matches:plan=>Object.values(plan.resolution.outcomes??{}).some(outcome=>outcome.nativeEffects?.length)}
].map(({matches,...family})=>({...family,members:compiled.plans.filter(plan=>plan.resolution.kind==='save'&&matches(plan)).map(plan=>({
    id:plan.source.id,name:plan.source.name,sourceFile:plan.source.sourceFile,
    enabledRoute:routes.get(plan.source.id)?.enabledRoute??false,route:routes.get(plan.source.id)?.route??'disabled',
    assessment:inspectSavePlan(plan),compilerPending:plan.automation.pendingCapabilities??[]
})).sort((a,b)=>a.name.localeCompare(b.name))}));
const output={compilerGeneratedAt:compiled.generatedAt,routeGeneratedAt:census.generatedAt,families};
const cell=value=>String(value).replaceAll('|','/').replaceAll('\n',' ');
let md='# Outcome composition family audit\n\n';
md+=`Compiler snapshot: ${compiled.generatedAt}. These structural families are derived from spell data; this is a full membership audit of these shapes, not all spells sharing a narrative theme.\n\n`;
md+='Every listed spell is recompiled and assessed by the same capability checks that control shared save execution. An available dedicated or native Effect route may still differ from shared save support. Live verification scope is recorded in the [composition report](../../docs/verification/phase-2-composition.md) and [inline damage / linked recovery report](../../docs/verification/phase-2-3-inline-family.md). Counts below are route availability, not verified completion.\n\n';
for(const family of families){
    md+=`## ${family.title}\n\n${family.members.length} spells; ${family.members.filter(row=>row.enabledRoute).length} enabled routes; ${family.members.filter(row=>row.assessment.supported).length} executable shared save plans.\n\n`;
    md+='| Spell | Current route | Shared save support | Remaining compiler / execution gaps |\n| --- | --- | --- | --- |\n';
    for(const row of family.members){
        const gaps=[...new Set([...row.compilerPending,...row.assessment.blockers.filter(b=>b.code!=='compiler-gap').map(b=>b.code)])];
        md+=`| ${cell(row.name)} | ${cell(row.route)} | ${row.assessment.supported?'Supported':'Blocked'} | ${cell(gaps.join('; ')||'—')} |\n`;
    }
    md+='\n';
}
await writeFile('reports/phase-spell-batches/composition-family-audit.json',JSON.stringify(output,null,2)+'\n');
await writeFile('reports/phase-spell-batches/composition-family-audit.md',md);
process.stdout.write(JSON.stringify(families.map(f=>({family:f.id,total:f.members.length,sharedSaves:f.members.filter(m=>m.assessment.supported).length})),null,2)+'\n');
