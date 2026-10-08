// A weapon that grapples at range (Coiling Grasp): "You Grapple the target with the required weapon even if it would be outside the weapons normal reach using your
// Athletics modifier or your spell attack roll modifier, whichever is higher. When you Sustain a Spell, you attempt to maintain the Grapple against the target of the
// spell. The target can attempt to Escape as normal. You cannot use the required item or hand that is holding it while this spell is active and if you release your grip
// on the item the spell immediately ends. Instead of the normal effects, your Grapple has the following effects." with "Critical Success The target is Immobilized.
// You can make Spellstrikes and Strikes against the target with the required weapon." / "Success The target is Grabbed. …" / "Critical Failure The target can either
// grab you if you are within its reach, as if it succeeded at using the Grapple action against you, or force you to fall and land Prone." and the Heightened (3rd,
// 6th, 9th) sizes: the caster's Grapple — the higher of its Athletics and spell attack modifiers against the target's Fortitude DC (the target's size within the
// rank's limit); the row's condition until the end of the caster's next turn, the Sustain's control trying again; the critical failure's choice the target's
// (asked); the required weapon and the Escape notes.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const SIZE = { Tiny: "tiny", Small: "sm", Medium: "med", Large: "lg", Huge: "huge", Gargantuan: "grg" };
const LEAD = [/^You @UUID\[[^\]]+\]\{Grapple\} the target with the required weapon even if it would be outside the weapons normal reach using your @UUID\[[^\]]+\]\{Athletics\} modifier or your @UUID\[[^\]]+\]\{spell attack roll modifier\}, whichever is higher\.$/,
    /^When you @UUID\[[^\]]+\]\{Sustain a Spell\}, you attempt to maintain the Grapple against the target of the spell\.$/,
    /^(The target can attempt to @UUID\[[^\]]+\]\{Escape\} as normal\.)$/,
    /^(You cannot use the required item or hand that is holding it while this spell is active and if you release your grip on the item the spell immediately ends\.)$/,
    /^Instead of the normal effects, your Grapple has the following effects\.$/];
const ROWS = { criticalSuccess: /^The target is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{(Immobilized|Restrained|Grabbed)\}\. (You can make Spellstrikes and Strikes against the target with the required weapon\.)$/,
    success: /^The target is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{(Immobilized|Restrained|Grabbed)\}\. (You can make Spellstrikes and Strikes against the target with the required weapon\.)$/,
    criticalFailure: /^The target can either grab you if you are within its reach, as if it succeeded at using the Grapple action against you, or force you to fall and land @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Prone\}\.$/ };
const STEP = /^Heightened \((\d)(?:st|nd|rd|th)\) You may target and Grapple (Small|Medium|Large|Huge|Gargantuan) or smaller creatures with this spell\.$/;

/** {grapple, sentences} or null. */
export function extractWeaponGrapple(item) {
    const target = /^1 (Tiny|Small|Medium|Large|Huge) or smaller creature$/.exec(String(item?.system?.target?.value ?? "").trim());
    const rounds = /^(\d+) rounds?$/.exec(String(item?.system?.duration?.value ?? "").trim());
    if (!target || !rounds || !item.system?.duration?.sustained || item.system?.defense || Object.keys(item.system?.damage ?? {}).length) return null;
    const [body, heightened = "", ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const lead = (paragraphs[0] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const row = heading => paragraphs.find(p => p.startsWith(`<strong>${heading}</strong>`))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "";
    const rows = { criticalSuccess: ROWS.criticalSuccess.exec(row("Critical Success")), success: ROWS.success.exec(row("Success")), criticalFailure: ROWS.criticalFailure.exec(row("Critical Failure")) };
    const steps = [...heightened.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1]).filter(text => !/data-visibility|<em>Note:/.test(text))
        .map(text => STEP.exec(htmlToPlainText(text).replace(/\s+/g, " ").trim()));
    if (paragraphs.length !== 4 || lead.length !== LEAD.length + 1 || NARRATION_RULES.test(htmlToPlainText(lead[0])) || LEAD.some((pattern, index) => !pattern.test(lead[index + 1]))
        || Object.values(rows).some(entry => !entry) || row("Failure") || !steps.length || steps.some(entry => !entry)) return null;
    const plain = text => htmlToPlainText(text).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();
    return {
        grapple: { maxSize: SIZE[target[1]], sizes: steps.map(step => ({ rank: Number(step[1]), size: SIZE[step[2]] })), seconds: Number(rounds[1]) * 6, defense: "fortitude",
            rows: { criticalSuccess: { uuid: rows.criticalSuccess[1], slug: rows.criticalSuccess[2].toLowerCase() }, success: { uuid: rows.success[1], slug: rows.success[2].toLowerCase() },
                criticalFailure: { prone: rows.criticalFailure[1] } },
            notes: [plain(LEAD[2].exec(lead[3])[1]), plain(LEAD[3].exec(lead[4])[1]), plain(rows.success[3])] },
        sentences: [...lead.slice(1).map(plain), plain(row("Critical Success")), plain(row("Success")), plain(row("Critical Failure")), ...steps.map(step => step[0])]
    };
}

/** The largest size the cast rank allows. */
export function grappleSizeAt(grapple, rank) {
    return [...grapple.sizes].filter(step => Number(rank) >= step.rank).at(-1)?.size ?? grapple.maxSize;
}
