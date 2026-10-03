// A companion ward that grants the caster a damage-reducing reaction (Protect Companion):
//   "The target gains a +1 circumstance bonus to AC until the start of your next turn." / "You gain the @UUID[…]{Life Block} reaction; after
//   using the reaction, the spell ends and you can't cast protect companion again for 10 minutes." with "Heightened (+2) The reaction reduces
//   the damage by another 10, and you lose 5 more Hit Points. If you want to lose fewer Hit Points, you can choose to lower …" and PF2e's
//   Effect (that AC bonus). The reaction's own numbers ("Reduce the triggering damage by 10, but you lose 5 Hit Points.") are in PF2e's action,
//   which the runtime reads and checks before using them.
// Casting applies PF2e's Effect to the target (the caster's eidolon or minion). When the target takes damage while it has the Effect, the
// caster's card offers the reaction at each allowed tier: the damage is reduced (the Hit Points restored), the caster loses the Hit Points,
// the spell ends, and a lockout Effect on the caster refuses the spell for the stated time.
import { htmlToPlainText } from "./description-parser.js";

const AC = /^The target gains a \+(\d) circumstance bonus to AC until the start of your next turn\.$/;
const REACTION = /^You gain the @UUID\[(Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+(?: [A-Z][a-z]+)*)\} reaction; after using the reaction, the spell ends and you can't cast ([a-z ]+) again for (\d+) minutes\.$/;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The reaction reduces the damage by another (\d+), and you lose (\d+) more Hit Points\. If you want to lose fewer Hit Points, you can choose to lower the damage reduction and HP lost to what any lower-rank version of the spell could do without lowering the spell's actual rank\.\s*<\/p>$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|rounds?|minutes?|AC|Hit Points)\b/i;

/** Returns {grantedBlock, claimed} or null. */
export function compileGrantedBlock(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    if (!/^your eidolon, or a creature with the minion trait under your control$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    if (!/^until the start of your next turn$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (links.length !== 1 || links[0].resolutionStatus !== "resolved") return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (sections.length !== 2) return null;
    const heightened = HEIGHTENED.exec(sections[1]);
    const paragraphs = [...sections[0].matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    if (!heightened || paragraphs.length !== 2 || !/^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/.test(paragraphs[1])) return null;
    const sentences = htmlToPlainText(`<p>${paragraphs[0]}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => AC.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 2 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const ac = AC.exec(sentences[at]), reaction = REACTION.exec(sentences[at + 1]);
    if (!reaction || reaction[3].toLowerCase() !== String(adapted.source?.name ?? adapted.name ?? "").toLowerCase()) return null;
    const rules = links[0].document?.mechanics?.rules ?? links[0].document?.rules ?? [];
    if (rules.length !== 1 || rules[0].key !== "FlatModifier" || rules[0].selector !== "ac" || rules[0].type !== "circumstance" || Number(rules[0].value) !== Number(ac[1]) || rules[0].predicate?.length) return null;
    return {
        grantedBlock: {
            effect: { uuid: links[0].uuid, label: links[0].label ?? links[0].reference }, recipients: ["eidolon", "minion"],
            reaction: { uuid: reaction[1], name: reaction[2] }, step: { interval: Number(heightened[1]), reduction: Number(heightened[2]), hpLoss: Number(heightened[3]) }, lowerTiers: true,
            lockout: { seconds: Number(reaction[4]) * 60 }, notes: ["The target must be under the caster's control."], sourceText: sentences[at + 1]
        },
        claimed: [...sentences, htmlToPlainText(sections[1]).trim()]
    };
}

/** PF2e's reaction text: its trigger and base numbers. */
export function readBlockReaction(html) {
    const text = htmlToPlainText(String(html ?? "")).replace(/\s+/g, " ").trim();
    const trigger = /\bTrigger The spell's target would take damage\b/.test(text);
    const effect = /\bEffect Reduce the triggering damage by (\d+), but you lose (\d+) Hit Points\. Even if this reduces the damage to 0, the target still takes any effects that would come with the damage\b/.exec(text);
    return trigger && effect ? { reduction: Number(effect[1]), hpLoss: Number(effect[2]) } : null;
}

/** The reaction's tiers at a cast rank: the base, then one more per Heightened step (each tier can be chosen). */
export function blockTiers(base, step, castRank, baseRank = 1) {
    const steps = Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / step.interval));
    return Array.from({ length: steps + 1 }, (_, index) => ({ tier: index + 1, reduction: base.reduction + index * step.reduction, hpLoss: base.hpLoss + index * step.hpLoss }));
}

export function isExecutableGrantedBlock(data) {
    return Boolean(data) && typeof data.effect?.uuid === "string" && /^Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+$/.test(data.reaction?.uuid ?? "")
        && Number.isInteger(data.step?.interval) && data.step.interval > 0 && Number.isInteger(data.lockout?.seconds) && data.lockout.seconds > 0;
}
