// A glowing square that blinks on Sustain (Cosmic Glow): "The cosmic glow sheds bright light in a 10-foot radius (and dim light to the next 10 feet)." /
// "The cosmic glow deals 2d4 fire damage to each creature in the square in which it appears, with a basic Reflex save, and creatures that critically fail
// their save are Fascinated by the cosmic glow." / "The first time you Sustain this spell each turn, you blink your cosmic glow to a square within 15 feet and
// in range of the spell." / "It then deals damage to each creature who shares its space." / "If your cosmic glow occupies your space or the space of one of
// your allies, you can choose for the glow to not deal damage but instead grant a +2 status bonus to Recall Knowledge checks for as long as it remains in the
// creature's space.": the placed square's basic save when cast and on each Sustain (the GM moves the region first, up to the stated distance); the caster
// and its allies standing in it hold the Recall Knowledge bonus while there, and the caster leaves them out of the damage on review; the light a note.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const LIGHT = /^The [a-z ]+ sheds bright light in a (\d+)-foot radius \(and dim light to the next (\d+) feet\)\.$/;
const DEALS = /^The [a-z ]+ deals (\d+d\d+) ([a-z]+) damage to each creature in the square in which it appears, with a basic (Fortitude|Reflex|Will) save, and creatures that critically fail their save are (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Fascinated\}) by the [a-z ]+\.$/;
const BLINK = /^The first time you Sustain this spell each turn, you blink your [a-z ]+ to a square within (\d+) feet and in range of the spell\.$/;
const AGAIN = /^It then deals damage to each creature who shares its space\.$/;
const BOON = /^If your [a-z ]+ occupies your space or the space of one of your allies, you can choose for the glow to not deal damage but instead grant a \+(\d) status bonus to Recall Knowledge checks for as long as it remains in the creature['’]s space\.$/;
const STEP = /^Heightened \(\+1\) The damage increases by (\d+d\d+)\.$/;

/** {html, lingering, sentences} or null. */
export function rewriteCosmicGlow(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || area?.type !== "square" || Number(area.value) !== 5 || adapted.lifecycle?.sustained !== true
        || !/^sustained up to 1 minute$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const plain = sentences.map(sentence => sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1"));
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    const light = LIGHT.exec(sentences[1] ?? ""), deals = DEALS.exec(sentences[2] ?? ""), blink = BLINK.exec(sentences[3] ?? ""), boon = BOON.exec(sentences[5] ?? "");
    if (sentences.length !== 6 || NARRATION_RULES.test(sentences[0]) || !light || !deals || !blink || !AGAIN.test(sentences[4] ?? "") || !boon || !step) return null;
    const components = adapted.damageComponents ?? [], heightening = adapted.heightening ?? {};
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== deals[1] || components[0].type !== deals[2]
        || deals[3].toLowerCase() !== adapted.defense.statistic || heightening.type !== "interval" || heightening.interval !== 1 || String(heightening.damage?.[components[0].id]) !== step[1]) return null;
    return {
        html: `<p>Each creature in the area takes ${deals[1]} ${deals[2]} damage with a basic ${deals[3]} save. A creature that critically fails its save is ${deals[4]}.</p>`
            + `<hr /><p><strong>Heightened (+1)</strong> The damage increases by ${step[1]}.</p>`,
        lingering: { events: ["sustain"], initial: true, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: { type: "square", value: 5 },
            centre: "placed", durationSeconds: 60, sustained: true, concealment: false, moveOnSustain: true,
            // (The caster and its allies in the glow: the stated bonus while there.)
            memberRules: [{ key: "FlatModifier", selector: "skill-check", type: "status", value: Number(boon[1]), predicate: ["action:recall-knowledge"] }],
            memberAllies: true, memberCaster: true,
            notes: [`The first time you Sustain it each turn, blink the glow to a square within ${blink[1]} feet and in range: move the region first; each creature in its new square saves.`,
                `If the glow is in your space or an ally's, you can leave that creature out of the damage when you review the targets; while there it has a +${boon[1]} status bonus to Recall Knowledge checks.`,
                plain[1]],
            sourceText: [plain[2], plain[3], plain[4], plain[5]] },
        sentences: [...plain.slice(1), htmlToPlainText(heightened).trim()]
    };
}
