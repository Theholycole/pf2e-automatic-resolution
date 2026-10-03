#!/usr/bin/env node
// Read-only audit: for every spell the enablement report counts as resolved, compare each "Heightened (+N) … increases by XdY [type]" clause with
// the item's own heightening (system.heightening: its interval and each damage entry's dice per step), which PF2e's spell.getDamage rolls. The text
// wins over the data (docs/planning/pending-user-decisions.md), so a mismatch is a spell whose card can roll the wrong heightened dice unless its
// plan uses the text's step (a heighteningCorrection, a text formula, a rewritten heightening).
//
//   node tools/compile-official-content.mjs <content> <dir>
//   node tools/report-enabled-spells.mjs <dir>/official-spell-compiler-report.json   (run from a scratch cwd with a docs/ link: it writes reports/)
//   node tools/audit-heightening-text.mjs <content> <dir>/official-spell-compiler-report.json <spell-enablement.json> [out.json]
//
// Clauses about damage the data has no entry for (an inline @Damage formula, "the subsequent damage", "splash damage") are listed apart as
// "no-data-entry": the data step can't disagree with them. Fixed heightening ("Heightened (4th)") is out of scope.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { isExecutableSavePlan } from "../scripts/basic-save-core.js";

const [contentRoot, reportPath, enablementPath, outputPath] = process.argv.slice(2);
if (!contentRoot || !reportPath || !enablementPath) {
    console.error("Usage: audit-heightening-text.mjs <content-root> <compiler-report.json> <spell-enablement.json> [output.json]");
    process.exit(2);
}

const TYPES = ["acid", "bludgeoning", "cold", "electricity", "fire", "force", "mental", "piercing", "poison", "slashing", "sonic", "spirit", "vitality",
    "void", "bleed", "holy", "unholy", "untyped", "precision"];

const plain = html => String(html ?? "")
    .replace(/@\w+\[[^\]]*\]\{([^}]*)\}/g, "$1")
    .replace(/@Damage\[\(?([^[\]]+?)\)?\[([^\]]+)\][^\]]*\]/g, (_, formula, type) => `${formula} ${type.split(",").reverse().join(" ")}`)
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** Each "Heightened (+N)" entry: {interval, text}. */
function heightenedEntries(html) {
    return [...String(html ?? "").matchAll(/<strong>\s*Heightened\s*\(\+(\d+)\)\s*<\/strong>([\s\S]*?)(?=<\/p>|<hr|$)/gi)]
        .map(match => ({ interval: Number(match[1]), text: plain(match[2]) }));
}

/** "3d6 bludgeoning and 1d6 fire" / "2d6" / "1" → [{dice, faces, flat, type}], or null when the amount carries a qualifier. */
function amounts(text) {
    const list = text.replace(/\.$/, "").trim().split(/,? and |, /);
    const parsed = list.map(part => {
        const match = /^(?:(\d+)d(\d+)|(\d+))(?: ([a-z]+))?(?: damage)?$/.exec(part.trim());
        if (!match || (match[4] && !TYPES.includes(match[4]))) return null;
        return match[3] ? { dice: 0, faces: 0, flat: Number(match[3]), type: match[4] ?? null } : { dice: Number(match[1]), faces: Number(match[2]), flat: 0, type: match[4] ?? null };
    });
    return parsed.every(Boolean) ? parsed : null;
}

/** The damage clauses of one heightened entry: [{text, subject, amounts}] (amounts null: a qualified or unparsed clause). */
function clauses(text) {
    const result = [];
    for (const sentence of text.split(/(?<=\.)\s+/)) {
        // "The slashing damage and the void damage each increase by 1d4": one subject, not two clauses.
        const joined = sentence.replace(/\bthe ([a-z]+) damage and the ([a-z]+) damage (each|both) /gi, "the $1 and $2 damage $3 ");
        // A sentence whose amounts depend on the casting ("…, or 2d6 and 2d12 if you use 2 or 3 actions") is listed for review as a whole.
        const sentenceQualified = /, or \d|\(or \d|\bif you (?:use|spend)\b/i.test(joined);
        for (const clause of joined.split(/(?:,\s*and\s+|;\s*|\s+and\s+(?=(?:the|increase)\s)|,\s+(?=the\s[^,]*?damage))/i)) {
            const trimmed = clause.trim().replace(/\.$/, "");
            const match = /^(?:and )?(?:the )?(.*?\b(?:damages?|healing)\b.*?) (?:each |both )?(?:increases?|is increased) by (.+)$/i.exec(trimmed)
                ?? /^(?:and )?increase the (.*?\b(?:damages?|healing)\b.*?) by (.+)$/i.exec(trimmed)
                // "… increases by 1d6 and the electricity damage by 1d12": the second clause without its verb.
                ?? (result.length ? /^(?:and )?the ([a-z ]*?damage) by (.+)$/i.exec(trimmed) : null);
            if (!match || !/\d/.test(match[2])) continue;
            // A qualified amount ("1d6, or 2d6 …", "(or 1d6 of each type …)") is listed for review.
            const qualified = sentenceQualified || /\(|\bor\b|\bif\b|\bfor\b|\bon a\b|\bper\b|\bwhen/i.test(match[2]);
            result.push({ text: trimmed, subject: match[1].toLowerCase(), amounts: qualified ? null : amounts(match[2]) });
        }
    }
    return result;
}

const isPersistent = component => component.category === "persistent";
const isHealing = component => (component.kinds ?? ["damage"]).includes("healing") && !(component.kinds ?? []).includes("damage");
const stepOf = (heightening, id) => {
    const value = String(heightening?.damage?.[id] ?? "0").replace(/\s+/g, "");
    const match = /^(?:(\d+)d(\d+))?(?:\+?(\d+))?$/.exec(value);
    return match ? { dice: Number(match[1] ?? 0), faces: Number(match[2] ?? 0), flat: Number(match[3] ?? 0), raw: value } : { dice: NaN, faces: NaN, flat: NaN, raw: value };
};
const show = step => step.raw ?? ([step.dice ? `${step.dice}d${step.faces}` : "", step.flat ? String(step.flat) : ""].filter(Boolean).join("+") || "0");

/** The data entries a clause's subject names; null when the subject is damage the data has no entry for. */
function subjectComponents(subject, components) {
    const damage = components.filter(component => !isHealing(component));
    // Healing the data states apart from its healing entry (fast healing, "the extra healing for the 2-action version") isn't the entry's step.
    if (/\b(fast|extra|additional|temporary)\b/.test(subject)) return null;
    if (/healing|hit points/.test(subject) && !/damage/.test(subject)) return components.filter(isHealing);
    // Heal's "amount of healing or damage" is its one entry; Draw Blood's "persistent bleed damage and healing" is the damage's.
    if (/healing or damage|damage or healing/.test(subject)) return components;
    subject = subject.replace(/ and healing\b/, "");
    // A second damage the spell deals later or elsewhere (the burning space, a puddle, an explosion, a per-turn cap) isn't the entry the data heightens.
    if (/\b(subsequent|additional|hazardous|terrain|aura|each turn|end of|when|whenever|against|if|dealt by|puddle|explosion|maximum|adjacent|touching|crossing|caused by|ongoing|reduction)\b/.test(subject)) return null;
    if (/splash/.test(subject)) return damage.filter(component => component.category === "splash");
    const direct = damage.filter(component => component.category !== "splash");
    const types = TYPES.filter(name => new RegExp(`\\b${name}\\b`).test(subject));
    // "persistent" names the persistent entries, "initial and persistent" both; otherwise the direct damage when the spell has some.
    const both = /initial and persistent/.test(subject), persistent = direct.filter(isPersistent), initial = direct.filter(component => !isPersistent(component));
    let list = both ? direct : /persistent/.test(subject) ? persistent : initial.length ? initial : direct;
    if (types.length) list = list.filter(component => types.includes(String(component.type).toLowerCase()));
    return list.length ? list : null;
}

function mergeDeep(target, patch) {
    for (const [key, value] of Object.entries(patch)) {
        target[key] = value && typeof value === "object" && !Array.isArray(value) && target[key] && typeof target[key] === "object" && !Array.isArray(target[key])
            ? mergeDeep(target[key], value) : value;
    }
    return target;
}

const faces = formula => Number(/d(\d+)/.exec(String(formula ?? ""))?.[1] ?? 0);

/** Compare one item (a spell or one of its variants; base: the spell itself) with its text. */
function audit(item, base = item) {
    const findings = [];
    const entries = heightenedEntries(item.system?.description?.value).filter(entry => clauses(entry.text).length);
    const heightening = item.system?.heightening ?? null;
    const components = Object.entries(item.system?.damage ?? {}).map(([id, entry]) => ({ id, ...entry }));
    const actions = String(item.system?.time?.value ?? "");
    const covered = new Set();
    const label = (component, step) => `${show(step)} ${component.type}${isPersistent(component) ? " (persistent)" : ""}`;
    for (const entry of entries) {
        const dataInterval = heightening?.type === "interval" ? Number(heightening.interval) : null;
        // Each entry's text step, summed over the clauses that name it (Heal's 1d8 and, for the 2-action version, 8 more).
        const stated = new Map();
        let open = false;
        for (const clause of clauses(entry.text)) {
            const version = /\b(?:extra|additional) healing for the (\d)-action version\b/.exec(clause.subject);
            if (version && clause.amounts?.length === 1 && !clause.amounts[0].dice) {
                if (version[1] === actions) for (const component of components.filter(entry => (entry.kinds ?? []).includes("healing")))
                    stated.set(component.id, { component, dice: 0, faces: 0, flat: 0, ...stated.get(component.id), flat: (stated.get(component.id)?.flat ?? 0) + clause.amounts[0].flat, texts: [...(stated.get(component.id)?.texts ?? []), clause.text] });
                continue;
            }
            const matched = subjectComponents(clause.subject, components);
            if (!matched) { findings.push({ kind: "no-data-entry", text: clause.text, textStep: `+${entry.interval}`, dataStep: components.map(component => `${component.formula} ${component.type}${component.category ? ` ${component.category}` : ""} +${heightening?.interval ?? "?"}: ${show(stepOf(heightening, component.id))}`).join(", ") || "no entries" }); continue; }
            if (!clause.amounts) { open = true; findings.push({ kind: "unparsed", text: clause.text, textStep: `+${entry.interval}`, dataStep: matched.map(component => `${component.type}: ${show(stepOf(heightening, component.id))}`).join(", ") }); continue; }
            // Typed amounts pair with their type's entry; one untyped amount applies to every named entry ("The damage for each type increases by 1d6").
            const pairs = clause.amounts.length === 1 && !clause.amounts[0].type ? matched.map(component => [component, clause.amounts[0]])
                : clause.amounts.map(amount => [matched.find(component => String(component.type).toLowerCase() === amount.type)
                    ?? (matched.length === 1 && clause.amounts.length === 1 ? matched[0] : null), amount]);
            for (const [component, amount] of pairs) {
                if (!component) { findings.push({ kind: "no-data-entry", text: clause.text, textStep: `+${entry.interval}: ${amount.dice}d${amount.faces} ${amount.type ?? ""}`, dataStep: null }); continue; }
                const sum = stated.get(component.id) ?? { component, dice: 0, faces: amount.faces, flat: 0, texts: [] };
                if (sum.faces && amount.faces && sum.faces !== amount.faces) open = true;
                stated.set(component.id, { ...sum, dice: sum.dice + amount.dice, faces: sum.faces || amount.faces, flat: sum.flat + amount.flat, texts: [...sum.texts, clause.text] });
            }
        }
        for (const { component, texts, ...amount } of stated.values()) {
            covered.add(component.id);
            const textStep = `+${entry.interval}: ${show(amount)} ${component.type}`;
            if (heightening?.type === "fixed") {
                // Each data level against the text's dice at that rank.
                const rank = Number(base.system?.level?.value), start = /^(\d+)d(\d+)(?:\+(\d+))?$/.exec(String(component.formula).replace(/\s+/g, ""));
                const wrong = Object.entries(heightening.levels ?? {}).filter(([, level]) => level?.damage?.[component.id]).map(([level, data]) => {
                    const steps = Math.floor((Number(level) - rank) / entry.interval);
                    const expected = start ? `${Number(start[1]) + steps * amount.dice}d${start[2]}${Number(start[3] ?? 0) + steps * amount.flat ? `+${Number(start[3] ?? 0) + steps * amount.flat}` : ""}` : null;
                    return expected === String(data.damage[component.id].formula).replace(/\s+/g, "") ? null : `rank ${level}: ${data.damage[component.id].formula} (text ${expected})`;
                }).filter(Boolean);
                if (wrong.length) findings.push({ kind: "mismatch", text: texts.join("; "), textStep, dataStep: `fixed ${wrong.join(", ")}`, component: component.id });
                continue;
            }
            const data = stepOf(heightening, component.id);
            const dataStep = `${dataInterval == null ? "no heightening" : `+${dataInterval}`}: ${label(component, data)}`;
            const same = dataInterval === entry.interval && data.dice === amount.dice && (amount.dice === 0 || data.faces === amount.faces) && data.flat === amount.flat;
            // A variant whose text raises every die a size ("increase the damage dice from this spell to d12s", melee Ignition's d6s): the
            // heightened dice grow with it, so the variant's own die size is the text's.
            const upgraded = !same && item !== base && dataInterval === entry.interval && data.dice === amount.dice && data.flat === amount.flat
                && data.faces === faces(component.formula) && amount.faces === faces(base.system?.damage?.[component.id]?.formula) && data.faces > amount.faces;
            if (upgraded) findings.push({ kind: "die-upgrade", text: texts.join("; "), textStep, dataStep });
            else if (!same) findings.push({ kind: "mismatch", text: texts.join("; "), textStep, dataStep, component: component.id,
                detail: { textInterval: entry.interval, dataInterval, text: amount, data, type: String(component.type).toLowerCase() } });
        }
        // A data step for an entry the text never increases (the data adds dice the text doesn't).
        if (heightening?.type === "interval" && !open) for (const component of components) {
            const data = stepOf(heightening, component.id);
            if (!covered.has(component.id) && (data.dice || data.flat) && !findings.some(finding => finding.kind === "no-data-entry"))
                findings.push({ kind: "data-only", text: entry.text, textStep: "(not stated)", dataStep: `+${heightening.interval}: ${label(component, data)}`, component: component.id });
        }
    }
    return findings;
}

/** Whether the compiled plan already uses the text's step for a mismatch. */
function planUsesText(plan, finding) {
    const shared = plan?.resolution?.sharedDamage;
    if (plan?.resolution?.kind === "save" && !isExecutableSavePlan(plan)) return { uses: null, why: "save plan not executable (the variants resolve it)" };
    // A hazard's ignite formula that scales itself, one die per `divisor` ranks (Tacky Pine Sap's floor(rank/2)d6).
    const ignite = plan?.resolution?.hazardArea?.control;
    if (ignite?.kind === "ignite" && finding.detail && ignite.divisor === finding.detail.textInterval && finding.detail.text.dice === 1
        && ignite.faces === finding.detail.text.faces) return { uses: true, why: "hazard ignite formula (one die per text interval)" };
    // Direct healing rolled with the text's dice (Breath of Life).
    const healing = plan?.resolution?.healing?.heighteningCorrection;
    if (healing && finding.detail && healing.text.interval === finding.detail.textInterval && healing.text.dice === finding.detail.text.dice
        && healing.data.interval === finding.detail.dataInterval && healing.data.dice === finding.detail.data.dice) return { uses: true, why: "healing heighteningCorrection" };
    if (!shared) return { uses: null, why: `no shared damage (${plan?.resolution?.kind ?? "no plan"})` };
    if (shared.mode === "formula" && shared.textDerived) return { uses: true, why: "text-derived formula" };
    const correction = (shared.heighteningCorrection ?? []).find(entry => entry.type === finding.detail?.type);
    if (correction && finding.detail && correction.interval === finding.detail.textInterval
        && finding.detail.data.dice + correction.perStep === finding.detail.text.dice) return { uses: true, why: "heighteningCorrection" };
    const step = shared.heightening?.damage?.[finding.component];
    if (finding.detail && shared.heightening?.type === "interval" && Number(shared.heightening.interval) === finding.detail.textInterval
        && String(step ?? "").replace(/\s+/g, "") === `${finding.detail.text.dice}d${finding.detail.text.faces}`) return { uses: true, why: "plan heightening equals text" };
    return { uses: false, why: "rolls PF2e's heightening" };
}

const enablement = JSON.parse(await readFile(enablementPath, "utf8"));
const report = JSON.parse(await readFile(reportPath, "utf8"));
const planByFile = new Map(report.plans.map(plan => [plan.source.sourceFile, plan]));
const rows = [];
for (const row of enablement.rows.filter(entry => entry.enabledRoute)) {
    const source = JSON.parse(await readFile(path.join(contentRoot, row.sourceFile), "utf8"));
    const plan = planByFile.get(row.sourceFile);
    const items = [{ label: null, item: source, plan }];
    for (const [id, overlay] of Object.entries(source.system?.overlays ?? {}).filter(([, entry]) => entry?.overlayType === "override")) {
        const variant = structuredClone(source);
        variant.system = mergeDeep(variant.system, structuredClone(overlay.system ?? {}));
        items.push({ label: overlay.name ?? `variant ${overlay.system?.time?.value ?? id}`, item: variant,
            plan: plan?.variantPlans?.find(entry => entry.source.variant?.overlayId === id) });
    }
    const seen = new Set();
    for (const { label, item, plan: itemPlan } of items) for (const finding of audit(item, source)) {
        const judged = finding.kind === "mismatch" || finding.kind === "data-only" ? { plan: planUsesText(itemPlan, finding) } : {};
        const key = `${finding.kind}|${finding.text}|${finding.textStep}|${finding.dataStep}|${JSON.stringify(judged)}`;
        // A variant that repeats its base's text, data and plan adds nothing new.
        if (seen.has(key) && label) continue;
        seen.add(key);
        rows.push({ spell: row.name, variant: label, route: row.route, sourceFile: row.sourceFile, ...finding, ...judged });
    }
}

const byKind = rows.reduce((counts, row) => ({ ...counts, [row.kind]: (counts[row.kind] ?? 0) + 1 }), {});
if (outputPath) await writeFile(outputPath, JSON.stringify({ generatedAt: new Date().toISOString(), byKind, rows }, null, 2) + "\n");
console.log(JSON.stringify(byKind));
for (const row of rows.filter(entry => ["mismatch", "data-only", "die-upgrade"].includes(entry.kind)))
    console.log(`${row.kind}\t${row.spell}${row.variant ? ` [${row.variant}]` : ""}\t${row.route}\ttext ${row.textStep}\tdata ${row.dataStep}\t${row.plan ? `${row.plan.uses ? "USES TEXT" : "rolls data"} (${row.plan.why})` : ""}\t${row.text}`);
