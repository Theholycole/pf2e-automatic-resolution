// Note Effects (user decision): what the module can't carry out mechanically — behaviour, attitude, a choice — is a rule-less
// Effect on the creature naming what to do, for as long as the spell's text says. It is a reminder, not automation.
import { nativeConditionTiming } from "./condition-timing.js";
import { MODULE_ID, UNITS } from "./runtime-utils.js";

/** A note the compiler certified: a label, the rule text, the clause it came from, and a fixed duration. */
export function validNoteEffect(note) {
    const duration = note?.duration;
    return typeof note?.label === "string" && note.label.length > 0 && note.label.length <= 60
        && typeof note.text === "string" && note.text.length > 0 && note.text.length <= 1000
        && typeof note.sourceText === "string" && note.sourceText.length > 0
        // Rounds rolled for each creature ("for 1d4 rounds") are set at Finalize, before the Effect is made.
        && (duration?.mode === "unlimited" || (duration?.mode === "fixed" && ((Number.isInteger(duration.value) && duration.value > 0) || (duration.value == null && /^\d+d\d+$/.test(duration.valueRoll ?? "") && duration.unit === "rounds"))
        && UNITS.has(duration.unit)))
        && (duration.expiry == null || ["turn-start", "turn-end"].includes(duration.expiry))
        && (duration.anchor == null || ["effect-start", "source-turn", "target-turn"].includes(duration.anchor))
        && (note.rules == null || (Array.isArray(note.rules) && note.rules.every(validRowNoteRule)))
        // An end-of-turn save that shortens the note ("to reduce the remaining duration by 1 round, ending the effects entirely on a critical
        // success"): a rounds note.
        && (note.recurringSave == null || (["turn-end"].includes(note.recurringSave.timing) && ["reduce", "end"].includes(note.recurringSave.mode)
            && ["fortitude", "reflex", "will"].includes(note.recurringSave.statistic) && duration?.mode === "fixed" && duration.unit === "rounds")
            // "… must attempt another save at the start of its turn; on a failure, it is Slowed 1 for that turn": a save at each of its turn starts
            // while the note lasts, its failure granting the condition until that turn ends.
            || (note.recurringSave.timing === "turn-start" && note.recurringSave.mode === "turn-condition" && ["fortitude", "reflex", "will"].includes(note.recurringSave.statistic)
                // (A condition with no value — Controlled — and a critical success that ends the note: Possession's partial control.)
                && /^[a-z-]+$/.test(note.recurringSave.condition?.slug ?? "") && ((Number.isInteger(note.recurringSave.condition?.value) && note.recurringSave.condition.value > 0) || note.recurringSave.condition?.value === null)
                && (note.recurringSave.endOnCriticalSuccess == null || note.recurringSave.endOnCriticalSuccess === true)
                && /^Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+$/.test(note.recurringSave.condition?.uuid ?? "") && duration?.mode === "fixed"))
        // Tied to the row's condition (it ends with that condition's Effect): an unlimited note.
        && (note.whileCondition == null || (/^[a-z-]+$/.test(note.whileCondition) && duration?.mode === "unlimited"))
        // Lasting while the creature takes the spell's persistent damage of that type: an unlimited note, removed with it.
        // The caster's healing each time the creature takes the stated damage (Draw Blood's bleed): its formula reads only the cast rank.
        && (note.triggeredHealing == null || (/^max\(\d+, ?@item\.rank\)$/.test(note.triggeredHealing.formula ?? "") && note.triggeredHealing.trigger === "bleed-damage"
            && Object.keys(note.triggeredHealing).every(key => ["formula", "trigger"].includes(key))))
        && (note.whilePersistent == null || (/^[a-z]+$/.test(note.whilePersistent) && duration?.mode === "unlimited" && note.whileCondition == null))
        // Lasting while the creature stays in the lingering area ("as long as it remains in the area"): an unlimited note, removed when it leaves.
        && (note.whileInArea == null || (note.whileInArea === true && duration?.mode === "unlimited" && note.whileCondition == null && note.whilePersistent == null))
        && (note.afterLeaveRounds == null || (note.whileInArea === true && Number.isInteger(note.afterLeaveRounds) && note.afterLeaveRounds >= 1 && note.afterLeaveRounds <= 3))
        // (The rules it holds for those rounds instead — Mind's Eye Wink's "Stupefied 2 while in the area and stupefied 1 for 1 round after".)
        && (note.afterLeaveRules == null || (note.afterLeaveRounds != null && Array.isArray(note.afterLeaveRules) && note.afterLeaveRules.length > 0 && note.afterLeaveRules.every(rule => rule?.key === "GrantItem")))
        // The caster's control of the creature while the note lasts (its player owns the token, with the minion trait).
        && (note.minionControl == null || note.minionControl === true)
        // A d20 limit on its checks ("rolls below 10 … get a 10 instead"): d20-clamp.js sets the die before PF2e grades the check.
        && (note.d20Clamp == null || (isD20Clamp(note.d20Clamp)))
        // A condition when the note ends ("At the end of your turn, the creature is no longer controlled and becomes Stunned 1"), held by its own Effect.
        && (note.thenCondition == null || (/^Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+$/.test(note.thenCondition.uuid ?? "") && /^[a-z-]+$/.test(note.thenCondition.slug ?? "")
            && (note.thenCondition.value === null || (Number.isInteger(note.thenCondition.value) && note.thenCondition.value > 0 && note.thenCondition.value <= 4))
            && Object.keys(note.thenCondition).every(key => ["uuid", "slug", "value"].includes(key))))
        // The caster loses part of the Hit Points the creature loses while it holds the note (and the condition after it): "you lose Hit Points equal to half that amount".
        && (note.hpShare == null || (note.hpShare.fraction === 0.5 && Object.keys(note.hpShare).every(key => ["fraction"].includes(key))))
        // "Creatures animated with this spell die again once the spell ends": its Hit Points and Dead status when the note ends.
        && (note.endsInDeath == null || note.endsInDeath === true)
        // "If your familiar is reduced to 0 Hit Points …, the spell immediately ends, and your familiar is instead reduced to 1 Hit Point."
        && (note.zeroToOne == null || note.zeroToOne === true)
        // Its frightened kept at the end of its turn after a failed attack roll or skill check (Residual Bad Luck): note-watchers.js.
        // The spell's persistent damage on the holder ends with this note, at the row's recovery DC (Ravaging End): basic-save-runtime.js ties them.
        && (note.holdsPersistent == null || (Number.isInteger(note.holdsPersistent.dc) && note.holdsPersistent.dc >= 2 && note.holdsPersistent.dc <= 20 && Object.keys(note.holdsPersistent).length === 1))
        // Spells with a trait the holder can't use (Sensory Deprivation's hands: manipulate; mouth: auditory): casting-rules-runtime.js loses them.
        // Its modifiers' value from a rank (Summon Jury's "The status penalties increase to 2."): the last entry reached sets every FlatModifier's value.
        && (note.rankValues == null || (Array.isArray(note.rankValues) && note.rankValues.length > 0 && note.rankValues.every((entry, index) => Number.isInteger(entry?.fromRank) && entry.fromRank >= 2 && entry.fromRank <= 10
            && Number.isInteger(entry.value) && Math.abs(entry.value) <= 6 && Object.keys(entry).length === 2 && (index === 0 || entry.fromRank > note.rankValues[index - 1].fromRank))))
        // The note's text from a rank (Shade of Night's heightened vision): the highest entry at or below the cast rank replaces the text.
        && (note.rankText == null || (Array.isArray(note.rankText) && note.rankText.length > 0 && note.rankText.every((entry, index) => Number.isInteger(entry?.fromRank) && entry.fromRank >= 2 && entry.fromRank <= 10
            && typeof entry.text === "string" && entry.text.length > 0 && entry.text.length <= 1000 && Object.keys(entry).length === 2 && (index === 0 || entry.fromRank > note.rankText[index - 1].fromRank))))
        && (note.castForbid == null || (/^[a-z-]+$/.test(note.castForbid.trait ?? "") && Object.keys(note.castForbid).length === 1))
        // A flat check whenever the holder Casts a Spell (Silence of the Archmage): casting-rules-runtime.js.
        // (Or only for spells with one trait: Lurking Doom's concentrate actions.)
        && (note.castFlatCheck == null || (Number.isInteger(note.castFlatCheck.dc) && note.castFlatCheck.dc >= 2 && note.castFlatCheck.dc <= 20
            && (note.castFlatCheck.trait == null || /^[a-z-]+$/.test(note.castFlatCheck.trait)) && Object.keys(note.castFlatCheck).every(key => ["dc", "trait"].includes(key))))
        // Only on a target with the trait (Silver Spear's tether on a fiend): basic-save-core.js's targetOutcomeNotes.
        && (note.targetTrait == null || /^[a-z-]+$/.test(note.targetTrait))
        // Removed after the caster's next attack roll against the holder (Dynamic Daze): note-watchers.js.
        && (note.consumedBySourceAttack == null || note.consumedBySourceAttack === true)
        && (note.conditionHold == null || (note.conditionHold.slug === "frightened" && note.conditionHold.trigger === "failed-attack-or-skill" && Object.keys(note.conditionHold).length === 2))
        // Its frightened can't fall below the value while the note lasts (The End is Nigh): note-watchers.js puts it back as its turn ends.
        && (note.conditionFloor == null || (note.conditionFloor.slug === "frightened" && Number.isInteger(note.conditionFloor.value) && note.conditionFloor.value >= 1 && note.conditionFloor.value <= 4
            && Object.keys(note.conditionFloor).length === 2))
        // Damage as its turn starts while the note lasts (Garden of the Green Man's squeezing vines): the active GM rolls and applies it.
        && (note.turnStartDamage == null || (/^\d+d\d+(?:[+-]\d+)?$/.test(note.turnStartDamage.formula ?? "") && /^[a-z]+$/.test(note.turnStartDamage.type ?? "")
            && Object.keys(note.turnStartDamage).every(key => ["formula", "type"].includes(key))))
        // The illusion's Disbelieve control: the creature's Perception against the spell DC; a success ends the spell.
        && (note.disbelieve == null || (note.disbelieve.statistic === "perception" && note.disbelieve.endsSpell === true && Object.keys(note.disbelieve).length === 2)
            // (Or a Perception check that ends only this note: Lost in the Crowd's Seek to know its allies again.)
            || (note.disbelieve.statistic === "perception" && note.disbelieve.endsSpell === false && note.disbelieve.needs === "success" && Object.keys(note.disbelieve).length === 3)
            // (Or a Will save that ends only this creature's note: Strange Geometry's cubes stay for the others.)
            || (note.disbelieve.statistic === "will" && note.disbelieve.endsSpell === false && note.disbelieve.needs === "success" && Object.keys(note.disbelieve).length === 3)
            // (A Will save to disbelieve, needing a success or a critical success — or none at all: "automatically disbelieves".)
            || (note.disbelieve.statistic === "will" && note.disbelieve.endsSpell === true && ["automatic", "success", "criticalSuccess"].includes(note.disbelieve.needs)
                // (A penalty to those saves: "taking a -4 circumstance penalty to saves to disbelieve".)
                && (note.disbelieve.penalty == null || (Number.isInteger(note.disbelieve.penalty?.value) && note.disbelieve.penalty.value < 0 && ["circumstance", "status"].includes(note.disbelieve.penalty.type)
                    && note.disbelieve.needs !== "automatic"))
                && Object.keys(note.disbelieve).every(key => ["statistic", "endsSpell", "needs", "penalty"].includes(key))))
        // The creature's own action to end the spell with a save against the spell DC (Croak Voice's "Interact to massage its throat, attempting a
        // Fortitude save … On a success, the spell ends."): once a round when stated.
        && (note.endSave == null || (["fortitude", "reflex", "will"].includes(note.endSave.statistic) && typeof note.endSave.label === "string" && note.endSave.label.length > 0
            && typeof note.endSave.oncePerRound === "boolean" && Object.keys(note.endSave).every(key => ["statistic", "label", "oncePerRound", "scope", "immunity", "immunityOnCritical", "successes"].includes(key))
            // (Invoke the Harrow from 6th: "must succeed a total of two saving throws to end the effect".)
            && (note.endSave.successes == null || (Number.isInteger(note.endSave.successes) && note.endSave.successes >= 2 && note.endSave.successes <= 3))
            // (Oneiric Mire: a critical success disbelieves — immune to the spell for the stated time.)
            && (note.endSave.immunityOnCritical == null || (note.endSave.scope === "creature" && Number.isInteger(note.endSave.immunityOnCritical.value) && note.endSave.immunityOnCritical.value > 0
                && ["minutes", "hours"].includes(note.endSave.immunityOnCritical.unit)))
            // (Ending only this creature's part — "it's no longer fascinated and is temporarily immune for 1 hour" — on a spell with several targets.)
            && (note.endSave.scope == null || note.endSave.scope === "creature")
            && (note.endSave.immunity == null || (note.endSave.scope === "creature" && Number.isInteger(note.endSave.immunity.value) && note.endSave.immunity.value > 0
                && ["minutes", "hours"].includes(note.endSave.immunity.unit) && /^[a-z0-9-]+$/.test(note.endSave.immunity.key ?? "")))))
        // The creature's Recall Knowledge to end its fascination (Unsettling Knowledge): one of the listed skills against the spell DC, then frightened,
        // and on a failure a floor for the rest of the note's time.
        && (note.escape == null || (note.escape === true && (duration?.mode === "fixed" || (duration?.mode === "unlimited" && note.damageLimit != null))))
        // "… remains encased until it takes a total of 50 damage" (Volcanic Eruption): ended once the creature has taken that much damage in total.
        && (note.damageLimit == null || (Number.isInteger(note.damageLimit) && note.damageLimit > 0))
        // (Calcification, Vitrifying Blast: the note lasts while the creature has the condition; its Weakness the condition's value × the multiplier.)
        && (note.withCondition == null || (/^[a-z-]+$/.test(note.withCondition.slug ?? "") && (note.withCondition.multiplier == null || (Number.isInteger(note.withCondition.multiplier) && note.withCondition.multiplier > 0
            && (note.rules ?? []).some(rule => rule.key === "Weakness"))) && Object.keys(note.withCondition).every(key => ["slug", "multiplier"].includes(key))))
        // (Overwhelming Presence: the tribute still owed, PF2e's counter badge the GM lowers — at 0 the note ends.)
        && (note.counter == null || (Number.isInteger(note.counter) && note.counter >= 1 && note.counter <= 20))
        // (Undermine Reality's quasi-real creature: its Strikes halved; saves against its spells and effects on the module's cards a degree better.)
        && (note.halfStrikes == null || note.halfStrikes === true) && (note.sourceSavesBetter == null || note.sourceSavesBetter === true)
        // (Remake Physiology: "Whenever the target would regain actions at the start of its turn, it must first attempt a DC 5 flat check; on a failure,
        // it's Slowed 1 for a round.")
        && (note.turnStartFlat == null || (Number.isInteger(note.turnStartFlat.flat) && note.turnStartFlat.flat > 1 && note.turnStartFlat.flat <= 20
            && /^Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+$/.test(note.turnStartFlat.condition?.uuid ?? "") && /^[a-z-]+$/.test(note.turnStartFlat.condition?.slug ?? "")
            && Number.isInteger(note.turnStartFlat.condition?.value) && Object.keys(note.turnStartFlat).every(key => ["flat", "condition"].includes(key))))
        // "At the start of its turn, each target rolls a DC 8 flat check. On a failure, … 2d10 slashing damage … a basic Reflex save and is Off-Guard for 1 round on any
        // outcome other than a critical success." (Nature's Enmity): the module's, as the creature's turn starts.
        && (note.turnStartAttack == null || (Number.isInteger(note.turnStartAttack.flat) && note.turnStartAttack.flat > 1 && note.turnStartAttack.flat <= 20 && /^\d+d\d+$/.test(note.turnStartAttack.formula ?? "")
            && /^[a-z]+$/.test(note.turnStartAttack.type ?? "") && ["fortitude", "reflex", "will"].includes(note.turnStartAttack.statistic)
            && (note.turnStartAttack.offGuard == null || (/^Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+$/.test(note.turnStartAttack.offGuard.uuid ?? "") && Number.isInteger(note.turnStartAttack.offGuard.rounds)))
            && Object.keys(note.turnStartAttack).every(key => ["flat", "formula", "type", "statistic", "offGuard"].includes(key))))
        // A question each Sustain asks (Mind Probe): the creature's skill check against the spell DC, optionally penalized; the GM's control.
        && (note.questionCheck == null || (note.questionCheck.skill === "deception" && (note.questionCheck.penalty == null || (Number.isInteger(note.questionCheck.penalty.value)
            && note.questionCheck.penalty.value < 0 && ["circumstance", "status"].includes(note.questionCheck.penalty.type))) && Object.keys(note.questionCheck).every(key => ["skill", "penalty"].includes(key))))
        // A ward the note's creature carries (Planar Tether): Ongoing spells' "Counteract with …" control at the cast rank.
        && (note.ward == null || (typeof note.ward.trigger === "string" && note.ward.trigger.length > 0 && (note.ward.successText == null || typeof note.ward.successText === "string")
            && Object.keys(note.ward).every(key => ["trigger", "successText"].includes(key))))
        && (note.recallEscape == null || (Array.isArray(note.recallEscape.skills) && note.recallEscape.skills.length >= 1 && note.recallEscape.skills.every(skill => CURSE_SKILLS.has(skill))
            && Number.isInteger(note.recallEscape.frightened) && note.recallEscape.frightened >= 1 && Number.isInteger(note.recallEscape.floor) && note.recallEscape.floor >= 1
            && duration?.mode === "fixed" && Object.keys(note.recallEscape).every(key => ["skills", "frightened", "floor"].includes(key))))
        // A penalty the GM's report gives, raised on a second report while it lasts (Delusional Pride's failures).
        && (note.triggeredPenalty == null || (Array.isArray(note.triggeredPenalty.values) && note.triggeredPenalty.values.length === 2 && note.triggeredPenalty.values.every(value => Number.isInteger(value) && value < 0 && value >= -4)
            && ["status", "circumstance"].includes(note.triggeredPenalty.type) && JSON.stringify(note.triggeredPenalty.selectors) === '["attack-roll","skill-check"]'
            && Object.keys(note.triggeredPenalty).every(key => ["values", "type", "selectors"].includes(key))))
        // A condition the GM's report raises (Censure Falsehoods: "if the target attempts a Deception or Stealth check, their sickened value increases by 1
        // (to a maximum of Sickened 4)"): the module raises it, to the maximum.
        // (Or only the first time: Hemophilia's "the first time the target takes bleed damage while the spell is active, it becomes drained 1 or increases its drained value by 1".)
        && (note.triggeredIncrease == null || (/^[a-z]+$/.test(note.triggeredIncrease.slug ?? "") && Number.isInteger(note.triggeredIncrease.maximum) && note.triggeredIncrease.maximum > 1
            && typeof note.triggeredIncrease.trigger === "string" && (note.triggeredIncrease.once == null || note.triggeredIncrease.once === true)
            && Object.keys(note.triggeredIncrease).every(key => ["slug", "maximum", "trigger", "once"].includes(key))))
        // Information the spell reveals about the creature, now or when the note ends (a fixed note).
        && (note.reveal == null || (["highest-weakness", "intelligence-compare"].includes(note.reveal.kind) && ["now", "expiry"].includes(note.reveal.timing)
            && Object.keys(note.reveal).every(key => ["kind", "timing"].includes(key)) && (note.reveal.timing === "now" || duration?.mode === "fixed"))
            // (A command to the GM, whispered when the row applies: Catch Your Name, Telepathic Demand.)
            || (note.reveal.kind === "gm-command" && note.reveal.timing === "now" && typeof note.reveal.text === "string" && note.reveal.text.length > 0
                && Object.keys(note.reveal).every(key => ["kind", "timing", "text"].includes(key))))
        // A number the text states at the cast rank ("that healing is reduced by 8", +4 a rank, halved on a success): "{amount}" in the text.
        // The spell DC in the note's check link ("{dc}"), set when the Effect is made.
        && (note.spellDC == null || (note.spellDC === true && note.text.includes("{dc}")))
        && (note.rankAmount == null || (Number.isInteger(note.rankAmount.base) && note.rankAmount.base > 0 && Number.isInteger(note.rankAmount.step) && note.rankAmount.step >= 0
            && Number.isInteger(note.rankAmount.interval) && note.rankAmount.interval > 0 && Number.isInteger(note.rankAmount.baseRank)
            && [0.5, 1, 1.5, 2].includes(note.rankAmount.multiplier) && note.text.includes("{amount}")))
        // (A second number at the cast rank, "{amount2}": the Hedge Prison's Hardness beside its Hit Points.)
        && (note.rankAmount2 == null || (note.rankAmount != null && Number.isInteger(note.rankAmount2.base) && note.rankAmount2.base > 0 && Number.isInteger(note.rankAmount2.step)
            && note.rankAmount2.step >= 0 && Number.isInteger(note.rankAmount2.interval) && note.rankAmount2.interval > 0 && Number.isInteger(note.rankAmount2.baseRank)
            && [0.5, 1, 1.5, 2].includes(note.rankAmount2.multiplier) && note.text.includes("{amount2}")));
}

/** A d20 limit: a floor or a ceiling (1–20) on the listed check types. */
export function isD20Clamp(clamp) {
    const bound = value => Number.isInteger(value) && value >= 1 && value <= 20;
    return clamp != null && (clamp.min == null || bound(clamp.min)) && (clamp.max == null || bound(clamp.max)) && (clamp.min != null) !== (clamp.max != null)
        && Array.isArray(clamp.types) && clamp.types.length > 0 && clamp.types.every(type => ["attack-roll", "perception-check", "saving-throw", "skill-check"].includes(type))
        && Object.keys(clamp).every(key => ["min", "max", "types"].includes(key));
}

/** A note's stated number at the cast rank. */
export function noteAmountAt(rankAmount, castRank) {
    const steps = Math.max(0, Math.floor((Number(castRank) - rankAmount.baseRank) / rankAmount.interval));
    return Math.floor((rankAmount.base + steps * rankAmount.step) * rankAmount.multiplier);
}

const escape = text => String(text ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

/** The note's text at the cast rank (its last rank entry reached, or its own). */
export function noteTextAt(note, castRank) {
    return [...(note.rankText ?? [])].reverse().find(entry => Number(castRank) >= entry.fromRank)?.text ?? note.text;
}

/** The Effect item source for one note on one creature. */
export function prepareNoteEffectSource(note, runtime) {
    const unlimited = note?.duration?.mode === "unlimited";
    if (!validNoteEffect(note) || (!unlimited && note.duration.value == null) || !runtime.castId || !runtime.sourceActorUuid || !runtime.targetActorUuid)
        throw new Error("A note Effect lacks its text, duration or ownership.");
    if (note.spellDC && !Number.isFinite(Number(runtime.dc))) throw new Error("A note Effect's check needs the spell DC.");
    const anchored = !unlimited && ["source-turn", "target-turn"].includes(note.duration.anchor) && runtime.effectStart;
    const timing = anchored ? nativeConditionTiming({ ...note.duration }, runtime.effectStart, runtime.sourceActorUuid, runtime.targetActorUuid)
        : { value: note.duration.value, originActorUuid: runtime.sourceActorUuid };
    return {
        name: `${runtime.sourceItemName}: ${note.label}`,
        type: "effect", img: "icons/svg/book.svg",
        flags: { [MODULE_ID]: { runtime: { schema: 1, kind: "note-effect", castInstanceId: runtime.castId, sourceActorUuid: runtime.sourceActorUuid,
            sourceItemUuid: runtime.sourceItemUuid, sourceItemName: runtime.sourceItemName, targetActorUuid: runtime.targetActorUuid, degree: runtime.degree,
            // Damage the spell deals when the GM reports its trigger (an Ongoing control on this note).
            ...(note.triggeredDamage ? { triggeredDamage: { ...note.triggeredDamage, castRank: runtime.castRank, targetName: runtime.targetName ?? null } } : {}),
            // (Ongoing spells' question control: the creature's check against this DC.)
            ...(note.questionCheck ? { questionCheck: { ...JSON.parse(JSON.stringify(note.questionCheck)), dc: Number(runtime.dc) } } : {}),
            // (Ongoing spells' "Counteract with …" control, at the cast rank.)
            ...(note.ward ? { ward: { ...note.ward, rank: Number(runtime.castRank) } } : {}),
            // (The Ongoing record's end-of-turn save reads it from here.)
            ...(note.recurringSave ? { recurringSave: { timing: note.recurringSave.timing, mode: note.recurringSave.mode, statistic: note.recurringSave.statistic,
                ...(note.recurringSave.condition ? { condition: { ...note.recurringSave.condition } } : {}), ...(note.recurringSave.endOnCriticalSuccess ? { endOnCriticalSuccess: true } : {}) } } : {}),
            // (persistent-link-runtime.js removes it when the persistent damage ends.)
            ...(note.whilePersistent ? { persistentLink: { damageType: note.whilePersistent } } : {}),
            // (A lingering area's clearLeaveArea removes it when the creature leaves.)
            ...(note.whileInArea && runtime.lingeringCastId ? { leaveAreaNote: true } : {}),
            // (Whispered when the note ends: reveal-runtime.js, from the Ongoing record.)
            ...(note.reveal ? { reveal: { ...note.reveal } } : {}),
            // (Ongoing spells' Disbelieve control rolls against this DC.)
            ...(note.disbelieve ? { disbelieve: { ...note.disbelieve, dc: Number(runtime.dc) } } : {}),
            // (Ongoing spells' control rolls the creature's save against this DC; a success ends the spell.)
            ...(note.endSave ? { endSave: { ...note.endSave, dc: Number(runtime.dc) } } : {}),
            ...(note.triggeredIncrease ? { triggeredIncrease: { ...note.triggeredIncrease } } : {}),
            ...(note.triggeredPenalty ? { triggeredPenalty: JSON.parse(JSON.stringify(note.triggeredPenalty)) } : {}),
            ...(note.recallEscape ? { recallEscape: { ...JSON.parse(JSON.stringify(note.recallEscape)), dc: Number(runtime.dc) } } : {}),
            // (minion-control-runtime.js gives the caster's owners the token, and restores it when this ends.)
            ...(note.minionControl ? { minionControl: true } : {}),
            // (d20-clamp.js reads it on each check; incarnate-parts-runtime.js deals the damage as the creature's turn starts.)
            ...(note.d20Clamp ? { d20Clamp: JSON.parse(JSON.stringify(note.d20Clamp)) } : {}),
            ...(note.turnStartDamage ? { turnStartDamage: { ...note.turnStartDamage, castRank: runtime.castRank } } : {}),
            ...(note.conditionHold ? { conditionHold: { ...note.conditionHold } } : {}),
            ...(note.conditionFloor ? { conditionFloor: { ...note.conditionFloor } } : {}),
            ...(note.consumedBySourceAttack ? { consumedBySourceAttack: true } : {}),
            ...(note.holdsPersistent ? { holdsPersistent: { dc: note.holdsPersistent.dc } } : {}),
            ...(note.castForbid ? { castForbid: { trait: note.castForbid.trait } } : {}),
            ...(note.castFlatCheck ? { castFlatCheck: { dc: note.castFlatCheck.dc, ...(note.castFlatCheck.trait ? { trait: note.castFlatCheck.trait } : {}) } } : {}),
            // (note-end-runtime.js: the condition after it, the caster's share of lost Hit Points, the creature's death when it ends.)
            ...(note.thenCondition ? { thenCondition: { ...note.thenCondition } } : {}),
            ...(note.hpShare ? { hpShare: { ...note.hpShare } } : {}),
            ...(note.endsInDeath ? { endsInDeath: true } : {}),
            ...(note.zeroToOne ? { zeroToOne: true } : {}),
            // (note-end-runtime.js counts the damage the creature takes and ends the note at the stated total.)
            ...(note.damageLimit ? { damageLimit: note.damageLimit, damageTaken: 0 } : {}),
            ...(note.halfStrikes ? { halfStrikeDamage: true, strikesOnly: true } : {}),
            // (note-end-runtime.js keeps it with the condition: its Weakness in step, ended when the condition is.)
            ...(note.withCondition ? { withCondition: { ...note.withCondition } } : {}),
            ...(note.sourceSavesBetter ? { sourceSavesBetter: true } : {}),
            ...(note.turnStartFlat ? { turnStartFlat: JSON.parse(JSON.stringify(note.turnStartFlat)) } : {}),
            // (incarnate-parts-runtime.js rolls it as the creature's turn starts, against this DC.)
            ...(note.turnStartAttack ? { turnStartAttack: { ...JSON.parse(JSON.stringify(note.turnStartAttack)), dc: Number(runtime.dc) } } : {}),
            // (Ongoing spells' control heals the caster each time the GM reports it.)
            ...(note.triggeredHealing ? { triggeredHealing: { ...note.triggeredHealing, castRank: runtime.castRank, targetName: runtime.targetName ?? null } } : {}) },
            // (An Escape against the spell DC ends it: escape-termination.js offers the GM the button.)
            // (Or a set time after it leaves — Enchanting Rhapsody's "and for 1 round after".)
            ...(note.whileInArea ? (runtime.lingeringCastId ? { leaveArea: { castId: runtime.lingeringCastId, ...(note.afterLeaveRounds ? { afterRounds: note.afterLeaveRounds } : {}), ...(note.afterLeaveRules ? { afterRules: JSON.parse(JSON.stringify(note.afterLeaveRules)) } : {}) } } : (() => { throw new Error("A note that lasts while the creature is in the area needs its lingering area."); })()) : {}),
            ...(note.escape ? { outcomeEffect: { castId: runtime.castId, sourceActorUuid: runtime.sourceActorUuid, sourceItemUuid: runtime.sourceItemUuid, sourceItemName: runtime.sourceItemName,
                conditions: [], escape: { dc: Number(runtime.dc), event: "escape", expirationMode: "event" } } } : {}) } },
        system: {
            level: { value: runtime.castRank },
            description: { value: `<p><strong>GM / player:</strong> ${escape((note.rankAmount ? noteTextAt(note, runtime.castRank).replaceAll("{amount2}", note.rankAmount2 ? String(noteAmountAt(note.rankAmount2, runtime.castRank)) : "{amount2}").replaceAll("{amount}", String(noteAmountAt(note.rankAmount, runtime.castRank))) : noteTextAt(note, runtime.castRank))
                .replaceAll("{dc}", note.spellDC ? String(Number(runtime.dc)) : "{dc}"))}</p><p><em>${note.rules?.length ? "The module applies the stated rules (conditions and modifiers); the rest is yours to play" : "The module doesn't enforce this; it reminds you until the effect ends"}.</em></p>` },
            duration: unlimited ? { value: -1, unit: "unlimited", expiry: null, sustained: false } : { value: timing.value, unit: note.duration.unit, expiry: note.duration.expiry ?? "turn-start", sustained: false },
            ...(note.counter ? { badge: { type: "counter", value: note.counter, max: note.counter } } : {}),
            ...(runtime.effectStart ? { start: { value: runtime.effectStart.value, initiative: runtime.effectStart.initiative } } : {}),
            context: { origin: { actor: timing.originActorUuid ?? runtime.sourceActorUuid, item: runtime.sourceItemUuid }, target: { actor: runtime.targetActorUuid }, roll: null },
            // (A modifier is labelled with the spell: PF2e would show the Effect's name after its colon, "Spell's effect".)
            rules: (note.rules ?? []).map(rule => ({ ...rule, ...(["FlatModifier", "RollOption"].includes(rule.key) && !rule.label ? { label: runtime.sourceItemName } : {}),
                // (The cast rank's value: Summon Jury's heightened penalties.)
                ...(rule.key === "FlatModifier" && note.rankValues ? { value: [...note.rankValues].reverse().find(entry => Number(runtime.castRank) >= entry.fromRank)?.value ?? rule.value } : {}),
                // (The caster's signature, for a penalty against the caster only.)
                ...(Array.isArray(rule.predicate) && rule.predicate.includes("origin:signature:{caster-signature}")
                    ? { predicate: rule.predicate.map(term => term === "origin:signature:{caster-signature}" ? `origin:signature:${fromUuidSync(runtime.sourceActorUuid)?.signature ?? "none"}` : term) } : {}) }))
        }
    };
}

/** A spell note's duration: fixed (possibly the maximum of a sustained spell) or unlimited. Instantaneous spells have none. */
export function validSpellNoteDuration(duration) {
    if (duration?.mode === "unlimited") return true;
    return duration?.mode === "fixed" && Number.isInteger(duration.value) && duration.value > 0 && UNITS.has(duration.unit)
        && (duration.expiry == null || ["turn-start", "turn-end"].includes(duration.expiry))
        && (duration.anchor == null || ["effect-start", "source-turn", "target-turn", "current-turn"].includes(duration.anchor));
}

const SKILLS = new Set(["acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy", "intimidation", "medicine", "nature", "occultism",
    "performance", "religion", "society", "stealth", "survival", "thievery"]);
/** A generated rule a spell note may carry: a flat status, circumstance or item bonus (+1 to +4) to one recipient statistic. */
// A row note's resistance ("The target gains fire resistance 2."), fixed or heightened at the note's level (its cast rank). Only a
// save row's "Spell's effect" note carries it; a spell note doesn't.
const CURSE_SKILLS = new Set(["acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy", "intimidation", "medicine", "nature", "occultism", "performance", "religion", "society", "stealth", "survival", "thievery"]);
export function validRowNoteRule(rule) {
    // Off-guard against the caster's attacks only ("Off-Guard to you"): PF2e's off-guard slug, its predicate the caster's signature (filled in when made).
    if (rule?.key === "FlatModifier" && rule.slug === "off-guard") return Object.keys(rule).every(key => ["key", "selector", "type", "slug", "value", "predicate"].includes(key)) && rule.selector === "ac"
        && rule.type === "circumstance" && rule.value === -2 && JSON.stringify(rule.predicate) === '["origin:signature:{caster-signature}"]';
    // (An AC set to the stated number — "Your familiar's AC becomes 28" — the difference from the creature's own AC, worked out when it's made.)
    if (rule?.key === "FlatModifier" && rule.slug === "ac-set") return Object.keys(rule).every(key => ["key", "selector", "type", "value", "slug"].includes(key)) && rule.selector === "ac" && rule.type === "untyped"
        && Number.isInteger(rule.value) && Math.abs(rule.value) <= 40;
    // "The clumsy condition inflicted by this spell increases by 1 while the target is taking persistent bleed damage.": the condition's value raised while
    // PF2e's persistent damage of that type is on the creature.
    if (rule?.key === "ItemAlteration" && rule.itemType === "condition") return Object.keys(rule).every(key => ["key", "itemType", "mode", "property", "value", "predicate"].includes(key))
        && rule.mode === "add" && rule.property === "badge-value" && Number.isInteger(rule.value) && rule.value >= 1 && rule.value <= 2 && Array.isArray(rule.predicate) && rule.predicate.length === 2
        && /^item:slug:[a-z-]+$/.test(rule.predicate[0]) && /^self:condition:persistent-damage:[a-z]+$/.test(rule.predicate[1]);
    // Invoke the Harrow's boons: an unconditional status bonus, temporary Hit Points at the rank, a fortune (or a toggled misfortune) on one check.
    // (A bonus only; a penalty falls through to the checks below.)
    if (rule?.key === "FlatModifier" && rule.predicate == null && ["damage", "ac", "skill-check", "saving-throw"].includes(rule.selector) && Number(rule.value) > 0)
        return Object.keys(rule).every(key => ["key", "selector", "type", "value"].includes(key)) && (rule.type === "status" || (rule.type === "circumstance" && rule.selector === "ac")) && Number.isInteger(rule.value) && rule.value >= 1 && rule.value <= 4;
    // (A size the form gives — "they become large" — and an AC set to the stated number, the difference worked out when it's made.)
    if (rule?.key === "CreatureSize") return Object.keys(rule).every(key => ["key", "value"].includes(key)) && ["tiny", "sm", "med", "lg", "huge", "grg"].includes(rule.value);
    // (Resistance with its stated exception: "resistance 10 to all physical damage (except adamantine)".)
    if (rule?.key === "Resistance" && Array.isArray(rule.exceptions)) return Object.keys(rule).every(key => ["key", "type", "value", "exceptions"].includes(key)) && /^[a-z-]+$/.test(rule.type ?? "")
        && Number.isInteger(rule.value) && rule.value >= 1 && rule.value <= 30 && rule.exceptions.length === 1 && rule.exceptions.every(entry => /^[a-z-]+$/.test(entry));
    // (Or a stated number: "A creature animated in this way has 60 temporary Hit Points.")
    if (rule?.key === "TempHP") return Object.keys(rule).every(key => ["key", "value"].includes(key)) && (/^[1-4]\*@item\.level$/.test(String(rule.value)) || (Number.isInteger(rule.value) && rule.value > 0 && rule.value <= 200));
    if (rule?.key === "RollTwice" && rule.selector === "check") return Object.keys(rule).every(key => ["key", "selector", "keep", "removeAfterRoll", "predicate"].includes(key)) && rule.removeAfterRoll === true
        && ((rule.keep === "higher" && rule.predicate == null) || (rule.keep === "lower" && Array.isArray(rule.predicate) && rule.predicate.length === 1 && /^[a-z-]+$/.test(rule.predicate[0])));
    // Fortune or misfortune on damage rolls, Perception checks and saving throws for the note's time (Summon Irii).
    if (rule?.key === "RollTwice" && JSON.stringify(rule.selector) === '["damage","perception","saving-throw"]')
        return Object.keys(rule).every(key => ["key", "selector", "keep"].includes(key)) && ["higher", "lower"].includes(rule.keep);
    // A curse's skills rolled twice keeping the lower, for the note's time (Clownish Curse).
    if (rule?.key === "RollTwice" && Array.isArray(rule.selector) && rule.selector.length >= 1 && rule.selector.every(skill => CURSE_SKILLS.has(skill) || skill === "perception"))
        return Object.keys(rule).every(key => ["key", "selector", "keep"].includes(key)) && rule.keep === "lower";
    // "If the target rolls a failure at an Acrobatics … check, it gets a critical failure instead.": PF2e's degree adjustment on that skill.
    // (Daydreamer's Curse: a critical success at a Perception or skill check of an action with the concentrate trait is a success; or every
    // concentrate check one degree worse — PF2e's "item:trait:concentrate" roll option.)
    if (rule?.key === "AdjustDegreeOfSuccess") return Object.keys(rule).every(key => ["key", "selector", "adjustment", "predicate"].includes(key))
        && ((CURSE_SKILLS.has(rule.selector) && JSON.stringify(rule.adjustment) === '{"failure":"to-critical-failure"}' && rule.predicate == null)
            || (["perception", "skill-check"].includes(rule.selector) && JSON.stringify(rule.adjustment) === '{"criticalSuccess":"to-success"}' && JSON.stringify(rule.predicate) === '["item:trait:concentrate"]')
            // (Curse of the Spirit Orchestra: at any skill check, a critical success is a success, a failure a critical failure.)
            || (rule.selector === "skill-check" && ['{"criticalSuccess":"to-success"}', '{"failure":"to-critical-failure"}'].includes(JSON.stringify(rule.adjustment)) && rule.predicate == null)
            || (rule.selector === "check" && JSON.stringify(rule.adjustment) === '{"all":"one-degree-worse"}' && JSON.stringify(rule.predicate) === '["item:trait:concentrate"]'));
    // Misfortune on the next (or every) attack roll and skill check (Incarnate Faerie Revelers' Mischance).
    // (Or the triggering attack roll only: Defensive Prescience.)
    if (rule?.key === "RollTwice") return Object.keys(rule).every(key => ["key", "selector", "keep", "removeAfterRoll"].includes(key)) && rule.keep === "lower"
        && (JSON.stringify(rule.selector) === '["attack-roll","skill-check"]' || (rule.selector === "attack-roll" && rule.removeAfterRoll === true)
            // (The next attack roll or save: The End is Nigh.)
            || (JSON.stringify(rule.selector) === '["attack-roll","saving-throw"]' && rule.removeAfterRoll === true)
            // (Initiative rolls for the note's time: Dull Ambition.)
            || (rule.selector === "initiative" && rule.removeAfterRoll == null)
            // (The next roll of one kind: Shaken Confidence's attack roll, Perception check or one skill.)
            || (rule.removeAfterRoll === true && (["attack-roll", "perception", "saving-throw"].includes(rule.selector) || CURSE_SKILLS.has(rule.selector))))
        && (rule.removeAfterRoll == null || rule.removeAfterRoll === true);
    // A PF2e condition the note grants (optionally only to a creature that has another condition: "self:condition:invisible").
    if (rule?.key === "GrantItem") return Object.keys(rule).every(key => ["key", "uuid", "flag", "allowDuplicate", "onDeleteActions", "predicate", "alterations"].includes(key))
        // (A valued condition at the row's value: "Clumsy 2".)
        && (rule.alterations == null || (Array.isArray(rule.alterations) && rule.alterations.length === 1 && rule.alterations[0].mode === "override"
            && rule.alterations[0].property === "badge-value" && Number.isInteger(rule.alterations[0].value) && rule.alterations[0].value >= 1 && rule.alterations[0].value <= 4))
        && /^Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+$/.test(rule.uuid ?? "") && /^condition[A-Za-z]+$/.test(rule.flag ?? "")
        && (rule.predicate == null || (Array.isArray(rule.predicate) && rule.predicate.every(term => /^self:condition:[a-z-]+$/.test(term))));
    // A toggle the table switches on, and the modifier it gates ("against attacks by followers of your faith").
    if (rule?.key === "RollOption") return rule.toggleable === true && /^[a-z-]+$/.test(rule.option ?? "") && Object.keys(rule).every(key => ["key", "domain", "option", "toggleable", "label", "value"].includes(key));
    if (rule?.key === "FlatModifier" && Array.isArray(rule.predicate) && rule.predicate.length === 1 && /^[a-z]+(?:-[a-z]+){2,}$/.test(rule.predicate[0]) && !/^item:/.test(rule.predicate[0]))
        return Object.keys(rule).every(key => ["key", "selector", "type", "value", "predicate"].includes(key)) && ["ac", "saving-throw", "attack-roll"].includes(rule.selector)
            && ["status", "circumstance"].includes(rule.type) && Number.isInteger(rule.value) && Math.abs(rule.value) >= 1 && Math.abs(rule.value) <= 4;
    // Cover's other parts (Ice Guardian's standard cover): circumstance to Reflex saves against area effects, and to Stealth to Hide, Sneak or avoid detection.
    if (rule?.key === "FlatModifier" && rule.selector === "reflex" && JSON.stringify(rule.predicate) === '["area-effect"]')
        return Object.keys(rule).every(key => ["key", "selector", "type", "value", "predicate"].includes(key)) && rule.type === "circumstance" && [1, 2, 4].includes(rule.value);
    if (rule?.key === "FlatModifier" && rule.selector === "stealth" && JSON.stringify(rule.predicate) === '[{"or":["action:hide","action:sneak","avoid-detection"]}]')
        return Object.keys(rule).every(key => ["key", "selector", "type", "value", "predicate"].includes(key)) && rule.type === "circumstance" && [1, 2, 4].includes(rule.value);
    // A status penalty to one attribute's checks, DCs and saves (Planar Court): PF2e's "-based" selector.
    if (rule?.key === "FlatModifier" && /^(?:str|dex|con|int|wis|cha)-based$/.test(rule.selector ?? "") && rule.predicate == null)
        return Object.keys(rule).every(key => ["key", "selector", "type", "value"].includes(key)) && rule.type === "status" && Number.isInteger(rule.value) && rule.value < 0 && rule.value >= -4;
    // A status penalty to saves against effects of one trait (Enchanting Rhapsody's "saves against mental effects").
    if (rule?.key === "FlatModifier" && rule.selector === "saving-throw" && Array.isArray(rule.predicate) && rule.predicate.length === 1 && ["mental", "emotion", "fear", "auditory", "visual"].includes(rule.predicate[0]))
        return Object.keys(rule).every(key => ["key", "selector", "type", "value", "predicate"].includes(key)) && rule.type === "status" && Number.isInteger(rule.value) && rule.value < 0 && rule.value >= -4;
    // A status penalty to attack rolls or saving throws (Summon Jury), or to the next one only (PF2e removes the Effect after that roll).
    if (rule?.key === "FlatModifier" && ["attack-roll", "saving-throw"].includes(rule.selector) && rule.predicate == null)
        return Object.keys(rule).every(key => ["key", "selector", "type", "value", "removeAfterRoll"].includes(key)) && rule.type === "status" && Number.isInteger(rule.value) && rule.value < 0 && rule.value >= -4
            && (rule.removeAfterRoll == null || rule.removeAfterRoll === true);
    // A penalty to Perception checks to Seek (Eternal Slumber's drowsiness): PF2e's "action:seek" option.
    if (rule?.key === "FlatModifier" && rule.selector === "perception" && JSON.stringify(rule.predicate) === '["action:seek"]')
        return Object.keys(rule).every(key => ["key", "selector", "type", "value", "predicate"].includes(key)) && rule.type === "status" && Number.isInteger(rule.value) && rule.value < 0 && rule.value >= -4;
    // A penalty to the creature's checks with named traits (Drown: "checks it makes with the auditory or linguistics traits") — PF2e's item trait options.
    if (rule?.key === "FlatModifier" && rule.selector === "check" && Array.isArray(rule.predicate) && rule.predicate.length === 1)
        return Object.keys(rule).every(key => ["key", "selector", "type", "value", "predicate"].includes(key)) && ["status", "circumstance"].includes(rule.type) && Number.isInteger(rule.value) && rule.value < 0 && rule.value >= -4
            && (/^item:trait:[a-z-]+$/.test(rule.predicate[0]) || (Array.isArray(rule.predicate[0]?.or) && Object.keys(rule.predicate[0]).length === 1 && rule.predicate[0].or.length >= 2 && rule.predicate[0].or.every(term => /^item:trait:[a-z-]+$/.test(term))));
    // A penalty to Strikes with named attacks ("Strikes with its jaws or teeth"): PF2e's item slug of the Strike.
    // A penalty to the creature's skill checks and Perception checks ("a –1 status penalty to skill checks and Perception checks"), no predicate.
    if (rule?.key === "FlatModifier" && JSON.stringify(rule.selector) === '["skill-check","perception"]')
        return Object.keys(rule).every(key => ["key", "selector", "type", "value"].includes(key)) && ["status", "circumstance"].includes(rule.type) && Number.isInteger(rule.value) && rule.value < 0 && rule.value >= -4;
    if (rule?.key === "FlatModifier" && rule.selector === "strike-attack-roll")
        return Object.keys(rule).every(key => ["key", "selector", "type", "value", "predicate"].includes(key)) && Array.isArray(rule.predicate) && rule.predicate.length === 1
            && Array.isArray(rule.predicate[0]?.or) && Object.keys(rule.predicate[0]).length === 1 && rule.predicate[0].or.length >= 1 && rule.predicate[0].or.length <= 3
            && rule.predicate[0].or.every(term => /^item:slug:[a-z-]+$/.test(term))
            && ["status", "circumstance"].includes(rule.type) && Number.isInteger(rule.value) && rule.value < 0 && rule.value >= -4;
    // An attribute modifier set outright (Never Mind's critical failure: Charisma, Intelligence and Wisdom treated as –5).
    // (Or PF2e's "can't flank": Lost in the Crowd's "treat all creatures as enemies for the purpose of determining flanking".)
    if (rule?.key === "ActiveEffectLike" && rule.path === "system.attributes.flanking.canFlank") return Object.keys(rule).every(key => ["key", "mode", "path", "value"].includes(key)) && rule.mode === "override" && rule.value === false;
    if (rule?.key === "ActiveEffectLike") return Object.keys(rule).every(key => ["key", "mode", "path", "value"].includes(key)) && rule.mode === "override"
        && /^system\.abilities\.(?:str|dex|con|int|wis|cha)\.mod$/.test(rule.path ?? "") && Number.isInteger(rule.value) && rule.value >= -5 && rule.value <= 0;
    // A light the row's creature sheds ("sheds bright light in a 20-foot emanation (and dim light to the next 40 feet)").
    if (rule?.key === "TokenLight") return Object.keys(rule).every(key => ["key", "value"].includes(key)) && Object.keys(rule.value ?? {}).every(key => ["bright", "dim"].includes(key))
        && Number.isInteger(rule.value?.bright) && rule.value.bright >= 0 && rule.value.bright <= 120 && Number.isInteger(rule.value?.dim) && rule.value.dim >= rule.value.bright && rule.value.dim <= 240;
    // An immunity and a Speed the row's state gives (Shadow Zombie's vapor: "is immune to precision damage", "a fly Speed of 10 feet").
    if (rule?.key === "Immunity") return Object.keys(rule).every(key => ["key", "type"].includes(key)) && /^[a-z-]+$/.test(rule.type ?? "");
    // A weakness the row's state gives ("weakness 5 to bludgeoning", "weakness 3 to sonic and bludgeoning damage").
    // (Or the cast rank's: "weakness 4 …" with "Heightened (+1) The weakness … increases by 1" is "@item.level", "(@item.level+1)", doubled "…*2".)
    if (rule?.key === "Weakness") return Object.keys(rule).every(key => ["key", "type", "value"].includes(key))
        && ((Number.isInteger(rule.value) && rule.value >= 1 && rule.value <= 30) || /^(?:@item\.level|\(@item\.level[+-]\d{1,2}\))(?:\*2)?$/.test(String(rule.value)))
        && ([rule.type].flat().length >= 1 && [rule.type].flat().every(type => /^[a-z-]+$/.test(type ?? "")));
    if (rule?.key === "BaseSpeed") return Object.keys(rule).every(key => ["key", "selector", "value"].includes(key)) && ["fly", "swim", "climb", "burrow"].includes(rule.selector)
        && Number.isInteger(rule.value) && rule.value > 0 && rule.value % 5 === 0;
    if (rule?.key === "Resistance" && Object.keys(rule).every(key => ["key", "type", "value"].includes(key)) && /^[a-z]+$/.test(rule.type ?? ""))
        return (Number.isInteger(rule.value) && rule.value >= 1 && rule.value <= 30)
            || /^\d+ \+ floor\(\(@item\.level - \d+\) \/ \d+\) \* \d+$/.test(String(rule.value));
    return validNoteRule(rule);
}

export function validNoteRule(rule) {
    // A plain PF2e condition the note grants (Possession's caster: Unconscious while possessing).
    if (rule?.key === "GrantItem" && Object.keys(rule).every(key => ["key", "uuid", "flag"].includes(key))) return /^Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+$/.test(rule.uuid ?? "") && /^condition[A-Za-z]+$/.test(rule.flag ?? "");
    // A Speed the spell grants ("Your familiar gains a 20-foot fly Speed."; Migration's land Speed too — PF2e 8's BaseSpeed takes "land").
    if (rule?.key === "BaseSpeed") return Object.keys(rule).every(key => ["key", "selector", "value"].includes(key)) && ["land", "fly", "swim", "climb", "burrow"].includes(rule.selector)
        && Number.isInteger(rule.value) && rule.value > 0 && rule.value % 5 === 0;
    // A Speed penalty in 5-foot steps ("a –10-foot circumstance penalty to its Speed").
    if (rule?.key === "FlatModifier" && ["land-speed", "all-speeds"].includes(rule.selector) && Object.keys(rule).every(key => ["key", "selector", "type", "value"].includes(key)))
        return ["status", "circumstance"].includes(rule.type) && Number.isInteger(rule.value) && rule.value < 0 && rule.value >= -30 && rule.value % 5 === 0;
    // "Actions you take with the auditory trait take a –2 circumstance penalty": the caster's checks of its spells or actions with the trait.
    if (rule?.key === "FlatModifier" && rule.selector === "all" && Array.isArray(rule.predicate) && rule.predicate.length === 1 && Array.isArray(rule.predicate[0]?.or)) {
        const [spell, action] = rule.predicate[0].or;
        const trait = /^item:trait:([a-z-]+)$/.exec(spell ?? "")?.[1];
        return !!trait && rule.predicate[0].or.length === 2 && action === `self:action:trait:${trait}` && Object.keys(rule.predicate[0]).length === 1
            && Object.keys(rule).every(key => ["key", "selector", "type", "value", "predicate"].includes(key))
            && ["status", "circumstance"].includes(rule.type) && Number.isInteger(rule.value) && rule.value < 0 && rule.value >= -4;
    }
    // An untyped penalty to one skill for two actions ("You take a -2 penalty to Stealth checks to Hide and Sneak.").
    if (rule?.key === "FlatModifier" && rule.type === "untyped" && SKILLS.has(rule.selector) && Array.isArray(rule.predicate) && rule.predicate.length === 1
        && Array.isArray(rule.predicate[0]?.or) && rule.predicate[0].or.length === 2 && rule.predicate[0].or.every(term => /^action:[a-z-]+$/.test(term)) && Object.keys(rule.predicate[0]).length === 1)
        return Object.keys(rule).every(key => ["key", "selector", "type", "value", "predicate"].includes(key)) && Number.isInteger(rule.value) && rule.value < 0 && rule.value >= -4;
    // An optional predicate is only "against effects with a trait" (["item:trait:emotion"]).
    return rule?.key === "FlatModifier" && Object.keys(rule).every(key => ["key", "selector", "type", "value", "predicate"].includes(key))
        && (rule.predicate == null || (Array.isArray(rule.predicate) && rule.predicate.length === 1 && /^item:trait:[a-z-]+$/.test(rule.predicate[0])))
        && (["saving-throw", "fortitude", "reflex", "will", "ac", "perception", "attack-roll", "skill-check", "spell-attack-roll", "spell-dc", "initiative", "all"].includes(rule.selector) || SKILLS.has(rule.selector))
        && ["status", "circumstance", "item"].includes(rule.type) && Number.isInteger(rule.value) && Math.abs(rule.value) >= 1 && Math.abs(rule.value) <= 4
        // A penalty is status or circumstance only.
        && (rule.value > 0 || rule.type !== "item");
}

/**
 * The Effect item source for a spell note (a spell the module can't carry out mechanically) on one creature: the spell's
 * rules at the cast rank as the description, the spell's duration, and — for a spell placing something in the environment —
 * a line telling the GM to mark the area on the map.
 */
export function prepareSpellNoteEffectSource(note, runtime) {
    if (!validSpellNoteDuration(note?.duration) || typeof runtime?.text !== "string" || !runtime.text
        || !runtime.castId || !runtime.sourceActorUuid || !runtime.targetActorUuid)
        throw new Error("A spell note lacks its text, duration or ownership.");
    const rules = note.rules ?? [];
    if (!Array.isArray(rules) || !rules.every(validNoteRule)) throw new Error("A spell note carries a rule the module doesn't generate.");
    const unlimited = note.duration.mode === "unlimited";
    const anchored = !unlimited && ["source-turn", "target-turn", "current-turn"].includes(note.duration.anchor) && runtime.effectStart;
    const timing = unlimited ? { value: -1, originActorUuid: runtime.sourceActorUuid }
        : anchored ? nativeConditionTiming({ ...note.duration }, runtime.effectStart, runtime.sourceActorUuid, runtime.targetActorUuid)
            : { value: note.duration.value, originActorUuid: runtime.sourceActorUuid };
    const paragraphs = runtime.text.split("\n").filter(Boolean).map(line => `<p>${escape(line)}</p>`).join("");
    const area = note.environment ? `<p class="pf2e-auto-gm-reminder" data-visibility="gm"><strong>GM:</strong> mark the spell's area on the map${note.area?.value ? ` (${note.area.value}-foot ${escape(note.area.type ?? "area")})` : ""}; the module doesn't track it.</p>` : "";
    const sustained = note.duration.sustained ? "<p><em>Sustained: remove this Effect when the caster stops Sustaining the spell.</em></p>" : "";
    return {
        name: `Spell Note: ${runtime.sourceItemName}${note.environment ? " (area)" : ""}`,
        type: "effect", img: runtime.img || "icons/svg/book.svg",
        flags: { [MODULE_ID]: { runtime: { schema: 1, kind: "spell-note", castInstanceId: runtime.castId, sourceActorUuid: runtime.sourceActorUuid,
            sourceItemUuid: runtime.sourceItemUuid, sourceItemName: runtime.sourceItemName, targetActorUuid: runtime.targetActorUuid, environment: note.environment === true } } },
        system: {
            level: { value: runtime.castRank },
            description: { value: `${area}${paragraphs}${sustained}<p><em>${rules.length ? `The module applies the stated ${rules.every(rule => rule.value < 0) ? "penalty" : "bonus"} (${rules.map(rule => `${rule.value < 0 ? "−" : "+"}${Math.abs(rule.value)} ${rule.type} to ${rule.selector === "all" ? "checks" : rule.selector}${rule.predicate?.length === 1 && /^item:trait:/.test(rule.predicate[0]?.or?.[0] ?? rule.predicate[0]) ? ` with the ${String(rule.predicate[0]?.or?.[0] ?? rule.predicate[0]).slice(11)} trait` : ""}`).join(", ")}); the spell's other rules are yours to play` : "The module doesn't enforce this spell's rules; this Effect reminds you until it ends"}.</em></p>` },
            duration: unlimited ? { value: -1, unit: "unlimited", expiry: null, sustained: false }
                : { value: timing.value, unit: note.duration.unit, expiry: note.duration.expiry ?? "turn-start", sustained: note.duration.sustained === true },
            ...(runtime.effectStart ? { start: { value: runtime.effectStart.value, initiative: runtime.effectStart.initiative } } : {}),
            context: { origin: { actor: timing.originActorUuid ?? runtime.sourceActorUuid, item: runtime.sourceItemUuid }, target: { actor: runtime.targetActorUuid }, roll: null },
            rules: rules.map(rule => ({ ...rule, ...(rule.predicate ? { predicate: [...rule.predicate] } : {}) }))
        }
    };
}

/** How many creatures a note spell's Target line allows: “1 creature” → 1, “up to 5 creatures” → 5, “you and up to 4 allies” → 5. */
export function spellNoteTargetLimit(target, heightenedText = "") {
    const text = String(target ?? "").toLowerCase();
    const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, ten: 10 };
    // A heightened entry that applies: “you can target up to five creatures”.
    const raised = /\btarget up to (\d+|one|two|three|four|five|six|ten) (?:willing )?(?:creatures|allies|animals)\b/i.exec(String(heightenedText));
    if (raised) return words[raised[1].toLowerCase()] ?? Number(raised[1]);
    // "The targets increase to you and up to 10 willing creatures." (Shared Invisibility at 5th): the caster too.
    const raisedYou = /\btargets increase to you and up to (\d+) willing creatures\b/i.exec(String(heightenedText));
    if (raisedYou) return Number(raisedYou[1]) + 1;
    // "you and any number of willing allies" (Safeguard Secret): no limit.
    if (/^(?:you and )?any number of\b/.test(text)) return Infinity;
    const you = /^you and (?:up to )?(\d+)/.exec(text);
    if (you) return Number(you[1]) + 1;
    if (/^(?:you and )?the triggering/.test(text)) return text.startsWith("you and") ? 2 : 1;
    const or = /^(\d+) or (\d+)/.exec(text);
    if (or) return Number(or[2]);
    const range = /^(\d+) to (\d+)/.exec(text) ?? /^up to (\d+)/.exec(text);
    if (range) return Number(range[2] ?? range[1]);
    const fixed = /^(\d+|one|two|three)\b/.exec(text);
    if (fixed) return words[fixed[1]] ?? Number(fixed[1]);
    return 1;
}

/**
 * The Effect item source that grants a spell's condition (PF2e's own condition, by GrantItem) for the compiled duration, anchored
 * like the save route's condition Effects. Deleting the Effect removes the condition.
 */
export function prepareConditionGrantSource(condition, template, runtime) {
    const duration = runtime.duration;
    if (duration?.mode !== "fixed" || !Number.isInteger(duration.value) || duration.value < 1 || !UNITS.has(duration.unit)
        || !template || !runtime.castId || !runtime.sourceActorUuid || !runtime.targetActorUuid)
        throw new Error("A granted condition lacks its template, duration or ownership.");
    const valued = template.system?.value?.isValued === true;
    if (valued !== Number.isInteger(condition.value)) throw new Error(`${condition.name}: the condition's value doesn't match PF2e's.`);
    const anchored = ["source-turn", "target-turn", "current-turn"].includes(duration.anchor) && runtime.effectStart;
    const timing = anchored ? nativeConditionTiming({ ...duration }, runtime.effectStart, runtime.sourceActorUuid, runtime.targetActorUuid)
        : { value: duration.value, originActorUuid: runtime.sourceActorUuid };
    const uuid = template._stats?.compendiumSource ?? template.uuid;
    return {
        name: `${runtime.sourceItemName}: ${condition.name}${condition.value ? ` ${condition.value}` : ""}`,
        type: "effect", img: template.img,
        flags: { [MODULE_ID]: { runtime: { schema: 1, kind: "condition-note", castInstanceId: runtime.castId, sourceActorUuid: runtime.sourceActorUuid,
            sourceItemUuid: runtime.sourceItemUuid, sourceItemName: runtime.sourceItemName, targetActorUuid: runtime.targetActorUuid, condition: condition.slug } } },
        system: {
            level: { value: runtime.castRank },
            description: { value: `<p>Applies ${escape(condition.name)}${condition.value ? ` ${condition.value}` : ""} from <strong>${escape(runtime.sourceItemName)}</strong>.</p>${condition.floor ? `<p>${escape(condition.floorText)} <strong>GM:</strong> delete this Effect if it leaves the area.</p>` : ""}` },
            duration: { value: timing.value, unit: duration.unit, expiry: duration.expiry ?? "turn-start", sustained: false },
            ...(runtime.effectStart ? { start: { value: runtime.effectStart.value, initiative: runtime.effectStart.initiative } } : {}),
            context: { origin: { actor: timing.originActorUuid ?? runtime.sourceActorUuid, item: runtime.sourceItemUuid }, target: { actor: runtime.targetActorUuid }, roll: null },
            rules: [{ key: "GrantItem", uuid, flag: "condition1", allowDuplicate: true,
                alterations: condition.value ? [{ mode: "override", property: "badge-value", value: condition.value }] : [],
                // A floor ("can't reduce … below 1 while they remain in the area"): the granted condition can't be removed while this lasts.
                onDeleteActions: { granter: "cascade", grantee: condition.floor ? "restrict" : "cascade" } }]
        }
    };
}
