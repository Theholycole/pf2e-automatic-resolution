// A behaviour the GM plays whose lifetime the result sets (Orb of Twisting Fate): "Success At the start of its turn, the target must decide whether to … .
// The spell then ends." / "Failure As success, but instead of ending automatically, the target attempts a new save at the end of each of its turns, ending
// the effect on a success." / "Critical Failure As success, but instead of ending automatically, the spell lasts for the full duration." — the success's
// behaviour as the GM's note on each failing row: until the end of the target's next turn (success), the spell's duration with an end-of-turn save that ends
// it (failure), or the spell's whole duration (critical failure). The behaviour must be the row's only rule (no condition, damage or number).
import { htmlToPlainText } from "./description-parser.js";
import { UNIT as UNITS } from "./text-patterns.js";

const ROW = /<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>([\s\S]*?)<\/p>/gi;
const UNAFFECTED = /^The (?:creature|target) is unaffected\.$/;
const THEN_ENDS = /^(At the start of its turn, the target [^.@\d]+\.) The spell then ends\.$/;
const NEW_SAVES = /^As success, but instead of ending automatically, the target attempts a new save at the end of each of its turns, ending the effect on a success\.$/;
const FULL = /^As success, but instead of ending automatically, the spell lasts for the full duration\.$/;
const RULE_WORDS = /@|\[\[|\d|\b(?:damage|condition|bonus|penalty|immune|Hit Points)\b/i;

/** {html, notes, sentences} or null. */
export function rewriteLastingNoteRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || (adapted.damageComponents ?? []).length || adapted.targeting?.area) return null;
    const minutes = /^(?:up to )?(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes || adapted.lifecycle?.sustained) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const sections = html.split(/<hr\s*\/?>/i);
    if (sections.length !== 2) return null;
    const rows = Object.fromEntries([...sections[1].matchAll(ROW)].map(match => [match[1], htmlToPlainText(match[2]).replace(/\s+/g, " ").trim()]));
    if (Object.keys(rows).length !== 4 || !UNAFFECTED.test(rows["Critical Success"] ?? "")) return null;
    const behaviour = THEN_ENDS.exec(rows.Success ?? "");
    if (!behaviour || RULE_WORDS.test(behaviour[1]) || !NEW_SAVES.test(rows.Failure ?? "") || !FULL.test(rows["Critical Failure"] ?? "")) return null;
    // (The opening paragraph is narration: no rule words.)
    const opening = htmlToPlainText(sections[0]).replace(/\s+/g, " ").trim();
    if (RULE_WORDS.test(opening)) return null;
    const rounds = Number(minutes[1]) * 10, statistic = adapted.defense.statistic;
    const note = (sourceText, duration, extra = {}) => ({ label: "GM note", text: behaviour[1], sourceText, claimsRow: true, wholeRow: true, gmPlays: true, duration, ...extra });
    const row = (heading, text) => `<p><strong>${heading}</strong> ${text}</p>`;
    return {
        html: `<p>The target must attempt a ${statistic[0].toUpperCase()}${statistic.slice(1)} save.</p><hr />${row("Critical Success", "The target is unaffected.")}${row("Success", "The target is unaffected.")}${row("Failure", "The target is unaffected.")}${row("Critical Failure", "The target is unaffected.")}`,
        notes: {
            success: note(rows.Success, { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 0, sourceText: "The spell then ends." }),
            failure: note(rows.Failure, { mode: "fixed", value: rounds, unit: "rounds", expiry: "turn-end", anchor: "effect-start", offset: 0, sourceText: String(adapted.lifecycle.duration) },
                { recurringSave: { timing: "turn-end", mode: "end", statistic, sourceText: rows.Failure } }),
            criticalFailure: note(rows["Critical Failure"], { mode: "fixed", value: Number(minutes[1]), unit: "minutes", expiry: "turn-end", anchor: "effect-start", offset: 0, sourceText: "the full duration" })
        },
        sentences: [opening, ...Object.entries(rows).map(([heading, text]) => `${heading} ${text}`)]
    };
}

// A creature trapped away from the battle until a time or a number of obstacles passed (Maze of Locked Doors): "Success The target is trapped for 1 round, or
// until it bypasses 1 door." / "Failure … for 1 minute, or until it bypasses 2 doors." / "Critical Failure … for 10 minutes, or until it bypasses 3 doors." with
// an opening paragraph describing the hallway, its doors (the checks to pass them) and the counteract against teleportation inside — each row's GM note for its
// own time (the GM ends it early when the doors are passed), and the opening as the card's GM reminder (the doors and the teleport rule are played off the map).
const TRAPPED = /^The target is trapped for (\d+) (round|minute|hour)s?, or until it bypasses (\d+) doors?\.$/;

/** {durations: {degree: {value, unit, doors}}, reminder, sentences} or null. */
export function readTrappedRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || (adapted.damageComponents ?? []).length || adapted.targeting?.area) return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (sections.length !== 2) return null;
    const rows = Object.fromEntries([...sections[1].matchAll(ROW)].map(match => [match[1], htmlToPlainText(match[2]).replace(/\s+/g, " ").trim()]));
    if (Object.keys(rows).length !== 4 || !UNAFFECTED.test(rows["Critical Success"] ?? "")) return null;
    const durations = {};
    for (const [heading, degree] of [["Success", "success"], ["Failure", "failure"], ["Critical Failure", "criticalFailure"]]) {
        const trapped = TRAPPED.exec(rows[heading] ?? "");
        if (!trapped) return null;
        durations[degree] = { value: Number(trapped[1]), unit: UNITS[trapped[2]], doors: Number(trapped[3]), sourceText: rows[heading] };
    }
    // (Longer for each worse result, and more doors.)
    const seconds = entry => entry.value * { rounds: 6, minutes: 60, hours: 3600 }[entry.unit];
    if (!(seconds(durations.success) < seconds(durations.failure) && seconds(durations.failure) < seconds(durations.criticalFailure)
        && durations.success.doors < durations.failure.doors && durations.failure.doors < durations.criticalFailure.doors)) return null;
    const skill = name => `${name[0].toUpperCase()}${name.slice(1)}`;
    const opening = htmlToPlainText(sections[0].replace(/@Check\[([a-z]+)\|dc:(\d+)\|name:[^|\]]+[^\]]*\]/g, (all, name, dc) => `${skill(name)} DC ${dc}`)
        .replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")).replace(/\s+/g, " ").trim();
    if (!/\bescape only when the spell expires, or when they successfully pass through the number of doors determined by their save\b/.test(opening)) return null;
    return { durations, reminder: { kind: "spell-note", text: opening, sourceText: opening }, sentences: [opening, ...Object.entries(rows).map(([heading, text]) => `${heading} ${text}`)] };
}
