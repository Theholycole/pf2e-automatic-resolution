// Persistent bleed sealed with fire (Cauterize Wounds):
//   "Any target that has persistent bleed damage can choose to take @Damage[1[fire]|immutable:true] damage. If it does, it can attempt to
//   recover from its persistent bleed damage, with the lower DC for particularly effective assistance. During the spell's duration, you can use a
//   single action, which has the concentrate trait, to repeat this effect for one target of the spell."
// For each willing target taking persistent bleed: the fire damage (immutable), PF2e's Effect (the lower recovery DC) and PF2e's recovery
// check; a marker on the caster for the spell's duration whose Ongoing control repeats it for one of the targets.
import { htmlToPlainText } from "./description-parser.js";

const SEAL = /^Any target that has persistent ([a-z]+) damage can choose to take @Damage\[(\d+)\[([a-z]+)\]\|immutable:true\] damage\.$/;
const RECOVER = /^If it does, it can attempt to recover from its persistent ([a-z]+) damage, with the lower DC for particularly effective assistance\.$/;
const REPEAT = /^During the spell's duration, you can use a single action, which has the concentrate trait, to repeat this effect for one target of the spell\.$/;

/** Returns {cauterize, claimed} or null. */
export function compileCauterize(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const count = /^up to (\d+) willing creatures$/i.exec(String(adapted.targeting?.target ?? "").trim());
    const fixed = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!count || !fixed || /<hr\b|Heightened/i.test(String(adapted.descriptionHTML ?? ""))) return null;
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])].filter(effect => effect.resolutionStatus === "resolved");
    if (links.length !== 1) return null;
    const sentences = htmlToPlainText(String(adapted.descriptionHTML ?? "").replace(/@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/g, "")).replace(/\s+/g, " ").trim()
        .split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    // One sentence of narration, then the three rules.
    if (sentences.length !== 4 || /\d|@|\bdamage\b/i.test(sentences[0])) return null;
    const seal = SEAL.exec(sentences[1]), recover = RECOVER.exec(sentences[2]);
    if (!seal || !recover || !REPEAT.test(sentences[3]) || recover[1] !== seal[1]) return null;
    // PF2e's Effect: the lower recovery DC for that persistent damage, until the end of the turn.
    const rules = links[0].document?.mechanics?.rules ?? [];
    if (rules.length !== 1 || rules[0].key !== "ItemAlteration" || rules[0].property !== "pd-recovery-dc" || rules[0].mode !== "subtract"
        || JSON.stringify(rules[0].predicate) !== JSON.stringify([`item:damage:type:${seal[1]}`])) return null;
    return {
        cauterize: { persistentType: seal[1], damage: `${seal[2]}[${seal[3]}]`, maxTargets: Number(count[1]), durationSeconds: Number(fixed[1]) * (fixed[2].toLowerCase() === "round" ? 6 : 60),
            effect: { uuid: links[0].uuid, label: links[0].label ?? links[0].reference } },
        claimed: sentences
    };
}
