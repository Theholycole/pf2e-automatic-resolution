// Words that hold an audience (Enthrall): "Your words fascinate your targets. You speak or sing without interruption throughout the casting and duration. Targets
// who notice your speech or song might give their undivided attention; each target must attempt a Will save. The GM might grant a circumstance bonus (to a maximum
// of +4) if the target is of an opposing religion, ancestry, or political leaning, or is otherwise unlikely to agree with what you're saying." / "Each creature
// that comes within range has to attempt a save when you Sustain the spell. If you're speaking, enthrall gains the linguistic trait." with rows "… unaffected and
// notices that you tried to use magic." / "… needn't pay attention but doesn't notice …" / "The target is Fascinated with you. It can attempt another Will save if
// it witnesses actions or speech with which it disagrees. If it succeeds, it's no longer fascinated and is temporarily immune for 1 hour. If the target is subject to
// a hostile act, or if another creature succeeds at a Diplomacy or Intimidation check against it, the fascination ends immediately." / "As failure, but the target
// can't attempt a save to end the fascination if it disagrees with you.": the GM's bonus asked per target; Fascinated for the sustained spell; the failure's
// save on disagreement a control ending only that creature's part, then its hour's immunity; the newcomers' saves a card for each Sustain.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const FIRST = /^Your words fascinate your targets\. You speak or sing without interruption throughout the casting and duration\. Targets who notice your speech or song might give their undivided attention; each target must attempt a (Fortitude|Reflex|Will) save\. The GM might grant a circumstance bonus \(to a maximum of \+(\d)\) if the target is of an opposing religion, ancestry, or political leaning, or is otherwise unlikely to agree with what you're saying\.$/;
const SECOND = /^(Each creature that comes within range has to attempt a save when you Sustain the spell\.) (If you're speaking, [a-z]+ gains the linguistic trait\.)$/;
const FAILURE = new RegExp(String.raw`^The target is (${C}Fascinated\}) with you\. It can attempt another (Fortitude|Reflex|Will) save if it witnesses actions or speech with which it disagrees\. If it succeeds, it's no longer fascinated and is temporarily immune for (\d+) (hour|minute)s?\. (If the target is subject to a hostile act, or if another creature succeeds at a Diplomacy or Intimidation check against it, the fascination ends immediately\.)$`);
const CRITICAL = /^As failure, but the target can't attempt a save to end the fascination if it disagrees with you\.$/;

/** {html, adjustment, notes, chain, reminder, constraint, immunityKey, sentences} or null. */
export function rewriteEnthrall(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length) return null;
    if (!/^all creatures in range$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const first = FIRST.exec(paragraphs[0] ?? ""), second = SECOND.exec(paragraphs[1] ?? "");
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const failure = FAILURE.exec(row("Failure"));
    if (paragraphs.length !== 2 || !first || !second || first[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !failure || failure[2] !== first[1]
        || plain("Critical Success") !== "The target is unaffected and notices that you tried to use magic."
        || plain("Success") !== "The target needn't pay attention but doesn't notice you tried to use magic (it might notice others are enthralled)." || !CRITICAL.test(plain("Critical Failure"))) return null;
    const key = String(adapted.source?.slug ?? "");
    const ends = failure[5].replace(/^If the target is subject to/, "If it is subject to").replace(/the fascination ends immediately/, "the fascination ends at once (the GM ends it)");
    const spellTime = { mode: "fixed", value: 10, unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: "sustained up to 10 minutes" };
    const maxBonus = Number(first[2]);
    return {
        html: `<p>The target must attempt a ${first[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is ${failure[1]} for the spell's duration.</p><p><strong>Critical Failure</strong> The target is ${failure[1]} for the spell's duration.</p>`,
        adjustment: { question: "Is the creature of an opposing religion, ancestry or political leaning, or otherwise unlikely to agree? The GM's circumstance bonus to its save:", modifierType: "circumstance", appliesTo: "save",
            choices: Array.from({ length: maxBonus + 1 }, (_, n) => ({ label: n ? `+${n}` : "None", value: n })), sourceText: paragraphs[0] },
        notes: {
            failure: { label: "Enthralled", text: `It's fascinated with the caster. When it witnesses actions or speech it disagrees with, the GM uses the control: its ${failure[2]} save, and on a success it's no longer fascinated and is immune for ${failure[3]} ${failure[4]}${failure[3] === "1" ? "" : "s"}. ${ends}`,
                sourceText: plain("Failure"), claimsRow: true, gmPlays: true, endSave: { statistic: failure[2].toLowerCase(), label: "it disagrees with the caster", oncePerRound: false, scope: "creature",
                    immunity: { value: Number(failure[3]), unit: `${failure[4]}s`, key } }, duration: { ...spellTime } },
            criticalFailure: { label: "Enthralled", text: `It's fascinated with the caster and gets no save when it disagrees. ${ends}`, sourceText: plain("Critical Failure"), claimsRow: true, gmPlays: true, duration: { ...spellTime } }
        },
        chain: { perCast: true, repeatable: true, cascade: false, label: "creatures that came within range", sourceText: second[1] },
        reminder: { kind: "spell-note", text: `Target the creatures that notice the speech or song. ${second[2]} On a critical success a creature notices the caster tried to use magic; on a success it doesn't.`, sourceText: second[1] },
        constraint: { sourceText: "all creatures in range", supportsActorTargets: true, complete: true, predicates: [] },
        immunityKey: key,
        sentences: [...paragraphs, second[1], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
