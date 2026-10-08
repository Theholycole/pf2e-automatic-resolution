// A web whose creatures check each time they move in it or into it (Web):
//   "Squares filled with the web are difficult terrain." / "Each time a creature in the web begins to use a move action or enters the web during a
//   move action it's using, it must attempt an Athletics check or Reflex save against your spell DC to avoid taking a circumstance penalty to its
//   Speeds or becoming Immobilized." / "A creature that gets out of the web ceases to take a circumstance penalty to its Speed from the web." /
//   "Each square can be cleared of the web by a single attack or effect that deals at least 5 slashing damage or 1 fire damage." / "A square has
//   AC 5, and it automatically fails its saving throws." with the rows Critical Success (unaffected, no further checks this turn; with Athletics
//   it clears the squares it leaves), Success (unaffected during its action; the same clearing), Failure (−10-foot circumstance penalty to its
//   Speeds until the start of its next turn), Critical Failure (Immobilized until the start of its next turn, then the penalty for 1 round; it can
//   Escape), and "Heightened (4th) The spell's area increases to a 20-foot burst, and its range increases to 60 feet."
// The GM places the burst: a region that's difficult terrain. A creature entering it, or moving while in it, gets a card whose buttons roll its
// Athletics check or Reflex save against the spell DC (its choice); the outcome's penalty (lost on leaving the web) or Immobilized is applied, a
// critical success frees it for the rest of the turn; clearing squares is the GM's (edit the region).
import { htmlToPlainText } from "./description-parser.js";
import { HEADINGS, NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const TERRAIN = /^Squares filled with the web are difficult terrain\.$/;
const CHECK = /^Each time a creature in the web begins to use a move action or enters the web during a move action it's using, it must attempt an @Check\[(athletics)\] check or (Fortitude|Reflex|Will) save against your spell DC to avoid taking a circumstance penalty to its Speeds or becoming (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Immobilized\})\.$/;
const LEAVES = /^A creature that gets out of the web ceases to take a circumstance penalty to its Speed from the web\.$/;
const CLEAR = /^Each square can be cleared of the web by a single attack or effect that deals at least \d+ slashing damage or \d+ fire damage\.$/;
const SQUARE = /^A square has AC \d+, and it automatically fails its saving throws\.$/;
const ROWS = {
    criticalSuccess: /^The creature is unaffected, and it doesn't need to attempt further Athletics checks or saving throws against the web this turn\. If it used an Athletics check, it clears the web from every square it leaves during its movement\.$/,
    success: /^The creature is unaffected during its action\. If it used an Athletics check, it clears the web from every square it leaves during its movement\.$/,
    failure: /^The creature takes a [–−-](\d+)-foot circumstance penalty to its Speeds until the start of its next turn\.$/,
    criticalFailure: /^The creature is immobilized until the start of its next turn, after which it takes a [–−-](\d+)-foot circumstance penalty to its Speeds for (\d+) rounds?\. It can attempt to (?:@UUID\[[^\]]+\]\{Escape\}|Escape) to remove its immobilized condition\.$/
};
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*The spell's area increases to an? @Template\[burst\|distance:(\d+)\], and its range increases to \d+ feet\.\s*<\/p>$/;

/** Returns {webArea, claimed} or null. */
export function compileWebArea(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length || area?.type !== "burst" || adapted.lifecycle?.sustained) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || !table || rest.length !== 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => TERRAIN.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 5 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const check = CHECK.exec(sentences[at + 1]);
    if (!check || !LEAVES.test(sentences[at + 2]) || !CLEAR.test(sentences[at + 3]) || !SQUARE.test(sentences[at + 4]) || check[2].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = {};
    for (const [degree, heading] of Object.entries(HEADINGS)) {
        const text = htmlToPlainText(new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table)?.[1] ?? "").replace(/\s+/g, " ").trim();
        rows[degree] = ROWS[degree].exec(text);
        if (!rows[degree]) return null;
    }
    if (rows.failure[1] !== rows.criticalFailure[1]) return null;
    const heightened = HEIGHTENED.exec(rest[0]);
    if (!heightened) return null;
    return {
        webArea: { area: [{ minRank: Number(adapted.rank), feet: Number(area.value) }, { minRank: Number(heightened[1]), feet: Number(heightened[2]) }], durationSeconds: Number(minutes[1]) * 60,
            skill: check[1], statistic: check[2].toLowerCase(), immobilized: /@UUID\[([^\]]+)\]/.exec(check[3])[1], penalty: Number(rows.failure[1]), afterRounds: Number(rows.criticalFailure[2]),
            notes: [sentences[at + 3], sentences[at + 4], "With an Athletics success or critical success, the creature clears the web from every square it leaves: edit the region."] },
        claimed: [...sentences.slice(at), ...Object.values(rows).map(match => match[0]), htmlToPlainText(rest[0]).trim()]
    };
}

/** The burst's radius at a cast rank. */
export function webRadius(web, castRank) {
    return (web.area.filter(step => Number(castRank) >= step.minRank).at(-1) ?? web.area[0]).feet;
}
