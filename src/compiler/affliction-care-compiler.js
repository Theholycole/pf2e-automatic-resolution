// Affliction care: no-save spells that act on a creature's existing
// afflictions and conditions (reduce a stage, force an affliction save,
// reduce conditions, counteract an effect or an affliction, and the damage or
// healing that comes with it). The recipient is the target, the caster (no
// Target), or — for a counteract against "the target" — whatever the GM names
// (a spell effect on a creature, an area or an item). Every sentence must match an
// operation phrase below; heightened entries add or change operations by
// rank. The runtime applies these operations to the affliction handler's
// Effects (Pseudo Afflictions: stage = badge) under PF2e's affliction rules.
import { htmlToPlainText } from "./description-parser.js";

const WORD = { one: 1, two: 2, three: 3 };
const num = value => WORD[String(value).toLowerCase()] ?? Number(value);
const unitOf = value => ({ day: "days", hour: "hours", minute: "minutes", round: "rounds" })[String(value).toLowerCase().replace(/s$/, "")];
const slug = value => String(value).trim().toLowerCase();
const listOf = text => String(text).split(/,\s*(?:or\s+|and\s+)?|\s+(?:or|and)\s+/).map(slug).filter(Boolean);
// "poisons" / "diseases" name the affliction traits.
const singular = value => slug(value).replace(/s$/, "");
// A counteract operation: what can be picked (effects by trait or granted condition, afflictions by trait, or any
// spell effect / other target), how many, and on whom.
const counteract = (source, traits = [], extra = {}) => ({ op: "counteract", pick: 1, source, traits, grantsConditions: [], ...extra });

// Opening narration: no numbers, conditions or rule verbs.
const RULE_WORDS = /\d|\b(?:reduce|decrease|increase|attempt|save|saving throw|immune|damage|counteract|choose|stage|condition|bonus|penalty|DC)\b/i;
const CONDITION_NAMES = /\b(?:blinded|clumsy|confused|controlled|dazzled|deafened|doomed|drained|enfeebled|fascinated|fatigued|frightened|sickened|slowed|stunned|stupefied)\b/i;

function paragraphs(html) {
    return [...String(html ?? "").matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(([, tag, inner]) => {
        const head = /^\s*<strong\b[^>]*>\s*([^<]+?)\s*<\/strong>\s*([\s\S]*)$/i.exec(inner);
        return head ? { tag, heading: head[1].trim(), text: htmlToPlainText(head[2]).trim() } : { tag, heading: null, text: htmlToPlainText(inner).trim() };
    });
}
const unlink = text => String(text).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
const sentencesOf = text => unlink(text).split(/(?<=[.!?])\s+(?=[A-Z@(])/).map(value => value.trim()).filter(Boolean);

/** Sentence forms → partial plan pieces. Each returns an object or null. */
const FORMS = [
    // Restorative Moment
    [/^The target decreases the values of any (\w+)(?: and (\w+))? conditions it has by (\d+) and can immediately attempt one saving throw against each affliction it has with a stage length of (\d+|one) (day|hour|minute|round)s? or less\.$/i,
        m => ({ operations: [
            { op: "decrease-conditions", slugs: [m[1], m[2]].filter(Boolean).map(slug), by: Number(m[3]) },
            { op: "affliction-saves", each: true, maxStageLength: { value: num(m[4]), unit: unitOf(m[5]) }, modifier: 0 }] })],
    [/^The target is then temporarily immune for (\d+|one) (day|hour|minute)s?\.$/i, m => ({ immunity: { value: num(m[1]), unit: unitOf(m[2]) } })],
    // Restoration
    [/^When you cast (?:[a-z' ]+|this spell), choose to either reduce a condition or lessen the effect of a toxin\.$/i, () => ({ modeChoice: ["reduce-condition", "lessen-toxin"] })],
    [/^A creature can benefit from only one ([a-z' ]+) spell each day, and it can't benefit from \1 more than once to reduce the stage of the same exposure to a given toxin\.$/i,
        () => ({ dailyLimit: { value: 1, unit: "days" }, oncePerExposure: true })],
    // Take its Course
    [/^This spell attempts to progress a disease affliction, a poison affliction, or persistent poison damage affecting the target\.$/i,
        () => ({ progressTargets: ["disease", "poison", "persistent-poison"] })],
    [/^If the target is affected by more than one of these, you can choose from among those you are aware of; otherwise the GM chooses randomly\.$/i, () => ({ pickOne: true })],
    [/^An unwilling target can attempt a (Fortitude|Reflex|Will) save to negate [a-z' ]+\.$/i, m => ({ unwillingSave: { statistic: slug(m[1]), negates: true } })],
    [/^The effect of this spell depends on whether you're attempting to end an affliction or persistent poison damage, and whether you are attempting to help or hinder the target's recovery\.$/i, () => ({})],
    // Ectoplasmic Expulsion
    [/^You immediately attempt to counteract a single effect on the target with the ([a-z]+) or ([a-z]+) trait, or an effect giving the target the ([A-Za-z]+) or ([A-Za-z]+) condition\.$/i,
        m => ({ operations: [{ op: "counteract", pick: 1, traits: [slug(m[1]), slug(m[2])], grantsConditions: [slug(m[3]), slug(m[4])] }] })],
    // Empty Inside: "Attempt a counteract check against one emotion effect affecting you."
    [/^Attempt a counteract check against one ([a-z]+) effect affecting you\.$/i, m => ({ subject: "self", operations: [counteract("effect", [slug(m[1])])] })],
    // Dispel Magic: "Attempt a counteract check against the target." (Target: a spell effect or an unattended magic item)
    [/^Attempt a counteract check against the target\.$/i, () => ({ subject: "counteract-target", operations: [counteract("spell-effect", [], { otherTargets: true })] })],
    [/^If you successfully counteract a magic item, the item becomes a mundane item of its type for (\d+) (minute|hour)s?\.$/i,
        m => ({ magicItem: { value: Number(m[1]), unit: unitOf(m[2]) } })],
    [/^This doesn't change the item's non-magical properties\.$/i, () => ({ magicItemNote: true })],
    [/^If the target is an artifact or similar item, you automatically fail\.$/i, () => ({ artifactFails: true })],
    // Purging Toxins: "Deal poison damage equal to the spell's rank to the target, then attempt a counteract check against
    // one disease or poison afflicting the target."
    [/^Deal ([a-z]+) damage equal to the spell's rank to the target, then attempt a counteract check against one ([a-z]+) or ([a-z]+) afflicting the target\.$/i,
        m => ({ subject: "target", operations: [{ op: "damage", damageType: slug(m[1]), amount: "rank" }, counteract("affliction", [singular(m[2]), singular(m[3])])] })],
    [/^If the target is immune to ([a-z]+), this spell has no effect\.$/i, m => ({ negatedByImmunity: slug(m[1]) })],
    // Cleanse Affliction: choose an affliction; reduce its stage once per case; heightened ranks counteract it.
    [/^Choose an affliction on the target, such as an? (.+?)\.$/i, m => ({ subject: "target", chooseAffliction: listOf(m[1]) })],
    [/^If it has advanced past stage one, reduce the stage by one\.$/i, () => ({ reduceChosen: 1 })],
    [/^This reduction can be applied only once to a given case of an affliction, with the case ending when it's completely cured\.$/i, () => ({ oncePerExposure: true })],
    [/^Although the reduction can't occur again, heightened versions of this spell attempt to counteract with each casting\.$/i, () => ({})],
    // Counteracting a spell as it's cast (the GM names it, its rank and DC; the card says what a success does):
    // "You attempt to counteract the triggering spell." / "Attempt to counteract the target spell."
    [/^(?:You attempt to counteract the triggering spell|Attempt to counteract the target spell)\.$/i,
        () => ({ subject: "triggering-spell", operations: [counteract("triggering-spell", [], { otherTargets: true })] })],
    // Nullify: "You automatically counteract the spell, but the feedback brings you unavoidable harm."
    [/^You automatically counteract the spell, but the feedback brings you unavoidable harm\.$/i,
        () => ({ subject: "triggering-spell", operations: [counteract("triggering-spell", [], { otherTargets: true, automatic: true })] })],
    // "You lose 1d8 Hit Points per rank of the triggering spell."
    [/^You lose (\d+)d(\d+) Hit Points per rank of the triggering spell\.$/i,
        m => ({ operations: [{ op: "lose-hp", recipient: "caster", dice: Number(m[1]), faces: Number(m[2]), per: "triggering-rank" }] })],
    // Spell Riposte: "If the spell would be counteracted, it instead continues with the caster as a target instead of you."
    [/^If the spell would be counteracted, it instead continues with the caster as a target instead of you\.$/i,
        () => ({ counteractOutcome: { success: "Instead of ending, it continues with its caster as the target instead of you." } })],
    // "Spell riposte can't affect spells that aren't targeted (such as area spells)."
    [/^[a-z' ]+ can't affect spells that aren't targeted \(such as area spells\)\.$/i, m => ({ counteractLimit: m[0] })],
    // Shadow Siphon: a success halves the damage; the spell otherwise works as normal.
    [/^If the attempt is successful, any creatures that would be damaged by the spell instead take only half as much damage, but the spell otherwise works as normal\.$/i,
        () => ({ counteractOutcome: { success: "Instead of ending, it works as normal, but creatures it would damage take only half as much damage." } })],
    // "Treat shadow siphon's counteract rank as 2 higher for this attempt."
    [/^Treat [a-z' ]+'s counteract rank as (\d+) higher for this attempt\.$/i, m => ({ counteractRankBonus: Number(m[1]) })],
    // Disjunction (Target: 1 magic item): "You attempt to counteract it. If you succeed, it's deactivated for 1 week. On a
    // critical success, it's destroyed. If it's an artifact or similar item, you automatically fail."
    [/^You attempt to counteract it\.$/i, () => ({ subject: "counteract-target", operations: [counteract("other", [], { otherTargets: true })] })],
    [/^If you succeed, it's deactivated for (\d+) (week|day|hour|minute)s?\.$/i, m => ({ counteractOutcome: { success: `It's deactivated for ${m[1]} ${m[2]}${m[1] === "1" ? "" : "s"}.` } })],
    [/^On a critical success, it's destroyed\.$/i, () => ({ counteractOutcome: { criticalSuccess: "It's destroyed." } })],
    [/^If it's an artifact or similar item, you automatically fail\.$/i, () => ({ artifactFails: true })],
    // Return To Essence (Target: a warded doorway or chest): a counteract against the ward; a success restores a slot.
    [/^Attempt a counteract check against the target spell or magical effect that wards or seals a doorway or chest, such as [A-Za-z' ]+, or against a spell or effect that deals damage or delivers secondary effects when it's opened, such as [A-Za-z' ]+\.$/i,
        () => ({ subject: "counteract-target", operations: [counteract("other", [], { otherTargets: true })] })],
    [/^If you succeed, you recover its energy, restoring one of your expended spell slots of (\d+)(?:st|nd|rd|th) rank or lower\.$/i,
        m => ({ restoreSlot: Number(m[1]) })],
    // Healing alongside a counteract: "The target regains 16 Hit Points." / "The target recovers 3d8 Hit Points."
    [/^The target (?:regains|recovers) (\d+d\d+(?:\+\d+)?|\d+) Hit Points\.$/i, m => ({ subject: "target", operations: [{ op: "heal", formula: m[1] }] })],
    // Luminous Stardust Healing: a possession effect, if any, is counteracted; the outcome for the entity is the GM's.
    [/^If they were affected by a possession effect, you attempt to counteract the effect, casting out the possessing entity on a success and preventing them from possessing the target again for (\d+) (week|day|hour)s?\.$/i,
        m => ({ subject: "target", operations: [counteract("effect", ["possession"], { optional: true })],
            counteractOutcome: { success: `The possessing entity is cast out and can't possess the target again for ${m[1]} ${m[2]}${m[1] === "1" ? "" : "s"}.` } })],
    [/^If you fail, the entity is immune to being cast out by this spell for (\d+) (week|day|hour)s?, though you can still heal the target as normal\.$/i,
        m => ({ counteractOutcome: { failure: `The entity is immune to being cast out by this spell for ${m[1]} ${m[2]}${m[1] === "1" ? "" : "s"}.` } })],
    // Delay Affliction: "You attempt to counteract any one affliction you are aware the target has, suspending its effects
    // for 1 hour on a success rather than removing it."
    [/^You attempt to counteract any one affliction you are aware the target has, suspending its effects for (\d+|one) (hour|minute|day)s? on a success rather than removing it\.$/i,
        m => ({ subject: "target", operations: [counteract("affliction", [], { anyAffliction: true, setAside: { mode: "suspend", duration: { value: num(m[1]), unit: unitOf(m[2]) } } })] })],
    [/^The target is then temporarily immune to [a-z' ]+ for (\d+|one) (day|hour|minute)s?\.$/i, m => ({ immunity: { value: num(m[1]), unit: unitOf(m[2]) } })],
    [/^You don't need to have identified the name of the specific affliction, but you do need to be aware of it; for instance, [^.]+\.?$/i, m => ({ awareness: m[0] })],
    // Sound Body: an effect imposing one of the listed conditions; a near miss (2 ranks) suppresses it instead.
    [/^Attempt to counteract an effect of your choice imposing one of these conditions on the target: (.+?)\.$/i,
        m => ({ subject: "target", operations: [counteract("effect", [], { grantsConditions: listOf(m[1]) })] })],
    [/^If you (?:didn't|failed to) counteract the effect,? but you would have if its counteract rank were (\d+) lower, instead suppress the effect until the beginning of your next turn\.$/i,
        m => ({ nearMiss: { ranks: Number(m[1]), setAside: { mode: "suppress", until: "caster-next-turn-start" } } })],
    [/^The effect's duration doesn't elapse while it's suppressed\.$/i, () => ({ pauseWhileSuppressed: true })],
    [/^This spell can't counteract or suppress (.+?), or conditions that are part of the target's normal state\.$/i,
        m => ({ excludeTraits: listOf(m[1]).map(singular), normalStateNote: m[0] })],
    // Clear Mind: "This spell can't counteract or suppress conditions that are part of curses, diseases, or a natural state of the target."
    [/^This spell can't counteract or suppress conditions that are part of ([a-z]+), ([a-z]+), or a natural state of the target\.$/i,
        m => ({ excludeTraits: [singular(m[1]), singular(m[2])], normalStateNote: m[0] })],
    // Cleansing Flames: "You can attempt to counteract a single poison or non-curse effect imparting the Clumsy, …, or
    // Stupefied condition." — an effect (or a poison affliction) giving one of them, never a curse.
    [/^You can attempt to counteract a single poison or non-curse effect imparting the (.+?) condition\.$/i,
        m => ({ subject: "target", excludeTraits: ["curse"], operations: [counteract("effect", [], { grantsConditions: listOf(m[1]), afflictionTraits: ["poison"] })] })],
    // "The target can choose to empower the flames with their life force, becoming Drained 1 (or increasing their drained
    // value by 1, if already under the condition) to grant you a +1 circumstance bonus to your counteract check."
    [/^The target can choose to empower [a-z ]+ with their life force, becoming (Drained) 1 \(or increasing their drained value by 1, if already under the condition\) to grant you a \+(\d+) (circumstance) bonus to your counteract check\.$/i,
        m => ({ empower: { condition: slug(m[1]), bonus: Number(m[2]), type: slug(m[3]) } })],
    // Soothing Ballad: "Choose one of the following three effects:" then list items for the targets.
    [/^Choose one of the following (?:two|three|\d+) effects:$/i, () => ({ listModes: true })],
    // Standing wards: the spell lasts and counteracts something whenever it comes up. The GM uses the ward's control
    // (Ongoing spells) each time; the counteract rank is the ward's cast rank.
    // Spell Immunity: "Choose a spell and name it aloud …" + "… attempts to counteract that spell whenever …'s target is
    // the target of the named spell or in that spell's area."
    [/^Choose a spell and name it aloud as part of the verbal component\.$/i, () => ({ ward: { named: true } })],
    [/^[a-z' ]+ attempts to counteract that spell whenever [a-z' ]+'s target is the target of the named spell or in that spell's area\.$/i,
        () => ({ subject: "target", operations: [{ op: "ward" }], ward: { trigger: "Whenever the warded creature is a target of the named spell or in its area." } })],
    // "Successfully counteracting a spell that targets an area or multiple targets … negates the effects only for the …target."
    [/^Successfully counteracting a spell that targets an area or multiple targets(?: with [a-z' ]+)? negates the effects (?:only for|for only) [a-z' ]+?target(?: affected by [a-z' ]+)?\.$/i,
        m => ({ ward: { notes: [m[0]] } })],
    // Veil of Privacy: "… attempts to counteract all detection, revelation, and scrying effects used against the target or
    // the target's gear throughout the duration, counting cantrips as 1st-rank spells for this purpose."
    [/^[a-z' ]+ attempts to counteract all ([a-z, ]+) effects used against the target or the target's gear throughout the duration, counting cantrips as 1st-rank spells for this purpose\.$/i,
        m => ({ subject: "target", operations: [{ op: "ward" }], ward: { trigger: `Whenever ${m[1]} effects are used against the warded creature or its gear.`, cantripRank: 1 } })],
    // Rigid Form: "For the duration of this spell, whenever you're targeted by a harmful polymorph effect, you can use your
    // reaction to attempt to counteract the effect."
    [/^For the duration of this spell, whenever you're targeted by a harmful ([a-z]+) effect, you can use your reaction to attempt to counteract the effect\.$/i,
        m => ({ subject: "self", operations: [{ op: "ward" }], ward: { trigger: `Whenever you're targeted by a harmful ${m[1]} effect.`, reaction: true } })],
    // Spell Turning: a reaction that reflects a targeted spell; it ends after one attempt.
    [/^When a spell targets you, you can spend a reaction to attempt to reflect it\.$/i,
        () => ({ subject: "self", operations: [{ op: "ward" }], ward: { trigger: "When a spell targets you.", reaction: true } })],
    [/^This uses the rules for counteracting the spell, but if the spell is successfully counteracted, the effect is turned back on the caster\.$/i,
        () => ({ ward: { successText: "The spell is turned back on its caster." } })],
    [/^Whether or not the counteract attempt is successful, [a-z' ]+ then ends\.$/i, () => ({ ward: { endsAfterUse: true } })],
    [/^[a-z' ]+ can't affect spells that aren't targeted \(such as area spells\)\.$/i, m => ({ ward: { notes: [m[0]] } })],
    [/^If [a-z' ]+ reflects a spell back at a caster who is also under the effect of [a-z' ]+, their [a-z' ]+ can attempt to reflect their own spell back at you again; if they do so, their counteract attempt automatically succeeds\.$/i,
        m => ({ ward: { notes: [m[0]] } })],
    // Area wards on the caster (who places the area): Planar Seal, Dispelling Globe.
    [/^You create a visible magical barrier that attempts to counteract (teleportation effects and planar travel) into or out of the area, including items that allow access to extradimensional spaces\.$/i,
        m => ({ subject: "self", operations: [{ op: "ward" }], ward: { trigger: `${m[1].charAt(0).toUpperCase()}${m[1].slice(1)} into or out of the area (including items that access extradimensional spaces).` } })],
    [/^[a-z' ]+ tries to counteract any attempt to summon a creature into the area but doesn't stop the creature from departing when the summoning ends\.$/i,
        m => ({ ward: { notes: [m[0]] } })],
    // "… attempts to counteract any spell from outside the globe whose area or targets enter into the globe, as if the globe
    // were a Dispel Magic spell 1 rank lower than its actual spell rank."
    [/^You create an immobile globe around yourself that attempts to counteract any spell from outside the globe whose area or targets enter into the globe, as if the globe were a Dispel Magic spell (\d+) rank lower than its actual spell rank\.$/i,
        m => ({ subject: "self", operations: [{ op: "ward" }], ward: { trigger: "A spell from outside the globe whose area or targets enter the globe.", rankOffset: -Number(m[1]) } })],
    [/^If the counteract attempt succeeds, it prevents only the portion of the spell that would have entered the globe (\(.+\))\.$/i,
        () => ({ ward: { successText: "Only the portion of the spell that would have entered the globe is prevented; targets or area outside it are affected normally." } })],
    [/^You must form the sphere in an unbroken open space, so its edges don't pass through any creatures or objects, or the spell is lost \(though creatures can enter the globe after the spell is cast\)\.$/i,
        m => ({ castingCondition: [m[0]] })],
    // Seeing through (Truesight, Glimpse the Truth): the GM's secret check; a success reveals the truth but ends nothing.
    [/^You see things within (\d+) feet as they actually are\.$/i, m => ({ ward: { range: Number(m[1]) } })],
    [/^The GM rolls a secret counteract check against any ([a-z, ]+?) effect in the area, but only for the purpose of determining whether you see through it \(for instance, .+\)\.$/i,
        m => ({ subject: "self", operations: [{ op: "ward" }], ward: { trigger: `Any ${m[1]} effect in the area.`, secret: true, seeThrough: true, successText: "You see through it (it doesn't end)." } })],
    [/^The GM attempts a secret counteract check against each illusion that is at least partially within the area\.$/i,
        () => ({ subject: "self", operations: [{ op: "ward" }], ward: { trigger: "Each illusion at least partially within the area (and each new one that comes into it).", secret: true } })],
    [/^Instead of counteracting the illusion, you see through it \(for instance, .+\)\.$/i, () => ({ ward: { seeThrough: true, successText: "You see through it (it doesn't end)." } })],
    [/^Each time a new illusion comes into the aura during the duration of the spell, the GM attempts a secret counteract check for that illusion\.$/i, () => ({})],
    // Unblinking Flame Revelation: "The GM attempts a secret counteract check against each illusion affecting the creature;
    // on a success, you suppress the illusion for the duration, rather than end the effect."
    [/^The GM attempts a secret counteract check against each illusion affecting the creature; on a success, you suppress the illusion for the duration, rather than end the effect\.$/i,
        () => ({ subject: "target", operations: [counteract("effect", ["illusion"], { pick: "any", secret: true, setAside: { mode: "suppress", duration: "spell" } })] })],
    // Elemental Counter: a spell slot of the countering element is lost, and its rank is the counteract rank.
    [/^You lose your spell slot as if you had cast the triggering spell\.$/i, () => ({ costSlot: true })],
    [/^You then attempt to counteract the triggering spell, using the rank of the spell you lost for the counteract rank\.$/i,
        () => ({ subject: "triggering-spell", operations: [counteract("triggering-spell", [], { otherTargets: true, rankFromLostSlot: true })] })],
    // "You can lose a plant or wood spell to counter earth, an earth spell to counter water, …": the elemental cycle.
    [/^You can lose (an? [a-z ,]+ spell to counter [a-z ]+(?:, (?:or )?an? [a-z ]+ spell to counter [a-z ]+)+)\.$/i, m => {
        const cycle = {};
        for (const [, lost, countered] of m[1].matchAll(/an? ([a-z ]+?) spell to counter ([a-z ]+?)(?=,|$)/g)) {
            for (const target of listOf(countered)) cycle[target] = [...new Set([...(cycle[target] ?? []), ...listOf(lost)])];
        }
        return { elementCycle: cycle };
    }],
    // Thief of Fortune: "Attempt a counteract check against the target spell effect. If you successfully counteract the effect, the effect does not
    // end. Instead, you gain the effect of the target spell as well. If you would not be a valid target for the spell, you do not gain any of its
    // benefits." / "The spell's duration is halved as you siphon off its magical energy for yourself. Each round that both you and the original
    // creature are affected by the spell counts for two rounds when determining the spell's duration. You can Dismiss the spell." — a counteract
    // against a spell Effect on the targeted creature; a success copies it to the caster, and both keep half its remaining time.
    [/^Attempt a counteract check against the target spell effect\.$/i, () => ({ subject: "target", operations: [counteract("spell-effect", [], { siphon: true })] })],
    [/^If you successfully counteract the effect, the effect does not end\.$/i, () => ({})],
    [/^Instead, you gain the effect of the target spell as well\.$/i, () => ({})],
    [/^If you would not be a valid target for the spell, you do not gain any of its benefits\.$/i, () => ({ castingCondition: ["You gain the effect only if you'd be a valid target for that spell."] })],
    [/^The spell's duration is halved as you siphon off its magical energy for yourself\.$/i, () => ({})],
    [/^Each round that both you and the original creature are affected by the spell counts for two rounds when determining the spell's duration\.$/i, () => ({})],
    [/^You can Dismiss the spell\.$/i, () => ({ castingCondition: ["Dismissing it ends your copy of the effect (delete it)."] })],
    // Detonate Magic: a counteract against a magic item or spell effect; a success sets off an explosion (a basic save).
    [/^You attempt to counteract the target\.$/i, () => ({ subject: "counteract-target", operations: [counteract("spell-effect", [], { otherTargets: true })] })],
    [/^If the attempt succeeds, (an explosion of [a-z ]+ deals (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save)\.$/i,
        m => ({ explosion: { sentence: `${m[1].charAt(0).toUpperCase()}${m[1].slice(1)}.`, formula: m[2], damageType: slug(m[3]), statistic: slug(m[4]) } })],
    [/^If you successfully counteract the magic of an item, it's deactivated for (\d+) (week|day)s? \(or destroyed on a critical success\) and the explosion is a (\d+)-foot emanation from the item\.$/i,
        m => ({ counteractOutcome: { success: `It's deactivated for ${m[1]} ${m[2]}${m[1] === "1" ? "" : "s"}; the explosion is a ${m[3]}-foot emanation from it.`,
            criticalSuccess: `It's destroyed; the explosion is a ${m[3]}-foot emanation from it.` } })],
    [/^If you successfully counteract a spell, the effect ends and the explosion affects either all creatures in the spell's area or the target of the spell and all creatures in a (\d+)-foot emanation around it\.$/i,
        m => ({ explosionNote: `The spell's effect ends; the explosion affects all creatures in the spell's area, or the spell's target and all creatures within ${m[1]} feet of it.` })],
    // Harmonize Self: the options are list items (see LIST_MODES).
    [/^You heal yourself in one of the following ways, chosen by you when you cast the spell\.$/i, () => ({ subject: "self", listModes: true })],
    [/^If you fail to counteract the effect, you nevertheless set up a resonance that allows the target to more ably escape the effect on its own; for the next (hour|minute|day), the target gains a \+(\d+) status bonus to (Will) saves to shrug off the effect you failed to counteract \(such as [^)]+\)\.$/i,
        m => ({ counteractFailure: { bonus: Number(m[2]), type: "status", statistic: slug(m[3]), duration: { value: 1, unit: unitOf(m[1]) } } })],
    // Word of Freedom, Tireless Worker: "You suppress one of the following conditions of your choice: Confused, Frightened, Grabbed,
    // Paralyzed, or Restrained." / "You suppress your choice of one of the following conditions that's affecting the target: Clumsy, …":
    // the chosen condition is set aside for the spell's duration and returns afterwards (its own duration paused).
    [/^You suppress (?:one of the following conditions of your choice|your choice of one of the following conditions that's affecting the target): ([A-Za-z, ]+)\.$/i,
        m => ({ operations: [{ op: "suppress-condition", from: listOf(m[1]), setAside: { mode: "suppress", duration: "spell" } }] })],
    [/^The target isn't affected by the chosen condition, and if you suppress the Grabbed or Restrained condition, the target automatically breaks free from the grab or restraint when you Cast the Spell\.$/i,
        () => ({ suppressNote: "Suppressing Grabbed or Restrained frees the target from the grab or restraint when the spell is cast." })],
    [/^If you don't remove the effect that provided the condition, the condition returns after the spell ends\.$/i, () => ({})],
    [/^For example, if a spell was making the target [A-Za-z]+ for \d+ minutes?, [a-z ]+ would let the target act normally for a round, but the [A-Za-z]+ condition would return afterward\.$/i, () => ({})],
    [/^The duration of the condition doesn't elapse while it is suppressed, so if you don't remove the effect that caused the condition, the condition returns after the spell's duration expires\.$/i, () => ({})]
];

/** Mode paragraphs ("<strong>Lessen a Toxin</strong> …"). */
const MODES = [
    [/^Lessen a Toxin$/i, text => {
        const parts = sentencesOf(text);
        const reduce = /^Reduce the stage of one toxin the target suffers from by (one|two|\d+) stages?\.$/i.exec(parts[0] ?? "");
        if (!reduce || parts[1] !== "This can't reduce the stage below stage 1 or cure the affliction." || parts.length !== 2) return null;
        return { id: "lessen-toxin", label: "Lessen a toxin", operations: [{ op: "reduce-affliction-stage", traits: ["poison"], pick: 1, by: num(reduce[1]), floor: 1 }] };
    }],
    [/^Reduce a Condition$/i, text => {
        const parts = sentencesOf(text);
        const reduce = /^Reduce the value of the target's (.+?) condition by (\d+)\.$/i.exec(parts[0] ?? "");
        if (!reduce || parts[1] !== "You can instead reduce two of the listed conditions by 1 each." || parts.length !== 2) return null;
        return { id: "reduce-condition", label: "Reduce a condition", operations: [{ op: "reduce-conditions", from: listOf(reduce[1]), patterns: [[Number(reduce[2])], [1, 1]] }] };
    }],
    [/^Affliction$/i, text => {
        const parts = sentencesOf(text);
        const bonus = /^You can grant the creature your choice of a \+(\d+) status bonus or a [-–](\d+) status penalty to its saving throw against the affliction\.$/i.exec(parts[1] ?? "");
        if (parts[0] !== "The target immediately attempts its next saving throw against the affliction." || !bonus || parts.length !== 2) return null;
        return { id: "progress-affliction", label: "Progress an affliction", operations: [{ op: "affliction-save", traits: ["disease", "poison"], pick: 1,
            modifierChoice: [Number(bonus[1]), -Number(bonus[2])], modifierType: "status" }] };
    }],
    [/^Persistent Poison$/i, text => {
        const parts = sentencesOf(text);
        const dc = /^You can set the DC of that flat check to (\d+) or (\d+) instead of the normal DC\.$/i.exec(parts[2] ?? "");
        if (parts[0] !== "You can cause the target take the persistent poison damage immediately when you Cast this Spell (in addition to taking it at the end of its next turn)."
            || parts[1] !== "Whether or not you do so, the target attempts an additional flat check against the persistent poison damage." || !dc || parts.length !== 3) return null;
        return { id: "progress-persistent-poison", label: "Progress persistent poison", operations: [{ op: "persistent-damage", damageType: "poison", pick: 1,
            damageNowOptional: true, flatCheckDCChoice: [Number(dc[1]), Number(dc[2])] }] };
    }]
];

/** Options written as list items after "… in one of the following ways": each becomes a mode. */
const LIST_MODES = [
    // Soothing Ballad's options, for every target.
    [/^The spell attempts to counteract ([a-z]+) effects on the targets\.$/i,
        m => ({ id: `counteract-${slug(m[1])}`, label: `Counteract ${slug(m[1])} effects`, operations: [counteract("effect", [slug(m[1])], { pick: "any" })] })],
    [/^The spell attempts to counteract effects imposing (paralysis) on the targets\.$/i,
        () => ({ id: "counteract-paralysis", label: "Counteract paralysis", operations: [{ ...counteract("effect", [], { pick: "any" }), grantsConditions: ["paralyzed"] }] })],
    [/^The spell restores (\d+d\d+(?:\+\d+)?|\d+) Hit Points to the targets\.$/i, m => ({ id: "heal", label: `Restore ${m[1]} Hit Points`, operations: [{ op: "heal", formula: m[1] }] })],
    [/^You regain (\d+) Hit Points\.$/i, m => ({ id: "heal", label: `Regain ${m[1]} Hit Points`, operations: [{ op: "heal", formula: m[1] }] })],
    [/^You attempt to cure one ([a-z]+) or ([a-z]+) afflicting you; attempt to counteract the affliction\.$/i,
        m => ({ id: "counteract", label: `Counteract a ${slug(m[1])} or ${slug(m[2])}`, operations: [counteract("affliction", [singular(m[1]), singular(m[2])])] })]
];

/** Heightened entries: each sentence changes the plan at and above that rank. */
const HEIGHTENED = [
    [/^Add (\w+) to the list of conditions you can reduce\.$/i, m => ({ addCondition: slug(m[1]) })],
    [/^When you lessen a toxin, reduce the stage by (one|two|\d+)\.$/i, m => ({ lessenBy: num(m[1]) })],
    [/^You also gain a third option that allows you to reduce the target's (\w+) value by (\d+)\.$/i, m => ({ addMode: { id: `reduce-${slug(m[1])}`, label: `Reduce ${slug(m[1])}`,
        operations: [{ op: "reduce-conditions", from: [slug(m[1])], patterns: [[Number(m[2])]], excludePermanent: false }] } })],
    [/^You can't use this to reduce a permanent (\w+) condition\.$/i, m => ({ excludePermanent: slug(m[1]) })],
    [/^As the (\d+)(?:st|nd|rd|th)-rank [a-z' ]+, but you can reduce a permanent (\w+) condition if you add a spellcasting action and a material component while Casting the Spell, during which you provide (\d+) gp worth of ([a-z ]+) as a cost\.$/i,
        m => ({ permitPermanent: slug(m[2]), cost: `${m[3]} gp of ${m[4]}` })],
    [/^You can attempt to progress any number of the target's eligible afflictions and persistent poison damage\.$/i, () => ({ pickAny: true })],
    // "You can attempt counteract checks against any number of emotion effects affecting you." / "… of poisons or
    // diseases afflicting the target."
    [/^You can attempt counteract checks against any number of (?:[a-z]+ effects affecting you|[a-z]+ or [a-z]+ afflicting the target)\.$/i, () => ({ counteractAny: true })],
    // Cleanse Affliction: "Attempt to counteract the affliction if it is a disease or poison."
    [/^Attempt to counteract the affliction if it is an? (.+?)\.$/i, m => ({ counteractChosen: listOf(m[1]) })],
    // Sound Body: "Add Drained and Slowed to the list of conditions." / "As 4th rank, plus add petrified and Stunned."
    [/^Add ([A-Za-z]+(?:, [A-Za-z]+)*,? and [A-Za-z]+|[A-Za-z]+) to the list of conditions\.$/i, m => ({ addCounteractConditions: listOf(m[1]) })],
    [/^As \d+(?:st|nd|rd|th) rank, plus add (.+?)\.?$/i, m => ({ addCounteractConditions: listOf(m[1]) })],
    // Glimpse the Truth: "You can allow everyone within range of the emanation to see through illusions you succeed against,
    // not just yourself."
    [/^You can allow everyone within range of the emanation to see through illusions you succeed against, not just yourself\.$/i,
        m => ({ wardNote: m[0] })],
    // Rigid Form: "The duration increases to 10 minutes." (a ward's duration by rank)
    [/^The duration increases to (\d+) (minute|hour)s?\.$/i, m => ({ wardDuration: { value: Number(m[1]), unit: unitOf(m[2]) } })],
    // Return To Essence: "You can restore an expended spell slot of 4th rank or lower."
    [/^You can restore an expended spell slot of (\d+)(?:st|nd|rd|th) rank or lower\.$/i, m => ({ restoreSlot: Number(m[1]) })]
];
// "Heightened (+1) If you choose to regain Hit Points, the Hit Points regained increase by 8." — must be the healing
// entry's own interval heightening, which PF2e's roll applies.
const INTERVAL = [/^If you choose to regain Hit Points, the Hit Points regained increase by (\d+)\.$/i, /^The amount of healing increases by (\d+d\d+|\d+)\.$/i,
    /^When used to heal, [a-z' ]+ restores (\d+d\d+|\d+) more Hit Points\.$/i,
    // Delay Affliction: "The target recovers an additional 1d8 Hit Points, and you can attempt to suspend an additional affliction"
    /^The target recovers an additional (\d+d\d+|\d+) Hit Points(, and you can attempt to suspend an additional affliction)\.?$/i];

export function compileAfflictionCare(adapted) {
    // A save is read only as an unwilling target's negation, or as the explosion a successful counteract sets off.
    if (adapted.defense?.kind === "save" && !/unwilling target can attempt|If the attempt succeeds, an explosion of [a-z ]+ deals \d+d\d+ [a-z]+ damage with a basic/i.test(htmlToPlainText(adapted.descriptionHTML))) return null;
    const target = String(adapted.targeting?.target ?? "").trim();
    // The recipient: a creature (willing or not), the caster (no Target), or a counteract's named target.
    // A reaction to a spell ("Trigger You're the target of a spell …") counteracts that spell, not a creature.
    const spellTrigger = /<strong>\s*Trigger\s*<\/strong>[^<]*\bspell\b/i.test(String(adapted.descriptionHTML ?? ""));
    const many = /^you and up to (\d+) allies$/i.exec(target);
    // "1 creature or object" is read only for a ward (checked below), on a creature.
    const creatureOrObject = /^(?:1|one) creature or object$/i.test(target);
    // "the creature you hit": a creature the caster just hit (the caster judges that).
    const youHit = /^the creature you hit$/i.test(target);
    const recipient = /^(?:1|one) (?:willing )?creature$/i.test(target) || creatureOrObject || youHit ? "target" : many ? "targets"
        : /^the triggering spell$/i.test(target) || (!target && spellTrigger) ? "triggering-spell"
        : !target ? "self"
        : /^(?:1|one) (?:spell effect or unattended magic item|magic item|magic item or spell effect|magically sealed or warded doorway or chest)$/i.test(target) ? "counteract-target"
        // Thief of Fortune: a spell effect on a creature (the creature targeted), lasting no longer than stated.
        : /^one beneficial spell effect currently affecting a creature, with a duration of \d+ (?:minutes?|rounds?) or less$/i.test(target) ? "target" : null;
    if (!recipient) return null;
    // What the GM names for a counteract against "the target": an item, a warded door or chest, or either kind.
    const otherKinds = /magic item$/i.test(target) && !/spell effect/i.test(target) ? ["item"] : /doorway or chest$/i.test(target) ? ["spell"] : ["spell", "item"];
    const html = String(adapted.descriptionHTML ?? "");
    const heightenAt = html.search(/<strong\b[^>]*>\s*Heightened\b/i);
    const body = paragraphs(heightenAt >= 0 ? html.slice(0, html.lastIndexOf("<p", heightenAt)) : html.replace(/<hr\b[^>]*>/gi, ""));
    const plan = { kind: "affliction-care", recipient, ...(youHit ? { castingCondition: ["Target: the creature you hit."] } : {}), ...(many ? { maxTargets: Number(many[1]) + 1, includesCaster: true } : {}), modes: [], operations: [], heightened: [] };
    let narrated = false;
    for (const paragraph of body) {
        // A reaction's trigger or a Requirements line says when it can be cast; the caster judges it.
        if (/^(?:Trigger|Requirements)$/i.test(paragraph.heading ?? "")) { plan.castingCondition = [...(plan.castingCondition ?? []), `${paragraph.heading} ${paragraph.text}`]; continue; }
        if (paragraph.tag === "li" && plan.listModes) {
            const form = LIST_MODES.find(([pattern]) => pattern.test(paragraph.text));
            if (!form) return { blocked: `list-mode:${paragraph.text}` };
            plan.modes.push(form[1](form[0].exec(paragraph.text)));
            continue;
        }
        if (paragraph.heading) {
            const mode = MODES.find(([pattern]) => pattern.test(paragraph.heading));
            const compiled = mode?.[1](paragraph.text);
            if (!compiled) return { blocked: `mode:${paragraph.heading}` };
            plan.modes.push(compiled);
            continue;
        }
        for (const sentence of sentencesOf(paragraph.text)) {
            const form = FORMS.find(([pattern]) => pattern.test(sentence));
            if (form) {
                const piece = form[1](form[0].exec(sentence));
                plan.operations.push(...(piece.operations ?? []));
                for (const [key, value] of Object.entries(piece)) if (key !== "operations") plan[key] = key === "counteractOutcome" ? { ...plan[key], ...value }
                    // Ward pieces merge; their notes accumulate.
                    : key === "ward" ? { ...plan.ward, ...value, notes: [...(plan.ward?.notes ?? []), ...(value.notes ?? [])] }
                    : key === "castingCondition" ? [...(plan.castingCondition ?? []), ...value] : value;
                // A sentence about "you" is the caster's own care; about "the target", a targeted creature's.
                if (piece.subject && piece.subject !== recipient) return { blocked: `subject:${sentence}` };
                continue;
            }
            if (!narrated && !RULE_WORDS.test(sentence) && !CONDITION_NAMES.test(sentence)) { narrated = true; continue; }
            return { blocked: `sentence:${sentence}` };
        }
    }
    // ("… with a duration of 10 minutes or less": the siphoned effect's longest duration.)
    const siphonLimit = /with a duration of (\d+) (minutes?|rounds?) or less$/i.exec(target);
    for (const op of plan.operations) if (op.siphon) { if (!siphonLimit) return { blocked: "siphon-target" }; op.maxSeconds = Number(siphonLimit[1]) * (/^minute/i.test(siphonLimit[2]) ? 60 : 6); }
    if (siphonLimit && !plan.operations.some(op => op.siphon)) return { blocked: "siphon-target" };
    if (heightenAt >= 0) {
        for (const match of html.slice(html.lastIndexOf("<p", heightenAt)).matchAll(/<p\b[^>]*>\s*<strong\b[^>]*>\s*Heightened \(\+(\d+)\)\s*<\/strong>([\s\S]*?)<\/p>/gi)) {
            // Interval heightening is the item's own data; the sentence must say what that data does.
            const heal = [...plan.operations, ...plan.modes.flatMap(mode => mode.operations)].find(op => op.op === "heal");
            const step = String(Object.values(adapted.heightening?.damage ?? {})[0] ?? "").replace(/\s+/g, "");
            for (const sentence of sentencesOf(htmlToPlainText(match[2]))) {
                const increase = INTERVAL.map(pattern => pattern.exec(sentence)).find(Boolean);
                if (!increase || !heal || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== Number(match[1]) || step !== increase[1]) return { blocked: `heightened:${sentence}` };
                // "… and you can attempt to suspend an additional affliction": one more counteract per step.
                if (increase[2]) plan.counteractPickStep = { perStep: 1, interval: Number(match[1]), baseRank: adapted.rank };
            }
        }
        for (const match of html.slice(html.lastIndexOf("<p", heightenAt)).matchAll(/<p\b[^>]*>\s*<strong\b[^>]*>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>([\s\S]*?)<\/p>/gi)) {
            const changes = [];
            for (const sentence of sentencesOf(htmlToPlainText(match[2]))) {
                const form = HEIGHTENED.find(([pattern]) => pattern.test(sentence));
                if (!form) return { blocked: `heightened:${sentence}` };
                changes.push(form[1](form[0].exec(sentence)));
            }
            plan.heightened.push({ rank: Number(match[1]), changes });
        }
    }
    if (plan.modeChoice && !plan.modeChoice.every(id => plan.modes.some(mode => mode.id === id))) return { blocked: "mode-choice" };
    if (plan.listModes) { if (plan.modes.length < 2) return { blocked: "list-modes" }; plan.modeChoice = plan.modes.map(mode => mode.id); delete plan.listModes; }
    // Cleanse Affliction: the chosen affliction's stage is reduced (once per case); heightened ranks also counteract it.
    if (plan.reduceChosen) {
        if (!plan.chooseAffliction?.length) return { blocked: "reduce-without-choice" };
        plan.operations.push({ op: "reduce-affliction-stage", traits: plan.chooseAffliction, pick: 1, by: plan.reduceChosen, floor: 1 });
        delete plan.reduceChosen;
    }
    const counteractChosen = plan.heightened.flatMap(entry => entry.changes).filter(change => change.counteractChosen);
    if (counteractChosen.some(change => !plan.chooseAffliction || change.counteractChosen.some(trait => !plan.chooseAffliction.includes(trait)))) return { blocked: "counteract-chosen" };
    // Damage "equal to the spell's rank" must be the item's damage entry (@item.rank of that type); healing, its healing entry.
    const allOps = [...plan.operations, ...plan.modes.flatMap(mode => mode.operations)];
    const components = adapted.damageComponents ?? [];
    for (const op of allOps) {
        if (op.op === "damage" && !(components.length === 1 && /^@item\.(?:rank|level)$/.test(String(components[0].formula).trim())
            && String(components[0].type).toLowerCase() === op.damageType && !components[0].category)) return { blocked: "damage-entry" };
        if (op.op === "heal" && !(components.length === 1 && String(components[0].formula).replace(/\s+/g, "") === String(op.formula)
            && JSON.stringify(components[0].kinds) === JSON.stringify(["healing"]))) return { blocked: "healing-entry" };
    }
    // The damage entry is an operation's, or the explosion's (checked when the explosion is compiled).
    if (!allOps.some(op => ["damage", "heal"].includes(op.op)) && components.length && !plan.explosion) return { blocked: "unused-damage-entry" };
    // Dispel Magic's item rules come as a set.
    if ((plan.magicItem || plan.magicItemNote) && !(plan.magicItem && plan.magicItemNote && plan.artifactFails && recipient === "counteract-target")) return { blocked: "magic-item-rules" };
    if (plan.artifactFails && recipient !== "counteract-target") return { blocked: "artifact-rule" };
    if (recipient === "counteract-target" && !allOps.some(op => op.op === "counteract" && op.otherTargets)) return { blocked: "counteract-target" };
    // Disjunction's artifact rule stands alone; Dispel Magic's comes with its magic-item sentences (checked above).
    // "suppress … for the duration": the spell's own fixed duration.
    for (const op of allOps) if (op.setAside?.duration === "spell") {
        const lasting = /^(\d+) (round|minute|hour)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
        if (!lasting) return { blocked: "set-aside-duration" };
        op.setAside.duration = { value: Number(lasting[1]), unit: unitOf(lasting[2]) };
    }
    // A ward: one "ward" operation, a trigger, and the spell's own duration (fixed, or until the caster's next daily
    // preparations).
    const wardOps = allOps.filter(op => op.op === "ward");
    if (plan.ward || wardOps.length) {
        if (wardOps.length !== 1 || allOps.length !== 1 || !plan.ward?.trigger || !["target", "self"].includes(recipient)) return { blocked: "ward" };
        const lasting = String(adapted.lifecycle?.duration ?? "").trim();
        const fixed = /^(\d+) (round|minute|hour|day)s?$/i.exec(lasting);
        if (fixed) plan.ward.duration = { value: Number(fixed[1]), unit: unitOf(fixed[2]) };
        else if (/^until (?:the next time you make )?your (?:next )?daily preparations$/i.test(lasting)) plan.ward.untilDailyPreparations = true;
        else return { blocked: "ward-duration" };
        if (!plan.ward.notes?.length) delete plan.ward.notes;
        // "You see things within 60 feet …": the ward's range, noted.
        if (plan.ward.range) { plan.ward.notes = [...(plan.ward.notes ?? []), `Within ${plan.ward.range} feet.`]; delete plan.ward.range; }
    }
    // "… can't affect spells that aren't targeted (such as area spells)." belongs to the ward's notes.
    if (plan.counteractLimit && plan.ward) { plan.ward.notes = [...(plan.ward.notes ?? []), plan.counteractLimit]; delete plan.counteractLimit; }
    if (creatureOrObject && !plan.ward) return { blocked: "creature-or-object" };
    // Sound Body's near miss and exclusions go with its counteract of condition-imposing effects.
    const effectOps = allOps.filter(op => op.op === "counteract" && op.source === "effect");
    if ((plan.nearMiss || plan.pauseWhileSuppressed) && !(effectOps.length === 1 && plan.nearMiss && plan.pauseWhileSuppressed)) return { blocked: "near-miss" };
    if (plan.excludeTraits && effectOps.length !== 1) return { blocked: "exclude-traits" };
    if (plan.empower && !(effectOps.length === 1 && allOps.filter(op => op.op === "counteract").length === 1)) return { blocked: "empower" };
    // Several targets: only list options (counteract on each, or healing for all).
    if (recipient === "targets" && !(plan.modes.length && !plan.operations.length && plan.modeChoice)) return { blocked: "targets" };
    if (plan.nearMiss) { plan.nearMiss.setAside.pauseDuration = true; delete plan.pauseWhileSuppressed; }
    if (plan.awareness && !allOps.some(op => op.anyAffliction)) return { blocked: "awareness" };
    if (plan.counteractPickStep && !allOps.some(op => op.setAside)) return { blocked: "pick-step" };
    // Elemental Counter's pieces come together.
    const lostSlot = allOps.some(op => op.rankFromLostSlot);
    if ((plan.costSlot || plan.elementCycle || lostSlot) && !(plan.costSlot && plan.elementCycle && lostSlot)) return { blocked: "elemental-counter" };
    // Detonate Magic: the explosion and its notes go with a counteract against the target.
    if ((plan.explosion || plan.explosionNote) && !(plan.explosion && recipient === "counteract-target")) return { blocked: "explosion" };
    // Counteracting a spell or an item/ward: its outcome sentences go with a matching counteract.
    const otherOps = allOps.filter(op => op.op === "counteract" && op.otherTargets);
    if ((plan.counteractRankBonus || plan.counteractLimit || plan.restoreSlot) && !otherOps.length) return { blocked: "counteract-outcome" };
    if (plan.counteractOutcome && !allOps.some(op => op.op === "counteract" && (op.otherTargets || op.optional))) return { blocked: "counteract-outcome" };
    if (allOps.some(op => op.op === "lose-hp") && !otherOps.some(op => op.source === "triggering-spell")) return { blocked: "lose-hp" };
    if (recipient === "triggering-spell" && !otherOps.some(op => op.source === "triggering-spell")) return { blocked: "triggering-spell" };
    if (recipient === "counteract-target") plan.otherKinds = otherKinds;
    delete plan.subject; delete plan.magicItemNote;
    if (plan.progressTargets && plan.modes.length !== 2) return { blocked: "progress-modes" };
    if (!plan.operations.length && !plan.modes.length) return null;
    return { resolution: plan };
}
