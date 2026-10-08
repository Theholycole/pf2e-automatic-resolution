// Basic-save degree riders: a sentence that attaches conditions to failing
// (failure and critical failure) or critically failing creatures, e.g. "A
// creature that fails its saving throw also becomes Sickened 1" or "On a failed
// saving throw, a creature becomes Dazzled for 1 round, or dazzled for 4 rounds
// on a critical failure." The degree phrase, an optional subject, one
// coordinated grant run (with its own positional lifetimes) and an optional
// critical-failure alternative must account for the entire sentence.
import { extractScopedConditionReferences, htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";
import { parseConditionLists } from "./condition-list-lifetime.js";

const FAIL = ["failure", "criticalFailure"], CRIT = ["criticalFailure"];
const SUBJ = String.raw`(?:the target|a target|the creature|a creature|it)`;
const DEGREE_PHRASES = [
    { pattern: /^On a critical failure,\s*/i, degrees: CRIT },
    { pattern: /^On a (?:failure|failed save|failed saving throw),\s*/i, degrees: FAIL },
    { pattern: new RegExp(String.raw`^If ${SUBJ} critically fails(?: (?:the|its|this) (?:save|saving throw))?,\s*`, "i"), degrees: CRIT },
    // "If a creature in the area critically fails its Reflex save and was standing, it also falls Prone." (Prone does nothing to one
    // already down.)
    { pattern: new RegExp(String.raw`^If ${SUBJ} in the area critically fails its (?:Fortitude|Reflex|Will) save(?: and was standing)?,\s*`, "i"), degrees: CRIT },
    { pattern: new RegExp(String.raw`^If ${SUBJ} fails(?: (?:the|its|this) (?:save|saving throw))?,\s*`, "i"), degrees: FAIL },
    { pattern: /^(?:A|Any) creature (?:that|who) critically fails (?:its|the|this) (?:save|saving throw)\s+/i, degrees: CRIT },
    { pattern: /^(?:A|Any) creature (?:that|who) fails (?:its|the|this) (?:save|saving throw)\s+/i, degrees: FAIL },
    { pattern: /^(?:Additionally, )?(?:the )?creatures (?:that|who) critically fail(?: (?:the|their) (?:saves?|saving throws?))?\s+/i, degrees: CRIT },
    { pattern: /^(?:Additionally, )?(?:the )?creatures (?:that|who) fail(?: (?:the|their) (?:saves?|saving throws?))?\s+/i, degrees: FAIL }
];
const LEAD = /^(?:(?:it|the target|the creature|they|a creature)\s+)?(?:(?:also|additionally)\s+)?$/i;
// "is disoriented by the explosion of water, becoming Off-Guard …": a narrated participle before the grant.
const NARRATED_LEAD = /^is ([a-z' ]{3,40}) by ([a-z' ]{3,50}), $/i;

const FLAVOR_BLOCKERS = /\b(?:push|pull|move|moves|fall|falls|prone|damage|feet|foot|save|action|actions|turn|round|rounds|minute|condition|until|unless|if|takes?|loses?|gains?|becomes?|immune|attack|strike)\b|\d/i;

function sentences(text) {
    return String(text ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
}

function onlyRun(text) {
    const items = parseConditionLists(text);
    const runs = [...new Set(items.map(item => item.listIndex))];
    if (runs.length !== 1) return null;
    return { items, start: items[0].runStart, end: items[0].runEnd };
}

/** One rider sentence, or null when anything in it is unaccounted for. */
export function parseDegreeRider(sentence) {
    const phrase = DEGREE_PHRASES.map(entry => ({ ...entry, match: entry.pattern.exec(sentence) })).find(entry => entry.match);
    if (!phrase) return null;
    // "it's also Deafened" reads as "it is also Deafened".
    const rest = sentence.slice(phrase.match[0].length).replace(/^(it|they)(?:'s|'re)\b/i, (_, pronoun) => pronoun.toLowerCase() === "it" ? "it is" : "they are");
    // "also falls prone" is Prone's proven unlinked predicate.
    if (/^(?:(?:it|they|the target|the creature)\s+)?(?:also\s+)?falls (?:prone|@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Prone\})\.$/i.test(rest)) {
        return { degrees: phrase.degrees, sentence, grant: "is knocked prone.", alternative: null };
    }
    // ", or X on a critical failure" replaces the failure grant for critical failures (also written "X (Y on a critical failure)", with a
    // trailing "due to …" flavor: Plasma Whirl's "become Sickened 1 (Sickened 2 on a critical failure) due to their exposure to cosmic radiation.").
    const paren = /^(.*?)\s+\(([^()]+?)\s+on a critical failure\)(?:\s+due to [a-z' ]{3,60})?\.$/i.exec(rest);
    const split = paren ? [paren[0], paren[1], paren[2]] : /^(.*?),\s+or\s+(.+?)\s+on a critical failure\.$/i.exec(rest);
    if (split && !phrase.degrees.includes("failure")) return null;
    let main = split ? `${split[1]}.` : rest;
    // A trailing causal clause ("as it reels from the impact of so much
    // anguish") is flavor only when it carries no mechanical wording.
    const causal = /\s+as (?:it|they) ([a-z' ]{3,60})\.$/i.exec(main);
    if (causal && !FLAVOR_BLOCKERS.test(causal[1])) main = `${main.slice(0, causal.index)}.`;
    const run = onlyRun(main);
    if (!run) return null;
    const lead = main.slice(0, run.start);
    const narrated = NARRATED_LEAD.exec(lead);
    if (!(LEAD.test(lead) || (narrated && !FLAVOR_BLOCKERS.test(`${narrated[1]} ${narrated[2]}`))) || main.slice(run.end) !== ".") return null;
    let alternative = null;
    if (split) {
        alternative = `is ${split[2]}.`;
        const altRun = onlyRun(alternative);
        if (!altRun || altRun.start !== 0 || alternative.slice(altRun.end) !== ".") return null;
    }
    return { degrees: phrase.degrees, sentence, grant: `${main.slice(run.start, run.end)}.`, alternative };
}

/**
 * Every rider sentence of a basic save. Returns null when no sentence is a
 * rider; the caller must still gate the remaining description.
 */
// A rider joined to the damage sentence (Rip the Spirit, Untwisting Iron Roots): "The target takes 5d6 void damage, depending on its basic
// Fortitude save, and is also Drained 1 if it fails its save." / "…, with a basic Reflex save; on a failed save, they also fall Prone." —
// read as the damage sentence and the rider sentence.
const JOINED_RIDERS = [
    [/^(.+? damage[^;]*?), and (?:is|are) also ((?:@UUID\[[^\]]+\]\{[^}]+\}|[^.])+?) if (?:it|they) (fails?|critically fails?) (?:its|their) save\.$/,
        m => [`${m[1]}.`, `If it ${/critically/.test(m[3]) ? "critically fails" : "fails"}, it is also ${m[2]}.`]],
    [/^(.+? damage[^;]*?); on a failed save, (?:they|it) also falls? (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Prone\}|Prone)\.$/,
        m => [`${m[1]}.`, `On a failure, it also falls ${m[2]}.`]]
];
export function splitJoinedRiders(list) {
    return list.flatMap(sentence => { for (const [pattern, split] of JOINED_RIDERS) { const m = pattern.exec(sentence); if (m) return split(m); } return [sentence]; });
}

export function compileBasicDegreeRiders(adapted) {
    const all = splitJoinedRiders(sentences(htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML))));
    const riders = all.map(parseDegreeRider).filter(Boolean);
    if (!riders.length) return null;
    const byDegree = { failure: [], criticalFailure: [] };
    for (const rider of riders) {
        const effects = extractScopedConditionReferences(rider.grant);
        if (!effects.length) return null;
        const alternative = rider.alternative ? extractScopedConditionReferences(rider.alternative) : null;
        if (rider.alternative && !alternative.length) return null;
        for (const degree of rider.degrees) {
            const chosen = degree === "criticalFailure" && alternative ? alternative : effects;
            byDegree[degree].push(...chosen.map(effect => ({ ...effect,
                riderGrant: chosen === alternative ? rider.alternative : rider.grant, riderText: rider.sentence })));
        }
    }
    return { byDegree, sentences: riders.map(rider => rider.sentence), remainder: all.filter(sentence => !riders.some(rider => rider.sentence === sentence)) };
}

// A basic save whose damage is nonlethal against living creatures, and whose failing creatures of one trait are knocked back
// (Buffeting Winds):
//   "The wind deals 2d4 bludgeoning damage, which is nonlethal against living creatures." / "Against undead, the winds are more
//   vicious, and the spell loses the nonlethal trait against such creatures." / "On a failure, undead creatures are also knocked
//   back 5 feet (or 10 feet on a critical failure)."
// The damage is the item's; nonlethal is a GM reminder (PF2e doesn't track it); the push is the GM's, for creatures with the trait.
// Narration before the damage sentence may mention the creatures it names.
const NONLETHAL_DAMAGE = /^(The [a-z]+ deals (\d+d\d+) ([a-z]+) damage), which is nonlethal against living creatures\.$/;
const NONLETHAL_LOSS = /^Against ([a-z]+), the [a-z]+ (?:are|is) more vicious, and the spell loses the nonlethal trait against such creatures\.$/;
const TRAIT_KNOCKBACK = /^On a failure, ([a-z]+) creatures are also knocked back (\d+) feet \(or (\d+) feet on a critical failure\)\.$/;
const NARRATION_BLOCKERS = /\d|@|\b(?:damage|save|bonus|penalty|condition|immune|can't|must|until|takes?|deals?)\b/i;

export function compileBasicTraitKnockback(adapted) {
    const text = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).replace(/\s+/g, " ").trim();
    const all = sentences(text);
    const damageIndex = all.findIndex(sentence => NONLETHAL_DAMAGE.test(sentence));
    const push = all.map(sentence => TRAIT_KNOCKBACK.exec(sentence)).find(Boolean);
    const loss = all.map(sentence => NONLETHAL_LOSS.exec(sentence)).find(Boolean);
    if (damageIndex < 0 || !push || !loss || loss[1] !== push[1]) return null;
    const damage = NONLETHAL_DAMAGE.exec(all[damageIndex]);
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== damage[2] || String(components[0].type).toLowerCase() !== damage[3]) return null;
    const narration = all.slice(0, damageIndex);
    if (narration.length > 1 || narration.some(sentence => NARRATION_BLOCKERS.test(sentence))) return null;
    // "Each creature in the area must attempt a basic Reflex save." joins the damage as the one basic-save sentence.
    const save = all.find(sentence => /^Each creature in the area must attempt a basic (?:Fortitude|Reflex|Will) save\.$/.test(sentence));
    if (!save) return null;
    const claimed = new Set([...narration, all[damageIndex], loss[0], push[0], save]);
    const remainder = [`${damage[1]} to each creature in the area (${/basic (?:Fortitude|Reflex|Will) save/.exec(save)[0]}).`, ...all.filter(sentence => !claimed.has(sentence))];
    const trait = push[1];
    const move = distance => ({ kind: "push", distance: Number(distance), upTo: false, optional: false, direction: "away", trait });
    return {
        remainder,
        forcedMovement: { failure: move(push[2]), criticalFailure: move(push[3]) },
        reminder: { kind: "nonlethal", text: `${all[damageIndex]} ${loss[0]}`, sourceText: `${all[damageIndex]} ${loss[0]}`, exceptTrait: trait },
        sentences: [...claimed]
    };
}

// A push on a failed basic save, with the caster spared (Blastback):
//   "You take no damage from the fall as the displaced air allows you to land gently, but all other creatures in the spell's area take 6d4
//   bludgeoning damage." / "Creatures that fail their save are also pushed back 5 feet."
// The damage is the item's, to each creature in the area other than the caster; the push is the GM's (failure and critical failure).
const SPARED_DAMAGE = /^You take no damage from the fall as [a-z ,']+, but all other creatures in the spell's area take (\d+d\d+) ([a-z]+) damage\.$/;
const FAIL_PUSH = /^Creatures that fail their save are also pushed back (\d+) feet\.$/;

export function compileBasicPushRider(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || !adapted.targeting?.area) return null;
    const text = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML).replace(/<p>\s*<strong>\s*Trigger\s*<\/strong>[\s\S]*?<\/p>\s*(?:<hr\s*\/?>)?/i, "")).replace(/\s+/g, " ").trim();
    const all = sentences(text);
    const damageIndex = all.findIndex(sentence => SPARED_DAMAGE.test(sentence));
    const pushIndex = all.findIndex(sentence => FAIL_PUSH.test(sentence));
    if (damageIndex < 0 || pushIndex !== damageIndex + 1 || all.length !== pushIndex + 1) return null;
    const damage = SPARED_DAMAGE.exec(all[damageIndex]);
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== damage[1] || String(components[0].type).toLowerCase() !== damage[2]) return null;
    const narration = all.slice(0, damageIndex);
    if (narration.length > 1 || narration.some(sentence => NARRATION_BLOCKERS.test(sentence))) return null;
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    const move = { kind: "push", distance: Number(FAIL_PUSH.exec(all[pushIndex])[1]), upTo: false, optional: false, direction: "away" };
    // "Heightened (+2) The emanation increases by 10 feet, and the damage increases by 1d4.": the damage step is PF2e's (checked); the area's
    // growth, which PF2e's data lacks, is the GM's reminder.
    const heightened = /<p>\s*<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The (emanation|burst) increases by (\d+) feet, and the damage increases by (\d+d\d+)\.\s*<\/p>/.exec(String(adapted.descriptionHTML ?? ""));
    const reminders = [{ kind: "caster-spared", text: "The caster takes no damage from the fall and isn't affected by the spell.", sourceText: all[damageIndex] }];
    const claimed = [...narration, all[damageIndex], all[pushIndex]];
    if (/Heightened/.test(String(adapted.descriptionHTML ?? ""))) {
        const area = adapted.targeting.area;
        if (!heightened || heightened[2] !== area.type || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== Number(heightened[1])
            || adapted.heightening.damage?.[components[0].id] !== heightened[4]) return null;
        const sourceText = htmlToPlainText(heightened[0]).trim();
        if (!Number(adapted.heightening.area)) reminders.push({ kind: "heightened-area", sourceText,
            text: `The ${area.type} is ${area.value} feet, ${heightened[3]} feet larger for every ${heightened[1]} ranks above ${adapted.rank}: place the area at the cast rank's size.` });
        claimed.push(sourceText);
    }
    return {
        remainder: [`You deal ${damage[1]} ${damage[2]} damage to each creature in the area (basic ${statistic} save).`],
        forcedMovement: { failure: move, criticalFailure: move },
        reminders,
        sentences: claimed
    };
}

// A knockback on a failed basic save, with objects too (Hydraulic Torrent):
//   "The torrent deals 8d6 bludgeoning damage." / "Each creature in the area must attempt a basic Fortitude save; unattended objects automatically
//   fail." / "Creatures and objects that fail are also knocked back 5 feet (10 feet on a critical failure)."
// The damage is the item's; the creatures' push is the GM's (away from the caster: the line starts at the caster); the objects are the GM's.
const AREA_DEALS = /^The [a-z ]+ deals (\d+d\d+) ([a-z]+) damage\.$/;
const SAVE_OBJECTS = /^Each creature in the area must attempt a basic (Fortitude|Reflex|Will) save; unattended objects automatically fail\.$/;
const KNOCKBACK = /^Creatures and objects that fail are also knocked back (\d+) feet \((\d+) feet on a critical failure\)\.$/;
// A push from the caster on a failed basic save, with objects and a fall (Arcane Explosion, once its caster's form is set apart):
//   "All creatures and objects in the emanation take 16d6 force damage (basic Fortitude saving throw)." / "Creatures that fail are also pushed 10 feet
//   directly away from you; creatures that can't complete this forced movement are knocked Prone (but creatures who reduce this movement, such as with
//   an ability or feat, don't fall prone)."
const ALL_TAKE = /^All creatures and objects in the (?:emanation|area) take (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) saving throw\)\.$/;
const PUSH_PRONE = /^Creatures that fail are also pushed (\d+) feet directly away from you; creatures that can't complete this forced movement are knocked @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Prone\} \(but creatures who reduce this movement, such as with an ability or feat, don't fall prone\)\.$/;
function explosionPush(adapted, all) {
    const at = all.findIndex(sentence => ALL_TAKE.test(sentence));
    if (at < 0 || all.length !== at + 2 || !PUSH_PRONE.test(all[at + 1])) return null;
    const damage = ALL_TAKE.exec(all[at]), push = PUSH_PRONE.exec(all[at + 1]);
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== damage[1] || String(components[0].type).toLowerCase() !== damage[2]
        || damage[3].toLowerCase() !== adapted.defense.statistic) return null;
    const narration = all.slice(0, at);
    if (narration.length > 1 || narration.some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|condition|immune|can't|must|until|takes?|deals?)\b/i.test(sentence))) return null;
    // (A creature stopped short by a wall or the scene's edge is knocked Prone by the module; a reduction from an ability is the GM's.)
    const move = { kind: "push", distance: Number(push[1]), upTo: false, optional: false, direction: "away", stopped: { prone: true } };
    return {
        remainder: [`You deal ${damage[1]} ${damage[2]} damage to each creature in the area (basic ${damage[3]} save).`],
        forcedMovement: { failure: move, criticalFailure: move },
        objects: { sourceText: all[at + 1], text: `Objects in the area take the damage too (the GM's). The module knocks Prone a creature a wall stops short of the ${push[1]}-foot push; a creature whose ability or feat reduced the movement stays standing (the GM removes it).` },
        sentences: [...narration, ...all.slice(at)]
    };
}

export function compileBasicKnockbackRider(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || !["line", "cone", "emanation"].includes(area?.type)) return null;
    const all = sentences(htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).replace(/\s+/g, " ").trim());
    const explosion = explosionPush(adapted, all);
    if (explosion) return explosion;
    const at = all.findIndex(sentence => AREA_DEALS.test(sentence));
    if (at < 0 || all.length !== at + 3 || !SAVE_OBJECTS.test(all[at + 1]) || !KNOCKBACK.test(all[at + 2])) return null;
    const damage = AREA_DEALS.exec(all[at]), save = SAVE_OBJECTS.exec(all[at + 1]), back = KNOCKBACK.exec(all[at + 2]);
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== damage[1] || String(components[0].type).toLowerCase() !== damage[2]
        || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    // (One narration sentence; "possibly pushing them away from you" restates the knockback.)
    const narration = all.slice(0, at);
    if (narration.length > 1 || narration.some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|condition|immune|can't|must|until|takes?|deals?)\b/i.test(sentence))) return null;
    const move = distance => ({ kind: "push", distance: Number(distance), upTo: false, optional: false, direction: "away" });
    return {
        remainder: [`You deal ${damage[1]} ${damage[2]} damage to each creature in the area (basic ${save[1]} save).`],
        forcedMovement: { failure: move(back[1]), criticalFailure: move(back[2]) },
        objects: { sourceText: all[at + 2], text: `Unattended objects in the area automatically fail: they take the damage and are knocked back ${back[1]} feet (the GM's).` },
        sentences: [...narration, ...all.slice(at)]
    };
}

// A basic save whose failures lead to a second save with its own table (Firework Blast):
//   "The explosions deal 4d6 fire damage." / "Creatures that fail their saves must attempt an additional @Check[fortitude] save." / "Creatures
//   that critically fail their saves take a -2 circumstance penalty to this Fortitude save." with the second save's rows "Success The creature is
//   unaffected." / "Failure The creature is Blinded and Deafened for 1 round." / "Critical Failure The creature is blinded for 1 round and Dazzled and
//   deafened for 1 minute."
// The primary rows are the basic damage; the failure and critical failure rows carry the second save (−2 on the critical failure's).
const CONDITION_UUIDS = { blinded: "XgEqL1kFApUbl5Z2", deafened: "9PR9y0bi4JPKnHPR", dazzled: "TkIyaNPgTZFBCCuh" };
const ADDITIONAL = /^Creatures that fail their saves must attempt an additional @Check\[(fortitude|reflex|will)\] save\.$/;
const WORSE = /^Creatures that critically fail their saves take a [-–−](\d) (circumstance|status) penalty to this (Fortitude|Reflex|Will) save\.$/;
export function compileBasicSecondaryTable(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || !adapted.targeting?.area) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\s*\/?>/i);
    const table = /<p>\s*<strong>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i.test(body) ? body : null;
    if (!table) return null;
    const lead = htmlToPlainText(body.split(/<p>\s*<strong>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0]).replace(/\s+/g, " ").trim();
    const all = sentences(lead);
    const at = all.findIndex(sentence => /^The [a-z ]+ deals? (\d+d\d+) ([a-z]+) damage\.$/.test(sentence));
    if (at < 0 || all.length !== at + 3 || at > 1) return null;
    if (at === 1 && /\d|@|\b(?:damage|save|bonus|penalty|condition|immune|can't|must|until|takes?|deals?)\b/i.test(all[0])) return null;
    const damage = /^The [a-z ]+ deals? (\d+d\d+) ([a-z]+) damage\.$/.exec(all[at]), additional = ADDITIONAL.exec(all[at + 1]), worse = WORSE.exec(all[at + 2]);
    const components = adapted.damageComponents ?? [];
    if (!additional || !worse || worse[3].toLowerCase() !== additional[1] || components.length !== 1 || components[0].category
        || String(components[0].formula).replace(/\s+/g, "") !== damage[1] || String(components[0].type).toLowerCase() !== damage[2]) return null;
    const row = heading => htmlToPlainText(new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`, "i").exec(body)?.[1] ?? "").replace(/\s+/g, " ").trim();
    const rows = { criticalSuccess: row("Critical Success"), success: row("Success"), failure: row("Failure"), criticalFailure: row("Critical Failure") };
    if (rows.criticalSuccess || !/^The creature is unaffected\.$/.test(rows.success)) return null;
    // "The creature is Blinded and Deafened for 1 round." / "The creature is blinded for 1 round and Dazzled and deafened for 1 minute."
    const timed = text => {
        const body = /^The creature is (.+)\.$/.exec(text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1"))?.[1];
        if (!body) return null;
        const out = [];
        let covered = 0;
        for (const match of body.matchAll(/(?:^| and )((?:[A-Za-z]+)(?: and [A-Za-z]+)*) for (\d+) (round|minute)s?/g)) {
            if (match.index !== covered) return null;
            covered = match.index + match[0].length;
            for (const name of match[1].split(/ and /).map(word => word.toLowerCase())) {
                if (!CONDITION_UUIDS[name]) return null;
                out.push({ slug: name, value: Number(match[2]), unit: `${match[3]}s`, sourceText: `for ${match[2]} ${match[3]}` });
            }
        }
        return out.length && covered === body.length ? out : null;
    };
    const failure = timed(rows.failure), critical = timed(rows.criticalFailure);
    if (!failure || !critical) return null;
    return {
        remainder: [`You deal ${damage[1]} ${damage[2]} damage to each creature in the area (basic ${adapted.defense.statistic[0].toUpperCase()}${adapted.defense.statistic.slice(1)} save).`],
        secondary: { statistic: additional[1], penalty: { value: -Number(worse[1]), type: worse[2] }, rows, failure, critical, sentences: all.slice(at + 1) },
        sentences: [...all.slice(0, at + 3)],
        uuids: CONDITION_UUIDS
    };
}


// A basic save whose critical failure leads to a second save (Phantasmal Calamity): "The vision deals 11d6 mental damage (basic Will save)." / "On a
// critical failure, the creature must also succeed at a @Check[reflex] save or believe it's trapped (stuck in a fissure, …)." / "If it fails the second
// save, it's also {Stunned} for 1 minute." / "It can attempt a new Will save at the end of each of its turns, and on a success, it disbelieves the illusion
// and recovers from the stunned condition." — the critical failure row carries the second save; its failures give the condition for that long, ended by a
// success at the turn-end save, and the belief as a note.
const CRIT_DAMAGE = /^The [a-z ]+ deals (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\)\.$/;
const CRIT_SECOND = /^On a critical failure, the creature must also succeed at an? @Check\[(fortitude|reflex|will)\] save or (believe [^.()]+?)(?: \(([^)]*)\))?\.$/;
const CRIT_CONDITION = /^If it fails the second save, it's also @UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)\]\{([A-Z][a-z]+)\} for (\d+) (round|minute)s?\.$/;
const CRIT_RECUR = /^It can attempt a new (Fortitude|Reflex|Will) save at the end of each of its turns, and on a success, it disbelieves the illusion and recovers from the ([a-z]+) condition\.$/;
export function compileBasicCriticalSecond(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true) return null;
    const [body] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (/<strong>/i.test(body)) return null;
    // (Kept with its links: the condition's uuid.)
    const all = sentences(body.replace(/<\/?p>/g, " ").replace(/<\/?em>/g, ""));
    const at = all.findIndex(sentence => CRIT_DAMAGE.test(sentence));
    if (at < 0 || at > 1 || all.length !== at + 4) return null;
    if (at === 1 && /\d|@|\b(?:damage|save|bonus|penalty|condition|immune|can't|must|until|takes?|deals?)\b/i.test(all[0])) return null;
    const damage = CRIT_DAMAGE.exec(all[at]), second = CRIT_SECOND.exec(all[at + 1]), condition = CRIT_CONDITION.exec(all[at + 2]), recur = CRIT_RECUR.exec(all[at + 3]);
    const components = adapted.damageComponents ?? [];
    if (!damage || !second || !condition || !recur || damage[3].toLowerCase() !== adapted.defense.statistic || recur[2] !== condition[2].toLowerCase()
        || components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== damage[1] || String(components[0].type).toLowerCase() !== damage[2]) return null;
    const plain = all.slice(at).map(sentence => htmlToPlainText(sentence).replace(/\s+/g, " ").trim());
    return {
        remainder: [`You deal ${damage[1]} ${damage[2]} damage to each creature in the area (basic ${damage[3]} save).`],
        statistic: second[1],
        condition: { uuid: condition[1], slug: condition[2].toLowerCase(), name: condition[2], value: Number(condition[3]), unit: `${condition[4]}s`, sourceText: `for ${condition[3]} ${condition[4]}` },
        recurring: { statistic: recur[1].toLowerCase(), sourceText: plain[3] },
        note: `The creature ${second[2].replace(/^believe/, "believes")}${second[3] ? ` (${second[3]})` : ""}, until it disbelieves the illusion.`,
        sentences: [...(at ? [htmlToPlainText(all[0]).replace(/\s+/g, " ").trim()] : []), ...plain]
    };
}

// What a failing creature can't do for a while, stated after a basic save's damage (Powerful Inhalation): "A creature that fails its save
// can't speak above a raspy whisper for 1 round." / "A creature that critically fails can't speak or use abilities that require it to breathe
// for 1 round." / "This prevents it from using effects that require speech, …" A note on the creature for that long (a failure's note on a
// critical failure too); an explaining "This prevents it from …" joins the note before it.
const ROW_NOTE = /^A creature that (fails|critically fails)(?: its save| its saving throw)? (can't [^.]+?) for (\d+|one) (round|minute)s?\.$/;
const EXPLAIN = /^This prevents it from [^.]+\.$/;

/** {byDegree: {failure, criticalFailure}, sentences} or null. */
export function compileBasicRowNotes(adapted) {
    const all = sentences(htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)));
    const byDegree = { failure: [], criticalFailure: [] }, claimed = [];
    for (const [index, sentence] of all.entries()) {
        const row = ROW_NOTE.exec(sentence);
        if (!row) continue;
        const explain = EXPLAIN.test(all[index + 1] ?? "") ? all[index + 1] : null;
        const value = row[3] === "one" ? 1 : Number(row[3]), unit = `${row[4]}s`;
        const text = [`The creature ${row[2]}.`, explain].filter(Boolean).join(" ");
        const note = { label: row[1] === "fails" ? "Failed save" : "Critical failure", text, sourceText: sentence, sourceTexts: [sentence, ...(explain ? [explain] : [])],
            duration: { mode: "fixed", value, unit, expiry: unit === "rounds" ? "turn-start" : null, anchor: "effect-start", offset: 0, sourceText: `for ${row[3]} ${row[4]}` } };
        for (const degree of row[1] === "fails" ? ["failure", "criticalFailure"] : ["criticalFailure"]) byDegree[degree].push(note);
        claimed.push(sentence, ...(explain ? [explain] : []));
    }
    return claimed.length ? { byDegree, sentences: claimed } : null;
}
