// A basic-save downpour that leaves a concealing cloud for the duration (Searing Rain, PF2e 8.6):
//   "You call forth a torrential downpour of boiling water that deals 6d6 bludgeoning damage and 2d6 persistent fire damage, with a basic Reflex save to each
//   creature in the area." / "The downpour also leaves a cloud of thick steam." / "For the spell's duration, all creatures within the area are {Concealed}, and
//   all creatures outside the area are concealed to creatures within it." / "You can Dismiss this effect." with "Heightened (+1) The bludgeoning damage and
//   persistent fire damage each increase by 1d6."
// Two texts the readers know: the cloud (the concealing area, Dismissed by the caster) and the creatures inside when it's cast, a basic save at the item's
// damage — the area's runtime places the cloud and starts that save card for them.
import { htmlToPlainText } from "./description-parser.js";

const DOWNPOUR = /^You call forth a [a-z ]+ of [a-z ]+ that deals (\d+d\d+) ([a-z]+) damage and (\d+d\d+) persistent ([a-z]+) damage, with a basic (Fortitude|Reflex|Will) save to each creature in the area\.$/;
const LEAVES = /^The [a-z]+ also leaves a cloud of [a-z ]+\.$/;
const CONCEAL = /^For the spell's duration, all creatures within the area are (?:@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Concealed\}|concealed), and all creatures outside the area are concealed to creatures within it\.$/;
const DISMISS = /^You can Dismiss this effect\.$/;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*The ([a-z]+) damage and persistent ([a-z]+) damage each increase by (\d+d\d+)\.\s*<\/p>$/;

/** {cloudHTML, saveHTML, sentences} or null. */
export function extractDownpourCloud(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.lifecycle?.sustained || !/^\d+ (?:round|minute)s?$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const area = adapted.targeting?.area, components = adapted.damageComponents ?? [];
    if (!area || !["burst", "cylinder", "cube"].includes(area.type) || components.length !== 2 || String(adapted.targeting?.target ?? "").trim()) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== 4 || !LEAVES.test(sentences[1]) || !CONCEAL.test(sentences[2]) || !DISMISS.test(sentences[3])) return null;
    const downpour = DOWNPOUR.exec(sentences[0]);
    if (!downpour || downpour[5].toLowerCase() !== adapted.defense.statistic) return null;
    const direct = components.find(component => !component.category), persistent = components.find(component => component.category === "persistent");
    if (!direct || !persistent || String(direct.formula).replace(/\s+/g, "") !== downpour[1] || String(direct.type).toLowerCase() !== downpour[2]
        || String(persistent.formula).replace(/\s+/g, "") !== downpour[3] || String(persistent.type).toLowerCase() !== downpour[4]) return null;
    // The heightening: the item's own, both entries by the stated dice.
    const step = heightened ? HEIGHTENED.exec(heightened) : null;
    if (heightened && (!step || step[1] !== downpour[2] || step[2] !== downpour[4] || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== 1
        || [direct, persistent].some(component => String(adapted.heightening.damage?.[component.id] ?? "").replace(/\s+/g, "") !== step[3]))) return null;
    return {
        cloudHTML: `<p>${sentences[1].replace(" also ", " ")} All creatures within the area become concealed, and all creatures outside the area become concealed to creatures within it. You can Dismiss the cloud.</p>`,
        saveHTML: `<p>Each creature in the area takes ${downpour[1]} ${downpour[2]} damage and ${downpour[3]} persistent ${downpour[4]} damage with a basic ${downpour[5]} save.</p>${heightened ? `<hr />${heightened}` : ""}`,
        sentences
    };
}
