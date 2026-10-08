// Damage that also tells the caster about the target (Unsettling Perspective): "You reach into a creature's mind and … The target takes 2d10 mental
// damage and must attempt a Will save." with rows "The creature takes no damage." / "The creature takes half damage, and you gain a general sense of
// their position and importance within their society." / "The creature takes full damage, and you learn the creature's social status within their
// society as well as one of their connections to a leader in their society, if any exist." / "As failure, except the creature takes double damage
// and is @UUID[…]{Stunned 1}. You can attempt a skill check to @UUID[…]{Recall Knowledge} about the creature the next time you Refocus …": the
// rows' damage and Stunned; what the caster learns the GM's to tell (a card reminder per result). When PF2e's item has no damage, the text's is
// used (with its "Heightened (+N) The damage increases by 1dX." step).
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C, DEGREE_LABEL_PAIRS as DEGREES, HEIGHTENED_DAMAGE_STEP as STEP } from "./text-patterns.js";

const TAKES = /^The target takes (\d+d\d+) ([a-z]+) damage and must attempt a (Fortitude|Reflex|Will) save\.$/;
const NONE = /^The creature takes no damage\.$/;
const HALF = /^The creature takes half damage, and (you gain [^.]+)\.$/;
const FULL = /^The creature takes full damage, and (you learn [^.]+)\.$/;
const DOUBLE = new RegExp(String.raw`^As failure, except the creature takes double damage and is (${C}([A-Z][a-z]+)(?: (\d))?\})\. (You can attempt a skill check to (?:@UUID\[[^\]]+\]\{Recall Knowledge\}|Recall Knowledge) about the creature the next time you Refocus [^.]+)\.$`);

/** {html, reminder, textDamage, sentences} or null. */
export function rewriteInsightRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const takes = TAKES.exec(sentences.at(-1) ?? "");
    if (sentences.length !== 2 || !/^You reach into a creature's mind and [^0-9@]+\.$/.test(sentences[0]) || !takes) return null;
    if (takes[3].toLowerCase() !== adapted.defense.statistic) return null;
    if (components.length && (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== takes[1] || String(components[0].type).toLowerCase() !== takes[2])) return null;
    // (No damage in PF2e's item: the text's, at the cast rank by its one heightened step.)
    let textDamage = null;
    if (!components.length) {
        const step = heightened ? STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim()) : null;
        const [dice, die] = takes[1].split("d").map(Number);
        if (heightened && (!step || Number(step[3]) !== die)) return null;
        const baseRank = Number(adapted.rank) || 1;
        textDamage = { component: { id: "text-damage", formula: takes[1], type: takes[2], category: null, applyModifier: false, kinds: ["damage"], materials: [] },
            formula: step ? `(${dice}+floor((@item.rank - ${baseRank})/${Number(step[1])})*${Number(step[2])})d${die}[${takes[2]}]` : `${takes[1]}[${takes[2]}]`,
            note: `PF2e's item has no damage entry; the damage is read from the text (“${sentences.at(-1)}”${step ? `, heightened: ${step[0]}` : ""}).` };
    }
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const half = HALF.exec(row("Success")), full = FULL.exec(row("Failure")), double = DOUBLE.exec(row("Critical Failure"));
    if (rows.length !== 4 || !NONE.test(row("Critical Success")) || !half || !full || !double) return null;
    const learn = text => text.replace(/^you gain/, "the caster gains").replace(/^you learn/, "the caster learns");
    return {
        html: `<p>The target takes ${takes[1]} ${takes[2]} damage and must attempt a ${takes[3]} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Success</strong> The creature takes half damage.</p><p><strong>Failure</strong> The creature takes full damage.</p>`
            + `<p><strong>Critical Failure</strong> The creature takes double damage and is ${double[1]}.</p>${heightened ? `<hr />${heightened}` : ""}`,
        textDamage,
        reminder: { kind: "spell-note", text: `The GM tells the caster what they learn: on a success, ${learn(half[1])}; on a failure, ${learn(full[1])}; on a critical failure, the same, and the caster can attempt a skill check to Recall Knowledge about the creature the next time they Refocus.`,
            sourceText: `Success ${row("Success")}` },
        sentences: [...sentences, ...DEGREES.map(([, heading]) => `${heading} ${row(heading)}`)]
    };
}
