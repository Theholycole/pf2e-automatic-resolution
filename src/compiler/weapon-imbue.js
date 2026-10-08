// A weapon imbued with extra persistent damage and a granted reaction (Bone Flense): "The target weapon becomes imbued with … When a creature with a
// skeleton or exoskeleton takes damage from a Strike delivered by this weapon, … The creature takes an additional 1d6 persistent bleed damage from the
// Strike. You can use the Erupting Spurs reaction." with PF2e's two Effects — Damage (a weapon ChoiceSet; DamageDice bleed "(floor((@item.level - 1)/2))"
// d6 on that weapon's Strikes, predicated on a "bone-flense" option nothing sets) and Reaction (Erupting Spurs granted; its dice "6 + 4*…") — and
// "Heightened (+2) The persistent bleed damage increases by 1d6. The damage from Erupting Spurs increases by 4d6."
// Both Effects go on the weapon's wielder (the targeted creature, or the caster) with the weapon picked; the dice are persistent (the text over the
// data), on a toggle for a creature with a skeleton or exoskeleton (the roller's); the wielder's eligibility is the GM's.
import { htmlToPlainText } from "./description-parser.js";
import { SPELL_EFFECT_LINK_LABEL as LINK } from "./text-patterns.js";

const BLEED = /^The creature takes an additional (\d+)d(\d+) persistent ([a-z]+) damage from the Strike\.$/;
const WHEN = /^When a creature with a skeleton or exoskeleton takes damage from a Strike delivered by this weapon, [^.@\d]+\.$/;
const REACTION = /^You can use the @UUID\[(Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\} reaction\.$/;
const STEP = /^Heightened \(\+(\d)\) The persistent ([a-z]+) damage increases by (\d+)d(\d+)\. The damage from ([A-Za-z ]+) increases by (\d+)d(\d+)\.$/;

/** {weaponImbue, claimed} or null; the catalog proves PF2e's Effects. */
export function compileWeaponImbue(adapted, catalog) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || !/^1 weapon\b/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const links = paragraphs.map(paragraph => LINK.exec(paragraph)).filter(Boolean);
    const text = paragraphs.filter(paragraph => !LINK.test(paragraph));
    const sentences = text.flatMap(paragraph => htmlToPlainText(paragraph).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/)).filter(Boolean);
    const when = sentences.findIndex(sentence => WHEN.test(sentence));
    const bleed = BLEED.exec(sentences[when + 1] ?? ""), reaction = REACTION.exec(sentences[when + 2] ?? "");
    const step = STEP.exec(htmlToPlainText(rest.join(" ")).replace(/\s+/g, " ").trim());
    if (links.length !== 2 || when < 0 || !bleed || !reaction || sentences.length !== when + 3 || !step || step[2] !== bleed[3] || step[4] !== bleed[2] || step[5] !== reaction[2]
        || sentences.slice(0, when).some(sentence => /\d|@|\b(?:damage|saves?|bonus|penalty|DC)\b/i.test(sentence))) return null;
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effects = links.map(link => entries.find(entry => entry?.name === link[2] || entry?.id === link[1]));
    if (effects.some(effect => !effect?.id)) return null;
    const rank = Number(adapted.rank);
    const damage = effects.find(effect => (effect.mechanics?.rules ?? []).some(rule => rule.key === "DamageDice")), granted = effects.find(effect => effect !== damage);
    const dRules = damage?.mechanics?.rules ?? [], gRules = granted?.mechanics?.rules ?? [];
    const choice = dRules.findIndex(rule => rule.key === "ChoiceSet"), diceAt = dRules.findIndex(rule => rule.key === "DamageDice");
    const dice = dRules[diceAt], grant = gRules.find(rule => rule.key === "GrantItem"), alter = gRules.find(rule => rule.key === "DamageAlteration");
    const formula = value => String(value).replace(/\s+/g, "");
    const option = (dice?.predicate ?? []).find(term => typeof term === "string" && !/^item:/.test(term));
    // (The dice at the spell's rank: "(floor((@item.level - 1)/2))" is 1 at 3rd, one more each 2 ranks; the spurs' "6 + 4*(floor((@item.level - 3)/2))".)
    if (dRules.length !== 2 || choice < 0 || dRules[choice].flag !== "weapon" || dice?.damageType !== bleed[3] || dice.dieSize !== `d${bleed[2]}` || dice.category
        || formula(dice.diceNumber) !== `(floor((@item.level-1)/${step[1]}))` || Math.floor((rank - 1) / Number(step[1])) !== Number(bleed[1]) || Number(step[3]) !== 1
        || !option || gRules.length !== 2 || grant?.uuid !== reaction[1] || alter?.property !== "dice-number" || !formula(alter.value).endsWith(`+${step[6]}*(floor((@item.level-${rank})/${step[1]}))`)) return null;
    return { weaponImbue: { recipient: "wielder", choiceFlag: "weapon",
        effects: [
            { uuid: `Compendium.pf2e.spell-effects.Item.${damage.id}`, name: damage.name, ruleOverrides: [{ index: diceAt, key: "DamageDice", patch: { category: "persistent" } }],
                ruleAdditions: [{ key: "RollOption", domain: "all", option, toggleable: true, label: "The creature has a skeleton or exoskeleton", value: false }] },
            { uuid: `Compendium.pf2e.spell-effects.Item.${granted.id}`, name: granted.name }],
        notes: ["Target a weapon wielded by a member of the Red Mantis, or a praying mantis's leg Strike (the GM's).", "Switch on “The creature has a skeleton or exoskeleton” for a Strike against such a creature."] },
        claimed: [...sentences, ...links.map(link => link[0])] };
}
