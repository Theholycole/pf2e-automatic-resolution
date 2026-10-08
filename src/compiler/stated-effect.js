// Note-only spells whose stated bonuses, Speeds and senses are PF2e rule elements on an Effect per recipient (the notes audit, 2026-10-05):
// `statedEffect` = { recipient, seconds, sustained, secondsByRank, rules, rankRules, alternatives, toggle, choice, notes }.
// - recipient: "self", "targets" (each target), "self-and-targets", "familiar" (the targeted familiar, else the caster's).
// - alternatives: [{ if: { speed } | { sense }, rules, notes }] — the first whose condition the recipient meets replaces the base rules.
// - "{landSpeed}" in a rule is the recipient's land Speed at the cast; requiresTrait: each recipient must have it ("1 animal").
// Every sentence is a rule, a note, or narration with no rule in it; anything else leaves the spell to its note.
import { durationSeconds, plainText as plain, splitSentences as split } from "./description-parser.js";
import { SKILLS, unlinkText as unlink } from "./text-patterns.js";

// (A sentence that states a rule the module would otherwise drop.)
const RULE_WORDS = /\d|\[\[|@(?:Check|Damage|Template)|\b(?:damage|saves?|saving throws?|bonus|penalty|immune|immunity|resistance|weakness|Speed|checks?|DC|Hit Points|Strikes?|(?:im)?precise sense|tremorsense|low-light vision|darkvision)\b/i;
const ORDINAL = "(\\d+)(?:st|nd|rd|th)";

const daily = text => /^until (?:you next perform|the next time you make|your next) (?:your )?daily preparations$/i.test(String(text ?? "").trim());
const secondsOf = adapted => daily(adapted.lifecycle?.duration) ? 86400 : durationSeconds(adapted.lifecycle?.duration);
const parts = adapted => { const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i); return { sentences: split(plain(body)), heightened: plain(rest.join(" ")).trim() }; };
const target = adapted => String(adapted.targeting?.target ?? "").trim();

/**
 * The spell's sentences sorted: each must be claimed by a rule pattern or a note pattern, or be narration (no rule words). Returns
 * { matches, notes } (matches by pattern index) or null.
 */
function sortSentences(sentences, rulePatterns, notePatterns = []) {
    const matches = rulePatterns.map(() => null), notes = [];
    for (const sentence of sentences) {
        const text = unlink(sentence);
        const at = rulePatterns.findIndex((re, index) => !matches[index] && re.test(sentence));
        if (at >= 0) { matches[at] = rulePatterns[at].exec(sentence); continue; }
        if (notePatterns.some(re => re.test(sentence))) { notes.push(text); continue; }
        if (RULE_WORDS.test(text)) return null;
    }
    return matches.every(Boolean) ? { matches, notes } : null;
}

/** "Heightened (Nth) … the status bonus is +X" steps, as rank rules replacing the base rule. */
function bonusSteps(heightened, build) {
    const steps = [...heightened.matchAll(new RegExp(String.raw`Heightened \(${ORDINAL}\)[^.]*?(?:the|and the) status bonus is \+(\d)`, "gi"))];
    return steps.map(step => ({ minRank: Number(step[1]), value: Number(step[2]), rules: build(Number(step[2])) }));
}

// Movanic Glimmer: "The target gains a +2 status bonus to Perception checks and Will saves, and any Nature checks to Command the target Animal gain a +1
// status bonus from its increased understanding." with "Heightened (8th) You can target up to 5 animals." — the animals' Effect: the bonus to Perception
// and Will saves; Nature checks to Command an Animal (PF2e's action option) get the smaller bonus. The minion's free action is a note.
const GLIMMER = /^The target gains a \+(\d) (status) bonus to Perception checks and Will saves, and any Nature checks to (?:@UUID\[[^\]]+\]\{Command\}|Command) the target (?:@UUID\[[^\]]+\]\{Animal\}|Animal) gain a \+(\d) (status) bonus from its increased understanding\.$/;
const GLIMMER_NOTES = [/^Additionally, if the target animal has the minion trait, it can take one action each turn even if its master doesn't use an action to Command it, which it can use to perform any basic action it knows\.$/,
    /^This doesn't prevent a target that was summoned from disappearing if its summoner doesn't Sustain the Spell, but does allow the target to perform one action before disappearing\.$/];
function glimmer(adapted) {
    if (!/^\d+ animals?$/.test(target(adapted))) return null;
    const { sentences, heightened } = parts(adapted);
    if (heightened && !new RegExp(String.raw`^Heightened \(${ORDINAL}\) You can target up to \d+ animals\.$`).test(heightened)) return null;
    const sorted = sortSentences(sentences, [GLIMMER], GLIMMER_NOTES);
    if (!sorted) return null;
    const [, value, type, command, commandType] = sorted.matches[0];
    return { recipient: "targets", requiresTrait: "animal", rules: [{ key: "FlatModifier", selector: ["perception", "will"], type, value: Number(value) },
        { key: "FlatModifier", selector: "nature", type: commandType, value: Number(command), predicate: ["action:command-an-animal"] }], notes: sorted.notes, claimed: [...sentences, heightened].filter(Boolean) };
}

// Chameleon Coat: "Creatures affected by the spell gain a +3 status bonus to Stealth checks to Hide." with "Heightened (6th) If a creature … rolls a
// critical failure on its Stealth check to Sneak within 30 feet … it instead only fails …" and "Heightened (8th) As 6th rank, and the status bonus is +4."
// Penumbral Disguise: "You wrap the target in shadows, granting it a +1 status bonus to Stealth checks to Hide while in dim light or darkness." with its
// steps (+2 at 4th, +3 at 6th, +4 at 8th) — a toggle for dim light or darkness. Each target's Effect; the rest (removing gear, the Seek to see
// details) are notes.
const HIDE = /^(?:Creatures affected by the spell gain|You wrap the target in shadows, granting it) a \+(\d) (status) bonus to Stealth checks to (?:@UUID\[[^\]]+\]\{Hide\}|Hide)( while in dim light or darkness)?\.$/;
const HIDE_NOTES = [/^If any piece of gear or clothing affected by the spell is removed from a creature, the spell ends for that creature\.$/,
    /^While the target is in dim light or darkness, other creatures must succeed at a (?:@UUID\[[^\]]+\]\{Seek\}|Seek) action against the spell's DC to discern details about its appearance\.$/,
    /^Creatures with darkvision can still see the target and its features normally\.$/, /^For example, without using Seek, other creatures can determine .*\.$/];
function hide(adapted) {
    const { sentences, heightened } = parts(adapted);
    const sorted = sortSentences(sentences, [HIDE], HIDE_NOTES);
    if (!sorted) return null;
    const [, value, type, dim] = sorted.matches[0];
    const option = dim ? "stated-dim-light" : null;
    const rule = bonus => [{ key: "FlatModifier", selector: "stealth", type, value: bonus, predicate: ["action:hide", ...(option ? [option] : [])] }];
    const steps = bonusSteps(heightened, rule);
    // (The heightened entries' other parts — the Sneak crit failure, who must Seek — are notes.)
    const heightNotes = heightened ? heightened.split(/(?=Heightened \()/).map(entry => unlink(entry.trim())).filter(entry => !/^Heightened \(\d+(?:st|nd|rd|th)\) The status bonus is \+\d\.$/.test(entry)) : [];
    return { recipient: "targets", rules: rule(Number(value)), rankRules: steps.map(({ minRank, rules }) => ({ minRank, rules, replaces: true })),
        ...(option ? { toggle: { option, label: "In dim light or darkness" } } : {}), notes: [...sorted.notes, ...heightNotes], claimed: [...sentences, heightened].filter(Boolean) };
}

// Uncover Device: "You gain a +2 status bonus to Thievery checks to Disable Device on the target and to Aid checks to help an ally Disable Devise on the
// target." — the caster's Effect: the bonus to Disable a Device (PF2e's action option); Aid is a note.
const DEVICE = /^You gain a \+(\d) (status) bonus to Thievery checks to (?:@UUID\[[^\]]+\]\{Disable (?:a )?Device\}|Disable (?:a )?Device) on the target and to (?:@UUID\[[^\]]+\]\{Aid\}|Aid) checks to help an ally Disable Devi[cs]e on the target\.$/;
function device(adapted) {
    const { sentences, heightened } = parts(adapted);
    const sorted = heightened ? null : sortSentences(sentences, [DEVICE]);
    if (!sorted) return null;
    const [, value, type] = sorted.matches[0];
    return { recipient: "self", rules: [{ key: "FlatModifier", selector: "thievery", type, value: Number(value), predicate: ["action:disable-a-device"] }],
        notes: ["The bonus also applies to Aid checks to help an ally Disable a Device on the target (switch it on for the Aid)."], claimed: sentences };
}

// Discern Lies: "You gain a +4 status bonus to Perception checks when someone Lies." Threefold Aspect: "This grants you a +4 status bonus to Deception
// checks to pass as the chosen age, and you can add your level as a proficiency bonus to these checks even if you're untrained." Chosen Gravity: "In
// addition, the target gains a +1 status bonus to their saving throws and Fortitude DC against forced movement." — each a toggle for the situation.
const LIES = /^You gain a \+(\d) (status) bonus to Perception checks when someone (?:@UUID\[[^\]]+\]\{Lies\}|Lies)\.$/;
const AGE = /^This grants you a \+(\d) (status) bonus to Deception checks to pass as the chosen age, and you can add your level as a proficiency bonus to these checks even if you're untrained\.$/;
const AGE_NOTES = [/^Choose one when you Cast the Spell\.$/, /^While the spell lasts, you can change the age to any of the three or to your natural age by Sustaining the spell\.$/,
    /^Furthermore, unless a creature specifically uses a (?:@UUID\[[^\]]+\]\{Seek\}|Seek) action or otherwise carefully examines you, it doesn't get a chance to notice that you aren't at your true age\.$/,
    /^You can Dismiss this spell\.$/];
const FORCED = /^In addition, the target gains a \+(\d) (status) bonus to their saving throws and Fortitude DC against forced movement\.$/;
const FORCED_NOTES = [/^When the spell ends, the target is affected by gravity as normal and might fall if not on the floor\.$/];
function situational(adapted) {
    const { sentences, heightened } = parts(adapted);
    const lies = !heightened && !target(adapted) ? sortSentences(sentences, [LIES]) : null;
    if (lies) {
        const [, value, type] = lies.matches[0], option = "stated-someone-lies";
        return { recipient: "self", toggle: { option, label: "Someone Lies to you" }, rules: [{ key: "FlatModifier", selector: ["perception"], type, value: Number(value), predicate: [option] }], notes: [], claimed: sentences };
    }
    const age = !heightened && !target(adapted) ? sortSentences(sentences, [AGE], AGE_NOTES) : null;
    if (age) {
        const [, value, type] = age.matches[0], option = "stated-pass-as-age";
        return { recipient: "self", toggle: { option, label: "Deception to pass as the chosen age" },
            rules: [{ key: "FlatModifier", selector: "deception", type, value: Number(value), predicate: [option] }],
            notes: ["You can add your level as a proficiency bonus to these checks even if you're untrained.", ...age.notes], claimed: sentences };
    }
    const longer = new RegExp(String.raw`^Heightened \(${ORDINAL}\) The duration increases to (\d+) (hours?|minutes?)\.$`).exec(heightened);
    const forced = /^1 creature$/.test(target(adapted)) && (!heightened || longer) ? sortSentences(sentences, [FORCED], FORCED_NOTES) : null;
    if (forced) {
        const [, value, type] = forced.matches[0], option = "stated-forced-movement";
        return { recipient: "targets", toggle: { option, label: "Against forced movement" },
            rules: [{ key: "FlatModifier", selector: "saving-throw", type, value: Number(value), predicate: [{ or: [option, "forced-movement"] }] },
                { key: "FlatModifier", selector: "fortitude-dc", type, value: Number(value), predicate: [{ or: [option, "action:shove", "action:reposition"] }] }],
            ...(longer ? { secondsByRank: [{ rank: Number(longer[1]), seconds: Number(longer[2]) * (/hour/.test(longer[3]) ? 3600 : 60) }] } : {}),
            notes: ["The target can walk on vertical surfaces or upside down after it touches a surface with its feet.", ...forced.notes], claimed: [...sentences, heightened].filter(Boolean) };
    }
    return null;
}

// Part the Mists to Paradise: "Each saving throw attempted while within the paradise gains a +4 status bonus." — the caster's and the targets' Effect;
// the paradise's time, rest and intervals are notes.
const PARADISE = /^Each saving throw attempted while within the paradise gains a \+(\d) (status) bonus\.$/;
const PARADISE_NOTES = [/^Creatures within this paradise don't need to eat or drink\.$/, /^For each minute you spend within this paradise, .*\.$/, /^However, for any afflictions or spells with intervals measured in shorter periods of time, .*\.$/,
    /^This means that at the end of a minute, .*\.$/, /^You and your allies can act normally while within the paradise .*\.$/, /^When the spell ends, you and all other targets depart the paradise, .*\.$/, /^You can Dismiss this spell\.$/];
function paradise(adapted) {
    if (!/^you and up to \d+ willing creatures$/.test(target(adapted))) return null;
    const { sentences, heightened } = parts(adapted);
    const sorted = heightened ? null : sortSentences(sentences, [PARADISE], PARADISE_NOTES);
    if (!sorted) return null;
    const [, value, type] = sorted.matches[0];
    return { recipient: "self-and-targets", rules: [{ key: "FlatModifier", selector: "saving-throw", type, value: Number(value) }], notes: sorted.notes, claimed: sentences };
}

// Senses. Stonesense: "You gain tremorsense as an imprecise sense to a range of 100 feet, but you can only sense vibrations through natural stone …".
// Enhance Senses: "The target gains low-light vision, and all of the target's imprecise senses have their distances doubled." with "If the target already
// has low-light vision, they gain darkvision." (the doubling is a note). Elemental Sense: the option picked — Tremorsense's tremorsense (imprecise) 30
// feet, Mechanoreception's see-invisibility (the invisible are Concealed to you: a note); the other options are notes (PF2e has no such sense).
const STONE = /^You gain tremorsense as an imprecise sense to a range of (\d+) feet, but you can only sense vibrations through natural stone .*\.$/;
const LOWLIGHT = /^The target gains low-light vision, and all of the target's imprecise senses have their distances doubled\.$/;
const DARK = /^If the target already has low-light vision, they gain darkvision\.$/;
function senses(adapted) {
    const { sentences, heightened } = parts(adapted);
    const stone = !heightened && !target(adapted) ? sortSentences(sentences, [STONE]) : null;
    if (stone) return { recipient: "self", rules: [{ key: "Sense", selector: "tremorsense", acuity: "imprecise", range: Number(stone.matches[0][1]) }],
        notes: ["Only through natural stone (not masonry, adobe or other manufactured edifices)."], claimed: sentences };
    const enhance = /^1 willing creature$/.test(target(adapted)) && (!heightened || /^Heightened \(\+\d\) The number of targets increases by \d\.$/.test(heightened)) ? sortSentences(sentences, [LOWLIGHT, DARK]) : null;
    if (enhance) return { recipient: "targets", rules: [{ key: "Sense", selector: "low-light-vision" }],
        alternatives: [{ if: { sense: "low-light-vision" }, rules: [{ key: "Sense", selector: "darkvision" }] }],
        notes: ["All of the target's imprecise senses have their distances doubled."], claimed: [...sentences, heightened].filter(Boolean) };
    return elemental(adapted);
}
const ELEMENT_LEAD = [/^The elements grant you sensory enhancements\.$/, /^Choose one of the options below\.$/, /^The spell gains the listed trait or traits\.$/];
const ELEMENT_OPTION = /^([A-Z][a-z]+(?: [A-Z][a-z]+)?) \(([a-z, ]+)\) (.+)$/;
function elemental(adapted) {
    if (target(adapted)) return null;
    const { sentences, heightened } = parts(adapted);
    if (ELEMENT_LEAD.some((re, index) => !re.test(sentences[index] ?? ""))) return null;
    const longer = new RegExp(String.raw`^Heightened \(${ORDINAL}\) The duration increases to (\d+) hours, and you can take 1 minute to recalibrate the sense, switching from your current elemental sense to a different one\.$`).exec(heightened);
    if (heightened && !longer) return null;
    const options = [];
    for (const sentence of sentences.slice(ELEMENT_LEAD.length)) {
        const head = ELEMENT_OPTION.exec(sentence);
        if (head) { options.push({ key: head[1].toLowerCase().replace(/ /g, "-"), label: `${head[1]} (${head[2]})`, rules: [], notes: [unlink(head[3])] }); continue; }
        if (!options.length) return null;
        options.at(-1).notes.push(unlink(sentence));
    }
    const sense = { tremorsense: /^You gain tremorsense \(imprecise\) with a range of (\d+) feet\.$/, mechanoreception: /^You can see Invisible creatures and objects\.$/ };
    for (const option of options) {
        const tremor = sense.tremorsense.exec(option.notes[0]);
        if (option.key === "tremorsense" && tremor) { option.rules = [{ key: "Sense", selector: "tremorsense", acuity: "imprecise", range: Number(tremor[1]) }]; option.notes = []; }
        if (option.key === "mechanoreception" && sense.mechanoreception.test(option.notes[0])) { option.rules = [{ key: "Sense", selector: "see-invisibility" }]; option.notes = option.notes.slice(1); }
    }
    if (options.length < 2 || !options.some(option => option.rules.length)) return null;
    return { recipient: "self", rules: [], choice: { label: "The sense", options },
        ...(longer ? { secondsByRank: [{ rank: Number(longer[1]), seconds: Number(longer[2]) * 3600 }] } : {}),
        notes: longer ? ["From 6th rank you can take 1 minute to recalibrate the sense to a different option (cast again)."] : [], claimed: [...sentences, heightened].filter(Boolean) };
}

// Speeds. Tiny Wings: "Your familiar gains a 20-foot fly Speed." with "Familiars who already have a fly Speed instead gain a +15-foot status bonus to their
// fly Speed." Feet to Fins: "The target gains a swim Speed equal to its normal land Speed, but its land Speed becomes 5 feet." (Personal Ocean stays on its
// note route, which counteracts the fires it moves through.)
const WINGS = /^Your familiar gains a (\d+)-foot (fly) Speed\.$/;
const WINGS_HAVE = /^Familiars who already have a (fly) Speed instead gain a \+(\d+)-foot (status) bonus to their fly Speed\.$/;
const FINS = /^The target gains a (swim) Speed equal to its normal land Speed, but its land Speed becomes (\d+) feet\.$/;
function speeds(adapted) {
    const { sentences, heightened } = parts(adapted);
    const wings = /^your familiar$/i.test(target(adapted)) && !heightened ? sortSentences(sentences, [WINGS, WINGS_HAVE]) : null;
    if (wings) {
        const [[, feet, type], [, , bonus, bonusType]] = wings.matches;
        return { recipient: "familiar", rules: [{ key: "BaseSpeed", selector: type, value: Number(feet) }],
            alternatives: [{ if: { speed: type }, rules: [{ key: "FlatModifier", selector: `${type}-speed`, type: bonusType, value: Number(bonus) }] }], notes: [], claimed: sentences };
    }
    const daily = new RegExp(String.raw`^Heightened \(${ORDINAL}\) The spell lasts until your next daily preparations\.$`).exec(heightened);
    const fins = /^1 willing creature$/.test(target(adapted)) && (!heightened || daily) ? sortSentences(sentences, [FINS]) : null;
    if (fins) {
        const [, type, land] = fins.matches[0];
        return { recipient: "targets", rules: [{ key: "BaseSpeed", selector: type, value: "{landSpeed}" }, { key: "ActiveEffectLike", mode: "override", path: "system.movement.speeds.land.base", value: Number(land), priority: 90 }],
            ...(daily ? { secondsByRank: [{ rank: Number(daily[1]), seconds: 86400 }] } : {}), notes: [], claimed: [...sentences, heightened].filter(Boolean) };
    }
    return null;
}

// Spellsurge (a 10-foot emanation): "Choose one of the following abilities to affect creatures in your aura." with "Interference The excess magic surrounding
// you creates a mental static. All saving throws against mental effects gain a +2 circumstance bonus." — Interference an aura (PF2e's Aura rule handing every
// creature in it the bonus); Mana Well, Overpower Resistance and Ward are notes. Changing the ability on a Sustain: cast it again (a note).
const SURGE_LEAD = [/^Magic surges to life around you, feeding on the raw power you radiate\.$/, /^Choose one of the following abilities to affect creatures in your aura\.$/,
    /^You can choose a different effect, ending the previous one, by Sustaining the spell\.$/, /^You can Dismiss the aura\.$/];
const SURGE_HEAD = /^(Interference|Mana Well|Overpower Resistance|Ward) (.+)$/;
const SURGE_MENTAL = /^All saving throws against mental effects gain a \+(\d) (circumstance) bonus\.$/;
function auraChoice(adapted) {
    const area = adapted.targeting?.area;
    if (target(adapted) || area?.type !== "emanation" || adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length) return null;
    const { sentences, heightened } = parts(adapted);
    if (heightened || SURGE_LEAD.some((re, index) => !re.test(sentences[index] ?? ""))) return null;
    const options = [];
    for (const sentence of sentences.slice(SURGE_LEAD.length)) {
        const head = SURGE_HEAD.exec(sentence);
        if (head) { options.push({ key: head[1].toLowerCase().replace(/ /g, "-"), label: head[1], rules: [], notes: [unlink(head[2])] }); continue; }
        if (!options.length) return null;
        const mental = SURGE_MENTAL.exec(sentence);
        if (mental && options.at(-1).key === "interference") {
            options.at(-1).aura = { radius: Number(area.value), rules: [{ key: "FlatModifier", selector: "saving-throw", type: mental[2], value: Number(mental[1]), predicate: ["item:trait:mental"] }] };
            continue;
        }
        options.at(-1).notes.push(unlink(sentence));
    }
    if (options.length !== 4 || !options.some(option => option.aura)) return null;
    return { recipient: "self", rules: [], choice: { label: "The ability", options }, notes: ["To change the ability on a Sustain, cast it again with the new choice."], claimed: sentences };
}

/** Returns { statedEffect, claimed } or null. */
// Seeing a creature's anatomy (View Internal Anatomy): "You see their internal anatomy, and you gain the effects of a successful Recall Knowledge, except you
// can only learn information about its biology or physical characteristics, such as its weakest save or one of its resistances." / "If the creature is in
// disguise …" / "For the duration, when you successfully Aid an ally on a Strike against the creature you allow them to target vital areas, dealing 1
// additional precision damage." / "You also deal this precision damage on your Strikes and spell attack rolls that deal damage." with "Heightened (+1) The
// precision damage increases by 1.": the caster's Effect — its Strikes' and damaging spell attacks' precision damage against that creature, 1 at 1st rank
// and 1 more a rank — the creature's physical facts whispered to the GM (a successful Recall Knowledge's answer is theirs to give; user decision
// 2026-10-03b), and a GM option giving an ally who Aided that precision damage against it for its Strike.
const ANATOMY = [/^You see their internal anatomy, and you gain the effects of a successful Recall Knowledge, except you can only learn information about its biology or physical characteristics, such as its weakest save or one of its resistances\.$/,
    /^If the creature is in disguise and seeing its anatomy would uncover the disguise, you learn the creature is in disguise provided it is not from illusion magic of a higher rank than this spell\.$/,
    /^For the duration, when you successfully Aid an ally on a Strike against the creature you allow them to target vital areas, dealing (\d+) additional precision damage\.$/,
    /^You also deal this precision damage on your Strikes and spell attack rolls that deal damage\.$/];
function anatomy(adapted) {
    if (!/^1 creature$/.test(target(adapted)) || adapted.lifecycle?.sustained) return null;
    const { sentences, heightened } = parts(adapted);
    const step = /^Heightened \(\+1\) The precision damage increases by (\d+)\.$/.exec(heightened);
    const links = sentences.filter(sentence => /^(?:@UUID\[[^\]]+\]\{[^}]+\}\s*)+$/.test(sentence));
    const body = sentences.filter(sentence => !links.includes(sentence));
    if (!step || body.length !== 5 || RULE_WORDS.test(unlink(body[0])) || ANATOMY.some((re, index) => !re.test(body[index + 1]))) return null;
    const per = Number(ANATOMY[2].exec(body[3])[1]);
    if (Number(step[1]) !== per) return null;
    const amount = "{castRank}";
    const against = ["target:signature:{targetSignature}"];
    return {
        recipient: "self", againstTarget: true, perRank: per,
        rules: [{ key: "FlatModifier", selector: "strike-damage", value: amount, damageCategory: "precision", predicate: [...against] },
            { key: "FlatModifier", selector: "spell-damage", value: amount, damageCategory: "precision", predicate: [...against, "item:trait:attack"] }],
        reveal: { kind: "anatomy" },
        gmOptions: [{ key: "aided", label: "Aided an ally's Strike: precision damage against the creature", kind: "effect", duration: { value: 1, unit: "rounds" },
            rules: [{ key: "FlatModifier", selector: "strike-damage", value: amount, damageCategory: "precision", predicate: [...against] }], note: unlink(body[3]) }],
        notes: [unlink(body[2])],
        claimed: [...body.slice(1), ...links, heightened]
    };
}

// A patron's secrets, or a creature's concealment stripped (Witches+'s Discern Secrets+): "The target can Recall Knowledge, Seek, or Sense Motive as a free action." /
// "The target gains a +1 status bonus to the statistic used for the roll (a skill or Perception), as long as you Sustain the spell." / "Alternatively, you can
// target a Concealed creature to remove the concealed condition as long as you Sustain the spell." / "If the creature's concealment is the result of a spell or
// effect, you can attempt a counteract check …" with "Heightened (5th) You can target two creatures instead of one.": the caster's choice — the bonus on the
// targets' rolls of those three actions (as PF2e's own Discern Secrets Effect reads it), or each target's Concealed removed (one an Effect grants: the card's
// counteract) — for as long as it's sustained; two targets from 5th rank. (The module's links name Effects PF2e no longer has.)
const SECRETS = [/^The target can @UUID\[[^\]]+\]\{Recall Knowledge\}, @UUID\[[^\]]+\]\{Seek\}, or @UUID\[[^\]]+\]\{Sense Motive\} as a free action\.$/,
    /^The target gains a \+(\d) status bonus to the statistic used for the roll \(a skill or Perception\), as long as you Sustain the spell\.$/,
    /^Alternatively, you can target a @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{(Concealed)\} creature to remove the concealed condition as long as you Sustain the spell\.$/,
    /^If the creature's concealment is the result of a spell or effect, you can attempt a counteract check to remove the concealed condition, but all other effects of the spell remain and the concealed condition returns if the effect is still active when you end this spell\.$/];
function secrets(adapted) {
    if (!/^1 creature$/.test(target(adapted)) || !adapted.lifecycle?.sustained) return null;
    const { sentences, heightened } = parts(adapted);
    const more = /^Heightened \((\d+)(?:st|nd|rd|th)\) You can target two creatures instead of one\.(?: @UUID\[[^\]]+\]\{[^}]+\})*$/.exec(heightened);
    if (!more || sentences.length !== 5 || RULE_WORDS.test(unlink(sentences[0])) || SECRETS.some((re, index) => !re.test(sentences[index + 1]))) return null;
    const bonus = Number(SECRETS[1].exec(sentences[2])[1]), concealed = SECRETS[2].exec(sentences[3]);
    return {
        recipient: "targets", maxTargets: { base: 1, rank: Number(more[1]), count: 2 }, ignoresLinks: true,
        rules: [],
        choice: { label: "The spell's use", options: [
            { key: "secrets", label: "Recall Knowledge, Seek or Sense Motive (a free action)", notes: [unlink(sentences[1])],
                rules: [{ key: "FlatModifier", selector: ["perception", "skill-check"], type: "status", value: bonus, predicate: [{ or: ["action:recall-knowledge", "action:seek", "action:sense-motive"] }] }] },
            { key: "concealed", label: "Remove its concealment", notes: [unlink(sentences[4])], rules: [], removes: { uuid: concealed[1], slug: concealed[2].toLowerCase(), counteract: unlink(sentences[4]) } }] },
        claimed: [...sentences.slice(1), heightened]
    };
}

// Channelling a dragon ally (Tian Xia+'s Channel Imperial Dragon): "You begin channeling your dragon, gaining the traits for your dragon type." / "You gain resistance
// equal to half your level to the damage type of your dragon and a +1 status bonus to saves against effects with this trait." / "You can Sustain the spell to gain a
// +1 status bonus to checks to Diplomacy and Intimidation until the end of your next turn." / "This spell gains the tradition associated with your dragon." with
// "Heightened (+3) The status bonus to Diplomacy and Intimidation increases by 1.": the caster's Effect — the dragon trait and its type's, resistance to its damage
// type (half the level, at least 1), +1 status to saves against that trait — the dragon the caster's class pick (its Imperial Dragon Emissary flag, or asked from
// that dedication's five); each Sustain's Diplomacy and Intimidation bonus (one more every 3 ranks) until the end of its next turn, the card's option.
const DRAGON_LEAD = [/^You begin channeling your dragon, gaining the traits for your dragon type\.$/,
    /^You gain resistance equal to half your level to the damage type of your dragon and a \+(\d) status bonus to saves against effects with this trait\.$/,
    /^(?:@UUID\[[^\]]+\]\{[^}]+\} )?You can Sustain the spell to gain a \+(\d) status bonus to checks to Diplomacy and Intimidation until the end of your next turn\.$/,
    /^This spell gains the tradition associated with your dragon\.$/];
// (Imperial Dragon Emissary Dedication's choices: the dragon's creature trait and damage type.)
const IMPERIAL_DRAGONS = [["forest", "Forest Dragon", "plant", "poison"], ["sea", "Sea Dragon", "water", "cold"], ["sky", "Sky Dragon", "electricity", "electricity"],
    ["soverign", "Sovereign Dragon", "earth", "mental"], ["underworld", "Underworld Dragon", "fire", "fire"]];
function imperialDragon(adapted) {
    if (target(adapted) || adapted.lifecycle?.sustained) return null;
    const { sentences, heightened } = parts(adapted);
    const body = sentences.filter(sentence => !/^(?:@UUID\[[^\]]+\]\{[^}]+\}\s*)+$/.test(sentence));
    const step = /^Heightened \(\+(\d)\) The status bonus to Diplomacy and Intimidation increases by (\d)\.$/.exec(heightened);
    if (!step || body.length !== 5 || RULE_WORDS.test(unlink(body[0])) || DRAGON_LEAD.some((re, index) => !re.test(body[index + 1]))) return null;
    const save = Number(DRAGON_LEAD[1].exec(body[2])[1]), social = Number(DRAGON_LEAD[2].exec(body[3])[1]);
    const rank = Number(adapted.rank) || 1, interval = Number(step[1]), add = Number(step[2]);
    return {
        recipient: "self", ignoresLinks: true, presetFlag: "imperialDragonEmissary.dragonType",
        rules: [],
        choice: { label: "Your dragon", options: IMPERIAL_DRAGONS.map(([key, label, trait, type]) => ({ key, label, notes: [`${unlink(body[4])}`],
            rules: [{ key: "ActorTraits", add: ["dragon", trait] }, { key: "Resistance", type, value: "max(1,floor(@actor.level/2))" },
                { key: "FlatModifier", selector: "saving-throw", type: "status", value: save, predicate: [trait] }] })) },
        gmOptions: [{ key: "sustained", label: "Sustained: Diplomacy and Intimidation bonus until the end of your next turn", kind: "effect", self: true, duration: { value: 1, unit: "rounds", expiry: "turn-end" },
            rules: [{ key: "FlatModifier", selector: ["diplomacy", "intimidation"], type: "status", value: `{socialBonus}` }], note: unlink(body[3]).replace(/^@UUID\[[^\]]+\]\{[^}]+\}\s*/, "") }],
        socialBonus: { base: social, rank, interval, add },
        claimed: [...sentences.slice(1), heightened]
    };
}

// Ancestral witches who Aid the caster (Witches+'s Secret of the Forebearers): "Once per turn for the duration, your forebearers Aid you on an attack roll or skill check,
// and can roll using your modifier in the skill granted by your patron instead of the normal skill check." / "If they roll a failure, they get a success instead." / "If
// you are legendary in the skill granted by your patron, they automatically critically succeed." / "In addition, whenever you succeed at a check that was aided by your
// forebearers, you are Concealed by their afterimages until the beginning of your next turn." / "You can't use this concealment to Hide or Sneak.": the caster's
// Effect for the duration, the patron's skill its class pick (asked); the card's options — the forebearers' Aid (once a turn: that skill against the Aid DC, a failure a
// success, legendary a critical success; the bonus on the caster's next attack roll or skill check) and, after an aided success, Concealed until its next turn.
const FOREBEAR = [/^Once per turn for the duration, your forebearers @UUID\[[^\]]+\]\{Aid\} you on an attack roll or skill check, and can roll using your modifier in the skill granted by your patron instead of the normal skill check\.$/,
    /^If they roll a failure, they get a success instead\.$/, /^If you are legendary in the skill granted by your patron, they automatically critically succeed\.$/,
    /^In addition, whenever you succeed at a check that was aided by your forebearers, you are @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Concealed\} by their afterimages until the beginning of your next turn\.$/,
    /^You can't use this concealment to Hide or Sneak\.$/];
function forebearers(adapted) {
    if (target(adapted) || adapted.lifecycle?.sustained) return null;
    const { sentences, heightened } = parts(adapted);
    if (heightened || sentences.length !== 6 || RULE_WORDS.test(unlink(sentences[0])) || FOREBEAR.some((re, index) => !re.test(sentences[index + 1]))) return null;
    const concealed = FOREBEAR[3].exec(sentences[4])[1];
    return {
        recipient: "self", rules: [],
        choice: { label: "The skill your patron grants", options: SKILLS.map(skill => ({ key: skill, label: skill[0].toUpperCase() + skill.slice(1), rules: [], notes: [unlink(sentences[1])] })) },
        gmOptions: [{ key: "aid", label: "The forebearers Aid (once a turn)", kind: "aid-roll", self: true, skill: "{chosen}", dc: 15, failureToSuccess: true, legendaryCritical: true },
            { key: "concealed", label: "An aided check succeeded: Concealed until the start of your next turn", kind: "effect", self: true, duration: { value: 1, unit: "rounds", expiry: "turn-start" },
                rules: [{ key: "GrantItem", uuid: concealed, onDeleteActions: { grantee: "restrict" } }], note: unlink(sentences[5]) }],
        notes: [unlink(sentences[5])],
        claimed: sentences.slice(1)
    };
}

export function compileStatedEffect(adapted) {
    const surge = durationSeconds(adapted.lifecycle?.duration) ? auraChoice(adapted) : null;
    if (surge) { const { claimed, ...data } = surge; return { statedEffect: { seconds: durationSeconds(adapted.lifecycle.duration), ...data }, claimed }; }
    if (adapted.defense?.kind !== "none" && adapted.defense?.kind !== undefined) return null;
    if ((adapted.damageComponents ?? []).length || adapted.targeting?.area) return null;
    const seconds = secondsOf(adapted);
    if (!seconds) return null;
    for (const compile of [glimmer, hide, device, situational, paradise, senses, speeds, anatomy, secrets, imperialDragon, forebearers]) {
        const result = compile(adapted);
        if (result) { const { claimed, ...data } = result; return { statedEffect: { seconds, ...(adapted.lifecycle?.sustained ? { sustained: true } : {}), ...data }, claimed }; }
    }
    return null;
}

/** The rules at a cast rank: the base rules, rank rules added (or replacing the base when they say so). */
export function statedRulesAt(data, castRank) {
    const reached = (data.rankRules ?? []).filter(entry => castRank >= entry.minRank);
    const replacing = reached.filter(entry => entry.replaces).at(-1);
    return [...structuredClone(replacing ? replacing.rules : data.rules ?? []), ...reached.filter(entry => !entry.replaces).flatMap(entry => structuredClone(entry.rules))];
}
