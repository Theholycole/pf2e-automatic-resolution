// A basic save of persistent damage whose victims save again at the end of each of their turns while it lasts (Dehydrate):
//   "All creatures in the area take 1d6 persistent fire damage with a basic Fortitude save; creatures with the water or plant traits get a
//   result one degree of success worse than they rolled." / "The spell ends for a creature when its persistent damage ends." / "A creature
//   affected by dehydrate attempts an additional Fortitude save at the end of each of its turns, before rolling to recover from the persistent
//   damage." / "It can forgo this additional save if it consumed water or a similar hydrating liquid within the last round (…)." with a
//   degree table for that additional save.
// Two ordinary plans: the cast's basic save (the text's own sentence says "basic"), and the additional save's degree table. After the cast,
// each creature taking that persistent damage gets an Ongoing record exposing it at the end of each of its turns (the GM confirms it didn't
// drink), ending when its persistent damage does.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_TIMED as NARRATION_RULES } from "./text-patterns.js";

const DAMAGE = /^All creatures in the (?:area|burst|emanation|cone|line) take (\d+d\d+) persistent ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save(?:; (creatures with the [a-z]+(?: or [a-z]+)? traits? get a result one degree of success (?:worse|better) than they rolled))?\.$/;
const ENDS = /^The spell ends for a creature when its persistent damage ends\.$/;
const AGAIN = /^A creature affected by [a-z' ]+ attempts an additional (Fortitude|Reflex|Will) save at the end of each of its turns, before rolling to recover from the persistent damage\.$/;
const FORGO = /^It can forgo this additional save if it (consumed [a-z ,]+) within the last round(?: \([^)]{1,80}\))?\.$/;

/** Returns {mainHTML, followHTML, followUp, claimed} or null. */
export function extractPersistentFollowUp(adapted) {
    if (adapted.defense?.kind !== "save" || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category !== "persistent") return null;
    const html = String(adapted.descriptionHTML ?? "");
    const parts = html.split(/<hr\s*\/?>/i);
    if (parts.length < 2 || parts.length > 3) return null;
    const [preamble, table, heightened = ""] = parts;
    if (!/<strong>\s*(?:Success|Failure)\s*<\/strong>/i.test(table) || /<strong>\s*Heightened/i.test(preamble) || (heightened && !/^\s*<p>\s*<strong>\s*Heightened/i.test(heightened))) return null;
    const plain = text => text.replace(/<em>([^<]*)<\/em>/g, "$1");
    const paragraphs = [...preamble.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(`<p>${plain(match[1])}</p>`).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 2) return null;
    const first = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z])/), second = paragraphs[1].split(/(?<=[.!?])\s+(?=[A-Z])/);
    const damageAt = first.findIndex(sentence => DAMAGE.test(sentence));
    if (damageAt < 0 || first.length !== damageAt + 2 || !ENDS.test(first[damageAt + 1]) || first.slice(0, damageAt).some(sentence => NARRATION_RULES.test(sentence))) return null;
    if (second.length !== 2 || !AGAIN.test(second[0]) || !FORGO.test(second[1])) return null;
    const [, dice, type, statistic, adjustment] = DAMAGE.exec(first[damageAt]);
    const [, againStatistic] = AGAIN.exec(second[0]);
    if (String(components[0].formula).replace(/\s+/g, "") !== dice || String(components[0].type).toLowerCase() !== type || statistic.toLowerCase() !== adapted.defense.statistic || againStatistic !== statistic) return null;
    // The additional save's table: every row about "the creature", only Success / Failure / Critical Failure (a critical success is a success).
    const rows = [...table.matchAll(/<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>\s*([\s\S]*?)<\/p>/gi)];
    if (!rows.length || table.replace(/<p>\s*<strong>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>[\s\S]*?<\/p>/gi, "").trim()) return null;
    const tableHTML = rows.map(([, degree, body]) => `<p><strong>${degree}</strong> ${body.trim().replace(/^The creature takes no additional effect\.$/, "The creature is unaffected.")}</p>`).join("");
    const adjusted = adjustment ? ` ${adjustment[0].toUpperCase()}${adjustment.slice(1)}.` : "";
    return {
        mainHTML: `<p>All creatures in the area take ${dice} persistent ${type} damage with a basic ${statistic} save.${adjusted}</p>${heightened ? `<hr />${heightened.trim()}` : ""}`,
        followHTML: `<p>The creature attempts a ${statistic} save.</p><hr />${tableHTML}`,
        followUp: { timing: "turn-end", damageType: type, statistic: statistic.toLowerCase(),
            question: `Did the creature ${FORGO.exec(second[1])[1].replace(/^consumed/, "consume")} within the last round? If so, it can forgo this save (Unaffected).`,
            note: "The additional save comes before its roll to recover from the persistent damage.", sourceText: second[0] },
        claimed: [...first, ...second]
    };
}
