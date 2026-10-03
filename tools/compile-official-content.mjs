#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { compileAbility } from "../src/compiler/index.js";
import {
    isExecutableBasicSavePlan,
    isExecutableDegreeSavePlan
} from "../scripts/basic-save-core.js";

const contentRoot = path.resolve(process.argv[2] ?? "/home/theholycole/Documents/ChatGPT/pf2e");
const outputDirectory = path.resolve(process.argv[3] ?? "reports");
const spellRoot = path.join(contentRoot, "spells", "spells");
const spellEffectRoot = path.join(contentRoot, "spell-effects");

async function jsonFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
        const child = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...await jsonFiles(child));
        else if (entry.isFile() && entry.name.endsWith(".json")) files.push(child);
    }
    return files;
}

function countBy(values, selector) {
    const counts = new Map();
    for (const value of values) {
        const key = selector(value);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Object.fromEntries([...counts].sort(([left], [right]) => left.localeCompare(right)));
}

const effectFiles = await jsonFiles(spellEffectRoot);
const nativeEffectCatalog = new Map();
for (const file of effectFiles) {
    const effect = JSON.parse(await readFile(file, "utf8"));
    const rules = effect.system?.rules ?? [];
    nativeEffectCatalog.set(effect.name, {
        id: effect._id ?? null,
        name: effect.name,
        type: effect.type,
        sourceFile: path.relative(contentRoot, file),
        automation: {
            ruleKeys: [...new Set(rules.map(rule => rule.key).filter(Boolean))],
            requiresConfiguration: rules.some(rule => rule.key === "ChoiceSet"),
            removesAfterRoll: rules.some(rule => rule.removeAfterRoll != null)
        },
        mechanics: { rules, duration: effect.system?.duration ?? null, start: effect.system?.start ?? null },
        // A counter or rolled badge (e.g. temporary Hit Points "(@item.level)d4"), kept outside the mechanics.
        ...(effect.system?.badge ? { badge: effect.system.badge } : {})
    });
}

const files = await jsonFiles(spellRoot);
const plans = [];
// Every spell by its compendium UUID, for a spell that "functions as" another.
const sources = await Promise.all(files.map(async file => JSON.parse(await readFile(file, "utf8"))));
const referencedSpells = new Map(sources.filter(source => source._id).map(source => [`Compendium.pf2e.spells-srd.Item.${source._id}`, source]));

for (const [index, file] of files.entries()) {
    const source = sources[index];
    const relativeFile = path.relative(contentRoot, file);
    const plan = compileAbility(source, { sourceFile: relativeFile, nativeEffectCatalog, referencedSpells });
    // PF2e variants (overlays, e.g. action counts) are cast as their own items; compile each one too.
    const overlays = Object.entries(source.system?.overlays ?? {}).filter(([, overlay]) => overlay?.overlayType === "override");
    if (overlays.length) plan.variantPlans = overlays.map(([id, overlay]) => {
        const variant = structuredClone(source);
        variant.system = mergeDeep(variant.system, structuredClone(overlay.system ?? {}));
        delete variant.system.overlays;
        for (const entry of Object.values(variant.system.damage ?? {})) if (!Array.isArray(entry.kinds)) entry.kinds = ["damage"];
        const compiled = compileAbility(variant, { sourceFile: relativeFile, nativeEffectCatalog, referencedSpells });
        compiled.source.variant = { overlayId: id, time: variant.system.time?.value ?? null };
        return compiled;
    });
    plans.push(plan);
}

/** Foundry-style deep merge for an override overlay. */
function mergeDeep(target, patch) {
    for (const [key, value] of Object.entries(patch)) {
        target[key] = value && typeof value === "object" && !Array.isArray(value) && target[key] && typeof target[key] === "object" && !Array.isArray(target[key])
            ? mergeDeep(target[key], value) : value;
    }
    return target;
}

const nativeEffectReferences = plans.reduce((total, plan) =>
    total + (plan.compilerEvidence?.nativeSpellEffects?.references ?? 0), 0);
const nativeEffectOutcomeApplications = plans.reduce((total, plan) =>
    total + (plan.compilerEvidence?.nativeSpellEffects?.outcomeApplications ?? 0), 0);
const nativeEffectOnUse = plans.reduce((total, plan) =>
    total + (plan.compilerEvidence?.nativeSpellEffects?.onUse ?? 0), 0);
const nativeEffectDeferred = plans.reduce((total, plan) =>
    total + (plan.compilerEvidence?.nativeSpellEffects?.deferred ?? 0), 0);
const nativeEffectSequences = plans.reduce((total, plan) =>
    total + (plan.compilerEvidence?.nativeSpellEffects?.sequences ?? 0), 0);
const nativeEffectRankVariants = plans.reduce((total, plan) =>
    total + (plan.compilerEvidence?.nativeSpellEffects?.rankVariants ?? 0), 0);
const nativeEffectVariantSelectors = plans.reduce((total, plan) =>
    total + (plan.compilerEvidence?.nativeSpellEffects?.variantSelectors ?? 0), 0);
const nativeEffectTerminations = plans.reduce((total, plan) =>
    total + (plan.compilerEvidence?.nativeSpellEffects?.terminations ?? 0), 0);
const nativeEffectChoiceVariants = plans.reduce((total, plan) =>
    total + (plan.compilerEvidence?.nativeSpellEffects?.choiceVariants ?? 0), 0);
const nativeEffectChoiceSelectors = plans.reduce((total, plan) =>
    total + (plan.compilerEvidence?.nativeSpellEffects?.choiceSelectors ?? 0), 0);
const nativeEffectUnscoped = plans.reduce((total, plan) =>
    total + (plan.compilerEvidence?.nativeSpellEffects?.unscoped ?? 0), 0);
const nativeEffectResolved = plans.reduce((total, plan) =>
    total + (plan.compilerEvidence?.nativeSpellEffects?.resolved ?? 0), 0);
const nativeEffectUnresolved = plans.reduce((total, plan) =>
    total + (plan.compilerEvidence?.nativeSpellEffects?.unresolved ?? 0), 0);
const nativeOutcomeEffects = plans.flatMap(plan => Object.values(plan.resolution?.outcomes ?? {})
    .flatMap(outcome => outcome.nativeEffects ?? []));
const nativeOnUseEntries = plans.flatMap(plan => (plan.nativeEffects?.onUse ?? [])
    .map(effect => ({ plan, effect })));
const nativeDeferredEntries = plans.flatMap(plan => (plan.nativeEffects?.deferred ?? [])
    .map(effect => ({ plan, effect })));
const nativeRankVariantEntries = plans.flatMap(plan => (plan.nativeEffects?.rankVariants ?? [])
    .map(effect => ({ plan, effect })));
const nativeTerminationEntries = plans.flatMap(plan => (plan.nativeEffects?.terminations ?? [])
    .map(termination => ({ plan, termination })));
const nativeChoiceVariantEntries = plans.flatMap(plan => (plan.nativeEffects?.choiceVariants ?? [])
    .map(effect => ({ plan, effect })));
const nativeUnscopedEntries = plans.flatMap(plan => (plan.nativeEffects?.unscoped ?? [])
    .map(effect => ({ plan, effect })));
const nativeOnUseEffects = nativeOnUseEntries.map(entry => entry.effect);
const nativeDeferredEffects = nativeDeferredEntries.map(entry => entry.effect);
const nativeRankVariantEffects = nativeRankVariantEntries.map(entry => entry.effect);
const nativeUnscopedEffects = nativeUnscopedEntries.map(entry => entry.effect);
const directEffectPlans = plans.filter(plan => plan.resolution?.kind === "effect");
const effectSequencePlans = plans.filter(plan => plan.resolution?.kind === "effect-sequence");
const effectVariantPlans = plans.filter(plan => plan.resolution?.kind === "effect-variant");
const effectChoicePlans = plans.filter(plan => plan.resolution?.kind === "effect-choice");
const executableBasicSavePlans = plans.filter(isExecutableBasicSavePlan);
const executableDegreeSavePlans = plans.filter(isExecutableDegreeSavePlan);

const report = {
    formatVersion: 6,
    compilerVersion: plans[0]?.compilerVersion ?? null,
    compatibility: { foundry: "14", pf2e: "8.5.0" },
    generatedAt: new Date().toISOString(),
    totals: {
        spells: plans.length,
        byAutomationLevel: countBy(plans, plan => plan.automation.level),
        byResolutionKind: countBy(plans, plan => plan.resolution?.kind ?? "unavailable"),
        byDiagnostic: countBy(plans.flatMap(plan => plan.diagnostics), entry => entry.code),
        byCompiledCapability: countBy(plans.flatMap(plan => plan.automation.compiledCapabilities), capability => capability),
        byPendingCapability: countBy(plans.flatMap(plan => plan.automation.pendingCapabilities), capability => capability),
        byDelegatedCapability: countBy(plans.flatMap(plan => plan.automation.delegatedCapabilities ?? []), capability => capability),
        nativeSpellEffects: {
            catalogDocuments: nativeEffectCatalog.size,
            references: nativeEffectReferences,
            resolved: nativeEffectResolved,
            unresolved: nativeEffectUnresolved,
            outcomeApplications: nativeEffectOutcomeApplications,
            onUse: nativeEffectOnUse,
            deferred: nativeEffectDeferred,
            sequences: nativeEffectSequences,
            rankVariants: nativeEffectRankVariants,
            variantSelectors: nativeEffectVariantSelectors,
            terminations: nativeEffectTerminations,
            choiceVariants: nativeEffectChoiceVariants,
            choiceSelectors: nativeEffectChoiceSelectors,
            unscoped: nativeEffectUnscoped,
            outcomeRecipients: countBy(nativeOutcomeEffects, effect => effect.recipient.actor),
            onUseRecipients: countBy(nativeOnUseEffects, effect => effect.recipient.actor),
            deferredRecipients: countBy(nativeDeferredEffects, effect => effect.recipient.actor),
            rankVariantRecipients: countBy(nativeRankVariantEffects, effect => effect.recipient.actor),
            unscopedRecipients: countBy(nativeUnscopedEffects, effect => effect.recipient.actor),
            byPendingTriggerReason: countBy(
                nativeUnscopedEffects.flatMap(effect => effect.triggerAnalysis?.reasons ?? ["not-analyzed"]),
                reason => reason
            ),
            terminationAuthorities: countBy(nativeTerminationEntries, entry => entry.termination.authority.actor),
            terminationActionTypes: countBy(nativeTerminationEntries, entry => entry.termination.action.cost.type),
            terminationCompleteness: countBy(nativeTerminationEntries, entry => entry.termination.complete ? "complete" : "guided")
        },
        directEffects: {
            plans: directEffectPlans.length,
            byAutomationLevel: countBy(directEffectPlans, plan => plan.automation.level),
            byPendingCapability: countBy(
                directEffectPlans.flatMap(plan => plan.automation.pendingCapabilities)
                    .filter(capability => capability.startsWith("direct-effect:")),
                capability => capability
            )
        },
        effectSequences: {
            plans: effectSequencePlans.length,
            byAutomationLevel: countBy(effectSequencePlans, plan => plan.automation.level)
        },
        effectVariants: {
            plans: effectVariantPlans.length,
            byAutomationLevel: countBy(effectVariantPlans, plan => plan.automation.level),
            byPendingCapability: countBy(
                effectVariantPlans.flatMap(plan => plan.automation.pendingCapabilities)
                    .filter(capability => capability.startsWith("rank-variant:")),
                capability => capability
            )
        },
        effectChoices: {
            plans: effectChoicePlans.length,
            variants: nativeChoiceVariantEntries.length,
            byAutomationLevel: countBy(effectChoicePlans, plan => plan.automation.level),
            byPendingCapability: countBy(
                effectChoicePlans.flatMap(plan => plan.automation.pendingCapabilities)
                    .filter(capability => capability.startsWith("choice-variant:")),
                capability => capability
            )
        },
        executableSaves: {
            basic: executableBasicSavePlans.length,
            degreeOutcome: executableDegreeSavePlans.length,
            total: executableBasicSavePlans.length + executableDegreeSavePlans.length,
            basicNames: executableBasicSavePlans.map(plan => plan.source.name),
            degreeOutcomeNames: executableDegreeSavePlans.map(plan => plan.source.name)
        }
    },
    plans
};

const residualEntries = plans.flatMap(plan => Object.entries(plan.resolution?.outcomes ?? {})
    .flatMap(([degree, outcome]) => (outcome.semanticCoverage?.clauses ?? [])
        .filter(clause => clause.status === "residual")
        .map(clause => ({ plan, degree, clause }))));
const residualClauses = residualEntries.map(entry => entry.clause);
report.totals.residualClauses = residualClauses.length;
report.totals.byResidualSignal = countBy(
    residualClauses.flatMap(clause => clause.unexplainedSignals.length ? clause.unexplainedSignals : ["unclassified"]),
    signal => signal
);

await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, "official-spell-compiler-report.json"), `${JSON.stringify(report, null, 2)}\n`);

const lines = [
    "# Official PF2e 8.5.0 Spell Compiler Report",
    "",
    `Compiler version: ${report.compilerVersion}`,
    "",
    `Spells compiled: ${report.totals.spells}`,
    "",
    "## Automation levels",
    "",
    ...Object.entries(report.totals.byAutomationLevel).map(([key, count]) => `- ${key}: ${count}`),
    "",
    "## Resolution kinds",
    "",
    ...Object.entries(report.totals.byResolutionKind).map(([key, count]) => `- ${key}: ${count}`),
    "",
    "## Diagnostics",
    "",
    ...Object.entries(report.totals.byDiagnostic).map(([key, count]) => `- ${key}: ${count}`),
    "",
    "## Compiled capabilities",
    "",
    ...Object.entries(report.totals.byCompiledCapability).map(([key, count]) => `- ${key}: ${count}`),
    "",
    "## Pending and guided capabilities",
    "",
    ...Object.entries(report.totals.byPendingCapability).map(([key, count]) => `- ${key}: ${count}`),
    "",
    "## Delegated capabilities",
    "",
    ...Object.entries(report.totals.byDelegatedCapability).map(([key, count]) => `- ${key}: ${count}`),
    "",
    "## Executable save runtime",
    "",
    `Basic-save plans: ${report.totals.executableSaves.basic}`,
    "",
    `Degree-outcome plans: ${report.totals.executableSaves.degreeOutcome}`,
    "",
    `Total executable save plans: ${report.totals.executableSaves.total}`,
    "",
    ...report.totals.executableSaves.degreeOutcomeNames.map(name => `- ${name}`),
    "",
    "## Residual outcome prose",
    "",
    `Unclaimed clauses: ${report.totals.residualClauses}`,
    "",
    ...Object.entries(report.totals.byResidualSignal).map(([key, count]) => `- ${key}: ${count}`),
    "",
    "## Native pf2e.spell-effects links",
    "",
    `Catalog documents: ${report.totals.nativeSpellEffects.catalogDocuments}`,
    "",
    `Description references: ${report.totals.nativeSpellEffects.references}`,
    "",
    `Resolved references: ${report.totals.nativeSpellEffects.resolved}`,
    "",
    `Unresolved references: ${report.totals.nativeSpellEffects.unresolved}`,
    "",
    `Outcome applications: ${report.totals.nativeSpellEffects.outcomeApplications}`,
    "",
    ...Object.entries(report.totals.nativeSpellEffects.outcomeRecipients)
        .map(([recipient, count]) => `- outcome recipient ${recipient}: ${count}`),
    "",
    `Immediate on-use applications: ${report.totals.nativeSpellEffects.onUse}`,
    "",
    ...Object.entries(report.totals.nativeSpellEffects.onUseRecipients)
        .map(([recipient, count]) => `- on-use recipient ${recipient}: ${count}`),
    "",
    `Deferred applications: ${report.totals.nativeSpellEffects.deferred}`,
    "",
    `Compiled sequences: ${report.totals.nativeSpellEffects.sequences}`,
    "",
    ...Object.entries(report.totals.nativeSpellEffects.deferredRecipients)
        .map(([recipient, count]) => `- deferred recipient ${recipient}: ${count}`),
    "",
    `Rank-variant applications: ${report.totals.nativeSpellEffects.rankVariants}`,
    "",
    `Cast-rank selectors: ${report.totals.nativeSpellEffects.variantSelectors}`,
    "",
    ...Object.entries(report.totals.nativeSpellEffects.rankVariantRecipients)
        .map(([recipient, count]) => `- rank-variant recipient ${recipient}: ${count}`),
    "",
    `Dismissal transitions: ${report.totals.nativeSpellEffects.terminations}`,
    "",
    ...Object.entries(report.totals.nativeSpellEffects.terminationAuthorities)
        .map(([actor, count]) => `- dismissal authority ${actor}: ${count}`),
    "",
    ...Object.entries(report.totals.nativeSpellEffects.terminationActionTypes)
        .map(([type, count]) => `- dismissal action ${type}: ${count}`),
    "",
    ...Object.entries(report.totals.nativeSpellEffects.terminationCompleteness)
        .map(([status, count]) => `- dismissal ${status}: ${count}`),
    "",
    `Player-choice variants: ${report.totals.nativeSpellEffects.choiceVariants}`,
    "",
    `Player-choice selectors: ${report.totals.nativeSpellEffects.choiceSelectors}`,
    "",
    `Unscoped references: ${report.totals.nativeSpellEffects.unscoped}`,
    "",
    ...Object.entries(report.totals.nativeSpellEffects.unscopedRecipients)
        .map(([recipient, count]) => `- unscoped recipient ${recipient}: ${count}`),
    "",
    "### Pending trigger reasons",
    "",
    ...Object.entries(report.totals.nativeSpellEffects.byPendingTriggerReason)
        .map(([reason, count]) => `- ${reason}: ${count}`),
    "",
    "## Direct native-Effect resolutions",
    "",
    `Plans: ${report.totals.directEffects.plans}`,
    "",
    ...Object.entries(report.totals.directEffects.byAutomationLevel)
        .map(([level, count]) => `- ${level}: ${count}`),
    "",
    "### Remaining direct-effect capabilities",
    "",
    ...Object.entries(report.totals.directEffects.byPendingCapability)
        .map(([capability, count]) => `- ${capability}: ${count}`),
    "",
    "## Native Effect sequences",
    "",
    `Plans: ${report.totals.effectSequences.plans}`,
    "",
    ...Object.entries(report.totals.effectSequences.byAutomationLevel)
        .map(([level, count]) => `- ${level}: ${count}`),
    "",
    "## Deterministic rank variants",
    "",
    `Plans: ${report.totals.effectVariants.plans}`,
    "",
    ...Object.entries(report.totals.effectVariants.byAutomationLevel)
        .map(([level, count]) => `- ${level}: ${count}`),
    "",
    "### Remaining rank-variant capabilities",
    "",
    ...Object.entries(report.totals.effectVariants.byPendingCapability)
        .map(([capability, count]) => `- ${capability}: ${count}`),
    "",
    "## Player-choice Effect variants",
    "",
    `Plans: ${report.totals.effectChoices.plans}`,
    "",
    `Selectable Effects: ${report.totals.effectChoices.variants}`,
    "",
    ...Object.entries(report.totals.effectChoices.byAutomationLevel)
        .map(([level, count]) => `- ${level}: ${count}`),
    "",
    "### Remaining choice-variant capabilities",
    "",
    ...Object.entries(report.totals.effectChoices.byPendingCapability)
        .map(([capability, count]) => `- ${capability}: ${count}`),
    "",
    "Only plans that pass either the strict damage-only gate or the audited native-Effect completeness gate are marked automatic. Other plans retain explicit prompted, guided, or unsupported work.",
    ""
];
await writeFile(path.join(outputDirectory, "official-spell-compiler-report.md"), lines.join("\n"));

const residualLines = [
    "# Residual Outcome Prose Worklist",
    "",
    `Compiler version: ${report.compilerVersion}`,
    "",
    `Analyzed outcome plans: ${report.totals.byCompiledCapability["residual-prose-analysis"] ?? 0}`,
    "",
    `Unclaimed clauses: ${report.totals.residualClauses}`,
    "",
    "A clause can appear under more than one signal. Examples are bounded excerpts for compiler design, not spell-specific exceptions.",
    ""
];

for (const [signal, count] of Object.entries(report.totals.byResidualSignal)) {
    residualLines.push(`## ${signal} (${count})`, "");
    const examples = residualEntries
        .filter(({ clause }) => clause.unexplainedSignals.includes(signal)
            || (signal === "unclassified" && clause.unexplainedSignals.length === 0))
        .filter((entry, index, all) => all.findIndex(candidate => candidate.clause.text === entry.clause.text) === index)
        .slice(0, 5);
    for (const { plan, degree, clause } of examples) {
        const excerpt = clause.text.length > 260 ? `${clause.text.slice(0, 257)}...` : clause.text;
        residualLines.push(`- **${plan.source.name} — ${degree}:** ${excerpt}`);
    }
    residualLines.push("");
}

await writeFile(path.join(outputDirectory, "residual-prose-analysis.md"), residualLines.join("\n"));

const triggerLines = [
    "# Native Spell-Effect Trigger Analysis",
    "",
    `Compiler version: ${report.compilerVersion}`,
    "",
    `Immediate on-use applications: ${nativeOnUseEntries.length}`,
    "",
    `Still unscoped: ${nativeUnscopedEntries.length}`,
    "",
    "Compiled applications still require confirmation. Pending-reason counts can overlap because one link can have several safety blockers.",
    "",
    "## Compiled immediate applications",
    "",
    ...nativeOnUseEntries.map(({ plan, effect }) =>
        `- **${plan.source.name}:** ${effect.reference} → ${effect.recipient.actor}`),
    "",
    "## Deferred sequence applications",
    "",
    ...nativeDeferredEntries.map(({ plan, effect }) =>
        `- **${plan.source.name}:** ${effect.reference} → ${effect.trigger.event}`),
    "",
    "## Deterministic cast-rank variants",
    "",
    ...effectVariantPlans.map(plan => {
        const branches = plan.resolution.selector.branches
            .map(branch => `${branch.minRank}–${branch.maxRank ?? "∞"} → ${branch.effectUuid}`)
            .join("; ");
        return `- **${plan.source.name}:** ${branches}`;
    }),
    "",
    "## Explicit player-choice variants",
    "",
    ...effectChoicePlans.map(plan =>
        `- **${plan.source.name}:** ${plan.resolution.selector.branches.map(branch => branch.label).join(", ")}`),
    "",
    "## Compiled dismissal transitions",
    "",
    ...nativeTerminationEntries.map(({ plan, termination }) =>
        `- **${plan.source.name}:** ${termination.authority.actor} → ${termination.action.cost.type} → ${termination.scope}${termination.complete ? "" : ` (${termination.blockers.join(", ")})`}`),
    ""
];

for (const [reason, count] of Object.entries(report.totals.nativeSpellEffects.byPendingTriggerReason)) {
    triggerLines.push(`## ${reason} (${count})`, "");
    const examples = nativeUnscopedEntries
        .filter(({ effect }) => effect.triggerAnalysis?.reasons?.includes(reason))
        .slice(0, 8);
    for (const { plan, effect } of examples) {
        triggerLines.push(`- **${plan.source.name}:** ${effect.reference}`);
    }
    triggerLines.push("");
}

await writeFile(path.join(outputDirectory, "native-spell-effect-trigger-analysis.md"), triggerLines.join("\n"));

console.log(`Compiled ${plans.length} spells into ${outputDirectory}`);
