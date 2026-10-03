// A sustained bargain on the caster (Wish Market):
//   "You gain a +1 status bonus to Perception checks and your choice of Acrobatics, Athletics, Nature, Occultism, or Religion checks for
//   the spell's duration, and you can either Recall Knowledge or Seek as a free action." / "However, you also pay a random price; roll 1d4
//   on the table below." / "The first time each round you Sustain the spell, you can either Recall Knowledge or Seek as a free action or
//   haggle with the merchant to suppress the price's penalty for 1 round." with a table of prices ("For the spell's duration, you take a
//   –2 status penalty to Diplomacy and Society checks.") and "Heightened (4th) The status bonus increases to +2."
// Casting asks the caster's skill, rolls the price, and puts one generated Effect on the caster: the bonus to Perception and the skill,
// and the price's penalties, switched off while the caster holds the 1-round "price suppressed" Effect (the card's Haggle control). The
// free actions and the once-a-round limit are the caster's.
import { htmlToPlainText } from "./description-parser.js";

export const OFFER_SKILLS = ["acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy", "intimidation", "medicine", "nature", "occultism",
    "performance", "religion", "society", "stealth", "survival", "thievery"];
const SKILL = String.raw`(?:${OFFER_SKILLS.map(skill => skill[0].toUpperCase() + skill.slice(1)).join("|")})`;
const BONUS = new RegExp(String.raw`^You gain a \+(\d) (status|circumstance) bonus to Perception checks and your choice of ((?:${SKILL}, )+(?:or )?${SKILL}) checks for the spell's duration, and you can either (Recall Knowledge|Seek) or (Recall Knowledge|Seek) as a free action\.$`);
const PRICE = /^However, you also pay a random price; roll (1d\d+) on the table below\.$/;
const SUSTAIN = /^The first time each round you Sustain the spell, you can either (Recall Knowledge|Seek) or (Recall Knowledge|Seek) as a free action or ([a-z ]{3,40}) to suppress the price's penalty for (\d+) rounds?\.$/;
const ROW = new RegExp(String.raw`^<td>\s*<p>\s*(\d+)\s*</p>\s*</td>\s*<td>\s*<p>\s*<strong>\s*([^<:]{2,40}?)\s*</strong>\s*:\s*For the spell's duration, you take a [–-](\d) (status|circumstance) penalty to (${SKILL}) and (${SKILL}) checks\.\s*</p>\s*</td>$`);
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*The (status|circumstance) bonus increases to \+(\d)\.\s*<\/p>$/;
// The spell's opening narration: no rule words.
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|heal\w*|Hit Points|Sustain|immune|can't|must|checks?|actions?|each|until|rounds?|minutes?)\b/i;

/** Returns {offer, claimed} or null. */
export function compileOfferEffect(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || (nativeSpellEffects?.references ?? []).length) return null;
    if (adapted.lifecycle?.sustained !== true || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const cut = html.search(/<hr\s*\/?>/i);
    const body = cut < 0 ? html : html.slice(0, cut);
    const table = /<table\b[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>\s*<\/table>/i.exec(body);
    if (!table || (body.match(/<table\b/gi) ?? []).length !== 1) return null;
    const prose = body.replace(table[0], "");
    if ((prose.match(/<p>/gi) ?? []).length !== 1) return null;
    const plain = text => text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\[\[\/act ([a-z-]+)\]\]/g, (_, slug) => slug.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join(" "));
    const sentences = plain(htmlToPlainText(prose)).split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    const bonusAt = sentences.findIndex(sentence => BONUS.test(sentence));
    if (bonusAt < 0 || sentences.length !== bonusAt + 3 || !PRICE.test(sentences[bonusAt + 1]) || !SUSTAIN.test(sentences[bonusAt + 2])) return null;
    if (sentences.slice(0, bonusAt).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const bonus = BONUS.exec(sentences[bonusAt]), price = PRICE.exec(sentences[bonusAt + 1]), sustain = SUSTAIN.exec(sentences[bonusAt + 2]);
    const skills = bonus[3].replace(/,? or /, ", ").split(", ").map(skill => skill.toLowerCase());
    if (new Set(skills).size !== skills.length || new Set([bonus[4], bonus[5]]).size !== 2 || new Set([sustain[1], sustain[2]]).size !== 2) return null;
    // The price table: faces 1..N of the rolled die, each two skills' penalty.
    const rows = [...table[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)].map(match => ROW.exec(match[1].trim()));
    if (!rows.length || rows.some(row => !row)) return null;
    const faces = Number(price[1].split("d")[1]);
    if (rows.length !== faces || rows.some((row, index) => Number(row[1]) !== index + 1)) return null;
    const priceRows = rows.map(row => ({ face: Number(row[1]), label: row[2].trim(), type: row[4], value: -Number(row[3]), skills: [row[5].toLowerCase(), row[6].toLowerCase()] }));
    if (priceRows.some(row => row.skills[0] === row.skills[1] || row.skills.some(skill => skills.includes(skill)))) return null;
    // Heightened entries: each only raises the bonus.
    const entries = cut < 0 ? [] : [...html.slice(cut).matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim());
    const byRank = [];
    for (const entry of entries) {
        const raised = HEIGHTENED.exec(entry);
        if (!raised || raised[2] !== bonus[2]) return null;
        byRank.push({ rank: Number(raised[1]), value: Number(raised[3]) });
    }
    if (byRank.some((entry, index) => entry.value <= (index ? byRank[index - 1].value : Number(bonus[1])) || (index && entry.rank <= byRank[index - 1].rank))) return null;
    return {
        offer: {
            bonus: { type: bonus[2], value: Number(bonus[1]), byRank, perception: true, skills },
            freeActions: [bonus[4], bonus[5]],
            price: { formula: price[1], rows: priceRows },
            suppress: { rounds: Number(sustain[4]), action: sustain[3], sourceText: sentences[bonusAt + 2] },
            durationSeconds: Number(minutes[1]) * 60,
            text: sentences.join(" ")
        },
        claimed: sentences
    };
}

/** The bonus at a cast rank. */
export function offerBonusAt(offer, castRank) {
    return (offer.bonus.byRank ?? []).filter(entry => entry.rank <= castRank).at(-1)?.value ?? offer.bonus.value;
}

/** Whether a plan's offer is one the runtime can carry out. */
export function isExecutableOffer(offer) {
    const typed = type => ["status", "circumstance"].includes(type);
    return Boolean(offer) && typed(offer.bonus?.type) && Number.isInteger(offer.bonus.value) && offer.bonus.value > 0 && offer.bonus.value <= 4
        && Array.isArray(offer.bonus.skills) && offer.bonus.skills.length >= 2 && offer.bonus.skills.every(skill => OFFER_SKILLS.includes(skill))
        && (offer.bonus.byRank ?? []).every(entry => Number.isInteger(entry.rank) && Number.isInteger(entry.value) && entry.value > 0 && entry.value <= 4)
        && /^1d\d+$/.test(offer.price?.formula ?? "") && Array.isArray(offer.price.rows) && offer.price.rows.length === Number(offer.price.formula.slice(2))
        && offer.price.rows.every((row, index) => row.face === index + 1 && typed(row.type) && Number.isInteger(row.value) && row.value < 0 && row.value >= -4
            && row.skills.length === 2 && row.skills.every(skill => OFFER_SKILLS.includes(skill) && !offer.bonus.skills.includes(skill)))
        && Number.isInteger(offer.suppress?.rounds) && offer.suppress.rounds >= 1 && Number.isInteger(offer.durationSeconds) && offer.durationSeconds > 0;
}

/** The slug of the Effect that switches the price off (its PF2e roll option is `self:effect:<slug>`). */
export function offerSuppressSlug(spellName) {
    return `${String(spellName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-price-suppressed`;
}

/** The generated Effect's rules: the bonus to Perception and the chosen skill, and the price's penalties while not suppressed. */
export function offerRules(offer, { castRank, skill, row, spellName }) {
    const value = offerBonusAt(offer, castRank);
    const suppressed = `self:effect:${offerSuppressSlug(spellName)}`;
    return [
        { key: "FlatModifier", selector: "perception", type: offer.bonus.type, value, label: spellName },
        { key: "FlatModifier", selector: skill, type: offer.bonus.type, value, label: spellName },
        ...row.skills.map(selector => ({ key: "FlatModifier", selector, type: row.type, value: row.value, label: `${spellName}: ${row.label}`, predicate: [{ not: suppressed }] }))
    ];
}
