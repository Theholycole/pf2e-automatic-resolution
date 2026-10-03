// A save whose result is something only the GM can play (user decision 2026-10-03: "resolve by commands to the GM"): the failing rows' note
// whispers the GM what to do or tell the caster's player.
//   Catch Your Name: "You learn a private name (but not the true name) of the creature who spoke your name, as well as their precise location, unless
//   they succeed at a Will save to negate the effect." with the trigger, the requirement and "You are aware any time the trigger conditions are met …"
//   (the GM's reminder): the speaker's save; a failure whispers the GM to give the caster that name and location.
//   Telepathic Demand: "You send the target a message of 25 words or fewer, and it can respond … Your message is insidious and has the effect of a
//   {Suggestion} spell, with the message substituting for the spoken suggestion. On a successful save, the target is temporarily immune for 1 day, and on
//   a critical success, the target is temporarily immune for 1 month. You can target a creature only if you've previously been in telepathic contact with
//   it before, …": Suggestion's rows (a critical success knows it was targeted; a failure follows the message for 1 minute, a critical failure for
//   1 hour, each until a finite demand is done or it turns self-destructive) as whispers to the GM; the immunity per result; the earlier contact the
//   GM's yes/no on the target.
import { htmlToPlainText } from "./description-parser.js";

const NAME = /^You learn a private name \(but not the true name\) of the creature who spoke your name, as well as their precise location, unless they succeed at an? (Fortitude|Reflex|Will) save to negate the effect\.$/;
const AWARE = [/^You are aware any time the trigger conditions are met as long as you have the spell prepared or in your repertoire\.$/,
    /^There is no way to distinguish one trigger of this spell from another without actually casting the spell\.$/, /^This can become a nuisance if [^.]+\.$/];
const MESSAGE = /^You send the target a message of (\d+) words or fewer, and it can respond immediately with its own message of \1 words or fewer\.$/;
const SUGGEST = /^Your message is insidious and has the effect of an? @UUID\[Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+\]\{Suggestion\} spell, with the message substituting for the spoken suggestion\.$/;
const IMMUNE = /^On a successful save, the target is temporarily immune for 1 (day|hour|minute), and on a critical success, the target is temporarily immune for 1 (month|week|day)\.$/;
const CONTACT = /^You can target a creature only if you've previously been in telepathic contact with it before, such as via the [a-z ]+ spell\.$/;
const DAYS = { minute: { value: 1, unit: "minutes" }, hour: { value: 1, unit: "hours" }, day: { value: 1, unit: "days" }, week: { value: 7, unit: "days" }, month: { value: 30, unit: "days" } };
const unaffected = heading => `<p><strong>${heading}</strong> The target is unaffected.</p>`;
const table = `<hr />${["Critical Success", "Success", "Failure", "Critical Failure"].map(unaffected).join("")}`;
const round = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: "when cast" };

/** {html, notes, reminders, immunity?, constraints?, sentences} or null. */
export function rewriteGmCommand(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const sections = html.split(/<hr\s*\/?>/i).map(section => section.trim());
    const plain = text => htmlToPlainText(text).replace(/\s+/g, " ").trim();
    const split = text => plain(text).split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    // Catch Your Name (a reaction: its trigger and requirement first).
    if (sections.length === 2 && /<strong>\s*Trigger\s*<\/strong>/.test(sections[0])) {
        const trigger = plain(/<strong>\s*Trigger\s*<\/strong>([\s\S]*?)<\/p>/.exec(sections[0])?.[1] ?? ""), requirement = plain(/<strong>\s*Requirements\s*<\/strong>([\s\S]*?)<\/p>/.exec(sections[0])?.[1] ?? "");
        const body = split(sections[1]), name = NAME.exec(body[0] ?? "");
        if (!name || name[1].toLowerCase() !== adapted.defense.statistic || !trigger || body.length !== 1 + AWARE.length || !AWARE.every((pattern, index) => pattern.test(body[index + 1]))) return null;
        const note = { label: "Name caught", text: "The caster learns this creature's private name (not its true name) and its precise location.", sourceText: body[0], claimsRow: true, gmPlays: true,
            reveal: { kind: "gm-command", timing: "now", text: "tell the caster's player this creature's private name (not its true name) and its precise location." }, duration: { ...round } };
        return { html: `<p>The target must attempt a ${name[1]} save.</p>${table}`, notes: { failure: note, criticalFailure: structuredClone(note) },
            reminders: [{ kind: "spell-note", text: `Trigger: ${trigger}${requirement ? ` Requirement: ${requirement}` : ""} Target the creature who spoke the name. ${body.slice(1).join(" ")}`, sourceText: body[1] }],
            constraints: { sourceText: "the creature who spoke your name (the trigger)", supportsActorTargets: true, complete: true, predicates: [] },
            sentences: [trigger, requirement, ...body].filter(Boolean) };
    }
    // Telepathic Demand.
    if (sections.length === 1) {
        const body = split(sections[0]);
        const message = MESSAGE.exec(body[0] ?? ""), immune = IMMUNE.exec(body[2] ?? "");
        if (!message || !SUGGEST.test(sections[0].replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/)[1] ?? "") || !immune || !CONTACT.test(body[3] ?? "") || body.length !== 4) return null;
        if (!/^1 creature you've telepathically contacted before$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
        const follow = (span, unit) => ({ label: "Telepathic demand", text: `The creature immediately follows the caster's message (${message[1]} words or fewer) as a suggestion, for ${span} or until it completes a finite demand or the demand becomes self-destructive or has other obvious negative effects.`,
            sourceText: body[1], claimsRow: true, gmPlays: true, reveal: { kind: "gm-command", timing: "now", text: `this creature follows the caster's message as Suggestion would, for ${span} or until it's done or turns self-destructive. It can reply with its own ${message[1]} words.` },
            duration: { mode: "fixed", value: 1, unit, expiry: null, anchor: "effect-start", offset: 0, sourceText: `for ${span}` } });
        const knows = { label: "Telepathic demand", text: "The creature is unaffected and knows the caster tried to control it.", sourceText: body[1], claimsRow: true, gmPlays: true,
            reveal: { kind: "gm-command", timing: "now", text: `this creature knows the caster tried to control it. It can reply with its own ${message[1]} words.` }, duration: { ...round } };
        return { html: `<p>The target must attempt a ${adapted.defense.statistic[0].toUpperCase()}${adapted.defense.statistic.slice(1)} save.</p>${table}`,
            notes: { criticalSuccess: knows, failure: follow("1 minute", "minutes"), criticalFailure: follow("1 hour", "hours") },
            reminders: [{ kind: "spell-note", text: `${body[0]} (The GM plays the target's reply.)`, sourceText: body[0] }],
            immunity: { degrees: ["criticalSuccess", "success"], duration: { ...DAYS[immune[1]] }, byDegree: { criticalSuccess: { ...DAYS[immune[2]] }, success: { ...DAYS[immune[1]] } }, sourceText: body[2] },
            constraints: { sourceText: String(adapted.targeting.target), supportsActorTargets: true, complete: true,
                predicates: [{ kind: "gm-confirmed", question: "Has the caster been in telepathic contact with this creature before (such as through telepathy)?", sourceText: body[3] }] },
            sentences: body };
    }
    return null;
}
