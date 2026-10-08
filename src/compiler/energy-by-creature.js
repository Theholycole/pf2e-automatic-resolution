// Void or vitality depending on the creature:
//   Execute: "The target takes 70 void damage with a basic Fortitude save. If the target is undead or otherwise has void
//   healing, the spell loses the death and void traits and gains the vitality trait, and the target takes 70 vitality
//   damage with a basic Fortitude save." — PF2e's two variants (Void, Vitality) each carry one side; the variant cast
//   decides which creatures it can target.
//   Divine Armageddon: "A creature harmed by vitality damage, such as one with void healing, takes vitality damage instead
//   of void damage from this spell." — one roll; for undead and void-healing creatures the void part is vitality.
// The GM convenience rolls PF2e adds ("@Damage[(@item.level+2)d6[void],(@item.level+2)d6[spirit]]{Leveled …}") restate
// the damage for levelled creatures and are set aside.
import { SAVE_NAME_GROUP as SAVE, plainSentences as sentencesOf } from "./text-patterns.js";

const PAIR = new RegExp(String.raw`^The target takes (\d+d\d+|\d+) void damage with a basic ${SAVE} save\. If the target is undead or otherwise has void healing, the spell loses the death and void traits and gains the vitality trait, and the target takes \1 vitality damage with a basic \2 save\.$`);
const SWAP = /^A creature harmed by vitality damage, such as one with void healing, takes vitality damage instead of void damage from this spell\.$/;
// A paragraph holding only a "Leveled …" inline roll (its terms nest one level of brackets) of void or vitality damage.
const CONVENIENCE = /<p>\s*@Damage\[(?:[^\[\]]|\[[^\]]*\])*\[(?:void|vitality)\](?:[^\[\]]|\[[^\]]*\])*\]\{Leveled [A-Za-z +]+\}\s*<\/p>/g;

const CASTER_BLAST = /^You release your [a-z ]+ in a [a-z ]+ of energy, dealing (\d+d\d+) damage\.$/;
const CASTER_LIVING = /^If you're a living creature, this spell deals vitality damage and gains the vitality trait\.$/;
const CASTER_UNDEAD = /^If you're an undead creature, this spell deals void damage and gains the void trait\.$/;
const statName = statistic => statistic[0].toUpperCase() + statistic.slice(1).toLowerCase();

export function rewriteEnergyByCreature(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    const heightening = html.search(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i);
    const base = heightening >= 0 ? html.slice(0, heightening) : html;
    const rest = heightening >= 0 ? html.slice(heightening) : "";
    const components = adapted.damageComponents ?? [];
    const basic = adapted.defense?.kind === "save" && adapted.defense.basic === true;
    // Execute: the last two sentences are the pair; a leading narration sentence carries no rule.
    const sentences = sentencesOf(base.replace(CONVENIENCE, "").replace(/<hr\b[^>]*>/gi, ""));
    const pairAt = sentences.length >= 2 ? sentences.length - 2 : -1;
    const pairText = pairAt >= 0 ? `${sentences[pairAt]} ${sentences[pairAt + 1]}` : "";
    const pair = pairAt >= 0 ? PAIR.exec(pairText) : null;
    if (pair) {
        if (sentences.slice(0, pairAt).some(sentence => /\d|\bdamage|save\b/i.test(sentence))) return null;
        const component = components.length === 1 ? components[0] : null;
        const type = String(component?.type ?? "").toLowerCase();
        if (!component || component.category || !["void", "vitality"].includes(type) || String(component.formula).replace(/\s+/g, "") !== pair[1]
            || !basic || adapted.defense.statistic !== pair[2].toLowerCase()) return null;
        return {
            html: `<p>The target takes ${pair[1]} ${type} damage (basic ${statName(pair[2])} save).</p>${rest}`,
            // Void harms creatures without void healing; vitality harms the undead and void-healing creatures.
            predicate: type === "void" ? { kind: "not-undead-or-void-healing" } : { kind: "undead-or-void-healing" },
            evidence: { mode: "variant-energy", type, sourceText: pairText }
        };
    }
    // Spiritual Torrent: "You release your spiritual essence in a torrential blast of energy, dealing 10d6 damage." / "If you're a living
    // creature, this spell deals vitality damage and gains the vitality trait." / "If you're an undead creature, this spell deals void damage
    // and gains the void trait." — the item's vitality damage; an undead (or void-healing) caster's is void instead.
    const casterLiving = sentences.findIndex(sentence => CASTER_LIVING.test(sentence));
    if (casterLiving > 0 && CASTER_UNDEAD.test(sentences[casterLiving + 1] ?? "")) {
        const blast = CASTER_BLAST.exec(sentences[casterLiving - 1]);
        const component = components.length === 1 ? components[0] : null;
        if (!blast || !basic || !component || component.category || String(component.type).toLowerCase() !== "vitality" || String(component.formula).replace(/\s+/g, "") !== blast[1]
            || casterLiving !== 1 || sentences.length !== 3 || /@(?:Damage|Check)\[/.test(base)) return null;
        // (The action count's paragraph has already been settled by the variant.)
        return {
            html: `<p>Each creature in the area takes ${blast[1]} vitality damage (basic ${statName(adapted.defense.statistic)} save).</p>${rest}`,
            damageSwap: { from: "vitality", to: "void", when: "caster-undead", sourceText: `${sentences[casterLiving]} ${sentences[casterLiving + 1]}` },
            evidence: { mode: "damage-swap", sourceText: `${sentences[casterLiving]} ${sentences[casterLiving + 1]}` }
        };
    }
    // Divine Armageddon: the swap sentence (and the convenience rolls) are set aside; the damage stays one roll.
    const swapSentence = sentences.find(sentence => SWAP.test(sentence));
    if (swapSentence) {
        if (!basic || !components.some(component => String(component.type).toLowerCase() === "void" && !component.category)) return null;
        // What's left is a narration sentence (no rule) and the damage sentence naming every damage entry, which becomes
        // the canonical basic-save sentence (the save is the item's).
        const left = sentences.filter(sentence => sentence !== swapSentence);
        const damage = left.at(-1) ?? "";
        const named = components.every(component => !component.category && damage.includes(`${String(component.formula).replace(/\s+/g, "")} ${String(component.type).toLowerCase()} damage`));
        if (left.length > 2 || !/^(?:Creatures|Each creature) in the area takes? .+ damage\.$/.test(damage) || !named
            || left.slice(0, -1).some(sentence => /\d|\b(?:damage|save|condition|bonus|penalty)\b/i.test(sentence)) || /@(?:Damage|Check|Template)\[/.test(base.replace(CONVENIENCE, ""))) return null;
        return {
            html: `<p>${damage.replace(/\.$/, "")} (basic ${statName(adapted.defense.statistic)} save).</p>${rest}`,
            damageSwap: { from: "void", to: "vitality", when: "undead-or-void-healing", sourceText: swapSentence },
            evidence: { mode: "damage-swap", sourceText: swapSentence, convenienceRolls: (base.match(CONVENIENCE) ?? []).length }
        };
    }
    return null;
}
