// A spell attack that marks its target for the caster's weapon damage (Vindicator's Mark):
//   "Make a spell attack against the target. On a hit, you deal 2d4 spirit damage and the target is marked by a glowing nimbus of energy
//   that only you can see. For the duration of your spell, the marked target takes an additional +2 damage from all your weapon or unarmed
//   attacks. Invisible targets marked by your vindicator's mark are Concealed to you, rather than Undetected." / "You can Dismiss the spell
//   on your turn if your last action dealt damage to the target with a weapon or unarmed attack, instantly dealing an additional
//   @Damage[(ceil(@item.rank/2)+1)d6[spirit]] damage to it." with PF2e's Effect (a TokenMark and the Strike-damage bonus against the mark).
// The attack is rewritten to the ordinary one-sentence form (a spell attack's critical hit doubles its damage, PF2e's rule); on a hit, PF2e's Effect goes on the caster marking the target's token; the
// invisibility rule is a note; Dismissing (when the GM confirms the caster's last action damaged the target) deals the payoff to it.
import { htmlToPlainText } from "./description-parser.js";
import { SPELL_EFFECT_LINK_ANY as LINK } from "./text-patterns.js";

const ATTACK = /^Make a spell attack(?: roll)? against the target\.$/;
const HIT = /^On a hit, you deal (\d+d\d+) ([a-z]+) damage and the target is marked by [a-z ,]{3,80} that only you can see\.$/;
const BONUS = /^For the duration of your spell, the marked target takes an additional \+(\d+) damage from all your weapon or unarmed attacks\.$/;
const INVISIBLE = /^Invisible targets marked by your [a-z' ]+ are Concealed to you, rather than Undetected\.$/;
const DISMISS = /^You can Dismiss the spell on your turn if your last action dealt damage to the target with a weapon or unarmed attack, instantly dealing an additional @Damage\[(\(ceil\(@item\.(?:rank|level)\/2\)\+1\)d6|\d+d\d+)\[([a-z]+)\]\] damage to it\.$/;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+2\)\s*<\/strong>\s*The initial damage increases by (\d+d\d+), the additional damage you deal increases by 1, and the damage dealt when the spell is Dismissed increases by 1d6\.\s*<\/p>$/;
const TARGET = /^your hunted prey$/i;

/** {html, target, predicate, markClaim, dismissPayoff, note, sentences} or null. */
export function extractAttackMark(adapted) {
    if (!adapted.activation?.traits?.includes("attack") || !TARGET.test(String(adapted.targeting?.target ?? "").trim()) || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const cut = html.search(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i);
    const base = cut < 0 ? html : html.slice(0, cut), rest = cut < 0 ? "" : html.slice(cut);
    const plain = text => text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
    const sentences = htmlToPlainText(base).split(/(?<=[.!?}])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => ATTACK.test(sentence));
    if (at < 0 || sentences.length !== at + 6) return null;
    const [attack, hit, bonus, invisible, dismiss, link] = sentences.slice(at);
    const hitMatch = HIT.exec(hit), bonusMatch = BONUS.exec(bonus), dismissMatch = DISMISS.exec(dismiss);
    if (!hitMatch || !bonusMatch || !INVISIBLE.test(plain(invisible)) || !dismissMatch || !LINK.test(link)) return null;
    if (sentences.slice(0, at).some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|condition|attack)\b/i.test(sentence))) return null;
    if (String(components[0].formula).replace(/\s+/g, "") !== hitMatch[1] || String(components[0].type).toLowerCase() !== hitMatch[2]) return null;
    // "Heightened (+2) The initial damage increases by 2d4, …": the item's own heightening; the Effect and the Dismiss formula scale by rank.
    const heightened = rest.match(/<p>\s*<strong>\s*Heightened[\s\S]*?<\/p>/gi) ?? [];
    const step = heightened.length === 1 ? HEIGHTENED.exec(heightened[0].trim()) : null;
    if (heightened.length !== 1 || !step) return null;
    if (step && !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === 2 && adapted.heightening.damage?.[components[0].id] === step[1])) return null;
    if (step && !/^\(ceil\(@item\.(?:rank|level)\/2\)\+1\)d6$/.test(dismissMatch[1])) return null;
    return {
        // (The Effect link goes after the heightening, outside the attack's own text; the mark below binds it.)
        html: `<p>${sentences.slice(0, at).join(" ")} Make a spell attack roll against the target. On a hit, the target takes ${hitMatch[1]} ${hitMatch[2]} damage (double damage on a critical hit).</p>${rest}<p>${link}</p>`,
        target: "1 creature",
        predicate: { kind: "gm-confirmed", question: "Is this creature your hunted prey?", sourceText: "your hunted prey" },
        markClaim: { value: Number(bonusMatch[1]), sourceText: bonus, hitText: hit, heightens: !!step },
        dismissPayoff: { kind: "damage", formula: dismissMatch[1], damageType: dismissMatch[2], recipient: "marked-target",
            condition: "your last action dealt damage to the target with a weapon or unarmed attack", sourceText: dismiss },
        note: { kind: "mark-note", text: `${plain(invisible)} (The module doesn't change PF2e's detection.)`, sourceText: plain(invisible) },
        sentences: [hit, bonus, invisible, dismiss]
    };
}

/** PF2e's Effect: exactly a TokenMark and a Strike-damage bonus against that mark, worth the claim at the base rank (+1 per 2 ranks). */
export function proveStrikeMark(mechanics, claim, baseRank = 1) {
    const rules = mechanics?.rules ?? [];
    const mark = rules.find(rule => rule?.key === "TokenMark"), modifier = rules.find(rule => rule?.key === "FlatModifier");
    if (rules.length !== 2 || !mark || !modifier || Object.keys(mark).some(key => !["key", "slug"].includes(key)) || !/^[a-z0-9-]+$/.test(mark.slug ?? "")) return null;
    if (Object.keys(modifier).some(key => !["key", "predicate", "selector", "value", "type"].includes(key)) || modifier.selector !== "strike-damage"
        || JSON.stringify(modifier.predicate) !== JSON.stringify([`target:mark:${mark.slug}`])) return null;
    const value = rank => {
        const formula = String(modifier.value).replace(/@item\.(?:level|rank)/g, String(rank));
        return /^[\d\s+*/()ceilfloor.]+$/.test(formula) ? Function(`"use strict"; const ceil = Math.ceil, floor = Math.floor; return (${formula});`)() : NaN;
    };
    if (value(baseRank) !== claim.value) return null;
    if (claim.heightens && value(baseRank + 2) !== claim.value + 1) return null;
    return { slug: mark.slug };
}
