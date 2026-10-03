// A sustained single-target save whose failure clings to the target (Personal Blizzard):
//   "The target attempts a Fortitude save." with the rows Critical Success (unaffected), Success ("The target takes 1d6 cold damage, and the
//   spell ends."), Failure ("The target takes 1d6 cold damage and 1d6 persistent cold damage. The persistent damage automatically ends when the
//   spell ends. It is Concealed to other creatures, and other creatures are concealed to it."), Critical Failure ("As failure, but both the cold
//   damage and the persistent cold damage increase to 2d6.") and "Heightened (+1) The cold damage and persistent cold damage increase by 1 (2 on
//   a critical failure)."
// The target's save is rolled against the spell DC. A success deals the damage and the spell ends. A failure or critical failure deals the
// damage and the persistent damage, and an Effect on the target makes it Concealed (others concealed to it: a note); a sustained record holds
// the Effect and the persistent damage, which end with it.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const SAVE = /^The target attempts an? (Fortitude|Reflex|Will) save\.$/;
const ROWS = {
    criticalSuccess: [/^The target is unaffected\.$/],
    success: [/^The target takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage, and the spell ends\.$/],
    failure: [/^The target takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage and @Damage\[(\d+d\d+)\[persistent,([a-z]+)\]\] damage\.$/,
        /^The persistent damage automatically ends when the spell ends\.$/,
        /^It is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Concealed\} to other creatures, and other creatures are concealed to it\.$/],
    criticalFailure: [/^As failure, but both the ([a-z]+) damage and the persistent ([a-z]+) damage increase to (\d+d\d+)\.$/]
};
const HEADINGS = { criticalSuccess: "Critical Success", success: "Success", failure: "Failure", criticalFailure: "Critical Failure" };
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The ([a-z]+) damage and persistent ([a-z]+) damage increase by (\d+) \((\d+) on a critical failure\)\.\s*<\/p>$/;
const split = text => text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);

/** Returns {sustainedSaveDamage, claimed} or null. */
export function compileSustainedSaveDamage(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.lifecycle?.sustained !== true || adapted.targeting?.area) return null;
    if (!/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || !table || rest.length !== 1) return null;
    const lead = split(htmlToPlainText(body));
    const save = SAVE.exec(lead.at(-1) ?? "");
    if (!save || save[1].toLowerCase() !== adapted.defense.statistic || lead.slice(0, -1).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const rows = {};
    for (const [degree, heading] of Object.entries(HEADINGS)) {
        const text = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table)?.[1];
        const sentences = split(htmlToPlainText(text ?? ""));
        if (sentences.length !== ROWS[degree].length) return null;
        rows[degree] = ROWS[degree].map((pattern, index) => pattern.exec(sentences[index]));
        if (rows[degree].some(match => !match)) return null;
    }
    const hit = rows.failure[0];
    const type = hit[2];
    if (rows.success[0][1] !== hit[1] || rows.success[0][2] !== type || hit[4] !== type || rows.criticalFailure[0][1] !== type || rows.criticalFailure[0][2] !== type) return null;
    const heightened = HEIGHTENED.exec(rest[0]);
    if (!heightened || heightened[2] !== type || heightened[3] !== type) return null;
    return {
        sustainedSaveDamage: { statistic: adapted.defense.statistic, type, durationSeconds: Number(minutes[1]) * 60,
            success: { formula: rows.success[0][1] }, failure: { formula: hit[1], persistent: hit[3] }, criticalFailure: { formula: rows.criticalFailure[0][3], persistent: rows.criticalFailure[0][3] },
            concealed: { uuid: rows.failure[2][1], text: rows.failure[2][0].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") },
            step: { interval: Number(heightened[1]), flat: Number(heightened[4]), criticalFlat: Number(heightened[5]) } },
        claimed: [...lead, ...Object.values(rows).flat().map(match => match[0]), htmlToPlainText(rest[0]).trim()]
    };
}

/** The formulas at a cast rank: each die expression plus the flat step (the critical failure's own step). */
export function sustainedSaveDamageAt(data, degree, castRank, baseRank) {
    const steps = Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.step.interval));
    const add = degree === "criticalFailure" ? steps * data.step.criticalFlat : steps * data.step.flat;
    const plus = formula => add ? `(${formula}+${add})` : formula;
    const row = data[degree];
    return { direct: `${plus(row.formula)}[${data.type}]`, persistent: row.persistent ? `${plus(row.persistent)}[persistent,${data.type}]` : null };
}
