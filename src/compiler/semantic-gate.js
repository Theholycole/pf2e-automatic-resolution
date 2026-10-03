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
    "\\bunaffected\\b",
    // Plain condition grants: a verb or any PF2e condition name.
    "\\bbecom(?:e|es|ing)\\b",
    "\\b(?:gains?|receives?|loses?)\\b",
    "\\b(?:blinded|clumsy|confused|controlled|dazzled|deafened|doomed|drained|enfeebled|fascinated|fatigued|fleeing|frightened|grabbed|immobilized|off-guard|paralyzed|petrified|quickened|restrained|sickened|slowed|stunned|stupefied|unconscious|wounded)\\b",
    "\\blacks?\\b",
    "\\bjump(?:s|ed|ing)?\\b",
    // ("a temporary portal" is the spell's narration, not a rule.)
    "\\btemporary\\b(?!\\s+(?:portal|gateway|opening))",
    "\\bpersistent\\b",
    "\\bcondition\\b",
    "\\bheal(?:ing|s|ed)?\\b",
    "\\btemporary hit points?\\b",
    "\\bpush(?:ed|es)?\\b",
    // (Pulling energy, "pull life energy from another creature into yourself", moves no creature.)
    "\\bpull(?:ed|s)?\\b(?! (?:life )?energy\\b)",
    "\\bmove(?:s|d|ment)?\\b",
    "\\bspeeds?\\b",
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

    let saveSentence = basicSaveSentences[0] ?? damageSentences[0] ?? "";
    // "… that deal 4d4 force damage to all creatures in a 60-foot line. Creatures in the area must attempt a basic Reflex save.":
    // a bare save sentence right after the one damage sentence is that damage's save.
    const pairedDamage = basicSaveSentences.length === 1 && damageSentences.length === 1
        && /^(?:Creatures|Each creature) in the area must attempt a basic (?:Fortitude|Reflex|Will) save\.$/.test(saveSentence)
        && descriptionSentences[descriptionSentences.indexOf(saveSentence) - 1] === damageSentences[0] ? damageSentences[0] : null;
    // "This deals 3d4 void damage; the target must attempt a basic Fortitude save.": the item's one damage entry and its save, joined.
    const joined = /^This deals (\d+d\d+) ([a-z]+) damage; the target must attempt a basic (?:Fortitude|Reflex|Will) save\.$/.exec(saveSentence);
    const joinedDamage = joined && (adapted.damageComponents ?? []).length === 1 && !adapted.damageComponents[0].category
        && String(adapted.damageComponents[0].formula).replace(/\s+/g, "") === joined[1] && String(adapted.damageComponents[0].type).toLowerCase() === joined[2] ? joined : null;
    const statistic = saveSentence.match(BASIC_SAVE)?.[1]?.toLowerCase() ?? null;
    if (statistic && statistic !== adapted.defense.statistic) reasons.push("save-statistic-mismatch");
    if (saveSentence && !DAMAGE.test(saveSentence) && !pairedDamage) reasons.push("save-sentence-has-no-damage");
    // "2d10 piercing damage and 1 persistent bleed damage": a persistent damage entry the item has, which the basic save
    // scales like the rest of the roll. Any other "persistent" stays a signal.
    const statedPersistent = (adapted.damageComponents ?? []).filter(component => component.category === "persistent")
        .reduce((text, component) => text.replace(new RegExp(String.raw`\b${String(component.formula).replace(/\s+/g, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} persistent ${component.type} damage\b`, "i"),
            `${component.formula} ${component.type} damage`), pairedDamage ? baseText.replace(saveSentence, "") : joinedDamage ? baseText.replace(saveSentence, `This deals ${joinedDamage[1]} ${joinedDamage[2]} damage.`) : baseText);
    // ", depending on its basic Fortitude save" is the save itself; "living" is the Target's own word when it says "living creature(s)".
    const livingTarget = /\bliving creatures?\b/i.test(String(adapted.targeting?.target ?? ""));
    const signalText = statedPersistent.replace(/, depending on (?:its|their|the target's) basic (?:Fortitude|Reflex|Will) save\b/gi, "")
        .replace(livingTarget ? /\bliving\b/gi : /(?!)/, "");
    if (UNCOMPILED_MECHANIC.test(signalText)) reasons.push("uncompiled-mechanic-signal");
    if (/\b(?:Fly|Leap|Stride|Step)\b/.test(baseText)) reasons.push("action-language-present");

    for (const sentence of descriptionSentences) {
        if (sentence === saveSentence || sentence === pairedDamage) continue;
        // "You echo a jarring hymn that only creatures in the area can hear.": who notices the spell, not a rule.
        // "You accelerate the processes of decay in the area.": narration naming the area, nothing more.
        // ("You exhale toxic mold spores that fill the area.": the same.)
        const narration = /^You [a-z' ,]+ (?:in|that fills?) the area\.$/.test(sentence) ? sentence.replace(/ (?:in|that fills?) the area\.$/, ".") : sentence;
        if (OTHER_SENTENCE_MECHANIC.test(narration.replace(/\bthat only creatures in the area can (?:hear|see)\b/i, ""))) {
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
