// The third-party ("+" modules) spellshape feats and actions, worded their own way (docs/planning/third-party-features-audit.md): each read from its whole text into
// the spellshape runtime's requirements and riders. A text no form here reads stays unread.
import { plainApostrophes as plain } from "./text-patterns.js";

// (The leading Frequency: the table's. A leading Requirements: the table's too, unless the form reads it — Storm Spell's cursebound value.)
// (Conditions a "+" text names without a link: PF2e's.)
const CONDITIONS = { frightened: "Compendium.pf2e.conditionitems.Item.TBSHQspnbcqxsmjL", fleeing: "Compendium.pf2e.conditionitems.Item.sDPxOjQ9kx2RZE8D" };
const lead = text => text.replace(/^Frequency once per (?:hour|day|minute|round|\d+ minutes) /, "");
const REQUIREMENT = /^Requirements? ([^.]+)\. /;
// (A Magus+ requirement that runs into the text without its full stop: "Requirements … your Spellstrike is charged The appearance …".)
const REQUIREMENT_UNSTOPPED = /^Requirements ([^.]+?Spellstrike is charged) (?=[A-Z])/;
// (One with links in it — "… are in @UUID[Compendium.magus…]{Arcane Cascade+} stance …": their full stops aren't the sentence's.)
const REQUIREMENT_LINKED = /^Requirements ((?:[^.@]|@UUID\[[^\]]+\]\{[^}]+\})+)\. /;

// Magus+'s Spellstrike variants: "Make a Spellstrike" — a 1- or 2-action spell with a spell attack or a save, delivered by the Strike (spell-actions-runtime.js); their
// requirements: Arcane Cascade and heavy armor checked, the rest ("your Spellstrike is charged", "wielding a weapon in the flail group") the table's.
function spellstrikeRequires(requirement, extra = {}) {
    const text = String(requirement ?? "").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/Arcane Cascade\+/g, "Arcane Cascade");
    const requires = { actions: [1, 2], attackOrSave: true, ...extra };
    if (/\bin Arcane Cascade\b/.test(text)) requires.inArcaneCascade = true;
    if (/wearing heavy armor/.test(text)) requires.heavyArmor = true;
    const table = text.split(/,\s*(?:and\s+)?|\s+and\s+(?=(?:your|you|are)\b)/).map(part => part.trim()).filter(part => part && !/\bin Arcane Cascade\b|wearing heavy armor/.test(part));
    if (table.length) requires.table = [...(extra.table ?? []), ...table];
    return requires;
}
// ("you can cast at least one spell that deals energy damage (acid, cold, electricity, fire, force, negative, positive, or sonic)": PF2e's remastered names.)
const REMASTERED = { negative: "void", positive: "vitality" };
const energyList = text => text.split(/,\s*(?:or\s+)?/).map(type => REMASTERED[type.trim()] ?? type.trim()).filter(Boolean);
const STATUS_PENALTY = /The target takes a [–-](\d) status penalty to its Will saves and a [–-](\d) status penalty to fear effects until the end of your next turn\./;
const imposingRows = (critical, success) => Object.fromEntries([["criticalSuccess", critical], ["success", success]].map(([degree, m]) => [degree, [{ type: "target-rules", label: "Imposing Spellstrike", until: "caster-next-turn-end",
    rules: [{ key: "FlatModifier", selector: "will", type: "status", value: -Number(m[1]) }, { key: "FlatModifier", selector: "all", type: "status", value: -Number(m[2]), predicate: ["fear"] }] }]]));

const FORMS = [
    // Persistent Spell: "If your next action is to Cast a Spell that targets a single creature and deals damage, that creature takes additional persistent damage equal
    // to twice the spell's rank, matching the damage type of the spell if they fail their saving throw, or your attack roll is a success. If they critically fail their
    // save or you critically succeed on the attack roll, the persistent damage is doubled. If a spell would deal more than one type of damage, you must choose one of the
    // damage types for this persistent damage."
    [/If your next action is to Cast a Spell that targets a single creature and deals damage, that creature takes additional persistent damage equal to (twice|three times) the spell's rank, matching the damage type of the spell if they fail their saving throw, or your attack roll is a success\. If they critically fail their save or you critically succeed on the attack roll, the persistent damage is doubled\. If a spell would deal more than one type of damage, you must choose one of the damage types for this persistent damage\.$/,
        m => ({ requires: { singleTarget: true, damaging: true }, riders: [{ type: "persistent", when: "hit-or-failed", formula: `${m[1] === "twice" ? 2 : 3}*rank`, damageType: "spell", critDouble: true }] })],
    // Bleeding Spell: "If the next action you use is to Cast a Spell from your spell slots that targets at least one creature, the spell deals persistent bleed damage
    // equal to the spell rank to one creature of your choice if the creature fails its save or your spell attack roll is successful. This choice is made when you Cast
    // the Spell."
    [/If the next action you use is to Cast a Spell from your spell slots that targets at least one creature, the spell deals persistent ([a-z]+) damage equal to the spell rank to one creature of your choice if the creature fails its save or your spell attack roll is successful\. This choice is made when you Cast the Spell\.$/,
        m => ({ requires: { fromSlots: true, targeted: true }, riders: [{ type: "persistent", when: "hit-or-failed", formula: "rank", damageType: m[1], oneTarget: true }] })],
    // Trepidation Spell: "If your next action is to Cast a Spell that is at least 2 ranks below your maximum rank and requires a Will save, the creature is also
    // Frightened 1 on a failure or Frightened 2 on a critical failure. If the creature is immune to emotion, fear, or mental effects, it is immune to this frightened
    // condition."
    [/If your next action is to Cast a Spell that is at least (\d) ranks below your maximum rank and requires an? (Fortitude|Reflex|Will) save, the creature is also @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+) (\d)\} on a failure or @UUID\[\3\]\{\4 (\d)\} on a critical failure\. If the creature is immune to ((?:[a-z]+, )*[a-z]+,? or [a-z]+) effects, it is immune to this [a-z]+ condition\.$/,
        m => ({ requires: { belowHighest: Number(m[1]), saves: [m[2].toLowerCase()] },
            riders: [{ type: "conditions", unlessImmune: m[7].split(/,\s*(?:or\s+)?|\s+or\s+/).map(entry => entry.trim()).filter(Boolean),
                degrees: { failure: [{ uuid: m[3], slug: m[4].toLowerCase(), value: Number(m[5]) }], criticalFailure: [{ uuid: m[3], slug: m[4].toLowerCase(), value: Number(m[6]) }] } }] })],
    // Heightened Spell: "If the next action you use is to Cast a Spell that is at least 3 ranks lower than the highest-rank spell slot you have, you treat the rank of the
    // spell as 2 higher for the purposes of numerical effects based on its heightened rank, such as damage, healing, increased area, bonuses, or penalties. You do not
    // gain any other effects associated with the heightened rank, …"
    [/If the next action you use is to Cast a Spell that is at least (\d) ranks lower than the highest-rank spell slot you have, you treat the rank of the spell as (\d) higher for the purposes of numerical effects based on its heightened rank, such as damage, healing, increased area, bonuses, or penalties\. (You do not gain any other effects associated with the heightened rank, such as being able to target more creatures or treating the spell as a higher level for the purposes of counteracting or the incapacitation trait\.)$/,
        m => ({ requires: { belowHighest: Number(m[1]) }, riders: [{ type: "rank-change", by: Number(m[2]) }, { type: "note", wandRule: true, text: m[3] }] })],
    // Dueling Wand: "If your next action is to Cast a Spell that would require a spell attack roll, you gain a +1 status bonus to your spell attack roll. If the spell has
    // multiple targets, the status bonus applies to all of them. If you are at least 10th level, the status bonus increases to +2, and if you are at least 18th level the
    // status bonus increases to +3."
    [/If your next action is to Cast a Spell that would require a spell attack roll, you gain a \+(\d) status bonus to your spell attack roll\. If the spell has multiple targets, the status bonus applies to all of them\. If you are at least (\d+)th level, the status bonus increases to \+(\d), and if you are at least (\d+)th level the status bonus increases to \+(\d)\.$/,
        m => ({ requires: { attack: true }, riders: [{ type: "self-rules", label: "spell attack bonus", thisTurn: true,
            rules: [{ key: "FlatModifier", selector: "spell-attack", type: "status", value: { byLevel: [[1, Number(m[1])], [Number(m[2]), Number(m[3])], [Number(m[4]), Number(m[5])]] } }] }] })],
    // Draining Cast: "If your next action is to Cast a Spell, you don't expend the triggering spell slot, but instead reduce your Hit Points by twice the rank of the spell.
    // This is not damage and thus cannot be reduced, resisted, or otherwise mitigated in any way, otherwise the spell fails."
    [/If your next action is to Cast a Spell, you don't expend the triggering spell slot, but instead reduce your Hit Points by (twice|three times) the rank of the spell\. This is not damage and thus cannot be reduced, resisted, or otherwise mitigated in any way, otherwise the spell fails\.$/,
        m => ({ requires: { fromSlots: true }, riders: [{ type: "slot-refund" }, { type: "hp-cost", formula: `${m[1] === "twice" ? 2 : 3}*rank` }] })],
    // Befuddling Spell: "If the next action you spend is to Cast a Spell, all creatures take a –4 circumstance penalty to Identify the Magic, as well as a –2 circumstance
    // penalty to Counteract the spell."
    [/If the next action you spend is to Cast a Spell, all creatures take a [–-](\d) circumstance penalty to @UUID\[[^\]]+\]\{Identify the Magic\}, as well as a [–-](\d) circumstance penalty to Counteract the spell\.$/,
        // (Other creatures' checks against the spell: the GM's note at the cast.)
        m => ({ requires: {}, riders: [{ type: "note", wandRule: true, text: `All creatures take a –${m[1]} circumstance penalty to Identify the Magic of this spell and a –${m[2]} circumstance penalty to counteract it.` }] })],
    // Heroic Recovery+: PF2e's Heroic Recovery with "At 16th level, the status bonus to speed increases to a +10- foot status bonus and the status bonus to
    // attack rolls increases to +2." — PF2e's Effect, its values raised at that level.
    [/If the next action you use is to cast @UUID\[Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+\]\{(Heal)\} targeting a single living creature and the target regains Hit Points from the spell, the target also gains three bonuses until the end of its next turn: a \+(\d+)-foot status bonus to its Speed, a \+(\d+) status bonus to attack rolls, and a \+(\d+) status bonus to damage rolls\. (In addition, if the target is @UUID\[[^\]]+\]\{Prone\}, it can immediately Stand as a free action that doesn't trigger reactions\.) At (\d+)th level, the status bonus to speed increases to a \+(\d+)- ?foot status bonus and the status bonus to attack rolls increases to \+(\d+)\. @UUID\[(Compendium\.pf2e\.feat-effects\.Item\.[A-Za-z0-9]+)\]\{Effect: [^}]+\}$/,
        m => ({ requires: { spells: [m[1]], singleTarget: true, targetTraits: ["living"] }, riders: [
            { type: "healed-effect", uuid: m[9], atLevel: { level: Number(m[6]), rules: [{ key: "FlatModifier", selector: "land-speed", type: "status", value: Number(m[7]) },
                { key: "FlatModifier", selector: "attack", type: "status", value: Number(m[8]) }, { key: "FlatModifier", selector: "damage", type: "status", value: Number(m[4]) }] } },
            { type: "table", text: m[5].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") }] })],
    // Mighty Summons: "If your next action is to cast a summon spell from your summoner spell slots, you can summon creatures as if the spell you cast were 1
    // rank higher." with Act Together's casting (the table's) and the Special past 10th rank (the GM's note).
    [/If your next action is to cast a (summon) spell from your ([a-z]+) spell slots, you can summon creatures as if the spell you cast were (\d) rank higher\. (If you use @UUID\[[^\]]+\]\{Act Together\} to Cast a Spell with the summon trait, this spellshape applies to the spell you cast so long as it was the immediate preceding action to your Act Together\.) Special (If this would summon creatures of a rank higher than a rank 10 spell, such as if you have @UUID\[[^\]]+\]\{Legendary Summoner\}, it instead summons a creature two levels higher than the level specified\.)$/,
        m => ({ requires: { anyTraits: [m[1]], fromSlots: true, table: [`from your ${m[2]} spell slots`] }, riders: [{ type: "rank-change", by: Number(m[3]), cap: 10 },
            { type: "table", text: m[4].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") }, { type: "note", wandRule: true, text: m[5].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") }] })],
    // Storm Spell: "If your next action is to Cast a Spell with the air, cold, electricity, or water traits that targets an area, you transform it into a storm
    // spell. The area of the spell becomes difficult terrain and hazardous terrain for a number of rounds equal to your cursebound value. A creature that moves
    // through the area takes damage equal to the spell's rank for every square of that area it moves through. This damage is electricity damage or bludgeoning
    // damage, chosen when you Cast the Spell." Its Requirements: "Your cursebound value is 2 or greater and you're in an encounter."
    [/If your next action is to Cast a Spell with the ((?:[a-z]+, )+)or ([a-z]+) traits that targets an area, you transform it into a [a-z]+ spell\. The area of the spell becomes difficult terrain and hazardous terrain for a number of rounds equal to your cursebound value\. A creature that moves through the area takes damage equal to the spell's rank for every square of that area it moves through\. This damage is ([a-z]+) damage or ([a-z]+) damage, chosen when you Cast the Spell\.$/,
        (m, { requirement }) => {
            const need = /^Your cursebound value is (\d) or greater and you're in an encounter$/.exec(requirement ?? "");
            if (!need) return null;
            return { requires: { anyTraits: [...m[1].split(/,\s*/).filter(Boolean), m[2]], area: true, minCursebound: Number(need[1]), inEncounter: true },
                riders: [{ type: "terrain", where: "area", difficult: true, hazard: { formula: "rank", damageTypes: [m[3], m[4]], per: "square" }, rounds: "cursebound" }] };
        }, { readsRequirement: true }],
    // Travel Channel: "If the next action you use is to cast a spell from your divine font slots, you can Stride up to half your Speed before you Cast the
    // Spell." — the caster's move (the table's).
    [/If the next action you use is to cast a spell from your divine font slots, (you can Stride up to half your Speed before you Cast the Spell)\.$/,
        m => ({ requires: { table: ["a spell from your divine font slots"] }, riders: [{ type: "table", text: `${m[1][0].toUpperCase()}${m[1].slice(1)}.` }] })],
    // Ride the Spell: "If your next action is to Cast a Spell with a range or area of effect, you ride atop it to its destination, moving alongside it up to 60
    // feet. …" — the caster's move (the table's), the spell checked for a range or area.
    [/If your next action is to Cast a Spell with a range or area of effect, (you ride atop it to its destination, moving alongside it up to \d+ feet\. This movement ignores any difficult or greater difficult terrain and allows you to travel over obstacles or gaps, flying above them and landing in a square adjacent to your spell's target or destination\. If the spell you cast was an area of effect, you can choose to end your movement within the area or at a square adjacent to the affected area\.)$/,
        m => ({ requires: { rangeOrArea: true }, riders: [{ type: "table", text: `${m[1][0].toUpperCase()}${m[1].slice(1)}` }] })],
    // Slot Rehearsed Reload: "If your next action is to Cast a Spell from one of your wizard spell slots, you can Interact to reload the firearm of your
    // makeshift spellgun as part of casting the spell." — the caster's Interact (the table's).
    [/If your next action is to Cast a Spell from one of your ([a-z]+) spell slots, (you can Interact to reload the firearm of your makeshift spellgun as part of casting the spell)\.$/,
        m => ({ requires: { fromSlots: true, table: [`from one of your ${m[1]} spell slots`] }, riders: [{ type: "table", text: `${m[2][0].toUpperCase()}${m[2].slice(1)}.` }] })],
    // Safe Spell: "If your next action is to Cast a Spell with no duration, that deals damage, and has an area, you can designate 2 allies to exclude from the
    // spell's effect." with "At 10th level, and every 4 levels thereafter, you can exclude an additional ally from the area of the spell." — the allies picked on
    // the card, excluded.
    [/If your next action is to Cast a Spell with no duration, that deals damage, and has an area, you can designate (\d+) allies to exclude from the spell's effect\. At (\d+)th level, and every (\d+) levels thereafter, you can exclude an additional ally from the area of the spell\.$/,
        m => ({ requires: { noDuration: true, damaging: true, area: true }, riders: [{ type: "exclude-allies", count: { base: Number(m[1]), from: Number(m[2]), every: Number(m[3]) } }] })],
    // Compressed Spell: "If your next action is to Cast a Spell that affects a burst, cone, or line, has no duration, and requires a save, you can alter the spell
    // area to instead target a single creature that would be within the area of effect and the creature takes a –2 status penalty to its save against the spell.
    // If the size of the burst, cone, or line is greater than 30 feet, 45 feet, or 60 feet respectively, it takes a –3 status penalty to its save instead." — the
    // one creature picked on the card, the others excluded; its penalty for that save. (The module's Effect makes the –3 untyped and lasting: the text's here.)
    [/If your next action is to Cast a Spell that affects a burst, cone, or line, has no duration, and requires a save, you can alter the spell area to instead target a single creature that would be within the area of effect and the creature takes a [–-](\d) status penalty to its save against the spell\. If the size of the burst, cone, or line is greater than (\d+) feet, (\d+) feet, or (\d+) feet respectively, it takes a [–-](\d) status penalty to its save instead\.(?: @UUID\[[^\]]+\]\{Effect: [^}]+\})?$/,
        m => ({ requires: { area: true, areaTypes: ["burst", "cone", "line"], noDuration: true, saves: ["fortitude", "reflex", "will"] },
            riders: [{ type: "compress", penalty: Number(m[1]), over: { burst: Number(m[2]), cone: Number(m[3]), line: Number(m[4]) }, bigPenalty: Number(m[5]) }] })],
    // Reshaped Spell: "If the next action you use is to Cast a Spell with an area that is a cone or a line, you may alter the area of the spell to a line or a cone
    // respectively. For the purposes of the area the spell covers, a line is always twice the length of a cone, and a cone is always half the length of a line." —
    // the cast's template made the other shape.
    [/If the next action you use is to Cast a Spell with an area that is a cone or a line, you may alter the area of the spell to a line or a cone respectively\. For the purposes of the area the spell covers, a line is always (twice) the length of a cone, and a cone is always half the length of a line\.$/,
        () => ({ requires: { area: true, areaTypes: ["cone", "line"] }, riders: [{ type: "reshape", swap: { cone: "line", line: "cone" }, lineFactor: 2 }] })],
    // Huddle Channel: "If the next action you use is to cast a 1-action Harm or Heal to heal or damage a single creature, choose one additional creature adjacent
    // to either you or the target. Both targets receive the effect of your spell as if you had cast the 1-action version." — PF2e's roll applied to the second
    // creature too (the table's: its card applies to any creature).
    [/If the next action you use is to cast a 1-action @UUID\[Compendium\.pf2e\.spells-srd\.(?:Item\.)?[A-Za-z0-9]+\]\{(Harm)\} or @UUID\[Compendium\.pf2e\.spells-srd\.(?:Item\.)?[A-Za-z0-9]+\]\{(Heal)\} to heal or damage a single creature, (choose one additional creature adjacent to either you or the target\. Both targets receive the effect of your spell as if you had cast the 1-action version\.)$/,
        m => ({ requires: { spells: [m[1], m[2]], actions: [1], singleTarget: true }, riders: [{ type: "table", text: `${m[3][0].toUpperCase()}${m[3].slice(1)} (PF2e's roll applied to it as well.)` }] })],
    // The Lurking Storm: "If your next action is to Cast a Spell with the air, cold, electricity, or water traits that has no duration and deals either physical
    // damage or electricity damage, you choose to deal half of the damage as bludgeoning damage and half the damage as electricity damage."
    [/If your next action is to Cast a Spell with the ((?:[a-z]+, )+)or ([a-z]+) traits that has no duration and deals either physical damage or ([a-z]+) damage, you choose to deal half of the damage as ([a-z]+) damage and half the damage as ([a-z]+) damage\.$/,
        m => ({ requires: { anyTraits: [...m[1].split(/,\s*/).filter(Boolean), m[2]], noDuration: true, damaging: true, damageTypesAny: ["bludgeoning", "piercing", "slashing", m[3]] },
            riders: [{ type: "damage-split", types: [m[4], m[5]] }] })],
    // Sacrificial Spell: "If your next action is to cast heal and all your targets are living creatures, you roll d12s instead of d8s for the amount of healing."
    // — a die-size rule on the caster for that cast's healing roll (gone with it); the living targets the table's.
    [/If your next action is to cast (heal) and (all your targets are living creatures), you roll d(\d+)s instead of d(\d+)s for the amount of healing\.$/,
        m => ({ requires: { spells: [`${m[1][0].toUpperCase()}${m[1].slice(1)}`], table: [m[2]] },
            riders: [{ type: "self-rules", label: `d${m[3]}s for the healing`, thisTurn: true, untilRoll: true, rules: [{ key: "DamageDice", selector: "spell-healing", predicate: [`item:slug:${m[1]}`], override: { dieSize: `d${m[3]}` } }] }] })],
    // Transmute Spell: four essences, one chosen when it's used ("corresponding to your main spellcasting tradition" — the table's): Matter and Spirit change
    // physical damage, Mind and Life energy damage, of a spell from slots with no duration. "If a spell deals multiple damage types, change all damage types
    // that meet the requirements."
    [/When you use this action, choose one of the following essences below, corresponding to your main spellcasting tradition\. If a spell deals multiple damage types, change all damage types that meet the requirements\. Matter \(Arcane or Primal\) If your next action is to Cast a Spell from your spell slots that deals physical damage and doesn't have a duration, you can change the damage type to ((?:[a-z]+, )+[a-z]+,? or [a-z]+) damage\. Mind \(Arcane or Occult\) If your next action is to Cast a Spell from your spell slots that deals energy damage and doesn't have a duration, you can change the damage type to (mental), and the target takes additional mental damage equal to the spell's rank\. Spirit \(Occult or Divine\) If your next action is to Cast a Spell from your spell slots that deals physical damage and doesn't have a duration, you can change the damage type to (spirit), and this spirit damage only damages creatures with a weakness to ((?:[a-z]+, )+or [a-z]+)\. Life \(Divine or Primal\) If your next action is to Cast a Spell from your spell slots that deals energy damage and doesn't have a duration, you can change the damage type to ([a-z]+) or ([a-z]+)\.$/,
        m => {
            const list = text => text.split(/,\s*(?:or\s+)?|\s+or\s+/).map(entry => entry.trim()).filter(Boolean);
            const physical = ["bludgeoning", "piercing", "slashing"], energy = ["acid", "cold", "electricity", "fire", "force", "sonic", "vitality", "void"];
            return { requires: { fromSlots: true, noDuration: true, damaging: true, damageTypesAny: [...physical, ...energy] }, riders: [{ type: "transmute", essences: [
                { name: "Matter", from: physical, to: list(m[1]) },
                { name: "Mind", from: energy, to: [m[2]], extra: { formula: "rank", damageType: m[2] } },
                { name: "Spirit", from: physical, to: [m[3]], onlyWeakTo: list(m[4]) },
                { name: "Life", from: energy, to: [m[5], m[6]] }] }] };
        }],
    // Eldritch Resilience: "If your next action is to Cast a Spell, your mystic duo gains temporary hit points equal to twice the rank of the spell or the rank of
    // the spell if the spell was a cantrip. These temporary Hit Points last as long as your mystic link is active." — the module's Effect (its TempHP the rank times
    // 2, or 1 for a cantrip) on the duo, gone with the link.
    [/If your next action is to Cast a Spell, your mystic duo gains temporary hit points equal to (twice) the rank of the spell or the rank of the spell if the spell was a cantrip\. These temporary Hit Points last as long as your mystic link is active\. @UUID\[(Compendium\.pf2e-team-plus-magic\.misc\.(?:Item\.)?([A-Za-z0-9]{16}))\]\{(Effect: [^}]+)\}$/,
        m => ({ requires: {}, riders: [{ type: "duo-effect", uuid: m[2].replace(/\.misc\.(?!Item\.)/, ".misc.Item."), name: m[4], times: 2, cantripTimes: 1, whileLinked: true }] })],
    // Spell and Steel: "If your next action is to Cast a Spell with no duration that deals damage, the spell gains a status bonus to damage equal to twice the rank
    // of the spell or equal to the rank of the spell if the spell was a cantrip. This damage is of the same type as your mystic duo's weapon would deal and applies
    // only to the initial damage the spell deals when cast. …" — damage added to the spell's, scaled with each save; its type the duo's weapon's (asked).
    [/If your next action is to Cast a Spell with no duration that deals damage, the spell gains a status bonus to damage equal to (twice) the rank of the spell or equal to the rank of the spell if the spell was a cantrip\. This damage is of the same type as your mystic duo's weapon would deal and applies only to the initial damage the spell deals when cast\. An individual creature takes this damage only once per spell, even if the spell would damage that creature multiple times\.$/,
        () => ({ requires: { noDuration: true, damaging: true }, riders: [{ type: "extra-damage", formula: "2*rank", cantripFormula: "rank", damageTypeFrom: "duo-weapon" }] })],
    // Linked Target Spell: "If your next action you use is to cast a cantrip or a spell that is at least 1 rank lower than the highest-rank spell slot you have and
    // targets yourself (such as Shield), you can instead grant the effects to your mystic duo. … If the spell you cast has a duration, it immediately ends if your
    // mystic link ends. … If you use Linked Target Spell again while a spell with its effects is still active, you immediately end the previous effect." — the
    // spell's Effect on the duo, gone with the link, and an earlier one ended.
    [/If your next action you use is to cast a cantrip or a spell that is at least (\d) rank lower than the highest-rank spell slot you have and targets yourself \(such as @UUID\[[^\]]+\]\{[^}]+\}\), you can instead grant the effects to your mystic duo\. Your mystic duo must be willing to accept the effect\. If the spell you cast has a duration, it immediately ends if your mystic link ends\. (You are still the caster of the spell and must take any actions that would be required for the spell instead of your mystic duo \(such as the @UUID\[[^\]]+\]\{Sustain\} action or the @UUID\[[^\]]+\]\{Shield Block\} reaction for shield\)\.) If you use Linked Target Spell again while a spell with its effects is still active, you immediately end the previous effect\.$/,
        m => ({ requires: { belowHighestOrCantrip: Number(m[1]), table: ["it targets you"] }, riders: [{ type: "redirect-self", to: "duo", alsoSelf: false, whileLinked: true, endsPrevious: true },
            { type: "table", text: m[2].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") }] })],
    // Twinned Target Spell: "If your next action is to Cast a Spell that is at least 2 ranks below the highest rank you can cast and would affect only yourself, it
    // instead affects both you and your mystic duo as long as your mystic link is active." — the spell's Effect on both, the duo's gone with the link.
    [/If your next action is to Cast a Spell that is at least (\d) ranks below the highest rank you can cast and would affect only yourself, it instead affects both you and your mystic duo as long as your mystic link is active\. Your mystic duo must be willing to accept the effect\.$/,
        m => ({ requires: { belowHighest: Number(m[1]), table: ["it would affect only you"] }, riders: [{ type: "redirect-self", to: "duo", alsoSelf: true, whileLinked: true }] })],
    // Ally Form: "If your next action is to Cast a Spell from your spell slots that would grant you a battle form, you can target an adjacent willing ally instead of
    // yourself with the spell. You or the ally can Dismiss the spell and the spell's duration is reduced to 1 minute if it would be longer than 1 minute." — the
    // form's Effect on the ally (asked among the adjacent ones), at most a minute.
    [/If your next action is to Cast a Spell from your spell slots that would grant you a battle form, you can target an adjacent willing ally instead of yourself with the spell\. (You or the ally can Dismiss the spell) and the spell's duration is reduced to (\d+) minute if it would be longer than \2 minute\.$/,
        m => ({ requires: { fromSlots: true, anyTraits: ["polymorph"], table: ["it grants you a battle form"] }, riders: [{ type: "redirect-self", to: "adjacent-ally", alsoSelf: false, maxSeconds: Number(m[2]) * 60 },
            { type: "table", text: `${m[1]}.` }] })],
    // Drain Destiny: "If the next action you use is to make a Spellstrike or Cast a Spell that targets a single opponent and requires an attack roll, that spell can
    // siphon away mythic power from the target. If the spell attack roll is a success, you regain a Mythic Point; if the target of the spell has any Mythic Points,
    // they lose one." — on a hit (a Spellstrike's the table's).
    [/If the next action you use is to make a Spellstrike or Cast a Spell that targets a single opponent and requires an attack roll, that spell can siphon away mythic power from the target\. If the spell attack roll is a success, you regain a Mythic Point; if the target of the spell has any Mythic Points, they lose one\.$/,
        () => ({ requires: { singleTarget: true, attack: true }, riders: [{ type: "mythic-drain", when: "hit", gain: 1, drain: 1 }, { type: "table", text: "Or the next Spellstrike." }] })],
    // Reporting Spell: "If the next action you use is to Cast a Spell that would target one of your enemies with a spell attack roll or a save, you learn something
    // about a single enemy affected by the spell. You learn one of the following …: which of its weaknesses is the highest, which of its saving throws has the
    // lowest modifier, one immunity the enemy has, or which of the enemy's resistances is the highest. If your spell dealt damage the creature had an immunity,
    // resistance, or weakness to, you automatically learn that weakness in addition to your choice and if your spell targeted a save with the lowest or highest
    // modifier, you learn if it was the weakest or the highest. Regardless of the results of your spell, the enemy is temporarily immune to Reporting Spell for 1
    // day." — after the card, whispered to the caster and the GM.
    [/If the next action you use is to Cast a Spell that would target one of your enemies with a spell attack roll or a save, you learn something about a single enemy affected by the spell\. You learn one of the following from your enemy so long as it was affected by the spell: which of its weaknesses is the highest, which of its saving throws has the lowest modifier, one immunity the enemy has, or which of the enemy's resistances is the highest\. If your spell dealt damage the creature had an immunity, resistance, or weakness to, you automatically learn that weakness in addition to your choice and if your spell targeted a save with the lowest or highest modifier, you learn if it was the weakest or the highest\. Regardless of the results of your spell, the enemy is temporarily immune to Reporting Spell for (\d+) days?\.$/,
        m => ({ requires: { attackOrSave: true, table: ["it targets one of your enemies"] }, riders: [{ type: "report", immunityHours: Number(m[1]) * 24 }] })],
    // Enlightening Spell: "If your next action is to Cast a Spell from one of your oracle spell slots that targets an ally, they can Recall Knowledge as a free action
    // after receiving the effects of the spell. If you are cursebound, they gain a circumstance bonus to their check equal to your cursebound value." — the module's
    // Effect (its bonus the origin's cursebound value) on each ally the spell's Effect or healing reaches, when the caster is cursebound; the free action the table's.
    [/If your next action is to Cast a Spell from one of your ([a-z]+) spell slots that targets an ally, (they can Recall Knowledge as a free action after receiving the effects of the spell)\. If you are cursebound, they gain a circumstance bonus to their check equal to your cursebound value\. @UUID\[(Compendium\.pf2e-team-plus-oracles-remastered\.misc\.Item\.[A-Za-z0-9]{16})\]\{(Effect: [^}]+)\}$/,
        m => ({ requires: { fromSlots: true, table: [`from one of your ${m[1]} spell slots`, "it targets an ally"] }, riders: [{ type: "ally-recipient-effect", uuid: m[3], name: m[4], ifCursebound: true },
            { type: "table", text: `${m[2][0].toUpperCase()}${m[2].slice(1)}.` }] })],
    // Beguiling Feint: "If your next action is to Cast a Spell that targets a creature within 30 feet attempt a Deception check against the Perception DC of them using
    // your Intelligence modifier instead of your Charisma modifier." with its degrees — rolled on the card before the spell's own roll (the module's rule gives the
    // Intelligence); Off-Guard to the spell, the caster's concealment (a reminder Effect), or the caster Off-Guard.
    [/If your next action is to Cast a Spell that targets a creature within (\d+) feet attempt a Deception check against the Perception DC of them using your Intelligence modifier instead of your Charisma modifier\. Critical Success The enemy is not prepared to face your magic\. They are @UUID\[(Compendium\.pf2e\.conditionitems\.(?:Item\.)?[A-Za-z0-9]+)\]\{Off-Guard\} to your spell and (you are @UUID\[[^\]]+\]\{Concealed\} to the creature until the end of your next turn\. You can use this concealment to Hide\.) Success As critical success, (except the concealment ends after you take a hostile action\.) Critical Failure Your magic backfires\. You are off-guard until the end of your next turn\.$/,
        m => ({ requires: { targeted: true }, riders: [{ type: "feint-check", within: Number(m[1]), skill: "deception", against: "perception", rollOption: "beguiling-feint", offGuard: m[2],
            concealed: m[3].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1"), successNote: m[4] }] })],
    // The table's — what the caster, an ally or an eidolon does, or prepares, rather than how the spell resolves (a reminder at the cast):
    //   Tandem Casting: the eidolon's own cast as part of the same activity; Spell Tag: the ally's later Interact delivering a touch spell; Distilled Magic and
    //   Mixed-Potency Tincture: daily preparations; Recharging Spellgun: the spellgun's Activation; Elemental Study Notes: Learn a Spell and Recall Knowledge.
    [/(If you or your eidolon's next action is to Cast a Spell that takes 2 actions or less to cast it gains the tandem trait and the other of the two of you can Cast a Spell that takes the same number of actions or less to cast as part of the same activity\. If the spell targets specific creatures, both spells must target at least one creature in common and if the spell has an area of effect the spells must both target either an overlapping area or a creature within the area of effect if the spell would not target an area\.)$/,
        m => ({ requires: { actions: [1, 2] }, riders: [{ type: "table", text: m[1] }] })],
    [/If your next action is to Cast a Spell with a range of touch, (you can instead touch an ally, imbuing them with the spell until the beginning of your next turn and preserving the spell's energy\. Your ally can deliver the spell on your behalf to a creature by using Interact to touch it and expending the spell immediately\. If your ally's Interact is interrupted or fails to deliver the spell with an Interact before the end of its turn, the spell dissipates with no effect\.)$/,
        m => ({ requires: { touchOnly: true }, riders: [{ type: "table", text: `${m[1][0].toUpperCase()}${m[1].slice(1)}` }] })],
    [/(During your daily preparations, you can distill one of your spells into one of your concoctions\. When you do, you Cast a Spell from one of your wizard spell slots that takes 2-actions or less to cast as part of its creation process, placing the spell inside the concoction\. A creature that consumes this concoction is targeted by the spell\. If you have master proficiency in spell DC, you can distill two of your spells into concoctions instead of one, but each distilled spell must be of a different rank\.)$/,
        m => ({ requires: {}, riders: [{ type: "table", text: m[1] }], passive: true })],
    [/(When you prepare your concoctions for the day, you can choose to combine up to 3 elixirs or potions into a single consumable that applies the effects of each when consumed\.)$/,
        m => ({ requires: {}, riders: [{ type: "table", text: m[1] }], passive: true })],
    [/(The basic effects of your spellgun return at a faster rate\. You regain the initial Activation of your makeshift spellgun\.)$/,
        m => ({ requires: {}, riders: [{ type: "table", text: m[1] }], passive: true })],
    [/(When you attempt to Learn a Spell with an elemental trait and you roll a critical failure you get a failure instead and when you roll a failure, you can attempt to try again before gaining another level\. In addition, when you Recall Knowledge on a creature or plane with an elemental trait or attempt to Research such things, you gain a \+2 circumstance bonus to your check\.)$/,
        m => ({ requires: {}, riders: [{ type: "table", text: m[1] }], passive: true })],
    // Seeking Spell: "If the next action you use is to Cast a Spell with an attack roll, you reduce the circumstance bonus to target's AC from cover by 2." — a modifier
    // on the card's attack roll, up to the target's cover bonus (PF2e's Effect: Cover); the Sustained retries after a failure the caster's (a reminder on that target).
    [/If the next action you use is to Cast a Spell with an attack roll, you reduce the circumstance bonus to target's AC from cover by (\d+)\. (Additionally, if your spell attack roll is a failure, but not a critical failure, the spell does not end immediately, but instead you can Sustain this effect on your next turn to attempt this spell attack roll again\. At (\d+)th level and every (\d+) levels after, you can Sustain this effect an additional round to attempt the attack roll again instead of only your next turn, but you can only attempt one additional attack roll for this effect per round\.)$/,
        m => ({ requires: { attack: true }, riders: [{ type: "cover-reduce", by: Number(m[1]) }, { type: "seek-retry", rounds: { base: 1, from: Number(m[3]), every: Number(m[4]) }, text: m[2] }] })],
    // The "+" items' spellshape activations (item-spellshape.js reads each as a feat):
    // Veracious Spell (Power Rings): "If the next action you use is to Cast a Spell that would require a spell attack roll, you gain a +2 item bonus to your spell attack
    // roll. If the spell has multiple targets, the bonus applies to all of them. If a spell you modified with this effect could make additional spell attack rolls on a
    // Sustain, the item bonus applies to these spell attack rolls as well." — the bonus this turn; on the Sustain's attacks the table's.
    [/If the next action you use is to Cast a Spell that would require a spell attack roll, you gain a \+(\d) item bonus to your spell attack roll\. If the spell has multiple targets, the bonus applies to all of them\. (If a spell you modified with this effect could make additional spell attack rolls on a Sustain, the item bonus applies to these spell attack rolls as well\.)$/,
        m => ({ requires: { attack: true }, riders: [{ type: "self-rules", label: "spell attack bonus", veracious: true, thisTurn: true, rules: [{ key: "FlatModifier", selector: "spell-attack", type: "item", value: Number(m[1]) }] }, { type: "table", text: m[2] }] })],
    // Dangerous Odds (Scepter of Second Chances): "… you can use your reaction if the target rolls a success on their save to force the creature to reroll their save and
    // take the new result. This is a misfortune effect." — the caster's reaction (the card's reroll), the table's.
    [/If the next action you use is to Cast a Spell that would target a single creature and requires a (Fortitude|Reflex|Will) save, (you can use your reaction if the target rolls a success on their save to force the creature to reroll their save and take the new result\. This is a misfortune effect\.)$/,
        m => ({ requires: { singleTarget: true, saves: [m[1].toLowerCase()] }, riders: [{ type: "table", text: `${m[2][0].toUpperCase()}${m[2].slice(1)} (Roll Save Again on the card.)` }] })],
    // Purifying Spell (Scepter of Purifying): "… you can attempt to counteract the target's sickened condition in addition to the normal effects using the rank of the
    // spell you cast for your counteract modifier." — the GM's note (a condition's counteract DC is its source's).
    [/If the next action you use is to Cast a Spell that would restore Hit Points to a single creature, (you can attempt to counteract the target's sickened condition in addition to the normal effects using the rank of the spell you cast for your counteract modifier\.)$/,
        m => ({ requires: { singleTarget: true, healing: true }, riders: [{ type: "note", wandRule: true, text: `${m[1][0].toUpperCase()}${m[1].slice(1)}` }] })],
    // Sicken Spell (Scepter of Sickening): "If your next action is to Cast a Spell with a basic Fortitude save, creatures that fail their save are also Sickened 1 (Sickened 2
    // on a critical failure). The creature is affected whether or not the spell does damage."
    [/If your next action is to Cast a Spell with a basic (Fortitude|Reflex|Will) save, creatures that fail their save are also @UUID\[(Compendium\.pf2e\.conditionitems\.(?:Item\.)?[A-Za-z0-9]+)\]\{([A-Z][a-z]+) (\d)\} \(@UUID\[\2\]\{\3 (\d)\} on a critical failure\)\. The creature is affected whether or not the spell does damage\.$/,
        m => { const uuid = m[2].replace(/conditionitems\.(?!Item\.)/, "conditionitems.Item."), slug = m[3].toLowerCase();
            return { requires: { saves: [m[1].toLowerCase()], table: ["a basic save"] }, riders: [{ type: "conditions", degrees: { failure: [{ uuid, slug, value: Number(m[4]) }], criticalFailure: [{ uuid, slug, value: Number(m[5]) }] } }] }; }],
    // Energy Ablation (its scepter): "If your next action is to Cast a Spell that deals at least one type of energy damage (acid, …, or void), you gain resistance to one
    // energy type the spell could deal equal to the spell's rank until the end of your next turn."
    [/If your next action is to Cast a Spell that deals at least one type of energy damage \(((?:[a-z]+, )+or [a-z]+)\), you gain resistance to one energy type the spell could deal equal to the spell's rank until the (end|beginning) of your next turn\.(?: @UUID\[[^\]]+\]\{Effect: [^}]+\})?$/,
        m => { const types = m[1].split(/,\s*(?:or\s+)?/).map(type => type.trim()).filter(Boolean);
            return { requires: { damaging: true, damageTypesAny: types }, riders: [{ type: "self-resistance", choice: types, spellTypesOnly: true, value: "rank", until: m[2] === "end" ? "caster-next-turn-end" : "caster-turn-start" }] }; }],
    // Heighten Spell (Scepter of Heightening): Heightened Spell's rule, "a Spell of at least 3 ranks below the highest rank spell slot you have".
    [/If the next action you use is to Cast a Spell of at least (\d) ranks below the highest rank spell slot you have, you treat the rank of the spell as (\d) higher for the purposes of numerical effects based on its heightened rank, such as damage, healing, increased area, bonuses, or penalties\. (You do not gain any other effects associated with the heightened rank, such as being able to target more creatures or treating the spell as a higher rank for the purposes of counteracting or the incapacitation trait\.)$/,
        m => ({ requires: { belowHighest: Number(m[1]) }, riders: [{ type: "rank-change", by: Number(m[2]) }, { type: "note", wandRule: true, text: m[3] }] })],
    // Reach Spell (Scepter of Greater Distances): "… increase that spell's range by 30 feet. … If you have the Reach Spell feat, you increase the range of the spell by 45
    // feet instead of 30." — the range the table's, as Reach Spell's.
    [/If the next action you use is to Cast a Spell that has a range, (increase that spell's range by (\d+) feet\. As is standard for increasing spell ranges, if the spell normally has a range of touch, you extend its range to \2 feet\. If you have the @UUID\[[^\]]+\]\{Reach Spell\} feat, you increase the range of the spell by (\d+) feet instead of \2\.)$/,
        m => ({ requires: { ranged: true }, riders: [{ type: "range", add: Number(m[2]), withFeat: { name: "Reach Spell", add: Number(m[3]) } }, { type: "table", text: `${m[1][0].toUpperCase()}${m[1].slice(1)}`.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") }] })],
    // Hone Spell (Precision rune): "If your next action is to Cast a Spell that targets an area and requires a Reflex or Fortitude save, you may instead target one
    // creature within range by making a spell attack roll against the target's AC. This makes the target the only creature that would be affected by the spell and the
    // spell has no effect on a miss, the effects of a failure on a successful spell attack roll, or the effects of a critical failure on a critically successful spell
    // attack roll. You apply the ring's item bonus to your attack roll." — one target on the card, the caster's spell attack read as its save.
    [/If your next action is to Cast a Spell that targets an area and requires a (Reflex|Fortitude|Will) or (Reflex|Fortitude|Will) save, you may instead target one creature within range by making a spell attack roll against the target's AC\. This makes the target the only creature that would be affected by the spell and the spell has no effect on a miss, the effects of a failure on a successful spell attack roll, or the effects of a critical failure on a critically successful spell attack roll\. You apply the ring's item bonus to your attack roll\.$/,
        m => ({ requires: { area: true, saves: [m[1].toLowerCase(), m[2].toLowerCase()] }, riders: [{ type: "hone", degrees: { criticalSuccess: "criticalFailure", success: "failure", failure: "criticalSuccess", criticalFailure: "criticalSuccess" }, ringBonus: true }] })],
    // Veracious Summon (Calling rune): "If the next action you use is to Cast a Spell that would summon a creature capable of making Strikes, the summon gains a status
    // bonus to its Strikes equal to your power ring's item bonus. You cannot use Veracious Spell until the summon spell ends."
    [/If the next action you use is to Cast a Spell that would summon a creature capable of making Strikes, the summon gains a status bonus to its Strikes equal to your power ring's item bonus\. (You cannot use Veracious Spell until the summon spell ends\.)(?: @UUID\[[^\]]+\]\{Effect: [^}]+\})?$/,
        m => ({ requires: { anyTraits: ["summon"], table: ["the creature can make Strikes"] }, riders: [{ type: "summon-strike-bonus", ringBonus: true }, { type: "table", text: m[1] }] })],
    // Fury of a Thousand: "If your next action is to cast either Song of Strength or Murmuration, your spell gains the following effects in addition to its normal
    // effects. Murmuration You deal both types of damage instead of piercing or sonic, and on a critical failure the status penalty is –3 instead of –2. Song of Strength
    // The status bonus increases to +2." — riders by spell; "both types" each in full (the user, 2026-10-07); the Effects' values raised.
    [/If your next action is to cast either @UUID\[[^\]]+\]\{(Song of Strength)\} or @UUID\[[^\]]+\]\{(Murmuration)\} ?, your spell gains the following effects in addition to its normal effects\. Murmuration You deal both types of damage instead of ([a-z]+) or ([a-z]+), and on a critical failure the status penalty is [–-](\d) instead of [–-](\d)\. Song of Strength The status bonus increases to \+(\d)\.$/,
        m => ({ requires: { spells: [m[1], m[2]] }, riders: [
            { type: "dual-damage", spell: m[2], types: [m[3], m[4]] },
            { type: "effect-value", spell: m[2], effectName: `Spell Effect: ${m[2]}`, from: -Number(m[6]), to: -Number(m[5]) },
            { type: "effect-value", spell: m[1], effectName: `Spell Effect: ${m[1]}`, from: 1, to: Number(m[7]) }] })],
    // Slot-Charged Spell: "If your next action is to Cast a Spell that is at least 3 ranks lower than the highest rank spell you can cast, you can expend one of your
    // prepared spell slots to heighten the spell you cast by half the rank of the spell slot you chose to expend (minimum 1). The rank of the heightened spell cannot
    // be higher than the highest rank spell you can cast." — the slot asked at the cast and spent; the rank raised.
    [/If your next action is to Cast a Spell that is at least (\d) ranks lower than the highest rank spell you can cast, you can expend one of your prepared spell slots to heighten the spell you cast by half the rank of the spell slot you chose to expend \(minimum (\d)\)\. The rank of the heightened spell cannot be higher than the highest rank spell you can cast\.$/,
        m => ({ requires: { belowHighest: Number(m[1]) }, riders: [{ type: "slot-charge", divisor: 2, min: Number(m[2]), cap: "highest" }] })],
    // Wicket Infusion: "If your next action is to Cast a Spell from Focus Points or spell slots that does not have your wicket's traits, it still triggers the effects of your
    // tethered magic effects as if it had one of your wicket traits. The spell does not gain the chosen trait and you must select which trait to infuse when you use this
    // spellshape." — the wicket's passive riders read the spell as having the chosen trait.
    [/If your next action is to Cast a Spell from Focus Points or spell slots that does not have your wicket's traits, it still triggers the effects of your tethered magic effects as if it had one of your wicket traits\. (The spell does not gain the chosen trait) and you must select which trait to infuse when you use this spellshape\.$/,
        m => ({ requires: { fromSlotsOrFocus: true }, riders: [{ type: "infuse-trait" }, { type: "table", text: `${m[1]}.` }] })],
    // Constructed Spark: "If your next action is to cast Animated Spark, you gain the effects of a Summon Construct spell of the highest rank spell you can cast instead of the normal
    // effects of the spell." — Summon Construct at the highest rank, in place of the cast's own.
    [/If your next action is to cast @UUID\[[^\]]+\]\{(Animated Spark)\}, you gain the effects of a @UUID\[(Compendium\.pf2e\.spells-srd\.(?:Item\.)?[A-Za-z0-9]+)\]\{([^}]+)\} spell of the highest rank spell you can cast instead of the normal effects of the spell\.$/,
        m => ({ requires: { spells: [m[1]] }, riders: [{ type: "replace-spell", replacement: { uuid: m[2].replace(/spells-srd\.(?!Item\.)/, "spells-srd.Item."), name: m[3] }, rank: "highest" }] })],
    // The table's, with their reasons: Form of the Imperial — "If your next action is to cast Channel Imperial Dragon (an action, not a spell), you also gain the effects of a
    // Dragon Form … You must select your imperial dragon" (PF2e's Dragon Form doesn't hold the imperial dragons); Controlled Wrath — the eidolon's own cast, its summoner's feat
    // (PF2e doesn't link an eidolon to its summoner).
    [/(If your next action is to cast @UUID\[[^\]]+\]\{Channel Imperial Dragon\} ?, you also gain the effects of a @UUID\[[^\]]+\]\{Dragon Form\} heightened to a rank equal to half your level rounded up\. You must select your imperial dragon for your battle form\. You can use actions and activities you gained from this archetype while you are in this battleform\.)$/,
        m => ({ requires: {}, riders: [{ type: "table", text: `${m[1].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")} (The imperial dragon forms aren't among PF2e's Dragon Form choices: the GM's.)` }] })],
    [/(If the next action your eidolon uses is to Cast @UUID\[[^\]]+\]\{eidolon's wrath\}, it can alter the area to be a @Template\[[^\]]+\], a @Template\[[^\]]+\], or a @Template\[[^\]]+\] within 30 feet\.)$/,
        m => ({ requires: {}, riders: [{ type: "table", text: `${m[1].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/@Template\[distance:(\d+)\|type:([a-z]+)\]/g, "$1-foot $2")} (The eidolon's casting: placed by the GM.)` }] })],
    // Explosive Blood (Wildblood): "If your next action is to Cast a Spell that would deal the additional damage from Rage and would also damage you, you double the
    // additional damage from Rage until the end of your next turn. This increase in damage applies to your melee Strikes and spells you cast, including the spell you
    // modified with this action." — raging and a damaging spell; the rage damage doubled on spells and Strikes until the end of the next turn ("would also damage you",
    // the caster within its area, the table's).
    [/If your next action is to Cast a Spell that would deal the additional damage from Rage and (would also damage you), you double the additional damage from Rage until the end of your next turn\. This increase in damage applies to your melee Strikes and spells you cast, including the spell you modified with this action\.$/,
        m => ({ requires: { raging: true, damaging: true, table: [`it ${m[1]}`] }, riders: [{ type: "self-rules", label: "rage damage doubled", until: "caster-next-turn-end",
            rules: [{ key: "AdjustModifier", mode: "multiply", selector: "spell-damage", slug: "wildblood-rage", value: 2, priority: 100 },
                { key: "AdjustModifier", mode: "multiply", selector: "strike-damage", slug: "rage", value: 2, priority: 100, predicate: ["item:melee"] }] }] })],
    // Aspect Sage (Magic+): "If your next action is to cast an aspect summon spell, you can choose a single common aspect ability to grant your aspect summon that it would
    // not normally have of your choice. It gains that aspect ability for the duration of the spell." — an aspect summon (the aspectmon trait); the ability picked among the
    // module's aspect abilities (any aspect's), given to the summoned aspect (gone with it).
    [/If your next action is to cast an aspect summon spell, you can choose a single common aspect ability to grant your aspect summon that it would not normally have of your choice\. It gains that aspect ability for the duration of the spell\.$/,
        () => ({ requires: { anyTraits: ["aspectmon"] }, riders: [{ type: "aspect-ability" }] })],
    // Colossal Summon (Magic+): "If your next action is to cast a summon spell of 10th-rank with the summon trait that summons a creature, the creature gains the listed
    // abilities … Colossal The summon takes up a space of 6 squares by 6 squares (30 feet by 30 feet) and is 100 feet tall. All of its speeds increase by 20 feet, and it
    // gains the Trample activity, or increases the damage dice of its Trample by one size if it already had the Trample activity. Earth-Shatterer 2 Frequency once per
    // minute; Effect The summon produces the effects of an Earthquake. Megalophobia (aura 100 feet, emotion, fear, mental) … must succeed at a Will save or the creature is
    // frightened 2 (frightened 3 and fleeing on a critical failure). Creatures frightened by this ability treat all squares in the area as difficult terrain. Regardless of
    // the result, creatures are then temporarily immune for 1 hour." — on the summoned creature (`colossal` rider: shapeSummonedAfter).
    [/If your next action is to cast a summon spell of (\d+)th-rank with the summon trait that summons a creature, the creature gains the listed abilities in addition to the ones it already possessed\. Colossal The summon takes up a space of (\d+) squares by \2 squares \(\d+ feet by \d+ feet\) and is \d+ feet tall\. All of its speeds increase by (\d+) feet, and it gains the Trample activity, or increases the damage dice of its Trample by one size if it already had the Trample activity\. Earth-Shatterer (\d) Frequency once per minute; Effect The summon produces the effects of an @UUID\[(Compendium\.pf2e\.spells-srd\.(?:Item\.)?[A-Za-z0-9]+)\]\{Earthquake\}\. Megalophobia \(aura (\d+) feet, ([a-z, ]+)\) (Even looking up at the summon causes vertigo, like you might fall upwards into the sky\.) A creature that enters or begins its turn within the emanation must succeed at a (Fortitude|Reflex|Will) save or the creature is (frightened) (\d) \(frightened (\d) and (fleeing) on a critical failure\)\. (Creatures frightened by this ability treat all squares in the area as difficult terrain\.) Regardless of the result, creatures are then temporarily immune for (\d+) hours?\.$/,
        m => ({ requires: { rank: Number(m[1]), anyTraits: ["summon"] }, riders: [{ type: "colossal", squares: Number(m[2]), speedBonus: Number(m[3]),
            earthShatterer: { actions: Number(m[4]), spell: { uuid: m[5].replace(/spells-srd\.(?!Item\.)/, "spells-srd.Item."), name: "Earthquake" }, perSeconds: 60 },
            megalophobia: { radius: Number(m[6]), traits: m[7].split(/,\s*/), flavour: m[8], statistic: m[9].toLowerCase(),
                // (PF2e's frightened and fleeing; fleeing while frightened, as the condition's usual pairing.)
                failure: [{ uuid: CONDITIONS[m[10]], slug: m[10], value: Number(m[11]) }],
                criticalFailure: [{ uuid: CONDITIONS[m[10]], slug: m[10], value: Number(m[12]) }, { uuid: CONDITIONS[m[13]], slug: m[13], whileCondition: m[10] }],
                note: m[14], immunitySeconds: Number(m[15]) * 3600 } }] }),
    ],
    // Colossal Aspect Form (Magic+): "If your next action is to cast an aspect battle form spell of 10th-rank, your form is Gargantuan in size and takes up 6 squares by 6
    // squares (30 feet by 30 feet) and you are 100 feet tall and your reach increases to 25 feet. You gain the Trample activity, or increase the damage dice of your aspect's
    // Trample by one size if it already had the Trample activity." — an aspect battle form (aspectmorph) at 10th: the form's size answered as Gargantuan with reach 25, the
    // caster's token 6 by 6, Trample for the form's time. (The module's Gargantuan choice — reach 20 — chosen, then its reach raised to the text's 25.)
    [/If your next action is to cast an aspect battle form spell of (\d+)th-rank, your form is Gargantuan in size and takes up (\d+) squares by \2 squares \(\d+ feet by \d+ feet\) and you are \d+ feet tall and your reach increases to (\d+) feet\. You gain the @UUID\[(Compendium\.[^\]]+)\]\{Trample\} activity, or increase the damage dice of your aspect's Trample by one size if it already had the Trample activity\.$/,
        m => ({ requires: { rank: Number(m[1]), anyTraits: ["aspectmorph"] }, riders: [{ type: "form-choice", selections: { shift: { reach: 20, size: "grg", sizeNum: 6 } } },
            { type: "colossal-form", squares: Number(m[2]), reach: Number(m[3]), trample: m[4].replace(/^(Compendium\.[^.]+\.[^.]+)\.(?!Item\.)/, "$1.Item.") }] })],
    // Imposing Spellstrike (Magus+): "Make a Spellstrike. It gains the following effects in addition to the normal effects of your Spellstrike. Critical Success The target takes a
    // –2 status penalty to its Will saves and a –3 status penalty to fear effects until the end of your next turn. Success … –1 … –2 …" — on the Strike's degree.
    [/^(?:[^.]+\. )*Make a Spellstrike\. It gains the following effects in addition to the normal effects of your Spellstrike\. Critical Success (The target takes a [–-]\d status penalty to its Will saves and a [–-]\d status penalty to fear effects until the end of your next turn\.) Success (The target takes a [–-]\d status penalty to its Will saves and a [–-]\d status penalty to fear effects until the end of your next turn\.)(?: @UUID\[[^\]]+\]\{Effect: Imposing Spellstrike\})?$/,
        (m, { requirement }) => ({ requires: spellstrikeRequires(requirement), riders: [{ type: "spellstrike", rows: imposingRows(STATUS_PENALTY.exec(m[1]), STATUS_PENALTY.exec(m[2])) }] }), { readsRequirement: true }],
    // Pummeling Spellstrike (Magus+): "Critical Success You push your target up to 10 feet away from you after your Spellstrike resolves. You can Stride after it, but you must
    // move the same distance and in the same direction. Success You push your target back 5 feet …" — pushed away from the caster (up to: the full distance, less the GM's).
    [/^(?:[^.]+\. )*Make a Spellstrike\. It gains the following effects in addition to the normal effects of your Spellstrike\. Critical Success You push your target up to (\d+) feet away from you after your Spellstrike resolves\. (You can Stride after it, but you must move the same distance and in the same direction\.) Success You push your target back (\d+) feet after the Spellstrike resolves\. You can Stride after it, but you must move the same distance and in the same direction\.(?: Special (If you have Merged Martial Cascade, .+))?$/,
        (m, { requirement }) => ({ requires: spellstrikeRequires(requirement), riders: [{ type: "spellstrike", rows: { criticalSuccess: [{ type: "push", feet: Number(m[1]) }], success: [{ type: "push", feet: Number(m[3]) }] } },
            { type: "table", text: m[2] }, ...(m[4] ? [{ type: "table", text: m[4] }] : [])] }), { readsRequirement: true }],
    // Flaying Spellstrike (Magus+): "Make a Spellstrike and an Arcana check immediately after … On a success, the creature gains a weakness of 3 to a damage type of your choice
    // that lasts until the end of your next turn or double this amount if you critically succeed. The base weakness amount increases to 5 if you have weapon specialization or 7
    // if you have greater weapon specialization. The target gains these weaknesses before your Spellstrike deals damage." — the check after the Strike, whatever its degree.
    [/^(?:[^.]+\. )*Make a Spellstrike and an (?:@UUID\[[^\]]+\]\{)?Arcana\}? check immediately after to identify weak points with your magic to flay them\. On a success, the creature gains a weakness of (\d+) to a damage type of your choice that lasts until the end of your next turn or double this amount if you critically succeed\. The base weakness amount increases to (\d+) if you have weapon specialization or (\d+) if you have greater weapon specialization\. The target gains these weaknesses before your Spellstrike deals damage\.(?: @UUID\[[^\]]+\]\{Effect: Flaying Spellstrike\})?$/,
        (m, { requirement }) => ({ requires: spellstrikeRequires(requirement), riders: [{ type: "spellstrike", always: [{ type: "check-weakness", skill: "arcana", value: { base: Number(m[1]), specialization: Number(m[2]), greater: Number(m[3]) }, criticalMultiplier: 2, until: "caster-next-turn-end" }] }] }), { readsRequirement: true }],
    // Banishing Spellstrike (Magus+): "Make a Spellstrike against a creature that isn't on its home plane. If it hits, the target must attempt a Will save against your spell DC.
    // If your Spellstrike deals damage to the target that would trigger a weakness, the target takes a –2 circumstance penalty … If the creature … has the summoned trait, this
    // ability loses the incapacitation trait. Critical Success The target resists being banished and you are Stunned 1. … Failure The target is banished. Critical Failure The
    // target is banished and can't return … for 1 week." — the save on a hit (the feat's incapacitation trait, unless summoned).
    [/^(?:[^.]+\. )*Make a Spellstrike against (a creature that isn't on its home plane)\. If it hits, the target must attempt a @Check\[type:(will|fortitude|reflex)\|[^\]]*\] save against your spell DC\. (If your Spellstrike deals damage to the target that would trigger a weakness, the target takes a [–-](\d) circumstance penalty to its save\.) If the creature you targeted with your Spellstrike has the summoned trait, this ability loses the incapacitation trait\. Critical Success The target resists being banished and you are (?:@Compendium\[[^\]]+\]|@UUID\[[^\]]+\])\{Stunned (\d)\}\. Success The target resists being banished\. Failure The target is banished\. Critical Failure The target is banished and can't return by any means to the plane it's banished from for (\d+ (?:day|week|month|year)s?)\.$/,
        (m, { requirement }) => ({ requires: spellstrikeRequires(requirement, { table: [`against ${m[1]}`] }), riders: [{ type: "spellstrike", hit: [{ type: "banish-save", statistic: m[2], incapacitation: true, exceptSummoned: true,
            note: m[3], rows: { criticalSuccess: { casterCondition: { slug: "stunned", value: Number(m[5]) } }, success: {}, failure: { banished: true }, criticalFailure: { banished: true, cannotReturn: m[6] } } }] }] }), { readsRequirement: true }],
    // Living Grimoire (Magus+): its grimoire power — "Activate … Frequency once per day Effect If your next action is to Spellstrike, … The target becomes Dazzled until the end
    // of your next turn if your Spellstrike was a success or 1 minute if it was a critical success. Creatures that are dazzled from this effect take a –1 circumstance penalty to
    // their attack rolls against you as long as they are dazzled."
    [/Activate .+? Frequency (once per day) Effect If your next action is to Spellstrike, the runes inscribed on your body swirl to emphasize your attack\. The target becomes (?:@Compendium\[[^\]]+\]|@UUID\[[^\]]+\])\{Dazzled\} until the end of your next turn if your Spellstrike was a success or (\d+) minutes? if it was a critical success\. Creatures that are dazzled from this effect take a [–-](\d) circumstance penalty to their attack rolls against you as long as they are dazzled\.(?: @UUID\[[^\]]+\]\{Effect: Living Grimoire\})?$/,
        m => ({ requires: { actions: [1, 2], attackOrSave: true, table: [`Frequency ${m[1]}`] }, riders: [{ type: "spellstrike", rows: {
            success: [{ type: "target-condition", slug: "dazzled", until: "caster-next-turn-end", againstCaster: -Number(m[3]) }],
            criticalSuccess: [{ type: "target-condition", slug: "dazzled", rounds: Number(m[2]) * 10, againstCaster: -Number(m[3]) }] } }] }), { readsRequirement: true }],
    // Inverted Energy Spellstrike (Magus+): "Make a Spellstrike with a spell you can cast that deals energy damage (acid, cold, electricity, fire, force, negative, positive, or sonic).
    // You can change the damage of that spell to another damage type of your choice and the spell loses any traits of the previous damage type and gains the one associated with
    // its new damage type. If the spell you chose would deal more than one type of damage, you select one applicable damage type and any other damage remains the same." — one of
    // its energy types (asked) changed to another energy type (asked); the traits the table's.
    [/^(?:[^.]+\. )*Make a Spellstrike with a spell you can cast that deals energy damage \(([a-z, ]+)\)\. You can change the damage of that spell to another damage type of your choice (and the spell loses any traits of the previous damage type and gains the one associated with its new damage type)\. If the spell you chose would deal more than one type of damage, you select one applicable damage type and any other damage remains the same\.$/,
        (m, { requirement }) => {
            const energy = energyList(m[1]);
            return { requires: spellstrikeRequires(requirement, { damageTypesAny: energy }), riders: [{ type: "transmute", essences: energy.map(type => ({ name: type, from: [type], to: energy.filter(other => other !== type) })) },
                { type: "spellstrike" }, { type: "table", text: `The spell loses the traits of the previous damage type and gains the new one's (${m[2].replace(/^and /, "")}).` }] };
        }, { readsRequirement: true }],
    // Black Book Hex (Witches): "If your next action is to Cast a hex, the grimoire empowers your hex with dark power. You immediately take spirit damage equal to the rank of the hex and
    // you can Sustain that hex on the following turn as a free action." — the damage; the free Sustain the table's.
    [/If your next action is to Cast a hex, the grimoire empowers your hex with dark power\. You immediately take (spirit) damage equal to the rank of the hex and (you can Sustain that hex on the following turn as a free action\.)$/,
        m => ({ requires: { traits: ["hex"] }, riders: [{ type: "self-damage", formula: "rank", damageType: m[1] }, { type: "table", text: `${m[2][0].toUpperCase()}${m[2].slice(1)}` }] })],
    // Cone of Figments (Magus+): "Make a thrown Spellstrike against a target within your bonded weapons first range increment. The spell you cast for the Spellstrike can't be a
    // cantrip or focus spell. If your Strike is successful, figments burst forth from the connecting blow in a 10-foot cone bursting from behind the target of your Spellstrike and
    // creatures in the area, excluding the target of your Spellstrike, take 1d4 damage per spell level and must attempt a basic Reflex save. If your spell was one that can deal
    // damage, the damage of your Cone of Figments is the same type that spell could deal (or one type of your choice …). If the spell couldn't deal damage, the bonus damage depends
    // on the spell's school. Abjuration or Evocation force Conjuration or Transmutation same type as your weapon … Divination, Enchantment, or Illusion mental Necromancy negative or
    // positive damage if your spell had the positive trait" — on a hit, the cone's creatures (behind the target, away from the caster) save; a spell with no damage: the type asked
    // among those the schools give (remastered spells have none).
    [/^(?:[^.]+\. )*Make a (thrown) Spellstrike against a target within your bonded weapons first range increment\. The spell you cast for the Spellstrike can't be a cantrip or focus spell\. If your Strike is successful, figments burst forth from the connecting blow in a @Template\[type:cone\|distance:(\d+)\] bursting from behind the target of your Spellstrike and creatures in the area, excluding the target of your Spellstrike, take (\d+)d(\d+) damage per spell level and must attempt a @Check\[type:(reflex|fortitude|will)\|dc:[^\]]*basic:true[^\]]*\] save\. If your spell was one that can deal damage, the damage of your Cone of Figments is the same type that spell could deal \(or one type of your choice if the spell could deal multiple types of damage\)\. If the spell couldn't deal damage, the bonus damage depends on the spell's school\./,
        (m, { requirement }) => ({ requires: spellstrikeRequires(requirement, { notTraits: ["cantrip", "focus"], table: ["a thrown Spellstrike within the weapon's first range increment"] }),
            riders: [{ type: "spellstrike", hit: [{ type: "cone-burst", feet: Number(m[2]), dice: Number(m[3]), faces: Number(m[4]), statistic: m[5], traits: ["magical", "conjuration"],
                noDamageTypes: ["force", "weapon", "mental", "void", "vitality"] }] }] }), { readsRequirement: true }],
    // Dual-Weapon Spellstrike (Magus+): "Make a Spellstrike but when you do make two Strikes, one with each of your two diametric weapons, each using your current multiple attack
    // penalty. Both Strikes must have the same target. Your second Strike is made with a –3 penalty, or a –2 penalty if it has the agile trait. If either of your Strikes are
    // successful, you gain the effects of your Spellstrike, using the first successful Strike to determine the effects … If neither … you use the first Strike you made …"
    [/^(?:[^.]+\. )*Make a Spellstrike but when you do make two Strikes, one with each of your two diametric weapons, each using your current multiple attack penalty\. Both Strikes must have the same target\. Your second Strike is made with a [–-](\d) penalty, or a [–-](\d) penalty if it has the agile trait\. If either of your Strikes are successful, you gain the effects of your Spellstrike, using the first successful Strike to determine the effects of your Spellstrike\. If neither of your Strikes are successful, you use the first Strike you made to determine the effects of your Spellstrike if it would have an effect on a failure, such as (?:@UUID\[[^\]]+\]\{)?Expansive Spellstrike\}?\.$/,
        (m, { requirement }) => ({ requires: spellstrikeRequires(requirement), riders: [{ type: "spellstrike", dual: { penalty: Number(m[1]), agilePenalty: Number(m[2]) } }] }), { readsRequirement: true }],
    // Scissored Assault (Magic+): "If your next action is to Cast a Spell that requires a spell attack roll, you instead imbue your mystic duo's weapon or unarmed attack with the
    // spell … The next Strike your mystic duo makes determines the effects of both the Strike and the spell, combining all damage for the purposes of calculating resistances. The
    // Strike gains all the traits of the spell. Your mystic link must still be active when the Strike is made and the Strike must be made before the beginning of your next turn
    // or the spell fizzles with no effect." — delivered by the duo's Strike (the damage combined and the traits the table's).
    [/If your next action is to Cast a Spell that requires a spell attack roll, you instead imbue your mystic duo's weapon or unarmed attack with the spell instead of the normal effects\. The next Strike your mystic duo makes determines the effects of both the Strike and the spell, (combining all damage for the purposes of calculating resistances\. The Strike gains all the traits of the spell\.) (Your mystic link must still be active when the Strike is made and the Strike must be made before the beginning of your next turn or the spell fizzles with no effect\.)$/,
        m => ({ requires: { attack: true }, riders: [{ type: "spellstrike", kind: "scissored-assault", striker: "duo" }, { type: "table", text: `The duo's Strike: ${m[1]}` }, { type: "table", text: m[2] }] })],
    // Big Shot (Wizards+): "You Cast a Spell that takes 1 or 2 actions to cast and requires a spell attack roll. The effects of the spell don't occur immediately but are imbued
    // into the next Activation of your makeshift spellgun. Your spell is coupled with the spell attack roll from your spellgun's Activation, using your spell attack roll result
    // to determine the effects of both … This counts as two attacks for your multiple attack penalty …" — delivered by the caster's next attack roll with the spellgun.
    [/^(?:[^.]+\. )*You Cast a Spell that takes 1 or 2 actions to cast and requires a spell attack roll\. The effects of the spell don't occur immediately but are imbued into the next Activation of your makeshift spellgun\. Your spell is coupled with the spell attack roll from your spellgun's Activation, using your spell attack roll result to determine the effects of both the Activation and the spell\. (This counts as two attacks for your multiple attack penalty, but you don't apply the penalty until after you use this activity\.) This activity otherwise has the same limitations as a magus' Spellstrike\.$/,
        m => ({ requires: { actions: [1, 2], attack: true }, riders: [{ type: "spellstrike", kind: "big-shot", striker: "spellgun" }, { type: "table", text: m[1] }] })],
    // Whirling Wand Strike (Magus+): "You can cast a spell from a wand that takes 1 or 2 actions and can make a Strike against a creature. … Alternatively, you can choose to
    // Spellstrike with your wand if it possesses an appropriate spell and you gain a status bonus to damage equal to half the spell's level on your Spellstrike. If you choose to
    // Spellstrike by overcharging a wand, you ignore the flat check …" — a spell from a wand; the Spellstrike asked, with its bonus to the Strike's damage (overcharging the table's).
    [/^(?:[^.]+\. )*You can cast a spell from a wand that takes 1 or 2 actions and can make a Strike against a creature\. (You can choose the order in which these occur and can target different creatures\.) Alternatively, you can choose to Spellstrike with your wand if it possesses an appropriate spell and you gain a status bonus to damage equal to half the spell's level on your Spellstrike\. (If you choose to Spellstrike by overcharging a wand, you ignore the flat check to prevent your wand from being destroyed \(though it still becomes broken as normal\)\.)$/,
        m => ({ requires: { actions: [1, 2], fromWand: true }, riders: [{ type: "spellstrike", ask: "Spellstrike with the wand?", selfRules: [{ key: "FlatModifier", selector: "strike-damage", type: "status", value: "halfRank", removeAfterRoll: "if-enabled" }] },
            { type: "table", text: `Otherwise: ${m[1]}` }, { type: "table", text: m[2] }] })],
    // Eat This! (Magus+): "Make a Spellstrike with a spellshell. Increase the radius of your weapon's scatter trait by 5 feet and increase the additional damage of the scatter trait
    // to be equal to the spell's level instead of the normal amount." — the module's eat-this toggle on for that Strike (its scatter radius); the scatter damage the rank (a note).
    [/^(?:[^.]+\. )*Make a Spellstrike with a spellshell\. Increase the radius of your weapon's scatter trait by (\d+) feet and increase the additional damage of the scatter trait to be equal to the spell's level instead of the normal amount\.$/,
        (m, { requirement }) => ({ requires: spellstrikeRequires(requirement), riders: [{ type: "spellstrike", rollOption: "eat-this", note: "The scatter's additional damage equals the spell's rank (rank {rank})." }] }), { readsRequirement: true }],
    // Tenacious Magic: "Once per day, you can use Mythic Casting without expending a Mythic Point." — the next spell at mythic proficiency, as Mythic Casting
    // gives it (its once a day the table's).
    [/Once per day, you can use @UUID\[Compendium\.pf2e\.feats-srd\.(?:Item\.)?[A-Za-z0-9]+\]\{Mythic Casting\} without expending a Mythic Point\.$/,
        () => ({ requires: {}, riders: [{ type: "mythic-proficiency" }, { type: "table", text: "Once per day." }] })]
];

/** A "+" spellshape: {slug, name, kind: "feat", requires, riders, claimed} or null. */
export function readPlusSpellshape(source) {
    // (A spellshape, or an action without the trait that shapes the next cast the same way — Slot-Charged Spell.)
    const action = ["action", "free", "reaction"].includes(source?.system?.actionType?.value);
    const whole = lead(plain(source.system?.description?.value));
    // (Or an activation a passive feat holds that shapes the next Spellstrike — Living Grimoire's grimoire power.)
    const activation = /\bActivate .+? Effect If your next action is to Spellstrike\b/.test(whole);
    if (!(source?.system?.traits?.value ?? []).includes("spellshape") && !action && !activation) return null;
    const stated = REQUIREMENT_UNSTOPPED.exec(whole) ?? REQUIREMENT.exec(whole) ?? REQUIREMENT_LINKED.exec(whole);
    const requirement = stated?.[1] ?? null;
    const text = requirement ? whole.slice(stated[0].length) : whole;
    for (const [pattern, build, { readsRequirement = false } = {}] of FORMS) {
        const match = pattern.exec(text);
        if (!match) continue;
        // (Before the rule: narration only — no number, link, save, Speed, bonus or penalty; "after you inflict damage upon them" is flavour.)
        const before = text.slice(0, match.index).trim();
        if (/\d|@|\b(?:save|Speed|bonus|penalty)\b/.test(before)) return null;
        const read = build(match, { requirement });
        if (!read) return null;
        // (A Requirements the form doesn't read: the table's — but "Your mystic link is active" (Magic+'s Mystic Duo) is checked.)
        const linked = !readsRequirement && requirement ? /^Your mystic link is active(?: and (.+))?$/.exec(requirement) : null;
        const rest = linked ? linked[1] ?? null : requirement;
        const requires = { ...read.requires, ...(linked ? { mysticLink: true } : {}), ...(rest && !readsRequirement ? { table: [...(read.requires.table ?? []), rest] } : {}) };
        return { slug: source.system?.slug ?? null, name: source.name, kind: "feat", requires, riders: read.riders, claimed: [text], ...(read.passive ? { passive: true } : {}) };
    }
    return null;
}

// (A missing comma between two forms makes one of them an index into the other — undefined: refused as the module loads.)
{
    const bad = FORMS.findIndex(entry => !Array.isArray(entry) || !(entry[0] instanceof RegExp) || typeof entry[1] !== "function");
    if (bad >= 0) throw new Error(`plus-spellshapes.js: FORMS[${bad}] isn't a [pattern, reader] pair.`);
}
