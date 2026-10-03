// A conjured prison around the target whose Hit Points depend on the result (Hedge Prison):
//   "You conjure an intricate hedge prison to trap a creature, encasing them completely in a hollow cube of dense bushes." / "The hedge has AC 5,
//   Hardness 5, and 20 Hit Points." / "It's immune to critical hits and precision damage." with rows "The creature escapes the hedge before it fully
//   forms." / "… trapped inside the hedge, but the hedge's Hit Points are reduced by half." / "… trapped inside the hedge." / "…, and the hedge's Hit
//   Points are increased by half." and "Heightened (4th) The hedge's hardness increases to 7 and its Hit Points increase to 30." (and on, with "You can
//   target a creature of Large size or smaller." from 5th).
// The trapped rows become a note with the hedge's statistics at the cast rank and row (the GM tracks the hedge); the larger targets by rank are the
// size limit's steps. The Heightened table must be one linear step a rank (the note's numbers), and its sizes PF2e's target data.
import { htmlToPlainText } from "./description-parser.js";

const CONJURE = /^You conjure an? [a-z ]+ to trap a creature, encasing them completely in an? [a-z ,]+\.$/;
const STATS = /^The ([a-z]+) has AC (\d+), Hardness (\d+), and (\d+) Hit Points\.$/;
const IMMUNE = /^It's immune to critical hits and precision damage\.$/;
const ESCAPES = /^The creature escapes the ([a-z]+) before it fully forms\.$/;
const TRAPPED = /^The creature is trapped inside the ([a-z]+)(?:, but the \1's Hit Points are (reduced|increased) by half|, and the \1's Hit Points are (increased|reduced) by half)?\.$/;
const STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) The ([a-z]+)'s hardness increases to (\d+) and its Hit Points increase to (\d+)\.(?: You can target a creature of (Large|Huge) size or smaller\.)?$/;
const SIZES = { Large: "lg", Huge: "huge" };

/** {rows: {degree: note}, sizeByRank, claimed} or null. */
export function compilePrisonField(adapted, outcomes, lifecycleNote) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.targeting?.area) return null;
    const [body, table, heightened, ...extra] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (extra.length || !heightened) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== 3 || !CONJURE.test(sentences[0]) || !STATS.test(sentences[1]) || !IMMUNE.test(sentences[2])) return null;
    const [, noun, ac, hardness, hp] = STATS.exec(sentences[1]);
    const raw = degree => String(outcomes[degree]?.rawText ?? "").replace(/\s+/g, " ").trim();
    const escape = ESCAPES.exec(raw("criticalSuccess"));
    const rows = { success: TRAPPED.exec(raw("success")), failure: TRAPPED.exec(raw("failure")), criticalFailure: TRAPPED.exec(raw("criticalFailure")) };
    if (!escape || escape[1] !== noun || Object.values(rows).some(row => !row || row[1] !== noun)) return null;
    const half = row => row[2] ?? row[3] ?? null;
    if (half(rows.success) !== "reduced" || half(rows.failure) != null || half(rows.criticalFailure) !== "increased") return null;
    // The table: one step a rank from the spell's rank (Hardness and Hit Points), sizes as PF2e's target data says.
    const steps = [...String(heightened).matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => STEP.exec(htmlToPlainText(match[1]).replace(/\s+/g, " ").trim()));
    if (!steps.length || steps.some(step => !step || step[2] !== noun)) return null;
    const rank = Number(adapted.rank), hardStep = Number(steps[0][3]) - Number(hardness), hpStep = Number(steps[0][4]) - Number(hp);
    if (hardStep <= 0 || hpStep <= 0 || steps.some((step, index) => Number(step[1]) !== rank + 1 + index
        || Number(step[3]) !== Number(hardness) + hardStep * (index + 1) || Number(step[4]) !== Number(hp) + hpStep * (index + 1))) return null;
    const sizeByRank = {};
    let size = null;
    for (const step of steps) if (step[5] && step[5] !== size) { size = step[5]; sizeByRank[step[1]] = SIZES[size]; }
    const levels = adapted.heightening?.type === "fixed" ? adapted.heightening.levels ?? {} : {};
    for (const [at, value] of Object.entries(sizeByRank)) {
        const target = String(levels[at]?.target?.value ?? "");
        if (!new RegExp(`^1 ${value === "lg" ? "Large" : "Huge"} or smaller creature$`, "i").test(target)) return null;
    }
    const note = multiplier => ({ label: `Trapped in the ${noun}`, sourceText: "", claimsRow: true, gmPlays: true,
        text: `A ${noun} encases the creature. The ${noun} has AC ${ac}, Hardness {amount2}, and {amount} Hit Points, and it's immune to critical hits and precision damage (GM: track it; delete this Effect when it's destroyed).`,
        rankAmount: { base: Number(hp), step: hpStep, interval: 1, baseRank: rank, multiplier }, rankAmount2: { base: Number(hardness), step: hardStep, interval: 1, baseRank: rank, multiplier: 1 },
        duration: { ...lifecycleNote } });
    return {
        rows: { success: { ...note(0.5), sourceText: raw("success") }, failure: { ...note(1), sourceText: raw("failure") }, criticalFailure: { ...note(1.5), sourceText: raw("criticalFailure") } },
        sizeByRank, claimed: [...sentences, ...steps.map(step => step[0])]
    };
}
