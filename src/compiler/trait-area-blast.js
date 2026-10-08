// Damage only to the creatures of one trait in an area, with a counteract against one effect there (Quench):
//   "Non-magical fires within the area are automatically extinguished." / "Fire creatures within the area take 4d8 damage (basic Fortitude
//   save)." / "Choose one magical fire, fire spell, or fire item in the area and attempt to counteract it." / "If you succeed against an item,
//   the item loses its fire properties for 10 minutes (for instance, …)." / "If the target is an artifact or similarly powerful item, you
//   automatically fail to counteract it." / "The first time each round you Sustain this spell, you can move the area of vapor anywhere within
//   range, but the only effect when you do so is to automatically extinguish non-magical fires." / "If you have the Counterspell reaction, you
//   can use quench to counter any spell with the fire trait …"
// Rewritten to the ordinary basic save of the creatures in the area that have the trait. The counteract is the card's Counteract button
// (the GM names the effect); the fires, the item, the artifact, the Sustain's move (which only puts out fires) and the Counterspell rule are
// the GM's reminder.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const DAMAGE = /^([A-Z][a-z]+) creatures within the area take (\d+)d(\d+) damage \(basic (Fortitude|Reflex|Will) save\)\.$/;
const COUNTERACT = /^Choose one magical ([a-z]+), \1 spell, or \1 item in the area and attempt to counteract it\.$/;
const SURROUNDINGS = [
    /^Non-magical ([a-z]+)s within the area are automatically extinguished\.$/,
    /^If you succeed against an item, the item loses its [a-z]+ properties for \d+ minutes \(for instance, [^()]+\)\.$/,
    /^If the target is an artifact or similarly powerful item, you automatically fail to counteract it\.$/,
    /^The first time each round you Sustain this spell, you can move the area of [a-z]+ anywhere within range, but the only effect when you do so is to automatically extinguish non-magical [a-z]+s\.$/,
    /^If you have the Counterspell reaction, you can use [a-z ]+ to counter any spell with the [a-z]+ trait instead of needing to have the triggering [a-z]+ spell prepared or in your repertoire\.$/
];

/** {html, trait, counteract, surroundings, sentences} or null. */
export function extractTraitAreaBlast(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || String(adapted.targeting?.target ?? "").trim() || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || String(components[0].type).toLowerCase() !== "untyped") return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length > 1) return null;
    // "Choose one magical fire, …" contains a comma-led "(for instance, a +1 Flaming Longsword …)": sentences end at a period before a capital.
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let damage = null, counteract = null, narration = 0;
    const surroundings = [];
    for (const [index, sentence] of sentences.entries()) {
        const found = DAMAGE.exec(sentence);
        if (found && !damage) { damage = found; continue; }
        const choose = COUNTERACT.exec(sentence);
        if (choose && !counteract) { counteract = { target: `magical ${choose[1]}`, sourceText: sentence }; continue; }
        if (SURROUNDINGS.some(pattern => pattern.test(sentence))) { surroundings.push(sentence); continue; }
        if (index === 0 && !NARRATION_RULES.test(sentence)) { narration++; continue; }
        return null;
    }
    if (!damage || !counteract || surroundings.length !== SURROUNDINGS.length || `${damage[2]}d${damage[3]}` !== String(components[0].formula).replace(/\s+/g, "")
        || damage[4].toLowerCase() !== adapted.defense.statistic || !SURROUNDINGS[0].test(surroundings[0]) || SURROUNDINGS[0].exec(surroundings[0])[1] !== damage[1].toLowerCase()) return null;
    // "Heightened (+1) Increase the damage to fire creatures by 2d8.": the item's own step.
    if (rest.length) {
        const step = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*Increase the damage to ([a-z]+) creatures by (\d+d\d+)\.\s*<\/p>$/.exec(rest[0]);
        if (!step || step[2] !== damage[1].toLowerCase() || !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1])
            && adapted.heightening.damage?.[components[0].id] === step[3])) return null;
    }
    return {
        html: `<p>Each creature in the area takes ${damage[2]}d${damage[3]} untyped damage (basic ${damage[4]} save).</p>`
            + (rest.length ? `<hr /><p><strong>Heightened (+${adapted.heightening.interval})</strong> The damage increases by ${adapted.heightening.damage[components[0].id]}.</p>` : ""),
        trait: damage[1].toLowerCase(), counteract, surroundings: surroundings.join(" "), sentences
    };
}
