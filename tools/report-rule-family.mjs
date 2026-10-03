#!/usr/bin/env node
// Planning audit only: names/IDs are output and fixture identity, never dispatch.
// Whole-family audit for one batch's rule families, with a detached-identity
// recompile of every member and a no-regression check against the pre-batch
// executable routes. Family sets live in rule-family-sets.mjs.
import assert from 'node:assert/strict';
import {readFile, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {FAMILY_SETS} from './rule-family-sets.mjs';

const [setName, reportPath, contentRoot, baselinePath] = process.argv.slice(2);
const set = FAMILY_SETS[setName];
if (!set || !reportPath || !contentRoot || !baselinePath) throw Error(`Pass a family set (${Object.keys(FAMILY_SETS).join(', ')}), compiler report, official content root, and pre-batch supported-plan snapshot.`);
const {families, title, outputStem, rowDetails = () => ({})} = set;
const compiled = JSON.parse(await readFile(reportPath, 'utf8'));
const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
const before = new Set(baseline.supported.map(plan => plan.id));
const census = JSON.parse(await readFile('reports/spell-enablement.json', 'utf8'));
// The same PF2e Spell Effects catalog the compiler used, so a detached copy resolves its Effect links identically.
const nativeEffectCatalog = new Map();
const effectRoot = path.join(contentRoot, 'spell-effects');
for (const file of (await readdir(effectRoot, {recursive: true})).filter(name => name.endsWith('.json'))) {
    const effect = JSON.parse(await readFile(path.join(effectRoot, file), 'utf8'));
    const rules = effect.system?.rules ?? [];
    const profile = {id: effect._id ?? null, name: effect.name, type: effect.type, sourceFile: path.join('spell-effects', file),
        automation: {ruleKeys: [...new Set(rules.map(rule => rule.key).filter(Boolean))], requiresConfiguration: rules.some(rule => rule.key === 'ChoiceSet'),
            removesAfterRoll: rules.some(rule => rule.removeAfterRoll != null)},
        mechanics: {rules, duration: effect.system?.duration ?? null, start: effect.system?.start ?? null},
        ...(effect.system?.badge ? {badge: effect.system.badge} : {})};
    nativeEffectCatalog.set(effect.name, profile);
}
// Every spell by its compendium UUID, as the official compile passes them (a spell with another spell's effects).
const referencedSpells = new Map();
const spellRoot = path.join(contentRoot, 'spells');
for (const file of (await readdir(spellRoot, {recursive: true})).filter(name => name.endsWith('.json'))) {
    const spell = JSON.parse(await readFile(path.join(spellRoot, file), 'utf8'));
    if (spell._id) referencedSpells.set(`Compendium.pf2e.spells-srd.Item.${spell._id}`, spell);
}
const routes = new Map(census.rows.map(row => [row.id, row]));
const catalog = JSON.parse(await readFile('reports/phase-spell-batches/catalog.json', 'utf8'));
const phases = new Map(catalog.batches.flatMap(batch => batch.memberIds.map(id => [id, batch.phase])));
const plain = html => String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
export const events = effect => (Array.isArray(effect.endsWhen) ? effect.endsWhen : effect.endsWhen ? [effect.endsWhen] : []).map(event => event.event);

function view(plan) {
    return Object.fromEntries(Object.entries(plan.resolution?.outcomes ?? {}).map(([degree, outcome]) => [degree,
        (outcome.effects ?? []).map(effect => [effect.slug, effect.value, effect.duration?.value ?? effect.duration?.mode ?? null,
            effect.duration?.unit ?? null, events(effect).join('+') || null])]));
}

const rows = [];
for (const plan of compiled.plans) {
    const id = plan.source.id;
    if (routes.get(id)?.ritual || phases.get(id) === 9 || !routes.has(id)) continue;
    const source = JSON.parse(await readFile(path.join(contentRoot, plan.source.sourceFile), 'utf8'));
    const text = plain(source.system.description.value);
    const groupIds = families.filter(family => family.match(plan, text)).map(family => family.id);
    if (!groupIds.length) continue;
    const assessment = inspectSavePlan(plan);
    // Identity independence: a renamed, detached copy must compile identically.
    const copy = structuredClone(source);
    copy._id = `detached${id}`.slice(0, 16); copy.name = `Detached ${id}`; copy.system.slug = `detached-${id.toLowerCase()}`;
    if (copy._stats) delete copy._stats.compendiumSource;
    const detached = compileAbility(copy, {sourceFile: plan.source.sourceFile, nativeEffectCatalog, referencedSpells});
    assert.deepEqual(view(detached), view(plan), `${plan.source.name}: detached copy compiles different outcomes`);
    assert.equal(inspectSavePlan(detached).supported, assessment.supported, `${plan.source.name}: detached copy changes route`);
    rows.push({
        id, name: plan.source.name, phase: phases.get(id) ?? null, sourceFile: plan.source.sourceFile, families: groupIds,
        route: routes.get(id).route, enabledRoute: routes.get(id).enabledRoute,
        sharedSave: assessment.supported, previousSharedSave: before.has(id),
        ...rowDetails(plan),
        blockers: [...new Set([...(plan.automation?.pendingCapabilities ?? []), ...assessment.blockers.filter(b => b.code !== 'compiler-gap').map(b => b.code)])]
    });
}
rows.sort((left, right) => left.name.localeCompare(right.name));
const current = compiled.plans.filter(plan => inspectSavePlan(plan).supported);
const currentIds = new Set(current.map(plan => plan.source.id));
// A lost route is accepted only when documented as an intentional withdrawal.
const withdrawn = JSON.parse(await readFile('docs/planning/withdrawn-routes.json', 'utf8')).withdrawn;
const regressions = baseline.supported.filter(plan => !currentIds.has(plan.id) && !withdrawn.some(entry => entry.id === plan.id));
assert.equal(regressions.length, 0, `Lost existing executable save routes: ${JSON.stringify(regressions)}`);
const newlySupported = current.filter(plan => !before.has(plan.source.id)).map(plan => ({id: plan.source.id, name: plan.source.name}));
const blockerCounts = Object.entries(rows.filter(row => !row.sharedSave).flatMap(row => row.blockers)
    .reduce((counts, blocker) => ({...counts, [blocker]: (counts[blocker] ?? 0) + 1}), {})).sort((a, b) => b[1] - a[1]);
const output = {generatedAt: compiled.generatedAt, baseline: baseline.generatedAt,
    scope: `All source-derived members of ${families.length} overlapping families; excludes rituals and the deferred Phase 9 review list. Every member was recompiled under a detached name/ID. Route assessment is not live execution.`,
    uniqueMembers: rows.length, executableSharedSaves: current.length, newlySupported, regressions,
    families: families.map(({match, ...family}) => ({...family, members: rows.filter(row => row.families.includes(family.id))})),
    blockerCounts};
await writeFile(`${outputStem}.json`, JSON.stringify(output, null, 2) + '\n');

const detailLabel = set.detailLabel ?? 'Detail';
const table = members => [`| Spell | Phase | Shared save | ${detailLabel} | Remaining blockers |`, '| --- | ---: | --- | --- | --- |',
    ...members.map(row => `| ${row.name} | ${row.phase ?? '—'} | ${row.sharedSave ? (row.previousSharedSave ? 'yes' : '**new**') : 'no'} | ${(row.detail ?? []).join(', ') || '—'} | ${row.sharedSave ? '—' : row.blockers.join(', ')} |`)].join('\n');
const markdown = [
    `# ${title} — family audit`, '',
    `Generated from the compiler report of ${output.generatedAt}. ${output.scope}`, '',
    `**${rows.length} unique members** across ${families.length} overlapping families. ${current.length} executable shared-save plans overall; newly executable: ${newlySupported.map(p => p.name).join(', ') || 'none'}. Regressions against the pre-batch baseline: ${regressions.length}.`, '',
    '| Family | Members | Executable shared saves |', '| --- | ---: | ---: |',
    ...output.families.map(family => `| ${family.title} | ${family.members.length} | ${family.members.filter(m => m.sharedSave).length} |`), '',
    '## Most common remaining blockers', '', '| Blocker | Members |', '| --- | ---: |',
    ...blockerCounts.slice(0, 20).map(([blocker, count]) => `| ${blocker} | ${count} |`), '',
    ...output.families.flatMap(family => [`## ${family.title}`, '', family.definition, '', table(family.members), ''])
].join('\n');
await writeFile(`${outputStem}.md`, markdown);
console.log(JSON.stringify({uniqueMembers: rows.length, families: output.families.map(f => [f.id, f.members.length, f.members.filter(m => m.sharedSave).length]), newlySupported, regressions: regressions.length}, null, 1));
