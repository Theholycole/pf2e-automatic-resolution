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
import { HEADINGS, NARRATION_RULES_NO_TERRAIN as NARRATION_RULES, ATTEMPTS_SAVE as SAVE, trimmedSentences as split } from "./text-patterns.js";

const ROWS = {
    criticalSuccess: [/^The target is unaffected\.$/],
    success: [/^The target takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage, and the spell ends\.$/],
    failure: [/^The target takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage and @Damage\[(\d+d\d+)\[persistent,([a-z]+)\]\] damage\.$/,
        /^The persistent damage automatically ends when the spell ends\.$/,
        /^It is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Concealed\} to other creatures, and other creatures are concealed to it\.$/],
    criticalFailure: [/^As failure, but both the ([a-z]+) damage and the persistent ([a-z]+) damage increase to (\d+d\d+)\.$/]
};
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The ([a-z]+) damage and persistent ([a-z]+) damage increase by (\d+) \((\d+) on a critical failure\)\.\s*<\/p>$/;
// (Witches+'s Personal Blizzard+: "Heightened (+2) The cold damage increases by 1d6 and the persistent cold damage increases by 2 (2d6 and 4 on a critical
// failure).")
const HEIGHTENED_DICE = /^<p>\s*<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The ([a-z]+) damage increases by (\d+)d(\d+) and the persistent ([a-z]+) damage increases by (\d+) \((\d+)d(\d+) and (\d+) on a critical failure\)\.\s*<\/p>$/;

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
    const diced = heightened ? null : HEIGHTENED_DICE.exec(rest[0]);
    let step;
    if (heightened && heightened[2] === type && heightened[3] === type)
        step = { interval: Number(heightened[1]), flat: Number(heightened[4]), criticalFlat: Number(heightened[5]) };
    else if (diced && diced[2] === type && diced[5] === type && diced[4] === diced[8])
        step = { interval: Number(diced[1]), directDice: Number(diced[3]), persistentFlat: Number(diced[6]), criticalDirectDice: Number(diced[7]), criticalPersistentFlat: Number(diced[9]) };
    else return null;
    return {
        sustainedSaveDamage: { statistic: adapted.defense.statistic, type, durationSeconds: Number(minutes[1]) * 60,
            success: { formula: rows.success[0][1] }, failure: { formula: hit[1], persistent: hit[3] }, criticalFailure: { formula: rows.criticalFailure[0][3], persistent: rows.criticalFailure[0][3] },
            concealed: { uuid: rows.failure[2][1], text: rows.failure[2][0].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") },
            step },
        claimed: [...lead, ...Object.values(rows).flat().map(match => match[0]), htmlToPlainText(rest[0]).trim()]
    };
}

/** The formulas at a cast rank: each die expression plus the flat step (the critical failure's own step), or more dice and a flat persistent step. */
export function sustainedSaveDamageAt(data, degree, castRank, baseRank) {
    const steps = Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.step.interval));
    const critical = degree === "criticalFailure";
    const row = data[degree];
    const plus = (formula, add) => add ? `(${formula}+${add})` : formula;
    const moreDice = (formula, dice) => { const m = /^(\d+)d(\d+)$/.exec(formula); return m && dice ? `${Number(m[1]) + dice}d${m[2]}` : formula; };
    if (data.step.flat != null) {
        const add = critical ? steps * data.step.criticalFlat : steps * data.step.flat;
        return { direct: `${plus(row.formula, add)}[${data.type}]`, persistent: row.persistent ? `${plus(row.persistent, add)}[persistent,${data.type}]` : null };
    }
    const dice = steps * (critical ? data.step.criticalDirectDice : data.step.directDice);
    const flat = steps * (critical ? data.step.criticalPersistentFlat : data.step.persistentFlat);
    return { direct: `${moreDice(row.formula, dice)}[${data.type}]`, persistent: row.persistent ? `${plus(row.persistent, flat)}[persistent,${data.type}]` : null };
}
