// A save only for creatures that refuse an invitation (Annunciation of the Outer Gate): "You announce yourself in the name of certain grim pacts that
// predate mortal life. This is not a compulsion, but rather an invitation of sorts. The invitation is understood by creatures in the area with
// telepathy and any who understand Aklo, Chthonian, Empyrean, Fey, or Utopian." / "Those who accept the invitation cannot take hostile action against
// others who agreed until 10 minutes pass and can communicate telepathically with them during that time. This effect ends immediately if any hostile
// action is taken against a creature that agreed." / "Those creatures who decline the choice or do not understand it must attempt a Will save." with
// rows "Nothing happens." / "The creature is Frightened 1. If it understood the invitation, its frightened status doesn't decrease at the end of any
// turn in which it damaged a creature that agreed to the invitation." / "As success, but … Frightened 2." / "As success, but … Frightened 3.": the
// GM leaves the accepting creatures out at review; the refusers' rows are their condition, with the floor as a note for the spell's duration; who
// understood, and the agreement among those who accepted, are notes.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const DECLINE = /^Those creatures who decline the choice or do not understand it must attempt an? (Fortitude|Reflex|Will) save\.$/;
const UNDERSTOOD = /^The invitation is understood by creatures in the area with telepathy and any who understand [A-Za-z, ]+\.$/;
const ACCEPT = /^Those who accept the invitation cannot take hostile action against others who agreed until (\d+) minutes pass and can communicate telepathically with them during that time\.$/;
const ENDS = /^This effect ends immediately if any hostile action is taken against a creature that agreed\.$/;
const FLOOR = /^If it understood the invitation, its frightened status doesn't decrease at the end of any turn in which it damaged a creature that agreed to the invitation\.$/;
const SUCCESS = new RegExp(String.raw`^The creature is (${C}Frightened \d\})\.$`);
const AS = new RegExp(String.raw`^As success, but the creature is (${C}Frightened \d\})\.$`);

/** {html, floor, notes, minutes, sentences} or null. */
export function rewriteInvitationSave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || !adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 3) return null;
    const first = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean), second = paragraphs[1].split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const decline = DECLINE.exec(paragraphs[2]), accept = ACCEPT.exec(second[0] ?? "");
    if (first.length !== 3 || !/\binvitation\b/.test(first[1]) || /\d|@/.test(first[0] + first[1]) || !UNDERSTOOD.test(first[2]) || second.length !== 2 || !accept || !ENDS.test(second[1])
        || !decline || decline[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const successParts = row("Success").split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const success = SUCCESS.exec(successParts[0] ?? ""), failure = AS.exec(row("Failure")), critical = AS.exec(row("Critical Failure"));
    if (rows.length !== 4 || !/^Nothing happens\.$/.test(htmlToPlainText(row("Critical Success"))) || successParts.length !== 2 || !success || !FLOOR.test(successParts[1]) || !failure || !critical) return null;
    return {
        html: `<p>Each creature in the area must attempt a ${decline[1]} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Success</strong> The creature is ${success[1]}.</p><p><strong>Failure</strong> The creature is ${failure[1]}.</p><p><strong>Critical Failure</strong> The creature is ${critical[1]}.</p>`,
        floor: successParts[1],
        minutes: Number(accept[1]),
        notes: [`Only creatures that decline the invitation or don't understand it save (it's understood by creatures with telepathy and those who understand the listed languages): leave out those who accept.`,
            `${second[0]} ${second[1]}`],
        sentences: [...first, ...second, paragraphs[2], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${htmlToPlainText(row(heading))}`)]
    };
}
