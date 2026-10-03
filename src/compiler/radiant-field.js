// A field of bright light that keeps light-blinded creatures blinded (Radiant Field):
//   "You create an area of bright light." / "Creatures with Light Blindness that are Blinded by radiant field and remain in the area must attempt
//   a Fortitude save at the start of their turns." / "On a failure, a creature remains blinded for 1 round; this is an incapacitation effect." /
//   "This spell also suppresses magical darkness of your radiant field spell's rank or lower." with "Heightened (4th) Creatures seen through the
//   area are Concealed to creatures outside the area. Creatures with light blindness can continue to be blinded by the field as long as the
//   field is visible, even when outside of the field."
// The GM places the burst; a light fills it for the duration. A creature with PF2e's Light Blindness ability in it is blinded by the light (its
// ability: until the end of its next turn, once); while it's blinded by the field and inside (from 4th, anywhere), the start of each of its turns
// brings a card for its save (incapacitation applied): a failure keeps it blinded for 1 round. From 4th the creatures inside are Concealed (the
// observers outside are the GM's). The darkness it suppresses is a note.
import { htmlToPlainText } from "./description-parser.js";

const LIGHT = /^You create an area of bright light\.$/;
const WHO = /^Creatures with @UUID\[(Compendium\.pf2e\.bestiary-ability-glossary-srd\.Item\.[A-Za-z0-9]+)\]\{Light Blindness\} that are @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Blinded\} by [a-z ]+ and remain in the area must attempt an? (Fortitude|Reflex|Will) save at the start of their turns\.$/;
const FAIL = /^On a failure, a creature remains blinded for (\d+) rounds?; this is an incapacitation effect\.$/;
const DARKNESS = /^This spell also suppresses magical darkness of your [a-z ]+ spell's rank or lower\.$/;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*Creatures seen through the area are @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Concealed\} to creatures outside the area\. Creatures with light blindness can continue to be blinded by the field as long as the field is visible, even when outside of the field\.\s*<\/p>$/;

/** Returns {radiantField, claimed} or null. */
export function compileRadiantField(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length || area?.type !== "burst" || adapted.lifecycle?.sustained) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || rest.length !== 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== 4 || !LIGHT.test(sentences[0]) || !DARKNESS.test(sentences[3])) return null;
    const who = WHO.exec(sentences[1]), fail = FAIL.exec(sentences[2]), heightened = HEIGHTENED.exec(rest[0]);
    if (!who || !fail || !heightened || who[3].toLowerCase() !== adapted.defense.statistic) return null;
    return {
        radiantField: { area: { type: "burst", value: Number(area.value) }, durationSeconds: Number(minutes[1]) * 60, statistic: adapted.defense.statistic,
            ability: { uuid: who[1], slug: "light-blindness", name: "Light Blindness" }, blinded: who[2], failRounds: Number(fail[1]), incapacitation: true,
            fromRank: { rank: Number(heightened[1]), concealed: true, outside: true }, notes: [sentences[3]] },
        claimed: [...sentences, htmlToPlainText(rest[0]).trim()]
    };
}
