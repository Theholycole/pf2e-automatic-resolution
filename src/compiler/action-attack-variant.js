// A spell attack whose action count sets the damage and riders, one paragraph per count (Soul Cutter):
//   "… Make a melee spell attack against your target's AC. On a success, you deal spirit damage. On a critical success, the target takes double
//   damage. The number of actions you spend when Casting this Spell determines the range, damage, and other parameters." with
//   [1] "An adjacent target takes 3d6 spirit damage." / [2] "An adjacent target takes 6d6 spirit damage, and on a hit, it becomes
//   @UUID[…]{Enfeebled 1} for 1 round." / [3] "The blade flies out from you and attacks a target within 30 feet, dealing 6d6 spirit damage. The
//   spell deals half damage on a failure (but not a critical failure), as the blade's divine influence guides your attack. Unless you critically
//   fail, the target becomes enfeebled 1 for 1 round." and "Heightened (+1) The damage increases by 1d6 for the 1-action version, or by 2d6 for
//   the 2- and 3-action versions."
// Cast as the PF2e variant for that count: its one damage entry must be the paragraph's dice with the stated heightening step. The paragraph
// becomes the attack's four rows. The text's type is rolled when PF2e's variant types the entry otherwise (text over data). The paragraph's
// reach ("an adjacent target", "a target within 30 feet") is a note for the player's targeting.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_ATTACK as NARRATION_RULES, trimmedSentences as sentencesOf } from "./text-patterns.js";

const GLYPH = /<p>\s*<span class="action-glyph">\s*([1-3])\s*<\/span>([\s\S]*?)<\/p>/gi;
const LEAD = [
    /^Make a (melee|ranged) spell attack against (?:your|the) target's AC\.$/,
    /^On a success, you deal ([a-z]+) damage\.$/,
    /^On a critical success, the target takes double damage\.$/,
    /^The number of actions you spend when Casting this Spell determines the range, damage, and other parameters\.$/
];
const ADJACENT = /^An adjacent target takes (\d+d\d+) ([a-z]+) damage(?:, and on a hit, it becomes (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][a-z]+(?: \d)?\}) for (\d+) rounds?)?\.$/;
const FLIES = /^The [a-z]+ flies out from you and attacks a target within (\d+) feet, dealing (\d+d\d+) ([a-z]+) damage\.$/;
const HALF = /^The spell deals half damage on a failure \(but not a critical failure\)(?:, as [a-z' ]+)?\.$/;
const UNLESS = /^Unless you critically fail, the target becomes ([a-z]+(?: \d)?) for (\d+) rounds?\.$/;
const STEP = /^Heightened \(\+(\d)\) The damage increases by (\d+)d(\d+) for the 1-action version, or by (\d+)d(\d+) for the 2- and 3-action versions\.$/;

const rounds = value => `${value} round${value === 1 ? "" : "s"}`;

/** Returns {html, typeOverride, note, claimed} or null. */
export function rewriteActionAttackVariant(adapted) {
    const time = String(adapted.activation?.time ?? "").trim();
    if (!/^[1-3]$/.test(time) || (adapted.defense?.kind ?? "none") !== "none" || !(adapted.activation?.traits ?? []).includes("attack")) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\s*\/?>/i);
    if (rest.length !== 1) return null;
    const glyphs = [...body.matchAll(GLYPH)];
    if (glyphs.length < 2 || new Set(glyphs.map(match => match[1])).size !== glyphs.length) return null;
    const lead = sentencesOf(htmlToPlainText(body.replace(GLYPH, "")));
    const at = lead.findIndex(sentence => LEAD[0].test(sentence));
    if (at < 0 || lead.length !== at + LEAD.length || lead.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    if (LEAD.some((pattern, index) => !pattern.test(lead[at + index]))) return null;
    const reach = LEAD[0].exec(lead[at])[1], type = LEAD[1].exec(lead[at + 1])[1];
    // The heightening step: the variant's own (1 action, or 2 and 3).
    const step = STEP.exec(htmlToPlainText(rest[0]).replace(/\s+/g, " ").trim());
    const own = glyphs.find(match => match[1] === time);
    if (!step || !own) return null;
    const [stepCount, stepFaces] = time === "1" ? [Number(step[2]), Number(step[3])] : [Number(step[4]), Number(step[5])];
    const heightening = adapted.heightening;
    const entry = heightening?.damage?.[components[0].id];
    if (heightening?.type !== "interval" || Number(heightening.interval) !== Number(step[1]) || String(entry ?? "").replace(/\s+/g, "") !== `${stepCount}d${stepFaces}`) return null;
    // The variant's paragraph.
    const lines = sentencesOf(own[2].replace(/<[^>]+>/g, " "));
    let dice, stated, targetNote, hitCondition = null, half = false, unless = null;
    const adjacent = lines.length === 1 ? ADJACENT.exec(lines[0]) : null;
    if (adjacent) {
        [dice, stated] = [adjacent[1], adjacent[2]];
        targetNote = "The target must be adjacent to the caster.";
        if (adjacent[3]) hitCondition = { link: adjacent[3], rounds: Number(adjacent[4]) };
    } else {
        const flies = FLIES.exec(lines[0] ?? "");
        if (!flies) return null;
        [dice, stated] = [flies[2], flies[3]];
        targetNote = `The target must be within ${flies[1]} feet.`;
        for (const line of lines.slice(1)) {
            if (!half && HALF.test(line)) { half = true; continue; }
            const match = !unless ? UNLESS.exec(line) : null;
            if (match) { unless = { name: match[1], rounds: Number(match[2]) }; continue; }
            return null;
        }
    }
    if (stated !== type || String(components[0].formula).replace(/\s+/g, "") !== dice || Number(dice.split("d")[1]) !== stepFaces) return null;
    const rider = hitCondition ? ` and is ${hitCondition.link} for ${rounds(hitCondition.rounds)}` : unless ? ` and is ${unless.name} for ${rounds(unless.rounds)}` : "";
    const rows = {
        "Critical Success": `The target takes double damage${rider}.`,
        "Success": `The target takes full damage${rider}.`,
        "Failure": half ? `The target takes half damage${unless ? ` and is ${unless.name} for ${rounds(unless.rounds)}` : ""}.` : unless ? `The target is ${unless.name} for ${rounds(unless.rounds)}.` : "The target is unaffected.",
        "Critical Failure": "The target is unaffected."
    };
    // (Hit rows only when a miss does nothing: the attack's table writes the misses.)
    if (!half && !unless) { delete rows.Failure; delete rows["Critical Failure"]; }
    const dataType = String(components[0].type).toLowerCase();
    return {
        html: `<p>Make a ${reach} spell attack against the target's AC.</p><hr />${Object.entries(rows).map(([label, text]) => `<p><strong>${label}</strong> ${text}</p>`).join("")}`,
        typeOverride: dataType !== type ? { componentId: components[0].id, from: dataType, to: type, sourceText: lead[at + 1] } : null,
        note: targetNote,
        claimed: [...lead, ...lines, htmlToPlainText(rest[0]).replace(/\s+/g, " ").trim()]
    };
}
