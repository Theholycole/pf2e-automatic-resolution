// A brand that marks a foe for the caster's side (Celestial Brand): "A blazing symbol appears on the target, cursing it to face divine justice. You and your
// allies receive a +1 status bonus to your attack rolls and skill checks against it." / "Anytime a holy creature damages it, the holy creature deals an
// additional 1d4 spirit damage. The target is then temporarily immune for 1 minute." with "Heightened (+2) The spirit damage increases by 1." and PF2e's
// Effect (a TokenMark; the +1 status bonus against the mark; the holy holder's 1d4 spirit, +1 per 2 ranks above 5th): that Effect on the caster and each of
// its allies on the scene, marking the target (of the stated trait); the target immune to the spell for the stated time.
import { htmlToPlainText } from "./description-parser.js";
import { SPELL_EFFECT_LINK_LABEL as LINK } from "./text-patterns.js";

const LEAD = /^You and your allies receive a \+(\d) status bonus to your attack rolls and skill checks against it\.$/;
const HOLY = /^Anytime an? ([a-z]+) creature damages it, the \1 creature deals an additional (\d)d(\d+) ([a-z]+) damage\.$/;
const IMMUNE = /^The target is then temporarily immune for (\d+) (minute|hour)s?\.$/;
const STEP = /^Heightened \(\+(\d)\) The [a-z]+ damage increases by (\d+)\.$/;

/** {brandMark, claimed} or null; the catalog proves PF2e's Effect. */
export function compileBrandMark(adapted, catalog) {
    if (adapted.defense?.kind === "save") return null;
    const trait = /^1 ([a-z]+) creature$/.exec(String(adapted.targeting?.target ?? "").trim());
    const rounds = /^(\d+) rounds?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!trait || !rounds || adapted.targeting?.area) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const hParagraphs = [...heightened.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    if (paragraphs.length !== 2 || hParagraphs.length !== 2) return null;
    const first = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z@])/), second = paragraphs[1].split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const lead = LEAD.exec(first.at(-1) ?? ""), holy = HOLY.exec(second[0] ?? ""), immune = IMMUNE.exec(second[1] ?? "");
    const step = STEP.exec(htmlToPlainText(`<p>${hParagraphs[0]}</p>`).replace(/\s+/g, " ").trim()), link = LINK.exec(hParagraphs[1]);
    if (first.length !== 2 || /\d|@|\b(?:damage|save|bonus|penalty)\b/i.test(first[0]) || second.length !== 2 || !lead || !holy || !immune || !step || !link) return null;
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === link[2] || entry?.id === link[1]);
    const rules = effect?.mechanics?.rules ?? [];
    const mark = rules.find(rule => rule.key === "TokenMark");
    const bonus = rules.find(rule => rule.key === "FlatModifier" && JSON.stringify(rule.selector) === '["attack-roll","skill-check"]');
    const dice = rules.find(rule => rule.key === "DamageDice");
    const step2 = rules.find(rule => rule.key === "FlatModifier" && rule.selector === "damage");
    const marked = rule => (rule?.predicate ?? []).includes(`target:mark:${mark?.slug}`);
    if (!mark || rules.length !== 4 || !bonus || bonus.type !== "status" || Number(bonus.value) !== Number(lead[1]) || !marked(bonus)
        || !dice || dice.damageType !== holy[4] || Number(dice.diceNumber) !== Number(holy[2]) || dice.dieSize !== `d${holy[3]}` || !marked(dice) || !(dice.predicate ?? []).includes(`self:trait:${holy[1]}`)
        || !step2 || step2.damageType !== holy[4] || !marked(step2) || !(step2.predicate ?? []).includes(`self:trait:${holy[1]}`)
        || String(step2.value).replace(/\s+/g, "") !== `floor((@item.level-${Number(adapted.rank)})/${step[1]})`
        || effect.mechanics?.duration?.unit !== "rounds" || Number(effect.mechanics.duration.value) !== Number(rounds[1])) return null;
    return {
        brandMark: { effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, label: effect.name }, markSlug: mark.slug, targetTrait: trait[1], recipients: "caster-and-allies",
            immunity: { value: Number(immune[1]), unit: `${immune[2]}s`, sourceText: second[1] } },
        claimed: [...first, ...second, htmlToPlainText(`<p>${hParagraphs[0]}</p>`).trim()]
    };
}
