// A chain of targets from one damage roll (Chain Lightning): "You discharge a powerful bolt of lightning at the target, dealing 8d12 electricity damage. The target must
// attempt a basic Reflex save. The electricity arcs to another creature within 30 feet of the first target, jumps to another creature within 30 feet of that target, and
// so on. You can end the chain at any point. You can't target the same creature more than once, and you must have line of effect to all targets. Roll the damage only
// once, and apply it to each target (halving or doubling as appropriate for its saving throw outcome). The chain ends if any one of the targets critically succeeds at
// its save." — the ordinary basic save on every target (one roll, as the save card always does); the targets in the order targeted, each within the distance of the one
// before (the card refuses otherwise); at Finalize, every target after the first critical success is excluded (the chain ended there). Line of effect the GM's.
import { htmlToPlainText } from "./description-parser.js";

const BOLT = /^You discharge [a-z ]+ at the target, dealing (\d+d\d+) ([a-z]+) damage\.$/;
const SAVE = /^The target must attempt a basic (Fortitude|Reflex|Will) save\.$/;
const ARC = /^The [a-z]+ arcs to another creature within (\d+) feet of the first target, jumps to another creature within \1 feet of that target, and so on\.$/;
const RULES = [/^You can end the chain at any point\.$/, /^You can't target the same creature more than once, and you must have line of effect to all targets\.$/,
    /^Roll the damage only once, and apply it to each target \(halving or doubling as appropriate for its saving throw outcome\)\.$/];
const ENDS = /^The chain ends if any one of the targets critically succeeds at its save\.$/;

/** {html, chain, sentences} or null. */
export function rewriteChainSave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area) return null;
    if (!/^1 creature, plus any number of additional creatures$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const bolt = BOLT.exec(sentences[0] ?? ""), save = SAVE.exec(sentences[1] ?? ""), arc = ARC.exec(sentences[2] ?? "");
    if (sentences.length !== 7 || !bolt || !save || !arc || !RULES.every((pattern, index) => pattern.test(sentences[3 + index])) || !ENDS.test(sentences[6])) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || String(components[0].formula).replace(/\s+/g, "") !== bolt[1] || String(components[0].type).toLowerCase() !== bolt[2] || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    return { html: `<p>Each target takes ${bolt[1]} ${bolt[2]} damage with a basic ${save[1]} save.</p>${rest.length ? `<hr />${rest.join("<hr />")}` : ""}`,
        chain: { feet: Number(arc[1]), endsOn: "criticalSuccess", sourceText: [sentences[2], sentences[6]].join(" ") },
        reminder: { kind: "spell-note", text: `${sentences[4]} The targets are taken in the order you targeted them.`, sourceText: sentences[4] },
        sentences };
}
