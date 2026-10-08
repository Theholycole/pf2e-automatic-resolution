// A stationary area that strengthens the caster's spells cast in it (Manifest Wicket Dominion): "You create a stationary area of your wicket's dominion. When you Cast
// a Spell from Focus Points or your spell slots with your wicket traits while within the area and the spell deals damage or restores Hit Points, you gain a status
// bonus to that spell's damage or healing equal to the spell's rank. This applies only to the initial damage or healing the spell deals when cast. An individual
// creature takes this damage or benefits from this healing only once per spell, even if the spell would damage or heal that creature multiple times.": the
// emanation fixed where the caster stands; the caster, while inside, holds the status bonus (the spell's rank) to its slot and Focus spells with its wicket
// traits (the traits its wicket feat sets); the once-per-spell and initial-only limits a note. (The module's Effect asks for the target in the area and slot
// spells only; the module builds the rules from the text.)
import { htmlToPlainText } from "./description-parser.js";
import { ITEM_LINK as LINK, NARRATION_RULES } from "./text-patterns.js";

const AREA = /^You create a stationary area of your wicket['’]s dominion\.$/;
const BONUS = /^When you Cast a Spell from Focus Points or your spell slots with your wicket traits while within the area and the spell deals damage or restores Hit Points, you gain a status bonus to that spell['’]s damage or healing equal to the spell['’]s rank\.$/;
const LIMITS = [/^This applies only to the initial damage or healing the spell deals when cast\.$/, /^An individual creature takes this damage or benefits from this healing only once per spell, even if the spell would damage or heal that creature multiple times\.$/];
const SPECIAL = /^<strong>Special<\/strong> (This activity gains the trait of your magical tradition and your wicket traits\.)$/;

/** {dominion, sentences} or null. */
export function extractWicketDominion(item) {
    const area = item?.system?.area;
    if (area?.type !== "emanation" || !/^1 minute$/.test(String(item.system?.duration?.value ?? "").trim()) || item.system?.duration?.sustained || Object.keys(item.system?.damage ?? {}).length) return null;
    const [body, special = "", ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const sentences = (paragraphs[0] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const specialMatch = SPECIAL.exec(String(/<p>([\s\S]*?)<\/p>/.exec(special)?.[1] ?? "").replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 2 || sentences.length !== 5 || NARRATION_RULES.test(sentences[0]) || !AREA.test(sentences[1]) || !BONUS.test(sentences[2]) || !LIMITS[0].test(sentences[3])
        || !LIMITS[1].test(sentences[4]) || !LINK.test(paragraphs[1]) || !specialMatch) return null;
    const wicket = { or: ["item:trait:{actor|flags.pf2e.wicketTraits.a}", "item:trait:{actor|flags.pf2e.wicketTraits.b}"] };
    const fromSlotOrFocus = { or: ["item:spell-slot", { and: ["item:trait:focus", { not: "item:trait:cantrip" }] }] };
    return {
        dominion: { radius: Number(area.value), seconds: 60, centre: "caster-stationary",
            rules: [{ key: "FlatModifier", selector: ["spell-damage", "spell-healing"], type: "status", value: "@spell.level", predicate: [fromSlotOrFocus, wicket] }],
            notes: [`${sentences[3]} ${sentences[4]}`], sourceText: sentences[2] },
        sentences: [sentences[1], sentences[2], sentences[3], sentences[4], htmlToPlainText(specialMatch[1])]
    };
}
