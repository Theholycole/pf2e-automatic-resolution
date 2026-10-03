// A reservoir of vitality the caster carries (Vital Luminance): "… You glow with bright light in a 30-foot emanation (and dim light to the next 30 feet), and you
// gain an internal pool of light called a luminance reservoir, which begins with a value of 4. At the start of each of your turns, increase your reservoir by
// 4." / "If an undead creature damages you with an attack or spell while it's within the bright light of your aura, that creature takes vitality damage equal to
// half your luminance reservoir value. It takes this damage only the first time it damages you in a round." / "You can Dismiss this Spell. When you do, you can
// target a creature within your light and direct the vital energy into it. The target must be a willing living creature or an undead creature. This heals a
// living target or deals vitality damage to an undead target equal to your luminance reservoir's value." / "If you Cast this Spell again, any previous casting
// ends." with "Heightened (+1) Both the initial value of your luminance reservoir and the amount you gain each turn increase by 1." and PF2e's Effect (the
// light, a counter): that Effect on the caster, its counter the reservoir (raised as each of the caster's turns starts); the GM's control when an undead in the
// bright light damages the caster (half the reservoir, once a round); the Dismiss into a targeted creature (the reservoir's healing or damage); a new casting
// ends the earlier one.
import { htmlToPlainText } from "./description-parser.js";

const P1 = /^[A-Z][^.]*\. You glow with bright light in a (\d+)-foot emanation \(and dim light to the next (\d+) feet\), and you gain an internal pool of light called a luminance reservoir, which begins with a value of (\d+)\. At the start of each of your turns, increase your reservoir by (\d+)\.$/;
const P2 = /^If an undead creature damages you with an attack or spell while it's within the bright light of your aura, that creature takes vitality damage equal to half your luminance reservoir value\. It takes this damage only the first time it damages you in a round\.$/;
const P3 = /^You can Dismiss this Spell\. When you do, you can target a creature within your light and direct the vital energy into it\. The target must be a willing living creature or an undead creature\. This heals a living target or deals vitality damage to an undead target equal to your luminance reservoir's value\.$/;
const P4 = /^If you Cast this Spell again, any previous casting ends\.$/;
const STEP = /^Heightened \(\+1\) Both the initial value of your luminance reservoir and the amount you gain each turn increase by 1\.$/;
const LINK = /^@UUID\[Compendium\.pf2e\.spell-effects\.Item\.([^\]]+)\]\{([^}]+)\}$/;

/** {luminance, claimed} or null; the catalog proves PF2e's Effect (its light and counter). */
export function compileLuminance(adapted, catalog) {
    if (adapted.defense?.kind === "save" || adapted.targeting?.target || adapted.lifecycle?.sustained) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    if (paragraphs.length !== 5) return null;
    const text = paragraphs.slice(0, 4).map(paragraph => htmlToPlainText(paragraph).replace(/\s+/g, " ").trim());
    const p1 = P1.exec(text[0]), link = LINK.exec(paragraphs[4]);
    if (!p1 || !P2.test(text[1]) || !P3.test(text[2]) || !P4.test(text[3]) || !link || !STEP.test(htmlToPlainText(heightened).replace(/\s+/g, " ").trim())) return null;
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === link[2] || entry?.id === link[1]);
    const light = (effect?.mechanics?.rules ?? []).find(rule => rule.key === "TokenLight");
    if (!effect || effect.mechanics.rules.length !== 1 || !light || Number(light.value?.bright) !== Number(p1[1]) || Number(light.value?.dim) !== Number(p1[1]) + Number(p1[2])
        || effect.badge?.type !== "counter") return null;
    return {
        luminance: { effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, label: effect.name }, bright: Number(p1[1]), start: Number(p1[3]), perTurn: Number(p1[4]), step: 1, baseRank: Number(adapted.rank) || 1 },
        claimed: [...text, htmlToPlainText(heightened).trim()]
    };
}
