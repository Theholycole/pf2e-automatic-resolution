// Fixed-rank Heightened entries that change a save's rows, as a variant of the rows used from that rank on (the card swaps them in):
//   Sleep: "Heightened (4th) The creatures fall unconscious for 1 round on a failure or 1 minute on a critical failure. They fall prone and
//   release what they're holding, and they can't attempt Perception checks to wake up. When the duration ends, the creature is sleeping
//   normally instead of automatically waking up."
//   Zenith Star: "Heightened (4th) You ignore the Concealed condition against targets marked by zenith star." (the caster's rule, added to
//   the marked rows' note).
// Each variant is built from the base plan's rows; anything that doesn't line up leaves the entry to the rank gate.
import { htmlToPlainText } from "./description-parser.js";

const UNIT = { round: "rounds", minute: "minutes", hour: "hours" };
const PRONE_UUID = "Compendium.pf2e.conditionitems.Item.j91X7x0XSomq8d60";
const clone = value => JSON.parse(JSON.stringify(value));

const SLEEP = /^The creatures fall unconscious for (\d+) (round|minute|hour)s? on a failure or (\d+) (round|minute|hour)s? on a critical failure\. (They fall prone and release what they're holding, and they can't attempt Perception checks to wake up\.) (When the duration ends, the creature is sleeping normally instead of automatically waking up\.)$/;
// "The range increases to 150 feet, the area increases to a 40-foot-radius burst, and when a creature would become dazzled, they become
// Blinded instead." (the range and area are the template's).
const INSTEAD = /^(?:The range increases to \d+ feet, the area increases to an? \d+-foot-radius (?:burst|emanation), and )?when a creature would become ([a-z]+), they become ([A-Z][a-z]+) instead\.$/i;
const CONDITION_UUIDS = { blinded: "XgEqL1kFApUbl5Z2", dazzled: "TkIyaNPgTZFBCCuh", deafened: "9PR9y0bi4JPKnHPR" };
// "The divine plague disease gains the virulent trait. The condition value for the clumsy, enfeebled, or stupefied condition is 2 instead of
// 1": the affliction handed to Pseudo Afflictions, virulent and with those conditions' values raised in every stage.
const VIRULENT = /^The [a-z' ]+ (?:disease|poison|curse) gains the virulent trait\. The condition value for the ((?:[a-z]+, )*(?:[a-z]+,? or )?[a-z]+) condition is (\d+) instead of (\d+)\.?$/;
// You're Mine: "On a failure, the target is Controlled for 1 round. On a critical failure, the target is Controlled for up to 1 minute; it
// receives a new Will save at the end of each of its turns, and on a success, the spell ends." (the base critical failure's Controlled, reused).
const CONTROLLED = /^On a failure, the target is ([A-Z][a-z]+) for (\d+) (round|minute)s?\. On a critical failure, the target is \1 for up to (\d+) (round|minute|hour)s?; it receives a new (Fortitude|Reflex|Will) save at the end of each of its turns, and on a success, the spell ends\.$/;
const MARK_CONCEALED = /^(You ignore the Concealed condition against targets marked by [a-z' ]+\.)$/i;

function fixed(value, unit, sourceText) {
    return { mode: "fixed", value: Number(value), unit: UNIT[unit], expiry: unit === "round" ? "turn-start" : null, anchor: "effect-start", sourceText };
}

/** The affliction at a heightened rank (virulent, raised condition values), or null. */
function variantAffliction(handoff, text) {
    const virulent = VIRULENT.exec(text);
    if (!virulent || !handoff?.stages?.length) return null;
    const slugs = virulent[1].split(/,\s*(?:or\s+)?|\s+or\s+/).map(slug => slug.trim()).filter(Boolean);
    const [, , to, from] = virulent;
    const pattern = new RegExp(String.raw`(\{|\b)(${slugs.join("|")}) ${from}\b`, "gi");
    const stages = handoff.stages.map(stage => ({ ...stage, text: stage.text.replace(pattern, (_match, lead, name) => `${lead}${name} ${to}`) }));
    if (stages.every((stage, index) => stage.text === handoff.stages[index].text)) return null;
    // Pseudo Afflictions applies its own copy of the affliction (by the spell's slug): the handoff patches the Effect it makes — virulent,
    // and the stated conditions' values in every stage (and those already granted).
    const traits = handoff.traits ?? [];
    return { ...clone(handoff), traits: [...new Set([...traits, "virulent"])], stages,
        heightenedPatch: { virulent: true, values: Object.fromEntries(slugs.map(slug => [slug.toLowerCase(), Number(to)])), from: Number(from) } };
}

/** The rows at a heightened rank, from the base rows; null when the entry isn't one of these. */
function variantOutcomes(outcomes, text) {
    const sleep = SLEEP.exec(text);
    if (sleep) {
        const rows = clone(outcomes);
        for (const [degree, value, unit] of [["failure", sleep[1], sleep[2]], ["criticalFailure", sleep[3], sleep[4]]]) {
            const row = rows[degree];
            const unconscious = (row?.effects ?? []).filter(effect => effect.slug === "unconscious");
            if (unconscious.length !== 1 || row.effects.length !== 1) return null;
            const duration = fixed(value, unit, `for ${value} ${unit}`);
            unconscious[0].duration = { ...duration };
            // Prone lasts until the creature Stands (no timer of its own).
            row.effects.push({ kind: "condition", slug: "prone", name: "Prone", value: null, duration: null, source: "heightened", reference: PRONE_UUID.split(".").at(-1), raw: sleep[5] });
            // The waking note becomes what the heightened version says, for the same time.
            row.noteEffects = [{ label: "Asleep", text: `${sleep[5]} ${sleep[6]}`, sourceText: text, gmPlays: true, duration: { ...duration, offset: 0 } }];
        }
        return rows;
    }
    const instead = INSTEAD.exec(text);
    if (instead) {
        const from = instead[1].toLowerCase(), to = instead[2].toLowerCase();
        if (!CONDITION_UUIDS[to]) return null;
        const rows = clone(outcomes);
        let swapped = 0;
        for (const row of Object.values(rows)) for (const effect of row?.effects ?? []) if (effect.slug === from && effect.value == null) {
            Object.assign(effect, { slug: to, name: instead[2], reference: CONDITION_UUIDS[to], raw: text }); swapped += 1;
        }
        return swapped ? rows : null;
    }
    const controlled = CONTROLLED.exec(text);
    if (controlled) {
        const rows = clone(outcomes);
        const slug = controlled[1].toLowerCase();
        const base = (rows.criticalFailure?.effects ?? []).filter(effect => effect.slug === slug && effect.value == null);
        if (base.length !== 1 || rows.criticalFailure.effects.length !== 1) return null;
        rows.failure = { ...rows.failure, effects: [{ ...clone(base[0]), duration: fixed(controlled[2], controlled[3], `for ${controlled[2]} ${controlled[3]}`), raw: text }], noteEffects: [], rawText: text };
        const sourceText = text.split(/(?<=\.)\s+/)[1];
        rows.criticalFailure = { ...rows.criticalFailure, effects: [{ ...clone(base[0]), duration: fixed(controlled[4], controlled[5], `for up to ${controlled[4]} ${controlled[5]}`),
            recurringSave: { timing: "turn-end", mode: "end", statistic: controlled[6].toLowerCase(), sourceText }, raw: text }], rawText: text };
        return rows;
    }
    const mark = MARK_CONCEALED.exec(text);
    if (mark) {
        const rows = clone(outcomes);
        const marked = ["failure", "criticalFailure"].map(degree => rows[degree]).filter(row => (row?.noteEffects ?? []).length === 1);
        if (marked.length !== 2) return null;
        for (const row of marked) row.noteEffects[0].text = `${row.noteEffects[0].text} ${mark[1]}`;
        return rows;
    }
    return null;
}

/** [{minRank, sourceText, outcomes}] for the spell's fixed-rank entries that rewrite its rows. */
export function compileHeightenedVariants(plan, html) {
    if (plan.resolution?.kind !== "save" || !plan.resolution.outcomes) return [];
    const blocks = [...String(html ?? "").matchAll(/<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>([\s\S]*?)(?=<strong>\s*Heightened|$)/g)]
        .map(match => ({ rank: Number(match[1]), text: htmlToPlainText(match[2]).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim() }));
    const variants = [];
    for (const block of blocks) {
        if (block.rank <= Number(plan.rank)) continue;
        const outcomes = variantOutcomes(plan.resolution.outcomes, block.text);
        const affliction = !outcomes && plan.resolution.afflictionHandoff ? variantAffliction(plan.resolution.afflictionHandoff, block.text) : null;
        if (outcomes) variants.push({ minRank: block.rank, sourceText: block.text, outcomes });
        else if (affliction) variants.push({ minRank: block.rank, sourceText: block.text, outcomes: clone(plan.resolution.outcomes), afflictionHandoff: affliction });
    }
    return variants;
}
