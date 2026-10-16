// The "+" modules' passive features that build on spells (docs/planning/third-party-features-audit.md), read from their whole text:
//   - readTextRules: the rules PF2e should run for the item, built from its text — the module's own rules the text contradicts dropped (`drop`), the text's
//     added (`add`), or the module's rules found to say what the text says (`verified`); applied in memory by scripts/text-rules.js, never saved;
//   - readPassiveCastRider: "When you Cast a Spell …" rules on every cast the holder makes, as spellshape riders (scripts/spellshape-runtime.js).
// A text no form reads stays unread: rules from the text, never from names.
import { condUuidLate as condUuid, condUuidLate, plainApostrophes as plain } from "./text-patterns.js";

const rulesOf = source => source?.system?.rules ?? [];
const selectors = rule => [rule?.selector ?? rule?.selectors ?? []].flat();

// (A condition linked, for the forms below the wickets' own helpers: "@UUID[Compendium.pf2e.conditionitems.xYTAsEpcJE1Ccni3]{Slowed 1}".)
const COND_LINK_LATE = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.(?:Item\.)?[A-Za-z0-9]+)\]\{([A-Z][A-Za-z-]+(?: \d+)?)\}`;
// Text-rule forms: [pattern over the whole text, (match, source) => {add, drop, verified, notes} | null].
const TEXT_RULES = [
    // Rudimentary Perfectionism: "when you Cast a heightened Spell that either deals damage or restores Hit Points, you gain a status bonus to that spell's damage or
    // healing equal to the number of ranks it was heightened or twice that amount if the spell was cast from a spell slot." — the module doubles it for every
    // non-cantrip (a heightened focus spell too): twice only from a slot.
    [/when you Cast a heightened Spell that either deals damage or restores Hit Points, you gain a status bonus to that spell's damage or healing equal to the number of ranks it was heightened or (twice) that amount if the spell was cast from a spell slot\. This applies only to the initial damage or healing the spell deals when cast\. An individual creature takes this damage or benefits from this healing only once per spell, even if the spell would damage or heal that creature multiple times\./,
        () => ({ drop: rule => rule.key === "FlatModifier" && selectors(rule).some(selector => ["spell-damage", "spell-healing"].includes(selector)),
            add: [{ key: "FlatModifier", phase: "afterDerived", selector: ["spell-damage", "spell-healing"], type: "status", slug: "rudimentary-perfectionism", value: "2*((@spell.level) - (@spell.baseLevel))", predicate: ["item:spell-slot"] },
                { key: "FlatModifier", phase: "afterDerived", selector: ["spell-damage", "spell-healing"], type: "status", slug: "rudimentary-perfectionism", value: "(@spell.level) - (@spell.baseLevel)", predicate: [{ not: "item:spell-slot" }] }],
            notes: ["You can prepare two additional cantrips per day (the table's)."] })],
    // Power of Blood (Haemothurge): "the DC of the flat check to end persistent bleed damage for you is reduced from 15 to 12, from 15 to 10 if you are at least 9th
    // level, from 15 to 8 if you are at least 13th level, or from 15 to 5 if you are at least 17th level (or 5 less than these numbers if you have particularly
    // effective assistance …)" — the module's first note says 8 with assistance: the text's numbers in each note.
    [/the DC of the flat check to end persistent bleed damage for you is reduced from 15 to (\d+), from 15 to (\d+) if you are at least (\d+)th level, from 15 to (\d+) if you are at least (\d+)th level, or from 15 to (\d+) if you are at least (\d+)th level \(or (\d+) less than these numbers if you have particularly effective assistance to a minimum of an automatic success at \d+th level\)\./,
        m => {
            const steps = [[Number(m[1]), 1, Number(m[3])], [Number(m[2]), Number(m[3]), Number(m[5])], [Number(m[4]), Number(m[5]), Number(m[7])], [Number(m[6]), Number(m[7]), null]];
            const less = Number(m[8]);
            return { drop: rule => rule.key === "Note" && selectors(rule).includes("pd-recovery-check"),
                add: steps.map(([dc, from, to]) => ({ key: "Note", selector: "pd-recovery-check", title: "Haemothurge",
                    text: `The DC of the flat check to end persistent bleed damage for you is reduced from 15 to ${dc} (or to ${Math.max(0, dc - less)}${dc - less <= 0 ? ", an automatic success," : ""} if you have particularly effective assistance).`,
                    predicate: ["item:damage:type:bleed", { gte: ["{actor|level}", from] }, ...(to ? [{ lt: ["{actor|level}", to] }] : [])] })) };
        }],
    // Wayward Gifts' Effect: the module's rules say what the text says — +1 status to the tradition's skill; arcane "a status bonus to that spell's damage equal to
    // the spell's rank" (slot spells with no duration that deal damage); divine's holy or unholy; occult's mental resistance (half the level, minimum 1). (Primal's
    // temporary Hit Points on Sustaining a hex: scripts/text-rules.js.)
    [/^While in an encounter and you have at least one hex active, you gain the listed effect depending on your tradition:? Arcane Your magic ripples with untamed power\. You gain a \+1 status bonus to Arcana checks and when you Cast a Spell from your spell slots that deals damage and doesn't have a duration, you gain a status bonus to that spell's damage equal to the spell's rank\. Divine You gain the might of divinity\. You gain a \+1 status bonus to Religion checks and you gain either the holy trait or the unholy trait\./,
        (m, source) => {
            const rules = rulesOf(source);
            const damage = rules.find(rule => rule.key === "FlatModifier" && selectors(rule).includes("spell-damage"));
            const ok = damage?.type === "status" && damage.value === "@spell.level" && ["item:spell-slot", "item:duration:0", "damaging-effect"].every(option => (damage.predicate ?? []).includes(option))
                && ["arcana", "religion", "occultism", "nature"].every(skill => rules.some(rule => rule.key === "FlatModifier" && selectors(rule).includes(skill) && rule.value === 1 && rule.type === "status"))
                && rules.some(rule => rule.key === "Resistance" && rule.type === "mental" && /max\(floor\(@actor\.level\/2\),\s*1\)/.test(String(rule.value)));
            return ok ? { verified: true } : null;
        }],
    // Effect: Comfort of Struggle: "You gain either a +1 status bonus to the next spell attack roll you attempt before the end of your turn, or a -1 status penalty to
    // your next saving throw against a spell the origin casts." with its feat's "If you are cursebound 2 when you use Comfort of Struggle, the status bonus and
    // penalty each increase to 2, and if you are cursebound 3, … to 3" — the module's max(cursebound, 3) is never below 3, and lasts past the next roll: the value
    // the Effect's level (the origin's cursebound value, set as it's made — scripts/text-rules.js), up to 3, gone after the roll.
    [/^Granted by @UUID\[[^\]]+\]\{Comfort of Struggle\} to either the caster or the target enemy You gain either a \+(\d) status bonus to the next spell attack roll you attempt before the end of your turn, or a -(\d) status penalty to your next saving throw against a spell the origin casts\.$/,
        (m, source) => {
            const choice = rulesOf(source).find(rule => rule.key === "ChoiceSet" && rule.rollOption === "comfort-of-struggle");
            if (!choice) return null;
            const value = `min(3,max(${Number(m[1])},@item.level))`;
            return { drop: rule => rule.key === "FlatModifier", levelFrom: "origin-cursebound",
                add: [{ key: "FlatModifier", selector: ["spell-attack-roll"], type: "status", value, predicate: ["comfort-of-struggle:bonus"], removeAfterRoll: "if-enabled" },
                    { key: "FlatModifier", selector: ["saving-throw"], type: "status", value: `-${value}`, predicate: ["comfort-of-struggle:penalty", "origin:signature:{item|origin.signature}", "item:type:spell"], removeAfterRoll: "if-enabled" }] };
        }],
    // Wildblood Instinct (Barbarians+): "You do not deal additional damage with Rage on your melee Strikes, but instead deal your additional damage from Rage on damage
    // dealing spells with the rage trait that you cast from spell slots or that you gained from feats from this archetype. This applies only to the initial damage the
    // spell deals when cast." with its "When you rage, increase the additional damage from Rage from 2 to 4. If you have greater weapon specialization, instead increase
    // the damage from 4 to 8." — the module's rules say it: its spell damage modifier while raging (slug wildblood-rage, 2, upgraded to 4 from 7th and 8 with greater
    // weapon specialization for a barbarian), the rage trait on damaging spells, and no rage damage on Strikes without its infusion. (The infusion after a cast:
    // its passive rider below.)
    [/You do not deal additional damage with Rage on your melee Strikes, but instead deal your additional damage from Rage on damage dealing spells with the rage trait that you cast from spell slots or that you gained from feats from this archetype\. This applies only to the initial damage the spell deals when cast\..*Specialization Ability \((\d+)th\) When you rage, increase the additional damage from Rage from (\d+) to (\d+)\. If you have greater weapon specialization, instead increase the damage from \3 to (\d+)\./,
        (m, source) => {
            const rules = rulesOf(source).filter(rule => rule.slug === "wildblood-rage" && selectors(rule).includes("spell-damage"));
            const flat = rules.find(rule => rule.key === "FlatModifier" && rule.value === Number(m[2]) && (rule.predicate ?? []).includes("self:effect:rage"));
            const level = rules.find(rule => rule.key === "AdjustModifier" && rule.mode === "upgrade" && rule.value === Number(m[3]) && JSON.stringify(rule.predicate ?? []).includes(`["self:level",${m[1]}]`));
            const greater = rules.find(rule => rule.key === "AdjustModifier" && rule.mode === "upgrade" && rule.value === Number(m[4]) && (rule.predicate ?? []).includes("feature:greater-weapon-specialization"));
            const strikes = rulesOf(source).some(rule => rule.key === "AdjustModifier" && rule.mode === "override" && rule.slug === "rage" && rule.value === 0 && JSON.stringify(rule.predicate ?? []).includes('{"not":"wildblood-rage"}'));
            return flat && level && greater && strikes ? { verified: true } : null;
        }],
    // Overwhelming (power ring rune): "Spell attacks you modify with Veracious Spell are a critical success on a 19 …" — the module's degree rule takes every spell attack; dropped (its
    // passive rider below, with Veracious Spell only).
    [/Spell attacks you modify with Veracious Spell are a critical success on a \d+ on the die as long as that result is a success\./,
        () => ({ drop: rule => rule.key === "AdjustDegreeOfSuccess" && selectors(rule).includes("spell-attack") })],
    // Effect: Scholar's Lore: "The creature has a –1 status penalty to its saves and AC against the next spell you cast that encounter." — the module's applies to
    // every spell, anyone's: only the origin's spells (gone after its next spell: its Scholar's Lore feat's passive rider).
    [/^The creature has a [–-](\d) status penalty to its saves and AC against the next spell you cast that encounter\.$/,
        m => ({ drop: rule => rule.key === "FlatModifier",
            add: [{ key: "FlatModifier", selector: ["saving-throw", "ac"], type: "status", value: -Number(m[1]), predicate: ["origin:signature:{item|origin.signature}", "item:type:spell"] }] })],
    // Effect: Embodiment Ring Rune: "you gain a status bonus to Strikes equal to the ring's item bonus until the spell ends." — the module's is an item bonus to every attack:
    // a status bonus to Strike attack rolls, the ring's bonus (its origin's).
    [/^Your ring swirls with the malleable magical essences\. When you Cast a Spell with the polymorph trait that grants a battle form, you gain a status bonus to Strikes equal to the ring's item bonus until the spell ends\.$/,
        (m, source) => source?.type === "effect" ? { drop: rule => rule.key === "FlatModifier", add: [{ key: "FlatModifier", selector: "strike-attack-roll", type: "status", value: "@item.origin.flags.pf2e.ringofpower" }] } : null]
];

/** The rules the item's text gives PF2e: {add, drop, verified, notes} (functions kept in memory), or null when no form reads it. */
export function readTextRules(source) {
    const text = plain(source?.system?.description?.value);
    if (!text) return null;
    for (const [pattern, build] of TEXT_RULES) {
        const match = pattern.exec(text);
        if (!match) continue;
        const read = build(match, source);
        if (read) return { name: source.name, ...read };
    }
    return null;
}

/** The item's rules after its text: the module's kept but those dropped, the text's added. */
export function rulesWithText(rules, read) {
    if (!read || (!read.add && !read.drop)) return rules;
    return [...(rules ?? []).filter(rule => !read.drop?.(rule)), ...structuredClone(read.add ?? [])];
}

// The table's: features whose rule is the holder's or the GM's own doing — a preparation, a choice of where a spell starts, a stance's Strikes, a held spell — read,
// with nothing the module applies at the cast (a reminder of the text).
const TABLE = [
    /you can attune a mundane staff to be a magical staff by expending a spell slot from your divine font slots/,
    /You regain the most recent spell slot you spent to dispel magic or to Counterspell\. If you Cast a Spell with this spell slot, your spell gains the bold trait\./,
    /You have learned how to help others shape spells by weaving your own magical signature with theirs\./,
    /When you Cast a Spell underwater, you do not lose all remaining air if it would require speech but instead lose 2 rounds of air as normal for taking actions while holding your breath\./,
    /These holograms hide your spell effects while within the area, giving any spells you Cast the subtle trait\./,
    /When you Cast a Spell with no duration, you can choose to use your or your mystic duo's position for the purposes of determining the point of casting for the spell\./,
    /when you Cast a Spell you learned in this way from another tradition, it gains the cursebound trait\./,
    /The spell you cast does not take effect and is instead contained within the glyph, triggering when a creature you specify enters the area of the glyph\./,
    /You can expend a separate prepared spell slot of any rank you have to cast your Consulted Spell, heightening to the expended spell's rank/,
    /With some precise aerobic motions, you harness some of your spell's energy\. You gain temporary Hit Points equal to your Intelligence modifier\./,
    /When you Cast a Spell that requires a spell attack roll spell, you can select (?:a single square|up to (?:two|three) squares) within 15 feet to be the new point of origin for the spell\./
];

// Passive cast riders: [pattern, match => {requires, riders}].
const PASSIVE = [
    // Embodiment (a power ring rune): "When you Cast a Spell with the polymorph trait that grants a battle form, you gain a status bonus to Strikes equal to the ring's item
    // bonus until the spell ends." — on the caster for the spell's duration.
    [/When you Cast a Spell with the polymorph trait that grants a battle form, you gain a status bonus to Strikes equal to the ring's item bonus until the spell ends\./,
        () => ({ requires: { anyTraits: ["polymorph"], table: ["it grants a battle form"] }, riders: [{ type: "self-rules", label: "status bonus to Strikes", forSpell: true, rules: [{ key: "FlatModifier", selector: "strike-attack-roll", type: "status", value: "ringBonus" }] }] })],
    // Cloaked Casting: "When you target a single enemy with one of your wizard spells and the creature is Off-Guard to you, they also take a –1 circumstance penalty to
    // their saves or you gain a +1 circumstance bonus to your spell attack rolls against them." — the attack bonus the module's rule; the save penalty on the card
    // (that save only). The concealment kept while casting and the Unified Theory slot are the table's.
    [/When you target a single enemy with one of your ([a-z]+) spells and the creature is @UUID\[[^\]]+\]\{Off-Guard\} to you, they also take a [–-](\d) circumstance penalty to their saves or you gain a \+\d circumstance bonus to your spell attack rolls against them\./,
        m => ({ requires: { singleTarget: true, table: [`one of your ${m[1]} spells`] }, riders: [{ type: "offguard-save-penalty", value: Number(m[2]), modifierType: "circumstance" }] })],
    // Extended Cloaking: "When you Cast a Spell from your wizard spell slots against an enemy Off-Guard to you, you become Concealed to that enemy for a number rounds
    // equal to the rank of the spell. You lose this concealment if you take a hostile action against that enemy." — a reminder Effect on the caster, each such enemy.
    [/When you Cast a Spell from your ([a-z]+) spell slots against an enemy @UUID\[[^\]]+\]\{Off-Guard\} to you, you become @UUID\[[^\]]+\]\{Concealed\} to that enemy for a number rounds equal to the rank of the spell\. (You lose this concealment if you take a hostile action against that enemy\.)/,
        m => ({ requires: { fromSlots: true, table: [`from your ${m[1]} spell slots`] }, riders: [{ type: "offguard-concealed", rounds: "rank", note: m[2] }] })],
    // Monstrous Familiar: "When you Cast a Spell from your spell slots that grants a battle form such as Dragon Form or Monstrosity Form, you may cast it on your
    // familiar rather than yourself. In this form, on top of the temporary Hit Points it gained from the battle form, your familiar gains an additional 4 Hit Points
    // for every level you have. …" — asked at the cast; the form's Effect on the familiar, with the module's Effect (temporary Hit Points 4 × the level).
    [/When you Cast a Spell from your spell slots that grants a battle form such as @UUID\[[^\]]+\]\{[^}]+\} or @UUID\[[^\]]+\]\{[^}]+\}, you may cast it on your familiar rather than yourself\. In this form, on top of the temporary Hit Points it gained from the battle form, your familiar gains an additional (\d+) Hit Points for every level you have\. (Your familiar still has the minion trait while in this form, but cannot use actions or activities that would require it to be given a Command while in this battleform\.) While in this form, your familiar can make Strikes with attacks it gains from its battleform\. @UUID\[([^\]]+)\]\{(Effect: [^}]+)\}/,
        m => ({ requires: { fromSlots: true, anyTraits: ["polymorph"] }, riders: [{ type: "redirect-self", to: "familiar", optional: true, alsoEffect: { uuid: m[3], name: m[4] } }, { type: "table", text: m[2] }] })],
    // Scholar's Lore: "the creature has a –1 status penalty to its saves and AC against the next spell you cast that encounter" — its Effect gone after that spell's
    // card (the Effect itself given on the Recall Knowledge, the table's).
    [/the first time you successfully identify a creature during an encounter using Recall Knowledge with your scholar's Lore skills, the creature has a [–-]\d status penalty to its saves and AC against the next spell you cast that encounter\./,
        () => ({ requires: {}, riders: [{ type: "consume-target-effect", effectName: "Effect: Scholar's Lore" }] })],
    // Wildblood Instinct: "If you Cast a Spell, your melee Strikes deal your additional rage damage until the end of your next turn and the damage type of your additional
    // damage changes to be the same as the damage of the spell if the spell dealt damage. If the spell deals more than one type of damage, you choose which damage type
    // your Strikes gain when the spell's damage is resolved." — the module's Effect: Wildblood Infusion on the caster after every cast, its type the spell's (asked when
    // several), replacing an earlier one.
    [/If you Cast a Spell, your melee Strikes deal your additional rage damage until the end of your next turn and the damage type of your additional damage changes to be the same as the damage of the spell if the spell dealt damage\. If the spell deals more than one type of damage, you choose which damage type your Strikes gain when the spell's damage is resolved\. @UUID\[([^\]]+)\]\{(Effect: [^}]+)\}/,
        m => ({ requires: {}, riders: [{ type: "self-effect", uuid: m[1].replace(/^(Compendium\.[^.]+\.[^.]+)\.(?!Item\.)/, "$1.Item."), name: m[2], choiceFromDamage: true, replace: true }] })],
    // Havok Cascade (Magus+, its stance): "While you are in the Havok Cascade stance, you can use actions with the havok trait and when you use these actions you take damage equal to
    // your level. If you resist this damage, remove it, or otherwise avoid taking it, your havok action automatically fails and has no effect." — a havok spell's cast (Wreak Havok).
    [/While you are in the Havok Cascade stance, you can use actions with the (havok) trait and when you use these actions you take (?:\[\[[^\]]*\]\]\{)?damage equal to your level\}?\. If you resist this damage, remove it, or otherwise avoid taking it, your havok action automatically fails and has no effect\./,
        m => ({ requires: {}, riders: [{ type: "self-damage", formula: "level", ifTraits: [m[1]], failsIfAvoided: true }] })],
    // Stigmata (Clerics): "While you are suffering from this persistent bleed damage, … Harm Your harm spells that target a single creature deal 1d4 persistent bleed damage for every 4
    // levels you possess to targets that fail their Fortitude save. If you use the 3-action cast, only targets that critically fail their save take persistent bleed damage. Heal …"
    // — the Harm rider (the Heal part: plus-cast-riders-runtime.js stigmataOnHealing).
    [/While you are suffering from this persistent bleed damage, you receive a \+1 status bonus to Religion checks and your harm and heal spells gain the following additional effect: Harm Your @UUID\[[^\]]+\]\{Harm\} spells that target a single creature deal 1d4 persistent bleed damage for every 4 levels you possess to targets that fail their Fortitude save\. If you use the 3-action cast, only targets that critically fail their save take persistent bleed damage\./,
        () => ({ requires: { spells: ["Harm"] }, riders: [{ type: "persistent", formula: "per4levels-d4", damageType: "bleed", degrees: ["failure", "criticalFailure"], degreesByActions: { 3: ["criticalFailure"] }, whileCasterBleeding: true }] })],
    // Essence Mystic Dedication (Magus+): "When you cast a conflux spell that does not have the havok trait, you can choose to give it the havok trait, giving you a +1 status bonus
    // to any attacks you make as part of Casting the Spell and doubling the damage from your havok cascade until the beginning of your next turn. Effect: Essence Mystic Dedication"
    // — asked at the cast; the spell then a havok one for the caster's riders (Havok Cascade's damage), the module's Effect (its +1, the doubling) until the next turn starts.
    [/When you cast a conflux spell that does not have the havok trait, you can choose to give it the havok trait, giving you a \+1 status bonus to any attacks you make as part of Casting the Spell and doubling the damage from your havok cascade until the beginning of your next turn\. @UUID\[([^\]]+)\]\{(Effect: [^}]+)\}/,
        m => ({ requires: { traits: ["conflux"], notTraits: ["havok"] }, riders: [{ type: "havok-choice", effect: { uuid: m[1].replace(/^(Compendium\.[^.]+\.[^.]+)\.(?!Item\.)/, "$1.Item."), name: m[2] } }] })],
    // Inventors+: Arcane Generator — "While under the effects of Overdrive, when you Cast a Spell that requires a save that deals damage, has no duration, and targets a single
    // creature, you add the damage from your Overdrive to the damage of a failure, or twice that amount on a critical failure. If a spell deals damage multiple times or has multiple
    // saves, you apply this damage only to the first failed save that dealt damage." Transmogrification Boost — the same with "the damage from your Offensive Boost".
    [/(?:(While under the effects of) @Compendium\[[^\]]+\]\{Overdrive\}, w|W)hen you Cast a Spell that requires a save that deals damage, has no duration, and targets a single creature, you add the damage from your (Overdrive|Offensive Boost) to (?:the damage of a failure|creatures that fail their save), or twice that amount (?:on a critical failure|if they critically fail their save)\. If a spell deals damage multiple times or has multiple saves, you apply this damage (?:only )?to the first failed save that dealt damage\./,
        m => ({ requires: { hasSave: true, damaging: true, noDuration: true, singleTarget: true }, riders: [{ type: "borrowed-damage", from: m[2] === "Overdrive" ? "overdrive" : "offensive-boost", whileOverdrive: Boolean(m[1]) }] })],
    // Magic+'s power ring runes, worn (the rune's own item; its choice the rune's trait or damage type):
    // Immobilizing: "When you critically succeed at a spell attack roll with a spell that has no duration and has the trait of the rune, the target is also Slowed 1 until the end of
    // your next turn unless it succeeds at a DC 24 Fortitude save."
    [new RegExp(String.raw`When you critically succeed at a spell attack roll with a spell that has no duration and has the trait of the rune, the target is also ${COND_LINK_LATE} until the end of your next turn unless it succeeds at a @Check\[dc:(\d+)\|type:(fortitude|reflex|will)\] save\.`),
        (m, source) => {
            const trait = source?.flags?.pf2e?.rulesSelections?.trait;
            const [slug, value] = [m[2].replace(/ \d+$/, "").toLowerCase(), Number(/ (\d+)$/.exec(m[2])?.[1] ?? 0) || null];
            return { requires: { attack: true, noDuration: true, ...(trait ? { traits: [trait] } : {}) }, riders: trait ? [{ type: "attack-crit", save: { statistic: m[4], dc: Number(m[3]) },
                failure: { conditions: [{ uuid: condUuidLate(m[1]), slug, value, until: "caster-next-turn-end" }] } }] : [] };
        }],
    // Ramming: "Spell attacks gain the razing trait. On a critically successful spell attack against a creature, the target must also make a DC 22 Fortitude save or be pushed back 10
    // feet from the origin of the spell." — away from the caster; the razing trait the table's.
    [/(Spell attacks gain the razing trait\.) On a critically successful spell attack against a creature, the target must also make a @Check\[dc:(\d+)\|type:(fortitude|reflex|will)\] save or be pushed back (\d+) feet from the origin of the spell\./,
        m => ({ requires: { attack: true }, riders: [{ type: "attack-crit", save: { statistic: m[3], dc: Number(m[2]) }, failure: { push: Number(m[4]) } }, { type: "table", text: m[1] }] })],
    // Scourging: "When you critically succeed at a spell attack roll with a spell that has no duration and deals the damage type of the rune, the target also takes 1d10 persistent
    // damage of the same type the spell would deal or bleed damage if the spell dealt physical damage. If the spell would already deal persistent damage, the DC to end the persistent
    // damage increases by 2."
    [/When you critically succeed at a spell attack roll with a spell that has no duration and deals the damage type of the rune, the target also takes @Damage\[(\d+d\d+)\[[^\]]*\]\] persistent damage of the same type the spell would deal or bleed damage if the spell dealt physical damage\. (If the spell would already deal persistent damage, the DC to end the persistent damage increases by 2\.)/,
        (m, source) => {
            const chosen = source?.flags?.pf2e?.rulesSelections?.scourging;
            if (!chosen?.damageType) return { requires: { attack: true, noDuration: true }, riders: [] };
            const physical = chosen.damageType === "bleed";
            return { requires: { attack: true, noDuration: true, damageTypesAny: physical ? ["bludgeoning", "piercing", "slashing"] : [chosen.damageType] }, riders: [{ type: "attack-crit",
                persistent: { formula: m[1], damageType: chosen.damageType } }, { type: "table", text: m[2] }] };
        }],
    // Perishing: "Activate—Die! (concentrate, death, incapacitation) Trigger You roll a natural 20 on a spell attack roll with spell attack with no duration that deals damage. The
    // target must succeed at a DC 37 Fortitude save or die …" — offered on that natural 20 (the reaction the caster's).
    [/Activate\s*[—–-]\s*(Die!) r \(([a-z, ]+)\) Trigger You roll a natural 20 on a spell attack roll with spell attack with no duration that deals damage\. The target must succeed at a @Check\[dc:(\d+)\|type:(fortitude|reflex|will)\] save or die by destroying its heart\. (This kills any creature except ones that don't require a heart to live\.[^@]*)/,
        (m, source) => ({ requires: { attack: true, noDuration: true, damaging: true }, riders: [{ type: "attack-crit", natural: 20, save: { statistic: m[4], dc: Number(m[3]) },
            reaction: { name: m[1], traits: m[2].split(/,\s*/), rank: Math.max(1, Math.ceil(Number(source?.system?.level?.value ?? 1) / 2)), note: m[5].trim() } }] })],
    // Overwhelming: "Spell attacks you modify with Veracious Spell are a critical success on a 19 on the die as long as that result is a success." — only with Veracious Spell (the
    // module's rule takes every spell attack: its text rule drops it).
    [/Spell attacks you modify with Veracious Spell are a critical success on a (\d+) on the die as long as that result is a success\./,
        m => ({ requires: { attack: true }, riders: [{ type: "natural-crit", natural: Number(m[1]), withVeracious: true }] })],
    // Power of Blood (Haemothurge): "When you Cast a Spell from your spell slots, you take persistent bleed damage equal to the rank of the spell. This persistent
    // bleed damage bypasses any resistances or immunities."
    [/When you Cast a Spell from your spell slots, you take persistent ([a-z]+) damage equal to the rank of the spell\. This persistent \1 damage bypasses any resistances or immunities\./,
        m => ({ requires: { fromSlots: true }, riders: [{ type: "self-persistent", formula: "rank", damageType: m[1], bypass: true }] })]
];

// Magic+'s wickets: "Wicket Traits fire, light Threaded Magic … Overwhelming Wicket …" with Eldritch Wicketeer Dedication's "When you Cast a Spell from Focus
// Points or spell slots with at least one of your wicket's traits while within the area, you gain your wicket's threaded magic effect. … You can only trigger a
// tethered magic effect once per round." and Through the Wicket's "At 11th level, you gain the Overwhelming Wicket ability while within the area of your
// wicket's dominion." — each part's riders, gated by the spell's traits (`ifTraits`), threaded (once a round) or overwhelming (11th level).
const COND_LINK = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.(?:Item\.)?[A-Za-z0-9]+)\]\{([A-Z][A-Za-z-]+)\}`;
const unlink = text => text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/@Template\[[^\]]*\]\{([^}]+)\}/g, "$1");
const WICKET_PARTS = [
    // Luminor (threaded): "All of your fire spells gain the light trait. When you successfully make a spell attack roll or a creature fails its save against a spell with
    // the fire trait, the creature takes persistent fire damage equal to the rank of the spell. If the spell would already deal persistent fire damage, you instead
    // increase the persistent fire damage by this amount."
    [/^(All of your fire spells gain the light trait\.) When you successfully make a spell attack roll or a creature fails its save against a spell with the (fire) trait, the creature takes @Damage\[@item\.(?:level|rank)\[persistent,(fire)\]\]\{persistent fire damage\} equal to the rank of the spell\. If the spell would already deal persistent fire damage, you instead increase the persistent fire damage by this amount\.$/,
        m => [{ type: "table", text: m[1] }, { type: "persistent", when: "hit-or-failed", formula: "rank", damageType: m[3], ifTraits: [m[2]], raisesOwn: true, followSwap: true }]],
    // Luminor (overwhelming): "When you Cast a Spell with the fire trait that deals damage, you can choose to deal spirit damage instead of fire damage. You can deal spirit
    // damage instead of fire damage with your threaded magic. When you Cast a Spell with the light trait that would require a save, the creature is Blinded for 1 round
    // on a critical failure." (Its fire spells have the light trait: the threaded rule.)
    [new RegExp(String.raw`^When you Cast a Spell with the ([a-z]+) trait that deals damage, you can choose to deal ([a-z]+) damage instead of \1 damage\. You can deal \2 damage instead of \1 damage with your threaded magic\. When you Cast a Spell with the ([a-z]+) trait that would require a save, the creature is ${COND_LINK} for (\d+) rounds? on a critical failure\.$`),
        m => [{ type: "damage-type", from: m[1], to: m[2], optional: true, ifTraits: [m[1]] },
            { type: "conditions", ifTraits: [m[3], m[1]], degrees: { criticalFailure: [{ uuid: condUuid(m[4]), slug: m[5].toLowerCase(), value: null, rounds: Number(m[6]) }] } }]],
    // Propulsor (threaded): "When you successfully make a spell attack roll or a creature fails its save against a spell with the water trait, you push the target 5 feet in
    // a direction of your choice (or 10 feet if …critical…). This is forced movement. When you cast a force spell, you can remove the prone condition from a creature
    // within the area of your wicket's dominion, as if they had used the Stand action. …" — pushed away from the caster (the GM's to turn); the Stand the table's.
    [/^When you successfully make a spell attack roll or a creature fails its save against a spell with the ([a-z]+) trait, you push the target (\d+) feet in a direction of your choice \(or (\d+) feet if your spell attack roll was a critical success or the creature's save was a critical failure\)\. This is forced movement\. (When you cast a ([a-z]+) spell, you can remove the prone condition from a creature within the area of your wicket's dominion, as if they had used the @UUID\[[^\]]+\]\{Stand\} action\. This Stand action does not provoke reactions\.)$/,
        m => [{ type: "push", degrees: { failure: Number(m[2]), criticalFailure: Number(m[3]) }, attackDegrees: { success: Number(m[2]), criticalSuccess: Number(m[3]) }, from: {}, ifTraits: [m[1]] },
            { type: "table", text: unlink(m[4]), ifTraits: [m[5]] }]],
    // Propulsor (overwhelming): "When you Cast a Spell with the water trait that deals bludgeoning damage, you can choose to deal force damage instead of bludgeoning damage.
    // When you damage a creature with a force spell that does not require a saving throw, they must attempt a Fortitude save against your spell DC. Creatures that fail
    // their save are Off-Guard until the end of their next turn, or are knocked Prone on a critical failure."
    [new RegExp(String.raw`^When you Cast a Spell with the ([a-z]+) trait that deals ([a-z]+) damage, you can choose to deal ([a-z]+) damage instead of \2 damage\. When you damage a creature with a ([a-z]+) spell that does not require a saving throw, they must attempt a @Check\[type:(fortitude|reflex|will)\|dc:[^\]]+\] save against your spell DC\. Creatures that fail their save are ${COND_LINK} until the end of their next turn, or are knocked ${COND_LINK} on a critical failure\.$`),
        m => [{ type: "damage-type", from: m[2], to: m[3], optional: true, ifTraits: [m[1]] },
            { type: "damaged-save", ifTraits: [m[4]], noSave: true, statistic: m[5], outcomes: { criticalSuccess: "The creature is unaffected.", success: "The creature is unaffected.",
                failure: `The creature is @UUID[${condUuid(m[6])}]{${m[7]}} until the end of its next turn.`, criticalFailure: `The creature is knocked @UUID[${condUuid(m[8])}]{${m[9]}}.` } }]],
    // Verdor (threaded): "Choose 4 contiguous squares within 30 feet. You create a small growth of plants and wood that provide lesser cover …" — the caster's placement
    // (the table's).
    [/^(Choose \d+ contiguous @Template\[[^\]]*\]\{squares\} within \d+ feet\. You create a small growth of plants and wood that provide lesser cover that lasts for as long as your wicket's dominion remains in effect\. If you choose the same square more than once with this effect, they provide standard cover instead of lesser cover\.)$/,
        m => [{ type: "table", text: unlink(m[1]) }]],
    // Verdor (overwhelming): "When you Cast a Spell with the plant or wood traits that would require a save, the creature is Immobilized for 1 round on a critical failure.
    // The escape DC for this effect is your spell DC."
    [new RegExp(String.raw`^When you Cast a Spell with the ([a-z]+) or ([a-z]+) traits that would require a save, the creature is ${COND_LINK} for (\d+) rounds? on a critical failure\. (The escape DC for this effect is your spell DC\.)$`),
        m => [{ type: "conditions", ifTraits: [m[1], m[2]], degrees: { criticalFailure: [{ uuid: condUuid(m[3]), slug: m[4].toLowerCase(), value: null, rounds: Number(m[5]) }] } }, { type: "table", text: m[6] }]],
    // Erosior (threaded): "When you successfully make a spell attack roll or a creature fails its save against a spell with the earth trait, you create difficult terrain in
    // squares adjacent to the target. When … the acid trait, you create hazardous terrain in all squares adjacent to the target. The hazardous terrain deals acid damage
    // equal to the rank of the spell that created it each time a creature passes through the area. The difficult terrain and hazardous terrain remain in the same area
    // for as long as your wicket's dominion is in effect."
    [/^When you successfully make a spell attack roll or a creature fails its save against a spell with the ([a-z]+) trait, you create difficult terrain in squares adjacent to the target\. When you successfully make a spell attack roll or a creature fails its save against a spell with the ([a-z]+) trait, you create hazardous terrain in all squares adjacent to the target\. The hazardous terrain deals @Damage\[@item\.(?:rank|level)\[([a-z]+)\]\]\{[^}]+\} that created it each time a creature passes through the area\. The difficult terrain and hazardous terrain remain in the same area for as long as your wicket's dominion is in effect\.$/,
        m => [{ type: "terrain", where: "around-creature", each: true, feet: 5, difficult: true, when: "hit-or-failed", whileDominion: true, ifTraits: [m[1]] },
            { type: "terrain", where: "around-creature", each: true, feet: 5, difficult: false, hazard: { formula: "rank", damageType: m[3], per: "pass" }, when: "hit-or-failed", whileDominion: true, ifTraits: [m[2]] }]],
    // Erosior (overwhelming): "When you Cast a Spell with the acid trait that deals damage, you can choose to deal bludgeoning damage instead of acid damage. When you Cast a
    // Spell with the earth trait that would require a save, the creature takes a –5-foot status penalty to its Speed for 1 round on a failure, or a –10-foot status
    // penalty if it was a critical failure."
    [/^When you Cast a Spell with the ([a-z]+) trait that deals damage, you can choose to deal ([a-z]+) damage instead of \1 damage\. When you Cast a Spell with the ([a-z]+) trait that would require a save, the creature takes a [–-](\d+)-foot status penalty to its Speed for (\d+) rounds? on a failure, or a [–-](\d+)-foot status penalty if it was a critical failure\.(?: @UUID\[[^\]]+\]\{[^}]+\})?$/,
        m => [{ type: "damage-type", from: m[1], to: m[2], optional: true, ifTraits: [m[1]] },
            { type: "degree-rules", ifTraits: [m[3]], rounds: Number(m[5]), label: "Speed penalty",
                degrees: { failure: [{ key: "FlatModifier", selector: "all-speeds", type: "status", value: -Number(m[4]) }], criticalFailure: [{ key: "FlatModifier", selector: "all-speeds", type: "status", value: -Number(m[6]) }] } }]],
    // Mortisor (threaded): "When a creature within the area of your wicket's dominion below half Hit Points is targeted by one of your death or void spells, it becomes
    // Frightened 2. This is an emotion, fear, and mental effect. The creature is then immune to this effect for 1 minute."
    [new RegExp(String.raw`^When a creature within the area of your wicket's dominion below half Hit Points is targeted by one of your ([a-z]+) or ([a-z]+) spells, it becomes @UUID\[(Compendium\.pf2e\.conditionitems\.(?:Item\.)?[A-Za-z0-9]+)\]\{([A-Z][a-z]+) (\d)\}\. This is an? ((?:[a-z]+, )*[a-z]+,? and [a-z]+) effect\. The creature is then immune to this effect for (\d+) minutes?\.(?: @UUID\[[^\]]+\](?:\{[^}]+\})?)?$`),
        m => [{ type: "targeted-condition", ifTraits: [m[1], m[2]], belowHalf: true, inDominion: true, list: [{ uuid: condUuid(m[3]), slug: m[4].toLowerCase(), value: Number(m[5]) }],
            unlessImmune: m[6].split(/,\s*(?:and\s+)?|\s+and\s+/).map(entry => entry.trim()).filter(Boolean), immunityMinutes: Number(m[7]) }]],
    // Mortisor (overwhelming): "When you Cast a Spell with the death trait on an undead, it is not automatically immune to the effect and is destroyed when it would normally
    // die. When you Cast a Spell with the void trait that would target an undead creature, you can choose to deal spirit damage instead of void damage if the spell deals
    // damage and the spell gains the spirit trait instead of the void trait if you do. You gain a +2 status bonus against mental effects for 1 round when you reduce a
    // creature to 0 Hit Points."
    [/^(When you Cast a Spell with the death trait on an undead, it is not automatically immune to the effect and is destroyed when it would normally die\.) When you Cast a Spell with the ([a-z]+) trait that would target an undead creature, you can choose to deal ([a-z]+) damage instead of \2 damage if the spell deals damage and the spell gains the \3 trait instead of the \2 trait if you do\. You gain a \+(\d+) status bonus against (mental) effects for (\d+) rounds? when you reduce a creature to 0 Hit Points\.$/,
        m => [{ type: "table", text: m[1], ifTraits: ["death"] }, { type: "damage-type", from: m[2], to: m[3], optional: true, ifTraits: [m[2]] },
            { type: "on-kill-rules", label: `+${m[4]} against ${m[5]} effects`, rounds: Number(m[6]), rules: [{ key: "FlatModifier", selector: "saving-throw", type: "status", value: Number(m[4]), predicate: [`item:trait:${m[5]}`] }] }]],
    // Savior (threaded): "When a creature within the area of your wicket's dominion is restored to full Hit Points from one of your spells, it gains a +1 status bonus to
    // attack rolls and a +2 status bonus to damage rolls for 1 round. This is an emotion and mental effect. The creature is then immune to this effect for 1 minute." —
    // the module's Effect: Savior's Grace (its immunity Effect lasts 1 round: the text's minute here).
    [/^When a creature within the area of your wicket's dominion is restored to full Hit Points from one of your spells, it gains a \+(\d) status bonus to attack rolls and a \+(\d) status bonus to damage rolls for (\d+) rounds?\. This is an emotion and mental effect\. The creature is then immune to this effect for (\d+) minutes?\. @UUID\[([^\]]+)\]\{(Effect: [^}]+)\}(?: @UUID\[[^\]]+\]\{[^}]+\})?$/,
        m => [{ type: "healed-full-effect", inDominion: true, effect: { uuid: m[5], name: m[6] }, check: { attack: Number(m[1]), damage: Number(m[2]), rounds: Number(m[3]) }, immunityMinutes: Number(m[4]) }]],
    // Savior (overwhelming): healing undead with healing-vitality spells, and the +2 against mental effects on removing dying — the table's (with its Effect link).
    [/^(When you Cast a Spell with the healing and vitality traits that targets an undead, you can heal the creature normally even if the spell also has the vitality trait and it would normally be immune to healing effects\. You gain a \+2 status bonus against mental effects for 1 round when you remove the dying condition from a creature\.)(?: @UUID\[[^\]]+\]\{[^}]+\})?$/,
        m => [{ type: "table", text: m[1] }]],
    // Atmosphor (threaded): "When you Cast a Spell with the air trait, you can float. Replace your land Speed with an equal fly Speed until the end of your next turn. You can't
    // rise more than a few inches above the ground … When you deafen a creature with a spell with the sonic trait, they are also Clumsy 1 as long as they are deafened or until
    // they spend a single action with the concentrate trait to balance themselves."
    [new RegExp(String.raw`^When you Cast a Spell with the ([a-z]+) trait, you can float\. Replace your land Speed with an equal fly Speed until the end of your next turn\. (You can't rise more than a few inches above the ground when you @UUID\[[^\]]+\]\{Fly\}\. .+?) When you deafen a creature with a spell with the ([a-z]+) trait, they are also @UUID\[(Compendium\.pf2e\.conditionitems\.(?:Item\.)?[A-Za-z0-9]+)\]\{([A-Z][a-z]+) (\d)\} as long as they are deafened (or until they spend a single action with the concentrate trait to balance themselves)\.$`),
        m => [{ type: "self-rules", label: "floating (fly Speed)", until: "caster-next-turn-end", ifTraits: [m[1]], description: unlink(m[2]), rules: [{ key: "BaseSpeed", selector: "fly", value: "@actor.attributes.speed.value" }] },
            { type: "follow", slug: "deafened", add: { uuid: condUuid(m[4]), slug: m[5].toLowerCase() }, offset: Number(m[6]), lasting: null, ifTraits: [m[3]] }, { type: "table", text: `The Clumsy also ends ${m[7].replace(/^or /, "")}.`, ifTraits: [m[3]] }]],
    // Atmosphor (overwhelming): the unrestricted fly Speed (the table's) and "When you Cast a Spell with the sonic trait that deals damage, you can choose to deal bludgeoning
    // damage instead of sonic damage."
    [/^(When you Cast a Spell with the ([a-z]+) trait, you are no longer restricted with your Fly speed\. If you already possess a fly Speed, you instead increase your fly Speed by \d+ feet\. If you would fall at the end of your turn, you instead float safely to the ground\.) When you Cast a Spell with the ([a-z]+) trait that deals damage, you can choose to deal ([a-z]+) damage instead of \3 damage\.$/,
        m => [{ type: "table", text: m[1], ifTraits: [m[2]] }, { type: "damage-type", from: m[3], to: m[4], optional: true, ifTraits: [m[3]] }]],
    // Desolator (threaded): the light level lowered in the spell's area and the cold weakness in darkness — the GM's (the light and darkness are the scene's), with the
    // module's Effect for it.
    [/^(When you Cast a Spell with the ([a-z]+) trait that targets a creature or area, you reduce the light level in the area by one step, from bright light to dim light and from dim light to darkness, until the end of your next turn\. The area of the effect is the same area as the spell or a @Template\[[^\]]*\] that includes the target if it targeted a creature\. Creatures in areas of darkness gain a weakness to cold damage equal to half your level\.) @UUID\[([^\]]+)\]$/,
        m => [{ type: "note", wandRule: true, text: `${unlink(m[1]).replace(/@Template\[type:burst\|distance:(\d+)\]/, "$1-foot burst")} (PF2e's light is the GM's; the creatures in darkness get the module's Effect: Frigid Darkness.)`, ifTraits: [m[2]] }]],
    // Desolator (overwhelming): "When you Cast a Spell with the cold trait that deals damage, you can choose to deal spirit damage instead of cold damage. Creatures in areas of
    // darkness within your wicket's dominion gain a weakness to spirit damage equal to half your level." — the swap asked; the weakness the module's Effect (from 11th).
    [/^When you Cast a Spell with the ([a-z]+) trait that deals damage, you can choose to deal ([a-z]+) damage instead of \1 damage\. (Creatures in areas of darkness within your wicket's dominion gain a weakness to \2 damage equal to half your level\.)$/,
        m => [{ type: "damage-type", from: m[1], to: m[2], optional: true, ifTraits: [m[1]] }, { type: "note", wandRule: true, text: `${m[3]} (The module's Effect: Frigid Darkness gives it from 11th level.)`, ifTraits: [m[1]] }]],
    // Fabricator (threaded): "When you create an illusion within your wicket's dominion, choose a specific creature within the area of your wicket's dominion. The creature
    // takes a –2 circumstance bonus to disbelieve your illusion spells or a +2 status bonus to sight-based Perception checks while within the area." — the creature and the
    // choice asked; while the dominion lasts.
    [/^When you create an ([a-z]+) within your wicket's dominion, choose a specific creature within the area of your wicket's dominion\. The creature takes a [–-](\d) circumstance bonus to disbelieve your illusion spells or a \+(\d) status bonus to sight-based Perception checks while within the area\.(?: @UUID\[[^\]]+\]\{[^}]+\})?$/,
        m => [{ type: "dominion-creature-effect", ifTraits: [m[1]], options: [
            { value: "penalty", label: `–${m[2]} to disbelieve your illusions`, rules: [{ key: "FlatModifier", selector: ["perception", "will"], type: "circumstance", value: -Number(m[2]), predicate: ["item:trait:illusion"] }] },
            { value: "bonus", label: `+${m[3]} to sight-based Perception`, rules: [{ key: "FlatModifier", selector: "perception", type: "status", value: Number(m[3]), predicate: ["visual"] }] }] }]],
    // Fabricator (overwhelming): illusion damage types and the visual immunity — the table's.
    [/^(When you Cast a Spell with the illusion trait, you can choose to deal half the damage type appropriate for the illusion to creatures that would normally take mental damage from your illusions\. When you Cast a Spell with the visual trait on an immune creature, you translate the effect to another sense, bypassing its immunity to visual\. The creature must have at least one other sense to bypass its immunity\.)$/,
        m => [{ type: "table", text: m[1] }]],
    // Magnetor (threaded): "Choose 2 creatures within the area of your wicket's dominion. Both creatures must attempt a Fortitude save against your spell DC. Creatures that fail
    // their save are pushed 10 feet towards the other creature you selected. A creature can choose to get a failure on their save against this effect. This is forced movement."
    [/^Choose (\d) creatures within the area of your wicket's dominion\. Both creatures must attempt a @Check\[type:(fortitude|reflex|will)\|dc:[^\]]+\] save against your spell DC\. Creatures that fail their save are pushed (\d+) feet towards the other creature you selected\. (A creature can choose to get a failure on their save against this effect\.) This is forced movement\.$/,
        m => [{ type: "magnet-pull", count: Number(m[1]), statistic: m[2], feet: Number(m[3]), note: m[4] }]],
    // Magnetor (overwhelming): "When you Cast a Spell with the electricity trait that deals damage, you can choose to deal slashing damage instead of electricity damage. When you
    // Cast a Spell with the metal trait that would target a single creature, the creature gains a weakness to electricity damage after you Cast the Spell equal to its rank until
    // the beginning of their next turn." (The module's Effect lasts and uses the level: the text's here.)
    [/^When you Cast a Spell with the ([a-z]+) trait that deals damage, you can choose to deal ([a-z]+) damage instead of \1 damage\. When you Cast a Spell with the ([a-z]+) trait that would target a single creature, the creature gains a weakness to ([a-z]+) damage after you Cast the Spell equal to its rank until the beginning of their next turn\.(?: @UUID\[[^\]]+\](?:\{[^}]+\})?)?$/,
        m => [{ type: "damage-type", from: m[1], to: m[2], optional: true, ifTraits: [m[1]] },
            { type: "target-rules", ifTraits: [m[3]], singleOnly: true, label: `weakness to ${m[4]}`, until: "target-turn-start", rules: [{ key: "Weakness", type: m[4], value: "rank" }] }]],
    // Ardor (tethered): "When you Cast a Spell with the auditory or emotion trait that targets a single creature within your wicket's dominion, you can also target another one
    // within it. All numerical effects, such as duration, damage, or healing, are halved. If the spell requires a save, both creatures gain a +2 circumstance bonus to their
    // save and the duration of any condition or effect of the spell is reduced by half (minimum 1 round)." — two targets on the card: both halved, +2 to their saves;
    // durations the GM's.
    [/^When you Cast a Spell with the ([a-z]+) or ([a-z]+) trait that targets a single creature within your wicket's dominion, you can also target another one within it\. All numerical effects, such as duration, damage, or healing, are halved\. If the spell requires a save, both creatures gain a \+(\d) circumstance bonus to their save and the duration of any condition or effect of the spell is reduced by half \(minimum 1 round\)\.$/,
        m => [{ type: "twin-target", ifTraits: [m[1], m[2]], saveBonus: Number(m[3]), note: "Halve the spell's durations for both creatures (minimum 1 round)." }]],
    // Ardor (overwhelming): the auditory and emotion immunities bypassed — the table's.
    [/^(When you Cast a Spell with the auditory trait on a creature immune to auditory effects, you translate the effect to another sense, bypassing its immunity to auditory\. The creature must have at least one other sense to bypass its immunity\. When you Cast a Spell with the emotion trait on a creature immune to emotion effects, the target is affected for 1 round as if it could feel emotions normally\.)$/,
        m => [{ type: "table", text: m[1] }]],
];

/** A wicket's passive riders: {name, requires, riders} — threaded riders marked `threaded`, overwhelming ones `minLevel: 11`; null unless both parts are read. */
function readWicket(source, text) {
    const m = /Wicket Traits ([a-z]+), ([a-z]+) (?:Threaded|Tethered) Magic (.+?) Overwhelming Wicket (.+)$/.exec(text);
    if (!m) return null;
    const part = body => { for (const [pattern, build] of WICKET_PARTS) { const match = pattern.exec(body.trim()); if (match) return build(match); } return null; };
    const threaded = part(m[3]), overwhelming = part(m[4]);
    if (!threaded || !overwhelming) return null;
    return { name: source.name, requires: { inWicketDominion: true, fromSlotsOrFocus: true, anyTraits: [m[1], m[2]] },
        riders: [...threaded.map(rider => ({ ...rider, threaded: true })), ...overwhelming.map(rider => ({ ...rider, minLevel: 11 }))] };
}

/** A feature's rule on each spell its holder casts: {name, requires, riders}, or null. */
export function readPassiveCastRider(source) {
    if (source?.type === "spell") return null;
    const text = plain(source?.system?.description?.value);
    const wicket = readWicket(source, text);
    if (wicket) return wicket;
    const table = TABLE.find(pattern => pattern.test(text));
    if (table) return { name: source.name, requires: {}, riders: [{ type: "table", text: text.slice(0, 400) }], tableOnly: true };
    for (const [pattern, build] of PASSIVE) {
        const match = pattern.exec(text);
        if (match) return { name: source.name, ...build(match, source) };
    }
    return null;
}

// Focus Points regained as the feature is used (its card posted): "You regain a Focus Point.", "You instantly regain 1 Focus Point.", "You instantly recover 1 Focus
// Point.", "You gain 1 Focus Point." — with Emergency Infusion's bleed first, and Monastic Practices' Religion check ("a standard DC of your level") first. Its trigger or
// requirement the table's; its frequency the item's.
const REGAIN = /(?:[Yy]ou (?:instantly )?(?:regain|recover|gain) (?:a|1) [Ff]ocus [Pp]oint)\.(?: You gain this Focus Point in addition to any focus points you would normally gain as part of performing the activity\.)?/;
export function readFocusRegain(source) {
    if (!["feat", "action"].includes(source?.type)) return null;
    const text = plain(source?.system?.description?.value);
    const m = REGAIN.exec(text);
    if (!m) return null;
    const before = text.slice(0, m.index);
    // (A point only for one use — "which you can spend only to Energize a qi-shape action" — or a temporary one isn't this.)
    if (/only to Energize|until the end of your turn which can only/.test(text)) return null;
    const bleed = /You take @Damage\[\(@actor\.level\/2\)\[persistent,([a-z]+)\]\] damage equal to half your level rounded up\. $/.exec(before);
    const check = /you can make a @Check\[([a-z]+)\|dc:@self\.level\] check against a standard DC of your level to find perspective on your fate\. If you are successful, $/.exec(before);
    return { name: source.name, amount: 1, ...(bleed ? { bleed: { formula: "ceil(@level/2)", damageType: bleed[1] } } : {}), ...(check ? { check: { skill: check[1], dc: "level" } } : {}),
        frequency: source.system?.frequency?.per ?? null };
}

// Reactions to a creature's casting (the casting-rules cards: scripts/casting-rules-runtime.js):
//   - Archmage's Counter: "Trigger an enemy you are observing Casts a Spell, and that spell is of a rank you can cast You counteract the triggering spell. Your counteract
//     rank for this ability is equal to half your level (rounded up) and your counteract check modifier is your spellcasting attribute modifier plus your spellcasting
//     proficiency bonus, plus any bonuses and penalties that specifically apply to counteract checks. You can spend a Mythic Point as part of this reaction to attempt the
//     check at mythic proficiency."
//   - Seal the Wicket: "Trigger A creature Casts a Spell with one of your wicket's associated traits. … If you are a prepared caster, you expend a prepared spell with the
//     triggering trait … If you are a spontaneous caster, you expend a spell slot for a rank you could Cast a Spell with the triggering trait. … You then attempt to
//     counteract the triggering spell."
//   - Haughty Correction: an Arcana check against the caster's Will DC; Stupefied 1 for 1 minute (critical success) or until the end of its next turn (success); the
//     module's Effect on the user on a critical failure; the target temporarily immune for 1 minute.
//   - Residual Energy Capture: on its holder's own cast from wizard slots with an element trait, the module's Effect: Residual Energy with that trait, its level the rank.
export function readCastReaction(source) {
    const text = plain(source?.system?.description?.value);
    let m;
    if (/^Trigger an enemy you are observing Casts a Spell, and that spell is of a rank you can cast You counteract the triggering spell\. Your counteract rank for this ability is equal to half your level \(rounded up\) and your counteract check modifier is your spellcasting attribute modifier plus your spellcasting proficiency bonus, plus any bonuses and penalties that specifically apply to counteract checks\. You can spend a Mythic Point as part of this reaction to attempt the check at mythic proficiency\.$/.test(text))
        return { kind: "counter", name: source.name, enemies: true, noSlot: true, rank: "half-level", modifier: "attribute+proficiency", mythic: true };
    if (/^Trigger A creature Casts a Spell with one of your wicket's associated traits\. .*If you are a prepared caster, you expend a prepared spell with the triggering trait to counter the triggering creature's casting of a spell\. If you are a spontaneous caster, you expend a spell slot for a rank you could Cast a Spell with the triggering trait\. You lose your spell slot as if you had cast the spell\. You then attempt to counteract the triggering spell\./.test(text))
        return { kind: "counter", name: source.name, enemies: false, wicketTrait: true };
    if ((m = new RegExp(String.raw`^Trigger A creature within (\d+) feet you can see just Cast a Spell, attempted a counteract check, or attempted to Recall Knowledge\. .*Attempt an \[\[/act [a-z-]+\]\]\{(Arcana)\} check and compare the result to the Will DC of the triggering creature\. .*Regardless of the result, the target is then temporarily immune for (\d+) minutes?\. Critical Success The target is ${COND_LINK.replace("([A-Z][A-Za-z-]+)", "(Stupefied) (\\d)")} for (\d+) minutes? as they are distracted by your frustrating interruptions\. .*Success As critical success, but the target is stupefied \d until the end of their next turn\. Failure The target is unaffected\. Critical Failure .*@UUID\[([^\]]+)\]\{(Effect: [^}]+)\}$`).exec(text)))
        return { kind: "haughty", name: source.name, within: Number(m[1]), skill: m[2].toLowerCase(), immunityMinutes: Number(m[3]), condition: { uuid: condUuid(m[4]), slug: m[5].toLowerCase(), value: Number(m[6]) },
            criticalRounds: Number(m[7]) * 10, failEffect: { uuid: m[8], name: m[9] } };
    if ((m = /^Trigger You Cast a Spell from your ([a-z]+) spell slots with the ((?:[a-z]+, )+or [a-z]+) traits or that would summon a creature with one of these traits\. .*You gain residual energy, an effect that lasts for (\d+) minutes? with the same trait as the triggering spell\./.exec(text)))
        return { kind: "residual", name: source.name, slots: m[1], traits: m[2].split(/,\s*(?:or\s+)?/).map(t => t.trim()).filter(Boolean), minutes: Number(m[3]) };
    return null;
}

// Actions that spend residual energy (Wizards+'s Residual Energy Capture) to cast a spell:
//   - Become Elemental: "You expend your residual energy to cast a 7th-rank Elemental Form spell on yourself, except that you gain a +10-foot status bonus to your speeds if
//     your speed was higher, an attack modifier of +31, and a damage bonus of +14. The type of elemental you become must have the same elemental trait as the residual energy
//     you expended."
//   - Create Elemental: "You expend your residual energy to cast Summon Elemental as an arcane innate spell, heightened to a spell rank equal to half your level. The elemental
//     you summon must have the same elemental trait as the residual energy you expended."
export function readActionCast(source) {
    const text = plain(source?.system?.description?.value);
    let m;
    // Ferocious Gust (PF2e 8.6): "Frequency once per 10 minutes With heavy wing beats, you whip up a furious gust and direct it at your opponents. This air blast has the
    // effects of @UUID[…]{Gust of Wind} with a @Check[fortitude|against:class-spell|traits:air]{fortitude DC} equal to your class DC or spell DC, whichever is higher." —
    // the spell's save card at that DC (the frequency PF2e's; the lead narration).
    if ((m = /^(?:Frequency once per [a-z0-9 ]+ )?([^.@\d]+\. )?This [a-z ]+ has the effects of @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\} with a @Check\[(fortitude|reflex|will)\|against:class-spell[^\]]*\]\{[^}]+\} equal to your class DC or spell DC, whichever is higher\.$/.exec(text))
        && !/\b(?:damage|bonus|penalty|save|DC)\b/i.test(m[1] ?? ""))
        return { kind: "spell-effects", name: source.name, spell: { uuid: m[2], name: m[3] }, statistic: m[4], dc: "class-or-spell" };
    if ((m = /^Requirements You have residual energy\. .*You expend your residual energy to cast a (\d+)(?:st|nd|rd|th)-rank @UUID\[(Compendium\.pf2e\.spells-srd\.(?:Item\.)?[A-Za-z0-9]+)\]\{([^}]+)\} spell on yourself, except that you gain a \+(\d+)-foot status bonus to your speeds if your speed was higher, an attack modifier of \+(\d+), and a damage bonus of \+(\d+)\. The type of elemental you become must have the same elemental trait as the residual energy you expended\.$/.exec(text)))
        return { kind: "become-form", name: source.name, spell: { uuid: m[2].replace(/spells-srd\.(?!Item\.)/, "spells-srd.Item."), name: m[3] }, rank: Number(m[1]), speedBonus: Number(m[4]), attack: Number(m[5]), damage: Number(m[6]), spendsResidual: true };
    if ((m = /^Requirements You have residual energy\. .*You expend your residual energy to cast @UUID\[(Compendium\.pf2e\.spells-srd\.(?:Item\.)?[A-Za-z0-9]+)\]\{([^}]+)\} as an? ([a-z]+) innate spell, heightened to a spell rank equal to half your level\. The elemental you summon must have the same elemental trait as the residual energy you expended\.$/.exec(text)))
        return { kind: "residual-summon", name: source.name, spell: { uuid: m[1].replace(/spells-srd\.(?!Item\.)/, "spells-srd.Item."), name: m[2] }, tradition: m[3], rank: "half-level", spendsResidual: true };
    // Residual Spellstrike (Magus+): "Trigger You got a failure on the Strike of your Spellstrike with one of your diametric weapons and your Strike did not have the fortune trait.
    // … Make a Strike with your other diametric weapon, but the attack is at a –5 multiple attack penalty (or –4 if the weapon is agile) instead of its normal penalty. If this
    // Strike hits, you apply the effects of the required Spellstrike to your Strike." — the failed Spellstrike's spell read from this Strike.
    if ((m = /^Trigger You got a failure on the Strike of your Spellstrike with one of your diametric weapons and (your Strike did not have the fortune trait)\. Requirements (You are wielding your other diametric weapon)\. .*Make a Strike with your other diametric weapon, but the attack is at a [–-](\d) multiple attack penalty \(or [–-](\d) if the weapon is agile\) instead of its normal penalty\. If this Strike hits, you apply the effects of the required Spellstrike to your Strike\.$/.exec(text)))
        return { kind: "residual-spellstrike", name: source.name, penalty: Number(m[3]), agilePenalty: Number(m[4]), table: [m[1], m[2]] };
    // Reverse Spellstrike (Magus+): "Requirements Your Spellstrike is charged and you were targeted with a hostile spell you could Spellstrike with in the last turn. … You expend a
    // spell slot of your highest level, and Spellstrike with the same spell that targeted you. If the spell is of a level lower than your highest spell slot, it is heightened to
    // the highest level spell you can cast." — that enemy's spell cast by the magus at its highest rank, from a slot of that rank, delivered by a Spellstrike.
    if ((m = /^Requirements (Your Spellstrike is charged) and you were targeted with a hostile spell you could Spellstrike with in the last turn\. .*You expend a spell slot of your highest level, and Spellstrike with the same spell that targeted you\. If the spell is of a level lower than your highest spell slot, it is heightened to the highest level spell you can cast\.$/.exec(text)))
        return { kind: "reverse-spellstrike", name: source.name, table: [m[1]] };
    // Reservoir of Power (Magus+): "Requirements Your most recent action was to Cast a Spell from a spell slot or make a Spellstrike with a spell from a spell slot. … You use
    // Arcane Cascade and you gain an effect depending on the school of your most recent spell that lasts until the end of your next turn. Abjuration …" — the stance and the
    // module's Effect (remastered spells have no school: the school asked).
    if ((m = /^Requirements Your most recent action was to Cast a Spell from a spell slot or make a Spellstrike with a spell from a spell slot\. .*You use Arcane Cascade and you gain an effect depending on the school of your most recent spell that lasts until the end of your next turn\. Abjuration /.exec(text)))
        return { kind: "reservoir-of-power", name: source.name, effect: { uuid: "Compendium.magus.magus-effects.Item.1H4gw3jWBGdxIHY2", name: "Effect: Reservoir of Power" } };
    // Arcane Cascade: Puppet String (Magus+): "Requirements You used your most recent action to Cast a Spell that targeted an enemy within 30 feet or make a melee Spellstrike and
    // the spell you chose had the illusion or mental trait. Grants To You …{Effect: Arcane Cascade: Puppet String} To Enemies …{Effect: Tethered (Puppet String)} … weakness 1 to
    // mental damage from your spells. This weakness increases to 2 if you have weapon specialization, or 3 if you have greater weapon specialization."
    if ((m = /^Requirements You used your most recent action to Cast a Spell that targeted an enemy within (\d+) feet or make a melee Spellstrike and the spell you chose had the ([a-z]+) or ([a-z]+) trait\. Grants To You @UUID\[([^\]]+)\]\{(Effect: [^}]+)\} To Enemies @UUID\[([^\]]+)\]\{(Effect: [^}]+)\} .*weakness (\d+) to mental damage from your spells\. This weakness increases to (\d+) if you have weapon specialization, or (\d+) if you have greater weapon specialization\.$/.exec(text)))
        return { kind: "puppet-string", name: source.name, range: Number(m[1]), traits: [m[2], m[3]], self: { uuid: itemUuid(m[4]), name: m[5] }, tether: { uuid: itemUuid(m[6]), name: m[7] },
            weakness: [Number(m[8]), Number(m[9]), Number(m[10])] };
    // Arcane Cascade: Don Visage (Magus+): "Requirements You used your most recent action to Cast a Spell or make a melee Spellstrike. … attempt an Arcana check at a
    // standard-difficulty DC of your level to don your visage. If you succeed at your check, you don your visage for 3 rounds, or 4 rounds if your result was a critical success."
    // — the module's Effect (its demeanor asked) for those rounds; the skill actions with Arcana the table's.
    if ((m = /^Requirements You used your most recent action to Cast a Spell or make a melee Spellstrike\. .*attempt an @Check\[type:(arcana)\|dc:@self\.level\] check at a standard-difficulty DC of your level to don your visage\. If you succeed at your check, you don your visage for (\d+) rounds, or (\d+) rounds if your result was a critical success\. (When you first use Don Visage in an encounter, you can use the result of your initial check to perform the associated skill action of your demeanor against an appropriate creature\.)/.exec(text)))
        return { kind: "don-visage", name: source.name, skill: m[1], rounds: { success: Number(m[2]), criticalSuccess: Number(m[3]) },
            effect: { uuid: "Compendium.magus.magus-effects.Item.0VSvlh0vCkMCaAe8", name: "Effect: Arcane Cascade: Don Visage" }, table: [m[4]] };
    // Arcane Cascade: Spell Ignition (Magus+): "Requirements You used your most recent action to Cast a Spell that targets a creature or area of effect or to make a melee
    // Spellstrike. You cause ambient magic in the area to burn … an area of ambient magic that lasts for 2 rounds. The area of ambient magic occupies the target's space or the area of
    // effect of the spell you cast. Creatures other than you that end their turn within an area of ambient magic take damage equal to the level of the spell you cast with a basic
    // Fortitude save against your spell DC, or half that amount if the spell you cast was a cantrip (minimum 1). This damage is of the same type as the arcane cascade stance. The
    // ambient magic lasts for 3 rounds if you have weapon specialization, or 4 rounds if you have greater weapon specialization."
    if ((m = /^Requirements You used your most recent action to Cast a Spell that targets a creature or area of effect or to make a melee Spellstrike\. .*This creates an area of ambient magic that lasts for (\d+) rounds\. The area of ambient magic occupies the target's space or the area of effect of the spell you cast\. Creatures other than you that end their turn within an area of ambient magic take damage equal to the level of the spell you cast with a @Check\[type:(fortitude|reflex|will)\|dc:[^\]]*basic:true\] save against your spell DC, or half that amount if the spell you cast was a cantrip \(minimum 1\)\. This damage is of the same type as the arcane cascade stance\. The ambient magic lasts for (\d+) rounds if you have weapon specialization, or (\d+) rounds if you have greater weapon specialization\.$/.exec(text.replace(/[’]/g, "'"))))
        return { kind: "spell-ignition", name: source.name, statistic: m[2], rounds: { base: Number(m[1]), specialization: Number(m[3]), greater: Number(m[4]) } };
    // Archmemory (Magic+): "If your last action this turn was to Cast a Spell, or if the last activity you used this turn included Casting a Spell, you instantly regain the spell slot
    // expended to Cast that Spell." (Its essence-caster alternative the table's.)
    if ((m = /If your last action this turn was to Cast a Spell, or if the last activity you used this turn included Casting a Spell, you instantly regain the spell slot expended to Cast that Spell\. (Special If you are an essence caster, .+)$/.exec(text)))
        return { kind: "regain-last-slot", name: source.name, table: [m[1]] };
    // Spell Eating (Barbarians+): "You can consume a spell slot you gained from this archetype and restore 1d12 Hit Points for each rank of the spell slot consumed."
    if ((m = /You can consume a spell slot you gained from this archetype and restore @Damage\[1d(\d+)\[healing\]\] Hit Points for each rank of the spell slot consumed\. (This counts as casting a spell for the purposes of triggering your additional damage from Rage\.)/.exec(text)))
        return { kind: "eat-slot", name: source.name, faces: Number(m[1]), table: [m[2]] };
    // Stigmata (Clerics): "You take 1d4 persistent bleed damage for every 4 levels you possess. … While you are suffering from this persistent bleed damage, you receive a +1 status bonus
    // to Religion checks …" — the bleed on the cleric and the bonus while it bleeds.
    if ((m = /You take 1d4 persistent bleed damage for every 4 levels you possess\. (This persistent bleed damage cannot be removed and persists until you spend a single action with the concentrate trait to automatically end the bleeding and any of its ongoing effects\.) .*While you are suffering from this persistent bleed damage, you receive a \+(\d) status bonus to Religion checks/.exec(text)))
        return { kind: "stigmata", name: source.name, religion: Number(m[2]), table: [m[1]] };
    // Consume Item Magic (Wizards+): "Requirements You are holding a magical item with the consumable trait. … You consume the required item and regain a spell slot for a spell you
    // previously cast during the day of a rank equal to or less than half the required item's level. The spell slot you regain must share at least one trait with the required consumable."
    if ((m = /^Requirements You are holding a magical item with the consumable trait\. .*You consume the required item and regain a spell slot for a spell you previously cast during the day of a rank equal to or less than half the required item's level\. The spell slot you regain must share at least one trait with the required consumable\.$/.exec(text)))
        return { kind: "consume-item-slot", name: source.name };
    // Vital Pululation (Oracles+): "Requirements Your cursebound value is 2 or greater and you're in an encounter. … You cast a 3-action Heal of a rank equal to the second highest rank
    // spell you can cast without expending a spell slot. You are excluded from the effects of this heal."
    if ((m = /^Requirements Your cursebound value is (\d+) or greater and you're in an encounter\. .*You cast a (\d)-action @UUID\[([^\]]+)\]\{(Heal)\} of a rank equal to the second highest rank spell you can cast without expending a spell slot\. You are excluded from the effects of this heal\.$/.exec(text)))
        return { kind: "free-heal", name: source.name, minCursebound: Number(m[1]), actions: m[2], spell: { uuid: m[3].replace(/^(Compendium\.[^.]+\.[^.]+)\.(?!Item\.)/, "$1.Item."), name: m[4] } };
    // Triplicate Casting (Magic+): "Choose three different non-cantrip dynamic mastery spells that can be cast with one action, and Cast their one-action versions. When you do,
    // you expend only one spell slot, using the rank of the highest-rank spell you Cast." — armed by its card for the caster's next three casts; dynamic mastery the table's.
    if ((m = /^Your mastery over the inner workings of spells allows you to tease out their potential into small pieces, directing each fragment independently\. Choose (three) different non-cantrip (dynamic mastery spells) that can be cast with one action, and Cast their one-action versions\. When you do, you expend only one spell slot, using the rank of the highest-rank spell you Cast\.$/.exec(text)))
        return { kind: "triplicate", name: source.name, count: 3, table: [`Only ${m[2]}.`] };
    // Essence Strike (Magic+): "Requirements You aren't temporarily immune to Sure Strike. … The next time you make a spell attack roll before the end of your turn, roll it twice
    // and use the better result. The attack ignores circumstance penalties to the attack roll and any flat check required due to the target being Concealed or Hidden. After using
    // Essence Strike, you are temporarily immune to sure strike for 10 minutes." — the roll twice an Effect until the turn's end; the penalties and flat checks ignored the table's.
    if ((m = /^Requirements You aren't temporarily immune to @UUID\[[^\]]+\]\{Sure Strike\}\. .*The next time you make a spell attack roll before the end of your turn, roll it twice and use the better result\. (The attack ignores circumstance penalties to the attack roll and any flat check required due to the target being Concealed or Hidden\.) After using Essence Strike, you are temporarily immune to sure strike for (\d+) minutes\.$/.exec(text)))
        return { kind: "essence-strike", name: source.name, immunityMinutes: Number(m[2]), table: [m[1]] };
    return null;
}
const itemUuid = uuid => uuid.replace(/^(Compendium\.[^.]+\.[^.]+)\.(?!Item\.)/, "$1.Item.");

/**
 * A Magus+ feature that changes how a Spellstrike is made or what it does, outside a variant's activation: a permission ("You can Spellstrike with wands"; "When you use
 * Spellstrike, you can make a ranged weapon Strike …" — the delivery doesn't restrict them), the card-draw of Dealer of Death, Slide Slice's reminder on a critical hit.
 */
export function readSpellstrikeFeature(source) {
    const text = plain(source?.system?.description?.value);
    let m;
    if ((m = /When you use (?:@UUID\[[^\]]+\]\{)?Spellstrike\}?, you can make (.+?), as long as the target is within the first range increment(?: of [^.]+)?\. (You can deliver the spell even if its range is shorter than the range increment of your ranged attack\.)/.exec(text)))
        return { kind: "permission", name: source.name, allows: "ranged", table: [`Spellstrike with ${m[1].replace(/^an? /, "")} within the first range increment.`] };
    if ((m = /You can Spellstrike with wands of appropriate spells and (when you make a Spellstrike by overcharging a wand, you reduce the flat check needed to succeed to \d+ instead of \d+)\./.exec(text)))
        return { kind: "permission", name: source.name, allows: "wand", table: [`${m[1][0].toUpperCase()}${m[1].slice(1)} (PF2e doesn't roll overcharging).`] };
    if ((m = /If you make a Spellstrike with a card from your infused deck with a spell that deals damage, roll 1d6 on the table below\. If the damage of the spell matches the card drawn, you deal additional damage of the listed type equal to the level of the spell you used for your Spellstrike or half your level if the spell was a cantrip\. ((?:[A-Z][a-z]+ ?: [a-z]+ damage ?){6})$/.exec(text))) {
        const cards = [...m[1].matchAll(/([A-Z][a-z]+) ?: ([a-z]+) damage/g)].map(([, card, type], index) => ({ roll: index + 1, card, type }));
        return { kind: "card-draw", name: source.name, cards, weapon: /\b(?:deck|cards?|harrow)\b/i.source };
    }
    if ((m = /^Trigger (You used Slidecast before you made a Spellstrike) and the Strike from your Spellstrike was a critical hit\. .*?(You can Stride up to half your Speed\. You can make this Stride before or after the effects of your spell are applied\.)$/.exec(text)))
        return { kind: "crit-card", name: source.name, text: m[2], table: [m[1]] };
    // Slidecasting (Magus+): "Whenever you Step or Stride in the same turn you also Cast a Spell or Spellstrike, you gain a +1 status bonus to your Reflex saves against effects that
    // target an area for 2 rounds. This bonus lasts for 3 rounds if you have weapon specialization, or 4 rounds if you have greater weapon specialization." — the module's Effect
    // (its bonus the text's status), on a move and a cast in the same combat turn, once that turn.
    if ((m = /^Grants @UUID\[([^\]]+)\]\{(Effect: [^}]+)\} .*Whenever you Step or Stride in the same turn you also Cast a Spell or Spellstrike, you gain a \+(\d) (status) bonus to your Reflex saves against effects that target an area for (\d+) rounds\. This bonus lasts for (\d+) rounds if you have weapon specialization, or (\d+) rounds if you have greater weapon specialization\./.exec(text)))
        return { kind: "slidecast", name: source.name, effect: { uuid: m[1].replace(/^(Compendium\.[^.]+\.[^.]+)\.(?!Item\.)/, "$1.Item."), name: m[2] }, bonus: Number(m[3]), bonusType: m[4], rounds: [Number(m[5]), Number(m[6]), Number(m[7])] };
    // Arcane Cascade: Invigorate (Magus+, the black blade's reaction): "Trigger You reduce a creature to 0 Hit Points with a spell or Spellstrike. Requirements You are wielding your
    // black blade. Grants …{Effect: Arcane Cascade: Invigorate} (apply both to your PC and your familiar!)" — offered when it happens; the Effect on both.
    if ((m = /^Trigger You reduce a creature to 0 Hit Points with a spell or Spellstrike\. Requirements (You are wielding your black blade)\. Grants @UUID\[([^\]]+)\]\{(Effect: [^}]+)\} \(apply both to your PC and your familiar!\)/.exec(text)))
        return { kind: "kill-reaction", name: source.name, effect: { uuid: m[2].replace(/^(Compendium\.[^.]+\.[^.]+)\.(?!Item\.)/, "$1.Item."), name: m[3] }, toFamiliar: true, table: [m[1]] };
    return null;
}

// (A missing comma between two forms makes one of them an index into the other — undefined: refused as the module loads.)
for (const [name, list] of Object.entries({ TEXT_RULES, WICKET_PARTS, PASSIVE })) {
    const bad = list.findIndex(entry => !Array.isArray(entry) || !(entry[0] instanceof RegExp) || typeof entry[1] !== "function");
    if (bad >= 0) throw new Error(`plus-feature-rules.js: ${name}[${bad}] isn't a [pattern, reader] pair.`);
}
if (TABLE.some(entry => !(entry instanceof RegExp))) throw new Error("plus-feature-rules.js: TABLE holds something other than patterns.");
