// Every spell whose compiled plan carries notes: its route (as report-enabled-spells.mjs) and the note texts.
import {readFile, writeFile} from 'node:fs/promises';
const root = '/home/theholycole/Documents/ChatGPT/PF2e AUTOMATIC SPELL RESOLUTION';
const {isExecutableSavePlan, isExecutableLingeringPlan, isExecutableStoredTriggerPlan} = await import(root + '/scripts/basic-save-core.js');
const {SUPPORTED_RESOLUTION_KINDS} = await import(root + '/scripts/runtime-core.js');
const {OngoingFamilies} = await import(root + '/scripts/ongoing-families.js');
const {isExecutableStrikeEffectsPlan} = await import(root + '/scripts/strike-effects-core.js');
const {ImmediateRuntime} = await import(root + '/scripts/immediate-runtime.js');
const {FormRuntime} = await import(root + '/scripts/form-runtime.js');
const {isExecutableCarePlan} = await import(root + '/scripts/affliction-care-core.js');
const {isExecutableMessagePlan} = await import(root + '/scripts/message-core.js');
const families = new OngoingFamilies(null, null, null), immediate = new ImmediateRuntime(), forms = new FormRuntime();
const route = plan => { const item = {slug: plan.source.slug};
  return forms.supports(item) ? 'form' : immediate.supports(item) ? 'immediate' : isExecutableCarePlan(plan) ? 'care' : isExecutableMessagePlan(plan) ? 'message'
    : families.supports(item) || isExecutableLingeringPlan(plan) || isExecutableStoredTriggerPlan(plan) ? 'ongoing' : isExecutableStrikeEffectsPlan(plan) ? 'strike' : plan.resolution.kind === 'spell-note' ? 'note' : plan.resolution.kind === 'effect-note' && !(plan.resolution.effectNote?.proof && plan.automation.level === 'automatic') ? 'effect-note' : SUPPORTED_RESOLUTION_KINDS.includes(plan.resolution.kind) ? 'effect'
    : isExecutableSavePlan(plan) ? 'save' : (plan.variantPlans ?? []).some(v => isExecutableSavePlan(v)) ? 'save'
    : (plan.variantPlans ?? []).some(v => !['spell-note','effect-note'].includes(v.resolution.kind) && SUPPORTED_RESOLUTION_KINDS.includes(v.resolution.kind) && v.automation.level === 'automatic') ? 'effect'
    : (plan.variantPlans ?? []).some(v => v.resolution.kind === 'spell-note') ? 'note' : 'disabled'; };
// Third-party spells: compile (official spells and effects as references), route each, and print the named ones' blockers.
const {compileAbility} = await import(root + '/src/compiler/index.js');
const {readdir} = await import('node:fs/promises');
const pathMod = await import('node:path');
const walk = async dir => (await Promise.all((await readdir(dir, {withFileTypes: true})).map(e => e.isDirectory() ? walk(pathMod.join(dir, e.name)) : e.name.endsWith('.json') ? [pathMod.join(dir, e.name)] : []))).flat();
const effectFiles = [...await walk(root + '/.cache/pf2e-test-fixtures/spell-effects'), ...await walk(root + '/.cache/third-party-fixtures/spell-effects/third-party')];
const nativeEffectCatalog = new Map();
for (const file of effectFiles) { const effect = JSON.parse(await readFile(file, 'utf8')); const rules = effect.system?.rules ?? [];
  const profile = {id: effect._id ?? null, name: effect.name, type: effect.type, sourceFile: file, automation: {ruleKeys: [...new Set(rules.map(r => r.key).filter(Boolean))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
    mechanics: {rules, duration: effect.system?.duration ?? null, start: effect.system?.start ?? null}, ...(effect.system?.badge ? {badge: effect.system.badge} : {})};
  if (!nativeEffectCatalog.has(effect.name)) nativeEffectCatalog.set(effect.name, profile); if (effect._id) nativeEffectCatalog.set(effect._id, profile); }
const official = await Promise.all((await walk(root + '/.cache/pf2e-test-fixtures/spells')).map(async f => JSON.parse(await readFile(f, 'utf8'))));
const referencedSpells = new Map(official.filter(s => s._id).map(s => [`Compendium.pf2e.spells-srd.Item.${s._id}`, s]));
const items = JSON.parse(await readFile(root + '/.cache/third-party-items.json', 'utf8'));
for (const s of items) if (s.type === 'spell') referencedSpells.set(`Compendium.${s._pack}.Item.${s._id}`, s);
function mergeDeep(target, patch) { for (const [k, v] of Object.entries(patch)) target[k] = v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k]) ? mergeDeep(target[k], v) : v; return target; }
const want = process.argv.slice(2);
const rows = [];
for (const source of items.filter(i => i.type === 'spell')) {
  if (process.env.ONLY && !want.includes(source.name)) continue;
  const plan = compileAbility(structuredClone(source), {sourceFile: source._pack, nativeEffectCatalog, referencedSpells});
  const overlays = Object.entries(source.system?.overlays ?? {}).filter(([, o]) => o?.overlayType === 'override');
  if (overlays.length) plan.variantPlans = overlays.map(([id, overlay]) => { const variant = structuredClone(source); variant.system = mergeDeep(variant.system, structuredClone(overlay.system ?? {})); delete variant.system.overlays;
    for (const entry of Object.values(variant.system.damage ?? {})) if (!Array.isArray(entry.kinds)) entry.kinds = ['damage'];
    const compiled = compileAbility(variant, {sourceFile: source._pack, nativeEffectCatalog, referencedSpells}); compiled.source.variant = {overlayId: id, time: variant.system.time?.value ?? null}; return compiled; });
  const r = {name: source.name, module: source._pack.split('.')[0], route: route(plan), kind: plan.resolution.kind, pending: plan.automation?.pendingCapabilities ?? []};
  rows.push(r);
  if (want.includes(source.name) && process.env.VARIANTS) for (const v of plan.variantPlans ?? []) { const {inspectSavePlan} = await import(root + '/scripts/basic-save-core.js'); const i = v.resolution?.kind === 'save' ? inspectSavePlan(v) : null;
    console.log('   variant', v.source.variant?.time, '|', route(v), v.resolution?.kind, '|', (v.automation?.pendingCapabilities ?? []).join(','), '|', i ? (i.blockers ?? []).map(b => b.code + ':' + b.message.slice(0, 80)).join(' ; ') : ''); }
  if (want.includes(source.name) && process.env.DUMP) await writeFile(`${process.env.DUMP}/${source.name.replace(/[^A-Za-z0-9]+/g, '-')}.json`, JSON.stringify(plan, null, 1));
  if (want.includes(source.name) && plan.resolution.kind === 'save') { try { const {inspectDegreeSavePlan} = await import(root + '/scripts/basic-save-core.js'); const inspected = inspectDegreeSavePlan(plan); console.log('   blockers:', JSON.stringify(inspected?.blockers ?? inspected).slice(0, 900)); } catch (error) { console.log('   inspect failed', error.message); } }
  if (want.includes(source.name)) console.log('=====', source.name, '|', r.route, r.kind, '|', r.pending.join(','), '\n   ' + (plan.diagnostics ?? []).map(d => d.code + (d.message ? ': ' + String(d.message).slice(0, 200) : '')).join('\n   '));
}
const by = {}; for (const r of rows) by[r.route] = (by[r.route] ?? 0) + 1;
console.log(rows.length, JSON.stringify(by));
if (!process.env.ONLY) await writeFile(root + '/reports/third-party-census.json', JSON.stringify(rows, null, 1));
