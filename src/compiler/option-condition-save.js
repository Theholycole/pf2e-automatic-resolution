// A save whose rows grant one of several listed states the caster picks when casting (Overwhelming Memory):
//   "You cause the target to recall a specific type of memory you choose from the list below, bringing it to the forefront of their mind with
//   perfect clarity." with a list ("Gleeful The memory makes the target laugh uncontrollably. They can't use reactions." / "Romantic … They are
//   @UUID[…]{Fascinated} by the memory." / "Terrifying … is @UUID[…]{Frightened 1}." / "Tragic … They are @UUID[…]{Dazzled} from the tears in
//   their eyes."), "The target must attempt a Will save." and rows "Success The target is affected by the memory until the beginning of your
//   next turn." / "Failure The target is affected by the memory until the beginning of your next turn and @UUID[…]{Stupefied 2} for the spell's
//   duration." / "Critical Failure As failure, but the target is @UUID[…]{Stupefied 3} for the spell's duration."
// The caster picks the option on the card. Each "affected" row gets the option's condition (or a note Effect for "can't use reactions") until
// the start of the caster's next turn; the rows' remaining conditions are an ordinary non-basic save (the rewritten description).
import { extractScopedConditionReferences, htmlToPlainText } from "./description-parser.js";
import { compileEffectDuration } from "./duration-compiler.js";

const LEAD = /^You cause the target to [a-z ]+? a specific type of ([a-z]+) you choose from the list below(?:, [a-z ,]+)?\.$/;
const SAVE = /^The target must attempt an? (Fortitude|Reflex|Will) save\.$/;
const ITEM = /^<li>\s*<strong>\s*([A-Z][a-z]+)\s*<\/strong>\s*([\s\S]+?)\s*<\/li>$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|rounds?|minutes?|reactions?|actions?)\b/i;
const NO_REACTIONS = /^(?:They|The (?:target|creature)) can't use reactions\.$/;
const CRITICAL_SUCCESS = /^The target is unaffected\.$/;
const AFFECTED = noun => new RegExp(`^The target is affected by the ${noun} until the beginning of your next turn(?:\\.| and (.+)\\.)$`);
const AS_FAILURE = /^As failure, but (.+)\.$/;
const UNTIL = "until the beginning of your next turn";
const DEGREES = [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]];

const sentencesOf = html => htmlToPlainText(html).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
// (The plain text keeps the @UUID links' labels; the item's own HTML keeps the links.)
const linkedSentences = html => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);

/** Returns {html, defense, choice: {label, values, options, rows}, claimed, sourceText} or null. */
export function extractOptionConditionSave(adapted, lifecycle) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area) return null;
    if (!/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/Heightened/i.test(html)) return null;
    const parts = /^<p>([\s\S]*?)<\/p>\s*<ul>([\s\S]*?)<\/ul>\s*<p>([\s\S]*?)<\/p>\s*<hr\s*\/?>([\s\S]*)$/.exec(html.trim());
    if (!parts) return null;
    const lead = sentencesOf(`<p>${parts[1]}</p>`);
    if (lead.length !== 1 || !LEAD.test(lead[0])) return null;
    const noun = LEAD.exec(lead[0])[1];
    const saveSentence = sentencesOf(`<p>${parts[3]}</p>`);
    if (saveSentence.length !== 1 || !SAVE.test(saveSentence[0])) return null;
    const statistic = SAVE.exec(saveSentence[0])[1].toLowerCase();
    // The options: narration, then the one sentence holding the option's state.
    const options = {}, claimed = [lead[0]];
    for (const [, raw] of parts[2].matchAll(/<li>([\s\S]*?)<\/li>/gi)) {
        const item = ITEM.exec(`<li>${raw.trim()}</li>`);
        if (!item) return null;
        const name = item[1].toLowerCase();
        const linked = linkedSentences(item[2]);
        if (options[name] || !linked.length) return null;
        const last = linked.at(-1);
        if (linked.slice(0, -1).some(sentence => NARRATION_RULES.test(sentence))) return null;
        if (NO_REACTIONS.test(last)) options[name] = { note: { label: "Can't use reactions", text: `The target can't use reactions (${name} ${noun}).` } };
        else {
            const found = extractScopedConditionReferences(last);
            if (found.length !== 1 || (last.match(/@UUID/g) ?? []).length !== 1) return null;
            // The rest of the sentence is narration ("They are {Fascinated} by the memory.").
            if (NARRATION_RULES.test(last.replace(found[0].raw, ""))) return null;
            const grant = `The target is ${found[0].raw} ${UNTIL}.`;
            const [reference] = extractScopedConditionReferences(grant);
            const effect = compileEffectDuration(reference, grant, lifecycle);
            if (effect.duration?.expiry !== "turn-start" || effect.duration?.anchor !== "source-turn") return null;
            options[name] = { effect };
        }
        options[name].sourceText = htmlToPlainText(item[0]).replace(/\s+/g, " ").trim();
        claimed.push(options[name].sourceText);
    }
    if (Object.keys(options).length < 2) return null;
    claimed.push(saveSentence[0]);
    // The rows: "affected by the memory until the beginning of your next turn" is the option; the rest stays the row's own.
    const rows = {}, affected = AFFECTED(noun);
    for (const [, block] of parts[4].matchAll(/<p>([\s\S]*?)<\/p>/gi)) {
        const row = /^<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>\s*([\s\S]+)$/.exec(block.trim());
        if (!row) return null;
        const degree = DEGREES.find(([, label]) => label === row[1])[0];
        if (rows[degree]) return null;
        rows[degree] = row[2].trim();
    }
    if (DEGREES.some(([degree]) => !rows[degree]) || !CRITICAL_SUCCESS.test(htmlToPlainText(rows.criticalSuccess).trim())) return null;
    const rewritten = { criticalSuccess: "The target is unaffected." }, optionRows = [];
    let failureRest = null;
    for (const degree of ["success", "failure"]) {
        const match = affected.exec(rows[degree].replace(/\s+/g, " "));
        if (!match) return null;
        optionRows.push(degree);
        rewritten[degree] = match[1] ? `The target is ${match[1].replace(/^the target is /i, "")}.` : "The target is unaffected.";
        if (degree === "failure") failureRest = match[1] ?? null;
    }
    const critical = AS_FAILURE.exec(rows.criticalFailure.replace(/\s+/g, " "));
    if (critical) {
        if (!failureRest) return null;
        rewritten.criticalFailure = `${critical[1][0].toUpperCase()}${critical[1].slice(1)}.`;
    } else {
        const match = affected.exec(rows.criticalFailure.replace(/\s+/g, " "));
        if (!match) return null;
        rewritten.criticalFailure = match[1] ? `The target is ${match[1].replace(/^the target is /i, "")}.` : "The target is unaffected.";
    }
    optionRows.push("criticalFailure");
    claimed.push(...DEGREES.map(([degree, label]) => `${label} ${htmlToPlainText(rows[degree]).replace(/\s+/g, " ").trim()}`));
    const label = `${noun[0].toUpperCase()}${noun.slice(1)}`;
    return {
        html: `<p>${saveSentence[0]}</p><hr />${DEGREES.map(([degree, text]) => `<p><strong>${text}</strong> ${rewritten[degree]}</p>`).join("\n")}`,
        defense: { kind: "save", statistic, basic: false },
        choice: { label, values: Object.keys(options), options, rows: optionRows },
        claimed, sourceText: saveSentence[0]
    };
}
