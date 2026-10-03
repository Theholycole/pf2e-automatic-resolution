// Spell notes (user decision): a spell with no check, no damage or healing, no PF2e Effect and no condition it applies is
// something the module can't carry out mechanically — utility, senses, communication, environment. Casting it applies a
// rule-less note Effect naming what the spell does, for the spell's duration, on its target(s) or on the caster; a spell
// placing something in the environment leaves the reminder on the caster and tells the GM to mark the area on the map.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";
import { heightenedDurationAt, parseHeightenedDurations } from "./heightened-duration-compiler.js";

const SINGLE_ACTOR_TARGET = /^(?:(?:you and )?(?:1|one|2|two|3|three|1 or 2|up to \d+|\d+ to \d+) (?:(?:willing|living|falling|other|dying) )*(?:creatures?|allies|ally|enem(?:y|ies))(?: touched)?(?: other than you| that is your companion)?|(?:1|one) (?:willing )?animal|your (?:animal companion|eidolon|companion|familiar)(?: or (?:eidolon|familiar|companion))?|you and up to \d+ allies|(?:you and )?the triggering (?:creature|ally)|the triggering creature or object|the creature targeted by the attack)$/i;
// Targets and areas that are places or things, not creatures: the reminder goes on the caster, with a note to mark the map.
const ENVIRONMENT = /\b(?:object|objects|area|square|squares|door|doorway|lock|container|surface|wall|ground|space|location|point|corpse|body|stone|stones|item|weapon|shield|rope|water|liquid|plant|plants|fire|flame|light source|structure|room|trap|path)\b/i;

/** Returns {note} or null. */
export function compileSpellNote(adapted, description, nativeSpellEffects) {
    // (SPELL_NOTE_DEBUG=1: which check refused it, by its line in this function.)
    const refuse = line => { if (globalThis.process?.env?.SPELL_NOTE_DEBUG) console.error("spell-note refused at line", line); return null; };
    if (adapted.activation?.traits?.includes("attack")) return refuse(1);
    if (adapted.defense?.kind !== "none" && !bystanderSaveOnly(adapted)) return refuse(2);
    // A PF2e hazard the spell creates (Electrified Crystal Ward's Electric Latch Rune): its damage entry is the hazard's, which the GM runs; the
    // note gives it at the cast rank.
    const components = adapted.damageComponents ?? [];
    const hazard = components.length === 1 && !components[0].category && /^<p>You create an @UUID\[Compendium\.pf2e\.hazards\.Actor\.[A-Za-z0-9]+\]\{[^}]+\} hazard\b/.test(String(adapted.descriptionHTML ?? ""))
        && /<strong>\s*Heightened \(\+\d\)\s*<\/strong>\s*The hazard's damage increases by \d+d\d+\.\s*<\/p>\s*$/.test(String(adapted.descriptionHTML ?? ""));
    if ((components.length && !hazard) || nativeSpellEffects.references.length) return refuse(3);
    const html = String(adapted.descriptionHTML ?? "");
    // Mechanical rules the module should automate rather than note: damage or healing rolls, conditions, counteracting.
    // Counteracting the spell does (a check to make) is mechanical; being counteracted by another effect ("it's erased only if it's
    // counteracted by an effect similar to dispel magic") is how it ends, the GM's.
    // (Magical darkness or light overcoming the other is the GM's lighting, kept in the note.)
    // The caster's own counteract against something the GM names ("the spell attempts to counteract any poisons in the food or water"):
    // the card's Counteract button. A check other effects make against the spell's DC is the GM's (the note says it).
    const ownText = htmlToPlainText(stripHeighteningHTML(html));
    const baseCounteract = ownText.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).flatMap(sentence => {
        const match = BASE_COUNTERACT.map(pattern => pattern.exec(sentence)).find(Boolean);
        return match ? [{ rank: Number(adapted.rank), base: true, text: sentence, target: match[1], result: match[2] ?? "is counteracted" }] : [];
    });
    const unclaimedText = baseCounteract.reduce((text, entry) => text.replace(entry.text, ""), ownText).replace(PASSIVE_COUNTERACT, "");
    if (/@Damage\[/i.test(html) || baseCounteract.length > 1 || ACTIVE_COUNTERACT.test(unclaimedText.replace(DARKNESS_FORM, ""))) return refuse(17);
    // A counteract check only in a fixed-rank Heightened entry ("Heightened (2nd) You can target an alchemical elixir …, attempting a
    // counteract check against it."): from that rank on, the note's card offers the caster's counteract check against the item the GM
    // names (its DC and rank). An entry of another shape keeps the rank gate.
    const counteracting = heightenedEntries(html).filter(entry => ACTIVE_COUNTERACT.test(entry.text));
    if (counteracting.some(entry => entry.rank == null)) return refuse(22);
    const rolled = counteracting.filter(entry => HEIGHTENED_COUNTERACT.test(entry.text));
    const firstGated = counteracting.filter(entry => !rolled.includes(entry)).sort((left, right) => left.rank - right.rank)[0];
    if ([...counteracting].some(entry => !(entry.rank > adapted.rank))) return refuse(25);
    const rankGate = firstGated ? { maxRank: firstGated.rank - 1, minRank: firstGated.rank, sourceText: firstGated.text } : null;
    const heightenedCounteract = [...baseCounteract, ...rolled.filter(entry => !firstGated || entry.rank < firstGated.rank)
        .map(entry => ({ rank: entry.rank, text: entry.text, target: HEIGHTENED_COUNTERACT.exec(entry.text)[1], result: "spoils and becomes a mundane item" }))];
    // Conditions: a spell that only mentions one ("If the target is Grabbed …", an Invisible object, "ignoring the target's
    // Concealment") can be a note; one that grants or removes a condition can't (see compileConditionNote).
    if (/conditionitems\./i.test(html) && !conditionMentionsOnly(html, adapted)) return refuse(31);
    if (description.allConditionReferences.some(reference => reference.source !== "description-reference")) return refuse(32);
    // (The dice of a creature's own attack — "The target's claw attack … deals 1d6 slashing damage." — are its Strike's, not the spell's.)
    // (And Ethereal Jaunt's end: ", and if you're inside an object, you're pushed into the nearest open space and take 1d6 damage per 5 feet you were pushed." — the GM's.)
    const ownAttack = /(?:^|(?<=\.\s))(?:The target's|If the target's|If its) [a-z]+ attack (?:already )?(?:gains|deals|had)[^.]*\.|, and if you're inside an object, you're pushed into the nearest open space and take \d+d\d+ damage per \d+ feet you were pushed\./g;
    if (/\b\d+d\d+\b[^.]{0,30}\b(?:damage|Hit Points|healing)\b/i.test(htmlToPlainText(html).replace(ownAttack, ""))) return refuse(35);
    // Numbers PF2e can apply (a bonus or penalty, resistance, weakness, Hit Points, a Speed, AC, Hardness): an Effect should carry
    // them, not a note. Each sentence with one is judged: a created thing's statistics, a situational bonus and an ending at 0 Hit
    // Points are the GM's to play (the note); an unconditional bonus to the recipient's statistic becomes a rule on the note Effect;
    // anything else keeps the spell off the route.
    const basics = noteBasics(adapted, html);
    if (!basics) return refuse(41);
    const recipient = basics.creatures ? "target" : "source";
    // A creature or figure the spell conjures, called by a word of the spell's name ("Ghostly Carrier": "the carrier").
    // (Or one named by the spell: "You conjure an intelligent sea turtle" in Travel by Turtle.)
    const nameWords = String(adapted.source?.name ?? "").toLowerCase().split(/[^a-z]+/).filter(word => word.length > 3);
    const conjuring = /\bYou (?:create|conjure) an? [A-Za-z ,-]{3,60}(?:figure|creature|servant|steed|mount)\b/.test(htmlToPlainText(html))
        || nameWords.some(word => new RegExp(String.raw`\bYou (?:conjure|project) an? [a-z ]{0,30}\b${word}\b`).test(htmlToPlainText(html)));
    const conjured = conjuring ? nameWords : [];
    const numbers = judgeNumbers(htmlToPlainText(stripHeighteningHTML(html)).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\[\[[^\]]*\]\]\{([^}]+)\}/g, "$1"),
        { recipient, created: !basics.creatures, conjured, objectTarget: /^(?:1|one|an?) (?:unattended )?(?:object|item)\b/i.test(String(adapted.targeting?.target ?? "").trim()) });
    if (!numbers) return refuse(48);
    if (hazard) basics.note.text = `${basics.note.text}\nThe hazard's damage: ${String(components[0].formula).replace(/\s+/g, "")} ${String(components[0].type).toLowerCase()} at the spell's rank (see Heightened). Place the hazard on the object.`;
    return { note: { recipient, ...basics.note, ...(numbers.rules.length ? { rules: numbers.rules, ruleSources: numbers.sources } : {}),
        ...(heightenedCounteract.length ? { heightenedCounteract } : {}),
        ...(rankGate ? { rankGate, heightened: basics.note.heightened.filter(entry => entry.rank == null || entry.rank < rankGate.minRank) } : {}) } };
}

const NUMBER = /[+–−-]\d+ (?:status|circumstance|item)? ?(?:bonus|penalty)|\b(?:resistance|weakness|Hardness) \d+|\btemporary Hit Points\b|\b\d+ Hit Points\b|\bSpeed(?: of| equal to)? \d+|\b\d+-foot (?:status|circumstance) (?:bonus|penalty)|\bAC\b|\bHit Points\b/i;
// "The tree has AC 10 and 10 Hit Points." / "It has AC 5, 2 Hardness, and 5 Hit Points." / "Each … section of the wall has AC 10,
// Hardness 14, and 50 Hit Points": the statistics of something the spell creates.
const STAT_BLOCK = /^(?:The|It|This|Each)\b[^.]*?\b(?:has|have)\b(?:[^.]*?\b(?:AC \d+|Hardness(?: of)? \d+|\d+ Hardness|\d+ Hit Points|\d+ HP|no Broken Threshold)\b)+[^.]*\.$/;
// A bonus or penalty that applies only in a situation the GM judges.
const SITUATIONAL = /\b(?:checks? to [A-Z]|to Seek|to Hide|to Track|to Impersonate|while\b|when\b|if\b|against\b|within the|At the GM's discretion|that initiative roll|the initial check|this attempt|on the same turn|to open (?:it|the)|for \d+d\d+ rounds|pass(?:es)? through|attempted with|doesn't incur the typical|to those saving throws|^Anyone Tracking you\b|^For instance, |\bin combats where you face\b|\bwhenever\b)/i;
const BONUS = /[+–−-]\d+ (?:status|circumstance|item) (?:bonus|penalty)/;
// "If the duplicate ever reaches 0 Hit Points, it's instantly destroyed" / "the spell ends if … reduced to 0 Hit Points".
const ZERO_HP_ENDING = /\b(?:reduced? (?:[a-z ]{1,20} )?to|reaches|reach) 0 Hit Points\b/;
// "Your companion gains a +1 status bonus to Performance checks." / "The target gains a +1 status bonus to saving throws.": a flat
// modifier on the recipient.
const UNCONDITIONAL = /^(?:The target|You|Your companion|Your eidolon|It) gains? a \+(\d) (status|circumstance|item) bonus to (saving throws|AC|Perception checks|attack rolls|initiative rolls|(Acrobatics|Arcana|Athletics|Crafting|Deception|Diplomacy|Intimidation|Medicine|Nature|Occultism|Performance|Religion|Society|Stealth|Survival|Thievery) checks)\.$/;
const SELECTOR = { "saving throws": "saving-throw", AC: "ac", "Perception checks": "perception", "attack rolls": "attack-roll", "initiative rolls": "initiative" };
// "The target gains a +2 status bonus to Perception checks and Will saves, and any Nature checks to Command the target Animal gain a +1 status
// bonus from its increased understanding." (Movanic Glimmer): two statistics, unconditional; the rest of the sentence a situational clause.
const STAT = String.raw`(Perception checks|Fortitude saves|Reflex saves|Will saves|saving throws|AC|attack rolls|initiative rolls)`;
const TWO_STATS = new RegExp(String.raw`^(?:The target|You|Your companion|Your eidolon|It) gains? a \+(\d) (status|circumstance|item) bonus to ${STAT} and ${STAT}(?:, and (.+))?\.$`);
const GAINS_SPEED = /^(?:Your familiar|The target|You|Your companion|It) gains? an? (\d+)-foot (fly|swim|climb|burrow) Speed\.$/;
const STAT_SELECTOR = { "Fortitude saves": "fortitude", "Reflex saves": "reflex", "Will saves": "will" };

const SKILL_NAMES = new Set(["acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy", "intimidation", "medicine", "nature", "occultism", "performance", "religion", "society", "stealth", "survival", "thievery"]);
export function judgeNumbers(plain, { recipient, created, conjured = [], objectTarget = false }) {
    const rules = [], sources = [];
    for (const sentence of plain.split(/(?<=[.!?])\s+(?=[A-Z])/).map(value => value.trim()).filter(Boolean)) {
        if (!NUMBER.test(sentence) && !GAINS_SPEED.test(sentence)) continue;
        // ("… deals damage or restores Hit Points as if the spell were heightened 1 rank higher …": another spell's heightening, Mystic Beacon.)
        if (/\bas if the spell were heightened \d+ ranks? higher\b/.test(sentence) && !/\d+d\d+|[+–−-]\d/.test(sentence)) continue;
        // A conjured vehicle's statistics (Conjured Conveyance: "Large Skiff—Space 15 feet long, …; Speed swim 30 feet (magical)", "AC 13;
        // Fortitude +8", "Hardness 5, HP 40 (BT 20); …").
        if (created && /—Space \d+ feet long\b[^]*\bCrew \d+ pilot\b/.test(sentence)) continue;
        // The statistics of what the spell conjures, named by the spell ("The carrier has your AC and saves …", "The mount … has a Speed
        // of 40 feet"): the GM plays it.
        if (conjured.some(noun => new RegExp(`^The ${noun}(?: conjured)? (?:is|has|uses)\\b`).test(sentence))) continue;
        // What the spell gives a targeted object ("… also grant resistance 10 to acid and a +2 bonus to saves …"): PF2e items carry no
        // rules, so it's the GM's (a sentence naming a creature or the caster isn't).
        if (objectTarget && !/\b(?:you|your|creatures?|ally|allies|wearer|wielder|bearer)\b/i.test(sentence)) continue;
        // No number and nothing gained or lost ("Roll damage normally, but do not reduce Hit Points …"): nothing for an Effect to carry.
        if (!/\d/.test(sentence) && !/\b(?:temporary Hit Points|regains?|restores?|heal\w*|gains?|loses?|resistance|weakness|Speed|bonus|penalty|Hardness|AC)\b/.test(sentence)) continue;
        if (created && STAT_BLOCK.test(sentence) && !/\b(?:you|your|target|creature|ally|allies)\b/i.test(sentence.split(/\bhas|have\b/)[0])) continue;
        // (An object the spell wraps its target in — Cryostasis's "The ice block has AC 10, Hardness 10, and 60 Hit Points, …": the object's statistics, the GM's.)
        if (/^The [a-z]+ (?:block|barrier|shell|cocoon|cage|prison) has AC \d+, Hardness \d+, and \d+ Hit Points\b/.test(sentence)) continue;
        // (Boots on the Ground's illusory troops: "An illusory troop's AC is equal to your spell DC." / "Its saving throws modifiers are equal to your spell DC – 10." —
        // the illusions' statistics, the GM's.)
        if (/^An illusory [a-z]+'s AC is equal to your spell DC\.$/.test(sentence) || /^Its saving throws? modifiers? (?:is|are) equal to your spell DC [–−-] 10\.$/.test(sentence)) continue;
        // (Crusade: a level tier's behaviour — "13th or Lower The target is so dedicated …" — the GM's, by the creature's level.)
        if (/^(?:They [^.]+\.\s+)?\d+(?:st|nd|rd|th)(?: or (?:Lower|Higher)|-\d+(?:st|nd|rd|th))? The target\b/.test(sentence) && !/\b(?:bonus|penalty|resistance|weakness|temporary Hit Points|regains?)\b/.test(sentence)) continue;
        // "You restore 5 Hit Points per spell rank to the target, …" on an object: the item's Hit Points, the GM's to update.
        if (created && /^You restore \d+ Hit Points per spell rank to the target\b/.test(sentence)) continue;
        if (ZERO_HP_ENDING.test(sentence) && !/\b(?:temporary Hit Points|regains?|lose|loses|restores?|heal)\b/i.test(sentence)) continue;
        const two = TWO_STATS.exec(sentence);
        if (two && (!two[5] || (BONUS.test(two[5]) && SITUATIONAL.test(two[5])))) {
            const subject = /^(?:You)\b/.test(sentence) ? "source" : "target";
            if (subject !== recipient && !(recipient === "target" && /^(?:Your companion|Your eidolon|It)\b/.test(sentence))) return null;
            for (const statistic of [two[3], two[4]]) rules.push({ key: "FlatModifier", selector: SELECTOR[statistic] ?? STAT_SELECTOR[statistic], type: two[2], value: Number(two[1]) });
            sources.push(sentence);
            continue;
        }
        // "Each target gains a land, burrow, climb, fly, and swim Speed of 40 feet, and can transform into …" (Migration): a BaseSpeed for each named
        // movement type; the transformation after it is the note's.
        const speeds = /^(Each target|You) gains? an? ((?:land|burrow|climb|fly|swim)(?:, (?:land|burrow|climb|fly|swim))*,? and (?:land|burrow|climb|fly|swim)) Speed of (\d+) feet(?:, and can [^.\d]+)?\.$/.exec(sentence);
        if (speeds) {
            if ((speeds[1] === "You" ? "source" : "target") !== recipient) return null;
            for (const type of speeds[2].split(/,? and |, /)) rules.push({ key: "BaseSpeed", selector: type, value: Number(speeds[3]) });
            sources.push(sentence);
            continue;
        }
        // "In exploration mode, a target can move much faster, at a travel Speed of 20 miles per hour.": overland travel, the GM's.
        if (/^In exploration mode, an? [a-z]+ can move much faster, at a travel Speed of \d+ miles per hour\.$/.test(sentence)) continue;
        // "Your familiar gains a 20-foot fly Speed.": PF2e's BaseSpeed on the recipient (the higher Speed wins if it has one).
        const speed = GAINS_SPEED.exec(sentence);
        if (speed) {
            const subject = /^You\b/.test(sentence) ? "source" : "target";
            if (subject !== recipient) return null;
            rules.push({ key: "BaseSpeed", selector: speed[2], value: Number(speed[1]) });
            sources.push(sentence);
            continue;
        }
        // "Familiars who already have a fly Speed instead gain a +15-foot status bonus to their fly Speed.": only for one that already
        // has it, the GM's (the note says it).
        if (/^[A-Z][a-z]+ who already have an? (?:fly|swim|climb|burrow) Speed instead gain an? \+\d+-foot status bonus to their (?:fly|swim|climb|burrow) Speed\.$/.test(sentence)) continue;
        // "You take a -2 penalty to Stealth checks to Hide and Sneak." (Focusing Hum): an untyped penalty to that skill for those actions.
        const actionPenalty = /^You take an? [-–−](\d) penalty to ([A-Z][a-z]+) checks to ([A-Z][a-z]+) and ([A-Z][a-z]+)\.$/.exec(sentence);
        if (actionPenalty && SKILL_NAMES.has(actionPenalty[2].toLowerCase())) {
            if (recipient !== "source") return null;
            rules.push({ key: "FlatModifier", selector: actionPenalty[2].toLowerCase(), type: "untyped", value: -Number(actionPenalty[1]),
                predicate: [{ or: [`action:${actionPenalty[3].toLowerCase()}`, `action:${actionPenalty[4].toLowerCase()}`] }] });
            sources.push(sentence);
            continue;
        }
        const flat = UNCONDITIONAL.exec(sentence);
        if (flat) {
            const subject = /^(?:You)\b/.test(sentence) ? "source" : "target";
            if (subject !== recipient && !(recipient === "target" && /^(?:Your companion|Your eidolon|It)\b/.test(sentence))) return null;
            rules.push({ key: "FlatModifier", selector: SELECTOR[flat[3]] ?? flat[4].toLowerCase(), type: flat[2], value: Number(flat[1]) });
            sources.push(sentence);
            continue;
        }
        // Each clause with a bonus must itself say when it applies ("… +2 status bonus to Perception checks and Will saves, and any
        // Nature checks to Command … gain a +1 …": the first clause is unconditional).
        const clauses = sentence.split(/,? and (?=any |the |you |each |it |they )|; |, but /i);
        if (BONUS.test(sentence) && clauses.every(clause => !BONUS.test(clause) || SITUATIONAL.test(clause))
            && !/\b(?:temporary Hit Points|resistance|weakness|Speed)\b/i.test(sentence)) continue;
        if (globalThis.process?.env?.SPELL_NOTE_DEBUG) console.error("spell-note number refused:", sentence);
        return null;
    }
    return { rules, sources };
}

/** The note's text (without heightening or links), target, area, and whether the spell places something in the environment. */
function noteBasics(adapted, html) {
    const text = htmlToPlainText(stripHeighteningHTML(html)).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\[\[\/act ([a-z-]+)\]\]/g, "$1").trim();
    if (!text) return null;
    const target = String(adapted.targeting?.target ?? "").trim();
    const area = adapted.targeting?.area ?? null;
    const creatures = SINGLE_ACTOR_TARGET.test(target) && !area;
    // A spell that makes a wall, cloud, zone or terrain in the world with no Target line also places something on the map.
    const environment = !creatures && (Boolean(area) || ENVIRONMENT.test(target) || /@Template\[/i.test(html)
        || (!target && /\b(?:wall|cloud|zone|terrain|squares?|the area)\b/i.test(text)));
    return { creatures, note: { environment, text, target: target || null,
        area: area ? { type: area.type ?? null, value: Number(area.value) || null } : null, heightened: heightenedEntries(html),
        heightenedDurations: parseHeightenedDurations(html, { unlimited: true })?.entries ?? [] } };
}

/**
 * Effect + note (user decision): a spell with no check whose linked PF2e Effect the module can't prove covers the text (or can't
 * tell who receives): PF2e's own Effect goes on the recipient — the caster, the targets, or, when the text doesn't say, whichever
 * the caster picks — with a note Effect holding the spell's text for whatever the Effect doesn't carry. Damage, healing and
 * counteracting are never left to a note: those spells stay on their own routes (or blocked).
 * Returns {effectNote} or null.
 */
export function compileEffectNote(adapted, nativeSpellEffects) {
    // (EFFECT_NOTE_DEBUG=1: which check refused it, by its line in this function.)
    const refuse = line => { if (globalThis.process?.env?.EFFECT_NOTE_DEBUG) console.error("effect-note refused at line", line); return null; };
    // (A save in the item's data that belongs to the reaction PF2e's Effect grants — Mind of Menace's Fight with Fear — when the spell's own
    // text names no save and has no degree table.)
    const grantsAction = [...(nativeSpellEffects.unscoped ?? []), ...(nativeSpellEffects.onUse ?? [])].some(entry => (entry.document?.mechanics?.rules ?? [])
        .some(rule => rule.key === "GrantItem" && /^Compendium\.pf2e\.actionspf2e\.Item\./.test(rule.uuid ?? "")));
    const actionSave = adapted.defense?.kind === "save" && grantsAction && !/\bsav(?:e|es|ing throws?)\b|<strong>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i.test(String(adapted.descriptionHTML ?? ""));
    if ((adapted.defense?.kind !== "none" && !actionSave) || adapted.activation?.traits?.includes("attack")) return refuse(6);
    // The one link: unscoped, or applied on use ("after activation") with nothing deferred or sequenced.
    let linked = [...(nativeSpellEffects.unscoped ?? []), ...(nativeSpellEffects.onUse ?? [])];
    // An aura with its per-creature Effect ("Aura: X" and "Spell Effect: X"): PF2e's aura on the caster; the Effect is the note's.
    let companion = null;
    if (linked.length === 2 && nativeSpellEffects.references.length === 2) {
        const aura = linked.find(entry => /^Aura: /.test(entry.document?.name ?? entry.label ?? "") && (entry.document?.mechanics?.rules ?? []).some(rule => rule.key === "Aura"));
        const other = linked.find(entry => entry !== aura && /^Spell Effect: /.test(entry.document?.name ?? entry.label ?? ""));
        if (aura && other && (aura.document.name ?? "").replace(/^Aura: /, "") === (other.document?.name ?? "").replace(/^Spell Effect: /, "")) {
            linked = [{ ...aura, recipient: { actor: "source", evidence: "aura-on-caster" } }];
            companion = other;
        }
    }
    if (linked.length !== 1 || (!companion && nativeSpellEffects.references.length !== 1) || Object.values(nativeSpellEffects.outcomes ?? {}).some(list => list.length)
        || (nativeSpellEffects.deferred ?? []).length || (nativeSpellEffects.sequences ?? []).length) return null;
    const effect = linked[0];
    if (effect.resolutionStatus !== "resolved" || effect.document?.type !== "effect") return refuse(22);
    // (One damage entry that is the Shield Block's damage the proof's note carries — Fire Shield — isn't the spell's own.)
    const blockEntry = /If you Shield Block a melee attack that is either an unarmed attack or made by an adjacent attacker, the attacker takes (\d+d\d+) ([a-z]+) damage\./.exec(htmlToPlainText(String(adapted.descriptionHTML ?? "")));
    const noteDamage = (adapted.damageComponents ?? []).length === 1 && blockEntry && !adapted.damageComponents[0].category
        && String(adapted.damageComponents[0].formula).replace(/\s+/g, "") === blockEntry[1] && String(adapted.damageComponents[0].type).toLowerCase() === blockEntry[2];
    if ((adapted.damageComponents ?? []).length && !noteDamage) return refuse(23);
    const html = String(adapted.descriptionHTML ?? "");
    // ("Knock counteracts Lock.": a named spell the Effect + note's proof gives a counteract button for.)
    // The caster's own healing when it's cast (Unblinking Flame Aura: "You recover @Damage[(3*@item.level)[healing]]{15 Hit Points}."): the
    // route heals the caster; its heightened step is proved with the Effect's.
    const SELF_HEAL = /You recover @Damage\[\((\d+)\*@item\.level\)\[healing\]\](?:\{[^}]*\})?\./;
    const selfHeal = SELF_HEAL.exec(html);
    const unhealed = selfHeal ? html.replace(selfHeal[0], "") : html;
    // (Font of Serenity's counteract by touch: the proof's counteract button.)
    const touchCounteract = /An ally can touch the [a-z]+ at the center of the burst as an Interact action; if they do so, the spell attempts to counteract [^.]+\.(?:\s*If the spell succeeds at the counteract check, [^.]+\.)?/;
    if (/@Damage\[|\bcounteract/i.test(unhealed.replace(touchCounteract, "").replace(/(?:^|(?<=\.\s)|(?<=<p>))(?:<em>)?[A-Z][a-z]+(?:<\/em>)? counteracts @UUID\[Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+\]\{[A-Za-z ]+\}\./, ""))) return refuse(31);
    // (The dice of a creature's own attack — "The target's claw attack … deals 1d6 slashing damage." — are its Strike's, not the spell's.)
    const ownAttack = /(?:^|(?<=\.\s))(?:The target's|If the target's|If its) [a-z]+ attack (?:already )?(?:gains|deals|had)[^.]*\./g;
    // (Fire Shield: "If you Shield Block a melee attack …, the attacker takes 2d6 fire damage." — the proof's note carries it as a roll.)
    const blockDamage = /(?:^|(?<=\.\s))If you Shield Block a melee attack that is either an unarmed attack or made by an adjacent attacker, the attacker takes \d+d\d+ [a-z]+ damage\./g;
    // (Sun's Fury: "The weapon deals an additional 1d4 fire and 1 spirit damage on a successful Strike." — PF2e's Effect carries the weapon's dice.)
    const weaponDice = /(?:^|(?<=\.\s))The weapon deals an additional \d+d\d+ [a-z]+ and \d+ [a-z]+ damage on a successful Strike\./g;
    if (/\b\d+d\d+\b[^.]{0,30}\b(?:damage|Hit Points|healing)\b/i.test(htmlToPlainText(html).replace(ownAttack, "").replace(blockDamage, "").replace(weaponDice, "").replace(/Heightened \(\+\d\)[^]*$/, ""))) return refuse(36);
    const basics = noteBasics(adapted, html);
    if (!basics) return refuse(38);
    const actor = effect.recipient?.actor;
    const recipient = actor === "source" ? "source" : actor === "target" && basics.creatures ? "target" : "ask";
    return { effectNote: { recipient, effect: { uuid: effect.uuid, label: effect.label, reference: effect.reference, sourceText: effect.sourceText,
        recipientEvidence: effect.recipient?.evidence ?? null }, ...basics.note, ...(selfHeal ? { selfHeal: { perRank: Number(selfHeal[1]), sourceText: selfHeal[0] } } : {}),
        ...(companion ? { companion: { uuid: companion.uuid, label: companion.label ?? companion.document?.name ?? null }, text: `${basics.note.text}\nPF2e's ${companion.label ?? companion.document?.name}: apply it yourself to each creature the aura affects (its tradition's rules).`.slice(0, 1400) } : {}) } };
}

/** The spell's Heightened paragraphs: {step, text} for “Heightened (+N)”, {rank, text} for “Heightened (Nth)”. */
export function heightenedEntries(html) {
    const source = String(html ?? "");
    const headings = [...source.matchAll(/<strong\b[^>]*>\s*Heightened\s*\((\+?)(\d+)(?:st|nd|rd|th)?\)\s*<\/strong>/gi)];
    return headings.map((match, index) => {
        const end = headings[index + 1]?.index ?? source.length;
        // (A Spell Effect link after the entry is the spell's Effect, not part of the entry.)
        const text = htmlToPlainText(source.slice(match.index + match[0].length, end).replace(/@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/g, ""))
            .replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\[\[\/act ([a-z-]+)\]\]/g, "$1").trim().slice(0, 600);
        return match[1] ? { step: Number(match[2]), text } : { rank: Number(match[2]), text };
    }).filter(entry => entry.text);
}

/**
 * The note's text at a cast rank: the base text, then each Heightened paragraph that applies — a fixed rank at or below the
 * cast rank, or an interval reached at least once (with how many times).
 */
export function spellNoteText(note, castRank, baseRank) {
    const extra = [];
    // Fixed-rank entries restate the spell at that rank: the highest one reached applies.
    const fixed = (note?.heightened ?? []).filter(entry => entry.rank != null && castRank >= entry.rank).at(-1);
    if (fixed) extra.push(`Heightened (${fixed.rank}): ${fixed.text}`);
    for (const entry of note?.heightened ?? []) {
        if (entry.step != null) {
            const times = Math.floor((castRank - baseRank) / entry.step);
            if (times > 0) extra.push(`Heightened (+${entry.step}) ×${times}: ${entry.text}`);
        }
    }
    return [String(note?.text ?? ""), ...extra].join("\n");
}

/** The note's duration from the spell's: fixed, sustained (its maximum), until daily preparations (1 day), or none. */
export function spellNoteDuration(lifecycle) {
    const spec = lifecycle?.durationSpec;
    if (!spec || spec.mode === "instantaneous") return null;
    // PF2e Effects count days at most: a week, month or year is that many days.
    const DAYS = { weeks: 7, months: 30, years: 365 };
    if (spec.mode === "fixed" && Number.isInteger(spec.value) && DAYS[spec.unit]) return { mode: "fixed", value: spec.value * DAYS[spec.unit], unit: "days", expiry: "turn-start", anchor: "effect-start", offset: 0 };
    if (spec.mode === "fixed" && Number.isInteger(spec.value) && spec.unit) return { mode: "fixed", value: spec.value, unit: spec.unit, expiry: spec.expiry ?? "turn-start", anchor: spec.anchor ?? "effect-start", offset: spec.offset ?? 0 };
    if (spec.mode === "turn-boundary") return { mode: "fixed", value: spec.value, unit: spec.unit, expiry: spec.expiry, anchor: spec.anchor, offset: spec.offset };
    if (spec.mode === "sustained" && spec.maximum?.mode === "fixed") return { mode: "fixed", value: spec.maximum.value, unit: spec.maximum.unit, expiry: "turn-start", anchor: "effect-start", offset: 0, sustained: true };
    // A bare "sustained" duration: PF2e's Sustain lasts up to 10 minutes.
    if (spec.mode === "sustained" && spec.maximum == null && !String(spec.raw ?? "").trim()) return { mode: "fixed", value: 10, unit: "minutes", expiry: "turn-start", anchor: "effect-start", offset: 0, sustained: true };
    if (/\bdaily preparations\b/i.test(String(spec.raw ?? ""))) return { mode: "fixed", value: 1, unit: "days", expiry: "turn-start", anchor: "effect-start", offset: 0 };
    if (/^(?:unlimited|permanent)$/i.test(String(spec.raw ?? "").trim())) return { mode: "unlimited" };
    return undefined;
}

/** The note's duration at a cast rank: a heightened fixed duration (“The duration of the spell is 1 hour”) replaces the spell's. */
export function spellNoteDurationAt(note, castRank) {
    const heightened = heightenedDurationAt(note?.heightenedDurations, castRank);
    if (!heightened || !note?.duration) return note?.duration ?? null;
    if (heightened.mode === "unlimited") return { mode: "unlimited" };
    return { mode: "fixed", value: heightened.value, unit: heightened.unit, expiry: "turn-start", anchor: "effect-start", offset: 0,
        ...(note.duration.sustained ? { sustained: true } : {}) };
}

// "This is a form of magical darkness and can therefore overcome non-magical light or attempt to counteract magical light."
const DARKNESS_FORM = /This is a form of magical (?:darkness|light) and can therefore overcome non-magical (?:light|darkness) or attempt to counteract magical (?:light|darkness)\./g;
const ACTIVE_COUNTERACT = /\b(?:attempts? to counteract|attempting a counteract|counteract checks?|can counteract|to counteract|counteracts (?!by))\b/i;
const CONDITION_LINK = /@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([^}]+)\}/g;
// Sentences that only mention a condition: a condition the target may already have, an object's look, what an attack ignores.
const MENTIONS = [
    // Cryostasis: "The target is completely frozen in ice and remains @C but stable." (the dying creature is already unconscious; it stays so)
    /\bThe target is completely frozen in ice and remains @C but stable\b/,
    // Time Jump: "… if you use time jump again within 1 minute of using the spell, you become @C for 1 minute." (a later cast's, the GM's)
    /\bif you use [a-z ]+ again within \d+ minutes? of using the spell, you become @C for \d+ minutes?\b/,
    // Shadow Jump at 8th: "When you arrive at your destination, you can become @C until the end of your next turn …" (the caster's choice)
    /\bWhen you arrive at your destination, you can become @C until the end of your next turn\b/,
    // Cloud Dragon's Cloak: "The target is treated as @C for the purposes of resolving the triggering attack …" (that attack's flat check)
    /\bThe target is treated as @C for the purposes of resolving the triggering attack\b/,
    // Elemental Sense's Mechanoreception: "You can see @C creatures and objects. They appear to you as translucent shapes, and they are @C to
    // you." — what the caster perceives (the GM's).
    /\bYou can see @C creatures and objects\b/,
    /\bThey appear to you as translucent shapes, and they are @C to you\b/,
    /\b[Ii]f (?:the (?:target|creature|ally)|it|a target|either [^,]+) is (?:@C(?:,? (?:or|and) @C)*)(?: or refuses [^,]+)?(?: from you)?,/,
    // "you can become Hidden to a creature even if you don't have cover …" / "… unless you move into cover or become Concealed before
    // then": what a Stealth check can achieve, the GM's to judge.
    /\byou can become @C to a creature even if\b|\bunless you move into cover or become @C before then\b/,
    /\ban? @C (?:ally|creature)\b/,
    /\b(?:use )?@C condition gained from\b/,
    /\bignoring the target's @C\b/,
    /\battempts? to Seek\b[^.]*@C|\bSeek @C\b/,
    /\bhave it be @C\b|\bIt is @C or has\b/,
    /\b(?:[Tt]he object|[Tt]he path|[Tt]he item|An item [a-z ]+) (?:@C|can be visible or @C|appears @C)\b|\bmake the object @C\b|\bmime an @C [0-9-]+-foot\b/,
    // "… potentially removing the Broken condition if this repairs it past the item's Broken Threshold": an item's state.
    /\bremoving the @C condition if this repairs it past the item's Broken Threshold\b/,
    /\bThis makes it @C to all creatures, though the creatures can attempt to find the target, making it @C to them instead if they succeed\b/,
    // What the spell protects against ("aiding them against being Immobilized", "any effect that would make them grappled, immobilized,
    // or Restrained"): a situational protection the note carries, no condition applied.
    // What creatures see through a wall ("They treat targets seen through the wall as Concealed."): the GM's sight lines.
    /\b[Tt]hey treat targets seen through the wall as @C\b/,
    // A state that triggers the spell's end ("When the spell ends or the target falls Unconscious, the contents … are disgorged"): a mention.
    /\bthe target falls @C, the contents\b/,
    // What creatures already in a state do in the area ("Confused creatures in the area don't attack anyone …"): the GM plays it.
    /^@C creatures in the area don't attack anyone\b/,
    // What the caster sees through ("… even if it wouldn't normally be due to lighting or the Concealed or Invisible conditions …" / "… isn't
    // automatically Hidden from you due to darkness …"): perception the GM applies.
    /\bdue to lighting or the @C or @C conditions\b/, /\bisn't automatically @C from you due to darkness\b/,
    // A rest rule ("Those sleeping 8 hours reduce their Doomed condition by 2 instead of 1."): the GM applies it at the rest.
    /^Those sleeping \d+ hours reduce their @C condition by \d+ instead of \d+\.$/,
    // A thing the spell creates that's invisible ("You create an Invisible floating eye at a location within range"): its look.
    /^You create an @C,? (?:floating )?(?:eye|sensor|ear)\b/,
    // (Proliferating Eyes: "You implant an Invisible, magical eye sensor on the target's body.")
    /^You implant an @C, magical (?:eye|ear) sensor\b/,
    // What the caster sees from another plane (Ethereal Jaunt: "You can see onto the Material Plane within a radius of 60 feet; it is gray, hazy, and Concealed
    // from you."): the GM's sight lines.
    /\bit is gray, hazy, and @C from you\b/,
    // An example of a state the spell overrides (Spellsurge: "… a flat check to Cast a Spell (such as from the Stupefied condition) automatically succeed."):
    // a mention.
    /\(such as from the @C condition\)/,
    // Perceiving past a state (Unrelenting Observation: "… allowing them to ignore the Concealed or Invisible condition, though physical barriers …").
    /\ballowing them to ignore the @C or @C condition\b/,
    // A created place's entrance (Planar Palace: "Once inside, you can shut the entrance, making it Invisible."): its look.
    /\byou can shut the entrance, making it @C\b/,
    /\baiding (?:them|it|the target) against being @C\b/,
    /\beffect that would make (?:them|it|the target) (?:[a-z]+, )*(?:[a-z]+,? )?or @C\b/,
    // Items in a container (Empty Pack): what the items look like, which PF2e doesn't track for items.
    /\bYou render every item inside the container you touch @C, although the container itself remains visible\b/,
    /\bThe items within are @C to all creatures, though a creature can attempt to find an item by reaching into the bag\b/
];

/** Every sentence with a condition link only mentions it (nothing granted to or removed from a creature). */
function conditionMentionsOnly(html, adapted) {
    const creatures = SINGLE_ACTOR_TARGET.test(String(adapted.targeting?.target ?? "").trim());
    // Heightened paragraphs too: the note shows them at higher ranks.
    const sentences = htmlToPlainText(html).split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(sentence => /conditionitems\./.test(sentence));
    return sentences.every(sentence => {
        const masked = sentence.replace(CONDITION_LINK, "@C");
        // Restoring, curing or removing a condition is a mechanic, never a mention ("You restore a Petrified creature …").
        if (/\b(?:restores?|cures?|removes?|ends?|counteracts?|suppress(?:es)?) (?:an? |the |its |your )?@C\b/i.test(masked)) return false;
        if (/\b(?:loses?|reduce|remove|removing|increase|becomes?|gains?|is|are) (?:your |its |their |the )?(?:current )?@C\b/.test(masked)
            && !MENTIONS.some(pattern => pattern.test(masked))) return false;
        // An object's look ("It is Invisible …") is a mention only when the spell doesn't target creatures.
        if (/\bIt is @C or has\b|\bhave it be @C\b/.test(masked) && creatures) return false;
        return MENTIONS.some(pattern => pattern.test(masked));
    });
}

// Condition grants a note carries alongside the condition: "The ally becomes Quickened and can use the additional action to …",
// "You Step and become Concealed.", "You gain the Concealed condition during this movement and until the start of your next turn."
const GRANTS = [
    { pattern: /^(The ally|The target) becomes? @C(?: and [^.]+)?\.$/, recipient: "target" },
    // "The target's form appears blurry. It becomes Concealed." / "All affected targets are Quickened." (up to N creatures)
    { pattern: /^It becomes @C\.$/, recipient: "target" },
    // "The target becomes Invisible, but not merely to vision." (Disappearance): the condition; its reach to every precise sense is the note's.
    { pattern: /^The target becomes @C, but not merely to vision\.$/, recipient: "target" },
    // "Illusions bend light around the target, rendering it Invisible."
    { pattern: /^[A-Z][a-z ]{3,60}, rendering it @C\.$/, recipient: "target" },
    { pattern: /^All (?:affected )?targets are @C\.$/, recipient: "target", several: true },
    { pattern: /^You (?:Step|Stride) and become @C\.$/, recipient: "source" },
    // "You become Invisible, with the same restrictions as the 2nd-rank Invisibility spell." (Invisibility Cloak): the caster's condition; the
    // borrowed restrictions are the note's.
    // (Shroud of the Mantis: "You wrap yourself in a crimson cloak that renders you Invisible, with the same restrictions as a 2nd-rank Invisibility spell.")
    { pattern: /^You (?:become|wrap yourself in an? [a-z ]+ that renders you) @C, with the same restrictions as (?:the|an?) [0-9a-z-]+ @S spell\.$/, recipient: "source" },
    // "You become Concealed to all creatures, and you are Hidden from undead creatures regardless of what precise senses they have; this grants
    // the effects of Invisibility, but against all the undead creature's precise senses." (Spirit Veil): the caster's first condition; the
    // second depends on who observes (the note's).
    { pattern: /^You become @C to all creatures, and you are @C from ([a-z]+) creatures regardless of what precise senses they have; this grants the effects of @S, but against all the \1 creature's precise senses\.$/, recipient: "source", observerSecond: true },
    // "You and all targets are Invisible except to each other as long as the targets remain within the emanation." (Shared Invisibility): the
    // caster and the targets; leaving the emanation, and a hostile action, are the note's.
    { pattern: /^You and all targets are @C except to each other as long as the targets remain within the emanation\.$/, recipient: "self-and-targets" },
    // "The target appears to fall down dead, though it actually turns Invisible." (Drop Dead)
    { pattern: /^The target appears to [a-z ]+, though it actually turns @C\.$/, recipient: "target" },
    // "This lack of awareness makes you Off-Guard." (Beastmaster Trance, Eyes of the Dead: the caster, while sharing another creature's senses)
    { pattern: /^This lack of awareness makes you @C\.$/, recipient: "source", anyTarget: true },
    // "The target is Quickened on its next turn and can use the action only to Step, Stride, or Strike." (Time Skip)
    { pattern: /^The target is @C on its next turn and can use the (?:extra )?action only to [A-Z][a-z]+(?:, [A-Z][a-z]+)*,? or [A-Z][a-z]+\.$/, recipient: "target" },
    { pattern: /^You gain the @C condition(?: during this movement)? and until the (start|end) of your next turn\.$/, recipient: "source", own: true },
    // "You turn yourself Invisible and create an illusory duplicate of yourself." (Mislead): the caster's, for the spell's duration; the duplicate is the note's.
    { pattern: /^You turn yourself @C and create an illusory duplicate of yourself\.$/, recipient: "source" },
    // "After you arrive, you are Slowed 1 until the end of your next turn." (Momentary Recovery, after its teleport): the caster's; the teleport and the actions
    // taken on the way are the note's.
    { pattern: /^After you arrive, you are @C until the (start|end) of your next turn\.$/, recipient: "source", own: true },
    // "You gain the Quickened condition and can use the extra action each round for only Stride and Strike actions." (Hasted Assault): the caster's, for the
    // spell's duration; the limit is the note's.
    { pattern: /^You gain the @C condition and can use the extra action each round for only [A-Z][a-z]+(?:, [A-Z][a-z]+)*,? and [A-Z][a-z]+ actions\.$/, recipient: "source" },
    // "They become Concealed against the triggering attack and until the end of the current creature's turn." (a reaction)
    { pattern: /^They become @C against the triggering attack and until the end of the current creature's turn\.$/, recipient: "target", currentTurn: true },
    // "Enemies within the area are Frightened 1. They can't reduce their frightened value below 1 while they remain in the area."
    // (an emanation, no target): the enemies the caster targets in it, held at that value for the spell's duration.
    { pattern: /^Enemies within the area are @C\.$/, recipient: "area-enemies" },
    // "You reduce your current Frightened condition by 1, and whenever you would become Frightened during the duration, reduce the
    // amount by 1.": the caster's condition goes down now; the rest is the note.
    { pattern: /^You reduce your current @C condition by (\d+), and whenever you would become ([A-Z][a-z]+) during the duration, reduce the amount by \1\.$/, recipient: "source", reduce: true }
];
// "You can target a potion or alchemical elixir with this spell, attempting a counteract check against it. If you succeed, the elixir or
// potion spoils and becomes a mundane item."
// The spell's own counteract against a thing the GM names, and what success does: "Prior to the transformation, the spell attempts to
// counteract any poisons in the food or water." / "You can attempt a counteract check against magical difficult terrain and greater
// difficult terrain composed of earthen materials in the area, too, making it normal terrain for the duration if you succeed."
const BASE_COUNTERACT = [
    /^(?:Prior to [a-z ]+, )?the spell attempts to counteract (any [a-z ]{3,40}? in the [a-z ]{3,30})\.$/,
    /^You can attempt a counteract check against (magical [a-z ]{3,100}? in the area)(?:, too)?, (making it [a-z ]{3,40}) for the duration if you succeed\.$/,
    // Wall of Water: "It also attempts to counteract any magical fires in its area."
    /^It also attempts to counteract (any magical fires in its area)\.$/,
    // Time Beacon: "If you were affected by any harmful effects during your turn after casting time beacon, in order to return to your beacon, time beacon attempts
    // a counteract check against each such effect." (the card's button, once per harmful effect the GM names; "If it fails at any of these checks, you can't
    // return." is the note's).
    /^If you were affected by any harmful effects during your turn after casting [a-z ]+, in order to return to your beacon, [a-z ]+ attempts a counteract check against (each such effect)\.$/,
    // Personal Ocean: "Each time you move, you extinguish non-magical fires in spaces you pass through and can attempt to counteract magical fires you move through."
    /^Each time you move, you extinguish non-magical fires in spaces you pass through and can attempt to counteract (magical fires you move through)\.$/
];
// "In addition, effects with the fire trait that target the item must first succeed at a counteract check against your spell DC.": the
// other effect's check, the GM's.
const PASSIVE_COUNTERACT = /\bIf it fails at any of these checks, you can't return\.|\b(?:In addition, )?effects with the [a-z]+ trait that target the [a-z]+ must first succeed at a counteract check against your spell DC\.|\bIf the wall fails to counteract a given fire, it can't counteract that fire for the duration of the spell\.|\bIf you fail to counteract a given fire, you can't counteract that fire for the duration of the spell\.|\bIf you successfully counteract a fire larger than the spaces you moved through, you merely push it out of the spaces along your path\.|\bStrong winds from a magical source can disrupt this spell if the effect succeeds at a counteract check against your spell DC\./g;
const HEIGHTENED_COUNTERACT = /^You can target (an? [a-z ]+?) with this spell, attempting a counteract check against it\. If you succeed, the [a-z ]+ spoils and becomes a mundane item\.$/;
const INVISIBLE_RESTATED = /^This makes it @C to all creatures, though the creatures can attempt to find the target, making it @C to them instead\.$/;
const HEIGHTENED_EXTRA_TARGET = /<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*You can target one additional willing creature within (\d+) feet\./;
const AREA_FLOOR = /^They can't reduce their ([a-z]+) value below (\d+) while they remain in the area\.$/;

/**
 * Condition + note: a spell with no check that grants one linked condition to its recipient — the ally or target it names, or the
 * caster — for the spell's duration (or the sentence's own "until the start/end of your next turn"). The condition is applied as
 * PF2e's; the rest of the text is a note. Returns {conditionNote} or null.
 */
export function compileConditionNote(adapted, description, nativeSpellEffects, lifecycle) {
    if (adapted.defense?.kind !== "none" || adapted.activation?.traits?.includes("attack")) return null;
    if ((adapted.damageComponents ?? []).length || nativeSpellEffects.references.length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/@Damage\[|\bcounteract/i.test(html) || /\b\d+d\d+\b[^.]{0,30}\b(?:damage|Hit Points|healing)\b/i.test(htmlToPlainText(html))) return null;
    const plain = htmlToPlainText(stripHeighteningHTML(html));
    // "This makes it Undetected to all creatures, though the creatures can attempt to find the target, making it Hidden to them instead.":
    // PF2e's own Invisible rules restated after the grant (the note carries it).
    const restated = sentence => INVISIBLE_RESTATED.test(sentence.replace(CONDITION_LINK, "@C"));
    const linked = plain.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(sentence => /conditionitems\./.test(sentence) && !restated(sentence));
    if (linked.length !== 1) return null;
    const links = [...linked[0].matchAll(CONDITION_LINK)];
    const masked = linked[0].replace(CONDITION_LINK, "@C").replace(/@UUID\[Compendium\.pf2e\.spells-srd\.Item\.[^\]]+\]\{[^}]+\}/g, "@S");
    const grant = GRANTS.map(entry => ({ ...entry, match: entry.pattern.exec(masked) })).find(entry => entry.match);
    if (!grant || links.length !== (grant.observerSecond ? 2 : 1)) return null;
    const target = String(adapted.targeting?.target ?? "").trim();
    if (grant.recipient === "self-and-targets" ? !/^you and up to (?:\d+|five|ten) willing creatures$/i.test(target) : grant.recipient === "target" ? !(grant.several ? /^up to (?:\d+|two|three|four|five|six|ten) (?:allies|willing creatures|creatures)$/i : /^(?:1|one) (?:ally|willing creature|creature)(?: other than yourself)?$/i).test(target) : (target !== "" && !grant.anyTarget)) return null;
    if (grant.recipient === "area-enemies" && adapted.targeting?.area?.type !== "emanation") return null;
    // "Heightened (+1) You can target one additional willing creature within 30 feet." (the caster's own grant): the targets the caster adds at
    // the cast rank get it too.
    const extra = HEIGHTENED_EXTRA_TARGET.exec(html);
    if (extra && !(grant.recipient === "source" && target === "")) return null;
    const label = links[0][1].trim();
    // A reduction names the condition it lowers (no value), and the same condition again.
    if (grant.reduce && (/\s\d+$/.test(label) || grant.match[2].toLowerCase() !== label.toLowerCase())) return null;
    const value = /\s(\d+)$/.exec(label);
    // The area's floor sentence, right after the grant: held at that value while the spell lasts (a GM note for leaving the area).
    const sentences = plain.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const floorSentence = grant.recipient === "area-enemies" ? sentences[sentences.indexOf(linked[0]) + 1] ?? "" : "";
    const floor = grant.recipient === "area-enemies" ? AREA_FLOOR.exec(floorSentence) : null;
    if (grant.recipient === "area-enemies" && (!floor || !value || floor[1] !== label.replace(/\s+\d+$/, "").toLowerCase() || Number(floor[2]) !== Number(value[1]))) return null;
    const uuid = /@UUID\[([^\]]+)\]/.exec(links[0][0])[1];
    const duration = grant.currentTurn ? { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "current-turn", offset: 0 }
        : grant.own
        ? { mode: "fixed", value: 1, unit: "rounds", expiry: grant.match[1] === "start" ? "turn-start" : "turn-end", anchor: "source-turn", offset: 1 }
        : spellNoteDuration(lifecycle);
    if (!duration || duration.mode !== "fixed") return null;
    const basics = noteBasics(adapted, html);
    const numbers = basics && judgeNumbers(plain.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1"), { recipient: grant.recipient, created: false });
    if (!basics || !numbers || numbers.rules.length) return null;
    return { conditionNote: { recipient: grant.recipient, condition: { uuid, name: label.replace(/\s+\d+$/, ""), slug: label.replace(/\s+\d+$/, "").toLowerCase().replace(/\s+/g, "-"),
        value: value ? Number(value[1]) : null, sourceText: linked[0], ...(floor ? { floor: true, floorText: floorSentence } : {}),
        ...(grant.reduce ? { reduceBy: Number(grant.match[1]) } : {}) }, ...basics.note, duration,
        ...(extra ? { heightenedTargets: { interval: Number(extra[1]), perStep: 1, feet: Number(extra[2]), baseRank: Number(adapted.rank) || 1, sourceText: htmlToPlainText(extra[0]).trim() } } : {}) } };
}

/**
 * "The target loses the Dying condition, though it remains Unconscious at 0 Hit Points." (Target: 1 dying creature): PF2e's rule for
 * losing Dying applies (Wounded +1). Returns {stabilize} or null.
 */
export function compileStabilize(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || adapted.activation?.traits?.includes("attack") || (adapted.damageComponents ?? []).length || nativeSpellEffects.references.length) return null;
    if (!/^(?:1|one) dying creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const sentences = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const rule = sentences.find(sentence => /^The target loses the @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Dying\} condition, though it remains @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Unconscious\} at 0 Hit Points\.$/.test(sentence));
    if (!rule || sentences.some(sentence => sentence !== rule && (/\d|@|\[\[/.test(sentence) || sentence.split(" ").length > 12))) return null;
    return { stabilize: { sourceText: rule } };
}

/**
 * A save made only by bystanders the GM picks, or by an unwilling creature to keep the spell off it: "If a light source is attended by an unwilling creature,
 * that creature can attempt a Reflex save to snuff the light out …" / "Tiny animals and animal swarms of any size within range must
 * attempt a Will save." No results table; the GM runs those saves, and the note holds the rules.
 */
function bystanderSaveOnly(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    if (adapted.defense?.basic || /<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i.test(html)) return false;
    const saves = htmlToPlainText(stripHeighteningHTML(html)).split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(sentence => /\b(?:save|saving throw)\b/i.test(sentence));
    // PF2e's data has a save the text never mentions, with no result table (Impart Empathy): the text decides (user decision: follow the text).
    if (!saves.length && !/\b(?:Fortitude|Reflex|Will|saves?|saving throws?)\b/i.test(htmlToPlainText(html))) return true;
    // (Or an unwilling creature's save that only keeps the spell off it: "Any unwilling participant can attempt a Reflex save to avoid being
    // carried along." / "If the target wishes to prevent you from doing so, it can attempt a Will save, negating the spell on a success, …")
    return saves.length > 0 && saves.every(sentence => /^(?:If an? [a-z ]+ is attended by an unwilling creature, that creature can attempt|Tiny animals and animal swarms of any size within range must attempt) an? (?:Fortitude|Reflex|Will) save\b/.test(sentence)
        || /^Any unwilling participant can attempt an? (?:Fortitude|Reflex|Will) save to avoid being carried along\.$/.test(sentence)
        || /^If the target wishes to prevent you from doing so, it can attempt an? (?:Fortitude|Reflex|Will) save, negating the spell on a success, but most [a-z]+ don't bother to do so\.$/.test(sentence)
        // (Trade Items: "If the second item is in the possession of a creature unwilling to relinquish it, they can prevent the transposition with a
        // successful Reflex save.")
        || /^If the second item is in the possession of a creature unwilling to relinquish it, they can prevent the transposition with a successful (?:Fortitude|Reflex|Will) save\.$/.test(sentence));
}

// A basic save's lasting part the caster plays while Sustaining ("For the spell's duration, an ally who's adjacent to you can
// Interact and be instantly teleported to an unoccupied space in the spell's area, as long as they don't travel more than 60
// feet." and "This effect has the teleportation trait."): a note Effect on the caster for the spell's sustained maximum, with the
// Heightened text at the cast rank. Anything mechanical in the sentence (damage, a save, a modifier, a condition) keeps it off.
const SUSTAINED_NOTE = /^For (?:the spell's|its) duration, ([^.]{10,300})\.$/;
const SUSTAINED_NOTE_TRAIT = /^This effect has the ([a-z]+) trait\.$/;
const SUSTAINED_NOTE_BLOCKERS = /\d+d\d+|@|\b(?:damage|saves?|saving throws?|bonus|penalty|Hit Points|heal(?:s|ed|ing)?|conditions?|immune|immunity|resistance|weakness|Strike|attack)\b/i;

/** {note, sentences} for the caster, or null. `sentences` are the plain remainder sentences of the description. */
export function compileSustainedCasterNote(sentences, adapted, lifecycle) {
    const duration = spellNoteDuration(lifecycle);
    if (duration?.sustained !== true) return null;
    const index = sentences.findIndex(sentence => SUSTAINED_NOTE.test(sentence));
    if (index < 0 || sentences.filter(sentence => SUSTAINED_NOTE.test(sentence)).length !== 1) return null;
    const rule = SUSTAINED_NOTE.exec(sentences[index])[1];
    if (SUSTAINED_NOTE_BLOCKERS.test(rule)) return null;
    const trait = SUSTAINED_NOTE_TRAIT.test(sentences[index + 1] ?? "") ? sentences[index + 1] : null;
    const claimed = [sentences[index], ...(trait ? [trait] : [])];
    return {
        sentences: claimed,
        note: { recipient: "source", text: claimed.join(" "), sourceText: claimed.join(" "), duration,
            heightened: heightenedEntries(adapted.descriptionHTML) }
    };
}
