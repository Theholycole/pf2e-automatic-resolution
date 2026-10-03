// Questions sifted from a mind (Mind Probe): "You cast your thoughts through a creature's mind, sifting for information. You access the target's memories and
// knowledge unless it fends you off with a Will save." with rows "The target is unaffected." / "Each round of the spell's duration, you can Sustain the spell to
// ask a different question and attempt to uncover the answer. For each question, the target can attempt a Deception check against your spell DC; if the
// target succeeds, you don't learn the answer, and on a critical success, the target gives you a false answer that you believe is truthful Once you've asked
// the target a given question, asking it again, even with a separate casting of mind probe, produces the same result." / "As failure, and the target takes a
// –4 circumstance penalty to Deception checks against your questions.": a note for the sustained spell carrying the question control (its Deception against
// the spell DC, the critical failure's with the penalty; what the caster gets whispered to the GM).
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^You cast your thoughts through a creature's mind, sifting for information\. You access the target's memories and knowledge unless it fends you off with a (Fortitude|Reflex|Will) save\.$/;
const FAILURE = /^Each round of the spell's duration, you can Sustain the spell to ask a different question and attempt to uncover the answer\. For each question, the target can attempt a (Deception) check against your spell DC; if the target succeeds, you don't learn the answer, and on a critical success, the target gives you a false answer that you believe is truthful\.? (Once you've asked the target a given question, asking it again, even with a separate casting of [a-z ]+, produces the same result\.)$/;
const CRITICAL = /^As failure, and the target takes a [–−-](\d) (circumstance|status) penalty to Deception checks against your questions\.$/;

/** {html, notes, sentences} or null. */
export function rewriteMindProbe(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const paragraphs = [...String(adapted.descriptionHTML ?? "").matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const lead = LEAD.exec(htmlToPlainText(paragraphs[0] ?? "").trim());
    const row = heading => htmlToPlainText(paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    if (!minutes || paragraphs.length !== 4 || !lead || lead[1].toLowerCase() !== adapted.defense.statistic || row("Success") !== "The target is unaffected." || !failure || !critical) return null;
    const note = (heading, penalty) => ({ label: "Mind probed", text: `Each round, when the caster Sustains the spell, they ask a different question; the GM uses the question control (its ${failure[1]} against the spell DC${penalty ? `, with a –${-penalty.value} ${penalty.type} penalty` : ""}). ${failure[2].replace(/^Once you've asked the target/, "Once the caster has asked it")}`,
        sourceText: row(heading), claimsRow: true, gmPlays: true, questionCheck: { skill: failure[1].toLowerCase(), ...(penalty ? { penalty } : {}) },
        duration: { mode: "fixed", value: Number(minutes[1]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `sustained up to ${minutes[1]} minute${minutes[1] === "1" ? "" : "s"}` } });
    return {
        html: `<p>The target must attempt a ${lead[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is unaffected.</p>`,
        notes: { failure: note("Failure", null), criticalFailure: note("Critical Failure", { value: -Number(critical[1]), type: critical[2] }) },
        sentences: [lead[0], ...["Success", "Failure", "Critical Failure"].map(heading => `${heading} ${row(heading)}`)]
    };
}
