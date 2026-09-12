import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";

const BASIC_SAVE = /\bbasic\s+(fortitude|reflex|will)\s+save\b/i;
const DAMAGE = /\bdamage\b/i;

// These signals are not necessarily unsupported. They mean the description is
// doing more than the initial damage-only compiler has proved it understands.
const UNCOMPILED_MECHANIC = new RegExp([
    "\\badditional\\b",
    "\\balso\\b",
    "\\bcritical(?:ly)?\\b",
    "\\bsuccess\\b",
    "\\bfailure\\b",
    "\\bimmune\\b",
    "\\btemporary\\b",
    "\\bpersistent\\b",
    "\\bcondition\\b",
    "\\bheal(?:ing|s|ed)?\\b",
    "\\btemporary hit points?\\b",
    "\\bpush(?:ed|es)?\\b",
    "\\bpull(?:ed|s)?\\b",
    "\\bmove(?:s|d|ment)?\\b",
    "\\bteleport(?:ed|s)?\\b",
    "\\bknock(?:ed|s)?\\b",
    "\\bprone\\b",
    "\\bconcealed\\b",
    "\\bdifficult terrain\\b",
    "\\bobject(?:s)?\\b",
    "\\bliving\\b",
    "\\bundead\\b",
    "\\bconstruct(?:s)?\\b",
    "\\btrait\\b",
    "\\binstead of\\b",
    "\\bdepending on\\b",
    "\\bchoose\\b",
    "\\bcan choose\\b",
    "\\bmust attempt\\b",
    "\\buntil\\b",
    "\\bfor \\d+ (?:rounds?|minutes?|hours?|days?|weeks?)\\b",
    "\\bstarts? (?:its|their) turn\\b",
    "\\bends? (?:its|their) turn\\b",
    "\\benters?\\b",
    "\\bwhen you sustain\\b",
    "\\bdismiss\\b",
    "\\bcounteract\\b"
].join("|"), "i");

const OTHER_SENTENCE_MECHANIC = /\b(?:save|damage|area|range|duration|sustain|attack|healing|hit points?|weakness|resistance|immunity|takes?|deals?|must|can|may)\b/i;

function sentences(text) {
    return String(text ?? "")
        .split(/(?<=[.!?])\s+(?=[A-Z@])/)
        .map(sentence => sentence.trim())
        .filter(Boolean);
}

export function assessSimpleBasicSaveDescription(adapted, analysis) {
    const reasons = [];
    const baseText = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML));
    const descriptionSentences = sentences(baseText);
    const basicSaveSentences = descriptionSentences.filter(sentence => BASIC_SAVE.test(sentence));
    const damageSentences = descriptionSentences.filter(sentence => DAMAGE.test(sentence));

    if (adapted.defense.kind !== "save" || !adapted.defense.basic) reasons.push("not-basic-save");
    if (adapted.damageComponents.length === 0) reasons.push("no-structured-damage");
    if (adapted.lifecycle.sustained) reasons.push("sustained");
    if (adapted.rules.length > 0) reasons.push("item-rules-present");
    if (analysis.sectionCount > 0) reasons.push("degree-sections-present");
    if (analysis.inlineChecks > 0) reasons.push("inline-checks-present");
    if (analysis.inlineDamage > 0) reasons.push("inline-damage-present");
    if (analysis.allConditionReferences.length > 0) reasons.push("condition-references-present");
    if (analysis.spellEffectReferences.length > 0) reasons.push("spell-effect-references-present");
    if (analysis.actionReferences.length > 0) reasons.push("action-references-present");
    if (analysis.templates.length > 0) reasons.push("inline-templates-present");
    if (analysis.hasArrivalDeparture) reasons.push("multiple-phases-present");
    // The PF2e item defense is authoritative. Some official descriptions, such
    // as Fireball, omit the visible words "basic Reflex save" entirely.
    if (basicSaveSentences.length > 1) reasons.push("basic-save-sentence-not-unique");
    if (damageSentences.length !== 1) reasons.push("damage-sentence-not-unique");

    const saveSentence = basicSaveSentences[0] ?? damageSentences[0] ?? "";
    const statistic = saveSentence.match(BASIC_SAVE)?.[1]?.toLowerCase() ?? null;
    if (statistic && statistic !== adapted.defense.statistic) reasons.push("save-statistic-mismatch");
    if (saveSentence && !DAMAGE.test(saveSentence)) reasons.push("save-sentence-has-no-damage");
    if (UNCOMPILED_MECHANIC.test(baseText)) reasons.push("uncompiled-mechanic-signal");
    if (/\b(?:Fly|Leap|Stride|Step)\b/.test(baseText)) reasons.push("action-language-present");

    for (const sentence of descriptionSentences) {
        if (sentence === saveSentence) continue;
        if (OTHER_SENTENCE_MECHANIC.test(sentence)) {
            reasons.push("additional-mechanical-sentence");
            break;
        }
    }

    return {
        complete: reasons.length === 0,
        reasons: [...new Set(reasons)],
        evidence: { baseText, saveSentence, statistic }
    };
}
