// Note-only spells whose rule is an item (Summon Instrument, Arms of Nature, Mending): a conjured item held for the duration, or an item's Hit
// Points restored.
import { durationSeconds, plainText as plain, splitSentences as split } from "./description-parser.js";

const secondsOf = text => durationSeconds(text);
const ITEM = /@UUID\[(Compendium\.[^\]]+\.Item\.[^\]]+)\]\{([^}]+)\}/;

// Summon Instrument: "You materialize a @UUID[…]{Musical Instrument (Handheld)} in your grasp. … It vanishes when the spell ends. If you cast
// summon instrument again, any instrument you previously summoned disappears." with "Heightened (5th) The instrument is instead a @UUID[…]{…}."
// — that item in the caster's hand for the duration (the heightened one from its rank), removed when the spell ends or on a new cast.
const MATERIALIZE = new RegExp(`^You materialize an? ${ITEM.source} in your grasp\\.$`);
function namedItem(adapted, sentences, rest) {
    const seconds = secondsOf(adapted.lifecycle?.duration);
    const made = MATERIALIZE.exec(sentences[0] ?? "");
    if (!seconds || !made || String(adapted.targeting?.target ?? "").trim()) return null;
    const after = sentences.slice(1);
    const vanishes = after.some(sentence => /^It vanishes when the spell ends\.$/.test(sentence));
    const again = after.some(sentence => /^If you cast [a-z ]+ again, any [a-z]+ you previously summoned disappears\.$/.test(sentence));
    if (!vanishes || after.some(sentence => /\d|@|\b(?:bonus|penalty|damage|saves?|checks?|DC)\b/i.test(sentence))) return null;
    const steps = [];
    for (const section of rest) {
        const step = new RegExp(`^Heightened \\((\\d+)(?:st|nd|rd|th)\\) The [a-z]+ is instead an? ${ITEM.source}\\.$`).exec(plain(section));
        if (!step) return null;
        steps.push({ minRank: Number(step[1]), uuid: step[2], name: step[3] });
    }
    return { conjuredItem: { seconds, item: { uuid: made[1], name: made[2] }, steps, replacesPrevious: again, held: true,
        notes: after.filter(sentence => !/vanishes|previously summoned/.test(sentence)) }, claimed: [...sentences, ...rest.map(plain)] };
}

// Arms of Nature: "When you cast this spell, you draw forth a +1 weapon of your choice from the target. The weapon must be 2 Bulk or less. This
// weapon is of the same material as the target." with "Heightened (3rd) The weapon is a +1 striking weapon." … — a common base weapon the
// caster picks (at most that Bulk), with those runes at the cast rank, in the caster's hands for the duration. Its material is a note.
const DRAW = /^When you cast this spell, you draw forth a \+(\d) weapon of your choice from the target\.$/;
const STRIKING = { "": 0, "striking ": 1, "greater striking ": 2, "major striking ": 3 };
function chosenWeapon(adapted, sentences, rest) {
    const seconds = secondsOf(adapted.lifecycle?.duration);
    const at = sentences.findIndex(sentence => DRAW.test(sentence));
    const bulk = /^The weapon must be (\d+) Bulk or less\.$/.exec(sentences[at + 1] ?? "");
    if (!seconds || at < 0 || !bulk || sentences.slice(0, at).some(sentence => /\d|@|\b(?:bonus|penalty|damage|saves?|checks?|DC)\b/i.test(sentence))) return null;
    const after = sentences.slice(at + 2);
    if (after.some(sentence => !/^This weapon is of the same material as the target\.$/.test(sentence))) return null;
    const runes = [{ minRank: 1, potency: Number(DRAW.exec(sentences[at])[1]), striking: 0 }];
    for (const section of rest) {
        const step = /^Heightened \((\d+)(?:st|nd|rd|th)\) The weapon is a \+(\d) ((?:greater |major )?striking )?weapon\.$/.exec(plain(section));
        if (!step) return null;
        runes.push({ minRank: Number(step[1]), potency: Number(step[2]), striking: STRIKING[step[3] ?? ""] });
    }
    return { conjuredItem: { seconds, weapon: { maxBulk: Number(bulk[1]), rarity: "common" }, runes, held: true, notes: after }, claimed: [...sentences, ...rest.map(plain)] };
}

/** Returns {conjuredItem, claimed} or null. */
export function compileConjuredItem(adapted) {
    if ((adapted.defense?.kind !== "none" && adapted.defense?.kind !== undefined) || (adapted.damageComponents ?? []).length || adapted.lifecycle?.sustained) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").replace(/<\/?em>/g, "").split(/<hr\s*\/?>/i);
    const sections = rest.flatMap(section => section.split(/(?=<p>\s*<strong>\s*Heightened)/)).filter(section => plain(section));
    const sentences = split(plain(body));
    return namedItem(adapted, sentences, sections) ?? chosenWeapon(adapted, sentences, sections);
}

/** The conjured item or runes at a cast rank. */
export function conjuredAt(data, castRank) {
    const item = [data.item, ...(data.steps ?? []).filter(step => castRank >= step.minRank)].filter(Boolean).at(-1) ?? null;
    const runes = (data.runes ?? []).filter(step => castRank >= step.minRank).at(-1) ?? null;
    return { item, runes };
}

// Mending: "You restore 5 Hit Points per spell rank to the target, potentially removing the Broken condition if this repairs it past the item's
// Broken Threshold. You can't replace lost pieces or repair an object that's been completely destroyed." with the target "non-magical object of
// light Bulk or less" and heightened targets — an item of the target creature (or the caster) within those limits at the cast rank, not
// destroyed, gets 5 × rank Hit Points (to its maximum).
const RESTORE = /^You restore (\d+) Hit Points per spell rank to the target, potentially removing the (?:@UUID\[[^\]]+\]\{Broken\}|Broken) condition if this repairs it past the item's Broken Threshold\.$/;
const BULK = text => /^light$/i.test(text) ? 0.1 : Number(text);
export function compileItemRepair(adapted) {
    const target = /^non-magical object of (light|\d+) Bulk or less$/i.exec(String(adapted.targeting?.target ?? "").trim());
    if (!target || String(adapted.lifecycle?.duration ?? "").trim() || (adapted.damageComponents ?? []).length) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body));
    const restore = RESTORE.exec(sentences[1] ?? "");
    if (!restore || sentences.length !== 3 || !/^You repair the target item\.$/.test(sentences[0]) || !/^You can't replace lost pieces or repair an object that's been completely destroyed\.$/.test(sentences[2])) return null;
    const limits = [{ minRank: 1, nonMagicalBulk: BULK(target[1]), magicalBulk: null }];
    for (const section of rest.flatMap(section => section.split(/(?=<p>\s*<strong>\s*Heightened)/)).filter(section => plain(section))) {
        const step = /^Heightened \((\d+)(?:st|nd|rd|th)\) You can target a non-magical object of (light|\d+) Bulk or less(?:, or a magical object of (light|\d+) Bulk or less)?\.$/.exec(plain(section));
        if (!step) return null;
        limits.push({ minRank: Number(step[1]), nonMagicalBulk: BULK(step[2]), magicalBulk: step[3] ? BULK(step[3]) : null });
    }
    return { itemRepair: { perRank: Number(restore[1]), limits }, claimed: [...sentences, ...rest.map(plain)] };
}

/** Whether an item (its Bulk, magical, Hit Points) can be mended at a cast rank. */
export function mendable(data, item, castRank) {
    const limit = data.limits.filter(step => castRank >= step.minRank).at(-1);
    const max = item.magical ? limit.magicalBulk : limit.nonMagicalBulk;
    return max !== null && max !== undefined && Number(item.bulk) <= max && Number(item.hp?.max) > 0 && Number(item.hp?.value) > 0 && Number(item.hp.value) < Number(item.hp.max);
}
