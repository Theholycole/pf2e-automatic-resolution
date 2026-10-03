// A radiance that blesses the righteous and blinds the wicked (Radiant Heart of Devotion): "Your heart begins to glow with a radiance that fills the area with
// bright light. The spell has the following effects on creatures in the area, based on the creature's alignment on the good-evil axis." with "Good Creatures …
// gain a +1 status bonus to attack rolls and their Strikes deal an additional 1d6 spirit damage." / "Neutral Creatures … that begin their turn in the emanation
// must succeed at a Will save or be {Dazzled} for 1 round." / "Evil Creatures … or be {Blinded} for 1 round." and "Heightened (+2) The additional spirit damage
// increases by 1d6." — PF2e's remaster has no alignment: good is the caster, its allies and holy creatures; evil unholy creatures; neutral the rest (the GM can
// reclassify a creature from the card); the sustained emanation around the caster: the good inside hold the bonuses; the others save at the start of their turns.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = [/^You speak a fervent prayer for the heavens to assist you and your righteous allies\.$/, /^Your heart begins to glow with a radiance that fills the area with bright light\.$/,
    /^The spell has the following effects on creatures in the area, based on the creature's alignment on the good-evil axis\.$/];
const GOOD = /^Good creatures in the emanation gain a \+(\d) (status) bonus to attack rolls and their Strikes deal an additional (\d+)d(\d+) ([a-z]+) damage\.$/;
const SAVE = name => new RegExp(String.raw`^${name} creatures that begin their turn in the emanation must succeed at an? (Will|Fortitude|Reflex) save or be @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)\} for (\d+) rounds?\.$`);
const STEP = /^Heightened \(\+(\d)\) The additional ([a-z]+) damage increases by (\d+)d(\d+)\.$/;

/** {radiantHeart, claimed} or null. */
export function compileRadiantHeart(adapted) {
    if (adapted.lifecycle?.sustained !== true || adapted.targeting?.area?.type !== "emanation" || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const intro = /^\s*<p>([\s\S]*?)<\/p>\s*<ul>([\s\S]*)<\/ul>\s*$/.exec(body);
    if (!minutes || rest.length || !intro) return null;
    const sentences = htmlToPlainText(`<p>${intro[1]}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(sentences[index]))) return null;
    const items = Object.fromEntries([...intro[2].matchAll(/<li>\s*<strong>([^<]+)<\/strong>\s*([\s\S]*?)<\/li>/g)].map(match => [match[1].trim(), match[2].replace(/\s+/g, " ").trim()]));
    const good = GOOD.exec(htmlToPlainText(items["Good Creatures"] ?? "")), neutral = SAVE("Neutral").exec(items["Neutral Creatures"] ?? ""), evil = SAVE("Evil").exec(items["Evil Creatures"] ?? "");
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (Object.keys(items).length !== 3 || !good || !neutral || !evil || neutral[1] !== evil[1] || neutral[1].toLowerCase() !== adapted.defense?.statistic
        || (heightened.trim() && !(step && step[2] === good[5] && step[4] === good[4]))) return null;
    return { radiantHeart: { radius: Number(adapted.targeting.area.value), seconds: Number(minutes[1]) * 60, statistic: neutral[1].toLowerCase(),
            good: { bonus: Number(good[1]), type: good[2], dice: Number(good[3]), faces: Number(good[4]), damageType: good[5], step: step ? { interval: Number(step[1]), dice: Number(step[3]) } : null },
            neutral: { uuid: neutral[2], name: neutral[3], rounds: Number(neutral[4]) }, evil: { uuid: evil[2], name: evil[3], rounds: Number(evil[4]) } },
        claimed: [...sentences, ...Object.entries(items).map(([name, text]) => `${name} ${htmlToPlainText(text)}`), ...(step ? [step[0]] : [])] };
}
