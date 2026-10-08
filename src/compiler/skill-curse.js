// A curse that makes some skill checks roll twice and fail worse (Clownish Curse): rows "For 1 round, the target must roll twice and use the worse
// result whenever attempting an Acrobatics, Stealth, or Thievery check. If the target rolls a failure at an Acrobatics, Stealth, or Thievery
// check, it gets a critical failure instead." / "As success, but the effect is 1 hour." / "As success, except the effect is permanent.": each row a
// generated Effect — PF2e's RollTwice (keep the lower) on those skills and its degree adjustment (a failure becomes a critical failure) on each —
// for the row's time. PF2e has no Effect for it.
import { htmlToPlainText } from "./description-parser.js";
import { DURATION_ROW as LONGER } from "./text-patterns.js";

const SUCCESS = /^For (\d+) (round|minute|hour)s?, the target must roll twice and use the worse result whenever attempting an? ([A-Z][a-z]+(?:, [A-Z][a-z]+)*,? or [A-Z][a-z]+) check\. If the target rolls a failure at an? \3 check, it gets a critical failure instead\.$/;
const FAILURE = /^As success, but the effect is (\d+) (round|minute|hour)s?\.$/;
const CRITICAL = /^As success, except the effect is permanent\.$/;

const duration = (value, unit) => ({ mode: "fixed", value: Number(value), unit: `${unit}s`, expiry: unit === "round" ? "turn-start" : null, anchor: "effect-start", offset: 0, sourceText: `for ${value} ${unit}${Number(value) === 1 ? "" : "s"}` });

// Daydreamer's Curse: "For 10 minutes, the target must roll twice and use the worse result whenever attempting a Medicine, Nature, Perception, or
// Survival check. If the target critically succeeds at a Perception check or skill check to perform an action with the concentrate trait, the target
// gets a success instead." / "As success, but the effect is permanent." / "As failure, except the target treats the outcomes of all checks with the
// concentrate trait as one degree of success worse than the result it rolled (…)." — the critical failure's concentrate rule replaces the success's.
const DAYDREAM = /^For (\d+) (round|minute|hour)s?, the target must roll twice and use the worse result whenever attempting an? ([A-Z][a-z]+(?:, [A-Z][a-z]+)*,? or [A-Z][a-z]+) check\. If the target critically succeeds at a Perception check or skill check to perform an action with the concentrate trait, the target gets a success instead\.$/;
const PERMANENT = /^As success, but the effect is permanent\.$/;
const CONCENTRATE_WORSE = /^As failure, except the target treats the outcomes of all checks with the concentrate trait as one degree of success worse than the result it rolled \(.+\)\.$/;

function compileDaydreamCurse(rowRaw) {
    const success = DAYDREAM.exec(htmlToPlainText(rowRaw("success")));
    if (!success || !PERMANENT.test(rowRaw("failure")) || !CONCENTRATE_WORSE.test(rowRaw("criticalFailure")) || !/^The target is unaffected\.$/.test(rowRaw("criticalSuccess"))) return null;
    const skills = success[3].replace(/,? or /, ", ").split(/, /).map(skill => skill.toLowerCase());
    const twice = { key: "RollTwice", selector: skills, keep: "lower" };
    const softened = ["perception", "skill-check"].map(selector => ({ key: "AdjustDegreeOfSuccess", selector, adjustment: { criticalSuccess: "to-success" }, predicate: ["item:trait:concentrate"] }));
    const worse = { key: "AdjustDegreeOfSuccess", selector: "check", adjustment: { all: "one-degree-worse" }, predicate: ["item:trait:concentrate"] };
    const note = (degree, rules, text, length) => ({ label: "Curse", text, sourceText: rowRaw(degree), claimsRow: true, rules: JSON.parse(JSON.stringify(rules)), duration: length });
    const first = `The creature rolls ${success[3]} checks twice and uses the worse result; a critical success at a Perception or skill check for an action with the concentrate trait is a success instead.`;
    return {
        success: [note("success", [twice, ...softened], first, duration(success[1], success[2]))],
        failure: [note("failure", [twice, ...softened], first, { mode: "unlimited", sourceText: "unlimited" })],
        criticalFailure: [note("criticalFailure", [twice, worse], `The creature rolls ${success[3]} checks twice and uses the worse result; every check with the concentrate trait is one degree of success worse.`, { mode: "unlimited", sourceText: "unlimited" })]
    };
}

// Curse of the Spirit Orchestra: "Until the start of your next turn, the target must roll twice and use the worse result when it attempts a Diplomacy, Intimidation,
// Performance, or Stealth check. When the target rolls a critical success on any skill check, it gets a success instead. When the target rolls a failure on any
// skill check, it gets a critical failure instead." / "As success, but the duration is 1 hour." / "As success, but the duration is unlimited." — the same generated
// Effect for each row's time (any skill check's degrees adjusted), with the lead's musicians narration (invisible, can't be reasoned with or harmed).
const ORCHESTRA = /^Until the start of your next turn, the target must roll twice and use the worse result when it attempts an? ([A-Z][a-z]+(?:, [A-Z][a-z]+)*,? or [A-Z][a-z]+) check\. When the target rolls a critical success on any skill check, it gets a success instead\. When the target rolls a failure on any skill check, it gets a critical failure instead\.$/;
const UNLIMITED = /^As success, but the duration is unlimited\.$/;
const MUSICIANS = [/^You summon an? @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Invisible\}, insubstantial group of [a-z ]+ who follow the target and play distracting music to hinder its actions\.$/,
    /^The music the musicians play is as inappropriate to the action as possible \(for example, [^)]+\)\.$/, /^The musicians can't be reasoned with or harmed\.$/];
function compileOrchestraCurse(rowRaw, html) {
    const success = ORCHESTRA.exec(htmlToPlainText(rowRaw("success"))), failure = LONGER.exec(rowRaw("failure"));
    if (!success || !failure || !UNLIMITED.test(rowRaw("criticalFailure")) || !/^The target is unaffected\.$/.test(rowRaw("criticalSuccess"))) return null;
    const lead = String(html ?? "").split(/<hr\s*\/?>/i)[0].replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z@])/).filter(Boolean);
    if (lead.length !== MUSICIANS.length || !lead.every((sentence, index) => MUSICIANS[index].test(sentence))) return null;
    const skills = success[1].replace(/,? or /, ", ").split(/, /).map(skill => skill.toLowerCase());
    const rules = [{ key: "RollTwice", selector: skills, keep: "lower" }, { key: "AdjustDegreeOfSuccess", selector: "skill-check", adjustment: { criticalSuccess: "to-success" } },
        { key: "AdjustDegreeOfSuccess", selector: "skill-check", adjustment: { failure: "to-critical-failure" } }];
    const text = `The creature rolls ${success[1]} checks twice and uses the worse result; at any skill check, a critical success is a success and a failure a critical failure.`;
    const note = (degree, length) => ({ label: "Curse", text, sourceText: rowRaw(degree), claimsRow: true, rules: rules.map(rule => JSON.parse(JSON.stringify(rule))), duration: length });
    return {
        success: [note("success", { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "source-turn", offset: 0, sourceText: "until the start of your next turn" })],
        failure: [note("failure", duration(failure[1], failure[2]))],
        criticalFailure: [note("criticalFailure", { mode: "unlimited", sourceText: "unlimited" })],
        preamble: lead.map(sentence => htmlToPlainText(sentence).trim())
    };
}

/** {success, failure, criticalFailure} notes, or null. `rowRaw(degree)` is the row's text. */
export function compileSkillCurse(rowRaw, html = "") {
    const daydream = compileDaydreamCurse(rowRaw);
    if (daydream) return daydream;
    const orchestra = compileOrchestraCurse(rowRaw, html);
    if (orchestra) return orchestra;
    const success = SUCCESS.exec(htmlToPlainText(rowRaw("success"))), failure = FAILURE.exec(rowRaw("failure"));
    if (!success || !failure || !CRITICAL.test(rowRaw("criticalFailure")) || !/^The target is unaffected\.$/.test(rowRaw("criticalSuccess"))) return null;
    const skills = success[3].replace(/,? or /, ", ").split(/, /).map(skill => skill.toLowerCase());
    const rules = [{ key: "RollTwice", selector: skills, keep: "lower" }, ...skills.map(skill => ({ key: "AdjustDegreeOfSuccess", selector: skill, adjustment: { failure: "to-critical-failure" } }))];
    const text = `The creature rolls ${success[3]} checks twice and uses the worse result; a failure at one is a critical failure instead.`;
    const note = (degree, length) => ({ label: "Curse", text, sourceText: rowRaw(degree), claimsRow: true, rules: rules.map(rule => JSON.parse(JSON.stringify(rule))), duration: length });
    return {
        success: [note("success", duration(success[1], success[2]))],
        failure: [note("failure", duration(failure[1], failure[2]))],
        criticalFailure: [note("criticalFailure", { mode: "unlimited", sourceText: "unlimited" })]
    };
}
