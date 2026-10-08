// A save that makes the target the caster's minion for a while (Shadow Zombie; user decision 2026-10-01: an Effect with the stated statistics,
// and the caster's player owns the token, with the minion trait, until it ends):
//   "While in this vaporous state, the zombie is a minion under your control, gains resistance 8 to physical damage, and is immune to
//   precision damage." / "It can't cast spells, activate items, or use actions that have the attack or manipulate traits." / "It gains a fly
//   Speed of 10 feet and can slip through tiny cracks." / "If the target is already your minion when you cast the spell, it doesn't get a
//   saving throw and becomes vaporous for 10 minutes." / "If the target is not your minion, it can attempt a Will save to resist the spell." /
//   "If it's already under someone else's command, the controlling creature also rolls a Will save, and the zombie uses the better result."
//   Failure "The target becomes your shadowy minion for 1 minute." / Critical Failure "As failure, but for 10 minutes."
// The rows' note carries the resistance, the immunity and the fly Speed as PF2e rules (the restrictions as its text) and the minion control;
// the already-a-minion and controller rules are the GM's (it sets the result on the card).
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES, plainOrEmpty as plain } from "./text-patterns.js";

const STATE = /^While in this vaporous state, the ([a-z]+) is a minion under your control, gains resistance (\d+) to (physical) damage, and is immune to (precision) damage\.$/;
const LIMITS = /^It can't cast spells, activate items, or use actions that have the attack or manipulate traits\.$/;
const SPEED = /^It gains a (fly) Speed of (\d+) feet and can slip through tiny cracks\.$/;
const ALREADY = /^If the target is already your minion when you cast the spell, it doesn't get a saving throw and becomes vaporous for (\d+) minutes\.$/;
const RESIST = /^If the target is not your minion, it can attempt an? (Fortitude|Reflex|Will) save to resist the spell\.$/;
const CONTROLLER = /^If it's already under someone else's command, the controlling creature also rolls an? (Fortitude|Reflex|Will) save, and the [a-z]+ uses the better result\.$/;
const FAILURE = /^The target becomes your shadowy minion for (\d+) (minute|minutes)\.$/;
const CRITICAL = /^As failure, but for (\d+) minutes\.$/;
const TARGET = /^(?:1|one) ([a-z]+) of level (\d+) or lower$/;

// Subjugate Undead: "You attempt to seize control of the target." / "It can attempt a Will save to resist the effect." / "If the target is already
// being controlled by another creature, the controlling creature also rolls a saving throw and the undead uses the better result." / "Casting
// subjugate undead again ends any previous subjugate undead you cast." with Failure "The undead creature becomes a minion under your control for
// 1 minute. The spell is dismissed if you or an ally takes a hostile action against the minion undead." / Critical Failure "As failure, except the
// duration is 10 minutes." and Target "one undead creature with a level of no more than your level -4".
const SUBJUGATE = {
    resist: /^It can attempt an? (Fortitude|Reflex|Will) save to resist the effect\.$/,
    controller: /^If the target is already being controlled by another creature, the controlling creature also rolls a saving throw and the [a-z]+ uses the better result\.$/,
    recast: /^Casting [a-z ]+ again ends any previous [a-z ]+ you cast\.$/,
    failure: /^The ([a-z]+) creature becomes a minion under your control for (\d+) minutes?\. The spell is dismissed if you or an ally takes a hostile action against the minion [a-z]+\.$/,
    critical: /^As failure, except the duration is (\d+) minutes\.$/,
    target: /^one ([a-z]+) creature with a level of no more than your level [-–−](\d+)$/
};
function extractSubjugation(adapted) {
    const target = SUBJUGATE.target.exec(String(adapted.targeting?.target ?? "").trim());
    if (!target) return null;
    const [preamble, table, ...more] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || more.length) return null;
    const rows = Object.fromEntries(["Critical Success", "Success", "Failure", "Critical Failure"].map(heading =>
        [heading, plain(new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table)?.[1])]));
    const failure = SUBJUGATE.failure.exec(rows.Failure), critical = SUBJUGATE.critical.exec(rows["Critical Failure"]);
    if (!failure || !critical || failure[1] !== target[1] || rows.Success !== "The target is unaffected." || !/^The target is unaffected and is temporarily immune for \d+ hours\.$/.test(rows["Critical Success"])) return null;
    const sentences = plain(preamble).split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const found = {};
    for (const [index, sentence] of sentences.entries()) {
        const match = ["resist", "controller", "recast"].find(key => SUBJUGATE[key].test(sentence));
        if (match && !found[match]) { found[match] = { sentence, groups: SUBJUGATE[match].exec(sentence) }; continue; }
        if (index === 0 && !NARRATION_RULES.test(sentence)) continue;
        return null;
    }
    if (Object.keys(found).length !== 3 || found.resist.groups[1].toLowerCase() !== adapted.defense.statistic) return null;
    const note = (minutes, sourceText) => ({ label: "Subjugated minion", text: "A minion under the caster's control (the caster's player owns its token until this ends). The spell is dismissed if the caster or an ally takes a hostile action against it.",
        sourceText, claimsRow: true, rules: [], minionControl: true,
        duration: { mode: "fixed", value: minutes, unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `for ${minutes} minute${minutes === 1 ? "" : "s"}` } });
    return {
        html: `<p>The target must attempt a ${found.resist.groups[1]} save.</p><hr />${table}`,
        predicates: [{ kind: "trait", slug: target[1], present: true }, { kind: "level-at-most-caster", offset: -Number(target[2]) }],
        rows: { failure: note(Number(failure[2]), rows.Failure), criticalFailure: note(Number(critical[1]), rows["Critical Failure"]) },
        reminders: [
            { kind: "willing-choice", text: "Casting it again ends any earlier subjugation by this caster: end that note (the module doesn't).", sourceText: found.recast.sentence },
            { kind: "surroundings", text: "If it's controlled by another creature, roll that creature's save too and set the better result on the card.", sourceText: found.controller.sentence }],
        sentences
    };
}

/** {html, predicates, rows, reminders, sentences} or null. */
export function extractMinionControl(adapted, heightening) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || (adapted.damageComponents ?? []).length) return null;
    const subjugation = extractSubjugation(adapted);
    if (subjugation) return subjugation;
    const target = TARGET.exec(String(adapted.targeting?.target ?? "").trim());
    if (!target) return null;
    const [preamble, table, heightened = "", ...more] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || more.length) return null;
    const rows = Object.fromEntries(["Critical Success", "Success", "Failure", "Critical Failure"].map(heading =>
        [heading, plain(new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table)?.[1])]));
    const failure = FAILURE.exec(rows.Failure), critical = CRITICAL.exec(rows["Critical Failure"]);
    if (!failure || !critical || rows.Success !== "The target is unaffected." || !/^The target is unaffected and is temporarily immune for \d+ hours\.$/.test(rows["Critical Success"])) return null;
    const sentences = plain(preamble).split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const found = {};
    for (const [index, sentence] of sentences.entries()) {
        const match = [["state", STATE], ["limits", LIMITS], ["speed", SPEED], ["already", ALREADY], ["resist", RESIST], ["controller", CONTROLLER]].find(([, pattern]) => pattern.test(sentence));
        if (match && !found[match[0]]) { found[match[0]] = { sentence, groups: match[1].exec(sentence) }; continue; }
        if (index === 0 && !NARRATION_RULES.test(sentence)) continue;
        return null;
    }
    if (Object.keys(found).length !== 6 || found.state.groups[1] !== target[1] || [found.resist, found.controller].some(entry => entry.groups[1].toLowerCase() !== adapted.defense.statistic)
        || Number(found.already.groups[1]) !== Number(critical[1])) return null;
    // "Heightened (4th) You can target a zombie of level 5 or lower." with PF2e's own heightened target.
    const byRank = {};
    if (heightened) {
        const step = /^<p>\s*<strong>\s*Heightened \((\d)(?:st|nd|rd|th)\)\s*<\/strong>\s*You can target an? ([a-z]+) of level (\d+) or lower\.\s*<\/p>$/.exec(heightened);
        if (!step || step[2] !== target[1] || heightening?.type !== "fixed" || String(heightening.levels?.[step[1]]?.target?.value ?? "") !== `1 ${target[1]} of level ${step[3]} or lower`) return null;
        byRank[step[1]] = Number(step[3]);
    }
    const [, , resistance, resistType, immunity] = found.state.groups;
    const rules = [{ key: "Resistance", type: resistType, value: Number(resistance) }, { key: "Immunity", type: immunity }, { key: "BaseSpeed", selector: found.speed.groups[1], value: Number(found.speed.groups[2]) }];
    const note = (minutes, sourceText) => ({ label: "Shadowy minion", text: `A minion under the caster's control (the caster's player owns its token until this ends). ${found.limits.sentence} It can slip through tiny cracks.`,
        sourceText, claimsRow: true, rules, minionControl: true,
        duration: { mode: "fixed", value: minutes, unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `for ${minutes} minute${minutes === 1 ? "" : "s"}` } });
    return {
        html: `<p>The target must attempt a ${found.resist.groups[1]} save.</p><hr />${table}`,
        predicates: [{ kind: "trait", slug: target[1], present: true }, { kind: "level-at-most", level: Number(target[2]), byRank }],
        rows: { failure: note(Number(failure[1]), rows.Failure), criticalFailure: note(Number(critical[1]), rows["Critical Failure"]) },
        reminders: [
            { kind: "willing-choice", text: `If the target is already the caster's minion, it doesn't save: set its result to Critical Failure (${critical[1]} minutes).`, sourceText: found.already.sentence },
            { kind: "surroundings", text: `If it's under someone else's command, roll that creature's ${found.controller.groups[1]} save too and set the better result on the card.`, sourceText: found.controller.sentence }],
        sentences
    };
}
