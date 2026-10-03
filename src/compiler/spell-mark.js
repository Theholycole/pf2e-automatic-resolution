// A mark making the target vulnerable to the caster's spells for the rest of the turn (Invoke True Name):
//   "Until the end of the current turn, the target is Off-Guard against your spells and takes a -2 circumstance penalty to saving throws
//   against your spells." / "In addition, the first time this turn the target takes damage from one of your spells, it has weakness to that
//   damage equal to double the rank of invoke true name."
// One generated Effect on the target until the end of the current turn: Off-Guard's −2 circumstance to AC and the save penalty, each
// predicated on the caster's spells (PF2e's roll options `origin:signature:<caster>` and `item:type:spell`, checked live), and a custom
// Weakness (PF2e's IWR `definition`: `item:type:spell` and `self:signature:<caster>` in the damage's options) that the module removes
// after the caster's first spell damage to the target.
import { htmlToPlainText } from "./description-parser.js";

const MARK = /^Until the end of the current turn, the target is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Off-Guard\}) against your spells and takes a [-–−](\d) circumstance penalty to saving throws against your spells\.$/;
const WEAKNESS = /^In addition, the first time this turn the target takes damage from one of your spells, it has weakness to that damage equal to (double|triple) the rank of [a-z' ]+\.$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|rounds?|minutes?)\b/i;

// "The first ally that hits the target with a successful Strike deals additional precision damage equal to 1 + this spell's rank, and then the
// spell ends." (Glimpse Weakness; user decision): on the foe, a weakness to Strike damage of that amount, removed after the first Strike damage.
// PF2e's own Effect (built for the ally's Strikes) isn't applied.
const STRIKE_MARK = /^The first ally that hits the target with a successful Strike deals additional precision damage equal to (\d+) \+ this spell's rank, and then the spell ends\.$/;

function compileStrikeMark(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || adapted.activation?.traits?.includes("attack") || (adapted.damageComponents ?? []).length) return null;
    if (!/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.targeting?.area) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const links = nativeSpellEffects?.references ?? [];
    if (!minutes || links.length > 1) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<strong\b[^>]*>\s*(?:Heightened|Amp)\b/i.test(html)) return null;
    const sentences = htmlToPlainText(html.replace(/<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}\s*<\/p>/gi, "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => STRIKE_MARK.test(sentence));
    if (at < 0 || at !== sentences.length - 1 || at > 1 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    return {
        spellMark: { strikeWeakness: { base: Number(STRIKE_MARK.exec(sentences[at])[1]), perRank: 1 }, durationSeconds: Number(minutes[1]) * 60, sourceText: sentences[at],
            ...(links.length ? { ignoredEffect: links[0].label ?? links[0].reference } : {}) },
        claimed: sentences
    };
}

/** Returns {spellMark, claimed} or null. */
export function compileSpellMark(adapted, nativeSpellEffects) {
    const strike = compileStrikeMark(adapted, nativeSpellEffects);
    if (strike) return strike;
    if (adapted.defense?.kind !== "none" || adapted.activation?.traits?.includes("attack") || (adapted.damageComponents ?? []).length || (nativeSpellEffects?.references ?? []).length) return null;
    const target = String(adapted.targeting?.target ?? "").trim();
    if (!/^(?:1|one) creature(?: whose true name you know)?$/i.test(target) || adapted.targeting?.area || String(adapted.lifecycle?.duration ?? "").trim()) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<strong\b[^>]*>\s*Heightened\b/i.test(html)) return null;
    const sentences = htmlToPlainText(html.replace(/<\/?em>/g, "")).replace(/\s+/g, " ").replace(/\s+\./g, ".").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const markAt = sentences.findIndex(sentence => MARK.test(sentence));
    if (markAt < 0 || sentences.length !== markAt + 2 || !WEAKNESS.test(sentences[markAt + 1]) || markAt > 1 || sentences.slice(0, markAt).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const [, offGuard, penalty] = MARK.exec(sentences[markAt]);
    const [, times] = WEAKNESS.exec(sentences[markAt + 1]);
    return {
        spellMark: { offGuard: { uuid: /@UUID\[([^\]]+)\]/.exec(offGuard)[1], value: 2 }, savePenalty: { type: "circumstance", value: Number(penalty) },
            weakness: { perRank: times === "double" ? 2 : 3, once: true }, knownName: /true name/i.test(target), sourceText: sentences[markAt] },
        claimed: sentences
    };
}

/** The Effect's rules for the caster's signature at a cast rank. */
export function spellMarkRules(mark, { signature, castRank, spellName }) {
    const against = [`origin:signature:${signature}`, "item:type:spell"];
    return [
        { key: "FlatModifier", selector: "ac", type: "circumstance", value: -mark.offGuard.value, label: `${spellName}: Off-Guard against the caster's spells`, predicate: against },
        { key: "FlatModifier", selector: "saving-throw", type: mark.savePenalty.type, value: -mark.savePenalty.value, label: `${spellName}: against the caster's spells`, predicate: against },
        { key: "Weakness", type: "custom", value: mark.weakness.perRank * castRank, label: `${spellName} (the caster's spells)`, definition: ["item:type:spell", `self:signature:${signature}`] }
    ];
}

export function isExecutableSpellMark(mark) {
    if (mark?.strikeWeakness) return Number.isInteger(mark.strikeWeakness.base) && mark.strikeWeakness.base >= 0 && mark.strikeWeakness.perRank === 1
        && Number.isInteger(mark.durationSeconds) && mark.durationSeconds > 0;
    return Boolean(mark) && mark.offGuard?.value === 2 && /^Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+$/.test(mark.offGuard.uuid ?? "")
        && mark.savePenalty?.type === "circumstance" && Number.isInteger(mark.savePenalty.value) && mark.savePenalty.value >= 1 && mark.savePenalty.value <= 4
        && [2, 3].includes(mark.weakness?.perRank) && mark.weakness.once === true;
}


/** The Strike weakness on the foe: extra damage from the first Strike (PF2e's custom weakness on weapon or creature Strikes). */
export function strikeMarkRules(mark, { castRank, spellName }) {
    return [{ key: "Weakness", type: "custom", value: mark.strikeWeakness.base + mark.strikeWeakness.perRank * castRank, label: `${spellName} (the first Strike)`,
        definition: [{ or: ["item:type:weapon", "item:type:melee"] }] }];
}
