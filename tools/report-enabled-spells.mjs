#!/usr/bin/env node
// Read-only runtime route census. This never declares full spell/variant coverage.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {isExecutableSavePlan, isExecutableBasicSavePlan, inspectSavePlan, isExecutableLingeringPlan, isExecutableStoredTriggerPlan} from '../scripts/basic-save-core.js';
import {SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';
import {OngoingFamilies} from '../scripts/ongoing-families.js';
import {isExecutableStrikeEffectsPlan} from '../scripts/strike-effects-core.js';
import {ImmediateRuntime} from '../scripts/immediate-runtime.js';
import {FormRuntime} from '../scripts/form-runtime.js';
import {isExecutableCarePlan} from '../scripts/affliction-care-core.js';
import {isExecutableMessagePlan} from '../scripts/message-core.js';

const input = process.argv[2];
if (!input) throw Error('Pass a freshly compiled official-spell-compiler-report.json.');
const report = JSON.parse(await readFile(input, 'utf8'));
const rituals = JSON.parse(await readFile('docs/research/ritual-scope-manifest.json', 'utf8'));
const ritualById = new Map(rituals.rituals.map(row => [row.id, row]));
const families = new OngoingFamilies(null, null, null), immediate = new ImmediateRuntime(), forms = new FormRuntime();
const routes = {
    save: 'Shared save resolution', ongoing: 'Dedicated ongoing workflow', effect: 'Native Effect application',
    immediate: 'Immediate workflow (Phase 4)', strike: 'Strike spell with caster Effects', note: 'Spell note (not mechanical; reported apart)', 'effect-note': 'PF2e Effect + note (reported apart)', form: 'Form workflow (Phase 5)', care: 'Affliction-care workflow', message: 'Messaging workflow', disabled: 'No module resolution route'
};
const rows = report.plans.map(plan => {
    const item = {slug: plan.source.slug};
    // Matches route priority in scripts/main.js. No new spell identity registry.
    const route = forms.supports(item) ? 'form' : immediate.supports(item) ? 'immediate' : isExecutableCarePlan(plan) ? 'care' : isExecutableMessagePlan(plan) ? 'message'
        : families.supports(item) || isExecutableLingeringPlan(plan) || isExecutableStoredTriggerPlan(plan) ? 'ongoing' : isExecutableStrikeEffectsPlan(plan) ? 'strike' : plan.resolution.kind === 'spell-note' ? 'note' : plan.resolution.kind === 'effect-note' && !(plan.resolution.effectNote?.proof && plan.automation.level === 'automatic') ? 'effect-note' : SUPPORTED_RESOLUTION_KINDS.includes(plan.resolution.kind) ? 'effect'
        : isExecutableSavePlan(plan) ? 'save'
        // A spell resolved through its PF2e variants (the base item has no damage of its own).
        : (plan.variantPlans ?? []).some(variant => isExecutableSavePlan(variant)) ? 'save'
        : (plan.variantPlans ?? []).some(variant => !['spell-note', 'effect-note'].includes(variant.resolution.kind) && SUPPORTED_RESOLUTION_KINDS.includes(variant.resolution.kind) && variant.automation.level === 'automatic') ? 'effect'
        : (plan.variantPlans ?? []).some(variant => variant.resolution.kind === 'spell-note') ? 'note' : 'disabled';
    const ritual = ritualById.get(plan.source.id);
    return {id: plan.source.id, name: plan.source.name, slug: plan.source.slug, sourceFile: plan.source.sourceFile,
        ritual: !!ritual, milestoneScope: !ritual || ritual.status === 'included', ritualScope: ritual?.status ?? null,
        // A note-only spell (no mechanical rule the module could apply) counts as resolved: cantrips and rank 1 from 2026-09-29, every rank
        // from 2026-09-30 (user decisions). Rituals' notes are still counted apart. An Effect + note stays apart.
        enabledRoute: !['disabled', 'note', 'effect-note'].includes(route) || route === 'note', noteResolved: route === 'note', noteOnly: route === 'note', effectNote: route === 'effect-note', route, nativeEffectPartial: route === 'effect' && plan.automation.level === 'guided',
        compilerLevel: plan.automation.level, pending: plan.automation.pendingCapabilities,
        saveExecution: plan.resolution.kind === 'save' ? inspectSavePlan(plan) : null,
        ...(plan.variantPlans ? {variants: plan.variantPlans.map(variant => ({time: variant.source.variant?.time ?? null, executable: isExecutableSavePlan(variant) || (SUPPORTED_RESOLUTION_KINDS.includes(variant.resolution.kind) && variant.automation.level === 'automatic')}))} : {}),
        verifiedComplete: null};
}).sort((a,b) => a.name.localeCompare(b.name));
const counts = list => ({total: list.length, enabled: list.filter(r=>r.enabledRoute).length,
    notEnabled: list.filter(r=>!r.enabledRoute).length, noteOnly: list.filter(r=>r.noteOnly).length, effectNote: list.filter(r=>r.effectNote).length,
    routes: Object.fromEntries(Object.keys(routes).map(route=>[route,list.filter(r=>r.route===route).length])),
    nativeEffectPartial: list.filter(r=>r.nativeEffectPartial).length});
const summary = {nonRitual: counts(rows.filter(r=>!r.ritual)), milestone: counts(rows.filter(r=>r.milestoneScope)), installed: counts(rows)};
const basicSaveIds = new Set(report.plans.filter(plan=>isExecutableBasicSavePlan(plan))
    .map(plan=>plan.source.id));
const basicSaveRoutes = rows.filter(row=>!row.ritual && row.route==='save' && basicSaveIds.has(row.id)).length;
const degreeSaveRoutes = summary.nonRitual.routes.save-basicSaveRoutes;
const phase23RouteCount = summary.nonRitual.routes.save+summary.nonRitual.routes.ongoing+summary.nonRitual.routes.effect;
const qualifyingRitualCount = summary.milestone.total-summary.nonRitual.total;
const installedRitualCount = summary.installed.total-summary.nonRitual.total;
const enabledRitualCount = rows.filter(row=>row.ritual && row.enabledRoute).length;
const output = {generatedAt: new Date().toISOString(), compilerGeneratedAt: report.generatedAt, baseline:'PF2e 8.5.0',
    definition: 'Enabled means the current module offers a resolution route for unchanged baseline data. It is not full spell/variant verification. Runtime prerequisites and baseline checks still apply.',
    phaseDenominator: 'The grouped phase worklist is provisional; its spell memberships overlap and are not exclusive completion denominators.', summary, rows};
await mkdir('reports', {recursive:true});
await writeFile('reports/spell-enablement.json', JSON.stringify(output,null,2)+'\n');
const table = (headers, records) => '| '+headers.join(' | ')+' |\n| '+headers.map(()=> '---').join(' | ')+' |\n'+records.map(row=>'| '+row.map(v=>String(v).replaceAll('|','/')).join(' | ')+' |').join('\n');
let md = '# Spell enablement report\n\nSnapshot: '+output.generatedAt+'. PF2e 8.5.0 installed fixtures, evaluated against the current runtime route priority.\n\n';
md += '**Enabled means the module offers an automation path, not that every rule, rank or variant is fully verified.** Native Effect routes can explicitly leave mechanics to the user. The census does not execute live casts.\n\n';
md += table(['Catalog','Total','Enabled route','No enabled route'], [['Non-ritual spells (including focus spells and cantrips)', summary.nonRitual.total,summary.nonRitual.enabled,summary.nonRitual.notEnabled],[`Accepted milestone (adds ${qualifyingRitualCount} qualifying rituals)`,summary.milestone.total,summary.milestone.enabled,summary.milestone.notEnabled],['All installed documents (includes excluded/skipped rituals)',summary.installed.total,summary.installed.enabled,summary.installed.notEnabled]])+'\n\n';
md += `**Note only (counted apart):** ${summary.nonRitual.noteOnly} non-ritual spells have no mechanical rule the module could apply; casting one gives a rule-less note Effect with the spell's rules for its duration (on the caster, with a line to mark the area, for a spell placed in the environment). All ${rows.filter(r=>r.noteResolved && !r.ritual).length} are counted as enabled (resolved; user decisions: cantrips and rank 1 on 2026-09-29, every rank on 2026-09-30), and so are the ${rows.filter(r=>r.ritual && r.noteOnly).length} note-only rituals (user decision 2026-10-03).\n\n**Effect + note (counted apart):** ${summary.nonRitual.effectNote} non-ritual spells link a PF2e Effect the module can't prove covers the text (or can't tell who receives it). Casting one applies PF2e's Effect as PF2e defines it, plus a note Effect with the spell's text; they are not in the enabled counts either.\n\n`;
md += '## Enabled route breakdown\n\n'+table(['Route','Distinct spells'],Object.entries(routes).filter(([r])=>!['disabled','note','effect-note'].includes(r)).map(([r,label])=>[label,summary.nonRitual.routes[r]]))+'\n\n';
md += `The ${summary.nonRitual.routes.effect} native Effect routes comprise **${summary.nonRitual.routes.effect-summary.nonRitual.nativeEffectPartial} without compiler-listed gaps and ${summary.nonRitual.nativeEffectPartial} guided/partial routes**. Neither category is a count of fully verified spells. Specialized workflows can override generic Effect plans, so adding compiler kinds to workflow counts would double-count some spells. ${enabledRitualCount} of ${installedRitualCount} installed rituals currently have a module resolution route; ${qualifyingRitualCount} rituals belong to the accepted milestone.\n\n`;
md += '## Phase 2 and Phase 3 interpretation\n\nThe phases specify capabilities that can apply to the same spell. Phase 2 covers outcome application; Phase 3 supplies ongoing management to save outcomes and native Effects as well as dedicated workflows. The [provisional grouped phase worklist](phase-spell-batches/README.md) records candidate memberships for planning. Its phase groups overlap and are not exclusive completion denominators.\n\n';
md += `- **${summary.nonRitual.routes.save} executable shared save plans**: ${basicSaveRoutes} basic damage-only saves and ${degreeSaveRoutes} degree-outcome saves (including basic saves with riders). These use the shared outcome and applicable ongoing machinery.\n- **${summary.nonRitual.routes.ongoing} dedicated ongoing workflows**: ${rows.filter(r=>!r.ritual && r.route==='ongoing').map(r=>r.name).join(', ')}. Together with shared saves, these are **${summary.nonRitual.routes.save+summary.nonRitual.routes.ongoing} distinct save/ongoing spells with enabled routes**.\n- **${summary.nonRitual.routes.effect} additional native Effect routes** use shared application and lifecycle infrastructure, including partial mechanics belonging to later phases. These three route groups contain **${phase23RouteCount} distinct enabled spells**, a runtime route count rather than a Phase 2–3 completion count.\n- The remaining enabled routes comprise ${summary.nonRitual.routes.immediate} Phase 4 immediate workflows and ${summary.nonRitual.routes.form} Phase 5 form workflows.\n\n`;
md += 'The older condition/ongoing ledger is a structural candidate set. It mixes phases and does not cover every specialized or native Effect route. Its “not-executable-save” label does **not** mean no module automation: native Effect routes use a different gate. Do not use that ledger as an exclusive Phase 2–3 denominator or an unsupported-spell total.\n\n';
md += 'Live evidence is recorded separately in [Phase 2](../docs/verification/phase-2-release.md), [Phase 3](../docs/verification/phase-3-release.md), [coverage expansion](../docs/verification/phase-2-3-gap-closure.md), [general rules expansion](../docs/verification/general-rules-phase-2-3.md), [Phase 2 rider family](../docs/verification/phase-2-rider-family.md), [persistent damage and immunity](../docs/verification/phase-2-damage-immunity.md), [condition clause timing](../docs/verification/phase-2-clause-family.md), [outcome composition](../docs/verification/phase-2-composition.md), and [inline damage / linked recovery](../docs/verification/phase-2-3-inline-family.md). Those reports verify particular scenarios; no catalog-wide fully verified spell total is currently maintained.\n\n';
md += '## Enabled spells\n\n'+table(['Spell','Route','Qualification'],rows.filter(r=>r.enabledRoute).map(r=>[r.name,routes[r.route],r.nativeEffectPartial?'Partial native Effect automation':r.route==='effect'?'No compiler-listed gaps; not complete verification':'Workflow enabled; see verification scope']))+'\n\n';
md += 'The [machine-readable report](spell-enablement.json) contains every enabled and disabled catalog row, runtime route, ritual membership and compiler gaps. Reproduce by compiling current installed fixtures with `tools/compile-official-content.mjs`, then passing its JSON report to `tools/report-enabled-spells.mjs`. No production behavior changed for this audit.\n';
await writeFile('reports/spell-enablement.md',md);
console.log(JSON.stringify(summary,null,2));
