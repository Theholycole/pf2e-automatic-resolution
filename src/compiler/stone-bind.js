// Feet bound in stone (Ranage's Circle): "… By telling this tale, you condemn an enemy to a stony fate …" / "When you Cast this Spell, every square adjacent to
// the target becomes difficult terrain from the sudden eruption of plant life for 1 minute. The target also attempts a Fortitude save." with rows "The
// target is Clumsy 1 as their feet are bound within stone. This condition lasts until they move from their current position." / "The target is Clumsy 2
// and Immobilized as their legs are encased in rock. The clumsy condition lasts until they move …, and they can Escape from being immobilized with a check
// against your spell DC." / "The target is clumsy 2 and Restrained … they can Escape from being restrained with a successful check against your spell
// DC.": Clumsy as a note granting it until the creature moves (the GM ends it); Immobilized or Restrained until it Escapes at the spell DC; the
// adjacent difficult terrain a card reminder.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{`;
const TERRAIN = /^When you Cast this Spell, every square adjacent to the target becomes difficult terrain from [^.]+ for (\d+) (minute|round)s?\. The target also attempts a (Fortitude|Reflex|Will) save\.$/;
const SUCCESS = new RegExp(String.raw`^The target is ${C}(Clumsy) (\d)\} as their feet are bound within stone\. This condition lasts until they move from their current position\.$`);
const FAILURE = new RegExp(String.raw`^The target is ${C}Clumsy (\d)\} and (${C}(Immobilized)\}) as their legs are encased in rock\. The clumsy condition lasts until they move from their current position, and they can (?:@UUID\[[^\]]+\]\{Escape\}|Escape) from being immobilized with a check against your spell DC\.$`);
const CRITICAL = new RegExp(String.raw`^The target is clumsy (\d) and (${C}(Restrained)\}) as nearly their entire body is covered in basalt\. The clumsy condition lasts until they move from their current position, and they can Escape from being restrained with a successful check against your spell DC\.$`);

/** {html, notes, reminder, sentences} or null. */
export function rewriteStoneBind(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const terrain = TERRAIN.exec(paragraphs.at(-1) ?? "");
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    if (paragraphs.length !== 2 || /\d|@/.test(paragraphs[0]) || !terrain || terrain[3].toLowerCase() !== adapted.defense.statistic || rows.length !== 4
        || !/^The target is unaffected\.$/.test(plain("Critical Success")) || !success || !failure || !critical || failure[1] !== success[1]) return null;
    const clumsy = (heading, value) => ({ label: "Bound in stone", text: `Clumsy ${value} until it moves from its current position (the GM ends this then).`, sourceText: plain(heading), claimsRow: true, gmPlays: true,
        rules: [{ key: "GrantItem", uuid: success[1], flag: "conditionClumsy", onDeleteActions: { grantee: "restrict" }, alterations: [{ mode: "override", property: "badge-value", value: Number(value) }] }],
        duration: { mode: "unlimited", sourceText: "unlimited" } });
    return {
        html: `<p>The target must attempt a ${terrain[3]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is ${failure[3]} until it Escapes.</p><p><strong>Critical Failure</strong> The target is ${critical[2]} until it Escapes.</p>`,
        notes: { success: clumsy("Success", success[3]), failure: clumsy("Failure", failure[2]), criticalFailure: clumsy("Critical Failure", critical[1]) },
        reminder: { kind: "spell-note", text: `Every square adjacent to the target is difficult terrain for ${terrain[1]} ${terrain[2]}${terrain[1] === "1" ? "" : "s"} (mark it on the map).`, sourceText: paragraphs[1] },
        sentences: [...paragraphs, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
