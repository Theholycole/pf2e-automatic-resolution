// Direct healing: "The target regains 1d10+4 Hit Points when you Cast the
// Spell …", "You restore 1d10 Hit Points to your animal companion." The spell
// has one healing entry and no save. Its healing sentence is claimed here; any
// other rule text is returned for the linked Effect's completeness check (or,
// with no Effect, must be narration). Action-count paragraphs are accepted
// only when the item is the PF2e variant whose healing entry matches them.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";
import { DICE_OR_FLAT as DICE } from "./text-patterns.js";

const HEALS = [
    // "The target regains 1d10+4 Hit Points when you Cast the Spell and gains a +2 status bonus … for the duration."
    new RegExp(String.raw`^The target regains ${DICE} Hit Points(?: when you Cast the Spell)?(?:,? and (.+?))?\.$`),
    // "You restore 1d10 Hit Points to your animal companion."
    new RegExp(String.raw`^You restore ${DICE} Hit Points to (?:your animal companion|the target)()\.$`),
    // "You heal an animal's wounds, restoring 1d8 Hit Points to the target."
    new RegExp(String.raw`^You heal (?:an? [a-z ]+|your [a-z ]+)'s wounds, restoring ${DICE} Hit Points to the target()\.$`),
    // "Each target regains 3d6 Hit Points."
    new RegExp(String.raw`^Each target regains ${DICE} Hit Points()\.$`),
    // "That creature regains 1d8 Hit Points immediately and gains fast healing 1 for as long as …" (the creature chosen near the thrall)
    new RegExp(String.raw`^That creature regains ${DICE} Hit Points immediately(?:,? and (.+?))?\.$`),
    // Hero's Defiance (a free action as an attack would bring you to 0 HP): "Just before applying the attack's damage, you recover 6d8+20 Hit Points." — the
    // caster's healing, before the GM applies the attack.
    new RegExp(String.raw`^Just before applying the attack's damage, you recover ${DICE} Hit Points()\.$`),
    // A reaction to a death: "You prevent the target from dying and restore 5d8 Hit Points to the target." The healing,
    // applied before the death takes effect, is what prevents it.
    new RegExp(String.raw`^You prevent the target from dying and restore ${DICE} Hit Points to the target()\.$`),
    // Quick Siphon (a third-party reaction): "You regain 10 Hit Points and can choose to immediately end one instance of persistent bleed damage
    // you are suffering from." — the caster's healing; the ended persistent damage is the caster's pick on the card.
    new RegExp(String.raw`^You regain ${DICE} Hit Points(?: and (can choose to immediately end one instance of persistent [a-z]+ damage you are suffering from))?\.$`)
];
// That rider: which persistent damage the caster may end.
const END_PERSISTENT = /^can choose to immediately end one instance of persistent ([a-z]+) damage you are suffering from$/;
// "Heightened (+1) Increase the Hit Points you regain by 2." — a flat step, checked against PF2e's heightening entry.
const FLAT_HEALING_STEP = /^Heightened \(\+(\d+)\) Increase the Hit Points you regain by (\d+)\.$/;
// "You can spend 1 to 3 actions Casting this Spell, and you can target a number of creatures equal to the actions
// spent." — PF2e's variants carry each count's Target; the cast variant's Target must name that many creatures.
const ACTION_TARGETS = /^You can spend (\d) to (\d) actions Casting this Spell, and you can target a number of creatures equal to the actions spent\.$/;
// "If the target had the Dying condition, coming back from Dying due to this healing doesn't increase its Wounded condition."
const NO_WOUNDED = /^If the target had the (?:@UUID\[[^\]]+\]\{Dying\}|Dying) condition, coming back from Dying due to this healing doesn't increase its (?:@UUID\[[^\]]+\]\{Wounded\}|Wounded) condition\.$/;
// Movement the healed creature may take on its own: "… and can Fly up to 30 feet as a free action along a path of their
// choice; this movement doesn't trigger reactions but can never put the target in danger, so if they attempt to move
// toward an enemy or into a hazard, the movement immediately ends." The card says so; the creature moves itself.
const FREE_MOVE = /^The target can (Fly|Stride|Step|Swim|Climb|Burrow) up to (\d+) feet as a free action along a path of their choice; this movement doesn't trigger reactions but can never put the target in danger, so if they attempt to move toward an enemy or into a hazard, the movement immediately ends\.$/;
// A reaction's own limit, judged by the caster when choosing to react: "You can't use breath of life if the triggering
// effect was a death effect or an effect that leaves no remains, such as Disintegrate."
// Hero's Defiance: what the healing prevents, and when it can be used again (the GM's).
const DEFIANCE_NOTES = [/^If this is enough to prevent the attack from bringing you to 0 Hit Points, you don't become (?:@UUID\[[^\]]+\]\{Unconscious\}|Unconscious) or (?:@UUID\[[^\]]+\]\{Dying\}|Dying)\.$/,
    /^Either way, cheating death is difficult, and you can't use [a-z' ]+ again until you Refocus or make your daily preparations\.$/,
    /^[A-Za-z' ]+ can't be used against effects with the death trait or that would leave no remains, such as (?:@UUID\[[^\]]+\]\{[^}]+\}|[a-z ]+)\.$/];
const REACTION_LIMIT = /^You can't use [a-z' ]+ if the triggering effect was a death effect or an effect that leaves no remains, such as (?:@UUID\[[^\]]+\]\{[^}]+\}|[a-z ]+)\.?$/i;
const ACTIONS_INTRO = /^The number of actions (?:you spend|spent) (?:when )?Casting this Spell determines (?:its )?(?:range(?: and other parameters)?|effect|range, area, and other parameters)\.$/i;
const ACTION_ONE = /^1(?: \([a-z, ]+\))? The spell has a range of touch\.$/i;
const ACTION_TWO = /^2(?: \([a-z, ]+\))? The spell has a range of (\d+) feet and restores an additional (\d+) Hit Points to the target\.$/i;
const RULE_WORDS = /\d|\b(?:damage|save|condition|bonus|penalty|immune|Sustain|Dismiss|counteract|can't|must|until|each|whenever)\b/i;
// Healing through a thrall (Song of the Soul): "Choose one living or undead creature of your choice within 15 feet of the target thrall."
// (the caster targets that creature, not the thrall) and "This spell has the vitality trait if you heal a living creature or the void
// trait if you choose an undead creature." (the healing applies to either): card notes.
const THRALL_RECIPIENT = /^Choose one living or undead creature of your choice within (\d+) feet of the target thrall\.$/;
const TRAIT_BY_RECIPIENT = /^This spell has the vitality trait if you heal a living creature or the void trait if you choose an undead creature\.$/;

// Let Not the Fallen Rest: "Each allied creature within the emanation whose Dying value is 2 or less regains 4d10 Hit Points and can Stand as
// a free action, which doesn't provoke reactions." — the caster's allies in the emanation that are dying (or unconscious) at that value or less
// (the GM targets them; the module checks); the free Stand is a note. (PFS's note says the same: conscious allies need Dying 1 or 2.)
const FALLEN = new RegExp(String.raw`^Each allied creature within the emanation whose (?:@UUID\[[^\]]+\]\{Dying\}|Dying) value is (\d) or less regains ${DICE} Hit Points and can Stand as a free action, which doesn't provoke reactions\.$`);
const PFS_NOTE = /<p>\s*<em>PFS Note:<\/em>[\s\S]*?<\/p>/g;
// "Heightened (+2) The healing increases by 1d8." — the healing entry's step, against PF2e's heightening of it (which the card rolls).
const HEALING_STEP = /^Heightened \(\+(\d+)\) The (?:amount of )?healing increases by (\d+)d(\d+)\.$/;

/**
 * The text's heightening of the healing entry against PF2e's: undefined when they agree (or the text states no healing step this reads),
 * a correction (the same die; the text's step or interval otherwise — Breath of Life's 1d8 per 2 ranks over PF2e's 1d8 per rank), or
 * null when the two can't be reconciled (the spell is refused).
 */
function healingHeightening(adapted, component) {
    const html = String(adapted.descriptionHTML ?? "");
    const start = /<strong\b[^>]*>\s*Heightened\s*\(/i.exec(html);
    if (!start) return undefined;
    const text = htmlToPlainText(html.slice(start.index));
    const step = HEALING_STEP.exec(text);
    if (!step) {
        // A flat step must be PF2e's entry exactly (the text wins only over dice).
        const flat = FLAT_HEALING_STEP.exec(text), heightening = adapted.heightening;
        if (!flat) return undefined;
        const entry = String(heightening?.damage?.[component.id] ?? "").replace(/\s+/g, "");
        return heightening?.type === "interval" && Number(heightening.interval) === Number(flat[1]) && entry === flat[2] && /^\d+$/.test(String(component.formula).trim()) ? undefined : null;
    }
    const [interval, dice, faces] = [Number(step[1]), Number(step[2]), Number(step[3])];
    const base = /^(\d+)d(\d+)(?:\+\d+)?$/.exec(String(component.formula).replace(/\s+/g, ""));
    const heightening = adapted.heightening;
    const data = heightening == null ? { interval, dice: 0 } : heightening.type === "interval" && Number(heightening.interval) > 0
        ? (() => { const entry = /^(\d+)d(\d+)$/.exec(String(heightening.damage?.[component.id] ?? "").replace(/\s+/g, ""));
            return entry && Number(entry[2]) === faces ? { interval: Number(heightening.interval), dice: Number(entry[1]) } : null; })() : null;
    if (!base || Number(base[2]) !== faces || !data || !Number.isInteger(Number(adapted.rank))) return null;
    if (data.interval === interval && data.dice === dice) return undefined;
    return { faces, baseDice: Number(base[1]), baseRank: Number(adapted.rank), text: { interval, dice }, data, sourceText: text };
}

/** The healing roll's formula with the text's dice count at the cast rank (PF2e's formula must hold PF2e's count of that die). */
export function correctHealingFormula(formula, correction, castRank) {
    const count = step => correction.baseDice + Math.max(0, Math.floor((Number(castRank) - correction.baseRank) / step.interval)) * step.dice;
    const pattern = new RegExp(`(\\d+|\\(\\s*\\d+(?:\\s*\\+\\s*\\d+)*\\s*\\))d${correction.faces}(?!\\d)`, "g");
    const matches = [...String(formula).matchAll(pattern)];
    const found = matches.length === 1 ? matches[0][1].replace(/[()\s]/g, "").split("+").reduce((sum, value) => sum + Number(value), 0) : null;
    if (found !== count(correction.data)) throw new Error(`PF2e's healing isn't the ${count(correction.data)}d${correction.faces} the text corrects (${formula}).`);
    return String(formula).replace(pattern, `${count(correction.text)}d${correction.faces}`);
}

export function compileDirectHealing(adapted) {
    if (adapted.defense?.kind !== "none") return null;
    // An emanation with a Target limits where the targets can be ("1 living creature" within 20 feet of you).
    const area = adapted.targeting?.area;
    const fallen = area?.type === "emanation" && !String(adapted.targeting?.target ?? "").trim()
        ? htmlToPlainText(stripHeighteningHTML(String(adapted.descriptionHTML ?? "").replace(PFS_NOTE, ""))).split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map(value => value.trim()).find(sentence => FALLEN.test(sentence)) : null;
    const within = area && area.type === "emanation" && (String(adapted.targeting?.target ?? "").trim() || fallen) && Number(area.value) > 0 ? Number(area.value) : null;
    if (area && within == null) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || JSON.stringify(components[0].kinds) !== JSON.stringify(["healing"])) return null;
    const formula = String(components[0].formula).replace(/\s+/g, "");
    // The Spell Effect link is the Effect route's; take it out of the prose.
    // (A free action's or reaction's Trigger paragraph — Hero's Defiance: "Trigger An attack would bring you to 0 Hit Points." — is when the caster uses it: a note.)
    const trigger = /^\s*<p>\s*<strong>\s*Trigger\s*<\/strong>\s*([^<]+)<\/p>\s*<hr\s*\/?>/i.exec(String(adapted.descriptionHTML ?? ""));
    const html = stripHeighteningHTML(String(adapted.descriptionHTML ?? "").replace(PFS_NOTE, "").replace(trigger?.[0] ?? "\u0000", "")).replace(/@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}/g, "");
    let dyingMax = null, perRank = null;
    const sentences = htmlToPlainText(html).split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map(value => value.trim()).filter(Boolean);
    let healed = null, extra = null, intro = false, actionTargets = null, noWoundedIncrease = false, endPersistent = null;
    const remaining = [], narration = [], notes = trigger && /^(?:free|reaction)$/i.test(String(adapted.activation?.time ?? "").trim()) ? [{ kind: "trigger", text: `Trigger: ${trigger[1].trim()}` }] : [];
    if (trigger && !notes.length) return null;
    const rider = text => {
        // "… and it gains a +2 status bonus …": the rider's subject is the target.
        const clause = `The target ${text.replace(/^it /, "")}.`;
        const move = FREE_MOVE.exec(clause);
        if (move) notes.push({ kind: "free-movement", text: clause });
        else remaining.push(clause);
    };
    for (const sentence of sentences) {
        // Life Siphon: "You use some of the spell's magic to heal yourself, regaining 1d8 Hit Points per rank of the spell." — the triggering
        // spell's rank, which the caster gives.
        const siphon = !healed && /^reaction$/i.test(String(adapted.activation?.time ?? "").trim()) ? /^You use some of the spell's magic to heal yourself, regaining (\d+)d(\d+) Hit Points per rank of the spell\.$/.exec(sentence) : null;
        if (siphon) { healed = `${siphon[1]}d${siphon[2]}`; perRank = { dice: Number(siphon[1]), faces: Number(siphon[2]) }; continue; }
        const fell = !healed && fallen && FALLEN.exec(sentence);
        if (fell) { healed = fell[2].replace(/\s+/g, ""); dyingMax = Number(fell[1]); notes.push({ kind: "free-stand", text: "Each creature healed can Stand as a free action, which doesn't provoke reactions." }); continue; }
        const heal = !healed && HEALS.map(pattern => pattern.exec(sentence)).find(Boolean);
        if (heal) { healed = heal[1].replace(/\s+/g, "");
            const ends = heal[2] && END_PERSISTENT.exec(heal[2]);
            if (ends) endPersistent = { damageType: ends[1], count: 1, optional: true };
            else if (heal[2]) rider(heal[2]);
            continue; }
        const byActions = ACTION_TARGETS.exec(sentence);
        if (byActions) { actionTargets = [Number(byActions[1]), Number(byActions[2])]; continue; }
        if (NO_WOUNDED.test(sentence) && healed) { noWoundedIncrease = true; continue; }
        if (REACTION_LIMIT.test(sentence) && healed) { notes.push({ kind: "reaction-limit", text: sentence }); continue; }
        if (DEFIANCE_NOTES.some(pattern => pattern.test(sentence)) && healed) { notes.push({ kind: "reaction-limit", text: sentence }); continue; }
        const nearThrall = !healed && /^1 of your thralls$/i.test(String(adapted.targeting?.target ?? "").trim()) ? THRALL_RECIPIENT.exec(sentence) : null;
        if (nearThrall) { notes.push({ kind: "thrall-recipient", text: `Target the living or undead creature within ${nearThrall[1]} feet of your thrall: it's healed (not the thrall).` }); continue; }
        if (TRAIT_BY_RECIPIENT.test(sentence) && healed && notes.some(note => note.kind === "thrall-recipient")) { notes.push({ kind: "thrall-recipient", text: sentence }); continue; }
        if (ACTIONS_INTRO.test(sentence)) { intro = true; continue; }
        if (ACTION_ONE.test(sentence) && intro) continue;
        const two = ACTION_TWO.exec(sentence);
        if (two && intro) { extra = Number(two[2]); continue; }
        if (!healed && !RULE_WORDS.test(sentence)) { narration.push(sentence); continue; }
        remaining.push(sentence);
    }
    if (!healed) return null;
    // The item's own action count decides which healing its entry must hold.
    const time = String(adapted.activation?.time ?? "").trim();
    const expected = extra != null && time === "2" ? `${healed}+${extra}` : healed;
    if (formula !== expected) return null;
    // An item still offering both action counts is the base of PF2e's variants: cast a variant instead.
    if ((intro || extra != null) && !["1", "2"].includes(time)) return null;
    // Targets by actions: the cast variant's Time is one count in the range, and its Target names that many creatures.
    if (actionTargets) {
        const actions = Number(time), count = /^(\d+) /.exec(String(adapted.targeting?.target ?? "").trim());
        if (!/^\d$/.test(time) || actions < actionTargets[0] || actions > actionTargets[1] || !count || Number(count[1]) !== actions) return null;
    }
    // The text's heightening over PF2e's (the text wins): the card rolls PF2e's healing with the text's dice.
    const correction = perRank ? undefined : healingHeightening(adapted, components[0]);
    if (correction === null) return null;
    return {
        healing: { formula: components[0].formula, damageType: String(components[0].type ?? "untyped").toLowerCase(),
            recipient: String(adapted.targeting?.target ?? "").trim() || dyingMax != null ? "target" : "source",
            ...(within != null ? { within } : {}),
            ...(dyingMax != null ? { alliesOnly: true, dyingMax } : {}),
            ...(perRank ? { perTriggeringRank: perRank } : {}),
            ...(noWoundedIncrease ? { noWoundedIncrease: true } : {}),
            ...(endPersistent ? { endPersistent } : {}),
            ...(correction ? { heighteningCorrection: correction } : {}),
            ...(notes.length ? { notes } : {}) },
        remainingText: remaining,
        remainingHTML: remaining.length ? `<p>${remaining.join(" ")}</p>` : ""
    };
}
