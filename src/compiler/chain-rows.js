// A chain fettering the target to its space (Restraining Chains): "A steel chain materializes from the surface, fettered to one space of your choice that the target
// occupies, weaving itself around the creature's limbs. The chain continuously pulls on the target and impedes its movement. The chain has AC 10, Hardness 5, and 30 Hit
// Points, and it's immune to critical hits and precision damage." with rows "The target is unaffected." / "The target can only move up to 20 feet away from where the
// chains are fettered until the chains are broken or the target [[/act escape]]{Escapes}." / "The target is {Clumsy 1} and can only move up to 10 feet away …" / "The
// chain binds the target tighter. The target is {Clumsy 2} and can only move up to 5 feet away …". The save isn't named: Reflex (the user's ruling of 2026-10-03, read
// by the source adapter). The rows' Clumsy until it Escapes (the spell DC); the held distance a note an Escape ends; the chain's statistics a reminder (its
// destruction the GM's: delete the Effects).
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C } from "./text-patterns.js";

const BODY = [/^A steel chain materializes from the surface, fettered to one space of your choice that the target occupies, weaving itself around the creature's limbs\.$/,
    /^The chain continuously pulls on the target and impedes its movement\.$/];
const CHAIN = /^The chain has AC (\d+), Hardness (\d+), and (\d+) Hit Points, and it's immune to critical hits and precision damage\.$/;
const HELD = String.raw`can only move up to (\d+) feet away from where the chains are fettered until the chains are broken or the target (?:\[\[\/act escape\]\]\{Escapes\}|Escapes)\.`;
const SUCCESS = new RegExp(String.raw`^The target ${HELD}$`);
const FAILURE = new RegExp(String.raw`^The target is (${C}Clumsy \d\}) and ${HELD}$`);
const CRITICAL = new RegExp(String.raw`^The chain binds the target tighter\. The target is (${C}Clumsy \d\}) and ${HELD}$`);

/** {html, notes: {degree: note}, reminder, sentences} or null. */
export function rewriteChainRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.assumed !== "unnamed-restraint-save" || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length || !minutes) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const chain = CHAIN.exec(sentences[2] ?? "");
    if (sentences.length !== 3 || !BODY.every((pattern, index) => pattern.test(sentences[index])) || !chain) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    if (rows.length !== 4 || htmlToPlainText(row("Critical Success")).trim() !== "The target is unaffected." || !success || !failure || !critical) return null;
    const seconds = Number(minutes[1]) * 60;
    const note = feet => ({ label: "Chained", text: `The target can only move up to ${feet} feet away from where the chain is fettered, until the chain is broken (delete this Effect then) or it Escapes (the spell DC).`,
        claimsRow: true, gmPlays: true, escape: true, duration: { mode: "fixed", value: seconds / 60, unit: "minutes", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `${minutes[1]} minute` } });
    const plainRow = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    return {
        html: `<p>The target must attempt a Reflex save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is ${failure[1]} until it Escapes.</p><p><strong>Critical Failure</strong> The target is ${critical[1]} until it Escapes.</p>`,
        notes: { success: { ...note(Number(success[1])), sourceText: plainRow("Success") }, failure: { ...note(Number(failure[2])), sourceText: plainRow("Failure") }, criticalFailure: { ...note(Number(critical[2])), sourceText: plainRow("Critical Failure") } },
        reminder: { kind: "spell-note", text: `${sentences[2]} Fettered to one space the target occupies. If the chain is destroyed, delete the target's Chained and Clumsy Effects. (The save isn't named: Reflex, by ruling.)`, sourceText: sentences[2] },
        sentences: [...sentences, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plainRow(heading)}`)]
    };
}
