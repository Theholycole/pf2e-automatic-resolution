// A basic save dealt by splashes along the caster's own movement (Dive and Breach):
//   "You make the briefest of dives through the Plane of Water." / "You @UUID[…]{Leap} 10 feet, and where you would land on the ground, you
//   instead disappear in a splash of water, …" / "You then exit from an unoccupied surface within 40 feet, appearing in another splash of water
//   as you Leap out, landing 10 feet away from where you exited." / "Each splash deals 3d10 bludgeoning damage to all creatures in a
//   @Template[emanation|distance:5]; creatures in multiple splash zones take damage only once." with "Heightened (+1) The damage dealt by each
//   splash increases by 1d10."
// The save card's basic save on the creatures the caster targets (within the splashes' radius of where they enter and where they land; each
// once); the movement is the player's (a note).
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const DIVE = /^You @UUID\[[^\]]+\]\{Leap\} (\d+) feet, and where you would land on the ground, you instead disappear in a splash of ([a-z]+), [a-z ,]+\.$/;
const EXIT = /^You then exit from an unoccupied surface within (\d+) feet, appearing in another splash of ([a-z]+) as you Leap out, landing (\d+) feet away from where you exited\.$/;
const SPLASH = /^Each splash deals (\d+d\d+) ([a-z]+) damage to all creatures in an? @Template\[(?:type:)?emanation\|distance:(\d+)\]; creatures in multiple splash zones take damage only once\.$/;
const STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage dealt by each splash increases by (\d+d\d+)\.\s*<\/p>$/;

/** {html, notes, claimed} or null. */
export function rewriteSplashPath(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length > 1) return null;
    const step = rest.length ? STEP.exec(rest[0]) : null;
    if (rest.length && !step) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => DIVE.test(sentence));
    if (at < 0 || sentences.length !== at + 3 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const dive = DIVE.exec(sentences[at]), exit = EXIT.exec(sentences[at + 1]), splash = SPLASH.exec(sentences[at + 2]);
    if (!exit || !splash || String(components[0].formula).replace(/\s+/g, "") !== splash[1] || String(components[0].type).toLowerCase() !== splash[2]) return null;
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    return {
        html: `<p>You deal ${splash[1]} ${splash[2]} damage to each creature in the area, with a basic ${statistic} save.</p>${step ? `<hr /><p><strong>Heightened (+${step[1]})</strong> The damage increases by ${step[2]}.</p>` : ""}`,
        notes: [`Move yourself: Leap ${dive[1]} feet into the surface, exit from an unoccupied surface within ${exit[1]} feet and Leap out ${exit[3]} feet (the player moves the token).`,
            `Target each creature within ${splash[3]} feet of either splash (where you dive in and where you exit); a creature in both takes the damage once.`],
        claimed: sentences
    };
}
