// Note-only spells whose rule is a check that shapes another roll or spell (Extend Boost, Lingering Composition, Share Burden, Counter
// Performance, Foresee the Path).
import { plainText as plain, splitSentences as split } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|checks?|DC)\b/i;

/** PF2e's level-based DCs (GM Core, standard difficulty). */
export const LEVEL_DC = { "-1": 13, 0: 14, 1: 15, 2: 16, 3: 18, 4: 19, 5: 20, 6: 22, 7: 23, 8: 24, 9: 26, 10: 27, 11: 28, 12: 30, 13: 31, 14: 32, 15: 34, 16: 35, 17: 36, 18: 38,
    19: 39, 20: 40, 21: 42, 22: 44, 23: 46, 24: 48, 25: 50 };
export const levelDC = level => LEVEL_DC[Math.max(-1, Math.min(25, Math.trunc(Number(level) || 0)))];

// Extend Boost / Lingering Composition: "If your next action is to cast X or Y / a cantrip composition with a duration of 1 round, attempt a
// … check. The DC is usually a standard-difficulty DC of your level / of a level equal to the highest-level target … Critical Success The spell
// lasts 4 rounds. Success … 3 rounds. Failure … 1 round, but you don't spend the Focus Point for casting this spell." — the check is rolled
// now; the next matching spell's Effects get that duration, and on a failure its Focus Point is refunded.
const NEXT_NAMED = /^If your next action is to cast (?:@UUID\[[^\]]+\]\{([^}]+)\}|([A-Z][a-z]+(?: [A-Z][a-z]+)*)) or (?:@UUID\[[^\]]+\]\{([^}]+)\}|([A-Z][a-z]+(?: [A-Z][a-z]+)*)), attempt a skill check with the skill associated with the tradition of magic you gain from your eidolon \(such as Nature for a primal eidolon\)\.$/;
const NEXT_COMPOSITION = /^If your next action is to cast a cantrip composition with a duration of 1 round, attempt a @Check\[(performance)\] check\.$/;
const DC_OWN = /^The DC is usually a standard-difficulty DC of your level, but the GM can assign a different DC based on the circumstances\.$/;
const DC_TARGET = /^The DC is usually a standard-difficulty DC of a level equal to the highest-level target of your composition, but the GM can assign a different DC based on the circumstances\.$/;
export function compileSpellshapeDuration(adapted) {
    if (adapted.defense?.kind !== "none" || !/^free$/i.test(String(adapted.activation?.time ?? "").trim())) return null;
    const [body, table, ...extra] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!table || extra.length) return null;
    const sentences = split(plain(body)).map(sentence => sentence.replace(/<\/?em>/g, ""));
    const rawSentences = split(String(body).replace(/<\/?(?:p|em)>/g, "").replace(/\s+/g, " ").trim());
    const nextAt = rawSentences.findIndex(sentence => NEXT_NAMED.test(sentence) || NEXT_COMPOSITION.test(sentence));
    if (nextAt < 0 || rawSentences.length !== nextAt + 3 || rawSentences.at(-1) !== "The effect depends on the result of your check.") return null;
    const named = NEXT_NAMED.exec(rawSentences[nextAt]), composition = NEXT_COMPOSITION.exec(rawSentences[nextAt]);
    const dcOwn = DC_OWN.test(rawSentences[nextAt + 1]), dcTarget = DC_TARGET.test(rawSentences[nextAt + 1]);
    if (!(dcOwn || dcTarget) || (named && !dcOwn) || (composition && !dcTarget)) return null;
    const rows = Object.fromEntries([...table.matchAll(/<strong>\s*(Critical Success|Success|Failure)\s*<\/strong>\s*The (?:spell|composition) lasts (\d+) rounds?(, but you don't spend the Focus Point for casting this spell)?\./g)]
        .map(match => [match[1] === "Critical Success" ? "criticalSuccess" : match[1].toLowerCase(), { rounds: Number(match[2]), refund: Boolean(match[3]) }]));
    if (Object.keys(rows).length !== 3 || !rows.failure?.refund || rows.success.refund || rows.criticalSuccess.refund) return null;
    return { spellshapeDuration: {
        next: named ? { spells: [named[1] ?? named[2], named[3] ?? named[4]] } : { trait: "composition", cantrip: true, baseRounds: 1 },
        skill: composition ? "performance" : "tradition", dc: dcOwn ? "caster-level" : "highest-target-level", durations: rows },
        claimed: [...sentences, ...Object.values(rows).map(row => `${row.rounds} rounds`)] };
}

// Fortissimo Composition: "If your next action is to cast one of these compositions, attempt a @Check[performance|against:will] check." / "The
// DC is usually the highest Will DC of the composition's targets, but the GM can assign a different DC based on the circumstances." / "The
// effect of your composition depends on the result of your check." with the rows "The status bonus from your composition increases to +3." / "+2."
// / "Your composition provides only its normal bonus of +1, but you don't spend the Focus Point for casting this spell." and PF2e's Effect (a
// ChoiceSet whose choices are those bonuses) — the check is rolled now (the DC from the targeted creatures' Will DCs, or the GM's); the next named
// composition's recipients each get PF2e's Effect with the result's bonus selected, and on a failure its Focus Point is refunded.
const NEXT_THESE = /^If your next action is to cast one of these compositions, attempt a @Check\[(performance)\|against:will\] check\.$/;
const DC_TARGET_WILL = /^The DC is usually the highest Will DC of the composition's targets, but the GM can assign a different DC based on the circumstances\.$/;
const BONUS_ROW = /^The status bonus from your composition increases to \+(\d)\.$/;
const REFUND_ROW = /^Your composition provides only its normal bonus of \+1, but you don't spend the Focus Point for casting this spell\.$/;
export function compileSpellshapeEffect(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || String(adapted.targeting?.target ?? "").trim() || String(adapted.lifecycle?.duration ?? "").trim()) return null;
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (links.length !== 1 || links[0].resolutionStatus !== "resolved") return null;
    const [body, table, ...extra] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!table || extra.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    if (paragraphs.length !== 2 || !/^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/.test(paragraphs[1])) return null;
    // The compositions named in the opening (<em>courageous anthem</em>, …).
    const named = [...paragraphs[0].matchAll(/<em>([a-z ]+)<\/em>/g)].map(match => match[1].replace(/\b[a-z]/g, letter => letter.toUpperCase()).replace(/\bOf\b/g, "of"));
    const sentences = split(String(paragraphs[0]).replace(/<\/?em>/g, "").replace(/\s+/g, " ").trim());
    const at = sentences.findIndex(sentence => NEXT_THESE.test(sentence));
    if (named.length < 2 || at < 1 || sentences.length !== at + 3 || !DC_TARGET_WILL.test(sentences[at + 1]) || sentences[at + 2] !== "The effect of your composition depends on the result of your check.") return null;
    if (!/^You call upon your muse to greatly increase the benefits you provide with your [a-z ,]+ composition\.$/.test(sentences.slice(0, at).join(" "))) return null;
    const rows = Object.fromEntries([...table.matchAll(/<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>\s*([^<]+)/g)]
        .map(match => [match[1] === "Critical Success" ? "criticalSuccess" : match[1] === "Critical Failure" ? "criticalFailure" : match[1].toLowerCase(), match[2].trim()]));
    if (Object.keys(rows).join() !== "criticalSuccess,success,failure" || !REFUND_ROW.test(rows.failure)) return null;
    const bonus = { criticalSuccess: BONUS_ROW.exec(rows.criticalSuccess)?.[1], success: BONUS_ROW.exec(rows.success)?.[1] };
    // PF2e's Effect: a ChoiceSet (its flag) offering exactly those bonuses for those degrees.
    const rules = links[0].document?.mechanics?.rules ?? [];
    const choice = rules.find(rule => rule.key === "ChoiceSet");
    const values = Object.fromEntries((Array.isArray(choice?.choices) ? choice.choices : []).map(entry => [/(criticalSuccess|success)$/.exec(String(entry.label))?.[1], Number(entry.value)]));
    if (!bonus.criticalSuccess || !bonus.success || !choice?.flag || values.criticalSuccess !== Number(bonus.criticalSuccess) || values.success !== Number(bonus.success)) return null;
    return { spellshapeEffect: { next: { spells: named }, skill: "performance", dc: "highest-target-will",
        effect: { uuid: links[0].uuid, label: links[0].label ?? links[0].reference, flag: choice.flag }, bonuses: { criticalSuccess: values.criticalSuccess, success: values.success }, refundOn: ["failure"] },
        claimed: [...sentences, ...Object.values(rows)] };
}

// Share Burden: "Trigger An ally within range is about to attempt a saving throw against a harmful emotion effect …" / "Both you and your ally
// use the outcome one degree of success better than the result of your ally's saving throw, even if the triggering effect usually affects only
// one target." — PF2e's AdjustDegreeOfSuccess (one degree better) on the ally's next saving throw against an emotion effect, removed after it.
const BURDEN_TRIGGER = /^Trigger An ally within range is about to attempt a saving throw against a harmful emotion effect, and you would not otherwise have to save against the effect\.$/;
const BURDEN = /^Both you and your ally use the outcome one degree of success better than the result of your ally's saving throw, even if the triggering effect usually affects only one target\.$/;
export function compileSharedSaveBetter(adapted) {
    if (adapted.defense?.kind !== "none" || !/^reaction$/i.test(String(adapted.activation?.time ?? "").trim())) return null;
    const [trigger, body, ...extra] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body ?? ""));
    if (extra.length || !BURDEN_TRIGGER.test(plain(trigger ?? "")) || !BURDEN.test(sentences.at(-1) ?? "") || sentences.slice(0, -1).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const range = /^(\d+) feet$/i.exec(String(adapted.targeting?.range ?? "").trim());
    return { sharedSaveBetter: { trait: "emotion", degrees: 1, rangeFeet: range ? Number(range[1]) : null, sharesOutcome: true }, claimed: [plain(trigger), ...sentences] };
}

// Counter Performance: "Trigger You or an ally within 60 feet rolls a saving throw against an auditory or visual effect." / "Roll a Performance
// check … You and allies in the area can use the better result between your Performance check and the saving throw." — the Performance check is
// rolled; each recent such save of the caster or an ally in the area is re-graded with it when that's better (the card gives the new results).
const COUNTER_TRIGGER = /^Trigger You or an ally within (\d+) feet rolls a saving throw against an auditory or visual effect\.$/;
const COUNTER = /^You and allies in the area can use the better result between your Performance check and the saving throw\.$/;
const COUNTER_ROLL = /^Roll a @Check\[performance\] check for a type you know—it must be an auditory performance if the trigger was auditory or a visual one for a visual trigger, and this action gains the traits for the type of performance\.$/;
export function compileSaveReplacement(adapted) {
    if (adapted.defense?.kind !== "none" || !/^reaction$/i.test(String(adapted.activation?.time ?? "").trim())) return null;
    const [trigger, body, ...extra] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const triggered = COUNTER_TRIGGER.exec(plain(trigger ?? ""));
    const sentences = split(plain(body ?? ""));
    const rollAt = sentences.findIndex(sentence => COUNTER_ROLL.test(sentence));
    if (extra.length || !triggered || rollAt < 0 || !COUNTER.test(sentences[rollAt + 1] ?? "") || sentences.length !== rollAt + 2 || sentences.slice(0, rollAt).some(sentence => NARRATION_RULES.test(sentence))) return null;
    return { saveReplacement: { skill: "performance", rangeFeet: Number(triggered[1]), traits: ["auditory", "visual"], windowSeconds: 60 }, claimed: [plain(trigger), ...sentences] };
}

// Foresee the Path: "Make a Perception check against the target enemy's Will DC or Deception DC, whichever is higher. … The target is then
// temporarily immune for 1 minute." with rows: the ally gains a reaction to Strike the enemy (or forgoes it for a +2/+1 status bonus to melee
// Strikes it makes as reactions) — the check is rolled against that DC, the enemy becomes immune, and on a success the ally gets the Effect
// (the reaction as a note, the bonus on a toggle it switches on for a reaction Strike).
const FORESEE = /^Make a @Check\[perception\]\{Perception check\} against the target enemy's Will DC or Deception DC, whichever is higher\.$/;
export function compilePerceptionAgainstDC(adapted) {
    if (adapted.defense?.kind !== "none" || !/^1 ally and 1 enemy$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [body, table, ...extra] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!table || extra.length) return null;
    const sentences = split(plain(body));
    const at = sentences.findIndex(sentence => FORESEE.test(sentence));
    const immune = /^The target is then temporarily immune for (\d+) minutes?\.$/.exec(sentences.at(-1) ?? "");
    if (at < 0 || !immune || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    if (sentences.slice(at + 1, -1).some(sentence => !/^The GM may judge a different DC is more appropriate if it's higher\b/.test(sentence))) return null;
    const rows = plain(table);
    const crit = /Critical Success The target ally gains a reaction that lets it make a melee Strike against the target enemy, triggered if the enemy leaves a square within the ally's reach\. If the ally already has an ability that lets it make melee Strikes as a reaction, such as (?:@UUID\[[^\]]+\]\{Reactive Strike\}|Reactive Strike), the ally can forgo gaining the temporary reaction to instead gain a \+(\d) status bonus to melee Strikes it makes as reactions\./.exec(rows);
    const success = /Success As critical success, but the status bonus an ally gets if it forgoes the reaction is \+(\d)\./.exec(rows);
    if (!crit || !success || !/Failure The spell has no effect\./.test(rows)) return null;
    return { perceptionAgainstDC: { dcs: ["will", "deception"], immunityMinutes: Number(immune[1]), bonus: { criticalSuccess: Number(crit[1]), success: Number(success[1]) },
        reaction: "a melee Strike against the target enemy, triggered if the enemy leaves a square within the ally's reach" }, claimed: [...sentences, rows] };
}

// Perfected Body: "Trigger You fail or critically fail a saving throw against an effect that has the morph, poison, or polymorph trait, or that would
// make you Clumsy, Doomed, Enfeebled, Petrified, or Sickened." / "You get a failure if you rolled a critical failure or a success if you rolled a
// failure." — the caster's failed save one degree better: on the module's save card still being resolved, the result is corrected; otherwise the
// card names PF2e's last failed save and its new result for the GM. Which effects qualify is the trigger (the caster's reaction).
const UPGRADE_TRIGGER = /^Trigger You fail or critically fail a saving throw against an effect that has the ([a-z]+(?:, [a-z]+)*,? or [a-z]+) traits?, or that would make you ((?:[A-Z][a-z]+, )+or [A-Z][a-z]+)\.$/;
const UPGRADE = /^You get a failure if you rolled a critical failure or a success if you rolled a failure\.$/;
export function compileSaveUpgrade(adapted) {
    if (adapted.defense?.kind !== "none" || !/^reaction$/i.test(String(adapted.activation?.time ?? "").trim())) return null;
    const [trigger, body, ...extra] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const triggered = UPGRADE_TRIGGER.exec(plain(trigger ?? "").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1"));
    const sentences = split(plain(body ?? ""));
    if (extra.length || !triggered || !UPGRADE.test(sentences.at(-1) ?? "") || sentences.length > 2 || sentences.slice(0, -1).some(sentence => NARRATION_RULES.test(sentence))) return null;
    return { saveUpgrade: { traits: triggered[1].split(/,\s*(?:or\s+)?|\s+or\s+/).map(trait => trait.trim()).filter(Boolean),
        conditions: triggered[2].split(/,\s*(?:or\s+)?/).map(name => name.trim()).filter(Boolean), map: { criticalFailure: "failure", failure: "success" }, windowSeconds: 60,
        trigger: plain(trigger).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/^Trigger /, "") }, claimed: [plain(trigger), ...sentences] };
}
