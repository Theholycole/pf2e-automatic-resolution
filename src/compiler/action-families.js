// Note-only spells whose rule is an action the module can take (Cackle, Friendfetch, Liberating Command, Bone Shield).
import { htmlToPlainText } from "./description-parser.js";
import { plainSentencesTrimmed as split } from "./text-patterns.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|checks?|DC|Hit Points|Strikes?)\b/i;

// Cackle: "You Sustain a spell." as a free action — the caster's sustained Ongoing spell is Sustained (the caster picks one if several).
export function compileSustainOther(adapted) {
    if (adapted.defense?.kind !== "none" || !/^free$/i.test(String(adapted.activation?.time ?? "").trim()) || String(adapted.targeting?.target ?? "").trim()) return null;
    const sentences = split(adapted.descriptionHTML);
    if (sentences.at(-1) !== "You Sustain a spell." || sentences.slice(0, -1).some(sentence => NARRATION_RULES.test(sentence)) || sentences.length > 3) return null;
    return { sustainOther: { own: true }, claimed: sentences };
}

// Friendfetch: "You shoot out ephemeral, telekinetic strands that drag each target directly toward you, stopping in the closest unoccupied space to
// you in this path. This is forced movement." — each target's token is moved along the line toward the caster to the nearest free square.
const PULL = /^You shoot out [a-z, ]+ strands that drag each target directly toward you, stopping in the closest unoccupied space to you in this path\.$/;
export function compilePullToward(adapted) {
    if (adapted.defense?.kind !== "none" || !/^1 or 2 willing creatures$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const range = /^(\d+) feet$/i.exec(String(adapted.targeting?.range ?? "").trim());
    const sentences = split(adapted.descriptionHTML);
    if (!range || sentences.length !== 2 || !PULL.test(sentences[0]) || sentences[1] !== "This is forced movement.") return null;
    return { pullToward: { maxTargets: 2, rangeFeet: Number(range[1]), forced: true }, claimed: sentences };
}

// Liberating Command: "If the target is Grabbed, Immobilized, or Restrained, it can immediately use a reaction to attempt to [[/act escape]]." —
// the target rolls PF2e's Escape (the module's Escape card ends a spell's restraint it beats).
const LIBERATE = /^If the target is @UUID\[[^\]]+\]\{Grabbed\}, @UUID\[[^\]]+\]\{Immobilized\}, or @UUID\[[^\]]+\]\{Restrained\}, it can immediately use a reaction to attempt to \[\[\/act escape\]\]\.$/;
export function compilePromptEscape(adapted) {
    if (adapted.defense?.kind !== "none" || !/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const sentences = htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " ").trim().split(/(?<=\.)\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => LIBERATE.test(sentence));
    if (at < 0 || at !== sentences.length - 1 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    return { promptEscape: { conditions: ["grabbed", "immobilized", "restrained"], reaction: true }, claimed: sentences };
}

// Bone Shield: a spell shield in a free hand (Hardness 3, 1 HP, no Broken Threshold), raised when cast and on the first Sustain each round,
// recreated if destroyed, with "Heightened (+2) The shield's Hardness increases by 3." — a temporary PF2e shield item held while the sustained
// spell lasts: raised when cast and on each Sustain (recreated first if destroyed); its destruction doesn't end the spell. The +2 Hardness
// against piercing or slashing attacks is a note.
const BONE = [
    /^When you Cast the Spell or the first time each round you Sustain this spell on subsequent rounds, you can Raise this Shield, granting you a \+(\d) circumstance bonus to AC\.$/,
    /^While this spell is in effect, you gain the (?:@UUID\[[^\]]+\]\{Shield Block\}|Shield Block) reaction, but only with the [a-z ]+\.$/,
    /^The [a-z ]+ has Hardness (\d+) and (\d+) HP \(with no Broken Threshold\)\.$/,
    /^This shield also gains a \+(\d) circumstance bonus to its Hardness against attacks that deal piercing or slashing damage\.$/,
    /^If the shield is destroyed, it's recreated already raised in a free hand when you Sustain the Spell\.$/
];
export function compileSpellShield(adapted) {
    // (The item may mark it sustained, or say so only in its duration: "sustained up to 1 minute".)
    const minutes = /^(sustained up to )?(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (adapted.defense?.kind !== "none" || String(adapted.targeting?.target ?? "").trim() || !(adapted.lifecycle?.sustained === true || minutes?.[1])) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(body);
    if (!minutes || sentences.length !== BONE.length + 1 || NARRATION_RULES.test(sentences[0]) || BONE.some((pattern, index) => !pattern.test(sentences[index + 1]))) return null;
    const heightened = rest.length ? /^Heightened \(\+(\d+)\) The shield's Hardness increases by (\d+)\.$/.exec(htmlToPlainText(rest.join(" ")).trim()) : null;
    if (rest.length && !heightened) return null;
    const [, ac] = BONE[0].exec(sentences[1]), [, hardness, hp] = BONE[2].exec(sentences[3]), [, extra] = BONE[3].exec(sentences[4]);
    return { spellShield: { acBonus: Number(ac), hardness: Number(hardness), hp: Number(hp), step: heightened ? { interval: Number(heightened[1]), hardness: Number(heightened[2]) } : null,
        durationSeconds: Number(minutes[2]) * 60, raiseOnSustain: true, recreateOnSustain: true, notes: [`+${extra} Hardness against attacks that deal piercing or slashing damage (the GM adds it to a Shield Block).`] },
        claimed: sentences };
}

/** The shield's Hardness at a cast rank. */
export function spellShieldHardness(data, castRank, baseRank = 1) {
    return data.hardness + (data.step ? Math.floor(Math.max(0, castRank - baseRank) / data.step.interval) * data.step.hardness : 0);
}

/** The squares from the caster toward a target along the line, nearest first (grid steps); the first free one is where it stops. */
export function pullPath(caster, target, gridSize) {
    const dx = target.x - caster.x, dy = target.y - caster.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy)) / gridSize;
    const path = [];
    for (let step = 1; step < steps; step++) {
        const point = { x: caster.x + Math.round((dx / steps) * step / gridSize) * gridSize, y: caster.y + Math.round((dy / steps) * step / gridSize) * gridSize };
        if (!path.some(entry => entry.x === point.x && entry.y === point.y)) path.push(point);
    }
    return path;
}
