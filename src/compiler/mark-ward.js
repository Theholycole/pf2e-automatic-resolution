// A patron's mark that frightens those who target its bearers (Mark of Mystery): "The target ally also gains your mark of the patron somewhere on its person,
// allowing you to use your ally's position when determining your mark's effects as well as your own." / "In addition, when creatures target you or an ally with a
// harmful effect while the spell is active, they must attempt a Will save. Creatures that fail their save become Frightened 1 or Frightened 2 if it was a critical
// failure. Regardless of the result, a creature that succeeds its save or is no longer frightened by your mark is immune to this effect for 1 hour. Creatures of a
// type associated with your tradition listed below take a -1 status penalty to their saves against your effect and mindless creatures are not immune to the
// frightened condition from being mindless, though they may be immune for other reasons. This penalty also applies to spellcasters and dragons of your associated
// tradition." with the four traditions' creature types: the module's mark on the ally, and a ward on the caster and the ally — a creature targeting either with a
// harmful effect (an attack roll, or a save card the module starts) gets the Will save card (its own plan: Frightened 1 or 2, then immune for the hour); a creature
// of a type of the caster's tradition (or a dragon or spellcaster of it) holds the module's −1 status penalty Effect for that save.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_ID_LINK_VALUED as C, ITEM_LINK as LINK } from "./text-patterns.js";

const NARRATION_RULES = /\d|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const SHARE = /^The target ally also gains your mark of the patron somewhere on its person, allowing you to use your ally's position when determining your mark['’]s effects as well as your own\.$/;
const TRIGGER = /^In addition, when creatures target you or an ally with a harmful effect while the spell is active, they must attempt an? (Fortitude|Reflex|Will) save\.$/;
const ROWS = new RegExp(String.raw`^Creatures that fail their save become ${C} or ${C} if it was a critical failure\.$`);
const IMMUNE = /^Regardless of the result, a creature that succeeds its save or is no longer frightened by your mark is immune to this effect for (\d+) (hour|minute)s?\.$/;
const PENALTY = /^Creatures of a type associated with your tradition listed below take a -(\d) status penalty to their saves against your effect and mindless creatures are not immune to the frightened condition from being mindless, though they may be immune for other reasons\.$/;
const ALSO = /^This penalty also applies to spellcasters and dragons of your associated tradition\.$/;

/** {mainNote, followHTML, statistic, seconds, traditions, penalty, sentences} or null. */
export function extractMarkWard(item, catalog = null) {
    if (!/^1 ally$/i.test(String(item?.system?.target?.value ?? "").trim()) || !/^1 minute$/.test(String(item?.system?.duration?.value ?? "").trim()) || item.system?.duration?.sustained
        || Object.keys(item.system?.damage ?? {}).length || item.system?.area) return null;
    const html = String(item.system?.description?.value ?? "");
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const list = [...html.matchAll(/<li><strong>(Arcane|Divine|Occult|Primal)<\/strong>\s*([a-z, ]+)<\/li>/g)];
    if (paragraphs.length !== 3 || list.length !== 4) return null;
    const first = htmlToPlainText(paragraphs[0]).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const second = paragraphs[1].split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const plain = second.map(sentence => htmlToPlainText(sentence).replace(/\s+/g, " ").trim());
    const trigger = TRIGGER.exec(plain[0] ?? ""), rows = ROWS.exec(second[1] ?? ""), immune = IMMUNE.exec(plain[2] ?? ""), penalty = PENALTY.exec(plain[3] ?? ""), link = LINK.exec(htmlToPlainText(paragraphs[2]).trim());
    if (first.length !== 2 || NARRATION_RULES.test(first[0]) || !SHARE.test(first[1]) || second.length !== 5 || !trigger || !rows || !immune || !penalty || !ALSO.test(plain[4] ?? "") || !link) return null;
    if (rows[1] !== rows[4] || rows[2] !== rows[5] || rows[3] !== "1" || rows[6] !== "2" || trigger[1].toLowerCase() !== item.system?.defense?.save?.statistic) return null;
    // (The module's penalty Effect: −1 status to saves against this spell, as the text says.)
    const effect = catalog?.get?.(link[2]) ?? null, rules = effect?.mechanics?.rules ?? effect?.system?.rules ?? [];
    if (!(rules.length === 1 && rules[0].key === "FlatModifier" && rules[0].selector === "saving-throw" && rules[0].type === "status" && Number(rules[0].value) === -Number(penalty[1])
        && JSON.stringify(rules[0].predicate) === JSON.stringify([`item:slug:${item.system?.slug}`]))) return null;
    const link1 = (id, name, value) => `@UUID[Compendium.pf2e.conditionitems.Item.${id}]{${name} ${value}}`;
    return {
        followHTML: `<p>Each creature in the area must attempt a ${trigger[1]} save. Afterward, the creature is temporarily immune for ${immune[1]} ${immune[2]}${immune[1] === "1" ? "" : "s"}.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature is ${link1(rows[1], rows[2], rows[3])}.</p><p><strong>Critical Failure</strong> The creature is ${link1(rows[4], rows[5], rows[6])}.</p>`,
        statistic: trigger[1].toLowerCase(), seconds: 60,
        traditions: Object.fromEntries(list.map(entry => [entry[1].toLowerCase(), entry[2].split(",").map(type => type.trim()).filter(Boolean)])),
        penalty: { uuid: link[1], value: -Number(penalty[1]) },
        sentences: [first[1], ...plain]
    };
}
