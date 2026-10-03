#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {isExecutableSavePlan} from '../scripts/basic-save-core.js';
const input=process.argv[2]??'/tmp/phase23-before/official-spell-compiler-report.json';
const report=JSON.parse(await readFile(input,'utf8'));
const familyProfiles=new Set(['evil-eye','fear','clinging-ice','paralyze','petrify','floating-flame','bless']);
const liveEvidence={
 'caustic-blast':'shared persistent damage rider; all degrees, ranks 1–10, native formula category, immunity and stacking; see phase-2-damage-immunity verification',
 'puff-of-poison':'shared initial/persistent damage outcomes; all degrees, ranks 1–10, native critical multiplication and immunity; see phase-2-damage-immunity verification',
 'deafness':'shared temporary immunity; all degrees, ranks 2–10, repeat rejection, reload, marker expiry and permanent condition; see phase-2-damage-immunity verification',
 'tempest-surge':'shared failure rider; all degrees, ranks 1–10, custom value/duration, reload, expiry and immunity; see phase-2-rider-family verification',
 'updraft':'shared failure rider; all degrees, ranks 1–10, native damage and Prone, duplicate prevention; see phase-2-rider-family verification',
 'vitality-lash':'shared undead-or-void-healing predicate; all degrees, ranks 1–10, live eligibility and late changes; see phase-2-rider-family verification',
 'void-warp':'general condition rider; all degrees, native heightened damage; see general-rules-phase-2-3 verification',
 'entreat-the-many':'general condition rider; all degrees, native heightened damage and Prone; see general-rules-phase-2-3 verification',
 'scramble-body':'general linked conditions; all degrees, Retch, exact-grant overlap, immunity, detachment and reload',
 'divine-wrath':'general linked conditions; all degrees, native damage, Retch, source deletion and unrelated overlap',
 'ashen-wind':'shared Sickened recovery, item deletion, overlap; player and no-GM checks',
 'painful-vibrations':'shared Sickened recovery preserves sibling Deafened, HP and unrelated Sickened',
 'enfeeble':'all degrees and caster-next-turn expiry',
 'stupefy':'all four degrees',
 'evil-eye':'all degrees, sight floor, visibility invalidation, Retch and missed Sustain',
 'fear':'Frightened 3→2→1→0 and separate Fleeing expiry',
 'clinging-ice':'failure/critical failure, native speed penalties, one-time damage and missed Sustain',
 'blindness':'success upcoming-turn expiry; immunity application, repeat rejection and expiry',
 'agonizing-despair':'Frightened recovery, duplicate prevention and unrelated overlap',
 'daze':'native damage, Stunned reminder and confirmed action loss',
 'timber':'critical damage, Dazzled and recipient-turn-end expiry',
 'arrow-salvo':'critical damage and native Prone',
 'paralyze':'all initial degrees, one-round expiry and recurring recovery success/critical success'
};
const rows=report.plans.filter(p=>p.resolution.kind==='save'||p.lifecycle.sustained||p.nativeEffects.onUse.length||Object.values(p.resolution.outcomes).some(o=>o.effects.length)).map(p=>({
 id:p.source.id,name:p.source.name,file:p.source.sourceFile,kind:p.resolution.kind,lifecycle:p.lifecycle.durationSpec.mode,
 executableSave:isExecutableSavePlan(p),
 runtimeRoute:familyProfiles.has(p.source.slug)?'ongoing-profile':isExecutableSavePlan(p)?'compiled-save':'not-executable-save',
 liveEvidence:liveEvidence[p.source.slug]??null,
 pending:p.automation.pendingCapabilities,
 conditions:[...new Set(Object.values(p.resolution.outcomes).flatMap(o=>o.effects.map(e=>e.slug)))],
 // Structural candidates, not a claim of phase ownership or verified support.
 family:p.lifecycle.sustained?'sustained':p.resolution.kind==='save'?'save-outcomes':'native-effects',
 evidence:'Requires spell/variant evidence; executable does not mean live verified'
}));
await mkdir('reports',{recursive:true});
await writeFile('reports/condition-ongoing-coverage.json',JSON.stringify({generatedAt:new Date().toISOString(),baseline:'PF2e 8.5.0 installed fixtures',scope:'Structural candidate audit across installed spells, including rituals; later-phase mechanics are not silently counted as Phase 2/3 support.',rows},null,2)+'\n');
await writeFile('reports/condition-ongoing-coverage.md',`# Condition and ongoing coverage ledger\n\n${rows.length} structural candidates from ${report.plans.length} installed spell/ritual documents. This is a discovery ledger, not a support count. A runtime-ready plan still needs outcome/lifetime evidence. Later-phase mechanics and rituals remain separately scoped. Ongoing-profile rows use a separate adapter; their listed compiler gates describe the generic compiler, not that adapter.\n\n| Spell | Family | Runtime route | Current expansion evidence | Remaining compiler gates |\n| --- | --- | --- | --- | --- |\n`+rows.map(r=>`| ${r.name.replaceAll('|','/')} | ${r.family} | ${r.runtimeRoute} | ${r.liveEvidence??'not verified in this expansion'} | ${r.pending.join(', ')||'Runtime/lifecycle audit required'} |`).join('\n')+'\n');
console.log(`Wrote ${rows.length} candidate rows; ${rows.filter(r=>r.executableSave).length} save plans runtime-ready.`);
