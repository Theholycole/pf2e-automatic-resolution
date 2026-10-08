// Spellshape feats and the wands that change their spell (docs/planning/spellshape-wand-plan.md), read from their text into:
//   - the requirements the cast spell must meet ("If the next action you use is to Cast a Spell that deals damage in an area, …"), checked against
//     the spell as PF2e shaped it;
//   - riders the module applies after the spell's own outcome, on the creatures the text names:
//       conditions by degree ("any target who fails their saving throw is also Frightened 1 (or Frightened 2 on a critical failure)"),
//       persistent damage on a failed save ("Each creature that fails its save takes 1d6 persistent fire damage."),
//       extra damage scaled with the spell's ("the spell deals an additional 1d8 sonic damage"),
//       pushes by degree ("Each creature that failed its save against the spell is pushed 5 feet, …").
// A feat or wand with any sentence these forms don't read is left unread (null): rules from the text, never from names.
import { htmlToPlainText } from "./description-parser.js";
import { readPlusSpellshape } from "./plus-spellshapes.js";

const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
const split = text => text.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
const COND = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Za-z-]+)(?: (\d+))?\}`;
const condition = (match, at, rounds = null) => ({ uuid: match[at], slug: match[at + 1].toLowerCase(), value: match[at + 2] ? Number(match[at + 2]) : null, ...(rounds ? { rounds } : {}) });
const duration = (count, unit) => Number(count) * (/minute/.test(unit) ? 10 : 1);

const LEGACY_SCHOOLS = ["abjuration", "conjuration", "divination", "enchantment", "evocation", "necromancy", "transmutation"];

/** The spell's requirements from "… Cast a Spell that …" (null when a clause isn't one the module checks). */
export function readRequirements(text) {
    const requires = {};
    let rest = text.trim();
    const nonCantrip = /^(?:a |an )?non-cantrip /i.exec(rest);
    if (nonCantrip) { requires.nonCantrip = true; rest = rest.slice(nonCantrip[0].length); }
    // ("cast Harm or Heal to damage one creature": the named spells, and what they're cast to do.)
    const named = /^(?:the )?@UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\}(?: composition cantrip)?(?: or @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\})?(?: (to damage one creature|to restore Hit Points to a single (?:creature|ally)|targeting a single living creature|on a single target|targeting one undead creature)(?: and the target regains Hit Points from the spell)?)?$/.exec(rest);
    if (named) {
        requires.spells = [named[2], named[4]].filter(Boolean);
        if (named[5] === "to damage one creature") { requires.damaging = true; requires.singleTarget = true; }
        if (/^to restore Hit Points to a single (?:creature|ally)$|^on a single target$|^targeting a single living creature$/.test(named[5] ?? "")) requires.singleTarget = true;
        if (named[5] === "targeting one undead creature") { requires.singleTarget = true; requires.targetTraits = ["undead"]; }
        return requires;
    }
    // (Sinbladed Spell: "a non-cantrip sin or curriculum spell that affects a single target, and you either succeed on your attack roll or the target fails
    // its saving throw against the spell": either trait, one target; the hit or failed save is the rider's.)
    const sinbladed = /^([a-z]+) or ([a-z]+) spell that affects a single target, and you either succeed on your attack roll or the target fails its saving throw against the spell$/.exec(rest);
    // (The user, 2026-10-05: the Runelord's sin spells aren't marked in PF2e; every spell cast with Sinbladed Spell is taken as valid — the table's.)
    if (sinbladed) return { table: [`a non-cantrip ${sinbladed[1]} or ${sinbladed[2]} spell that affects a single target`] };
    // ("cast untamed form": the spell by its name, unlinked.)
    if (/^untamed form$/i.test(rest)) return { spells: ["Untamed Form"] };
    // ("a witch cantrip or witch spell that deals damage": the class's spells, the table's.)
    const classSpell = /^(?:a |an )?([a-z]+) cantrip or (?:a |an )?\1 spell(?= that |$)/.exec(rest);
    if (classSpell) { requires.table = [...(requires.table ?? []), `a ${classSpell[1]} cantrip or spell`]; rest = `Spell${rest.slice(classSpell[0].length)}`; }
    // ("a non-cantrip morph or polymorph spell"; "a 3-action summon or incarnate Spell": either trait.)
    const either = /^(?:an? )?(?:(\d)-action )?([a-z]+) or ([a-z]+) [Ss]pell$/.exec(rest);
    if (either) { requires.anyTraits = [either[2], either[3]]; if (either[1]) requires.actions = [Number(either[1])]; return requires; }
    // ("a grave spell that deals damage": a trait the spell must have.)
    const traitSpell = /^(?:a |an )?([a-z]+) spell(?= that | with |$)/.exec(rest);
    if (traitSpell && traitSpell[1] !== "non-cantrip") { requires.traits = [traitSpell[1]]; rest = `Spell${rest.slice(traitSpell[0].length)}`; }
    // (A legacy school — "a necromancy spell" — isn't a PF2e trait any more: the table's.)
    if (requires.traits && LEGACY_SCHOOLS.includes(requires.traits[0])) { requires.table = [...(requires.table ?? []), `a ${requires.traits[0]} spell`]; delete requires.traits; }
    const lead = /^(?:a |an )?Spell(?: that)? ?/i.exec(rest);
    if (!lead) return null;
    rest = rest.slice(lead[0].length).replace(/\s*\(such as [^)]*\)/g, "");
    // ("a Spell of 5th rank or lower that has no duration")
    const capped = /^of (\d+)(?:st|nd|rd|th) rank or lower(?: that)? ?/.exec(rest);
    if (capped) { requires.maxRank = Number(capped[1]); rest = rest.slice(capped[0].length); }
    if (!rest) return requires;
    // ("deals at least one type of energy damage (acid, cold, electricity, fire, force, sonic, vitality, or void)"; "has at least one element trait
    // (air, earth, fire, metal, water, or wood)": the list whole.)
    const listOf = text => text.split(/,\s*(?:or\s+)?|\s+or\s+/).map(entry => entry.trim()).filter(Boolean);
    let whole;
    if ((whole = /^deals at least one type of energy damage \(([a-z, ]+)\)$/.exec(rest))) { requires.damaging = true; requires.damageTypesAny = listOf(whole[1]); return requires; }
    if ((whole = /^has at least one element trait \(([a-z, ]+)\)$/.exec(rest))) { requires.anyTraits = listOf(whole[1]); return requires; }
    // (Semicolons separate the clauses when a clause lists with commas: "has an area of a burst, cone, emanation, or line; has no duration; …".)
    // ("has an area of a burst, cone, or line and does not have a duration": the list kept as one clause.)
    rest = rest.replace(/(has an area of an? )((?:[a-z]+, )+[a-z]+,? or [a-z]+)/, (all, lead, list) => `${lead}${list.split(/,\s*(?:or\s+)?|\s+or\s+/).map(type => type.trim()).filter(Boolean).join("|")}`);
    // ("has the air, water, or cold trait": the list kept as one clause.)
    rest = rest.replace(/has the ((?:[a-z]+, )+)or ([a-z]+) trait/, (all, list, last) => `has the ${[...list.split(/,\s*/).filter(Boolean), last].join("|")} trait`);
    const listed = /^deals (?:[a-z]+, )+[a-z]+,? or [a-z]+ damage$/.test(rest);
    const clauses = (listed ? [rest] : rest.includes(";") ? rest.split(/;\s*(?:and\s+)?/) : rest.split(/,\s*(?:and\s+)?|\s+and\s+(?=(?:has|deals|requires|targets|doesn't|does not)\b)/))
        .flatMap(clause => clause.split(/\s+and\s+(?=(?:has|deals|requires|targets|doesn't|does not)\b)/)).map(clause => clause.trim()).filter(Boolean);
    for (const clause of clauses) {
        let m;
        if (/^deals damage in an area$/.test(clause)) { requires.damaging = true; requires.area = true; }
        else if (/^deals damage$/.test(clause)) requires.damaging = true;
        else if (/^deals energy damage$/.test(clause)) { requires.damaging = true; requires.damageTypesAny = ["acid", "cold", "electricity", "fire", "force", "sonic", "vitality", "void"]; }
        else if ((m = /^deals ([a-z]+) damage$/.exec(clause))) { requires.damaging = true; requires.damageType = m[1]; }
        else if ((m = /^deals ((?:[a-z]+, )+[a-z]+,? or [a-z]+) damage$/.exec(clause))) { requires.damaging = true; requires.damageTypesAny = m[1].split(/,\s*(?:or\s+)?|\s+or\s+/).map(type => type.trim()).filter(Boolean); }
        else if ((m = /^targets a single ([a-z]+)$/.exec(clause)) && m[1] !== "creature") { requires.singleTarget = true; requires.targetTraits = [m[1]]; }
        else if (/^deals damage to a single target and the spell successfully damages that target$/.test(clause)) { requires.damaging = true; requires.singleTarget = true; }
        else if (/^affects an area$/.test(clause)) requires.area = true;
        else if (/^has no duration$|^doesn't have a duration$/.test(clause)) requires.noDuration = true;
        else if (/^targets a single creature$/.test(clause)) requires.singleTarget = true;
        else if ((m = /^(?:deals damage (?:at|to) a single target)$/.exec(clause))) { requires.damaging = true; requires.singleTarget = true; }
        else if ((m = /^requires an? (Fortitude|Reflex|Will) saving throw$/.exec(clause))) requires.saves = [m[1].toLowerCase()];
        else if ((m = /^requires creatures to attempt an? (Fortitude|Reflex|Will)(?: or (Fortitude|Reflex|Will))? save$/.exec(clause))) requires.saves = [m[1], m[2]].filter(Boolean).map(save => save.toLowerCase());
        else if (/^requires creatures to attempt a saving throw$|^allows a saving throw$/.test(clause)) requires.saves = ["fortitude", "reflex", "will"];
        else if ((m = /^doesn't have the ([a-z]+) trait$/.exec(clause))) requires.notTraits = [...(requires.notTraits ?? []), m[1]];
        else if ((m = /^(?:doesn't|does not) have the ([a-z]+) or ([a-z]+) trait$/.exec(clause))) requires.notTraits = [...(requires.notTraits ?? []), m[1], m[2]];
        else if ((m = /^has the ([a-z]+) trait or deals \1 damage$/.exec(clause))) requires.traitOrDamage = m[1];
        else if ((m = /^has an area of an? ((?:[a-z]+, )*[a-z]+,? or [a-z]+)$/.exec(clause))) { requires.area = true; requires.areaTypes = m[1].split(/,\s*(?:or\s+)?|\s+or\s+/).map(type => type.trim()).filter(Boolean); }
        else if ((m = /^has an area of an? ([a-z]+(?:\|[a-z]+)+)$/.exec(clause))) { requires.area = true; requires.areaTypes = m[1].split("|"); }
        else if (/^does not have a duration$/.test(clause)) requires.noDuration = true;
        // ("with the air or water trait"; "with an area"; "from your spell slots"; "that destroys a thrall" — the last the table's.)
        else if ((m = /^with the ([a-z]+) or ([a-z]+) trait$/.exec(clause))) requires.anyTraits = [m[1], m[2]];
        else if ((m = /^with the ([a-z]+) trait$/.exec(clause))) requires.anyTraits = [m[1]];
        else if ((m = /^with the ([a-z]+) trait on a living creature$/.exec(clause))) requires.anyTraits = [m[1]];
        else if (/^with an area$/.test(clause)) requires.area = true;
        else if ((m = /^(?:that )?takes (\d) or (\d) actions to cast$|^using (\d) actions? or (\d) actions$/.exec(clause))) requires.actions = [Number(m[1] ?? m[3]), Number(m[2] ?? m[4])];
        else if ((m = /^with an area and the ([a-z]+) trait$/.exec(clause))) { requires.area = true; requires.anyTraits = [m[1]]; }
        else if ((m = /^has the ([a-z]+(?:\|[a-z]+)+) trait$/.exec(clause))) requires.anyTraits = m[1].split("|");
        else if ((m = /^that does not have the ([a-z]+) trait$/.exec(clause))) requires.notTraits = [...(requires.notTraits ?? []), m[1]];
        else if ((m = /^of at least (\d+)(?:st|nd|rd|th) rank from your spell slots that affects an area$/.exec(clause))) { requires.minRank = Number(m[1]); requires.fromSlots = true; requires.area = true; }
        else if (/^requires a spell attack roll$/.test(clause)) requires.attack = true;
        else if (/^targeting a single creature$/.test(clause)) requires.singleTarget = true;
        else if (/^deals energy damage$/.test(clause)) { requires.damaging = true; requires.damageTypesAny = ["acid", "cold", "electricity", "fire", "force", "sonic", "vitality", "void"]; }
        else if (/^affects one or more of your allies$/.test(clause)) requires.table = [...(requires.table ?? []), "it affects one or more of your allies"];
        else if (/^targets you$/.test(clause)) requires.table = [...(requires.table ?? []), "it targets you"];
        else if (/^summons a creature$/.test(clause)) requires.anyTraits = ["summon"];
        else if ((m = /^has the ([a-z]+) trait$/.exec(clause))) requires.anyTraits = [m[1]];
        else if (/^targets one creature$/.test(clause)) requires.singleTarget = true;
        else if (/^allows a saving throw$/.test(clause)) requires.saves = ["fortitude", "reflex", "will"];
        else if (/^without a duration that requires an attack roll against a single target$/.test(clause)) { requires.noDuration = true; requires.attack = true; requires.singleTarget = true; }
        else if (/^to cast a harmful hex with a single target$/.test(clause)) { requires.anyTraits = ["hex"]; requires.singleTarget = true; }
        else if (/^from your spell slots that damages other creatures$/.test(clause)) { requires.fromSlots = true; requires.damaging = true; }
        else if (/^(?:that spell )?targets only a single ally$/.test(clause)) requires.singleTarget = true;
        // ("a polymorph spell that targets only one creature": the caster alone counts — a polymorph with no target.)
        else if (/^targets only one creature$/.test(clause)) requires.onlyOne = true;
        else if ((m = /^has the ([a-z]+) trait and no duration$/.exec(clause))) { requires.anyTraits = [m[1]]; requires.noDuration = true; }
        else if ((m = /^deals ((?:[a-z]+, )+)?([a-z]+),? or ([a-z]+) damage$/.exec(clause))) { requires.damaging = true; requires.damageTypesAny = [...(m[1] ? m[1].split(/,\s*/).filter(Boolean) : []), m[2], m[3]]; }
        else if ((m = /^deals damage and (?:doesn't|does not) have the ([a-z]+) or ([a-z]+) trait$/.exec(clause))) { requires.damaging = true; requires.notTraits = [m[1], m[2]]; }
        else if (/^from (?:your spell slots|a spell slot)$/.test(clause)) requires.fromSlots = true;
        else if (/^destroys a thrall$/.test(clause)) requires.table = [...(requires.table ?? []), "it destroys a thrall"];
        // ("a Spell that has a range"; "with 1 or more targets and a range farther than touch"; "with an emanation area".)
        else if (/^has (?:a )?range$/.test(clause)) requires.ranged = true;
        else if (/^has a range and targets one creature$/.test(clause)) { requires.ranged = true; requires.singleTarget = true; }
        else if (/^with 1 or more targets and a range farther than touch$/.test(clause)) { requires.targeted = true; requires.beyondTouch = true; }
        else if ((m = /^with an? ([a-z]+) area$/.exec(clause))) { requires.area = true; requires.areaTypes = [m[1]]; }
        // ("and your charge is within 30 feet": the table's.)
        else if ((m = /^and your charge is within \d+ feet$/.exec(clause))) requires.table = [...(requires.table ?? []), clause.replace(/^and /, "")];
        else return null;
    }
    return requires;
}

// The rider sentences (the text after the lead's comma, and each sentence after it).
const RIDERS = [
    // "any target who fails their saving throw is also Frightened 1 (or Frightened 2 on a critical failure)."
    [new RegExp(String.raw`^any target who fails their saving throw is also ${COND} \(or ${COND} on a critical failure\)\.$`),
        m => ({ type: "conditions", degrees: { failure: [condition(m, 1)], criticalFailure: [condition(m, 4)] } })],
    // "the target is Stupefied 2 for 1 round if it fails its saving throw (or Stupefied 3 on a critical failure)."
    [new RegExp(String.raw`^the target is ${COND} for (\d+) (rounds?|minutes?) if it fails its saving throw \(or ${COND} on a critical failure\)\.$`),
        m => ({ type: "conditions", degrees: { failure: [condition(m, 1, duration(m[4], m[5]))], criticalFailure: [condition(m, 6, duration(m[4], m[5]))] } })],
    // "Each creature that failed its Reflex save against the spell is Dazzled for 1 round, and those who critically failed are instead Blinded for 1
    // round." / "… are also knocked Prone."
    // (A named save — "failed its Reflex save" — limits the rider to that save.)
    [new RegExp(String.raw`^Each creature that failed its (?:([A-Z][a-z]+) )?save against the spell is ${COND} for (\d+) (rounds?|minutes?), and those who critically failed are instead ${COND} for (\d+) (rounds?|minutes?)\.$`),
        m => ({ type: "conditions", ...(m[1] ? { onlySave: m[1].toLowerCase() } : {}), degrees: { failure: [condition(m, 2, duration(m[5], m[6]))], criticalFailure: [condition(m, 7, duration(m[10], m[11]))] } })],
    [new RegExp(String.raw`^Each creature that failed its (?:([A-Z][a-z]+) )?save against the spell is ${COND} for (\d+) (rounds?|minutes?), and those who critically failed are also knocked ${COND}\.$`),
        m => ({ type: "conditions", ...(m[1] ? { onlySave: m[1].toLowerCase() } : {}), degrees: { failure: [condition(m, 2, duration(m[5], m[6]))], criticalFailure: [condition(m, 2, duration(m[5], m[6])), condition(m, 7)] } })],
    // "the spell deals an additional 1d8 sonic damage and all creatures who fail their save against the spell are Deafened for 1 round." with "Targets
    // who critically fail their saves against this spell are instead deafened for 1 minute."
    [new RegExp(String.raw`^the spell deals an additional @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage and all creatures who fail their save against the spell are ${COND} for (\d+) (rounds?|minutes?)\.$`),
        m => [{ type: "extra-damage", formula: m[1], damageType: m[2], scaled: true }, { type: "conditions", degrees: { failure: [condition(m, 3, duration(m[6], m[7]))], criticalFailure: [condition(m, 3, duration(m[6], m[7]))] } }]],
    [/^Targets who critically fail their saves against this spell are instead ([a-z]+) for (\d+) (rounds?|minutes?)\.$/,
        (m, riders) => { const rider = riders.find(entry => entry.type === "conditions"); const slot = rider?.degrees.criticalFailure.find(entry => entry.slug === m[1]);
            if (!slot) return null; slot.rounds = duration(m[2], m[3]); return []; }],
    // "Each creature that failed its save against the spell is pushed 5 feet, and those who critically failed are pushed 10 feet." with the directions.
    [/^Each creature that failed its save against the spell is pushed (\d+) feet, and those who critically failed are pushed (\d+) feet\.$/,
        m => ({ type: "push", degrees: { failure: Number(m[1]), criticalFailure: Number(m[2]) }, from: {} })],
    [/^If the spell is an? ((?:[a-z]+, )*[a-z]+,? or an? [a-z]+), you push the creature away from yourself\.$/,
        (m, riders) => { const push = riders.find(entry => entry.type === "push"); if (!push) return null; for (const type of m[1].replace(/\ban? /g, "").split(/,\s*(?:or\s+)?|\s+or\s+/)) push.from[type.trim()] = "caster"; return []; }],
    [/^If the spell is an? ([a-z]+), you push the creature away from the center of the \1\.$/,
        (m, riders) => { const push = riders.find(entry => entry.type === "push"); if (!push) return null; push.from[m[1]] = "center"; return []; }],
    // "the target is knocked Prone if it takes any damage from the spell." / "A creature that takes initial acid damage from this spell become Sickened 1."
    [new RegExp(String.raw`^the target is knocked ${COND} if it takes any damage from the spell\.$`),
        m => ({ type: "conditions", when: "damaged", list: [condition(m, 1)] })],
    [new RegExp(String.raw`^A creature that takes initial [a-z]+ damage from this spell become ${COND}\.$`),
        m => ({ type: "conditions", when: "damaged", list: [condition(m, 1)] })],
    // "… causing any creature damaged by this spell to become Stupefied 2 for a number of rounds equal to the spell rank." with "On a critical success on
    // the attack roll, the target also weeps, becoming Slowed 1 for the same duration."
    [new RegExp(String.raw`^[^.]*\bany creature damaged by this spell to become ${COND} for a number of rounds equal to the spell rank\.$`),
        m => ({ type: "conditions", when: "damaged", list: [{ ...condition(m, 1), rounds: "rank" }] })],
    [new RegExp(String.raw`^On a critical success on the attack roll, the target also (?:[a-z]+, )?becoming ${COND} for the same duration\.$`),
        (m, riders) => { const before = riders.findLast(entry => entry.type === "conditions" && entry.when === "damaged"); if (!before) return null;
            return { type: "conditions", degrees: { criticalSuccess: [{ ...condition(m, 1), rounds: before.list[0].rounds }] } }; }],
    // "creatures that fail their save are Off-Guard for 1 round" (a wand's "…, but …").
    [new RegExp(String.raw`^creatures that fail their save are ${COND} for (\d+) (rounds?|minutes?)\.?$`),
        m => ({ type: "conditions", degrees: { failure: [condition(m, 1, duration(m[4], m[5]))], criticalFailure: [condition(m, 1, duration(m[4], m[5]))] } })],
    // "the spell's area is twice as wide (two adjacent and parallel 120-foot lines)": the line's width doubled.
    [/^the spell's area is twice as wide \(two adjacent and parallel @Template\[line\|distance:(\d+)\|width:(\d+)\]\{[^}]+\}\)\.?$/,
        m => ({ type: "area", lineWidth: Number(m[2]) })],
    // PF2e's Effect the text links, for the creatures the sentence before names: "If the target critically fails its save against the spell, it also
    // takes a –10-foot status penalty to its Speed for 1 minute." / "unless the target is unaffected by the spell, the target takes a –15-foot status
    // penalty to its Speeds for 1 round (…)."
    [/^If the target critically fails its save against the spell, it also takes a [–-]\d+-foot status penalty to its Speeds? for \d+ (?:rounds?|minutes?)\.$/,
        () => ({ type: "effect", degrees: ["criticalFailure"], uuid: null })],
    [/^unless the target is unaffected by the spell, the target takes a [–-]\d+-foot status penalty to its Speeds for \d+ rounds? \(this penalty is doubled for climb, fly, and swim Speeds\)\.$/,
        () => ({ type: "effect", when: "affected", uuid: null })],
    [/^@UUID\[(Compendium\.pf2e\.(?:feat|equipment)-effects\.Item\.[A-Za-z0-9]+)\]\{(Effect: [^}]+)\}$/,
        (m, riders) => { const open = riders.findLast(entry => (entry.type === "effect" || entry.type === "self-effect" || entry.type === "healed-effect" || entry.type === "allies-effect" || entry.type === "coven" || (entry.type === "choose-one" && !entry.generated)) && !entry.uuid);
            if (!open) return { type: "gm-effect", uuid: m[1], name: m[2] }; open.uuid = m[1]; open.name = m[2]; return []; }],
    // "creatures you hit or that fail their saves are Fascinated with you until the start of your next turn."
    [new RegExp(String.raw`^In addition, if the spell includes a spell attack or requires a saving throw, creatures you hit or that fail their saves are ${COND} with you until the start of your next turn\.$`),
        m => ({ type: "conditions", when: "hit-or-failed", list: [{ ...condition(m, 1), until: "caster-turn-start" }] })],
    // "you can reduce the target's frightened condition by 1."
    [/^you can reduce the target's ([a-z]+) condition by (\d+)\.$/, m => ({ type: "reduce", slug: m[1], by: Number(m[2]) })],
    // "that spell brands the target with a mark only you can see if it fails its saving throw." with its week and what the caster knows.
    [/^that spell brands the target with a mark only you can see if it fails its saving throw\.$/, () => ({ type: "mark", degrees: ["failure", "criticalFailure"], label: "branded", days: null, text: [] })],
    [/^This brand lasts for (\d+) weeks?\.$/, (m, riders) => { const mark = riders.findLast(entry => entry.type === "mark"); if (!mark) return null; mark.days = Number(m[1]) * 7; return []; }],
    [/^(?:For as long as the target is branded, you always know|You also know the direction the branded target|You can have only one brand active at a time)[^.]*\.$/,
        (m, riders) => { const mark = riders.findLast(entry => entry.type === "mark"); if (!mark) return null; mark.text.push(m[0]); return []; }],
    // What stays the GM's: the reactions against the cast (Portentous Spell), an animal's counteract (Tender Ministrations), a sickness's DC.
    [/^[^.]*any creature that attempts to use a reaction triggered by your Cast a Spell activity takes a [–-]\d+ circumstance penalty[^.]*\.$/, m => ({ type: "note", text: m[0] })],
    [/^If the target is an animal, you can also attempt to counteract an effect imposing the .+ condition\.$/, m => ({ type: "note", text: m[0] })],
    [/^Use your spell DC if the creature attempts to recover from this sickness\.$/, m => ({ type: "note", text: m[0] })],
    // "the spell deals additional Persistent Fire Damage equal to the spell rank, in addition to its other effects." with "This has no effect if the spell
    // already deals persistent fire damage."
    [/^the spell deals additional @UUID\[[^\]]+\]\{Persistent ([A-Z][a-z]+) Damage\} equal to the spell rank, in addition to its other effects\.$/,
        m => ({ type: "persistent", when: "damaged", formula: "rank", damageType: m[1].toLowerCase() })],
    [/^This has no effect if the spell already deals persistent ([a-z]+) damage\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "persistent" && entry.damageType === m[1]); if (!rider) return null; rider.unlessPersistent = true; return []; }],
    // "creatures damaged by the spell take additional void damage equal to the rank of the spell." with the Focus Point back on a kill.
    [/^creatures damaged by the spell take additional ([a-z]+) damage equal to the rank of the spell\.$/, m => ({ type: "flat-damage", when: "damaged", formula: "rank", damageType: m[1] })],
    [/^If this [a-z]+ damage or the spell reduces one or more creatures to 0 Hit Points, you regain 1 Focus Point\.$/, () => ({ type: "focus-regain", cooldownMinutes: null })],
    [/^You can regain a Focus Point this way only once per (\d+) minutes\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "focus-regain"); if (!rider) return null; rider.cooldownMinutes = Number(m[1]); return []; }],
    // "you can expend a Focus Point, channeling …" with "If you do, the spell you cast deals additional spirit or vitality damage (your choice) equal to the
    // rank of your focus spells." (doubled and halved as the spell's own damage is).
    [/^you can expend a Focus Point, channeling the power of your focus spells into the primary spell\.$/, () => ({ type: "focus-spend" })],
    [/^If you do, the spell you cast deals additional ([a-z]+) or ([a-z]+) damage \(your choice\) equal to the rank of your focus spells\.$/,
        m => ({ type: "extra-damage", formula: "focus-rank", damageTypeChoice: [m[1], m[2]], scaled: true, needsFocus: true })],
    [/^As normal for additional damage, this additional damage is doubled if [^.]+\.$/, () => []],
    // "the spell explodes, dealing splash damage equal to the rank of the spell cast to adjacent creatures." (not the target; the spell's type).
    [/^the spell explodes, dealing splash damage equal to the rank of the spell cast to adjacent creatures\.$/, () => ({ type: "splash", when: "damaged", formula: "rank" })],
    [/^Unlike normally, this splash damage doesn't apply to the target\.$|^The splash damage dealt is of the same type the spell deals\.$/,
        (m, riders) => riders.some(entry => entry.type === "splash") ? [] : null],
    // "one creature of your choice that takes damage from the spell is marked for rebuke until the end of your next turn." with "A creature marked this
    // way gains weakness 10 to all damage and becomes immune to Marked for Rebuke for 24 hours."
    [/^one creature of your choice that takes damage from the spell is marked for rebuke until the end of your next turn\.$/,
        () => ({ type: "choose-one", from: "damaged", generated: { name: "marked for rebuke", rules: [] }, until: "caster-next-turn-end" })],
    [/^A creature marked this way gains weakness (\d+) to all damage and becomes immune to [A-Za-z ]+ for (\d+) hours\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "choose-one" && entry.generated); if (!rider) return null;
            rider.generated.rules.push({ key: "Weakness", type: "all-damage", value: Number(m[1]) }); rider.immunityHours = Number(m[2]); return []; }],
    // "you can select one target that was damaged to gain weakness 5 to that damage type until the end of your next turn." with PF2e's Effect (its choice
    // of the type) and "This has no effect on creatures with resistance or immunity to the energy type you choose."
    [/^you can select one target that was damaged to gain weakness \d+ to that damage type until the end of your next turn\.$/, () => ({ type: "choose-one", from: "damaged", uuid: null, typeFromSpell: true })],
    [/^If a spell deals multiple types of energy damage, choose one that the target gains weakness to\.$/, (m, riders) => riders.some(entry => entry.type === "choose-one" && entry.typeFromSpell) ? [] : null],
    [/^This has no effect on creatures with resistance or immunity to the energy type you choose\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "choose-one" && entry.typeFromSpell); if (!rider) return null; rider.unlessResists = true; return []; }],
    // "roll a d6." with its table: "The spell's damage type changes to the type below associated with the result of the roll, and each creature who is
    // damaged by the spell takes the listed additional effect. 1 (Acid): Sickened 1 2 (Cold): –10 ft. penalty to all Speeds until the end of your next
    // turn … 6 (Sonic): Deafened for 2 rounds"
    [/^roll a \[\[\/r 1d(\d+)\]\]\{d\1\}\.$/, m => ({ type: "chaotic", die: Number(m[1]), results: null })],
    [/^The spell's damage type changes to the type below associated with the result of the roll, and each creature who is damaged by the spell takes the listed additional effect\. (.+)$/,
        (m, riders) => {
            const rider = riders.findLast(entry => entry.type === "chaotic");
            if (!rider) return null;
            const results = {};
            for (const [, face, type, text] of m[1].matchAll(/(\d) \(([A-Z][a-z]+)\): (.*?)(?= \d \([A-Z]|$)/g)) {
                let r;
                const list = [];
                if ((r = new RegExp(String.raw`^${COND}$`).exec(text))) list.push({ type: "conditions", when: "damaged", list: [condition(r, 1)] });
                else if ((r = new RegExp(String.raw`^${COND} until the end of your next turn$`).exec(text))) list.push({ type: "conditions", when: "damaged", list: [{ ...condition(r, 1), until: "caster-next-turn-end" }] });
                else if ((r = new RegExp(String.raw`^${COND} for (\d+) rounds?$`).exec(text))) list.push({ type: "conditions", when: "damaged", list: [condition(r, 1, Number(r[4]))] });
                else if ((r = /^[–-](\d+) ft\. penalty to all Speeds until the end of your next turn$/.exec(text)))
                    list.push({ type: "generated", when: "damaged", name: `–${r[1]}-foot Speeds`, rules: [{ key: "FlatModifier", selector: "all-speeds", value: -Number(r[1]) }], until: "caster-next-turn-end" });
                else if ((r = /^Persistent ([a-z]+) damage equal to the spell's rank$/.exec(text))) list.push({ type: "persistent", when: "damaged", formula: "rank", damageType: r[1] });
                else if (!/^No added effect$/.test(text)) return null;
                results[face] = { damageType: type.toLowerCase(), riders: list };
            }
            if (Object.keys(results).length !== rider.die) return null;
            rider.results = results;
            return [];
        }],
    // Wand of Dazzling Rays: "A creature that takes damage from the spell is Blinded for 1 round and Dazzled for a number of rounds equal to the spell
    // rank." with "On a critical success on the attack roll, the target is also blinded for as long as it's dazzled from the spell." and "However, it can
    // attempt a Fortitude saving throw against your spell DC at the end of each of its turns, ending the blinded condition on a success (but remaining
    // dazzled)."
    [new RegExp(String.raw`^A creature that takes damage from the spell is ${COND} for (\d+) (rounds?|minutes?) and ${COND} for a number of rounds equal to the spell rank\.$`),
        m => ({ type: "conditions", when: "damaged", list: [condition(m, 1, duration(m[4], m[5])), { ...condition(m, 6), rounds: "rank" }] })],
    [/^On a critical success on the attack roll, the target is also ([a-z]+) for as long as it's ([a-z]+) from the spell\.$/,
        (m, riders) => { const before = riders.findLast(entry => entry.type === "conditions" && entry.when === "damaged");
            const also = before?.list.find(entry => entry.slug === m[1]), lasting = before?.list.find(entry => entry.slug === m[2]);
            if (!also || !lasting) return null; return { type: "conditions", degrees: { criticalSuccess: [{ ...also, rounds: lasting.rounds }] } }; }],
    [/^However, it can attempt a @Check\[([a-z]+)\] saving throw against your spell DC at the end of each of its turns, ending the ([a-z]+) condition on a success \(but remaining [a-z]+\)\.$/,
        (m, riders) => { const entry = riders.findLast(rider => rider.type === "conditions" && rider.degrees?.criticalSuccess)?.degrees.criticalSuccess.find(item => item.slug === m[2]);
            if (!entry) return null; entry.endSave = { statistic: m[1] }; return []; }],
    // Wand of Dumbfounding Doom: "If the target becomes Frightened by the spell, it also becomes Stupefied with a value 1 higher than the frightened
    // value." with "This lasts for the duration of the spell."
    [new RegExp(String.raw`^If the target becomes ${COND} by the spell, it also becomes ${COND} with a value (\d+) higher than the ([a-z]+) value\.$`),
        m => m[2].toLowerCase() === m[8] ? { type: "follow", slug: m[2].toLowerCase(), add: { uuid: m[4], slug: m[5].toLowerCase() }, offset: Number(m[7]), lasting: null } : null],
    [/^This lasts for the duration of the spell\.$/, (m, riders) => { const follow = riders.findLast(entry => entry.type === "follow"); if (!follow) return null; follow.lasting = "spell"; return []; }],
    // Wand of Tormented Slumber: "A creature knocked Unconscious by this spell takes 1d6 persistent mental." The waking rules stay the GM's.
    [new RegExp(String.raw`^A creature knocked ${COND} by this spell takes @Damage\[(\d+d\d+)\[persistent,([a-z]+)\]\]\.$`),
        m => ({ type: "persistent", whenCondition: m[2].toLowerCase(), formula: m[4], damageType: m[5] })],
    [/^(?:This damage wakes the creature from unconsciousness only if|If the creature awakens from its unconsciousness due to damage|If it awakens from damage on its own turn).*\.$/,
        m => ({ type: "note", text: m[0] })],
    // Wand of Pernicious Poison: "…, but it gains the virulent trait." (the affliction the spell starts).
    [/^it gains the (virulent) trait\.$/, m => ({ type: "trait", trait: m[1] })],
    // Wand of Wearying Dance: "When the spell's duration ends, if the target was forced to dance for 1 minute, it becomes Fatigued." (the spell's
    // Effect on the creature lasting that long, and running its course).
    [new RegExp(String.raw`^When the spell's duration ends, if the target was [a-z ]+ for (\d+) (minutes?|rounds?), it becomes ${COND}\.$`),
        m => ({ type: "on-end", minRounds: duration(m[1], m[2]), list: [condition(m, 3)] })],
    // Wand of Paralytic Shock: "Each target takes 1d12 electricity damage at the start of its turns while it remains stunned or Paralyzed due to the spell."
    [new RegExp(String.raw`^Each target takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage at the start of its turns while it remains ([a-z]+) or ${COND} due to the spell\.$`),
        m => ({ type: "turn-damage", formula: m[1], damageType: m[2], whileSlugs: [m[3], m[5].toLowerCase()] })],
    // Family A — the area: "increase the area of that spell." with "Add 5 feet to the radius of a burst that normally has a radius of at least 10 feet (a
    // burst with a smaller radius is not affected)." and "Add 5 feet to the length of a cone or line that is normally 15 feet long or smaller, and add
    // 10 feet to the length of a larger cone or line." (Widen Spell; a wand's "; or …"); "expand the area of the spell." with "For bursts, expand the
    // radius by 5 feet; for cones, expand the cone by 10 feet; and for lines, expand the length by 15 feet." (Growth Spell).
    [/^(?:increase the area of that spell|increase its area|expand the area of the spell)\.$/, () => ({ type: "area", grow: [] })],
    [/^Add (\d+) feet to the radius of a burst that normally has a radius of at least (\d+) feet(?: \(a burst with a smaller radius is not affected\))?(?:\.|; add (\d+) feet to the length of a cone or line that is normally (\d+) feet long or smaller; or add (\d+) feet to the length of a larger cone or line\.)$/,
        (m, riders) => { const area = riders.findLast(entry => entry.type === "area" && entry.grow); if (!area) return null;
            area.grow.push({ types: ["burst"], min: Number(m[2]), add: Number(m[1]) });
            if (m[3]) area.grow.push({ types: ["cone", "line"], max: Number(m[4]), add: Number(m[3]) }, { types: ["cone", "line"], over: Number(m[4]), add: Number(m[5]) });
            return []; }],
    [/^Add (\d+) feet to the length of a cone or line that is normally (\d+) feet long or smaller, and add (\d+) feet to the length of a larger cone or line\.$/,
        (m, riders) => { const area = riders.findLast(entry => entry.type === "area" && entry.grow); if (!area) return null;
            area.grow.push({ types: ["cone", "line"], max: Number(m[2]), add: Number(m[1]) }, { types: ["cone", "line"], over: Number(m[2]), add: Number(m[3]) }); return []; }],
    [/^For bursts, expand the radius by (\d+) feet; for cones, expand the cone by (\d+) feet; and for lines, expand the length by (\d+) feet\.$/,
        (m, riders) => { const area = riders.findLast(entry => entry.type === "area" && entry.grow); if (!area) return null;
            area.grow.push({ types: ["burst"], add: Number(m[1]) }, { types: ["cone"], add: Number(m[2]) }, { types: ["line"], add: Number(m[3]) }); return []; }],
    // (Spiritual Expansion Spell's other use: "You can also use this feat to increase the radius of an emanation spell with a duration by 5 feet by
    // dedicating your primary apparition to maintaining the spellshape; …": an emanation with a duration qualifies too, and the apparition is the table's.)
    [/^You can also use this feat to increase the radius of an emanation spell with a duration by (\d+) feet by (dedicating your primary apparition to maintaining the spellshape; .+)$/,
        (m, riders) => { const area = riders.findLast(entry => entry.type === "area" && entry.grow); if (!area) return null;
            area.grow.push({ types: ["emanation"], withDuration: true, add: Number(m[1]) }); area.alternative = { areaTypes: ["emanation"], hasDuration: true };
            return { type: "table", text: `An emanation with a duration: ${m[2]}` }; }],
    // Family A — the range and the origin, the table's (the module doesn't measure ranges): "increase that spell's range by 30 feet." with "As is
    // standard for increasing spell ranges, if the spell normally has a range of touch, you extend its range to 30 feet."; "you change the range to
    // touch."; "the spell uses the familiar as its origin point."
    [/^(?:increase that spell's range by|Its range increases by) (\d+) feet\.$/, m => ({ type: "range", add: Number(m[1]) })],
    [/^As (?:is standard for increasing spell ranges|normal for increasing ranges), if the spell normally has a range of touch, (?:you extend its range|its range extends) to (\d+) feet\.$/,
        (m, riders) => { const range = riders.findLast(entry => entry.type === "range"); if (!range) return null; range.touch = Number(m[1]); return []; }],
    [/^you change the range to touch\.$/, () => ({ type: "range", touchOnly: true })],
    [/^(?:the spell uses (?:the familiar|the animal) as its origin point|you can have the spell originate from your charge instead|its area spreads from a willing ally of your choice within \d+ feet instead of you)\.$/,
        m => ({ type: "table", text: m[0] })],
    [/^(?:That creature can use their reaction to roughly complete the spell's incantation|If you have @UUID\[[^\]]+\]\{Directed Audience\}, you can have that cone originate from the ally instead|This only allows you to touch a single target with the spell|You gain a \+2 circumstance bonus to the attack\.$).*$/,
        m => ({ type: "table", text: m[0] })],
    // Reach of the Dead: "you cast that spell from one of your thralls within 60 feet." with "That thrall becomes the point of origin for your spell;
    // calculate range and cover from its space instead of yours." and "The thrall is then destroyed."
    [/^you cast that spell from one of your thralls within (\d+) feet\.$/, m => ({ type: "thrall-origin", feet: Number(m[1]), destroy: false })],
    [/^That thrall becomes the point of origin for your spell; calculate range and cover from its space instead of yours\.$/, (m, riders) => riders.some(entry => entry.type === "thrall-origin") ? [] : null],
    [/^The thrall is then destroyed\.$/, (m, riders) => { const origin = riders.findLast(entry => entry.type === "thrall-origin"); if (!origin) return null; origin.destroy = true; return []; }],
    // Touch Focus: "As long as your spell attack is successful, the target is knocked Prone in addition to the spell's normal effects."
    [new RegExp(String.raw`^As long as your spell attack is successful, the target is knocked ${COND} in addition to the spell's normal effects\.$`),
        m => ({ type: "conditions", when: "hit", list: [condition(m, 1)] })],
    // Family E — the caster's benefits, as the spell is cast.
    // Vampiric Spell: "you gain temporary Hit Points equal to half the initial damage a single creature takes from this spell; calculate these temporary
    // Hit Points using the creature that took the most damage from the spell." with "These temporary Hit Points last for 1 minute."
    [/^you gain temporary Hit Points equal to half the initial damage a single creature takes from this spell; calculate these temporary Hit Points using the creature that took the most damage from the spell\.$/,
        () => ({ type: "drain-temp-hp", fraction: 0.5, rounds: null })],
    [/^These temporary Hit Points last for (\d+) (minutes?|rounds?)\.$/, (m, riders) => { const rider = riders.findLast(entry => entry.type === "drain-temp-hp"); if (!rider) return null; rider.rounds = duration(m[1], m[2]); return []; }],
    // Energy Ablation: "you gain resistance to an energy damage type of your choice equal to the spell's rank." with "The resistance lasts until the end
    // of your next turn." and "You get the resistance regardless of whether or not your spell dealt damage."; Elemental Defense: "you gain resistance to
    // effects that have the element traits of your spell equal to twice the spell's rank." with "The resistance lasts until the beginning of your next turn."
    [/^you gain resistance to an energy damage type of your choice equal to the spell's rank\.$/, () => ({ type: "self-resistance", choice: "energy", value: "rank", until: null })],
    [/^you gain resistance to effects that have the element traits of your spell equal to twice the spell's rank\.$/, () => ({ type: "self-resistance", fromTraits: true, value: "2rank", until: null })],
    [/^The resistance lasts until the (end|beginning) of your next turn\.$/, (m, riders) => { const rider = riders.findLast(entry => entry.type === "self-resistance"); if (!rider) return null;
        rider.until = m[1] === "end" ? "caster-next-turn-end" : "caster-turn-start"; return []; }],
    [/^You get the resistance regardless of whether or not your spell dealt damage\.$/, (m, riders) => riders.some(entry => entry.type === "self-resistance") ? [] : null],
    // Current Spell: "until the start of your next turn, you gain a +1 circumstance bonus to AC or a +2 circumstance bonus against ranged attacks." with
    // its traits and saves, and PF2e's Effect (its element: the spell's).
    [/^until the start of your next turn, you gain a \+1 circumstance bonus to AC or a \+2 circumstance bonus against ranged attacks\.$/, () => ({ type: "self-effect", uuid: null, choiceFromTraits: true })],
    [/^(?:This effect has the air or water trait, or both, depending on the traits of the spell you cast|You also gain a \+1 circumstance bonus to all saves against effects with the air trait, water trait, or both until the start of your next turn, depending on the spell's traits)\.$/,
        (m, riders) => riders.some(entry => entry.type === "self-effect") ? [] : null],
    // Skeletal Extension: "Until the end of the turn, your reach increases by 10 feet, and you can move 15 feet whenever you Step." (PF2e's Effect: the
    // reach; the Step the table's).
    [/^Until the end of the turn, your reach increases by \d+ feet, and (you can move \d+ feet whenever you Step)\.$/, m => [{ type: "self-effect", uuid: null }, { type: "table", text: m[1] }]],
    // Dualistic Synergy: "you gain a benefit." with "If the spell is arcane, you can attempt a skill check to Recall Knowledge with a +1 status bonus to
    // the check after casting the spell, or a +2 status bonus if the spell is 7th rank or higher.", "If the spell is primal, you gain a number of
    // temporary Hit Points equal to the spell's rank for 1 round." and "If the spell is a halcyon spell, you gain both benefits."
    [/^you gain a benefit\.$/, () => ({ type: "tradition-benefit", arcane: null, primal: null, both: null })],
    [/^If the spell is arcane, you can attempt a skill check to @UUID\[[^\]]+\]\{Recall Knowledge\} with a \+(\d+) status bonus to the check after casting the spell, or a \+(\d+) status bonus if the spell is (\d+)(?:st|nd|rd|th) rank or higher\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "tradition-benefit"); if (!rider) return null; rider.arcane = { bonus: Number(m[1]), higher: Number(m[2]), fromRank: Number(m[3]) }; return []; }],
    [/^If the spell is primal, you gain a number of temporary Hit Points equal to the spell's rank for (\d+) rounds?\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "tradition-benefit"); if (!rider) return null; rider.primal = { tempHp: "rank", rounds: Number(m[1]) }; return []; }],
    [/^If the spell is a ([a-z]+) spell, you gain both benefits\.$/, (m, riders) => { const rider = riders.findLast(entry => entry.type === "tradition-benefit"); if (!rider) return null; rider.both = m[1]; return []; }],
    // Safeguard Spell: "you aren't affected by the spell even if you are within the area."
    [/^you aren't affected by the spell even if you are within the area\.$/, () => ({ type: "self-exempt" })],
    // Familiar's Resolve: "you or an ally within 30 feet gain a +2 status bonus to saving throws against effects that would cause you to be doomed or
    // frightened for 1 round." with "At 14th level, you or an ally gain a +3 status bonus to saving throws against these effects instead."
    [/^you or an ally within (\d+) feet gain a \+(\d+) status bonus to saving throws against effects that would cause you to be ([a-z]+) or ([a-z]+) for (\d+) (rounds?|minutes?)\.$/,
        m => ({ type: "ally-effect", within: Number(m[1]), self: true, name: `+${m[2]} saves against ${m[3]} or ${m[4]}`, rounds: duration(m[5], m[6]),
            rules: [{ key: "FlatModifier", selector: "saving-throw", type: "status", value: Number(m[2]), predicate: [{ or: [`inflicts:${m[3]}`, `inflicts:${m[4]}`] }] }], byLevel: null })],
    [/^At (\d+)(?:st|nd|rd|th) level, you or an ally gain a \+(\d+) status bonus to saving throws against these effects instead\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "ally-effect"); if (!rider) return null; rider.byLevel = { level: Number(m[1]), value: Number(m[2]) }; return []; }],
    // The table's: Gusting Spell's Fly, Defensive Coordination's Raise a Shield.
    [/^you can (?:Fly up to \d+ feet before or after the spell is cast|Raise a Shield, and one ally of your choice who gains a status bonus from the spell can immediately use their reaction to Raise a Shield)\.$/,
        m => ({ type: "table", text: m[0] })],
    // Family J — how the spell is cast. The slot not spent (the Conduits, Unlimited Potential, Galvanize Spell): given back after the cast.
    [/^(?:you don't expend the spell's slot when you cast it|you don't expend the prepared spell as you cast it|you do not expend a spell slot|you don't expend the slot)\.$/, () => ({ type: "slot-refund" })],
    [/^You then immediately regain the ability to cast that spell again \(with the normal parameters\) or the spell slot used\.$/, () => ({ type: "slot-refund" })],
    // The table's: the subtle trait; fewer actions; reactions, identifying, cover, concealment, senses; the spell kept (Look Again).
    [/^(?:the spell gains the subtle trait, (?:hiding|masking) .*|it loses the manipulate trait and gains the subtle trait|The trait hides only the spell's spellcasting actions and manifestations, not its effects.*|As part of using Melodious Spell, you can choose to .*|If you do so, the spell you cast must have the .* trait to gain the subtle trait)\.$/,
        m => ({ type: "table", text: m[0] })],
    [/^(?:(?:Frequency once per [a-z]+ )?(?:[A-Z][a-z]+ )?If your next action is to cast .*, )?(?:you can draw power from one of your attuned apparitions to )?(?:reduce|you reduce) the number of actions to cast it by 1 \((?:minimum|to a minimum of) 1 action\)\.$/,
        m => ({ type: "table", text: m[0] })],
    [/^(?:The chosen apparition is dispersed .*|Special This can only be used on a cantrip or spell from the class .*|Special You can't use Quickened Attunement and .*|that spell does not trigger reactions that normally trigger due to .*|creatures with the ability to Cast that Spell don't automatically know what the spell is|In addition, creatures that witness your spellcasting take a [–-]2 circumstance penalty to checks to identify the spell .*|choose a creature within \d+ feet that the target can sense|The target will think that creature, instead of you, attempted to alter its mind .*|If the target attempts to .* on either you or the incriminated creature, .*|If the incriminated creature is obviously incapable of using magic, .*|your targets don't benefit from cover provided by living or undead creatures|you ignore the target's (?:@UUID\[[^\]]+\]\{Concealed\}|Concealed) condition and any cover they have from you|you can have it affect creatures who can witness it with any sense.*|You can choose to exclude any senses you choose|you do not lose the spell|You must use the same number of actions to recast the same spell on your following turn.*|After this second casting, you lose the spell .*|Look Again works only with spells .*|The spell's rank must be half the destroyed minion's level or lower and the spell can't have a duration|Special This feat has the trait matching your spellcasting tradition)\.$/,
        m => ({ type: "table", text: m[0] })],
    // Family D — the damage's type and the target's resistances.
    // Spiritual Secret: "it deals spirit damage instead of its normal type." with its traits (PF2e's).
    [/^it deals ([a-z]+) damage instead of its normal type\.$/, m => ({ type: "damage-type", to: m[1] })],
    [/^It also loses any traits related to its damage, such as the [a-z]+ or [a-z]+ trait, and gains the [a-z]+ and [a-z]+ traits instead\.$/, (m, riders) => riders.some(entry => entry.type === "damage-type") ? [] : null],
    // Golden Dragon's Bounty: "that damage is your choice of cold iron, silver, or steel for the purposes of weaknesses, resistances, vulnerabilities, and
    // the like." with "At 14th level, adamantine is added to the list of metal choices."
    [/^that damage is your choice of ((?:[a-z ]+, )+)or ([a-z ]+) for the purposes of weaknesses, resistances, vulnerabilities, and the like\.$/,
        m => ({ type: "damage-material", choice: [...m[1].split(/,\s*/).filter(Boolean), m[2]].map(name => name.trim().replace(/ /g, "-")), byLevel: null })],
    [/^At (\d+)(?:st|nd|rd|th) level, ([a-z]+) is added to the list of metal choices\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "damage-material"); if (!rider) return null; rider.byLevel = { level: Number(m[1]), add: m[2] }; return []; }],
    // Overwhelming Energy, Surging Might, Overwhelming Breath: "the spell ignores an amount of the target's resistance to acid, cold, electricity, fire,
    // or sonic damage equal to your level." / "… equal to your level against the following types of damage: spirit, vitality, and void." / "… ignore an
    // amount of the target's resistance to physical damage equal to your level."
    [/^the spell ignores an amount of the target's resistance to ((?:[a-z]+, )+)or ([a-z]+) damage equal to your level\.$/,
        m => ({ type: "ignore-resistance", types: [...m[1].split(/,\s*/).filter(Boolean), m[2]], value: "level" })],
    [/^the spell ignores an amount of the target's resistance equal to your level against the following types of damage: ((?:[a-z]+, )+)and ([a-z]+)\.$/,
        m => ({ type: "ignore-resistance", types: [...m[1].split(/,\s*/).filter(Boolean), m[2]], value: "level" })],
    [/^the spell and any Strikes you make as a result of casting it ignore an amount of the target's resistance to physical damage equal to your level\.$/,
        () => ({ type: "ignore-resistance", types: ["physical", "bludgeoning", "piercing", "slashing"], value: "level" })],
    [/^(?:This applies to all damage the spell deals, including persistent damage and damage caused by an ongoing effect of the spell.*|A creature's immunities are unaffected|This doesn't cause the spell to ignore immunities, only resistances)\.$/,
        (m, riders) => riders.some(entry => entry.type === "ignore-resistance") ? [] : null],
    // Nonlethal Spell: "that spell gains the nonlethal trait."; a wand's "and can choose to give it the nonlethal trait".
    [/^(that spell gains the nonlethal trait|can choose to give it the nonlethal trait)\.$/, m => ({ type: "nonlethal", ...(/^can choose/.test(m[1]) ? { optional: true } : {}) })],
    // The table's: Steam Spell's casting underwater; Bizarre Transformation's unarmed attack (the GM's note).
    [/^(?:you can cast it underwater|When you do so, it takes the form of scalding steam|Underwater creatures do not gain the normal fire resistance for being underwater against this spell, .*)\.$/, m => ({ type: "table", text: m[0] })],
    [/^you can change the damage type of a single unarmed attack granted by untamed form to one of the following: .*\.$|^The chosen attack gains the appropriate trait\.$/, m => ({ type: "note", text: m[0] })],
    // Family F — healing and harm: on the creature the spell heals (PF2e applies Heal's and Harm's healing; the module follows its message).
    // Defensive Recovery, Heroic Recovery: PF2e's Effect on the healed creature. "it also gains a +2 status bonus to AC and saving throws for 1 round." /
    // "the target also gains three bonuses until the end of its next turn: …" with "In addition, if the target is Prone, it can immediately Stand …".
    [/^(?:it also gains a \+\d+ status bonus to AC and saving throws for \d+ rounds?|the target also gains three bonuses until the end of its next turn: .+)\.$/, () => ({ type: "healed-effect", uuid: null })],
    [/^In addition, if the target is (?:@UUID\[[^\]]+\]\{Prone\}|Prone), it can immediately Stand as a free action that doesn't trigger reactions\.$/, m => ({ type: "table", text: m[0] })],
    // Divine Infusion: "the target then deals an additional 1d6 damage with its melee weapons and unarmed attacks until the end of its next turn." with
    // "The damage type is void if you cast harm and vitality if you cast heal ." and "If the spell cast is at least 5th rank, this damage increases to
    // 2d6, and if the spell is at least 8th rank, the damage increases to 3d6."
    [/^the target then deals an additional (\d+)d(\d+) damage with its melee weapons and unarmed attacks until the end of its next turn\.$/,
        m => ({ type: "healed-strike-dice", dice: [{ rank: 1, number: Number(m[1]) }], faces: Number(m[2]), typeBySpell: {} })],
    [/^The damage type is ([a-z]+) if you cast ([a-z]+) and ([a-z]+) if you cast ([a-z]+) ?\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "healed-strike-dice"); if (!rider) return null; rider.typeBySpell = { [m[2]]: m[1], [m[4]]: m[3] }; return []; }],
    [/^If the spell cast is at least (\d+)(?:st|nd|rd|th) rank, this damage increases to (\d+)d\d+, and if the spell is at least (\d+)(?:st|nd|rd|th) rank, the damage increases to (\d+)d\d+\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "healed-strike-dice"); if (!rider) return null;
            rider.dice.push({ rank: Number(m[1]), number: Number(m[2]) }, { rank: Number(m[3]), number: Number(m[4]) }); return []; }],
    // Martyr: "you can channel your own vitality along with the spell." with "You lose 1d8 Hit Points per rank of the spell, which can't be reduced or
    // mitigated in any way, and your ally regains an equal number of Hit Points."
    [/^you can channel your own vitality along with the spell\.$/, () => ({ type: "martyr", dice: null, faces: null })],
    [/^You lose (\d+)d(\d+) Hit Points per rank of the spell, which can't be reduced or mitigated in any way, and your ally regains an equal number of Hit Points\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "martyr"); if (!rider) return null; rider.dice = Number(m[1]); rider.faces = Number(m[2]); return []; }],
    // Cleansing Spell: "one target of that spell regains a number of Hit Points equal to your level (in addition to any Hit Points they would normally
    // gain)." with "In addition, you can attempt to counteract a disease or poison affecting one target of that spell."; Purifying Spell: "you can
    // attempt to counteract a disease or poison affecting the target, in addition to the other benefits of heal ."
    [/^one target of that spell regains a @Damage\[\(@actor\.level\)\[healing\]\]\{number of Hit Points equal to your level\} \(in addition to any Hit Points they would normally gain\)\.$/,
        () => ({ type: "healed-extra", amount: "level" })],
    [/^(?:In addition, )?you can attempt to counteract an? ([a-z]+) or ([a-z]+) affecting (?:one target of that spell|the target)(?:, in addition to the other benefits of [a-z]+ ?)?\.$/,
        m => ({ type: "counteract-affliction", traits: [m[1], m[2]] })],
    [/^(?:These two targets can be the same creature or different creatures, as long as they are both targets of the healing spell|If you do, heal gains the water trait)\.$/, m => ({ type: "table", text: m[0] })],
    // Healing Transformation: "your polymorph spell also restores 1d6 Hit Points per spell rank to that creature." with "This is a healing effect."
    [/^your polymorph spell also restores (\d+)d(\d+) Hit Points per spell rank to that creature\.$/, m => ({ type: "cast-heal", dice: Number(m[1]), faces: Number(m[2]), perRank: true })],
    [/^This is a healing effect\.$/, (m, riders) => riders.some(entry => entry.type === "cast-heal") ? [] : null],
    // The table's: Ebb and Flow's two targets, Echoing Channel's second casting, Interweave Dispel's Dispel Magic.
    [/^(?:choose one creature in range that would be harmed by the spell, and choose another creature within range that would be healed by the spell|Your heal or harm targets both creatures|choose one additional creature in range|Target that creature with a 1-action version of the same spell|This spell is the same rank as the 2-action harm or heal you cast and doesn't cost another spell slot|you can cast @UUID\[[^\]]+\]\{Dispel Magic\} on the enemy as a free action, expending a spell slot as normal and targeting one spell effect affecting the enemy)\.$/,
        m => ({ type: "table", text: m[0] })],
    // The GM's: Blessed Spell's condition removed by a Mercy counteract, Remediate's counteract of a divine effect in the area.
    [/^(?:you can also attempt to remove a harmful condition from that ally|The condition must be one that could be removed by your Mercy feat.*|Attempt a counteract check based on the spell's DC and level|This effect is in addition to the normal effects of your spell|you can harness the residual energy to counterbalance opposing forces|In addition to its normal effects, you use your heal or harm spell to attempt to counteract one divine effect in the spell's area)\.$/,
        m => ({ type: "note", text: m[0] })],
    // Family G — more targets. Split Shot: "you can choose a second target within range." with "To the second target, the spell deals half the amount of
    // damage it would normally deal and has no effects beyond the spell's initial damage (such as imposing conditions or penalties)."
    [/^you can choose a second target within range\.$/, () => ({ type: "split-target", half: false, damageOnly: false })],
    [/^To the second target, the spell deals half the amount of damage it would normally deal and has no effects beyond the spell's initial damage \(such as imposing conditions or penalties\)\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "split-target"); if (!rider) return null; rider.half = true; rider.damageOnly = true; return []; }],
    [/^(?:You roll a single attack roll and compare the result to the AC of both targets|This counts as one attack for your multiple attack penalty|you can target one additional creature|If you do, you can select a second target for that hex to affect)\.$/,
        m => ({ type: "table", text: m[0] })],
    // Tempest-Sun Redirection: "Select any number of targets of the spell and reduce the spell's damage to those targets by an amount equal to the spell's
    // rank." with "Until your next turn, when one of those targets damages you, that damage is reduced by twice the spell's rank."
    [/^Select any number of targets of the spell and reduce the spell's damage to those targets by an amount equal to the spell's rank\.$/, () => ({ type: "shield-targets", reduce: "rank", retaliate: null })],
    [/^Until your next turn, when one of those targets damages you, that damage is reduced by twice the spell's rank\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "shield-targets"); if (!rider) return null; rider.retaliate = "2rank"; return []; }],
    // The rank: Split Hex's "reduce its rank by 2 (making it 2 ranks lower than the maximum spell rank you can cast)."; Mythic Heightening's "that spell
    // is heightened to the highest spell rank that you can cast."; Simple Mastery's "you Cast the Spell as though it is 1 rank higher, up to the highest
    // rank spell you can cast."
    [/^reduce its rank by (\d+) \(making it \d+ ranks lower than the maximum spell rank you can cast\)\.$/, m => ({ type: "rank-change", by: -Number(m[1]) })],
    [/^that spell is heightened to the highest spell rank that you can cast\.$/, () => ({ type: "rank-change", to: "highest" })],
    [/^you Cast the Spell as though it is (\d+) rank higher, up to the highest rank spell you can cast\.$/, m => ({ type: "rank-change", by: Number(m[1]), cap: "highest" })],
    // Mythic proficiency: "use mythic proficiency to determine your spell attack rolls and save DC for that spell." / "Any spell attack roll is made with
    // mythic proficiency, and the spell's DC is calculated with mythic proficiency."
    [/^(?:use mythic proficiency to determine your spell attack rolls and save DC for that spell|Any spell attack roll is made with mythic proficiency, and the spell's DC is calculated with mythic proficiency)\.$/,
        () => ({ type: "mythic-proficiency" })],
    [/^(?:The spell slot used to cast the spell isn't changed|Note: PFS .*)\.?$/, m => ({ type: "table", text: m[0] })],
    // Heightened Captivation: the captivator spells' highest rank, the GM's.
    [/^that spell is heightened to the highest rank of captivator spell you can cast\.$/, m => ({ type: "note", text: m[0] })],
    // Family H — terrain. Charred Remains: "for 1 minute, your spell's area becomes difficult terrain as well as hazardous terrain, dealing 1 fire damage for
    // each square a creature moves through."
    [/^for (\d+) (minutes?|rounds?), your spell's area becomes difficult terrain as well as hazardous terrain, dealing @Damage\[(\d+)\[([a-z]+)\]\] damage for each square a creature moves through\.$/,
        m => ({ type: "terrain", where: "area", difficult: true, hazard: { formula: m[3], damageType: m[4], per: "square" }, rounds: duration(m[1], m[2]) })],
    // Snowdrift Spell: "select one creature affected by the spell on the ground." with "Each square on the ground under or adjacent to the creature fills
    // with ankle-deep snow." and "Those squares are difficult terrain until the beginning of your next turn."
    [/^select one creature affected by the spell on the ground\.$/, () => ({ type: "terrain", where: "around-creature", difficult: true, until: null })],
    [/^Each square on the ground under or adjacent to the creature fills with ankle-deep snow\.$/, (m, riders) => riders.some(entry => entry.type === "terrain" && entry.where === "around-creature") ? [] : null],
    [/^Those squares are difficult terrain until the beginning of your next turn\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "terrain" && entry.where === "around-creature"); if (!rider) return null; rider.until = "caster-turn-start"; return []; }],
    [/^A creature can Interact to clear a square of snow, and the snow in a square melts if that square is exposed to a fire effect\.$/, m => ({ type: "table", text: m[0] })],
    // Garland Spell: "a garland of plants grows in a 10-foot burst in the spell's range." with its thorns or vines, the damage once per turn on moving in or
    // ending a turn there, the caster immune, 1 minute or until another Garland Spell, and the level's dice.
    [/^a garland of plants grows in a @Template\[burst\|distance:(\d+)\] in the spell's range\.$/,
        m => ({ type: "terrain", where: "placed-burst", feet: Number(m[1]), difficult: false, hazard: null, rounds: null, replaces: true, exemptCaster: false })],
    [/^The plants are difficult terrain and hazardous terrain, covered in your choice of thorns or poisonous vines\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "terrain" && entry.where === "placed-burst"); if (!rider) return null; rider.difficult = true; return []; }],
    [/^Any creature that moves into one of these squares or ends its turn in one takes 2d6 damage \(.*damage for thorns or .*for vines\)\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "terrain" && entry.where === "placed-burst"); if (!rider) return null;
            rider.hazard = { dice: [{ level: 1, number: 2 }], faces: 6, choice: { thorns: "piercing", vines: "poison" }, per: "entry-or-turn-end", oncePerTurn: false }; return []; }],
    [/^A creature can take this damage only once per turn\.$/, (m, riders) => { const rider = riders.findLast(entry => entry.type === "terrain" && entry.hazard); if (!rider) return null; rider.hazard.oncePerTurn = true; return []; }],
    [/^You and your familiar are immune to this damage\.$/, (m, riders) => { const rider = riders.findLast(entry => entry.type === "terrain" && entry.hazard); if (!rider) return null; rider.exemptCaster = true; return []; }],
    [/^The plants last for (\d+) (minutes?|rounds?) or until you cast another Garland Spell, whichever comes first\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "terrain" && entry.where === "placed-burst"); if (!rider) return null; rider.rounds = duration(m[1], m[2]); return []; }],
    [/^The damage increases to (\d+)d\d+ at (\d+)(?:st|nd|rd|th) level and (\d+)d\d+ at (\d+)(?:st|nd|rd|th) level\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "terrain" && entry.hazard?.dice); if (!rider) return null;
            rider.hazard.dice.push({ level: Number(m[2]), number: Number(m[1]) }, { level: Number(m[4]), number: Number(m[3]) }); return []; }],
    // The GM's: Rockslide Spell's chosen squares; Worldsphere Gravity's planar effects.
    [/^(?:a number of 5-foot squares in the area equal to the spell rank become difficult terrain for \d+ rounds?|These squares must be on the ground, and the entire area of difficult terrain must be contiguous|you can apply one of the following planar effects to a @Template\[burst\|distance:\d+\] centered within the spell's area|The effect persists for \d+ minutes?|Gravitational Morass The pull of gravity is amplified here, .*|Flowing Time Erratic timestreams aid you within this space|A creature that starts its turn in the burst is affected by @UUID\[[^\]]+\]\{Haste\} on that turn|Flying creatures that pass through the area must succeed at a Reflex save .*)\.$/,
        m => ({ type: "note", text: m[0] })],
    // Family I — time. Echoing Spell: "the spell's energy reverberates and echoes." with "You can Cast the Spell a second time before the end of your next
    // turn without expending a spell slot." (the slot given back on that second cast).
    [/^the spell's energy reverberates and echoes\.$/, () => ({ type: "echo", until: null })],
    [/^You can Cast the Spell a second time before the end of your next turn without expending a spell slot\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "echo"); if (!rider) return null; rider.until = "caster-next-turn-end"; return []; }],
    // Form Control: "the spell's rank is 2 lower than normal (minimum 1st rank), but you can remain transformed for up to 1 hour or the listed duration
    // (whichever is longer)." (the rank; the duration the form's, the GM's).
    [/^the spell's rank is (\d+) lower than normal \(minimum 1st rank\), but (you can remain transformed for up to \d+ hours? or the listed duration \(whichever is longer\))\.$/,
        m => [{ type: "rank-change", by: -Number(m[1]) }, { type: "note", text: m[2] }]],
    [/^You can still Dismiss untamed form as normal\.$/, m => ({ type: "table", text: m[0] })],
    // The GM's: Into the Future's delay; Sow Spell's planted spell.
    [/^(?:the spell's effects occur 1 round later, at the beginning of your next turn, rather than immediately|Targets and choices about the spell must be determined when the spell is cast, .*|Consequences for the action of Casting the Spell itself, .*|the spell instead plants itself in an adjacent square|You must make all decisions regarding the spell at the time you cast it|Within the next 10 minutes, you can direct your sown spell to sprout .*|You can have only one sown spell at a time, .*|A creature can notice the sown spell with .*)\.$/,
        m => ({ type: "note", text: m[0] })],
    // Family C — a spellshape's own save card (a spell made from the feat's numbers). Heraldic Proclamation: "then all allies within 30 feet gain Hit Points
    // equal to double the rank of the spell, and all enemies within 30 feet take spirit damage equal to double the rank of the spell (basic Will save
    // against your spell DC)."
    [/^then all allies within (\d+) feet gain Hit Points equal to double the rank of the spell, and all enemies within (\d+) feet take ([a-z]+) damage equal to double the rank of the spell \(basic ([A-Z][a-z]+) save against your spell DC\)\.$/,
        m => [{ type: "ally-heal", within: Number(m[1]), amount: "2rank" }, { type: "card", center: "caster", within: Number(m[2]), who: "enemies", statistic: m[4].toLowerCase(), damage: { formula: "2rank", type: m[3] } }]],
    // Explosive Arrival, Ostentatious Arrival: "all creatures in a 10-foot emanation around the creature you summoned take 1d4 fire damage per spell rank."
    // with its type from the creature's traits.
    [/^all creatures in a @Template\[emanation\|distance:(\d+)\] around the creature you summoned take (\d+)d(\d+) ([a-z]+) damage per spell rank\.$/,
        m => ({ type: "arrival", feet: Number(m[1]), dice: Number(m[2]), faces: Number(m[3]), damageType: m[4], typeFromTraits: null, exceptCaster: false })],
    [/^If the creature summoned has the ((?:[a-z]+, )+)or ([a-z]+) trait, you can deal damage of that type instead\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "arrival"); if (!rider) return null; rider.typeFromTraits = Object.fromEntries([...m[1].split(/,\s*/).filter(Boolean), m[2]].map(trait => [trait, trait])); return []; }],
    [/^All creatures in a @Template\[emanation\|distance:(\d+)\] around the creature you summoned or manifested except you take @Damage\[(\d+)d(\d+)\[([a-z]+)\]\|options:area-damage\]\{\d+d\d+ [a-z]+ damage per spell rank\} for a summon or incarnate spell, or .* for Manifesting your Eidolon\.$/,
        m => ({ type: "arrival", feet: Number(m[1]), dice: Number(m[2]), faces: Number(m[3]), damageType: m[4], typeFromTraits: null, exceptCaster: true })],
    [/^If the creature you summoned or manifested has the ((?:[a-z]+, )+)or ([a-z]+) trait, the damage is that type instead \(or ([a-z]+) damage for the ([a-z]+) trait\)\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "arrival"); if (!rider) return null;
            rider.typeFromTraits = Object.fromEntries([...m[1].split(/,\s*/).filter(Boolean), m[2]].map(trait => [trait, trait === m[4] ? m[3] : trait])); return []; }],
    [/^If the creature has more than one of these traits, you choose which damage type to deal\.$|^the creature appears in an explosion\.$/, (m, riders) => riders.some(entry => entry.type === "arrival") || /explosion/.test(m[0]) ? [] : null],
    // Explosive Metamorphosis: "select acid, cold, electricity, or fire." with "Your transformation creates a 5-foot emanation around your new form that deals
    // 1d6 damage of that type per rank of the spell." and "Each creature in that area attempts a basic Reflex save against your spell DC."
    [/^select ((?:[a-z]+, )+)or ([a-z]+)\.$/, m => ({ type: "card", center: "caster", within: null, who: "all", statistic: null, damage: { dice: null, faces: null, typeChoice: [...m[1].split(/,\s*/).filter(Boolean), m[2]] } })],
    [/^Your transformation creates a @Template\[emanation\|distance:(\d+)\] around your new form that deals (\d+)d(\d+) damage of that type per rank of the spell\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "card" && entry.damage?.typeChoice); if (!rider) return null; rider.within = Number(m[1]); rider.damage.dice = Number(m[2]); rider.damage.faces = Number(m[3]); return []; }],
    [/^Each creature in that area attempts a basic ([A-Z][a-z]+) save against your spell DC\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "card" && entry.damage?.typeChoice); if (!rider) return null; rider.statistic = m[1].toLowerCase(); return []; }],
    [/^If your polymorph action had a trait corresponding to an energy type, you must select that one if possible\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "card" && entry.damage?.typeChoice); if (!rider) return null; rider.damage.preferSpellTrait = true; return []; }],
    [/^This action gains the trait corresponding to the energy type selected\.$/, (m, riders) => riders.some(entry => entry.type === "card") ? [] : null],
    // Secondary Detonation Array: "a glowing magic circle appears in a 5-foot burst within that area." with "At the beginning of your next turn, the circle
    // detonates, dealing 1d6 force damage per rank of the spell to all creatures within the circle, with a basic Reflex save against your spell DC." and
    // "If the spell dealt a different type of damage, the circle deals this type of damage instead (…)."
    [/^a glowing magic circle appears in a @Template\[burst\|distance:(\d+)\] within that area\.$/, m => ({ type: "delayed-burst", feet: Number(m[1]), statistic: null, damage: null })],
    [/^At the beginning of your next turn, the circle detonates, dealing @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage per rank of the spell to all creatures within the circle, with a basic ([A-Z][a-z]+) save against your spell DC\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "delayed-burst"); if (!rider) return null; rider.statistic = m[4].toLowerCase(); rider.damage = { dice: Number(m[1]), faces: Number(m[2]), type: m[3], fromSpell: false }; return []; }],
    [/^If the spell dealt a different type of damage, the circle deals this type of damage instead \(or one type of your choice if the spell could deal multiple types of damage\)\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "delayed-burst" && entry.damage); if (!rider) return null; rider.damage.fromSpell = true; return []; }],
    // Vexing Tempest: "all creatures within a 15-foot emanation of your familiar must attempt a Reflex save against your spell DC or be pushed 10 feet away."
    // with "On a critical failure, they're also knocked Prone."
    [/^all creatures within a @Template\[type:emanation\|distance:(\d+)\] of your familiar must attempt a ([A-Z][a-z]+) save against your spell DC or be pushed (\d+) feet away\.$/,
        m => ({ type: "card", center: "familiar", within: Number(m[1]), who: "all", statistic: m[2].toLowerCase(), push: { failure: Number(m[3]), criticalFailure: Number(m[3]) },
            outcomes: { criticalSuccess: "The creature is unaffected.", success: "The creature is unaffected.", failure: `The creature is pushed ${m[3]} feet.`, criticalFailure: `The creature is pushed ${m[3]} feet.` } })],
    [new RegExp(String.raw`^On a critical failure, they're also knocked ${COND}\.$`),
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "card" && entry.push); if (!rider) return null;
            rider.outcomes.criticalFailure = `${rider.outcomes.criticalFailure.replace(/\.$/, "")} and knocked @UUID[${m[1]}]{${m[2]}}.`; return []; }],
    // Kaleidoscopic Entreaty: "you can cause that spirit to unleash a brilliant display of color, light, and sound in a 10-foot emanation centered on you."
    // with "Each creature in the area must attempt a Fortitude save against your class DC or spell DC with the following results." and its four rows.
    [/^you can cause that spirit to unleash a brilliant display of color, light, and sound in a @Template\[type:emanation\|distance:(\d+)\] centered on you\.$/,
        m => ({ type: "card", center: "caster", within: Number(m[1]), who: "all", statistic: null, classToo: false, outcomes: {} })],
    [/^Each creature in the area must attempt a @Check\[([a-z]+)\|against:class-spell\] save against your class DC or spell DC with the following results\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "card" && entry.outcomes && !entry.statistic); if (!rider) return null; rider.statistic = m[1]; rider.classToo = true; return []; }],
    // Thundering Surge: "attempt a DC 5 flat check." with its results: on a critical success, enemies within a 10-foot burst at the spell's target or area take
    // sonic damage equal to twice the caster's level (basic Fortitude against the class or spell DC, the higher) and Prone on a failed save; on a success,
    // the level's damage and Prone on a critical failure; on a failure, all creatures within 10 feet of the caster, the level's damage, Prone on a failure.
    [/^attempt a @Check\[flat\|dc:(\d+)[^\]]*\]\.$/, m => ({ type: "surge", flatDC: Number(m[1]), results: {} })],
    [/^(Critical Success|Success) Enemies within a (?:@Template\[burst\|distance:(\d+)\]\{[^}]+\}|(\d+)-foot radius burst) centered on the target of the spell or within the spell's area of effect take @Damage\[\((?:(2)\*)?@actor\.level\)\[([a-z]+)\]\|[^\]]*\]\{[^}]+\} equal to (?:twice )?your level \((?:@Check\[([a-z]+)\|[^\]]*\]|basic ([A-Z][a-z]+)) saving throw against your class DC or spell DC, whichever is higher\)\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "surge"); if (!rider) return null;
            rider.results[m[1] === "Success" ? "success" : "criticalSuccess"] = { who: "enemies", center: "target", feet: Number(m[2] ?? m[3]), formula: m[4] ? "2level" : "level", damageType: m[5], statistic: (m[6] ?? m[7]).toLowerCase(), prone: null };
            rider.last = m[1] === "Success" ? "success" : "criticalSuccess"; return []; }],
    [/^Failure All creatures within a (\d+)-foot radius burst centered on you take ([a-z]+) damage equal to your level \(basic ([A-Z][a-z]+) saving throw against your class DC or spell DC, whichever is higher\)\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "surge"); if (!rider) return null;
            rider.results.failure = { who: "all", center: "caster", feet: Number(m[1]), formula: "level", damageType: m[2], statistic: m[3].toLowerCase(), prone: null }; rider.last = "failure"; return []; }],
    [new RegExp(String.raw`^Those who (fail|critically fail) the save are also knocked (?:${COND}|prone)\.$`),
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "surge"); const result = rider?.results?.[rider.last]; if (!result) return null; result.prone = m[1] === "fail" ? "failure" : "criticalFailure"; return []; }],
    // Command Undead: "Instead of harm's normal effects, the target becomes controlled by you if its level is equal to or lower than your level - 3." with
    // "It can attempt a Will saving throw to resist being controlled by you." and its rows (a control card in place of Harm).
    [/^Instead of harm's normal effects, the target becomes controlled by you if its level is equal to or lower than your level - (\d+)\.$/, m => ({ type: "control-card", levelGap: Number(m[1]), statistic: null, outcomes: {} })],
    [/^It can attempt a ([A-Z][a-z]+) saving throw to resist being controlled by you\.$/, (m, riders) => { const rider = riders.findLast(entry => entry.type === "control-card"); if (!rider) return null; rider.statistic = m[1].toLowerCase(); return []; }],
    [/^If the target is already under someone else's command, the controlling creature also rolls a saving throw, and the undead uses the better result\.$/, m => ({ type: "note", text: m[0] })],
    [/^The spell gains a duration of (\d+) (minutes?|hours?), but it is dismissed if you or an ally attacks the minion undead\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "control-card" && entry.outcomes.failure); if (!rider) return null;
            rider.outcomes.failure = `${rider.outcomes.failure} ${m[0]}`; rider.dismissedOnAttack = true; return []; }],
    // Daunting Spell: rows added to the spell's own save — "Success The target is Frightened 1." / "Failure The target is Frightened 2 and Stupefied 1 for as
    // long as they remain frightened." / "Critical Failure As failure, but Frightened 3 and Stupefied 2."
    [/^Critical Success The target is unaffected by the daunting spell\.$/, () => ({ type: "conditions", degrees: {} })],
    [new RegExp(String.raw`^Success The target is ${COND}\.$`), (m, riders) => { const rider = riders.findLast(entry => entry.type === "conditions" && entry.degrees && !entry.when); if (!rider) return null; rider.degrees.success = [condition(m, 1)]; return []; }],
    [new RegExp(String.raw`^Failure The target is ${COND} and ${COND} for as long as they remain ([a-z]+)\.$`),
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "conditions" && entry.degrees && !entry.when); if (!rider) return null;
            rider.degrees.failure = [condition(m, 1), { ...condition(m, 4), whileCondition: m[7] }]; return []; }],
    [new RegExp(String.raw`^Critical Failure As failure, but ${COND} and ${COND}\.$`),
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "conditions" && entry.degrees?.failure); if (!rider) return null;
            rider.degrees.criticalFailure = [condition(m, 1), { ...condition(m, 4), whileCondition: rider.degrees.failure[1].whileCondition }]; return []; }],
    [/^(?:your spell gains the emotion, fear, and mental traits|The spell gains the following success and failure effects in addition to any other effects it would normally have)\.$/, m => ({ type: "table", text: m[0] })],
    [/^(?:If the target is your nemesis or an ally of your nemesis, use mythic proficiency .*|If the daunting spell has a duration, the affected creature can't reduce their frightened condition .*)\.$/, m => ({ type: "note", text: m[0] })],
    [/^(Critical Success|Success|Failure|Critical Failure) (.+)$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "card" && entry.outcomes && entry.statistic && !entry.push) ?? riders.findLast(entry => entry.type === "control-card");
            if (!rider) return null; const key = { "Critical Success": "criticalSuccess", Success: "success", Failure: "failure", "Critical Failure": "criticalFailure" }[m[1]];
            rider.outcomes[key] = rider.outcomes[key] ? `${rider.outcomes[key]} ${m[2]}` : m[2]; return []; }],
    // Grasping Spirits Spell: "The target must attempt a Fortitude saving throw against your spell DC; on a failure, it is pulled up to 30 feet directly
    // toward you." (its card; the pull the GM's).
    [/^The target must attempt a ([A-Z][a-z]+) saving throw against your spell DC; on a failure, it is pulled up to (\d+) feet directly toward you\.$/,
        m => ({ type: "card", center: "target", within: 0, who: "target", statistic: m[1].toLowerCase(), pull: Number(m[2]),
            outcomes: { criticalSuccess: "The creature is unaffected.", success: "The creature is unaffected.", failure: `The creature is pulled ${m[2]} feet toward you.`, criticalFailure: `The creature is pulled ${m[2]} feet toward you.` } })],
    [/^In addition to the normal effects of the spell, your apparitions briefly take on semi-physical forms and attempt to drag the target toward you\.$/, () => []],
    // The last feats. Dousing Spell: "you soak the target of the spell with water." with "If the target has Persistent Acid or Fire Damage, the DC to end
    // those conditions is reduced to 10, and the creature can attempt a flat check to end those types of persistent damage immediately."
    [/^you soak the target of the spell with water\.$/, () => ({ type: "douse", types: null, dc: null })],
    [/^If the target has @UUID\[[^\]]+\]\{Persistent ([A-Z][a-z]+) or ([A-Z][a-z]+) Damage\}, the DC to end those conditions is reduced to (\d+), and the creature can attempt a flat check to end those types of persistent damage immediately\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "douse"); if (!rider) return null; rider.types = [m[1].toLowerCase(), m[2].toLowerCase()]; rider.dc = Number(m[3]); return []; }],
    [/^The spell gains the water trait \(causing it to deal extra damage to creatures with weakness to water\)\.$/, m => ({ type: "table", text: m[0] })],
    // Shadow Spell: "choose one creature affected by the spell." with "This creature either gains a +2 status bonus to Stealth or takes a -2 status penalty to
    // Perception (your choice)." "This lasts for 1 round." and an enemy only on a hit or a failed save.
    [/^choose one creature affected by the spell\.$/, () => ({ type: "shadow-pick", options: null, rounds: null, enemiesIfHitOrFailed: false })],
    [/^This creature either gains a \+(\d+) status bonus to ([A-Z][a-z]+) or takes a [–-](\d+) status penalty to ([A-Z][a-z]+) \(your choice\)\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "shadow-pick"); if (!rider) return null;
            rider.options = [{ value: "bonus", label: `+${m[1]} status to ${m[2]}`, selector: m[2].toLowerCase(), modifier: Number(m[1]) }, { value: "penalty", label: `–${m[3]} status to ${m[4]}`, selector: m[4].toLowerCase(), modifier: -Number(m[3]) }]; return []; }],
    [/^This lasts for (\d+) rounds?\.$/, (m, riders) => { const rider = riders.findLast(entry => entry.type === "shadow-pick"); if (!rider) return null; rider.rounds = Number(m[1]); return []; }],
    [/^If the chosen creature is your enemy, it's affected only if your spell attack roll succeeded or if it failed its saving throw\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "shadow-pick"); if (!rider) return null; rider.enemiesIfHitOrFailed = true; return []; }],
    [/^(?:This choice and the effect occur after resolving any checks for the spell's initial effects|The effects of Shadow Spell end if you use Shadow Spell again)\.$/, (m, riders) => riders.some(entry => entry.type === "shadow-pick") ? [] : null],
    // Shared Sight: "all affected allies gain your spiritsense for 1 minute."
    [/^all affected allies gain your ([a-z]+) for (\d+) (minutes?|rounds?)\.$/, m => ({ type: "allies-sense", sense: m[1], rounds: duration(m[2], m[3]) })],
    // Sinbladed Spell: "a wound in the shape of your personal rune appears on the target, dealing additional persistent bleed damage equal to the spell's
    // rank, in addition to its regular effects." (on a hit or a failed save).
    [/^a wound in the shape of your personal rune appears on the target, dealing additional persistent ([a-z]+) damage equal to the spell's rank, in addition to its regular effects\.$/,
        m => ({ type: "persistent", when: "hit-or-failed", formula: "rank", damageType: m[1] })],
    // Spell Shroud: "you surround yourself in a 15-foot emanation of dense magical mist that lasts until the start of your next turn." with "All creatures within
    // the cloud become Concealed, and all creatures outside the cloud are concealed to creatures within it."
    [/^you surround yourself in a @Template\[emanation\|distance:(\d+)\] of dense magical mist that lasts until the start of your next turn\.$/, m => ({ type: "shroud", within: Number(m[1]), condition: null })],
    [new RegExp(String.raw`^All creatures within the cloud become ${COND}, and all creatures outside the cloud are concealed to creatures within it\.$`),
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "shroud"); if (!rider) return null; rider.condition = condition(m, 1); return []; }],
    // Vigorous Anthem: "you and all affected allies gain temporary HP equal to 3 + your Charisma modifier that last for 1 minute." (PF2e's Effect).
    [/^you and all affected allies gain temporary HP equal to \d+ \+ your [A-Z][a-z]+ modifier that last for \d+ minutes?\.$/, () => ({ type: "allies-effect", uuid: null, withCaster: true })],
    // Coven Spell (a reaction to an ally's casting): "If their spell deals damage and doesn't have a duration, you grant that spell a status bonus to damage equal
    // to its rank." with PF2e's Effect, for the ally; the spellshape option the table's.
    [/^(?:You rhyme with your ally's incantations or echo their movements, linking your magic to empower their spell in one of two ways:.*)$/, () => ({ type: "coven", uuid: null })],
    // Apparition's Reflection: "after casting the spell, you're Confused until the end of your next turn." (its slot and spell the table's).
    [new RegExp(String.raw`^Maintaining control after such a surge is difficult, however; after casting the spell, you're ${COND} until the end of your next turn\.$`),
        m => ({ type: "self-conditions", list: [{ ...condition(m, 1), until: "caster-next-turn-end" }] })],
    // The table's and the GM's.
    [/^(?:You regain one expended apparition spell slot .*|You then immediately cast an apparition spell .*|The number of actions required for Apparition's Reflection is .*|You gain an extra use of @UUID\[[^\]]+\]\{Drain Bonded Item\}|You can use it to cast a spell 2 or more ranks lower .*|it becomes a call|While the spell is active, one ally of your choice affected by the spell can respond to your call .*|Only one ally can respond to a given call, .*|Until the end of your turn, you gain a single spellshape feat .*|one ally of your choice who gains a status bonus from the spell can immediately use their reaction to .*|it becomes a harmonized composition|Unlike a normal composition, a harmonized composition .*|Casting another harmonized composition ends .*|You use @UUID\[[^\]]+\]\{Reach Spell\} or @UUID\[[^\]]+\]\{Widen Spell\} as a free action|You regain the use of a spell that was disrupted .*|You can change the area, targets, and other variables, .*|you use your shield as a locus to cast the spell, .*|You can choose for an adjacent ally to gain the benefits of the shield spell instead of yourself|If the ally would take damage from a physical attack while protected by your shield cantrip, .*|after that spell resolves, you can Cast another Spell as a free action|This spell must be cast from one of your halcyon spell slots .*|When you finish your daily preparations, choose a spell your familiar knows and one of your charges|Once before your next daily preparations, that creature can Cast the Spell as an innate spell; .*|that creature is another version of you|This creature remains the type of creature you summoned .*|The summoned creature gains a \+1 status bonus to any skill check .*|The creature also takes a [–-]2 penalty to all skills in which you're untrained|you can have it affect creatures .*)\.$/,
        m => ({ type: "table", text: m[0] })],
    [/^(?:select a non-cantrip spell in your spell repertoire that deals a different type of energy damage, and expend an additional spell slot of the same rank as this secondary spell|The spell you cast deals additional damage equal to the rank of the secondary spell slot expended|The spell's total damage is divided evenly between the energy type of the spell you cast and the energy type of the secondary spell|If the card you draw matches the suit of your active harrow omen, .*|When you Harrow Cast, attempt a @Check\[flat\|dc:\d+\]|If you fail this check, you lose your active harrow omen at the end of your turn|(?:Hammer|Key|Shield|Book|Star|Crown) .*|All creatures within your spellsurge aura become @UUID\[[^\]]+\]\{Concealed\}, and all creatures outside the aura are concealed to creatures within it|However, you can ignore this concealment|This effect lasts until the end of your next turn, but you can extend the duration .*|Draw a card from a harrow deck, then select a target within 60 feet|The card flies through the air to strike at that target, .*|The type of damage inflicted is determined by your active harrow omen; .*|The damage increases to 6d6 .*|You can continue to throw cards at targets on your turn .*|This effect lasts as long as you Sustain it, .*|If their spell doesn't have a spellshape effect applied to it, apply the effects of any one spellshape feat you know to the spell|The spellshape feat must be one that can be applied to the triggering spell, .*|Once the effect ends, you lose your active harrow omen|Hammers: .*)\.?$/,
        m => ({ type: "note", text: m[0] })],
    // Coven Spell's Effect linked before its second way: PF2e's Effect for the ally; the second way the GM's.
    [/^@UUID\[(Compendium\.pf2e\.feat-effects\.Item\.[A-Za-z0-9]+)\]\{(Effect: [^}]+)\} (If their spell doesn't have a spellshape effect applied to it, .*)$/,
        (m, riders) => { const coven = riders.findLast(entry => entry.type === "coven" && !entry.uuid); if (!coven) return null; coven.uuid = m[1]; coven.name = m[2]; return { type: "note", text: m[3] }; }],
    // Harrow Casting: its suits, the GM's (a harrow deck the module doesn't draw).
    [/^the suit of the card you draw enhances the spell in one of the following ways\.$/, m => ({ type: "note", text: m[0], harrow: true })],
    [/^(?:This effect only enhances single-target (?:offensive spells|spells cast on willing subjects).*|If you hit the target, or if they fail their saving throw, the spell inflicts additional force damage equal to the spell's rank|This additional damage doubles if your harrow omen is Hammers|Until the start of your next turn, you gain a \+1 status bonus to your AC and all saving throws|If your harrow omen is (?:Keys|Shields|Stars|Crowns), .*|You can attempt to Recall Knowledge about the target as a free action, .*|You gain a \+2 status bonus to this roll if Books is your harrow omen|The magic restores Hit Points to the affected target .*|Attempt a Fortune-Telling Lore check against all observer's Perception DCs|If your check is successful against an observer's Perception DC, .*|This hides only the spell's spellcasting actions and manifestations, not its effects)\.$/,
        (m, riders) => riders.some(entry => entry.harrow) ? { type: "note", text: m[0] } : null],
    // Wands. Wand of the Snowfields: "Snow lingers in the spell's area, remaining as difficult terrain for 1 minute."
    [/^Snow lingers in the spell's area, remaining as difficult terrain for (\d+) (minutes?|rounds?)\.$/, m => ({ type: "terrain", where: "area", difficult: true, hazard: null, rounds: duration(m[1], m[2]) })],
    // Wand of Hopeless Night: "Each creature that ends its turn within the spell's area must succeed at a DC 20 Will save or become Frightened 1 (Frightened 2
    // on a critical failure)." (the spell's area, for its duration).
    [new RegExp(String.raw`^Each creature that ends its turn within the spell's area must succeed at a @Check\[([a-z]+)\|dc:(\d+)\] save or become ${COND} \(${COND} on a critical failure\)\.$`),
        m => ({ type: "terrain", where: "area", difficult: false, rounds: "spell", hazard: { per: "turn-end-save", statistic: m[1], dc: Number(m[2]),
            outcomes: { criticalSuccess: "The creature is unaffected.", success: "The creature is unaffected.", failure: `The creature is @UUID[${m[3]}]{${m[4]} ${m[5]}}.`, criticalFailure: `The creature is @UUID[${m[6]}]{${m[7]} ${m[8]}}.` } } })],
    // Wand of Crushing Leaps: "When you land you shatter the ground, making each creature in a 5-foot emanation Off-Guard until the start of its next turn."
    // with "In addition, the space you land in and all squares in the emanation become difficult terrain for 1 minute." (the landing reported on its card).
    [new RegExp(String.raw`^When you land you shatter the ground, making each creature in a @Template\[emanation\|distance:(\d+)\] ${COND} until the start of its next turn\.$`),
        m => ({ type: "landing", feet: Number(m[1]), condition: condition(m, 2), terrainRounds: null })],
    [/^In addition, the space you land in and all squares in the emanation become difficult terrain for (\d+) (minutes?|rounds?)\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "landing"); if (!rider) return null; rider.terrainRounds = duration(m[1], m[2]); return []; }],
    [/^can jump up to \d+ feet\.$/, m => ({ type: "table", text: m[0] })],
    // Wand of Slaughter: "If the spell slays a living target, the corpse releases grim energy in a 20-foot emanation, dealing 14 void damage."
    [/^If the spell slays a living target, the corpse releases grim energy in a @Template\[emanation\|distance:(\d+)\], dealing @Damage\[(\d+)\[([a-z]+)\]\] damage\.$/,
        m => ({ type: "on-kill-burst", feet: Number(m[1]), formula: m[2], damageType: m[3], living: true })],
    // Wand of Mental Purification: "and can attempt to counteract one mental effect on the same target." with "Treat the Soothe spell's rank as 1 higher for
    // this counteract check."
    [/^can attempt to counteract one ([a-z]+) effect on the same target\.$/, m => ({ type: "counteract-effect", traits: [m[1]], rankBonus: 0 })],
    [/^Treat the @UUID\[[^\]]+\]\{[^}]+\} spell's rank as (\d+) higher for this counteract check\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "counteract-effect"); if (!rider) return null; rider.rankBonus = Number(m[1]); return []; }],
    // Arboreal Wand: "The wand attempts to counteract the lowest level affliction affecting your target." with "It uses your casting modifier and a counteract
    // rank of half the wand's item level rounded up." (one target the caster chooses).
    [/^After you cast the spell, the raw primal energy stored within the arboreal from which the wand was made washes over one target you choose and tries to purify its essence\.$/, () => []],
    [/^The wand attempts to counteract the lowest level affliction affecting your target\.$/, () => ({ type: "counteract-affliction", traits: [], anyAffliction: true, rank: "half-item-level" })],
    [/^It uses your casting modifier and a counteract rank of half the wand's item level rounded up\.$/, (m, riders) => riders.some(entry => entry.type === "counteract-affliction") ? [] : null],
    // Wand of Overflowing Life: "After you cast the spell, at the start of your next turn, excess healing magic wells up from the wand and heals you, as though
    // you cast the 1-action version of heal on yourself at 3rd-rank." with "You gain this benefit only once per turn, …".
    [/^After you cast the spell, at the start of your next turn, excess healing magic wells up from the wand and heals you, as though you cast the 1-action version of heal on yourself at (\d+)(?:st|nd|rd|th)-rank\.$/,
        m => ({ type: "turn-start-heal", rank: Number(m[1]), spell: "Heal", actions: 1 })],
    [/^You gain this benefit only once per turn, even if you cast multiple heal spells from wands of overflowing life in the same turn\.$/, (m, riders) => riders.some(entry => entry.type === "turn-start-heal") ? [] : null],
    // ---- Wands, automated (the user, 2026-10-05: "automate as much as you can") ----
    // Contagious Frailty: "After you cast the spell, if the target is Enfeebled, it releases a 10-foot emanation that doesn't include itself." with "Each creature
    // in that area must attempt a Fortitude save as if struck by the enfeeble but gets an outcome one degree of success better than it rolled."
    [new RegExp(String.raw`^After you cast the spell, if the target is ${COND}, it releases a @Template\[emanation\|distance:(\d+)\] that doesn't include itself\.$`),
        m => ({ type: "spread-save", ifCondition: m[2].toLowerCase(), feet: Number(m[4]), degreeBetter: false })],
    [/^Each creature in that area must attempt a [A-Z][a-z]+ save as if struck by the [a-z ]+ but gets an outcome one degree of success better than it rolled\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "spread-save"); if (!rider) return null; rider.degreeBetter = true; return []; }],
    // Wand of the Ash Puppet: "If the spell reduces a living creature to fine powder, you animate that creature's ashes into a Sulfur Zombie …" with its command,
    // and "The sulfur zombie crumbles into inanimate ash when reduced to 0 Hit Points or after 1 minute, whichever comes first."
    [/^If the spell reduces a living creature to fine powder, you animate that creature's ashes into a @UUID\[(Compendium\.[^\]]+)\]\{([^}]+)\} with the same general appearance as the disintegrated creature\.$/,
        m => ({ type: "ash-puppet", uuid: m[1], name: m[2], rounds: null })],
    [/^You can issue a verbal command to the sulfur zombie as a single action with the auditory and concentrate traits\.$/, m => ({ type: "table", text: m[0] })],
    [/^The sulfur zombie crumbles into inanimate ash when reduced to 0 Hit Points or after (\d+) (minutes?|rounds?), whichever comes first\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "ash-puppet"); if (!rider) return null; rider.rounds = duration(m[1], m[2]); return []; }],
    // Wand of Fey Flames: "Creatures affected by your faerie fire must succeed at a Will save against your spell DC or take a –2 status penalty …" with PF2e's Effect;
    // the range for enchantments and illusions the table's.
    [/^Creatures affected by your faerie fire must succeed at a ([A-Z][a-z]+) save against your spell DC or take a [–-] ?\d+ status penalty to their .* as long as they are affected by faerie fire ?\.$/,
        m => ({ type: "area-save-effect", statistic: m[1].toLowerCase(), uuid: null })],
    [/^(?:For the duration of the spell, you can use the limning flames as a source for your magic|You can cast an enchantment or illusion spell on such a creature up to a distance twice the spell's normal range|If the spell has a range of touch, or doesn't have a range, it is unaffected by the increase in range from the faerie fire ?)\.$/,
        m => ({ type: "table", text: m[0] })],
    [/^@UUID\[(Compendium\.pf2e\.equipment-effects\.Item\.[A-Za-z0-9]+)\]\{(Effect: [^}]+)\} Craft Requirements .*$/,
        (m, riders) => { const open = riders.findLast(entry => ["area-save-effect", "area-effect"].includes(entry.type) && !entry.uuid); if (!open) return null; open.uuid = m[1]; open.name = m[2]; return []; }],
    // Wand of Choking Mist: "They must hold their breath or start suffocating." with PF2e's Effect: Remaining Air (on the creatures in the mist).
    [/^They must hold their breath or start @UUID\[[^\]]+\]\{suffocating\}\.$/, () => ({ type: "area-effect", uuid: null, note: "Creatures in the mist hold their breath or suffocate." })],
    [/^@UUID\[(Compendium\.pf2e\.other-effects\.Item\.[A-Za-z0-9]+)\]\{(Effect: [^}]+)\} Craft Requirements .*$/,
        (m, riders) => { const open = riders.findLast(entry => entry.type === "area-effect" && !entry.uuid); if (!open) return null; open.uuid = m[1]; open.name = m[2]; return []; }],
    // Wand of Refracting Rays: "After you cast the spell, if you hit the target, the light refracts to another creature within 30 feet of the first target." with
    // its own rolls, its end on a miss, no creature twice.
    [/^After you cast the spell, if you hit the target, the light refracts to another creature within (\d+) feet of the first target\.$/, m => ({ type: "refract", feet: Number(m[1]) })],
    [/^(?:Roll your spell attack roll and to determine the ray's color separately for each target|The refraction ceases if you miss any target, and you can end the refraction at any point|You can't target the same creature more than once, and you must have line of effect to all targets)\.$/,
        (m, riders) => riders.some(entry => entry.type === "refract") ? [] : null],
    // Wand of Caustic Effluence: "If you cast this spell on an area, any creature that fails their Reflex save and falls Prone, or that begins their turn prone, takes
    // 1d6 acid damage." (the object uses: the GM's notes).
    [new RegExp(String.raw`^If you cast this spell on an area, any creature that fails their ([A-Z][a-z]+) save and falls ${COND}, or that begins their turn prone, takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage\.$`),
        m => ({ type: "prone-damage", formula: m[5], damageType: m[6], statistic: m[1].toLowerCase() })],
    // Wand of Thundering Echoes: "After you Cast the Spell, at the start of each of your turns, the sound echoes in the same area as if you had cast it again, though it
    // deals one fewer d10." with "This effect lasts until the damage is reduced to below 2d10."
    [/^After you Cast the Spell, at the start of each of your turns, the sound echoes in the same area as if you had cast it again, though it deals one fewer d(\d+)\.$/,
        m => ({ type: "echo-recast", faces: Number(m[1]), minDice: null })],
    [/^This effect lasts until the damage is reduced to below (\d+)d\d+\.$/, (m, riders) => { const rider = riders.findLast(entry => entry.type === "echo-recast"); if (!rider) return null; rider.minDice = Number(m[1]); return []; }],
    [/^The echoes don't affect structures or other items\.$/, m => ({ type: "table", text: m[0] })],
    // Wand of Shardstorm: "After you cast the spell, an additional shard or shards are released from the wand at the start of each of your turns, as though you cast
    // the 1-action version of force barrage ." with "Choose targets each time." and "This lasts for 1 minute, …".
    [/^After you cast the spell, an additional shard or shards are released from the wand at the start of each of your turns, as though you cast the (\d)-action version of force barrage ?\.$/,
        m => ({ type: "turn-start-barrage", actions: Number(m[1]), rounds: null })],
    [/^Choose targets each time\.$/, (m, riders) => riders.some(entry => entry.type === "turn-start-barrage") ? [] : null],
    [/^This lasts for (\d+) (minutes?|rounds?), until you're no longer wielding the wand, or until you try to activate the wand again\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "turn-start-barrage"); if (!rider) return null; rider.rounds = duration(m[1], m[2]); return []; }],
    // Wand of Hawthorn: "While Oaken Resilience lasts, any creature that hits the target with an unarmed Strike or otherwise touches it takes 1d4 piercing damage from
    // the thorns." with the engulfing creature's damage as the target's turns start.
    [/^While @UUID\[[^\]]+\]\{[^}]+\} lasts, any creature that hits the target with an unarmed Strike or otherwise touches it takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage from the thorns\.$/,
        m => ({ type: "thorns", formula: m[1], damageType: m[2] })],
    [/^A creature that has engulfed or swallowed the target takes this damage as well at the start of each of the target's turns\.$/, m => ({ type: "note", text: m[0] })],
    // Wand of Shocking Haze: "Each time a creature that's adjacent to you fails a flat check against the concealment from blur, they explode one of the orbs, causing them
    // to take 5 electricity damage."
    [/^Each time a creature that's adjacent to you fails a flat check against the concealment from blur, they explode one of the orbs, causing them to take @Damage\[(\d+)\[([a-z]+)\]\] damage\.$/,
        m => ({ type: "haze-orbs", formula: m[1], damageType: m[2] })],
    // Wand of the Spider: "Any creature that fails its Athletics check or Reflex save to navigate the web takes 1d6 poison damage."
    [/^Any creature that fails its Athletics check or Reflex save to navigate the web takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage\.$/, m => ({ type: "failed-check-damage", formula: m[1], damageType: m[2] })],
    // Wand of Traitorous Thoughts: "The first time the target rolls a success at a Deception check to mislead your probe, it gets a result one step worse than it rolled."
    [/^The first time the target rolls a success at a ([A-Z][a-z]+) check to mislead your probe, it gets a result one step worse than it rolled\.$/, m => ({ type: "first-success-worse", skill: m[1].toLowerCase() })],
    [/^This means you learn the answer if the target's Deception check would have succeeded, .*\.$/, (m, riders) => riders.some(entry => entry.type === "first-success-worse") ? [] : null],
    // Wand of Toxic Blades: "Damage from the wall also exposes the damaged creature to Cave Worm Venom." with "The poison uses its normal DC." and once per turn.
    [/^Damage from the wall also exposes the damaged creature to @UUID\[(Compendium\.pf2e\.equipment-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\}\.$/, m => ({ type: "damage-exposes", uuid: m[1], name: m[2] })],
    [/^(?:The poison uses its normal DC|A creature can be exposed to the poison no more than once per turn)\.$/, (m, riders) => riders.some(entry => entry.type === "damage-exposes") ? [] : null],
    // Wand of Chromatic Burst: "Additionally, the target can use the Chromatic Armor Burst action." with the action: one of its colors, the spell ends, a 20-foot
    // emanation of 4d6 of that color's type, basic Reflex against the spell DC.
    [/^Additionally, the target can use the Chromatic Armor Burst action\.$/, () => ({ type: "granted-burst", feet: null, formula: null, statistic: null })],
    [/^Chromatic Armor Burst 1 \(concentrate, light, magical\) Requirements .* Effect Choose one color of the @UUID\[[^\]]+\]\{Chromatic Armor\} the wand created for you\.$/, (m, riders) => riders.some(entry => entry.type === "granted-burst") ? [] : null],
    [/^The spell ends and light of that color flashes brightly in a @Template\[emanation\|distance:(\d+)\]\.$/, (m, riders) => { const rider = riders.findLast(entry => entry.type === "granted-burst"); if (!rider) return null; rider.feet = Number(m[1]); return []; }],
    [/^Creatures in the area take @Damage\[(\d+d\d+)\[untyped\]\] damage of the type associated with the color you chose, with a @Check\[([a-z]+)\|basic\] save against your spell DC\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "granted-burst"); if (!rider) return null; rider.formula = m[1]; rider.statistic = m[2]; return []; }],
    [/^This action has the trait corresponding to the damage type you chose\.$/, (m, riders) => riders.some(entry => entry.type === "granted-burst") ? [] : null],
    // Wand of Legerdemain: the activation after the cast — "Each enemy within 30 feet must attempt a Will save against your spell DC, …" with "On a failure, the creature
    // becomes Fascinated with you until the end of your next turn." (its other limits the table's).
    [/^Activate 1 \(emotion, illusion, light, manipulate\. mental, visual\) Requirements The last action you took this turn was to Cast a Spell from the wand Effect You make yourself the center of attention\.$/,
        () => ({ type: "spotlight", feet: null, statistic: null, condition: null })],
    [/^Each enemy within (\d+) feet must attempt a ([A-Z][a-z]+) save against your spell DC, receiving a \+4 circumstance bonus to the save if you or any of your allies recently threatened it or used hostile actions against it\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "spotlight"); if (!rider) return null; rider.feet = Number(m[1]); rider.statistic = m[2].toLowerCase(); return []; }],
    [new RegExp(String.raw`^On a failure, the creature becomes ${COND} with you until the end of your next turn\.$`),
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "spotlight"); if (!rider) return null; rider.condition = condition(m, 1); return []; }],
    [/^(?:The fascination ends if the target is subject to a hostile act, .*|You can't be @UUID\[[^\]]+\]\{Concealed\} while in the spotlight|The effect ends if you become @UUID\[[^\]]+\]\{Invisible\}, .*|You can Sustain this Activation for up to 1 minute|Since you need to keep performing tricks, Sustain an Activation has the manipulate trait)\.$/,
        m => ({ type: "table", text: m[0] })],
    // Wand of Teeming Ghosts: the reaction — "Trigger You successfully impart the Frightened 1 condition to a creature … Effect You end false vitality and increase the
    // creature's frightened condition value to 2." (its button).
    [/^During the duration of the spell, wisps that resemble spirits flit around you as long as you have any temporary Hit Points from false vitality , and you can use the following action\.$/, () => ({ type: "teeming", value: null })],
    [/^Activation F \(concentrate\) Trigger You successfully impart the @UUID\[[^\]]+\]\{Frightened 1\} condition to a creature Requirements You have at least 1 temporary Hit Point from false vitality Effect You end false vitality and increase the creature's frightened condition value to (\d+)\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.type === "teeming"); if (!rider) return null; rider.value = Number(m[1]); return []; }],
    // Wand of Shattering Images: "If the creature that destroyed the image is adjacent to you, it takes 5 slashing." (its button).
    [/^If the creature that destroyed the image is adjacent to you, it takes @Damage\[(\d+)\[([a-z]+)\]\]\.$/, m => ({ type: "image-shards", formula: m[1], damageType: m[2] })],
    // Wand of Rolling Flames: the ground flames — "A creature that moves on the ground takes 1 fire damage for every square of rolling flames it moves into." with its
    // turn-end damage and the Sustain's new flames (its card).
    [/^If you create the flame on the ground, the ground in the sphere's square and all adjacent squares are coated in rolling flames until the start of your next turn\.$/,
        () => ({ type: "terrain", where: "placed-square", difficult: true, hazard: null, until: "caster-turn-start" })],
    [/^These are difficult terrain and hazardous terrain\.$/, (m, riders) => riders.some(entry => entry.where === "placed-square") ? [] : null],
    [/^A creature that moves on the ground takes @Damage\[(\d+)\[([a-z]+)\]\] damage for every square of rolling flames it moves into\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.where === "placed-square"); if (!rider) return null; rider.hazard = { formula: m[1], damageType: m[2], per: "square", stationary: false }; return []; }],
    [/^If a creature in the flames doesn't move on its turn, it takes the damage for each of the squares it's in at the end of its turn\.$/,
        (m, riders) => { const rider = riders.findLast(entry => entry.where === "placed-square" && entry.hazard); if (!rider) return null; rider.hazard.stationary = true; return []; }],
    [/^The first time you Sustain the Spell each round, the sphere creates rolling flames again in its new location .*\.$/, (m, riders) => riders.some(entry => entry.where === "placed-square") ? [] : null],
    // Wand of Continuation: "its duration is increased by half." (the Effects the cast makes).
    [/^its duration is increased by half\.$/, () => ({ type: "duration-scale", factor: 1.5 })],
    // Cyrusian Wand: "If you spend 1 Mythic Point as part of this activation, resolve the spell's effects at mythic proficiency." (the caster's choice).
    [/^If you spend 1 Mythic Point as part of this activation, resolve the spell's effects at mythic proficiency\.$/, () => ({ type: "mythic-proficiency", optional: true })],
    // A wand's: "Each creature that fails its save takes 1d6 persistent fire damage."
    [/^Each creature that fails its save takes @Damage\[(\d+d\d+)\[persistent,([a-z]+)\]\] damage\.$/,
        m => ({ type: "persistent", degrees: ["failure", "criticalFailure"], formula: m[1], damageType: m[2] })]
];
// Sentences that only restate what PF2e or the cast already does.
const SKIP = [/^The spell gains the [a-z]+ trait\.$/, /^the (?:spell|force of the spell's [a-z]+) (?:explodes|unleashes|creates)[^.]*, in addition to its other effects\.$/, /^This is an? [a-z]+ effect\.$/,
    // (A wand's narration: no number, roll, condition, damage or save in it.)
    sentence => !/\d|@|\b(?:damage|save|saving|penalty|bonus|Hit Points|immune|condition)\b/i.test(sentence)];

/** The riders from the rider text (null when a sentence isn't read). */
export function readRiders(sentences) {
    const riders = [], claimed = [];
    for (const sentence of sentences) {
        const found = RIDERS.map(([pattern, build]) => ({ match: pattern.exec(sentence), build })).find(entry => entry.match);
        // (A sentence no rider form reads may only restate what PF2e does, or narrate.)
        if (!found && SKIP.some(pattern => typeof pattern === "function" ? pattern(sentence) : pattern.test(sentence))) { claimed.push(sentence); continue; }
        if (!found) return null;
        const made = found.build(found.match, riders);
        if (made == null) return null;
        riders.push(...[made].flat());
        claimed.push(sentence);
    }
    return riders.length ? { riders, claimed } : null;
}

/**
 * A wand's rider sentences: each read by a rider form, or — a rule of the wand's own the module doesn't apply (Wand of Shattering Images' glass
 * shards, Wand of Thundering Echoes' echoes) — a note for the GM; narration skipped. A wand whose every rule is a note is still read: the GM is told.
 */
function wandRiders(sentences, { narration = [] } = {}) {
    const riders = [], claimed = [];
    for (const sentence of sentences) {
        const found = RIDERS.map(([pattern, build]) => ({ match: pattern.exec(sentence), build })).find(entry => entry.match);
        const made = found ? found.build(found.match, riders) : null;
        if (made != null) { riders.push(...[made].flat()); claimed.push(sentence); continue; }
        // (Only the cast's own clause without "but" or "and" may narrate — "dazzling your target with the beam's intensity"; a sentence after it is a rule:
        // "its duration is increased by half".)
        const ruleWords = /\b(?:duration|increased?|half|double|actions?|forms?|benefits?|choose|select|reactions?|Sustain|Strikes?|attacks?|concealed|hit|target|you can|gain|first time)\b/i;
        const skippable = SKIP.filter(pattern => typeof pattern !== "function" || narration.includes(sentence) || !ruleWords.test(sentence));
        if (skippable.some(pattern => typeof pattern === "function" ? pattern(sentence) : pattern.test(sentence))) { claimed.push(sentence); continue; }
        riders.push({ type: "note", text: sentence, wandRule: true });
        claimed.push(sentence);
    }
    return { riders, claimed };
}

/** A spellshape feat: {slug, name, kind: "feat", requires, riders, claimed} or null — PF2e's wording, or the "+" modules' own (plus-spellshapes.js). */
export function readSpellshapeFeat(source) {
    return readOfficialSpellshape(source) ?? readPlusSpellshape(source);
}

function readOfficialSpellshape(source) {
    if (!(source?.system?.traits?.value ?? []).includes("spellshape")) return null;
    // (The action's link read as its name: "the next action you use is to @UUID[…]{Cast a Spell}".)
    const sentences = split(plain(source.system.description?.value ?? "").replace(/@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{(Cast a Spell)\}/g, "$1"))
        // ("Frequency once per hour If your next action is …": the frequency is the table's; the lead is the rest.)
        .map(sentence => sentence.replace(/^Frequency once per (?:hour|day|minute|round|\d+ minutes) (?=If (?:the |your )?next action)/, "")
            // ("Spend a Mythic Point; if the next action you use is …": the cost is the table's.)
            .replace(/^Spend a Mythic Point; if (?=the next action)/, "If ")
            // (Ostentatious Arrival's "is to Manifest your Eidolon as a three-action activity, or to Cast a 3-action summon or incarnate Spell": the cast is
            // what the module follows; the eidolon is the table's.)
            .replace(/ is to Manifest your Eidolon as a three-action activity, or to Cast /, " is to Cast ")
            // ("If the next spell you cast is a …": the same lead.)
            .replace(/^If the next spell you cast is /, "If your next action is to Cast "));
    const LEAD = /^If (?:(?:the |your )?next action (?:you (?:use|take|perform) )?(?:this turn )?is (?:to )?(?:use your divine font to )?|you use your next action to )(?:Cast|cast|casting) (.+?), (?:(?:the spell [a-z ]+, in addition to its other effects)|(.+))$/;
    const at = sentences.findIndex(sentence => LEAD.test(sentence));
    // (A spellshape action with no "If your next action …" — Apparition's Reflection, Knowledge of Shapes: each sentence read; its preconditions the
    // table's, its narration skipped.)
    if (at < 0) {
        const rules = sentences.filter(sentence => !/^(?:Requirements|Frequency|Trigger|Special) /.test(sentence) || /\bnext action\b/.test(sentence));
        const read = readRiders(rules);
        if (!read || !read.riders.every(rider => ["table", "note", "self-conditions", "coven"].includes(rider.type))) return null;
        if (read.riders.some(rider => rider.type === "coven" && !rider.uuid)) return null;
        return { slug: source.system.slug ?? null, name: source.name, kind: "feat", requires: {}, riders: read.riders, claimed: sentences };
    }
    const lead = LEAD.exec(sentences[at]);
    // (The requirement ends at the comma before the effect: "… a Spell that has no duration, and requires …, the spell explodes …".)
    const parts = /^(.*?)(?:, (?=the |any |all |you |each |it |that |unless |creatures |one |roll |increase |expand |its |until the start |pieces |reduce |choose |your |use mythic |Select any |select one |for \d+ minute|a garland |a number of |you can apply |then all |select acid|a glowing |attempt a @Check|select a |a wound ))(.*)$/.exec(sentences[at].replace(/^If (?:(?:the |your )?next action (?:you (?:use|take|perform) )?(?:this turn )?is (?:to )?(?:use your divine font to )?|you use your next action to )(?:Cast|cast|casting) /, ""));
    if (!parts) return null;
    let requires = readRequirements(parts[1]);
    const effect = [`${parts[2][0].toLowerCase()}${parts[2].slice(1)}`];
    const read = readRiders([...effect, ...sentences.slice(at + 1)]);
    if (!read) return null;
    // (A requirement the module doesn't check — "a bard cantrip or a bard spell that is at least 2 ranks lower than the highest-rank bard spell slot
    // you have" — is the table's when everything the feat does is too.)
    if (!requires && read.riders.every(rider => ["table", "slot-refund", "note", "rank-change", "mythic-proficiency"].includes(rider.type))) requires = { table: [parts[1]] };
    if (!requires) return null;
    if (read.riders.some(rider => (rider.type === "effect" || rider.type === "self-effect" || rider.type === "healed-effect" || (rider.type === "choose-one" && !rider.generated)) && !rider.uuid)) return null;
    if (read.riders.some(rider => rider.type === "martyr" && !rider.dice)) return null;
    if (read.riders.some(rider => rider.type === "area" && !rider.grow?.length)) return null;
    // (Energy Ablation's "an energy damage type of your choice": the types its requirement lists.)
    for (const rider of read.riders) if (rider.type === "self-resistance" && rider.choice === "energy") rider.choice = requires.damageTypesAny ?? null;
    if (read.riders.some(rider => (rider.type === "self-resistance" && (!rider.until || rider.choice === null)) || (rider.type === "drain-temp-hp" && !rider.rounds)
        || (rider.type === "tradition-benefit" && !(rider.arcane && rider.primal)))) return null;
    const alternative = read.riders.find(rider => rider.alternative)?.alternative;
    if (alternative) requires.alternative = alternative;
    const flavour = sentences.slice(0, at);
    // (A feat's Requirements, Frequency and Trigger are the table's preconditions — "Requirements You have line of effect to your animal companion
    // or another friendly animal within 60 feet."; anything else with a number, link, damage or save isn't flavour.)
    // (Before the lead, the costs and preconditions of using the feat are the table's: "Spend a Mythic Point.", "Your spellsurge ends.", "Instantly
    // destroy one undead minion within 60 feet that is permanently under your control.")
    const COSTS = /^(?:Spend a Mythic Point|Your spellsurge ends|Instantly destroy one undead minion within \d+ feet that is permanently under your control)\.$/;
    // (Quickened Casting's "Frequency once per day Bard If your next action is to cast a bard cantrip …, reduce the number of actions …": a class's
    // rule before the lead, read as the table's.)
    const tableOnly = sentence => readRiders([sentence])?.riders.every(rider => rider.type === "table") ?? false;
    // (A spell named in the flavour — "instead of summoning a generic troll with Summon Giant" — is no rule.)
    const unlinked = sentence => sentence.replace(/@UUID\[Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+\]\{([^}]+)\}/g, "$1");
    if (flavour.some(sentence => !COSTS.test(sentence) && !(/^(?:Requirements|Frequency|Trigger) /.test(sentence) && !/next action/.test(sentence)) && !tableOnly(sentence)
        && /\d|@|\b(?:damage|save|Speed)\b/.test(unlinked(sentence)))) return null;
    return { slug: source.system.slug ?? null, name: source.name, kind: "feat", requires, riders: read.riders, claimed: [sentences[at], ...read.claimed, ...flavour] };
}

/** A wand for any spell: what the spell must be ("The spell must have a casting time of 1 or 2 , can't have a duration, and must have an area of …"). */
export function readWandSpellRequirements(sentence) {
    const requires = {};
    const rest = sentence.replace(/^The spell must have /, "").replace(/\.$/, "").replace(/\s+,/g, ",")
        // (The area's list kept whole: "an area of burst (10 feet or more), cone, or line".)
        .replace(/must have an area of (burst \(\d+ feet or more\)), cone, or line/, "must have an area of burst|cone|line")
        .replace(/can't have the ((?:[a-z]+, )+)or ([a-z]+) traits/, (all, list, last) => `can't have the ${[...list.split(/,\s*/).filter(Boolean), last].join("|")} traits`);
    for (const clause of rest.split(/,\s*(?:and\s+)?|\s+and\s+(?=(?:must|can't|it)\b)/).map(entry => entry.trim()).filter(Boolean)) {
        let m;
        if ((m = /^a casting time of (\d) or (\d)$/.exec(clause))) requires.actions = [Number(m[1]), Number(m[2])];
        else if (/^can't have a duration$/.test(clause)) requires.noDuration = true;
        else if ((m = /^must have an area of ([a-z|]+)$/.exec(clause))) { requires.area = true; requires.areaTypes = m[1].split("|"); }
        else if (/^must have a range$/.test(clause)) requires.ranged = true;
        else if (/^it must deal damage$/.test(clause)) requires.damaging = true;
        else if ((m = /^it can't have the ([a-z|]+) traits$/.exec(clause))) requires.notTraits = m[1].split("|");
        else if ((m = /^a casting time of (\d) or (\d) and (.+)$/.exec(clause))) { requires.actions = [Number(m[1]), Number(m[2])]; requires.table = [...(requires.table ?? []), m[3]]; }
        // (Any other crafting limit — "a duration no less than 10 minutes and no greater than 1 hour" — is the table's.)
        else requires.table = [...(requires.table ?? []), clause];
    }
    return requires;
}

/** A wand changing its spell: {name, kind: "wand", spell: {name, uuid}, riders, claimed} or null. */
export function readWand(source) {
    if (!(source?.system?.traits?.value ?? []).includes("wand")) return null;
    const sentences = split(plain(source.system.description?.value ?? ""));
    const CAST = /^Activate (?:@UUID\[[^\]]+\]\{)?Cast a Spell\}? Frequency [Oo]nce per day, plus overcharge Effect You cast (?:an? )?(?:\d+(?:st|nd|rd|th)-rank )?(?:@UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\}|([a-z][a-z ]+?) ?)(?: at (?:the indicated rank|\d+(?:st|nd|rd|th)[- ]rank)| of the (?:indicated|appropriate) (?:rank|level))?(?:,? (but |and )(.+?)|, (.+?))?\.$/;
    // (A wand for any spell: "Activate Cast a Spell; This activation takes 2 if … Effect You Cast the Spell, and increase its area.")
    const ANY = /^Activate Cast a Spell(?:; (?:[Tt]he|This) activation takes [^.]*?)? Frequency [Oo]nce per day, plus overcharge Effect You Cast the Spell(?: at the indicated rank)?(?:, (?:and )?(.+?))?\.$/;
    const anyAt = sentences.findIndex(sentence => ANY.test(sentence));
    if (anyAt >= 0) {
        const any = ANY.exec(sentences[anyAt]);
        const craftAt = sentences.findIndex(sentence => /^Craft Requirements /.test(sentence));
        const riderSentences = [...(any[1] ? [`${any[1]}.`] : []), ...sentences.slice(anyAt + 1, craftAt < 0 ? undefined : craftAt)];
        // (A wand that only casts its spell — Magic Wand — has nothing to read.)
        const read = riderSentences.length ? wandRiders(riderSentences) : { riders: [], claimed: [] };
        if (!read || read.riders.some(rider => rider.type === "area" && !rider.grow?.length && !rider.lineWidth)) return null;
        // (The spell it takes: the wand's rank — "Wand of Widening (1st-Rank Spell)" — and its Craft Requirements' "The spell must have …".)
        const rank = /\((\d+)(?:st|nd|rd|th)[- ][Rr]ank/.exec(source.name);
        const must = sentences.slice(craftAt + 1).find(sentence => /^The spell must have /.test(sentence));
        const requires = must ? readWandSpellRequirements(must) : {};
        if (!requires) return null;
        if (rank) requires.rank = Number(rank[1]);
        return { name: source.name, kind: "wand", spell: null, requires, riders: read.riders, claimed: [sentences[anyAt], ...read.claimed, ...(must ? [must] : [])] };
    }
    const at = sentences.findIndex(sentence => CAST.test(sentence));
    // (A holder for wands — the wand cane — changes no spell: the table's.)
    if (at < 0 && sentences.some(sentence => /with a slot at the top to insert a wand/.test(sentence)))
        return { name: source.name, kind: "wand", spell: null, requires: {}, riders: [{ type: "table", text: "a holder for a wand" }], claimed: sentences };
    if (at < 0) return null;
    const cast = CAST.exec(sentences[at]);
    const craft = sentences.findIndex(sentence => /^Craft Requirements /.test(sentence));
    // (", but the spell's area is twice as wide (…) and creatures that fail their save are Off-Guard for 1 round": each clause a rider sentence; ", and can
    // attempt to counteract …" one; without either, the clause narrates: "dazzling your target with the beam's intensity".)
    const clause = cast[5] ?? cast[6] ?? null;
    const but = clause ? (cast[4] === "but " ? clause.split(/ and (?=creatures |the spell's |each )/) : [clause]).map(text => `${text}.`) : [];
    const riderSentences = [...but, ...sentences.slice(at + 1, craft < 0 ? undefined : craft)];
    const read = riderSentences.length ? wandRiders(riderSentences, { narration: cast[4] === "but " ? [] : but }) : { riders: [], claimed: [] };
    if (!read) return null;
    if (read.riders.some(rider => rider.type === "effect" && !rider.uuid)) return null;
    const spellName = cast[2] ?? cast[3].replace(/\b[a-z]/g, letter => letter.toUpperCase());
    // (Its spell: a wand armed by its card — one PF2e keeps no spell in — applies only to that spell's casting.)
    return { name: source.name, kind: "wand", spell: { uuid: cast[1] ?? null, name: spellName }, requires: { spells: [spellName] }, riders: read.riders, claimed: [sentences[at], ...read.claimed] };
}

/**
 * Whether the cast spell meets the requirements, from the facts of the spell as PF2e shaped it: {cantrip, damageTypes, area: {type, value} | null,
 * hasDuration, saveStatistic, singleTarget, traits}. Returns null when it does, else the first unmet requirement's words.
 */
export function unmetRequirement(requires, facts) {
    const unmet = unmetBase(requires, facts);
    // (Spiritual Expansion Spell: an emanation with a duration qualifies too.)
    const alternative = requires?.alternative;
    if (unmet && alternative && alternative.areaTypes.includes(facts.area?.type) && (!alternative.hasDuration || facts.hasDuration)) return null;
    return unmet;
}

// (A kind of spell PF2e marks with other traits: a "grave spell" is a necromancer's focus spell; a "conflux spell", a magus's focus spell — the remaster dropped the trait.)
const TRAIT_ALIASES = { grave: ["focus", "necromancer"], conflux: ["focus", "magus"] };
const hasTrait = (facts, trait) => facts.traits.includes(trait) || (TRAIT_ALIASES[trait]?.every(alias => facts.traits.includes(alias)) ?? false);

function unmetBase(requires, facts) {
    // (A wand for any spell: "Wand of Widening (1st-Rank Spell)", "a casting time of 1 or 2".)
    if (requires.rank && facts.rank != null && Number(facts.rank) !== requires.rank) return `it isn't cast at rank ${requires.rank}`;
    if (requires.maxRank && facts.rank != null && Number(facts.rank) > requires.maxRank) return `it's above rank ${requires.maxRank}`;
    if (requires.minRank && facts.rank != null && Number(facts.rank) < requires.minRank) return `it's below rank ${requires.minRank}`;
    // ("a Spell that is at least 2 ranks below your maximum rank")
    if (requires.belowHighest && facts.highest != null && facts.rank != null && Number(facts.highest) - Number(facts.rank) < requires.belowHighest) return `it isn't ${requires.belowHighest} ranks below the highest you can cast`;
    if (requires.actions && facts.actions != null && !requires.actions.includes(facts.actions)) return `it doesn't take ${requires.actions.join(" or ")} actions`;
    if (requires.spells && !requires.spells.some(name => name.toLowerCase() === String(facts.name ?? "").toLowerCase())) return `it isn't ${requires.spells.join(" or ")}`;
    if (requires.nonCantrip && facts.cantrip) return "a cantrip";
    if (requires.damaging && !facts.damageTypes.length) return "it deals no damage";
    if (requires.damageType && !facts.damageTypes.includes(requires.damageType)) return `it deals no ${requires.damageType} damage`;
    if (requires.damageTypesAny && !requires.damageTypesAny.some(type => facts.damageTypes.includes(type))) return `it deals no ${requires.damageTypesAny.join(", ")} damage`;
    if (requires.traits && !requires.traits.every(trait => hasTrait(facts, trait))) return `it isn't a ${requires.traits.join(" ")} spell`;
    if (requires.area && !facts.area) return "it has no area";
    if (requires.areaTypes && !requires.areaTypes.includes(facts.area?.type)) return `its area isn't a ${requires.areaTypes.join(", ")}`;
    if (requires.noDuration && facts.hasDuration) return "it has a duration";
    if (requires.singleTarget && !facts.singleTarget) return "it doesn't target a single creature";
    if (requires.onlyOne && !facts.singleTarget && (facts.targeted || facts.area)) return "it affects more than one creature";
    if (requires.saves && !requires.saves.includes(facts.saveStatistic)) return `it doesn't require a ${requires.saves.join(" or ")} save`;
    if ((requires.notTraits ?? []).some(trait => facts.traits.includes(trait))) return `it has the ${requires.notTraits.find(trait => facts.traits.includes(trait))} trait`;
    if (requires.traitOrDamage && !facts.traits.includes(requires.traitOrDamage) && !facts.damageTypes.includes(requires.traitOrDamage)) return `it has no ${requires.traitOrDamage}`;
    if (requires.anyTraits && !requires.anyTraits.some(trait => facts.traits.includes(trait))) return `it has none of the ${requires.anyTraits.join(", ")} traits`;
    if (requires.fromSlots && facts.fromSlots === false) return "it isn't cast from a spell slot";
    if (requires.attack && facts.attack === false) return "it has no spell attack roll";
    // ("a Spell that requires a save")
    if (requires.hasSave && !facts.saveStatistic) return "it requires no save";
    if (requires.ranged && !facts.range) return "it has no range";
    if (requires.targeted && !facts.targeted) return "it has no targets";
    if (requires.beyondTouch && (!facts.range || /^touch$/i.test(facts.range))) return "its range isn't farther than touch";
    // (The items' "a prepared Spell", "a healing spell that restores Hit Points".)
    if (requires.prepared && facts.prepared === false) return "it isn't a prepared spell";
    if (requires.healing && facts.healing === false) return "it restores no Hit Points";
    // ("a Spell with a range or area of effect"; "Your cursebound value is 2 or greater and you're in an encounter".)
    if (requires.rangeOrArea && !facts.range && !facts.area) return "it has no range or area";
    if (requires.minCursebound && facts.cursebound != null && facts.cursebound < requires.minCursebound) return `your cursebound value is below ${requires.minCursebound}`;
    if (requires.inEncounter && facts.inEncounter === false) return "you aren't in an encounter";
    if (requires.raging && facts.raging === false) return "you aren't raging";
    if (requires.inArcaneCascade && facts.inArcaneCascade === false) return "you aren't in Arcane Cascade";
    if (requires.fromWand && facts.fromWand === false) return "it isn't cast from a wand";
    if (requires.heavyArmor && facts.heavyArmor === false) return "you aren't wearing heavy armor";
    // ("Your mystic link is active"; Linked Target Spell's "a cantrip or a spell that is at least 1 rank lower than the highest-rank spell slot you have".)
    if (requires.mysticLink && facts.mysticLink === false) return "your mystic link isn't active";
    // (A wicket's "while within the area" of its dominion, "from Focus Points or spell slots".)
    if (requires.inWicketDominion && facts.inWicketDominion === false) return "you aren't within your wicket's dominion";
    if (requires.fromSlotsOrFocus && facts.fromSlots === false && !facts.fromFocus) return "it isn't cast from a spell slot or Focus Points";
    // (Reporting Spell's "with a spell attack roll or a save".)
    if (requires.attackOrSave && facts.attack === false && !facts.saveStatistic) return "it has no spell attack roll or save";
    // (Spell Tag's "a Spell with a range of touch".)
    if (requires.touchOnly && !/^touch$/i.test(String(facts.range ?? ""))) return "its range isn't touch";
    if (requires.belowHighestOrCantrip && !facts.cantrip && facts.highest != null && facts.rank != null && Number(facts.highest) - Number(facts.rank) < requires.belowHighestOrCantrip) return `it isn't a cantrip or ${requires.belowHighestOrCantrip} rank below the highest you can cast`;
    return null;
}
