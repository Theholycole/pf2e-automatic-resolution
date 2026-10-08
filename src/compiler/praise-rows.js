// A save whose quicker cast is weaker and whose failure disrupts speech (Channel Arrogance): "You can Cast this Spell using 1 action if … or using 3
// actions if …" / "The target takes 5d10 mental damage and other effects depending on its Will saving throw. If you Cast the Spell using 1 action,
// the target gets a result one degree of success better than it rolled." with rows "… half damage and is @UUID[…]{Fascinated} with you for 1 round." /
// "… full damage and is fascinated with you for 1 round. While fascinated with you, the target must succeed at a @Check[flat|dc:5] when attempting
// to Cast a Spell or use an action with the auditory trait. On a failure, the action is disrupted …" / "As failure, but double damage and the effect
// lasts for 1 minute.": the rows' damage and Fascinated for their time, the flat check a note for as long; the 1-action cast the GM's answer on the
// card (one degree better).
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C } from "./text-patterns.js";

const ACTIONS = /^You can Cast this Spell using 1 action if [^.]+, or using 3 actions if [^.]+\.$/;
const TAKES = /^The target takes (\d+d\d+) ([a-z]+) damage and other effects depending on its (Fortitude|Reflex|Will) saving throw\.$/;
const QUICK = /^If you Cast the Spell using 1 action, the target gets a result one degree of success better than it rolled\.$/;
const SUCCESS = new RegExp(String.raw`^The target takes half damage and is (${C}Fascinated\}) with you for 1 round\.$`);
const FAILURE = /^The target takes full damage and is fascinated with you for 1 round\. (While fascinated with you, the target must succeed at a @Check\[flat\|dc:5\] when attempting to Cast a Spell or use an action with the auditory trait\. On a failure, the action is disrupted [^.]+\.)$/;
const CRITICAL = /^As failure, but double damage and the effect lasts for 1 minute\.$/;

/** {html, quickSentence, flatText, sentences} or null. */
export function rewritePraiseRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 2) return null;
    const first = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean), second = paragraphs[1].split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const takes = TAKES.exec(second[0] ?? "");
    if (first.length !== 2 || /\d|@/.test(first[0]) || !ACTIONS.test(first[1]) || second.length !== 2 || !takes || !QUICK.test(second[1])) return null;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== takes[1] || String(components[0].type).toLowerCase() !== takes[2]
        || takes[3].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure"));
    if (rows.length !== 4 || !/^The creature is unaffected\.$/.test(htmlToPlainText(row("Critical Success"))) || !success || !failure || !CRITICAL.test(htmlToPlainText(row("Critical Failure")))) return null;
    return {
        html: `<p>The target must attempt a ${takes[3]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target takes half damage and is ${success[1]} for 1 round.</p><p><strong>Failure</strong> The target takes full damage and is ${success[1]} for 1 round.</p>`
            + `<p><strong>Critical Failure</strong> The target takes double damage and is ${success[1]} for 1 minute.</p>${heightened ? `<hr />${heightened}` : ""}`,
        quickSentence: second[1],
        flatText: htmlToPlainText(failure[1]).replace(/@Check\[flat\|dc:5\]/, "DC 5 flat check"),
        sentences: [...first, ...second, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${htmlToPlainText(row(heading))}`)]
    };
}
