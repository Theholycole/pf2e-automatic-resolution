// Note Effects (user decision): a row clause the module can't carry out mechanically — behaviour, attitude, a GM or player
// choice, what a creature perceives — becomes a rule-less Effect on the creature that says what to do, lasting as the clause
// (or the spell) says. Mechanical rules never become notes: a clause with unread damage, conditions, saves, movement or other
// automatable rules stays unaccounted.
import { compileEffectDuration } from "./duration-compiler.js";
import { htmlToPlainText } from "./description-parser.js";

// Classifier kinds a note may carry, and the ones that mean an automatable rule was missed.
const NOTE_KINDS = new Set(["attitude-or-hostility", "action-restriction", "gm-choice", "perception-or-illusion", "conditional-effect"]);
export const NOTE_MANUAL_KINDS = NOTE_KINDS;
const MECHANICAL_SIGNALS = new Set(["damage", "condition", "named-condition", "listed-condition", "prone", "kneeling", "save", "state", "movement"]);
// "… a -2 status penalty to checks made during its reactions …": a penalty PF2e can't scope to reactions.
// (Also "… a -2 status penalty to Deception checks to deceive or mislead you": only against the caster, the GM's — Talking Corpse.)
const UNSCOPED_PENALTY = /\bpenalty to checks made during its reactions\b|\bpenalty to Deception checks to deceive or mislead you\b/i;
// Behaviour the classifier doesn't name: "treats no other creature as an ally", "must use a single action to do as you command",
// "must spend the first action on its next turn to …", "can't Delay or take any reactions until …".
// (Roaring Applause: "The applause is so involved that it has the manipulate trait." / "This triggers reactions based on the manipulate trait at
// the start of the target's turn." — the GM's reactions.)
const BEHAVIOUR = /\bThe [a-z]+ is so involved that it has the manipulate trait\b|\bThis triggers reactions based on the manipulate trait at the start of the target's turn\b|\bimmediately attacks itself\b|\btreats no other creature as an ally\b|\bmust (?:use|spend) (?:a single action|the first action|all its actions)\b|\bcan't Delay\b|\b(?:vitality|healing) effects heal it only half as much as normal\b|\bmust hold its breath or suffocate\b|^For the duration, the creature is suffocating\.$/i;

const LABELS = [
    [/^If you use (?:a )?hostile actions? against the target, the spell ends\.$/i, "Ends if the caster is hostile"],
    [/\battitude\b|\b(?:Friendly|Helpful)\b|\bthe target is (?:friendly|helpful)\b/i, "Attitude"],
    [/\bhostile actions?\b/i, "No hostile actions against the caster"],
    [/\bcan't Delay\b/i, "No Delay or reactions"],
    [/\bcan't (?:use|take) (?:any )?reactions\b|\bduring its reactions\b/i, "Reactions"],
    [/\bmust (?:use|spend)\b[^.]*\bactions?\b/i, "Actions on its next turn"],
    [/\bno other creature as an ally\b|\bas its allies\b/i, "No allies"],
    [/\bheal it only half as much\b/i, "Healing halved"],
    [/\bsuffocat/i, "Suffocation"]
];

function noteLabel(text) {
    return LABELS.find(([pattern]) => pattern.test(text))?.[1] ?? "GM note";
}

/** How long a note lasts: its own words ("for 3 rounds", "until the end of your turn", "on its next turn"), else the spell's. */
export function noteDuration(text, lifecycle) {
    const own = compileEffectDuration({ kind: "condition", slug: "note", name: "Note" }, text, lifecycle)?.duration;
    if (own && own.mode === "fixed") return own;
    if (/\bon its next turn\b/i.test(text)) return { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "on its next turn" };
    const spec = lifecycle?.durationSpec;
    if (spec && ["fixed", "turn-boundary"].includes(spec.mode) && Number.isInteger(spec.value) && spec.unit)
        return { mode: "fixed", value: spec.value, unit: spec.unit, expiry: spec.expiry ?? "turn-start", anchor: spec.anchor ?? "effect-start", offset: spec.offset ?? 0, sourceText: spec.raw ?? "the spell's duration" };
    if (spec?.mode === "sustained" && spec.maximum?.mode === "fixed")
        return { mode: "fixed", value: spec.maximum.value, unit: spec.maximum.unit, expiry: "turn-start", anchor: "effect-start", offset: 0, sustained: true, sourceText: spec.raw ?? "sustained" };
    // An unlimited spell (Sudden Recollection, Rewrite Memory): the note lasts until the GM ends it.
    if (spec?.mode === "unlimited") return { mode: "unlimited", sourceText: spec.raw ?? "unlimited" };
    return null;
}

// Clauses that only continue the note before them: "This is enough to track the creature, but not pinpoint their exact square (…)."
// and the caster's limit on active instances, "You can set a number of zenith stars equal to your Wisdom modifier;" / "if you exceed
// this number, your oldest zenith star is automatically Dismissed."
const NOTE_CONTINUATIONS = [
    // "This Strike doesn't give the creature a flat check to recover from the confusion." (after "… immediately attacks itself.")
    /^This Strike doesn't give the creature a flat check to recover from the confusion\.$/,
    /^This is enough to [a-z' ]{3,60}, but not [^.@\d]{5,120}\.$/,
    /^You can (?:set|have|maintain) a number of [a-z' ]{3,40} equal to your (?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) modifier;$/,
    /^if you exceed this number, your oldest [a-z' ]{3,40} is automatically Dismissed\.$/
];
export const isNoteContinuation = text => NOTE_CONTINUATIONS.some(pattern => pattern.test(text));
export const NOTE_INSTANCE_LIMIT_DISMISSAL = /^if you exceed this number, your oldest [a-z' ]{3,40} is automatically Dismissed\.$/;

/** The clauses of one row's coverage that become notes: returns [{label, text, sourceText, duration}]. */
export function selectNoteClauses(coverage, lifecycle, rowDuration = null) {
    const notes = [];
    let previous = null;
    for (const clause of coverage?.clauses ?? []) {
        if (clause.status === "compiled") { previous = null; continue; }
        if (previous && NOTE_CONTINUATIONS.some(pattern => pattern.test(clause.text))) {
            previous.text = `${previous.text} ${clause.text}`;
            previous.sourceTexts = [...(previous.sourceTexts ?? [previous.sourceText]), clause.text];
            continue;
        }
        previous = null;
        const guided = clause.guidedClaims ?? [];
        const signals = clause.unexplainedSignals ?? [];
        const behaviour = guided.some(kind => NOTE_KINDS.has(kind) && kind !== "conditional-effect") || UNSCOPED_PENALTY.test(clause.text) || BEHAVIOUR.test(clause.text);
        if (!behaviour) continue;
        if (guided.some(kind => !NOTE_KINDS.has(kind))) continue;
        if (signals.some(signal => MECHANICAL_SIGNALS.has(signal))) continue;
        if (signals.includes("modifier") && !UNSCOPED_PENALTY.test(clause.text)) continue;
        if (/@Damage\[|\b\d+d\d+\b/.test(clause.text)) continue;
        const duration = noteDuration(clause.text, lifecycle) ?? { pending: true };
        // The note says only what the GM does: the row's damage and conditions are applied already.
        const text = htmlToPlainText(clause.text).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")
            .replace(/^As (?:a )?(?:critical )?(?:success|failure), (?:but|and) (?:the (target|creature))/, (all, noun) => `The ${noun}`)
            // "The target takes full damage, and vitality effects heal it only half as much …": the note is the second clause.
            .replace(/^The (?:target|creature) takes (?:half|full|double) damage,? and ((?:vitality|healing) effects)/, (all, rest) => `${rest[0].toUpperCase()}${rest.slice(1)}`)
            .replace(/^(The (?:target|creature)) takes (?:half|full|double) damage and /, "$1 ")
            .replace(/^(The (?:target|creature)) is [A-Z][a-z-]+(?: \d+)? and /, "$1 ")
            .replace(/^(The (?:target|creature)) is pushed \d+ feet away from you and /, "$1 ");
        notes.push({ label: noteLabel(text), text, sourceText: clause.text, duration });
        previous = notes.at(-1);
    }
    // "It can't Delay or take any reactions until it has obeyed this urge.": with no timing of its own, a note lasts as the
    // row's other note does; with none, it isn't a note.
    // (Or, with none, the time of the one timed condition the row applies: Uncontrollable Dance's "Off-Guard for 3 rounds. It can't use reactions, …".)
    const timed = notes.find(note => !note.duration.pending)?.duration ?? (rowDuration ? { ...rowDuration, sourceText: rowDuration.sourceText ?? "the row's condition" } : null);
    const kept = notes.filter(note => !note.duration.pending || timed).map(note => note.duration.pending ? { ...note, duration: { ...timed } } : note);
    // Consecutive sentences of one kind ("The target's attitude becomes Friendly toward you. If it was Friendly, it becomes
    // Helpful.") are one note.
    const merged = [];
    for (const note of kept) {
        const same = merged.find(other => other.label === note.label && JSON.stringify(other.duration) === JSON.stringify(note.duration));
        if (same) { same.text = `${same.text} ${note.text}`; same.sourceTexts = [...(same.sourceTexts ?? [same.sourceText]), ...(note.sourceTexts ?? [note.sourceText])]; }
        else merged.push({ ...note });
    }
    return merged;
}

// "Success The duration is 1 round." / "Failure The target is affected for 1 minute." / "Success The effect lasts for 1 round." /
// "Failure The effect lasts its normal duration.": a row that only says how long the effect before the table lasts.
const DURATION_ROW = /^(?:The duration is|The (?:target|creature) is affected for|The (?:effect|spell) lasts(?: for)?|The [a-z]+ affects the (?:creature|target) for) (\d+|one) (round|minute|hour|day)s?\.$/i;
// "Critical Failure The spell has an unlimited duration.": the effect doesn't end on its own.
const UNLIMITED_ROW = /^The (?:spell|effect) has an unlimited duration\.$/i;
// "Failure The creature is affected for [[/gmr 1d4 #rounds]]{1d4 rounds}.": rounds rolled for each creature at Finalize.
const ROLLED_DURATION_ROW = /^(?:The duration is|The (?:target|creature) is affected for|The effect lasts(?: for)?) (?:\[\[\/g?m?r (\d+d\d+)(?: #rounds)?\]\]\{\1 rounds\}|(\d+d\d+) rounds)\.$/i;
const NORMAL_DURATION_ROW = /^The effect lasts its normal duration\.$/i;
const UNAFFECTED_ROW = /^(?:The (?:target|creature) is unaffected|The spell has no effect)\.$/i;
// "As failure, but the target can't perceive anything beyond a range of 10 feet.": the named row's duration, and a restriction.
const AS_ROW_BUT = /^As (failure|success), but (the (?:target|creature) [^.]+)\.$/i;
// Sentences before the table about the save itself, not the effect.
const SAVE_SENTENCES = [
    /^The (?:spell's )?duration(?: of this effect)? (?:depends on|is determined by) the target's (?:Fortitude|Reflex|Will) save\.$/i,
    /^An unwilling target must attempt an? (?:Fortitude|Reflex|Will) save\.$/i,
    /^After attempting its save, the target becomes temporarily immune for \d+ (?:hours?|minutes?|days?)\.$/i
];
// "A willing target can choose to critically fail their saving throw." / "You can allow allies to choose the outcome instead of
// attempting a saving throw." / "… a creature can willingly choose to be subject to the failure effect of the spell.": the GM sets it.
const WILLING_CHOICE = /^(?:A willing target can choose to critically fail (?:their|its) saving throw|You can allow allies to choose the outcome instead of attempting a saving throw|This effect is helpful to [^,]+, and a creature can willingly choose to be subject to the failure effect of the spell)\.$/i;
const MECHANICAL_WORDS = /@Damage\[|\b\d+d\d+\b|conditionitems\.|\bcounteract|\b(?:damage|Hit Points|temporary)\b/i;
// "All physical damage dealt by the target to living creatures becomes nonlethal …": the damage the target deals, the GM's to adjust.
const TARGET_DEALT_DAMAGE = /\b(?:(?:physical|persistent bleed|persistent) )?damage dealt by the target\b/gi;

/**
 * Per-row durations of an effect described before the table (user direction: notes with the correct duration). Every row is
 * unaffected, a duration, or "As failure, but …" with a restriction; the effect's sentences hold nothing mechanical except what a
 * judge accepts (situational numbers). Returns {byDegree: {degree: note}, claimed: [preamble sentences], reminder} or null.
 */
// "The target gains fire resistance 2." with "Heightened (+1) The amount of fire resistance increases by 2.": a Resistance rule on the
// note, its value at the cast rank (the note Effect's level). "Creatures with weakness to water take damage equal to their weakness at
// the end of each of their turns.": damage the GM deals to such a creature; it stays in the note.
const NOTE_RESISTANCE = /^The target gains ([a-z]+) resistance (\d+)\.$/;
const NOTE_RESISTANCE_HEIGHTENED = /<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The amount of ([a-z]+) resistance increases by (\d+)\.\s*<\/p>/i;
const WEAKNESS_DAMAGE = /\bCreatures with weakness to [a-z]+ take damage equal to their weakness at the end of each of their turns\./g;
// "If the target can't repeat an action, …, it can act as it chooses for that action but becomes @UUID[…]{Stupefied 1} until the end of its
// turn.": a condition the GM applies when the stated situation happens; it stays in the note.
// "A creature affected by revealing light is @UUID[…]{Dazzled}.": PF2e's condition, granted by the note for the row's duration.
const AFFECTED_CONDITION = /^A creature affected by [a-z' ]+ is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)\}\.$/;
// "If the creature was @UUID[…]{Invisible}, it becomes @UUID[…]{Concealed} instead.": Concealed, granted only to an invisible creature (its
// invisibility counts as concealment: a note). "If the creature was already concealed for any other reason, it is no longer concealed." is a
// note (other effects' concealment is the GM's to remove).
const INVISIBLE_TO_CONCEALED = /^If the creature was @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Invisible\}, it becomes @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Concealed\} instead\.$/;
const CONCEALED_LOST = /^If the creature was already concealed for any other reason, it is no longer concealed\.$/;
// "Followers of your faith ignore the target's @UUID[…]{Concealed} condition, if any, and the target gains a -1 status penalty to AC against
// attacks by followers of your faith.": the penalty behind a toggle on the note (the attacker's faith is the table's); ignoring concealment is
// a note.
const FAITH_AC_PENALTY = /^Followers of your faith ignore the target's @UUID\[[^\]]+\]\{Concealed\} condition, if any, and the target gains a [-–](\d) (status|circumstance) penalty to AC against attacks by followers of your faith\.$/;
// "The shroud also provides the target a +1 status bonus to saving throws against light effects.": that bonus, on saves against the trait.
const TRAIT_SAVE_BONUS = /^The [a-z]+ also (?:provides|gives) the target a \+(\d) (status|circumstance) bonus to saving throws against ([a-z]+) effects\.$/;
const TRIGGERED_CONDITION = /^If the target can't [^@]+, it can act as it chooses for that action but becomes @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Za-z-]+(?: \d)?\} until the end of its turn\.$/;

// "During the duration, the target must Stride, Fly, or Swim at least once each turn or take 2d8 mental damage at the end of its turn.":
// the spell's damage, dealt when the GM reports that the creature didn't move on its turn (an Ongoing control on the note, once a
// round). "The GM might decide to add additional move actions …" stays in the note.
const NO_MOVE_DAMAGE = /^During the duration, the target must Stride, Fly, or Swim at least once each turn or take (\d+)d(\d+) ([a-z]+) damage at the end of its turn\.$/;
const NO_MOVE_GM = /^The GM might decide to add additional move actions to the list for creatures that possess only a more unusual form of movement\.$/;
const DAMAGE_HEIGHTENED = /<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The damage increases by (\d+)d(\d+)\.\s*<\/p>/i;

export function compileDegreeDurationNotes(outcomes, preambleText, lifecycle, judge, { heightenedHTML = "", rank = null, components = [] } = {}) {
    const rows = {};
    for (const degree of ["criticalSuccess", "success", "failure", "criticalFailure"]) {
        const outcome = outcomes?.[degree];
        const text = String(outcome?.rawText ?? "").replace(/\s+/g, " ").trim();
        if ((outcome?.effects ?? []).length || (outcome?.nativeEffects ?? []).length || ((outcome?.damage?.multiplier ?? 0) > 0 && !components.length)) return null;
        if (UNAFFECTED_ROW.test(text)) { rows[degree] = null; continue; }
        if (UNLIMITED_ROW.test(text)) { rows[degree] = { duration: { unlimited: true }, text }; continue; }
        const own = DURATION_ROW.exec(text);
        if (own) { rows[degree] = { duration: { value: own[1].toLowerCase() === "one" ? 1 : Number(own[1]), unit: `${own[2].toLowerCase()}s` }, text }; continue; }
        const rolled = ROLLED_DURATION_ROW.exec(text);
        if (rolled) { rows[degree] = { duration: { value: null, valueRoll: rolled[1] ?? rolled[2], unit: "rounds" }, text }; continue; }
        if (NORMAL_DURATION_ROW.test(text)) {
            const spec = lifecycle?.durationSpec;
            if (spec?.mode !== "fixed" || !Number.isInteger(spec.value)) return null;
            rows[degree] = { duration: { value: spec.value, unit: spec.unit }, text };
            continue;
        }
        const as = AS_ROW_BUT.exec(text);
        if (as && !MECHANICAL_WORDS.test(as[2])) { rows[degree] = { as: as[1].toLowerCase() === "failure" ? "failure" : "success", extra: `${as[2][0].toUpperCase()}${as[2].slice(1)}.`, text }; continue; }
        return null;
    }
    for (const [degree, row] of Object.entries(rows)) if (row?.as) {
        const named = rows[row.as];
        if (!named?.duration) return null;
        rows[degree] = { ...row, duration: named.duration };
    }
    if (!Object.values(rows).some(row => row?.duration)) return null;
    // The effect: the sentences before the table other than the save's own and the willing choice.
    const sentences = String(preambleText ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const saveSentences = sentences.filter(sentence => SAVE_SENTENCES.some(pattern => pattern.test(sentence)));
    const willing = sentences.find(sentence => WILLING_CHOICE.test(sentence)) ?? null;
    const effect = sentences.filter(sentence => !saveSentences.includes(sentence) && sentence !== willing);
    // The effect's one resistance, as a rule (heightened only by its own Heightened entry).
    const resistanceSentences = effect.filter(sentence => NOTE_RESISTANCE.test(sentence));
    let rules = [], resistanceHeightened = null;
    if (resistanceSentences.length > 1) return null;
    if (resistanceSentences.length) {
        const [, type, value] = NOTE_RESISTANCE.exec(resistanceSentences[0]);
        const heightened = NOTE_RESISTANCE_HEIGHTENED.exec(String(heightenedHTML ?? ""));
        if (heightened && heightened[2] !== type) return null;
        const base = Number(rank) || 1;
        rules = [{ key: "Resistance", type, value: heightened ? `${value} + floor((@item.level - ${base}) / ${Number(heightened[1])}) * ${Number(heightened[3])}` : Number(value) }];
        if (heightened) resistanceHeightened = `Heightened (+${heightened[1]}): the amount of ${type} resistance increases by ${heightened[3]} (the Effect's rule is at the cast rank).`;
    }
    // The effect's one no-move damage, the spell's damage entry (heightened only by its own Heightened entry).
    let triggeredDamage = null;
    const noMove = effect.filter(sentence => NO_MOVE_DAMAGE.test(sentence));
    if (noMove.length > 1 || (components.length && !noMove.length)) return null;
    if (noMove.length) {
        const [, dice, die, type] = NO_MOVE_DAMAGE.exec(noMove[0]);
        const component = components.length === 1 && !components[0].category ? components[0] : null;
        if (!component || String(component.formula).replace(/\s+/g, "") !== `${dice}d${die}` || String(component.type).toLowerCase() !== type) return null;
        const blocks = String(heightenedHTML ?? "").split(/<hr\b[^>]*>/i).filter(block => /Heightened/.test(block));
        const step = DAMAGE_HEIGHTENED.exec(String(heightenedHTML ?? ""));
        if (blocks.length > 1 || (blocks.length && (!step || step[3] !== die))) return null;
        triggeredDamage = { trigger: "no-move", dice: Number(dice), die: Number(die), type, componentId: component.id, frequency: "round", endsSpell: false,
            baseRank: Number(rank) || 1, ...(step ? { heightening: { interval: Number(step[1]), dice: Number(step[2]) } } : {}) };
    }
    // Conditions and a toggled penalty the effect states (rules on the note).
    const ruled = [];
    for (const sentence of effect) {
        const affected = AFFECTED_CONDITION.exec(sentence), concealed = INVISIBLE_TO_CONCEALED.exec(sentence), faith = FAITH_AC_PENALTY.exec(sentence);
        if (affected) { rules.push({ key: "GrantItem", uuid: affected[1], flag: `condition${affected[2]}`, allowDuplicate: true, onDeleteActions: { granter: "cascade", grantee: "cascade" } }); ruled.push(sentence); }
        else if (concealed) { rules.push({ key: "GrantItem", uuid: concealed[1], flag: "conditionConcealed", allowDuplicate: true, predicate: ["self:condition:invisible"], onDeleteActions: { granter: "cascade", grantee: "cascade" } }); ruled.push(sentence); }
        else if (CONCEALED_LOST.test(sentence)) ruled.push(sentence);
        else if (TRAIT_SAVE_BONUS.test(sentence)) { const [, value, type, trait] = TRAIT_SAVE_BONUS.exec(sentence); rules.push({ key: "FlatModifier", selector: "saving-throw", type, value: Number(value), predicate: [`item:trait:${trait}`] }); ruled.push(sentence); }
        else if (faith) {
            rules.push({ key: "RollOption", domain: "all", option: "attacker-follows-caster-faith", toggleable: true, label: "The attacker follows the caster's faith", value: false },
                { key: "FlatModifier", selector: "ac", type: faith[2], value: -Number(faith[1]), predicate: ["attacker-follows-caster-faith"] });
            ruled.push(sentence);
        }
    }
    const judged = effect.filter(sentence => !ruled.includes(sentence) && !resistanceSentences.includes(sentence) && !TRIGGERED_CONDITION.test(sentence) && !noMove.includes(sentence) && !NO_MOVE_GM.test(sentence)).map(sentence => sentence.replace(WEAKNESS_DAMAGE, "").trim()).filter(Boolean);
    // (A linked condition is checked on the sentence itself, before links become their labels: only the triggered form carries one.)
    if (!effect.length || judged.some(sentence => /conditionitems\./.test(sentence)
        || MECHANICAL_WORDS.test(sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(TARGET_DEALT_DAMAGE, "")))) return null;
    if (judged.length && !judge(judged.join(" "))) return null;
    const effectText = [...effect, ...(resistanceHeightened ? [resistanceHeightened] : [])].join(" ").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
    const byDegree = {};
    for (const [degree, row] of Object.entries(rows)) if (row?.duration) byDegree[degree] = {
        label: "Spell's effect", text: `${effectText}${row.extra ? ` ${row.extra}` : ""}`.slice(0, 1000), sourceText: row.text, ...(rules.length ? { rules: rules.map(rule => ({ ...rule })) } : {}),
        ...(triggeredDamage ? { triggeredDamage: { ...triggeredDamage } } : {}),
        duration: row.duration.unlimited ? { mode: "unlimited", sourceText: row.text } : { mode: "fixed", value: row.duration.value, ...(row.duration.valueRoll ? { valueRoll: row.duration.valueRoll } : {}), unit: row.duration.unit,
            expiry: row.duration.unit === "rounds" ? "turn-start" : null, anchor: "effect-start", offset: 0, sourceText: row.text }
    };
    return { byDegree, claimed: [...effect, ...saveSentences.filter(sentence => !/temporarily immune/i.test(sentence)), ...(willing ? [willing] : [])],
        reminder: willing ? { kind: "willing-choice", text: "A willing target (or an ally, where the spell allows it) may choose its result: set it on the card instead of rolling.", sourceText: willing } : null };
}

// A row that is only behaviour (Paranoia: "The target believes everyone it sees is a potential threat. It becomes Unfriendly to all
// creatures … It treats no one as an ally. The spell ends after 1 round."): nothing the module applies, and every clause it can't
// claim carries only duration or timing words (no damage, dice, check, condition, save or forced movement; the creature's own
// movement is behaviour). The whole row is one note
// Effect for the row's duration: its own ("The spell ends after 1 round.", "For 1 round, …", "the effect lasts 1 minute"), the named
// row's ("As failure, except …"), or the spell's. "As success, but the effect lasts 1 minute." is the success row's note, longer.
const ROW_NOTE_SIGNALS = new Set(["duration", "timing", "action", "choice", "self-movement"]);
const ROW_NOTE_BLOCKERS = /\brolls?\b|\btwice\b|\bchecks?\b|\bsav(?:e|es|ing throws?)\b|\bAC\b|\bbonus\b|\bpenalty\b|\bSpeeds?\b|\bHit Points\b|\bdamage\b|\bresistance\b|\bweakness\b|\bimmune\b|\bwithin the next\b|\bnext \w+ (?:attacks?|rolls?|checks?)\b|\bfeet\b/i;
const ROW_ENDS = /^The spell (?:ends after|then ends)(?: (\d+|one) (round|minute|hour)s?)?\.$/i;
const ROW_FOR = /^For (\d+|one) (round|minute|hour)s?, /i;
// "The spell has a duration of 1 minute, or until the target has completed a finite suggestion …" (Suggestion): the row's own time.
const ROW_HAS = /^The spell has a duration of (\d+|one) (round|minute|hour)s?\b/i;
const ROW_LASTS = /^As (success|failure), but the effect lasts (\d+|one) (round|minute|hour)s?(?:,? and (.+?))?\.$/i;
// "… they must succeed at a @Check[flat|dc:11] to Cast a Spell with verbal components." / "… when attempting to Cast a Spell or use an
// action with the auditory trait" / "… or the action is lost": a flat check the creature rolls when it acts. The module can't
// intercept the action, so the note carries the check (its roll link).
const FLAT_ON_ACT = /\bmust succeed at a @Check\[flat\|dc:\d+\] (?:to (?:Cast a Spell|use)\b[^.;@]*|when (?:attempting to |casting )[^.;@]*)(?:,? or (?:the (?:action|attempt|spell) (?:is lost|is disrupted|fails)))?/g;
const ROW_EXCEPT = /^As (success|failure)(?:, except|, and) /i;
// "As failure, but hostility doesn't end the effect.": the named row's note, with the change stated.
const ROW_BUT = /^As (success|failure), but (?!the effect lasts)([^.]+)\.$/i;
const DEGREE_KEY = { success: "success", failure: "failure" };
const count = value => value === "one" ? 1 : Number(value);
const fixed = (value, unit, sourceText) => ({ mode: "fixed", value, unit: `${unit}s`, expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText });

export function wholeRowNote(outcome, outcomes, lifecycle) {
    // (A PF2e Effect link the text's modifier replaced isn't part of the row.)
    const raw = (outcome?.replacedLinks ?? []).reduce((text, link) => text.replace(link, ""), String(outcome?.rawText ?? "")).replace(/\s+/g, " ").trim();
    const clauses = (outcome?.semanticCoverage?.clauses ?? []).filter(clause => !(outcome?.replacedLinks ?? []).includes(clause.text.trim()));
    if (!raw || !clauses.some(clause => clause.status !== "compiled")) return null;
    if ((outcome.effects ?? []).length || (outcome.nativeEffects ?? []).length || outcome.forcedMovement || (outcome.damage?.mode && outcome.damage.mode !== "none")
        || outcome.conditionFloor || outcome.affliction) return null;
    // Links other than attitudes, dice, checks and damage are rules the module would apply.
    const judged = raw.replace(FLAT_ON_ACT, "must pass a flat roll when acting");
    const links = [...judged.matchAll(/@UUID\[[^\]]+\]\{([^}]+)\}/g)].map(match => match[1]);
    if (links.some(name => !/^(?:Unfriendly|Hostile|Indifferent|Friendly|Helpful|Aid)$/.test(name)) || /@Damage\[|@Check\[|\[\[\/|\b\d+d\d+\b/.test(judged)) return null;
    // Roll rules, numbers and timing the module could apply or must time ("roll its next two attack rolls twice", "within the next hour").
    if (ROW_NOTE_BLOCKERS.test(judged.replace("must pass a flat roll when acting", ""))) return null;
    for (const clause of clauses.filter(clause => clause.status !== "compiled")) {
        if ((clause.guidedClaims ?? []).some(kind => !NOTE_KINDS.has(kind))) return null;
        // (A flat check when acting explains the clause's save and number signals.)
        const flat = new RegExp(FLAT_ON_ACT.source).test(clause.text);
        // (The caster's choice the row describes — "You choose a piece of information …" — is the note's, not a rule on the caster.)
        const casterChooses = /^(?:You|If the target was willing, you) (?:can )?(?:instead )?choose\b/.test(clause.text);
        if ((clause.unexplainedSignals ?? []).some(signal => !ROW_NOTE_SIGNALS.has(signal) && !(flat && ["save", "modifier"].includes(signal)) && !(casterChooses && signal === "caster-subject"))) return null;
    }
    const plainRow = raw.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
    const parts = plainRow.split(/(?<=\.)\s+(?=[A-Z(])/);
    const lasts = ROW_LASTS.exec(plainRow);
    const except = !lasts ? ROW_EXCEPT.exec(plainRow) : null;
    const but = !lasts && !except ? ROW_BUT.exec(plainRow.split("\n")[0].trim()) : null;
    const named = lasts ?? except ?? but;
    const from = named ? outcomes?.[DEGREE_KEY[named[1].toLowerCase()]]?.noteEffects?.find(note => note.wholeRow) : null;
    if (named && !from) return null;
    let duration = null, text;
    if (lasts) {
        duration = fixed(count(lasts[2]), lasts[3].toLowerCase(), `lasts ${lasts[2]} ${lasts[3]}`);
        // (The success row's own length goes: "For 1 round, the target can't …" becomes "The target can't …".)
        text = from.text.replace(/\s*The spell (?:ends after [^.]+|then ends)\.$/i, "").replace(ROW_FOR, "").replace(/^./, letter => letter.toUpperCase());
        // "…, and they must succeed at a flat check to Cast a Spell …" / "… and the target can't speak.": what the row adds.
        if (lasts[4]) text = `${text} ${lasts[4].replace(/^./, letter => letter.toUpperCase())}.`;
    } else if (but) {
        duration = { ...from.duration };
        // "As failure, but the base duration is 1 hour.": the named row's note for that long.
        const base = /^the (?:base )?duration is (\d+|one) (round|minute|hour)s?$/i.exec(but[2].trim());
        if (base) duration = fixed(count(base[1]), base[2].toLowerCase(), `the base duration is ${base[1]} ${base[2]}`);
        // (A length this can't read isn't the named row's.)
        else if (/\bduration is\b/i.test(but[2])) return null;
        text = `${from.text} But: ${but[2].replace(/^./, letter => letter.toUpperCase())}.`;
    } else if (except) {
        duration = { ...from.duration };
        const rest = plainRow.slice(except[0].length);
        // "As failure, except the duration is 1 minute.": the named row's note for that long (its own "For 1 round, " lead goes).
        const longer = /^the duration is (\d+|one) (round|minute|hour)s?\.$/i.exec(rest.trim());
        if (longer) {
            duration = fixed(count(longer[1]), longer[2].toLowerCase(), `the duration is ${longer[1]} ${longer[2]}`);
            text = from.text.replace(ROW_FOR, "").replace(/^./, letter => letter.toUpperCase());
        } else text = `${from.text} ${rest.replace(/^./, letter => letter.toUpperCase())}`;
    } else {
        const ends = parts.map(part => ROW_ENDS.exec(part)).find(Boolean);
        const lead = ROW_FOR.exec(parts[0]);
        const has = parts.map(part => ROW_HAS.exec(part)).find(Boolean);
        if (ends?.[1]) duration = fixed(count(ends[1]), ends[2].toLowerCase(), parts.find(part => ROW_ENDS.test(part)));
        else if (has) duration = fixed(count(has[1]), has[2].toLowerCase(), `a duration of ${has[1]} ${has[2]}`);
        else if (lead) duration = fixed(count(lead[1]), lead[2].toLowerCase(), lead[0].trim());
        else duration = noteDuration("", lifecycle);
        text = plainRow;
    }
    if (!duration) return null;
    // (Labelled by what the row says first: an added rule doesn't rename it.)
    return { label: noteLabel(text.split(/(?<=\.)\s+/)[0]), text, sourceText: raw, claimsRow: true, wholeRow: true, gmPlays: true, duration,
        ...(new RegExp(FLAT_ON_ACT.source).test(raw) ? { flatCheckOnAct: true } : {}) };
}
