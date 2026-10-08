// An illusion the target can disbelieve by interacting with it (Phantasmal Treasure; user decision 2026-10-01: a Disbelieve control rolls the
// creature's Perception against the spell DC when the GM says it interacts):
//   Success "The target becomes Fascinated with the treasure, and the duration is until the end of its turn. The target can also try to
//   disbelieve the illusion if it touches the treasure, Seeks to examine it, or speaks to it if the illusion appears to be a person or the
//   like. If the target disbelieves the illusion, the spell ends." / Failure "As success, but the duration is 1 minute." / Critical Failure
//   "As success, but the duration is 1 minute. The target finds the treasure so appealing that until the spell ends, it must spend each action
//   focused on it. …"
// Rewritten to the plain rows (Fascinated until the end of its turn, or for 1 minute); each affected row gets the disbelief note (its control
// ends the spell on a success), and the critical failure its behaviour note.
import { htmlToPlainText } from "./description-parser.js";
import { plainOrEmpty as plain } from "./text-patterns.js";

const CONDITION = String.raw`(@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Fascinated\})`;
const SUCCESS = new RegExp(String.raw`^The target becomes ${CONDITION} with the ([a-z]+), and the duration is until the end of its turn\. (The target can also try to disbelieve the illusion if it touches the \2, @UUID\[[^\]]+\]\{Seeks\} to examine it, or speaks to it if the illusion appears to be a person or the like\.) If the target disbelieves the illusion, the spell ends\.$`);
const FAILURE = /^As success, but the duration is 1 minute\.$/;
const CRITICAL = /^As success, but the duration is 1 minute\. (The target finds the [a-z]+ so appealing that until the spell ends, it must spend each action focused on it\. This can include moving toward the [a-z]+ if the target isn't next to it, and @UUID\[[^\]]+\]\{Interacting\} with the [a-z]+ if the target is next to it\. \(If the illusion appears to be a person or the like, the target can also Interact to converse with it\.\))$/;
const PREAMBLE = [
    /^Only the spell's target can see the [a-z]+, though you can see the vague shape of the [a-z]+[^.]*\.$/,
    /^The target's response to the [a-z]+ is based on the outcome of the target's (Fortitude|Reflex|Will) save\.$/
];
const NARRATION_RULES = /\d|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;

/** {html, rows: {degree: notes}, notes, sentences} or null. */
export function extractIllusionDisbelief(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || (adapted.damageComponents ?? []).length) return null;
    const [preamble, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const rows = Object.fromEntries(["Critical Success", "Success", "Failure", "Critical Failure"].map(heading =>
        [heading, plain(new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table)?.[1])]));
    const success = SUCCESS.exec(rows.Success), critical = CRITICAL.exec(rows["Critical Failure"]);
    if (rows["Critical Success"] !== "The target is unaffected." || !success || !FAILURE.test(rows.Failure) || !critical) return null;
    const sentences = plain(preamble).split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const notes = [];
    for (const [index, sentence] of sentences.entries()) {
        if (PREAMBLE.some(pattern => pattern.test(sentence))) { notes.push(sentence); continue; }
        if (index === 0 && !NARRATION_RULES.test(sentence.replace(/@UUID\[[^\]]+\]\{[^}]+\}/g, ""))) continue;
        return null;
    }
    const statistic = PREAMBLE[1].exec(notes.find(sentence => PREAMBLE[1].test(sentence)) ?? "")?.[1];
    if (!statistic || statistic.toLowerCase() !== adapted.defense.statistic || notes.length !== 2) return null;
    const [, condition, thing] = success;
    const disbelieve = degree => ({ label: "Disbelieve the illusion", text: `${success[3].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")} If it does, the spell ends (the GM uses the Disbelieve control: its Perception against the spell DC).`,
        sourceText: degree === "success" ? rows.Success : degree === "failure" ? rows.Failure : rows["Critical Failure"], claimsRow: true, gmPlays: true,
        duration: degree === "success" ? { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 0, sourceText: "until the end of its turn" }
            : { mode: "fixed", value: 1, unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: "1 minute" },
        disbelieve: { statistic: "perception", endsSpell: true } });
    const focus = { label: `Focused on the ${thing}`, text: critical[1].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1"), sourceText: critical[1], gmPlays: true,
        duration: { mode: "fixed", value: 1, unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: "until the spell ends" } };
    return {
        html: `<p>The target must attempt a ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is ${condition} until the end of its turn.</p>`
            + `<p><strong>Failure</strong> The target is ${condition} for 1 minute.</p><p><strong>Critical Failure</strong> The target is ${condition} for 1 minute.</p>`,
        rowNotes: { success: [disbelieve("success")], failure: [disbelieve("failure")], criticalFailure: [disbelieve("criticalFailure"), focus] },
        notes, sentences: [...sentences, rows.Success, rows.Failure, rows["Critical Failure"]]
    };
}

// A damaging illusion area its disbelievers escape (Visions of Danger; user decision 2026-10-01: disbelief is a GM control): "The burst deals 8d8 mental
// damage with a basic Will save to each creature that's inside the burst when it's created, enters the burst, or starts its turn inside the burst." / "A
// creature that critically succeeds at its Will save can immediately attempt to disbelieve the illusion." / "A creature that tries to Interact with the
// monsters or observes one with a {Seek} action can attempt to disbelieve the illusion." / "Creatures that disbelieve the illusion take no damage from the
// illusion thereafter." — the lingering basic-save area; the GM's Disbelieve control rolls the creature's Perception against the spell DC, and a success
// exempts it from the area's later exposures.
const AREA_DEALS = /^The ([a-z]+) deals (\d+d\d+ [a-z]+ damage) with a basic (Fortitude|Reflex|Will) save to each creature that's inside the \1 when it's created, enters the \1, or starts its turn inside the \1\.$/;
const CRIT_DISBELIEVE = /^A creature that critically succeeds at its (Fortitude|Reflex|Will) save can immediately attempt to disbelieve the illusion\.$/;
const SEEK_DISBELIEVE = /^A creature that tries to Interact with the [a-z]+ or observes one with a (?:@UUID\[[^\]]+\]\{Seek\}|Seek) action can attempt to disbelieve the illusion\.$/;
const NO_DAMAGE = /^Creatures that disbelieve the illusion take no damage from the illusion thereafter\.$/;
export function rewriteDisbelievedArea(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || !adapted.targeting?.area) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = body.replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => AREA_DEALS.test(sentence));
    if (at < 0 || sentences.length !== at + 4 || !CRIT_DISBELIEVE.test(sentences[at + 1]) || !SEEK_DISBELIEVE.test(sentences[at + 2]) || !NO_DAMAGE.test(sentences[at + 3])) return null;
    // (Up to two opening sentences of narration: what the illusion looks like.)
    if (at > 2 || sentences.slice(0, at).some(sentence => /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|can't|must|until)\b/i.test(sentence))) return null;
    const deals = AREA_DEALS.exec(sentences[at]);
    if (deals[3].toLowerCase() !== adapted.defense.statistic) return null;
    return { html: `<p>Each creature that's inside the ${deals[1]} when it's created, enters the ${deals[1]}, or starts its turn inside the ${deals[1]} takes ${deals[2]} with a basic ${deals[3]} saving throw.</p>${rest.length ? `<hr />${rest.join("<hr />")}` : ""}`,
        disbelief: { statistic: "perception", key: `${adapted.source?.slug ?? "illusion"}-disbelieved`, label: "tries to disbelieve the illusion (after a critical success on its save, Interacting with it, or Seeking it)", sourceText: htmlToPlainText(sentences.slice(at + 1).join(" ")) },
        sentences: sentences.map(sentence => htmlToPlainText(sentence)) };
}
