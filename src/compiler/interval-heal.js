// Healing every stretch of world time on the caster, with a one-time extra when treated (Moth's Supper): "This has three effects." with the
// list "You heal 2d4 Hit Points every 10 minutes." / "The first time during the duration when someone successfully Treats your Wounds, you regain
// an additional 4d4 Hit Points." / "You gain an imprecise sense out to 30 feet that senses only freshly spilled blood and rotten flesh." and
// "Heightened (+1) The amount of Hit Points healed every 10 minutes increases by 1d4 and the amount of Hit Points regained from the first Treat
// Wounds increases by 2d4." — the caster's Effect for the duration: the item's healing every 10 minutes of world time; the extra healing is a
// button, used once (PF2e's Treat Wounds names no patient); the sense, which no PF2e sense matches, is a note.
import { durationSeconds, plainText as plain, splitSentences as split } from "./description-parser.js";
import { unlinkText as unlink } from "./text-patterns.js";

const EVERY = /^You heal (\d+d\d+) Hit Points every (\d+) (minutes|hours)\.$/;
const TREATED = /^The first time during the duration when someone successfully Treats your Wounds, you regain an additional (\d+)d(\d+) Hit Points\.$/;
const SENSE = /^You gain an? (imprecise|precise) sense out to (\d+) feet that senses only [a-z ,]+\.$/;
const HEIGHT = /^Heightened \(\+(\d)\) The amount of Hit Points healed every (\d+) (minutes|hours) increases by (\d+d\d+) and the amount of Hit Points regained from the first Treat Wounds increases by (\d+)d(\d+)\.$/;
const RULE_WORDS = /\d|\[\[|\b(?:damage|saves?|bonus|penalty|immune|can't|must|checks?|DC|Hit Points|heal\w*|Strikes?|senses?)\b/i;

/** Returns {intervalHeal, claimed} or null. */
export function compileIntervalHeal(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    const seconds = durationSeconds(adapted.lifecycle?.duration);
    const components = adapted.damageComponents ?? [];
    if (!seconds || components.length !== 1 || !components[0].kinds?.includes("healing")) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body)).map(unlink);
    const at = sentences.findIndex(sentence => EVERY.test(sentence));
    if (at < 1 || sentences.length !== at + 3 || !/^This has three effects\.$/.test(sentences[at - 1]) || sentences.slice(0, at - 1).some(sentence => RULE_WORDS.test(sentence))) return null;
    const every = EVERY.exec(sentences[at]), treated = TREATED.exec(sentences[at + 1]), sense = SENSE.exec(sentences[at + 2]);
    if (!every || !treated || !sense || every[1] !== String(components[0].formula).replace(/\s+/g, "")) return null;
    const heightened = unlink(plain(rest.join(" "))).trim();
    const height = HEIGHT.exec(heightened);
    if (heightened && !height) return null;
    const everySeconds = Number(every[2]) * (every[3] === "hours" ? 3600 : 60);
    if (height && (Number(height[2]) * (height[3] === "hours" ? 3600 : 60) !== everySeconds || height[6] !== treated[2]
        || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== Number(height[1]) || adapted.heightening.damage?.[components[0].id] !== height[4])) return null;
    return { intervalHeal: { recipient: "self", seconds, everySeconds, componentId: components[0].id, formula: every[1],
        treated: { dice: Number(treated[1]), faces: Number(treated[2]), perStep: height ? Number(height[5]) : 0, interval: height ? Number(height[1]) : 1,
            label: "Treat Wounds succeeded", sourceText: sentences[at + 1] },
        notes: [sentences[at + 2]] }, claimed: [...sentences, heightened].filter(Boolean) };
}

/** The extra healing's dice at a cast rank. */
export function treatedFormula(data, castRank, baseRank) {
    const steps = Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.treated.interval));
    return `${data.treated.dice + data.treated.perStep * steps}d${data.treated.faces}`;
}
