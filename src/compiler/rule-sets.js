// Note-only spells whose stated rules are PF2e rule elements on one Effect (Unfetter Eidolon, Healing Plaster, Time Sense, Glamorize, Unbroken
// Panoply, Whirling Scarves): `ruleSet` = { recipient, seconds, rules, rankRules, toggle, consumeOn, turnOnly, immunity, replacesPrevious, weapon, snag, notes }.
// A toggle is a PF2e RollOption (off until the player or GM switches it on for a roll the rule covers); the bonuses are predicated on it.
import { durationSeconds, plainText as plain, splitSentences as split } from "./description-parser.js";

const unlink = text => text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\[\[\/act ([a-z-]+)\]\]/g, (_m, slug) => slug.replace(/-/g, " ").replace(/^./, c => c.toUpperCase()));
const NARRATION_RULES = /\d|\[\[|\b(?:damage|saves?|bonus|penalty|immune|can't|must|checks?|DC|Hit Points|Strikes?)\b/i;
const secondsOf = text => durationSeconds(text);
const parts = adapted => { const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i); return { sentences: split(plain(body)), heightened: plain(rest.join(" ")) }; };

// Unfetter Eidolon: "While the spell is active, your eidolon can travel an unlimited distance away from you and gains a +1 status bonus to saving
// throws and DCs against any effect that would make them grappled, immobilized, or Restrained, plus the [[/act reposition]] and Swallow Whole
// actions." — a toggle for such an effect, the +1 status bonus to saves (and so their DCs) on it; PF2e's Grapple and Reposition against the
// eidolon's Fortitude DC get it without the toggle. The unlimited distance and unmanifesting are notes.
const UNFETTER = /^While the spell is active, your eidolon can travel an unlimited distance away from you and gains a \+(\d) (status) bonus to saving throws and DCs against any effect that would make them grappled, immobilized, or (?:@UUID\[[^\]]+\]\{Restrained\}|Restrained), plus the \[\[\/act reposition\]\] and Swallow Whole actions\.$/;
function unfetter(adapted) {
    if (!/^your eidolon$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const seconds = secondsOf(adapted.lifecycle?.duration);
    const { sentences, heightened } = parts(adapted);
    const at = sentences.findIndex(sentence => UNFETTER.test(sentence));
    // (A condition in the narration only as what the spell guards against: "aiding them against being Immobilized".)
    const granted = sentence => [...sentence.matchAll(/(\S+ \S+ )?@UUID\[Compendium\.pf2e\.conditionitems[^\]]*\]/g)].some(match => match[1] !== "against being ");
    if (!seconds || heightened || at < 0 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(unlink(sentence)) || granted(sentence))) return null;
    const after = sentences.slice(at + 1);
    if (after.some(sentence => !/^When the spell ends, if your eidolon is more than \d+ feet away from you, they unmanifest\.$/.test(sentence))) return null;
    const [, value, type] = UNFETTER.exec(sentences[at]);
    const option = "unfetter-eidolon-restraint";
    return { ruleSet: { recipient: "eidolon", seconds,
        toggle: { option, label: "Against being grappled, immobilized or restrained (or Reposition / Swallow Whole)" },
        // (A Grapple or Reposition against the eidolon targets its Fortitude DC, evaluated with that action's own options.)
        rules: [{ key: "FlatModifier", selector: "saving-throw", type, value: Number(value), predicate: [option] },
            { key: "FlatModifier", selector: "fortitude-dc", type, value: Number(value), predicate: [{ or: [option, "action:grapple", "action:reposition"] }] }],
        notes: ["Your eidolon can travel an unlimited distance away from you.", ...after] }, claimed: sentences };
}

// Healing Plaster: "This restorative substance can be used in lieu of healer's tools for Medicine checks to Administer First Aid or Treat Wounds.
// If the plaster isn't used within the spell's duration, or if you Cast the Spell again before using the plaster, it reverts …" with
// "Heightened (3rd) The plaster grants anyone using it to Administer First Aid or Treat Wounds a +1 item bonus to the Medicine check." — the
// caster's Effect (one at a time), used up by a Medicine check to Administer First Aid or Treat Wounds; from 3rd rank, +1 item to that check.
const PLASTER = /^This restorative substance can be used in lieu of healer's tools for Medicine checks to (?:@UUID\[[^\]]+\]\{Administer First Aid\}|Administer First Aid) or (?:@UUID\[[^\]]+\]\{Treat Wounds\}|Treat Wounds)\.$/;
const PLASTER_ENDS = /^If the [a-z]+ isn't used within the spell's duration, or if you Cast the Spell again before using the [a-z]+, it reverts to being normal non-magical earth\.$/;
const PLASTER_BONUS = /^Heightened \((\d+)(?:st|nd|rd|th)\) The plaster grants anyone using it to (?:@UUID\[[^\]]+\]\{Administer First Aid\}|Administer First Aid) or (?:@UUID\[[^\]]+\]\{Treat Wounds\}|Treat Wounds) a \+(\d) (item) bonus to the Medicine check\.$/;
function plaster(adapted) {
    const seconds = secondsOf(adapted.lifecycle?.duration);
    const { sentences, heightened } = parts(adapted);
    const at = sentences.findIndex(sentence => PLASTER.test(sentence));
    const bonus = PLASTER_BONUS.exec(heightened);
    if (!seconds || at < 0 || !PLASTER_ENDS.test(sentences[at + 1] ?? "") || sentences.length !== at + 2 || (heightened && !bonus) || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const uses = ["action:administer-first-aid", "action:treat-wounds"];
    return { ruleSet: { recipient: "self", seconds, replacesPrevious: true, rules: [],
        rankRules: bonus ? [{ minRank: Number(bonus[1]), rules: [{ key: "FlatModifier", selector: "medicine", type: bonus[3], value: Number(bonus[2]), predicate: [{ or: uses }] }] }] : [],
        consumeOn: { on: "skill-check", options: uses },
        notes: ["The plaster serves as healer's tools for Administer First Aid or Treat Wounds; it's used up by that check.", sentences[at + 1]] },
        claimed: [...sentences, heightened].filter(Boolean) };
}

// Time Sense: "You can gain a +1 status bonus to one attack roll, Perception check, saving throw, or skill check you take on the same turn you cast
// time sense that requires extremely precise timing. If you choose to gain this bonus, you can't gain it again for 1 hour." — a toggle until the
// end of the turn: switched on for a roll that needs precise timing, it gives +1 status to it and is used up; then 1 hour before it again.
const TIMING = /^You can gain a \+(\d) (status) bonus to one attack roll, Perception check, saving throw, or skill check you take on the same turn you cast [a-z ]+ that requires extremely precise timing\.$/;
const TIMING_AGAIN = /^If you choose to gain this bonus, you can't gain it again for (\d+) hours?\.$/;
function timeSense(adapted) {
    if (String(adapted.lifecycle?.duration ?? "").trim() || String(adapted.targeting?.target ?? "").trim()) return null;
    const { sentences, heightened } = parts(adapted);
    const at = sentences.findIndex(sentence => TIMING.test(sentence));
    const again = TIMING_AGAIN.exec(sentences[at + 1] ?? "");
    if (heightened || at < 0 || !again || sentences.length !== at + 2) return null;
    // (The sentences before it are what the caster learns: the time, the calendar with a trained skill.)
    if (sentences.slice(0, at).some(sentence => /\b(?:bonus|penalty|damage|saves?|DC)\b/.test(sentence))) return null;
    const [, value, type] = TIMING.exec(sentences[at]);
    const option = "time-sense-precise-timing";
    return { ruleSet: { recipient: "self", seconds: 6, turnOnly: true, toggle: { option, label: "A roll that requires extremely precise timing" },
        rules: [{ key: "FlatModifier", selector: ["attack-roll", "perception", "saving-throw", "skill-check"], type, value: Number(value), predicate: [option] }],
        consumeOn: { on: "check-with-option", option }, immunity: { hours: Number(again[1]), onlyWhenUsed: true },
        notes: sentences.slice(0, at) }, claimed: sentences };
}

// Glamorize: "At the GM's discretion, such alterations might grant a +1 status bonus to certain tasks, such as Impersonate or Perform." — the
// caster's Effect for the duration with a toggle the GM switches on for such a task: +1 status to that skill check.
const GLAMOR = /^At the GM's discretion, such alterations might grant a \+(\d) (status) bonus to certain tasks, such as (?:@UUID\[[^\]]+\]\{[^}]+\}|[A-Z][a-z]+) or (?:@UUID\[[^\]]+\]\{[^}]+\}|[A-Z][a-z]+)\.$/;
function glamor(adapted) {
    if (String(adapted.targeting?.target ?? "").trim()) return null;
    const seconds = secondsOf(adapted.lifecycle?.duration);
    const { sentences, heightened } = parts(adapted);
    const at = sentences.findIndex(sentence => GLAMOR.test(sentence));
    if (!seconds || heightened || at < 0 || at !== sentences.length - 1 || sentences.slice(0, at).some(sentence => /\d|\b(?:damage|saves?|bonus|penalty|checks?|DC)\b/i.test(sentence))) return null;
    const [, value, type] = GLAMOR.exec(sentences[at]);
    const option = "glamorize-task";
    return { ruleSet: { recipient: "self", seconds, toggle: { option, label: "The GM grants the bonus to this task" },
        rules: [{ key: "FlatModifier", selector: "skill-check", type, value: Number(value), predicate: [option] }],
        notes: [unlink(sentences[at]), ...sentences.slice(0, at).filter(sentence => /Sustain/.test(sentence))] }, claimed: sentences };
}

// Unbroken Panoply: "… the weapon's broken condition is suppressed for the duration. The weapon gains the nonlethal trait during this time. The
// weapon's wielder can apply the weapon's item bonus to attack rolls, if any, to their Diplomacy checks. If the weapon would be damaged or broken
// again, this spell ends." — the wielder's Effect: that weapon's Strikes gain nonlethal, and its potency is an item bonus to Diplomacy.
const PANOPLY = [/^Images of similar legendary weapons overlay the target, and the weapon's broken condition is suppressed for the duration\.$/, /^The weapon gains the nonlethal trait during this time\.$/,
    /^The weapon's wielder can apply the weapon's item bonus to attack rolls, if any, to their Diplomacy checks\.$/, /^If the weapon would be damaged or broken again, this spell ends\.$/];
function panoply(adapted) {
    if (!/^1 broken weapon that is unattended or held by a willing creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const seconds = secondsOf(adapted.lifecycle?.duration);
    const { sentences, heightened } = parts(adapted);
    const at = sentences.findIndex(sentence => PANOPLY[0].test(sentence));
    if (!seconds || heightened || at < 0 || sentences.length !== at + PANOPLY.length || PANOPLY.some((pattern, index) => !pattern.test(sentences[at + index]))
        || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    return { ruleSet: { recipient: "wielder", seconds, weapon: { broken: true },
        rules: [{ key: "AdjustStrike", mode: "add", property: "weapon-traits", value: "nonlethal", definition: ["item:id:{weaponId}"] },
            { key: "FlatModifier", selector: "diplomacy", type: "item", value: "{potency}" }],
        notes: ["The weapon's broken condition is suppressed.", sentences[at + 3]] }, claimed: sentences };
}

// Whirling Scarves: "You gain the benefits of the Concealed condition, but only against ranged and melee attacks." / "When a melee attack fails to
// hit you because of the flat check for the concealed condition, the scarves snag the weapon or unarmed attack, and the creature takes a –1
// circumstance penalty to further attacks with that weapon or unarmed attack until the end of its turn (or the end of its next turn, if it wasn't
// the creature's turn)." / "… the flat check for the concealed condition against ranged attacks increases from DC 5 to DC 6." / "You can Dismiss
// this spell." with "Heightened (+2) The circumstance penalty … increases by 1. The DC of the flat check … against ranged attacks increases by 1."
// — the caster's Effect grants Concealed (only against attacks, and the ranged DC, are notes: PF2e rolls no flat check itself); the card's snag
// control (the attacker targeted, after its melee attack missed on the flat check) gives it the penalty with the weapon it picks, until the end of
// that turn or of its next.
const SCARF_CONCEALED = /^You gain the benefits of the (@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Concealed\}) condition, but only against ranged and melee attacks\.$/;
const SCARF_SNAG = /^When a melee attack fails to hit you because of the flat check for the concealed condition, the [a-z]+ snag the weapon or unarmed attack, and the creature takes a [–−-](\d) (circumstance) penalty to further attacks with that weapon or unarmed attack until the end of its turn \(or the end of its next turn, if it wasn't the creature's turn\)\.$/;
const SCARF_RANGED = /^The timing of the [a-z' ]+ movement is harder to predict for ranged attackers, so the flat check for the concealed condition against ranged attacks increases from DC (\d+) to DC (\d+)\.$/;
const SCARF_STEP = /^Heightened \(\+(\d)\) The circumstance penalty to further attacks with a melee weapon or unarmed attack the [a-z]+ snag increases by (\d)\. The DC of the flat check for the concealed condition against ranged attacks increases by (\d)\.$/;
function scarves(adapted) {
    if (String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    const seconds = secondsOf(adapted.lifecycle?.duration);
    const { sentences, heightened } = parts(adapted);
    const at = sentences.findIndex(sentence => SCARF_CONCEALED.test(sentence));
    const step = SCARF_STEP.exec(heightened);
    if (!seconds || at < 0 || sentences.length !== at + 4 || !/^You can Dismiss this spell\.$/.test(sentences[at + 3]) || (heightened && !step)
        || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(unlink(sentence)))) return null;
    const concealed = SCARF_CONCEALED.exec(sentences[at]), snag = SCARF_SNAG.exec(sentences[at + 1]), ranged = SCARF_RANGED.exec(sentences[at + 2]);
    if (!snag || !ranged) return null;
    return { ruleSet: { recipient: "self", seconds, dismissible: true,
        rules: [{ key: "GrantItem", uuid: concealed[2], inMemoryOnly: true }],
        snag: { value: Number(snag[1]), type: snag[2], dc: Number(ranged[2]), step: step ? { interval: Number(step[1]), penalty: Number(step[2]), dc: Number(step[3]) } : null,
            label: "A melee attack missed on the concealed flat check (target the attacker)" },
        notes: ["Concealed only against ranged and melee attacks.", "The flat check for the concealed condition against ranged attacks is DC {rangedDC}."] },
        claimed: [...sentences, heightened].filter(Boolean) };
}

/** The snag's penalty and the ranged flat check's DC at a cast rank. */
export function snagAt(snag, castRank, baseRank) {
    const steps = snag.step ? Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / snag.step.interval)) : 0;
    return { value: snag.value + steps * (snag.step?.penalty ?? 0), dc: snag.dc + steps * (snag.step?.dc ?? 0) };
}

// Primal Chorus: "You let loose a primal howl that incites animals and beasts to join in the chorus. Doing so gives you a general idea of how many
// creatures with the animal or beast trait are within the range of the spell, but significant creatures can attempt a Will save against your spell DC
// to resist responding to your call. You gain a +1 status bonus to your next Initiative roll in an encounter with an enemy creature that replies to
// your call. For purposes of using Coerce during exploration mode, you can communicate with a creature that responds to your call for the duration of
// the spell. You can only make simple commands, …" with "Heightened (+2) The status bonus increases by 1." — the caster's Effect until the next daily
// preparations (a day): a toggle for an encounter with an enemy that replied, the status bonus to that initiative roll (used up by it); what the
// caster learns, the Will saves of significant creatures (the GM's) and the Coerce communication are notes.
const CHORUS = [/^You let loose a primal howl that incites ([a-z]+) and ([a-z]+)s to join in the chorus\.$/,
    /^Doing so gives you a general idea of how many creatures with the ([a-z]+) or ([a-z]+) trait are within the range of the spell, but significant creatures can attempt a (Will) save against your spell DC to resist responding to your call\.$/,
    /^You gain a \+(\d) (status) bonus to your next Initiative roll in an encounter with an enemy creature that replies to your call\.$/,
    /^For purposes of using (?:@UUID\[[^\]]+\]\{Coerce\}|Coerce) during exploration mode, you can communicate with a creature that responds to your call for the duration of the spell\.$/,
    /^You can only make simple commands, such as [a-z ,]+, and only understand simple ideas, such as [a-z ,]+\.$/];
const CHORUS_STEP = /^Heightened \(\+(\d)\) The status bonus increases by (\d)\.$/;
function chorus(adapted) {
    if (!/^until your next daily preparations$/i.test(String(adapted.lifecycle?.duration ?? "").trim()) || String(adapted.targeting?.target ?? "").trim()) return null;
    const { sentences, heightened } = parts(adapted);
    const step = CHORUS_STEP.exec(heightened);
    if (sentences.length !== CHORUS.length || CHORUS.some((pattern, index) => !pattern.test(sentences[index])) || !step || adapted.defense?.statistic !== "will") return null;
    const [, value, type] = CHORUS[2].exec(sentences[2]);
    const option = "primal-chorus-reply";
    const rule = bonus => ({ key: "FlatModifier", selector: "initiative", type, value: bonus, predicate: [option] });
    const rankRules = [];
    for (let rank = Number(adapted.rank) + Number(step[1]), bonus = Number(value) + Number(step[2]); rank <= 10; rank += Number(step[1]), bonus += Number(step[2])) rankRules.push({ minRank: rank, rules: [rule(bonus)] });
    return { ruleSet: { recipient: "self", seconds: 86400, toggle: { option, label: "An enemy that replied to your call is in this encounter" }, rules: [rule(Number(value))], rankRules,
        consumeOn: { on: "check-with-option", option },
        notes: [unlink(sentences[1]), "The GM decides which significant creatures attempt the Will save and how many respond.", unlink(sentences[3]), sentences[4]] },
        claimed: [...sentences, heightened] };
}

// Spiritual Attunement: "Your Strikes and spells gain the alignment traits of the plane you chose, which deals additional damage to creatures with a
// weakness to either of those alignment traits." / "You gain resistance 5 to damage of the alignments that oppose those of your chosen plane." /
// "If you choose the Boneyard, the resistance is to vitality and void damage instead." with "Heightened (+2) The resistance increases by 5." and the
// planes "Heaven (LG), Nirvana (NG), …". PF2e's remaster has no alignment damage or traits: good is holy and evil unholy; lawful and chaotic have none.
// The caster's Effect for the plane picked on the card: holy or unholy on its Strikes (AdjustStrike), resistance to the opposed one; the spells' trait is a note.
const ATTUNE = [/^You attune yourself to a spiritual plane of the Outer Sphere, connecting your spirit without fully transporting to it\.$/,
    /^Your Strikes and spells gain the alignment traits of the plane you chose, which deals additional damage to creatures with a weakness to either of those alignment traits\.$/,
    /^Furthermore, the plane protects you from energy of the alignments that oppose the plane\.$/,
    /^You gain resistance (\d+) to damage of the alignments that oppose those of your chosen plane\.$/,
    /^For example, if you chose Heaven, your Strikes would gain the good and lawful traits, and you would gain resistance to chaotic and evil\.$/,
    /^If you choose the ([A-Z][a-z]+), the resistance is to ([a-z]+) and ([a-z]+) damage instead\.$/];
const ATTUNE_STEP = /^Heightened \(\+(\d)\) The resistance increases by (\d+)\.$/;
const PLANES = /^The nine main planes of the Outer Sphere are the homes of many deities, celestials, monitors, and fiends\. Their names, along with their alignments, are: (.+)\.$/;
const REMASTERED = { G: "holy", E: "unholy" }, OPPOSED = { G: "E", E: "G", L: "C", C: "L" };
function attunement(adapted) {
    if (String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    const seconds = secondsOf(adapted.lifecycle?.duration);
    const [body, heightenedHTML = "", listHTML = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body)), step = ATTUNE_STEP.exec(plain(heightenedHTML).trim()), list = PLANES.exec(plain(listHTML).replace(/\s+/g, " ").trim());
    if (!seconds || rest.length || !step || !list || sentences.length !== ATTUNE.length || ATTUNE.some((pattern, index) => !pattern.test(sentences[index]))) return null;
    const planes = list[1].split(/, (?:and )?/).map(entry => /^(?:the )?([A-Z][a-z]+) \(([LNC]?[GNE]|N)\)$/.exec(entry.trim()));
    if (planes.length !== 9 || planes.some(match => !match)) return null;
    const [, value] = ATTUNE[3].exec(sentences[3]);
    const [, special, typeA, typeB] = ATTUNE[5].exec(sentences[5]);
    if (!planes.some(match => match[1] === special)) return null;
    const options = planes.map(([, name, code]) => {
        const letters = code === "N" ? [] : code.split("").filter(letter => letter !== "N");
        const traits = letters.map(letter => REMASTERED[letter]).filter(Boolean);
        const resisted = name === special ? [typeA, typeB] : letters.map(letter => REMASTERED[OPPOSED[letter]]).filter(Boolean);
        const dropped = letters.filter(letter => !REMASTERED[letter]).map(letter => ({ L: "lawful", C: "chaotic" })[letter]);
        return { key: name.toLowerCase(), label: `${name} (${code})`,
            rules: [...traits.map(trait => ({ key: "AdjustStrike", mode: "add", property: "traits", value: trait, definition: [] })),
                ...resisted.map(type => ({ key: "Resistance", type, value: "{resistance}" }))],
            notes: [...(traits.length ? [`Your spells gain the ${traits.join(" and ")} trait${traits.length > 1 ? "s" : ""}.`] : []),
                ...(dropped.length ? [`PF2e's remaster has no ${dropped.join(" or ")} trait or damage: that part has no effect.`] : [])] };
    });
    return { ruleSet: { recipient: "self", seconds, rules: [], choice: { label: "The plane", options },
        scale: { placeholder: "{resistance}", value: Number(value), interval: Number(step[1]), per: Number(step[2]) }, notes: [] },
        claimed: [...sentences, step[0], list[0]] };
}

// Variable Gravity: "Choose one type of gravity when you cast the spell." / "While the spell lasts, you can change the type of gravity with a single action,
// which has the concentrate trait." with "<strong>Low Gravity</strong> …" (jumping and falling: notes) and "<strong>High Gravity</strong> You become
// {Encumbered}. You gain a +2 status bonus to your saving throws and DCs to resist forced movement and attempts to knock you {Prone}. …" and
// "Heightened (6th) The duration increases to 1 hour." — the caster's Effect of the type picked (normal gravity: none of the rules), changed from the
// card with an action: high gravity's Encumbered and the bonus to saves and to the Fortitude and Reflex DCs that Shove, Reposition and Trip target.
const GRAVITY = [/^You can adjust how strongly gravity grips you, changing between low gravity, normal gravity, and high gravity with ease\.$/,
    /^Choose one type of gravity when you cast the spell\.$/,
    /^While the spell lasts, you can change the type of gravity with a single action, which has the concentrate trait\.$/,
    /^The spell doesn't alter your physical appearance, so it's impossible to (?:tell )?what type of gravity you're subjected to by casual observation\.$/];
const GRAVITY_NOTES = [/^You can jump double the normal distance when you Long Jump or Leap, though still to a maximum of your Speed\.$/,
    /^When you High Jump, you can use the calculation for a Long Jump but don't double the distance\.$/,
    /^Rather than the normal calculation for falling damage, (?:when you fall, )?you take (?:no damage for the first \d+ feet and then take )?bludgeoning damage equal to (?:a quarter of the remaining distance you fell|the distance you fall)\.$/,
    /^Abilities that adjust how much falling damage you take still apply\.$/,
    /^You reduce the distance forced movement moves you by half or \d+ feet, whichever is more\.$/,
    /^You can only jump half as high and far\.$/];
const HEAVY = /^You become @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Encumbered\}\.$/;
const STEADY = /^You gain a \+(\d) (status) bonus to your saving throws and DCs to resist forced movement and attempts to knock you (?:@UUID\[[^\]]+\]\{Prone\}|Prone)\.$/;
const LONGER = /^Heightened \((\d+)(?:st|nd|rd|th)\) The duration increases to (\d+) (hours?|minutes?)\.$/;
function gravity(adapted) {
    if (String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    const seconds = secondsOf(adapted.lifecycle?.duration);
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const intro = /^\s*<p>([\s\S]*?)<\/p>\s*<ul>([\s\S]*)<\/ul>\s*$/.exec(body);
    if (!seconds || !intro || rest.length > 1) return null;
    const lead = split(plain(intro[1]));
    if (lead.length !== GRAVITY.length || GRAVITY.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const longer = rest.length ? LONGER.exec(plain(rest[0]).trim()) : null;
    if (rest.length && !longer) return null;
    const items = Object.fromEntries([...intro[2].matchAll(/<li>\s*<strong>([^<]+)<\/strong>([\s\S]*?)<\/li>/g)].map(match => [match[1].trim(),
        split(plain(match[2].replace(/@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/g, "")))]));
    if (Object.keys(items).join() !== "Low Gravity,High Gravity") return null;
    const low = items["Low Gravity"].map(unlink), high = items["High Gravity"];
    if (!low.every(sentence => GRAVITY_NOTES.some(pattern => pattern.test(sentence)))) return null;
    const heavy = HEAVY.exec(high[0] ?? ""), steady = STEADY.exec(high[1] ?? "");
    if (!heavy || !steady || !high.slice(2).map(unlink).every(sentence => GRAVITY_NOTES.some(pattern => pattern.test(sentence)))) return null;
    const value = Number(steady[1]), type = steady[2];
    const highRules = [{ key: "GrantItem", uuid: heavy[1], inMemoryOnly: true },
        { key: "FlatModifier", selector: "saving-throw", type, value, predicate: [{ or: ["forced-movement", "inflicts:prone", "action:trip", "action:shove", "action:reposition"] }] },
        { key: "FlatModifier", selector: "fortitude-dc", type, value, predicate: [{ or: ["action:shove", "action:reposition"] }], slug: "gravity-fortitude-dc" },
        { key: "FlatModifier", selector: "reflex-dc", type, value, predicate: ["action:trip"], slug: "gravity-reflex-dc" }];
    const unit = longer ? longer[3].replace(/s$/, "") : null;
    return { ruleSet: { recipient: "self", seconds, ...(longer ? { secondsByRank: [{ rank: Number(longer[1]), seconds: Number(longer[2]) * (unit === "hour" ? 3600 : 60) }] } : {}), rules: [],
        choice: { label: "The gravity", switchable: "Change the gravity (a single action, concentrate)", options: [
            { key: "low", label: "Low gravity", rules: [], notes: low },
            { key: "normal", label: "Normal gravity", rules: [], notes: [] },
            { key: "high", label: "High gravity", rules: highRules, notes: high.slice(2).map(unlink) }] },
        notes: [lead[3]] }, claimed: [...lead, ...low, ...high.map(unlink), ...(longer ? [longer[0]] : [])] };
}

/** Returns {ruleSet, claimed} or null. */
// Armor that reshapes (Magus+'s Metamorphic Armor): "Make a melee Strike against a creature and then choose an effect from the list below. For the duration, when you
// make a Strike against an enemy you can change the effect you chose to another choice." with the list "Gain a resistance to bludgeoning, piercing or slashing damage
// equal to half your level (minimum 1)." / "Gain a resistance to acid, cold, electricity, or fire equal to half your level plus 2 or increase one of these resistances by
// half your level." / "Gain a +1 circumstance bonus to AC." / "Gain a +1 status bonus to your reflex saves against area of effect spells.": the caster's Effect for the
// duration — each listed effect (each resistance type its own) an option the Effect's control switches when it Strikes; the Strike itself the caster's.
const METAMORPHIC_LEAD = /^Make a melee Strike against a creature and then (?:@UUID\[[^\]]+\]\{)?choose an effect\}? from the list below\. (For the duration, when you make a Strike against an enemy you can change the effect you chose to another choice\.)$/;
const METAMORPHIC = [/^Gain a resistance to ([a-z]+), ([a-z]+) or ([a-z]+) damage equal to half your level \(minimum 1\)\.$/,
    /^Gain a resistance to ([a-z]+), ([a-z]+), ([a-z]+), or ([a-z]+) equal to half your level plus (\d) or (increase one of these resistances by half your level)\.$/,
    /^Gain a \+(\d) circumstance bonus to AC\.$/,
    /^Gain a \+(\d) status bonus to your reflex saves against area of effect spells\.$/];
function metamorphic(adapted) {
    if (String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    const seconds = secondsOf(adapted.lifecycle?.duration);
    const html = String(adapted.descriptionHTML ?? "");
    const intro = /^\s*<p>([\s\S]*?)<\/p>\s*<ul>([\s\S]*?)<\/ul>\s*(?:<p[^>]*><em>[\s\S]*?<\/em><\/p>\s*)?$/.exec(html);
    if (!seconds || !intro) return null;
    const lead = split(plain(intro[1]));
    const items = [...intro[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match => plain(match[1]).trim());
    const head = METAMORPHIC_LEAD.exec(lead.slice(1).join(" "));
    const found = METAMORPHIC.map((re, index) => re.exec(items[index] ?? ""));
    if (lead.length !== 3 || /\d|\b(?:damage|bonus|resistance|Strike)\b/i.test(lead[0]) || !head || items.length !== 4 || found.some(match => !match)) return null;
    const [physical, energy, ac, reflex] = found;
    const half = "max(1,floor(@actor.level/2))";
    const options = [
        ...[physical[1], physical[2], physical[3]].map(type => ({ key: `resist-${type}`, label: `Resistance to ${type} (half your level)`, rules: [{ key: "Resistance", type, value: half }], notes: [] })),
        ...[energy[1], energy[2], energy[3], energy[4]].map(type => ({ key: `resist-${type}`, label: `Resistance to ${type} (half your level + ${energy[5]})`, rules: [{ key: "Resistance", type, value: `floor(@actor.level/2)+${energy[5]}` }],
            notes: [`Or ${energy[6]}: raise your own resistance to ${type} by half your level instead (the GM's).`] })),
        { key: "ac", label: `+${ac[1]} circumstance bonus to AC`, rules: [{ key: "FlatModifier", selector: "ac", type: "circumstance", value: Number(ac[1]) }], notes: [] },
        { key: "reflex", label: `+${reflex[1]} status bonus to Reflex saves against area spells`, rules: [{ key: "FlatModifier", selector: "reflex", type: "status", value: Number(reflex[1]), predicate: ["area-effect", "item:type:spell"] }], notes: [] }];
    return { ruleSet: { recipient: "self", seconds, rules: [], choice: { label: "The armor's effect", switchable: "Change the effect (when you Strike an enemy)", options },
        notes: ["Make a melee Strike against a creature, then choose the effect."] }, claimed: [...lead.slice(1), ...items] };
}

export function compileRuleSet(adapted) {
    // (Primal Chorus's Will save is the GM's for distant creatures, not the spell's targets.)
    const choir = (adapted.damageComponents ?? []).length ? null : chorus(adapted);
    if (choir) return choir;
    if (adapted.defense?.kind !== "none" && adapted.defense?.kind !== undefined) return null;
    if ((adapted.damageComponents ?? []).length) return null;
    for (const compile of [unfetter, plaster, timeSense, glamor, panoply, scarves, attunement, gravity, metamorphic]) {
        const result = compile(adapted);
        if (result) return result;
    }
    return null;
}

/** The rules at a cast rank (with any rank-gated ones). */
export function ruleSetRules(data, castRank, baseRank = castRank) {
    // (A stated value growing by rank, Spiritual Attunement's resistance: written into the chosen option's rules by the runtime.)
    if (data.scale && data.chosen) {
        const value = data.scale.value + Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.scale.interval)) * data.scale.per;
        return JSON.parse(JSON.stringify(data.chosen.rules).replaceAll(`"${data.scale.placeholder}"`, String(value)));
    }
    // (A chosen option's own rules: Variable Gravity's high gravity.)
    if (data.chosen) return [...structuredClone(data.rules ?? []), ...structuredClone(data.chosen.rules ?? [])];
    return [...structuredClone(data.rules ?? []), ...(data.rankRules ?? []).filter(entry => castRank >= entry.minRank).flatMap(entry => structuredClone(entry.rules))];
}
