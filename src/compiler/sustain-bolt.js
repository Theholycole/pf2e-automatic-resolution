// A bolt called down within a sustained cloud, again on each Sustain (Lightning Storm):
//   "You create a black, rumbling storm cloud and call down one lightning bolt within the spell's area. The bolt is a vertical line from the top
//   of the storm cloud to the ground below, dealing 4d12 electricity damage to creatures in the line (basic Reflex save). On subsequent rounds,
//   the first time you Sustain the Spell each round, you can call another lightning bolt within the area. If you Cast this Spell outdoors, you can
//   create two non-overlapping clouds instead of one, though you can still call down only one bolt per turn." with "Heightened (+2) The damage
//   of each bolt increases by 1d12."
// The item's basic save on the creatures in the bolt's line (the caster targets them), repeated from the card once a round on a Sustain while the
// spell lasts; the cloud's place and a second cloud outdoors are notes.
import { htmlToPlainText } from "./description-parser.js";

const CLOUD = /^You create an? [a-z, ]+ cloud and call down one ([a-z ]+) bolt within the spell's area\.$/;
const BOLT = /^The bolt is a vertical line from the top of the [a-z ]+ cloud to the ground below, dealing (\d+d\d+) ([a-z]+) damage to creatures in the line \(basic (Fortitude|Reflex|Will) save\)\.$/;
const AGAIN = /^On subsequent rounds, the first time you Sustain the Spell each round, you can call another [a-z ]+ bolt within the area\.$/;
const OUTDOORS = /^If you Cast this Spell outdoors, you can create two non-overlapping clouds instead of one, though you can still call down only one bolt per turn\.$/;

/** {html, notes, sentences} or null. */
export function extractSustainBolt(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.lifecycle?.sustained !== true || adapted.targeting?.area?.type !== "burst") return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length > 1 || (rest.length && !/^\s*<p>\s*<strong>\s*Heightened \(\+\d\)\s*<\/strong>\s*The damage of each bolt increases by \d+d\d+\.\s*<\/p>\s*$/.test(rest[0]))) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/);
    if (sentences.length !== 4 || !CLOUD.test(sentences[0]) || !BOLT.test(sentences[1]) || !AGAIN.test(sentences[2]) || !OUTDOORS.test(sentences[3])) return null;
    const [, dice, type, statistic] = BOLT.exec(sentences[1]);
    if (String(components[0].formula).replace(/\s+/g, "") !== dice || String(components[0].type).toLowerCase() !== type || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    return {
        html: `<p>The bolt deals ${dice} ${type} damage to creatures in its line, with a basic ${statistic} save.</p>${rest.length ? `<hr />${rest[0].trim()}` : ""}`,
        notes: ["Place the storm cloud in the area; target only the creatures in the bolt's line (a vertical line from the cloud to the ground).",
            "The first time you Sustain the spell each later round, call another bolt within the area: target the creatures in its line and use the card's Sustain button.",
            "Outdoors, you can create two non-overlapping clouds instead of one, though you can still call down only one bolt per turn."],
        sentences
    };
}

// A line between the caster and their familiar, again on each Sustain (Overload Connection): "When you Cast this Spell and the first time you Sustain
// this spell on subsequent turns, this magical connection flares in a line between you and your familiar, dealing @Damage[3d8[mental]] damage to all
// creatures in the line, with a basic Reflex save." (after narration) with "Heightened (+1) The damage increases by 1d8." — the item's basic save on
// the creatures in the line (the caster targets them; the familiar isn't the spell's victim), repeated from the card once a round on a Sustain.
const LINE_AGAIN = /^When you Cast this Spell and the first time you Sustain this spell on subsequent turns, this magical connection flares in a line between you and your familiar, dealing @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage to all creatures in the line, with a basic (Fortitude|Reflex|Will) save\.$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|must|each|until)\b/i;

/** {html, notes, sentences, againIndex, target} or null. */
export function extractSustainLine(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.lifecycle?.sustained !== true || adapted.targeting?.area) return null;
    if (!/^your familiar$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length > 1 || (rest.length && !/^\s*<p>\s*<strong>\s*Heightened \(\+\d\)\s*<\/strong>\s*The damage increases by \d+d\d+\.\s*<\/p>\s*$/.test(rest[0]))) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/);
    const at = sentences.findIndex(sentence => LINE_AGAIN.test(sentence));
    if (at < 0 || at !== sentences.length - 1 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const [, dice, type, statistic] = LINE_AGAIN.exec(sentences[at]);
    if (String(components[0].formula).replace(/\s+/g, "") !== dice || String(components[0].type).toLowerCase() !== type || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    return {
        html: `<p>The connection deals ${dice} ${type} damage to creatures in its line, with a basic ${statistic} save.</p>${rest.length ? `<hr />${rest[0].trim()}` : ""}`,
        notes: ["Target the creatures in the line between you and your familiar (not your familiar itself unless it's in the way, at the GM's call).",
            "The first time you Sustain the spell each later turn, the line flares again: target the creatures in it and use the card's Sustain button."],
        sentences, againIndex: at, target: ""
    };
}

// One target, again on each Sustain, with a condition until the caster's next turn (Confront Selves): "When you Cast or Sustain this Spell, you force
// the target to confront an alternate permutation of themselves, …" / "They take 4d6 mental damage (basic Will save) and are Clumsy 1 until the
// beginning of your next turn." / "On a critical success, the spell ends." with "Heightened (+1) The damage increases by 1d6." — the basic save's
// four rows with the condition on the rows that aren't a critical success, repeated from the card on each Sustain (a critical success ends the
// spell: the card's note says to stop Sustaining).
const SINGLE_AGAIN = /^When you Cast or Sustain this Spell, [a-z' ,]+\.$/;
const TAKES_UNTIL = /^They take (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\) and are (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][a-z]+(?: \d)?\}) until the beginning of your next turn\.$/;
const CRIT_ENDS = /^On a critical success, the spell ends\.$/;

/** {html, notes, sentences, againIndex, basic} or null. */
export function extractSustainSingle(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.lifecycle?.sustained !== true || adapted.targeting?.area) return null;
    if (!/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length > 1 || (rest.length && !/^\s*<p>\s*<strong>\s*Heightened \(\+\d\)\s*<\/strong>\s*The damage increases by \d+d\d+\.\s*<\/p>\s*$/.test(rest[0]))) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const again = sentences.findIndex(sentence => SINGLE_AGAIN.test(sentence));
    const takes = again >= 0 ? TAKES_UNTIL.exec(sentences[again + 1] ?? "") : null;
    if (!takes || !CRIT_ENDS.test(sentences[again + 2] ?? "") || sentences.length !== again + 3 || sentences.slice(0, again).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const [, dice, type, statistic, condition] = takes;
    if (String(components[0].formula).replace(/\s+/g, "") !== dice || String(components[0].type).toLowerCase() !== type || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const until = "until the start of your next turn";
    return {
        html: `<p>The target takes ${dice} ${type} damage, depending on its ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target takes half damage and is ${condition} ${until}.</p>`
            + `<p><strong>Failure</strong> The target takes full damage and is ${condition} ${until}.</p>`
            + `<p><strong>Critical Failure</strong> The target takes double damage and is ${condition} ${until}.</p>${rest.length ? `<hr />${rest[0].trim()}` : ""}`,
        notes: ["Each time you Sustain the spell, the target saves again: use the card's Sustain button.", "On a critical success, the spell ends: don't Sustain it again."],
        sentences, againIndex: again, basic: false
    };
}

// One target damaged on casting and each Sustain, with the hex's other rules as notes (Blood in the Water): "Requirements The target is taking
// persistent bleed damage or your last action dealt slashing damage to the target." / "When you Cast or Sustain this Spell, the target takes 2d6 spirit
// damage (basic Reflex save)." / "If the target takes any damage from the spell, it treats all water as difficult terrain for 1 round as the predators
// try to drag them down." / "If you deal slashing damage to the target while the spell is active, you automatically Sustain this Spell." / "If you
// cast blood in the water while a previous casting of this hex is still in effect, the previous effect ends." — the basic save's rows (a note on the
// damaged rows for the water terrain), repeated from the card on each Sustain; the requirement, the automatic Sustain and the recast are notes.
const HEX_TAKES = /^When you Cast or Sustain this Spell, the target takes (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\)\.$/;
const WATER_TERRAIN = /^If the target takes any damage from the spell, it treats all water as difficult terrain for (\d+) rounds?(?: as [a-z ]+)?\.$/;
const NO_SPACE = /^The spectral [a-z]+ don't take up space, grant flanking, or have any other attributes a creature would\.$/;
const AUTO_SUSTAIN = /^If you deal ([a-z]+) damage to the target while the spell is active, you automatically Sustain this Spell\.$/;
const RECAST = /^If you cast [a-z' ]+ while a previous casting of this hex is still in effect, the previous effect ends\.$/;
const REQUIREMENT = /^\s*<p>\s*<strong>\s*Requirements\s*<\/strong>\s*([^<]+?)\s*<\/p>\s*$/;

/** {html, notes, sentences, againIndex, basic, rowNote} or null. */
export function extractSustainHex(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.lifecycle?.sustained !== true || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const requirement = sections.length === 3 ? REQUIREMENT.exec(sections[0]) : null;
    if (sections.length !== 3 || !requirement) return null;
    const [body, heightened] = sections.slice(1);
    if (!/^\s*<p>\s*<strong>\s*Heightened \(\+\d\)\s*<\/strong>\s*The damage dealt increases by \d+d\d+\.\s*<\/p>\s*$/.test(heightened)) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    let takes = null, water = null, auto = null, recast = null, quiet = null;
    for (const [index, sentence] of sentences.entries()) {
        if (!takes && HEX_TAKES.test(sentence)) { takes = { match: HEX_TAKES.exec(sentence), index }; continue; }
        if (takes && !water && WATER_TERRAIN.test(sentence)) { water = WATER_TERRAIN.exec(sentence); continue; }
        if (!quiet && NO_SPACE.test(sentence)) { quiet = sentence; continue; }
        if (!auto && AUTO_SUSTAIN.test(sentence)) { auto = sentence; continue; }
        if (!recast && RECAST.test(sentence)) { recast = sentence; continue; }
        if (!takes && !NARRATION_RULES.test(sentence)) continue;
        return null;
    }
    if (!takes || !water || !auto || !recast) return null;
    const [, dice, type, statistic] = takes.match;
    if (String(components[0].formula).replace(/\s+/g, "") !== dice || String(components[0].type).toLowerCase() !== type || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    return {
        html: `<p>The target takes ${dice} ${type} damage, depending on its ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target takes half damage.</p>`
            + `<p><strong>Failure</strong> The target takes full damage.</p><p><strong>Critical Failure</strong> The target takes double damage.</p><hr />${heightened.trim()}`,
        notes: [`Requirements: ${requirement[1]} (the caster checks before casting).`, "Each time you Sustain the spell, the target saves again: use the card's Sustain button.",
            auto.replace(/^If you deal/, "If you deal").concat(" (use the card's Sustain button then)."), recast.concat(" (end the previous one in Ongoing spells).")],
        rowNote: { label: "Dragged down", text: `It treats all water as difficult terrain for ${water[1]} round${water[1] === "1" ? "" : "s"}.`, sourceText: water[0], gmPlays: true,
            duration: { mode: "fixed", value: Number(water[1]), unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `for ${water[1]} round` } },
        sentences, againIndex: takes.index, basic: false
    };
}
