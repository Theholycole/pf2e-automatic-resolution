// A seed that drains those around its host and then heals or harms it (Vital Seed): "Make a ranged spell attack to embed a seed of energy into your target. If
// the target is willing, you automatically succeed. A successful attack embeds the seed, causing it to drain essence out of nearby creatures, dealing 2d12 void
// damage with a basic Fortitude save to all other creatures in a 15-foot emanation from the target." / "The seed then erupts with vital energy—if the initial
// target is living, they recover Hit Points equal to twice the damage a single creature took from this spell; calculate these Hit Points using the creature
// that took the most damage. If the initial target is undead, it instead takes vitality damage equal to the amount a living creature would've healed." with
// "Heightened (+2) The seed's void damage increases by 1d12."
// The card's attack (PF2e's spell attack; a willing target is an automatic success); on a hit, the drain is a compiled basic save of the item's damage for the
// targeted creatures around it; the card's Erupt reads that save card's results and heals the target by twice the most any one took (vitality damage to an undead).
import { htmlToPlainText } from "./description-parser.js";

const ATTACK = /^Make a ranged spell attack to embed a seed of energy into your target\.$/;
const WILLING = /^If the target is willing, you automatically succeed\.$/;
const DRAIN = /^A successful attack embeds the seed, causing it to drain essence out of nearby creatures, dealing @Damage\[(\d+d\d+)\[([a-z]+)\](?:\|[^\]]*)?\] damage with a basic (Fortitude|Reflex|Will) save to all other creatures in an? @Template\[type:emanation\|distance:(\d+)\] from the target\.$/;
const ERUPT = /^The seed then erupts with vital energy[-—–]if the initial target is living, they recover Hit Points equal to (twice) the damage a single creature took from this spell; calculate these Hit Points using the creature that took the most damage\.$/;
const UNDEAD = /^If the initial target is undead, it instead takes (vitality) damage equal to the amount a living creature would've healed\.$/;
const STEP = /^Heightened \(\+(\d)\) The seed's ([a-z]+) damage increases by (\d+d\d+)\.$/;

/** {seedDrain, claimed} or null. */
export function compileSeedDrain(adapted) {
    const components = adapted.damageComponents ?? [];
    if (!/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || components.length !== 1 || !(adapted.activation?.traits ?? []).includes("attack")) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => ATTACK.test(sentence));
    const step = STEP.exec(htmlToPlainText(rest.join(" ")).replace(/\s+/g, " ").trim());
    if (at < 0 || sentences.length !== at + 5 || !WILLING.test(sentences[at + 1]) || !ERUPT.test(sentences[at + 3]) || !UNDEAD.test(sentences[at + 4]) || !step) return null;
    const drain = DRAIN.exec(sentences[at + 2]);
    if (!drain || String(components[0].formula).replace(/\s+/g, "") !== drain[1] || String(components[0].type).toLowerCase() !== drain[2] || step[2] !== drain[2]
        || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== Number(step[1]) || adapted.heightening.damage?.[components[0].id] !== step[3]) return null;
    return { seedDrain: { radius: Number(drain[4]), statistic: drain[3].toLowerCase(), formula: drain[1], type: drain[2], multiplier: 2, undeadType: UNDEAD.exec(sentences[at + 4])[1] }, claimed: sentences.slice(at).concat(step[0]) };
}
