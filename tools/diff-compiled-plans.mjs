#!/usr/bin/env node
// Compare two official-spell-compiler reports and list every spell whose
// executable meaning changed. Compiler batches review this whole-corpus delta
// instead of trusting the handful of spells that motivated a grammar change.
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

import { inspectSavePlan } from "../scripts/basic-save-core.js";

const [beforePath, afterPath, outputPath] = process.argv.slice(2);
if (!beforePath || !afterPath) {
    console.error("Usage: diff-compiled-plans.mjs <before-report.json> <after-report.json> [output.json]");
    process.exit(2);
}

const load = async file => JSON.parse(await readFile(file, "utf8")).plans;
const key = plan => plan.source?.sourceFile ?? plan.source?.id ?? plan.source?.name;

function meaning(plan) {
    const route = plan.resolution?.kind === "save" ? inspectSavePlan(plan) : null;
    return {
        level: plan.automation?.level ?? null,
        pending: [...(plan.automation?.pendingCapabilities ?? [])].sort(),
        route: route ? { supported: route.supported, blockers: [...new Set(route.blockers.map(b => `${b.code}:${b.message}`))].sort() } : null,
        outcomes: Object.fromEntries(Object.entries(plan.resolution?.outcomes ?? {}).map(([degree, outcome]) => [degree, {
            damage: outcome.damage,
            effects: (outcome.effects ?? []).map(effect => ({
                slug: effect.slug, value: effect.value, duration: effect.duration ?? null,
                whileCondition: effect.whileCondition ?? null, endsWhen: effect.endsWhen ?? null,
                expirationMode: effect.expirationMode ?? null, recurringSave: effect.recurringSave?.mode ?? null
            })),
            modifiers: outcome.modifiers ?? [],
            nativeEffects: (outcome.nativeEffects ?? []).map(effect => effect.uuid ?? effect.reference),
            followUps: (outcome.followUps ?? []).length,
            residual: outcome.semanticCoverage?.clauses?.filter(clause => clause.status !== "compiled")
                .map(clause => `${clause.status}:${clause.unexplainedSignals?.join("+")}:${clause.text}`) ?? []
        }]))
    };
}

const before = new Map((await load(beforePath)).map(plan => [key(plan), plan]));
const after = new Map((await load(afterPath)).map(plan => [key(plan), plan]));
const changes = [];
for (const [id, plan] of after) {
    const previous = before.get(id);
    if (!previous) { changes.push({ id, name: plan.source?.name, kind: "added" }); continue; }
    const left = meaning(previous), right = meaning(plan);
    const fields = Object.keys(right).filter(field => JSON.stringify(left[field]) !== JSON.stringify(right[field]));
    if (!fields.length) continue;
    changes.push({
        id, name: plan.source?.name, fields,
        routeBefore: left.route?.supported ?? null, routeAfter: right.route?.supported ?? null,
        before: Object.fromEntries(fields.map(field => [field, left[field]])),
        after: Object.fromEntries(fields.map(field => [field, right[field]]))
    });
}
for (const id of before.keys()) if (!after.has(id)) changes.push({ id, name: before.get(id).source?.name, kind: "removed" });

const summary = {
    compared: after.size,
    changed: changes.length,
    newlyExecutable: changes.filter(change => change.routeBefore === false && change.routeAfter === true).map(change => change.name),
    noLongerExecutable: changes.filter(change => change.routeBefore === true && change.routeAfter === false).map(change => change.name)
};
if (outputPath) await writeFile(outputPath, JSON.stringify({ summary, changes }, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 2));
for (const change of changes) console.log(`- ${change.name}: ${change.kind ?? change.fields.join(", ")}${change.routeBefore !== change.routeAfter ? ` [route ${change.routeBefore} → ${change.routeAfter}]` : ""}`);
