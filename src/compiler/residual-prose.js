import { ESCAPE_DC_PATTERN, parseConditionLists } from "./condition-list-lifetime.js";
import { RECURRING_NEGATION } from "./recurring-save-lifetime.js";
import { classifyManualSemantics } from "./outcome-semantics.js";
import { isNoteContinuation } from "./note-effects.js";

const NAMED_CONDITION_GRANT = /\b(?:is|are|becomes?|becoming|gains?|falls?|knocked)\s+(?:also\s+)?(?:knocked\s+)?(blinded|clumsy|confused|controlled|dazzled|deafened|doomed|drained|dying|enfeebled|fascinated|fatigued|fleeing|frightened|grabbed|immobilized|off-guard|paralyzed|petrified|prone|quickened|restrained|sickened|slowed|stunned|stupefied|unconscious|wounded)(?:\s+\d+)?\b/gi;

const HARMLESS_IMPRESSION = /^The (?:thought|belief|conviction|impression|memory|sensation)(?: of (?:a|an|the|your|its|their) [a-z'-]+(?: [a-z'-]+)?)? is (?:only|merely) a fleeting (?:notion|thought|impression) that (?:passes|fades) (?:quickly|harmlessly) without any effect on the (?:target|creature)\.$/i;

function harmlessImpression(text, outcome) {
    const damage = outcome?.damage;
    return HARMLESS_IMPRESSION.test(text)
        && damage?.mode === "none" && damage.multiplier === 0
        && (damage.sourceComponentIds?.length ?? 0) === 0
        && ["effects", "nativeEffects", "followUps", "decisions", "manualInstructions", "stateChanges"]
            .every(key => (outcome?.[key]?.length ?? 0) === 0)
        && outcome?.terminal == null;
}

const ATTITUDE_LINK = /@UUID\[Compendium\.pf2e\.conditionitems\.[^\]]+\]\{(Hostile|Unfriendly|Indifferent|Friendly|Helpful)\}/g;
const MECHANIC_SIGNALS = Object.freeze([
    ["save", /\b(?:save|saving throw)\b|@Check\[/i],
    ["damage", /\b(?:damage|hit points?|HP)\b|@Damage\[/i],
    ["condition", /\b(?:condition|@UUID\[Compendium\.pf2e\.conditionitems\.)/i],
    ["prone", /\bprone\b/i],
    ["kneeling", /\bforced to (?:its|their) knees\b/i],
    ["named-condition", new RegExp(NAMED_CONDITION_GRANT.source, "i")],
    ["listed-condition", { test: text => parseConditionLists(text).length > 0 }],
    ["duration", /\b(?:rounds?|minutes?|hours?|days?|weeks?|until|duration|sustain)\b/i],
    ["action", /\b(?:actions?|reactions?|Strike|Stride|Step|Fly|Leap|Interact|Escape)\b/i],
    ["movement", /\b(?:move|moved|drawn|pulled|pushed|teleport|feet|squares?)\b/i],
    // "… and moves toward the selected location …": the creature's own movement (behaviour a note may carry), not a push or pull.
    ["self-movement", /\b(?:moves|moving)\b/i],
    ["modifier", /\b(?:bonus|penalty|modifier|DC|weakness|resistance|immunity|immune)\b/i],
    ["choice", /\b(?:choose|choice|random|roll \[\[)\b/i],
    ["state", /\b(?:dies?|killed|decapitated|transformed?|petrified|afflicted|stage \d+)\b/i],
    ["timing", /\b(?:start|beginning|end|whenever|each time|first time|temporarily)\b/i],
    // "You are stunned 1 and the spell ends": the caster, not the save's target.
    // Also after a semicolon ("…; you regain Hit Points equal to half the damage the target takes.").
    ["caster-subject", /^(?:You|You're|You are|you|you're|you are)\b/]
]);

function clauses(text) {
    return String(text ?? "")
        .replace(/\s+/g, " ")
        .split(/(?<=[.!?;])\s+|\n+/)
        .map(value => value.trim())
        .filter(Boolean);
}

function effectMentioned(effect, text) {
    return text.includes(effect.raw)
        || new RegExp(`\\b${String(effect.name ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);
}

function nativeEffectMentioned(effect, text) {
    return text.includes(effect.sourceText)
        || text.includes(effect.uuid)
        || text.includes(effect.reference)
        || effect.outcomeRule?.claimText === text
        || (effect.outcomeRule?.claims ?? []).includes(text);
}

function unique(values) {
    return [...new Set(values)];
}

function provedInlinePersistentDamage(outcome, degree, proof) {
    return proof?.kind === 'inline-persistent-plus-structured'
        && proof.persistentType === 'bleed'
        && typeof proof.sourceFormula === 'string'
        && Array.isArray(proof.directComponentIds) && proof.directComponentIds.length > 0
        && proof.sourceText?.[degree] === outcome?.rawText
        && proof.byDegree?.[degree] != null
        && JSON.stringify(proof.byDegree[degree]) === JSON.stringify(outcome.damage);
}

function provedGeneratedSpeed(outcome, degree, proof, text) {
    return proof?.kind === 'degree-speed-penalties'
        && proof.sourceText?.[degree] === outcome?.rawText
        && JSON.stringify(proof.byDegree?.[degree]) === JSON.stringify(outcome.modifiers ?? [])
        && JSON.stringify(proof.conditionEffects?.[degree]) === JSON.stringify(
            (outcome.effects ?? []).map(effect => ({slug:effect.slug,value:effect.value,duration:effect.duration})))
        && (outcome.modifiers ?? []).some(modifier => modifier.claimText === text);
}

export function analyzeResidualProse(outcome, {degree, inlinePersistentProof, generatedSpeedProof, narrativeNouns, persistentComponentIds = null} = {}) {
    const results = [];
    const inlinePersistentClaimed = provedInlinePersistentDamage(outcome, degree, inlinePersistentProof);
    for (const text of clauses(outcome?.rawText)) {
        const compiled = [];
        let guided = classifyManualSemantics(text).map(instruction => instruction.kind);
        // An attitude link (Friendly, Helpful …) is an attitude, not a condition: it becomes a note, not a mechanic.
        const unlinked = text.replace(ATTITUDE_LINK, "$1");
        const signals = MECHANIC_SIGNALS.filter(([, pattern]) => pattern.test(unlinked)).map(([kind]) => kind);
        const effects = (outcome?.effects ?? []).filter(effect => effectMentioned(effect, text));
        const nativeEffects = (outcome?.nativeEffects ?? []).filter(effect => nativeEffectMentioned(effect, text));
        const nativeClauseClaimed = nativeEffects.some(effect => effect.outcomeRule?.claimText === text || (effect.outcomeRule?.claims ?? []).includes(text));
        const generatedSpeedClaimed = provedGeneratedSpeed(outcome, degree, generatedSpeedProof, text);
        const saveFollowUps = (outcome?.followUps ?? []).filter(followUp => followUp.kind === "save");
        const secondarySaves = /\b(?:save|saving throw)\b/i.test(text) || /@Check\[/i.test(text)
            ? saveFollowUps
            : [];
        const secondaryBranches = (outcome?.followUps ?? [])
            .filter(followUp => followUp.kind === "save")
            .flatMap(followUp => Object.values(followUp.outcomes ?? {}).filter(Boolean));
        const secondaryOutcome = secondaryBranches.find(branch =>
            branch.rawText && (branch.rawText.includes(text) || text.includes(branch.rawText))
        );
        const secondarySourceClaimed = saveFollowUps.some(followUp =>
            followUp.complete && followUp.rawText.includes(text)
        );

        // "The target resists being banished.": no effect.
        if (/^The target resists being [a-z]+\.$/.test(text)) compiled.push("no-effect");
        // "… and you are Stunned 1." given to the caster (outcome.casterConditions).
        if ((outcome?.casterConditions ?? []).some(entry => entry.sourceText === text)) { compiled.push("caster-condition"); guided = []; }
        // "… is your choice of {Clumsy 1}, {Drained 1}, or {Enfeebled 1} for 1 round.": the caster's pick among the row's conditions (outcome.conditionPick).
        if (outcome?.conditionPick?.sourceText === text) { compiled.push("condition-pick"); guided = []; }
        if (/\b(?:unaffected|no effect|nothing happens)\b/i.test(text)
            || harmlessImpression(text, outcome)) compiled.push("no-effect");
        if (/\bso afraid\b[^.!?]*\bmight (?:instantly )?die\b/i.test(text)) compiled.push("narrative-context");
        // "You can Dismiss the spell." inside a row: the cast's Dismiss (compileSaveDismissal reads the one sentence).
        if (/^You can Dismiss (?:the|this) spell\.$/.test(text)) { compiled.push("cast-dismissal"); guided = []; }
        // "After the spell ends, the target doesn't necessarily realize it was charmed unless …" / "If it doesn't realize you
        // charmed it, you could potentially convince it to continue being your friend via mundane means.": what happens after.
        if (/^(?:After|When) the spell ends, the target doesn't necessarily realize it was charmed\b[^.]*\.$|^If it doesn't realize you charmed it, you could potentially convince it to continue being your friend via mundane means\.$/.test(text)) {
            compiled.push("narrative-context"); guided = [];
        }
        // "The target is unaffected but thinks your spell was something harmless instead of charm, unless it identifies the spell.":
        // unaffected; what it believes about the spell is the GM's to play.
        if (/^The (?:target|creature) is unaffected but (?:thinks|believes) [^.]{3,120}?(?:, unless it identifies the spell)?\.$/i.test(text.replace(/\s+,/g, ","))
            // "The target is unaffected and realized you attempted to influence its reaction with magic.": what it knows afterward.
            || /^The (?:target|creature) is unaffected and realized you attempted to influence its reaction with magic\.$/.test(text)) {
            compiled.push("no-effect"); guided = guided.filter(kind => kind !== "conditional-effect");
        }
        // "The target believes every spirit it sees is an imminent threat. It's Stupefied 3 for 1 round.": what the target
        // believes, in a row whose conditions another clause states, narrates those conditions.
        if (/^(?:The target|The creature|It|They) (?:believes?|feels?|thinks?|is convinced)\b/.test(text) && !signals.length
            && classifyManualSemantics(text).length === 0 && (outcome?.effects ?? []).length > 0
            && (outcome.effects ?? []).every(effect => !effectMentioned(effect, text))) compiled.push("narrative-context");
        // "The creature is thrown off by your display." / "The creature fully believes your performance, leaving itself open.":
        // a short sentence about the target with no rule words at all, in a row whose conditions other clauses state.
        else if (/^(?:The target|The creature|It|They) (?:is|are|fully|becomes?)\b/.test(text) && text.length <= 90 && !signals.length
            && classifyManualSemantics(text).length === 0 && (outcome?.effects ?? []).length > 0
            && !/\d|@|\[\[|\b(?:can|can't|cannot|must|only|instead|loses?|gains?|may|unless|if|each|every|whenever|immune|more|less|half|double|until|while|takes?|any|all|no|not|immediately)\b/i.test(text)
            && !/\b(?:blinded|broken|clumsy|concealed|confused|controlled|dazzled|deafened|doomed|drained|dying|encumbered|enfeebled|fascinated|fatigued|fleeing|frightened|grabbed|hidden|immobilized|invisible|off-guard|flat-footed|paralyzed|petrified|prone|quickened|restrained|sickened|slowed|stunned|stupefied|unconscious|undetected|wounded|observed)\b/i.test(text)
            && (outcome.effects ?? []).every(effect => !effectMentioned(effect, text))) compiled.push("narrative-context");
        // "The creature uses its remaining actions to watch you in awe.": the GM's note on the row (outcome.rowNotes).
        const rowNoteClaimed = (outcome?.rowNotes ?? []).some(note => note.sourceText === text);
        // A note Effect carries this clause (behaviour, attitude, a choice): see note-effects.js.
        // (A note that carries its whole row claims every clause of it: "Soul form".)
        const noteClaimed = (outcome?.noteEffects ?? []).some(note => note.sourceText === text || (note.sourceTexts ?? []).includes(text)
            || (note.claimsRow === true && String(note.sourceText ?? "").includes(text)));
        if (noteClaimed) { compiled.push("note-effect"); guided = []; }
        // "If it has actions left, it can act normally.": normal play after the row's note (the caster's chosen action), no rule of its own.
        if (!noteClaimed && /^If it has (?:any )?actions left, it can act normally\.$/.test(text) && (outcome?.noteEffects ?? []).length) { compiled.push("restatement"); guided = []; }
        if (rowNoteClaimed) { compiled.push("gm-row-note"); guided = guided.filter(kind => kind !== "action-restriction"); }
        // (Sent home "if you're on your home plane and the creature is not": the condition is the GM's, in the note.)
        if ((outcome?.rowNotes ?? []).some(note => note.sourceText === text && note.kind === "sent-home")) guided = guided.filter(kind => kind !== "conditional-effect");
        // The caster's Reposition (movement), or a breakable thing's AC and Hit Points ending the spell (not damage): the GM's row note.
        const rowNoteKinds = new Set((outcome?.rowNotes ?? []).filter(note => note.sourceText === text).map(note => note.kind));
        if (rowNoteKinds.has("breakable") || rowNoteKinds.has("fall-rider") || rowNoteKinds.has("reduced-to-ashes")) guided = guided.filter(kind => kind !== "conditional-effect");
        // "It then remains dazzled and off-guard until the start of your turn.": conditions an earlier row states, restated.
        const remainsClaimed = (outcome?.effects ?? []).some(effect => effect.remainsSourceText === text);
        if (remainsClaimed) compiled.push("condition");
        // "It then takes the effects of a failure.": the failure row's effects, carried.
        if (outcome?.thenFailureText === text) compiled.push("outcome-inheritance");
        // A PF2e Effect link the text's own modifier replaced.
        if ((outcome?.replacedLinks ?? []).includes(text.trim())) compiled.push("replaced-link");
        // (An exception the row adds, "As failure, except the creature can't attempt to enter or leave again this turn.", is the row's own rule:
        // left for its whole-row note, not claimed as plain inheritance.)
        if (/^As (?:a )?(?:critical success|success|critical failure|failure)\b/i.test(text)
            && !(/^As (?:success|failure), except (?!the duration\b)/i.test(text) && (outcome?.effects ?? []).length === 0 && (outcome?.damage?.mode ?? "none") === "none")
            // ("As failure, and the creature immediately attacks itself.": the added behaviour is the row's note, not plain inheritance.)
            && !/^As (?:success|failure), and the creature immediately attacks itself\.$/i.test(text)) compiled.push("outcome-inheritance");
        if (/^As (?:success|failure), and the creature immediately attacks itself\.$/i.test(text) && !noteClaimed) guided.push("action-restriction");
        // "As success, but the effect lasts 1 minute.": the inherited conditions with the stated duration.
        const inheritedDuration = outcome?.inheritedDurationText === text;
        if (inheritedDuration) compiled.push("inherited-duration");
        // "… takes full damage, as well as full persistent damage.": only when the row deals persistent damage (a structured persistent
        // entry, a persistent formula, or the persistent-damage condition). (Known only when the plan's entries are passed.)
        const dealsPersistent = () => {
            const damage = outcome?.damage ?? {};
            const ids = damage.mode === "mixed" ? damage.shared?.sourceComponentIds : damage.sourceComponentIds;
            return (ids ?? []).some(id => persistentComponentIds.includes(id)) || JSON.stringify(damage.formulas ?? []).includes("persistent")
                || (outcome?.effects ?? []).some(effect => effect.slug === "persistent-damage") || JSON.stringify(outcome?.nativeEffects ?? []).includes("persistent");
        };
        const unpaidPersistent = Array.isArray(persistentComponentIds)
            && /\b(?:full|double(?: the)?|and|as well as|takes?) persistent (?:[a-z]+ )?damage\b/i.test(text.replace(/\bno persistent (?:[a-z]+ )?damage\b/gi, "")) && !dealsPersistent();
        const combinedDamage = outcome?.damage?.mode === 'mixed' && outcome.damage.rollScope === 'combined';
        const inlinePersistentProse = inlinePersistentProof?.kind === 'inline-persistent-plus-structured'
            && /\bpersistent bleed damage\b/i.test(text);
        if (outcome?.damage?.mode !== "none" && (/\bdamage\b/i.test(text) || /@Damage\[/i.test(text))
            && (!inlinePersistentProse && !combinedDamage
                || inlinePersistentClaimed && text === outcome.rawText) && !unpaidPersistent) compiled.push("damage");
        if (effects.length) compiled.push(...effects.map(effect => effect.whileCondition ? "linked-condition" : "condition"));
        if (nativeEffects.length) compiled.push("native-spell-effect");
        if (generatedSpeedClaimed) compiled.push('generated-speed-penalty');
        if (effects.some(effect => effect.endsWhen)) compiled.push("condition-expiration");
        // The exact recurring-save sentence proved for a compiled condition.
        // Forced movement read from the row, and a condition that outlasts the spell until rest.
        const movementClaimed = outcome?.forcedMovement?.sourceText === text || (outcome?.forcedMovement?.claims ?? []).includes(text);
        // A fall's damage read from the row ("The target falls 20 feet through the void before reappearing.").
        const fallingClaimed = outcome?.fallingText === text;
        if (fallingClaimed) compiled.push("falling-damage");
        if (movementClaimed) { compiled.push("forced-movement"); guided = guided.filter(kind => kind !== "forced-movement"); }
        // The optional move's refusal ("if you attempt to move the target to a hazardous location …, it can fall prone to avoid moving") is its own.
        if (movementClaimed && outcome.forcedMovement.optional === true && (outcome.forcedMovement.avoid || outcome.forcedMovement.casterDirection === true)) guided = guided.filter(kind => !["conditional-effect", "gm-choice"].includes(kind));
        const restClaimed = (outcome?.effects ?? []).some(effect => effect.restSourceText === text);
        if (restClaimed) compiled.push("rest-lifetime");
        // A recurring save on a condition, or on a native Effect whose proof states the claimed sentence.
        const recurringClaimed = (outcome?.effects ?? []).some(effect => effect.recurringSave?.sourceText === text)
            || nativeEffects.some(effect => effect.outcomeRule?.recurringSave && (effect.outcomeRule.claims ?? []).includes(text));
        if (recurringClaimed) compiled.push("recurring-save");
        // A condition chosen by a roll ("either clumsy 1, enfeebled 1, or stupefied 1 …, depending on the result of the d4").
        const rolledChoiceClaimed = (outcome?.conditionRollClaims ?? []).includes(text);
        if (rolledChoiceClaimed) compiled.push("rolled-condition-choice");
        // The caster's choice between two conditions the row grants (asked on the card).
        const casterConditionClaimed = (outcome?.conditionChoiceClaims ?? []).includes(text);
        if (casterConditionClaimed) compiled.push("caster-condition-choice");
        // "If the target recovers from being Sickened, the persistent damage ends and the spell ends.": the row's persistent damage
        // is removed with that condition.
        // A clause the degree Speed-and-condition Effect proves ("… penalty to its Speeds (except for its swim Speed, if any) and becomes
        // Off-Guard.", "As failure, but the penalty to Speeds … is -15 feet."): its "if any" and feet are the Effect's.
        const speedConditionClaimed = nativeEffects.some(effect => effect.outcomeRule?.kind === "degree-speed-condition" && (effect.outcomeRule.claims ?? []).includes(text));
        if (speedConditionClaimed) guided = guided.filter(kind => kind !== "conditional-effect");
        const persistentEndClaimed = outcome?.persistentEndsWith?.sourceText === text;
        if (persistentEndClaimed) { compiled.push("condition-ended-persistent-damage"); guided = guided.filter(kind => kind !== "conditional-effect"); }
        const actionEndClaimed = (outcome?.effects ?? []).some(effect => effect.actionEndSourceText === text);
        // A drain whose rows heal the caster's pick (heal-back): the row's sentences are its Drained, heal and once-per sentences.
        const healBackClaimed = (outcome?.healBackClaims ?? []).includes(text);
        if (healBackClaimed) { compiled.push("heal-back"); guided = []; }
        // The critical-success row's own temporary immunity (compiled as the plan's immunity for that result).
        if (outcome?.rowImmunityText === text) { compiled.push("row-temporary-immunity"); guided = guided.filter(kind => kind !== "temporary-immunity"); }
        if (actionEndClaimed) { compiled.push("action-ended-condition"); guided = guided.filter(kind => kind !== "conditional-effect"); }
        if (outcome?.damage?.mode === "none" && /\btakes? no damage\b/i.test(text)) compiled.push("no-damage");
        // Compiled affliction handoff: the exact sentence naming the stage
        // block and starting stage; progression itself is delegated.
        const afflictionClaimed = outcome?.affliction?.sourceText === text;
        if (afflictionClaimed) compiled.push("affliction-handoff");
        const floorClaimed = (outcome?.conditionFloor?.sourceTexts ?? []).includes(text);
        if (floorClaimed) {
            compiled.push("condition-floor");
            guided = guided.filter(kind => !["condition-floor", "conditional-effect"].includes(kind));
        }
        // "…, but if it spends an action to end the condition, it succeeds automatically.": the degree-object Effect's own
        // addendum on the condition it grants says this (Overstuff).
        if (nativeEffects.some(effect => effect.outcomeRule?.kind === "degree-object-effect" && effect.outcomeRule.claimText === text)) guided = guided.filter(kind => kind !== "conditional-effect");
        // "If it's asleep, it wakes up and is Paralyzed for 1 round.": a condition gated on the creature being asleep.
        const gateClaimed = (outcome?.effects ?? []).some(effect => ["asleep", "gm-question"].includes(effect.gate?.kind) && effect.gate.sourceText === text);
        if (gateClaimed) { compiled.push("asleep-gate"); guided = guided.filter(kind => kind !== "conditional-effect"); }
        if ((outcome?.casterConditions ?? []).some(entry => entry.sourceText === text)) compiled.push("caster-condition");
        const afflictionExtra = outcome?.afflictionImmunity?.sourceText === text || outcome?.afflictionSavePenalty?.sourceText === text;
        if (afflictionExtra) compiled.push("affliction-immunity-or-penalty");
        const afflictionHeading = outcome?.afflictionHeading === text;
        if (afflictionHeading) compiled.push("affliction-heading");
        const recurringNegated = outcome?.noRecurringSave === true && RECURRING_NEGATION.test(text)
            && !(outcome?.effects ?? []).some(effect => effect.recurringSave);
        if (recurringNegated) compiled.push("no-recurring-save");
        if (outcome?.terminal && /\b(?:dies?|killed)\b/i.test(text)) compiled.push("terminal");
        if (secondarySaves.length) compiled.push("secondary-save");
        if (secondaryOutcome || secondarySourceClaimed) compiled.push("secondary-outcome");
        if (!secondaryOutcome && secondaryBranches.some(branch => branch.terminal)
            && /\b(?:fails?|critical failure)\b[^.!?;]*\b(?:dies?|killed)\b/i.test(text)) {
            compiled.push("secondary-outcome");
        }
        if (compiled.includes("secondary-save")) guided = guided.filter(kind => kind !== "secondary-save");
        if (compiled.includes("secondary-outcome")
            && !secondaryOutcome?.manualInstructions?.length) {
            guided = guided.filter(kind => kind !== "conditional-effect");
        }

        // A clause that is only the linked Effect's own link: its name ("Spell Effect: Circle of Weakness") isn't a rule.
        const effectLinkOnly = nativeEffects.length > 0 && /^@UUID\[[^\]]+\]\{[^}]+\}\.?$/.test(text);
        // The two sentence rules above (the cast's Dismiss; what happens after a charm) state no mechanic of their own.
        const sentenceClaimed = /^You can Dismiss (?:the|this) spell\.$/.test(text)
            || /^(?:After|When) the spell ends, the target doesn't necessarily realize it was charmed\b[^.]*\.$|^If it doesn't realize you charmed it, you could potentially convince it to continue being your friend via mundane means\.$/.test(text);
        const unexplainedSignals = signals.filter(signal => {
            if (rolledChoiceClaimed || effectLinkOnly || sentenceClaimed || persistentEndClaimed) return false;
            if (speedConditionClaimed && ["movement", "modifier", "duration", "timing", "condition", "listed-condition", "named-condition"].includes(signal)) return false;
            // A note's continuation ("This is enough to track the creature, but not pinpoint their exact square …", the caster's limit
            // on active instances) says only what the note's rule does or how many there can be.
            if (noteClaimed && isNoteContinuation(text) && ["movement", "caster-subject", "action"].includes(signal)) return false;
            if (casterConditionClaimed && signal === "choice") return false;
            // A row's damage and its trait-limited penalty (the note's generated modifier).
            if ((outcome?.noteEffects ?? []).some(note => note.alongDamage && note.sourceText === text) && ["modifier", "duration"].includes(signal)) return false;
            if (/^The (?:target|creature) is unaffected and realized you attempted to influence its reaction with magic\.$/.test(text) && signal === "action") return false;
            // ("If it has actions left, it can act normally." after the row's note: normal play.)
            if (compiled.includes("restatement") && signal === "action") return false;
            if ((outcome?.noteEffects ?? []).some(note => note.claimsRow === true && String(note.sourceText ?? "").includes(text))
                && (!["damage", "save"].includes(signal) || (signal === "damage" && (outcome?.noteEffects ?? []).some(note => (note.otherSpellsDamage || note.triggeredDamage) && note.sourceText.includes(text))
                    && (outcome?.damage?.mode ?? "none") === "none"))) return false;
            // ("The field partially forms with 10 Hit Points instead of 40.": an object's Hit Points the note carries at the cast rank, no damage dealt.)
            if (signal === "damage" && !/\bdamage\b/i.test(text) && (outcome?.noteEffects ?? []).some(note => note.claimsRow === true && note.rankAmount && String(note.sourceText ?? "").includes(text))) return false;
            // A condition the creature gets "each time it damages you": a note carries it, the cast applies nothing.
            if ((outcome?.noteEffects ?? []).some(note => (note.triggeredCondition || note.perceivedCondition) && note.sourceText === text) && ["condition", "listed-condition", "named-condition", "timing"].includes(signal)) return false;
            // Movement the GM plays out (a Stride's first 5 feet): its note carries the clause.
            if ((outcome?.noteEffects ?? []).some(note => note.gmPlays && (note.sourceTexts ?? [note.sourceText]).includes(text)) && ["movement", "action", "timing"].includes(signal)) return false;
            if ((outcome?.noteEffects ?? []).some(note => note.gmPlays && note.label === "Penalty against the other target" && note.sourceText === text) && ["modifier", "duration"].includes(signal)) return false;
            if ((outcome?.noteEffects ?? []).some(note => note.gmPlays && note.label === "Reveal the truth" && (note.sourceTexts ?? []).includes(text))
                && ["action", "choice", "condition", "listed-condition", "named-condition", "damage"].includes(signal)) return false;
            // Croak Voice: the row's note carries its flat check and the creature's own save control (endSave), or its absence on a critical failure.
            if ((outcome?.noteEffects ?? []).some(note => note.label === "Hoarse voice" && note.claimsRow === true && String(note.sourceText ?? "").includes(text)
                && (note.endSave || note.triggeredDamage?.multiplier === 2)) && signal === "save") return false;
            // A flat check the GM plays ("… must succeed at a DC 5 flat check or the action is disrupted"): its note carries it.
            if ((outcome?.noteEffects ?? []).some(note => note.gmPlays && note.label === "Concentrate actions" && note.sourceText === text) && ["save", "modifier"].includes(signal)) return false;
            // A proved Effect sentence: "weakness 1 to the chosen damage type" names a damage type, not damage dealt; "until
            // they Escape" is the end of the condition the Effect grants (proved removable on its own).
            if (nativeClauseClaimed && signal === "damage" && /\bweakness \d+ to\b/.test(text) && !/\btakes?\b/.test(text)) return false;
            // "gains a weakness to spirit damage equal to half your level": a weakness, not damage dealt.
            if (nativeClauseClaimed && signal === "damage" && /\bweakness to [a-z]+ damage equal to (?:half )?your level\b/.test(text) && !/\btakes?\b|\d+d\d+|@Damage/.test(text)) return false;
            // "a –1 circumstance penalty to attack rolls and damage rolls against you": a penalty on rolls, not damage dealt.
            if (nativeClauseClaimed && signal === "damage" && /\bpenalty to attack (?:rolls )?and damage rolls\b/.test(text) && !/\d+d\d+|@Damage/.test(text)) return false;
            if (nativeClauseClaimed && signal === "action" && nativeEffects.some(effect => effect.outcomeRule?.kind === "degree-object-effect")
                && /, but if it spends an action to end the condition, it succeeds automatically\.$/.test(text)) return false;
            if (nativeClauseClaimed && signal === "action" && /\buntil (?:they|it) \[\[\/act escape\]\]\.$/.test(text)
                && !/\[\[\/act (?!escape\]\])/.test(text)) return false;
            // "It can attempt to Escape against your spell DC to remove the penalty": a proved Escape ending the Effect.
            // "… penalty to the triggering Strike's attack roll.": the degree Effect's modifier (the Strike is the roll it modifies).
            if (nativeClauseClaimed && signal === "action" && nativeEffects.some(effect => effect.outcomeRule?.kind === "degree-choice")
                && /^The (?:creature|target) takes a [–−-]\d+ (?:circumstance|status) penalty to the triggering Strike's attack roll\.$/.test(text)) return false;
            if (nativeClauseClaimed && signal === "action" && /^It can attempt to (?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Escape\}|\[\[\/act escape\]\]|Escape) against your spell DC(?: to remove the penalty(?: and the [a-z-]+ condition)?)?\.$/.test(text)) return false;
            if ((outcome?.healBackClaims ?? []).includes(text)) return false;
            // The caster's optional move the target can refuse by falling Prone ("You can move the target up to 5 feet; it can choose to fall
            // Prone to avoid moving."): the move's own clauses (the Prone it gives on a critical failure is the row's condition).
            if (outcome?.forcedMovement?.optional === true && (outcome.forcedMovement.claims ?? []).includes(text)
                && ["caster-subject", "movement", "choice", "condition", "prone", "named-condition", "listed-condition"].includes(signal)) return false;
            // (A fall rider's "your spell DC" is the caster's DC in the GM's note.)
            if (rowNoteKinds.has("fall-rider") && ["caster-subject", "movement", "damage", "save", "action", "dc", "modifier"].includes(signal)) return false;
            // "You are Stunned 1 and the spell ends.": the caster's condition and the end of the spell (the row's caster fields).
            if ((outcome?.casterConditions ?? []).some(entry => entry.sourceText === text) && ["caster-subject", "condition", "named-condition", "listed-condition", "duration"].includes(signal)) return false;
            if (outcome?.conditionPick?.sourceText === text && ["caster-subject", "choice", "condition", "named-condition", "listed-condition", "duration", "damage"].includes(signal)) return false;
            if (signal === "caster-subject") return true;
            if (inheritedDuration && ["duration", "timing"].includes(signal)) return false;
            if (rowNoteClaimed && ["action"].includes(signal)) return false;
            if (rowNoteKinds.has("reposition") && signal === "movement") return false;
            // ("… can't return by any means to the plane it's banished from for 1 week.": the banished note's own time.)
            if (rowNoteKinds.has("banished") && signal === "duration") return false;
            if (rowNoteKinds.has("affliction-benefit") && signal === "save") return false;
            if (rowNoteKinds.has("breakable") && ["damage", "modifier"].includes(signal) && !/\d+d\d+|@Damage|\b(?:bonus|penalty)\b/.test(text)) return false;
            // A whole-row note carrying a flat check the creature rolls when it acts ("must succeed at a @Check[flat|dc:11] to Cast a Spell …").
            if (noteClaimed && ["save", "modifier"].includes(signal) && /\bmust succeed at a @Check\[flat\|dc:\d+\] (?:to|when)\b/.test(text)
                && (outcome?.noteEffects ?? []).some(note => note.flatCheckOnAct === true && String(note.sourceText ?? "").includes(text))) return false;
            // A note whose end-of-turn save shortens it ("… attempt a new Will save to reduce the remaining duration by 1 round …").
            if (noteClaimed && ["save", "duration", "timing"].includes(signal) && (outcome?.noteEffects ?? []).some(note => note.recurringSave && String(note.sourceText ?? "").includes(text))) return false;
            // A behaviour note tied to the row's condition ("can't end a move action within 10 feet of …"): a restriction, not forced movement.
            if (noteClaimed && ["movement", "condition", "named-condition", "listed-condition"].includes(signal)
                && (outcome?.noteEffects ?? []).some(note => note.restriction === true && note.sourceText === text)) return false;
            if (noteClaimed && !["damage", "condition", "named-condition", "listed-condition", "prone", "kneeling", "save", "state", "movement"].includes(signal)) return false;
            // "can't perceive anything beyond a range of 10 feet": a perception range, not movement.
            if (noteClaimed && signal === "movement" && /\bbeyond a range of \d+ feet\b/.test(text) && !/\b(?:move|moved|pulled|pushed|teleport)\b/.test(text)) return false;
            if (remainsClaimed && ["duration", "timing", "condition", "named-condition", "listed-condition"].includes(signal)) return false;
            if (movementClaimed && ["movement"].includes(signal)) return false;
            // "If the creature moves to outside area, they can spend 1 action to …": the compiled removal action's own precondition.
            if ((movementClaimed || rowNoteClaimed || actionEndClaimed) && signal === "self-movement") return false;
            // (A gated condition that follows the row's own push — "If the target is pushed into an obstacle …" — names that push.)
            if (gateClaimed && signal === "movement" && /^If the target is pushed into an obstacle or structure that's (?:Large|Huge) or larger, /.test(text)) return false;
            if (fallingClaimed && ["movement", "damage"].includes(signal)) return false;
            if (restClaimed && ["duration", "state", "timing", "condition"].includes(signal)) return false;
            if (afflictionClaimed && signal === "state") return false;
            if (floorClaimed) return false;
            if (outcome?.rowImmunityText === text && ["duration", "modifier", "timing"].includes(signal)) return false;
            if (afflictionExtra && ["duration", "modifier"].includes(signal)) return false;
            if (signal === "save") return !compiled.includes("secondary-save") && !recurringClaimed && !recurringNegated;
            if (signal === "damage" && compiled.includes("no-damage")) return false;
            if (actionEndClaimed && ["action", "timing", "condition", "named-condition", "listed-condition"].includes(signal)) return false;
            if ((recurringClaimed || recurringNegated) && ["timing", "duration", "action"].includes(signal)) return false;
            if (signal === "damage") return !compiled.includes("damage") && !compiled.includes("terminal")
                && !compiled.includes("secondary-outcome");
            if ((nativeClauseClaimed && ["duration", "modifier", "timing"].includes(signal))
                || (generatedSpeedClaimed && ["duration", "modifier", "timing", "movement"].includes(signal))) return false;
            if (signal === "condition") return !compiled.includes("condition") && !compiled.includes("linked-condition")
                && !compiled.includes("secondary-outcome");
            // Prone from the outcome itself, or from a claimed follow-up save's branch ("… or fall Prone").
            if (signal === "prone" || signal === "kneeling") return !effects.some(effect => effect.slug === "prone")
                && !(compiled.includes("secondary-outcome") && secondaryBranches.some(branch => (branch.effects ?? []).some(effect => effect.slug === "prone")));
            if (signal === "named-condition") return [...text.matchAll(NAMED_CONDITION_GRANT)]
                .some(match => !effects.some(effect => effect.slug === match[1].toLowerCase()));
            // Every coordinated grant item needs its own compiled condition,
            // including unlinked continuations such as "and enfeebled 2".
            if (signal === "listed-condition") return !compiled.includes("secondary-outcome") && parseConditionLists(text)
                .some(item => !effects.some(effect => effect.slug === item.slug && (item.value == null || effect.value === item.value)));
            if (signal === "duration") return !effects.some(effect => effect.duration || effect.whileCondition || effect.endsWhen)
                && !compiled.includes("secondary-outcome");
            // (What a death does to the body: the GM's row note — Incendiary Ashes.)
            if (signal === "state" && rowNoteKinds.has("reduced-to-ashes")) return false;
            if (signal === "state") return !compiled.includes("terminal") && !compiled.includes("secondary-outcome")
                && !/\bmight (?:instantly )?die\b/i.test(text) && guided.length === 0;
            if (signal === "timing" && compiled.includes("secondary-outcome")) return false;
            if (signal === "timing" && compiled.includes("condition-expiration")) return false;
            if (signal === "timing") {
                // Claim only the exact boundary text already parsed for this
                // condition, not other timing instructions in the same clause.
                const remainder = effects.reduce((rest, effect) => effect.duration?.sourceText
                    ? rest.replace(effect.duration.sourceText, "") : rest, text);
                if (!MECHANIC_SIGNALS.find(([kind]) => kind === "timing")[1].test(remainder)) return false;
            }
            // "(the DC is your spell DC)" is the compiled Escape lifetime's DC.
            if (signal === "modifier" && effects.some(effect =>
                (Array.isArray(effect.endsWhen) ? effect.endsWhen : []).some(event => event.event === "escape" && event.dc === "spell"))
                && !MECHANIC_SIGNALS.find(([kind]) => kind === "modifier")[1].test(text.replace(ESCAPE_DC_PATTERN, ""))) return false;
            if (signal === "action" && effects.some(effect =>
                (Array.isArray(effect.endsWhen) ? effect.endsWhen : [effect.endsWhen]).filter(Boolean)
                    .some(event => ["escape", "action", "used", "expended", "discharged"].includes(event.event)))) return false;
            if (signal === "movement" && effects.some(effect =>
                (Array.isArray(effect.endsWhen) ? effect.endsWhen : [effect.endsWhen]).filter(Boolean)
                    .some(event => event.event === "leave-area"))) return false;
            return guided.length === 0;
        });
        const accounted = compiled.length > 0 || guided.length > 0;

        results.push({
            text,
            status: unexplainedSignals.length > 0 || !accounted ? "residual" : guided.length > 0 ? "guided" : "compiled",
            compiledClaims: unique(compiled),
            guidedClaims: unique(guided),
            unexplainedSignals: unique(unexplainedSignals)
        });
    }

    // Narrative description: a sentence about the spell's own described
    // vehicle ("A tiny, bone-white moth emerges…" → "The moth lands on the
    // target…") with no mechanic signal at all, beside a compiled rule in the
    // same outcome. Anything not introduced by the spell stays residual.
    const vehicles = new Set((narrativeNouns ?? []).map(noun => noun.toLowerCase()));
    if (vehicles.size && results.some(result => result.status === "compiled")) {
        for (const result of results) {
            if (result.status !== "residual" || result.compiledClaims.length || result.guidedClaims.length
                || result.unexplainedSignals.length || MECHANIC_SIGNALS.some(([, pattern]) => pattern.test(result.text))) continue;
            const subject = /^The ([a-z'-]+)\b/i.exec(result.text)?.[1]?.toLowerCase();
            if (!subject || ["target", "creature", "spell", "effect", "caster"].includes(subject) || !vehicles.has(subject)
                || /\b(?:you|your|\d)\b/i.test(result.text)) continue;
            result.status = "compiled";
            result.compiledClaims = ["narrative-description"];
        }
    }
    const residualClauses = results.filter(result => result.status === "residual");
    const guidedClauses = results.filter(result => result.status === "guided");
    return {
        complete: residualClauses.length === 0,
        fullyCompiled: residualClauses.length === 0 && guidedClauses.length === 0,
        clauseCount: results.length,
        compiledClauseCount: results.filter(result => result.status === "compiled").length,
        guidedClauseCount: guidedClauses.length,
        residualClauseCount: residualClauses.length,
        clauses: results
    };
}
