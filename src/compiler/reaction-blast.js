// A reaction that blasts the triggering creature and moves the caster away (Pyrefowl Rebuke):
//   "You deal 1d6 fire damage to the triggering creature, with a basic Reflex save, and Fly up to 10 feet in a straight line directly away
//   from it." / "If the creature critically fails its saving throw, your movement does not provoke reactions from it, and it's Dazzled until
//   the end of its next turn." / "Heightened (+2) The damage increases by 1d6, and the maximum distance you can Fly increases by 5 feet."
// Rewritten to the ordinary basic save of the one targeted creature (the critical failure's condition as its rider); the caster's move, with
// its distance at the cast rank and the critical failure's no-reactions part, is the caster's reminder on the card.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const BLAST = /^You deal (\d+)d(\d+) ([a-z]+) damage to the triggering creature, with a basic (Fortitude|Reflex|Will) save, and (Fly|Stride|Step) up to (\d+) feet in a straight line directly away from it\.$/;
const CRITICAL = /^If the creature critically fails its saving throw, your movement does not provoke reactions from it, and it's (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Za-z]+\}) until the end of its next turn\.$/;

/** {html, reminder, sentences} or null. */
export function extractReactionBlast(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    if (adapted.activation?.time !== "reaction") return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    // (The Trigger paragraph is its own section, not a rule sentence.)
    const [trigger, body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!/^<p>\s*<strong>\s*Trigger\s*<\/strong>[^<]*<\/p>$/.test(trigger ?? "") || !body || rest.length > 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim()
        .split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => BLAST.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 2 || (at === 1 && NARRATION_RULES.test(sentences[0]))) return null;
    const blast = BLAST.exec(sentences[at]), critical = CRITICAL.exec(sentences[at + 1]);
    if (!critical || `${blast[1]}d${blast[2]}` !== String(components[0].formula).replace(/\s+/g, "") || blast[3] !== String(components[0].type).toLowerCase()
        || blast[4].toLowerCase() !== adapted.defense.statistic) return null;
    // "Heightened (+2) The damage increases by 1d6, and the maximum distance you can Fly increases by 5 feet.": the item's own step.
    let feet = null;
    if (rest.length) {
        const step = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+d\d+)(?:, and the maximum distance you can ([A-Za-z]+) increases by (\d+) feet)?\.\s*<\/p>$/.exec(rest[0]);
        if (!step || !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1]) && adapted.heightening.damage?.[components[0].id] === step[2])
            || (step[3] && step[3] !== blast[5])) return null;
        if (step[4]) feet = { step: Number(step[4]), interval: Number(step[1]) };
    }
    const text = `${blast[5]} up to {feet} feet in a straight line directly away from the triggering creature. If it critically failed its save, that movement doesn't provoke reactions from it.`;
    return {
        html: `<p>The target takes ${blast[1]}d${blast[2]} ${blast[3]} damage (basic ${blast[4]} save). Creatures that critically fail are ${critical[1]} until the end of their next turn.</p>`
            + (rest.length ? `<hr /><p><strong>Heightened (+${adapted.heightening.interval})</strong> The damage increases by ${adapted.heightening.damage[components[0].id]}.</p>` : ""),
        reminder: { kind: "caster-movement", text, rankFeet: { base: Number(blast[6]), step: feet?.step ?? 0, interval: feet?.interval ?? 1, baseRank: adapted.rank },
            sourceText: `${sentences[at]} ${sentences[at + 1]}` },
        sentences: sentences.slice(at)
    };
}
