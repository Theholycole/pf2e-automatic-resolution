// An Effect + note spell whose mechanical sentences PF2e's linked Effect proves (user decision 2026-10-01: Effect + note spells count once the
// module covers what the Effect doesn't). Each rule sentence must match one of the Effect's rules exactly; the other sentences must be the
// known non-mechanical notes (or the opening narration); a heightened duration is applied to the Effect by the runtime.
import { htmlToPlainText } from "./description-parser.js";

// A rule value at a rank: a number, or a formula of @item.level with + - * / floor ceil (nothing else).
// (Or PF2e's table form: "match(when(btwn(@item.level, 2, 3), 1), when(gte(@item.level, 8), 4))", or "ternary(gte(@item.level,7),15,10)".)
export function ruleValueAt(value, rank) {
    if (Number.isFinite(value)) return Number(value);
    const formula = String(value ?? "").replace(/@item\.(?:level|rank)/g, String(rank));
    if (!/^(?:[\d\s+\-*/().,]|floor|ceil|max|min|match|when|ternary|btwn|gte|lte|gt|lt|eq)+$/.test(formula)) return null;
    const helpers = { floor: Math.floor, ceil: Math.ceil, max: Math.max, min: Math.min, match: (...cases) => cases.find(entry => entry !== undefined), when: (condition, result) => condition ? result : undefined, ternary: (condition, yes, no) => condition ? yes : no,
        btwn: (x, low, high) => x >= low && x <= high, gte: (a, b) => a >= b, lte: (a, b) => a <= b, gt: (a, b) => a > b, lt: (a, b) => a < b, eq: (a, b) => a === b };
    try { const result = Function(...Object.keys(helpers), `"use strict"; return (${formula});`)(...Object.values(helpers)); return Number.isFinite(Number(result)) ? Number(result) : null; } catch { return null; }
}
// The rule's value at the base rank, and its step for each heightened interval, must be the stated ones (checked up to rank 10).
const scales = (value, base, step, interval, baseRank, max = Infinity) => Array.from({ length: 11 - baseRank }, (_, offset) => baseRank + offset)
    .every(rank => ruleValueAt(value, rank) === Math.min(max, base + step * Math.floor((rank - baseRank) / interval)));

// The roll option a "regarding haunts or spirits" modifier waits on: its predicate's one bare term.
const spiritOption = rule => { const terms = rule.predicate?.[0]?.or ?? []; const bare = terms.filter(term => typeof term === "string" && !term.includes(":"));
    return rule.predicate?.length === 1 && bare.length === 1 && terms.includes("origin:trait:haunt") && terms.includes("origin:trait:spirit") ? bare[0] : null; };

const CONDITION = name => String.raw`(?:@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{${name}\}|${name})`;
// Readers: a sentence and the one rule it states.
const READERS = [
    // Shielding Formation: "You and each ally who ends their turn within the emanation gain a +1 circumstance bonus to AC until they leave the emanation
    // or the spell ends, whichever comes first." (PF2e's AC bonus, off while its resistance toggle is on) / "If an ally takes physical damage or damage from
    // a spell or magical effect while being granted this bonus, they can choose to end the bonus for themselves as a free action to gain resistance 10 to
    // all damage against the triggering damage." (the toggle and its Resistance) / "If they do, they become temporarily immune to the effects of shielding
    // formation for 10 minutes." / "You can do the same by spending your reaction; if you do, you can't cast shielding formation again for 10 minutes,
    // though you can continue Sustaining the benefits for others." — the caster's emanation (moving with the caster), granting the Effect to the caster
    // and each ally ending its turn inside; using the toggle ends it after that damage, with the immunity (for the caster, no new casting either).
    { pattern: /^You and each ally who ends their turn within the emanation gain a \+(\d) (circumstance|status) bonus to AC until they leave the emanation or the spell ends, whichever comes first\.$/,
        recipient: { actor: "area", allies: true, includeCaster: true, centre: "caster" }, extra: () => ({ memberTurnEnd: true }),
        rules: (rules, match) => { const at = rules.findIndex(rule => rule.key === "FlatModifier" && [rule.selector].flat().join() === "ac" && rule.type === match[2] && Number(rule.value) === Number(match[1])
            && (rule.predicate ?? []).length === 1 && typeof rule.predicate[0]?.not === "string"); return at >= 0 ? [at] : null; } },
    { pattern: /^If an ally takes physical damage or damage from a spell or magical effect while being granted this bonus, they can choose to end the bonus for themselves as a free action to gain resistance (\d+) to all damage against the triggering damage\.$/,
        recipient: { actor: "area", allies: true, includeCaster: true, centre: "caster" },
        rules: (rules, match) => { const toggle = rules.findIndex(rule => rule.key === "RollOption" && rule.toggleable === true && typeof rule.option === "string");
            const resist = toggle >= 0 ? rules.findIndex(rule => rule.key === "Resistance" && [rule.type].flat().join() === "all-damage" && Number(rule.value) === Number(match[1])
                && JSON.stringify(rule.predicate) === JSON.stringify([rules[toggle].option])) : -1;
            return toggle >= 0 && resist >= 0 ? [toggle, resist] : null; },
        extra: (rules, indices) => ({ shieldUse: { option: rules[indices[0]].option } }) },
    { pattern: /^If they do, they become temporarily immune to the effects of [a-z ]+ for (\d+) (minute|hour)s?\.$/, rules: () => [], immunity: true },
    { pattern: /^You can do the same by spending your reaction; if you do, you can't cast [a-z ]+ again for (\d+) (minute|hour)s?, though you can continue Sustaining the benefits for others\.$/,
        rules: () => [], extra: () => ({ casterUseBlocksCasting: true }) },
    // Safeguard Secret: "The spell grants those who know the piece of knowledge you have chosen a +4 status bonus to skill checks (typically Deception
    // checks) to conceal this knowledge, and to saving throws against spells that specifically attempt to obtain this knowledge from them, and to effects
    // that would force them to reveal it." — PF2e's skill-check bonus waits on an option it never sets, and has no save bonus: the toggle and the saves
    // are added (the same option).
    { pattern: /^The spell grants those who know the piece of knowledge you have chosen a \+(\d) (status) bonus to skill checks \(typically Deception checks\) to conceal this knowledge, and to saving throws against spells that specifically attempt to obtain this knowledge from them, and to effects that would force them to reveal it\.$/,
        recipient: { actor: "target" },
        rule: (rule, match) => rule.key === "FlatModifier" && rule.selector === "skill-check" && rule.type === match[2] && rule.value === Number(match[1]) && (rule.predicate ?? []).length === 1 && typeof rule.predicate[0] === "string",
        additions: rule => [{ key: "RollOption", domain: "all", option: rule.predicate[0], toggleable: true, label: "Concealing the secret, or resisting an effect that would obtain or force it" },
            { key: "FlatModifier", selector: "saving-throw", type: rule.type, value: rule.value, predicate: [rule.predicate[0]] }] },
    // "If you Cast this Spell again, any previous safeguard secret you had cast ends.": the caster's earlier Effects of this spell are removed.
    { pattern: /^If you Cast this Spell again, any previous [a-z ]+ you had cast ends\.$/, rules: () => [], extra: () => ({ replacesPrevious: true }) },
    // Unusual Anatomy: "You gain resistance 10 to precision damage and resistance 10 to extra damage from critical hits." (PF2e's one Resistance
    // to both, "The resistances increase by 5.") and "You gain darkvision."
    { pattern: /^You gain resistance (\d+) to precision damage and resistance \1 to extra damage from critical hits\.$/, scaled: "resistance", recipient: { actor: "source" },
        rule: (rule, match, step) => rule.key === "Resistance" && JSON.stringify([rule.type].flat().sort()) === '["critical-hits","precision"]' && rule.predicate == null
            && scales(rule.value, Number(match[1]), step?.amount ?? 0, step?.interval ?? 1, step?.baseRank ?? 1) },
    // Unblinking Flame Ignition: "You gain greater darkvision, low-light vision, and the ability to see invisible creatures." (three Senses), "You gain a fly Speed
    // equal to your land Speed as you launch flame from your aura …" (BaseSpeed fly from the land Speed) and "You become {Quickened}." (its GrantItem).
    { pattern: /^You gain greater darkvision, low[‐-]light vision, and the ability to see invisible creatures\.$/, recipient: { actor: "source" },
        rules: rules => { const at = ["greater-darkvision", "low-light-vision", "see-invisibility"].map(selector => rules.findIndex(rule => rule.key === "Sense" && rule.selector === selector
            && Object.keys(rule).every(key => ["key", "selector"].includes(key)))); return at.every(index => index >= 0) ? at : null; } },
    { pattern: /^You gain a fly Speed equal to your land Speed(?: as [^.]+)?\.$/, recipient: { actor: "source" },
        rules: rules => { const at = rules.findIndex(rule => rule.key === "BaseSpeed" && rule.selector === "fly" && String(rule.value).replace(/\s+/g, "") === "@actor.system.movement.speeds.land.value"); return at >= 0 ? [at] : null; } },
    { pattern: /^You become @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Quickened\}\.$/, recipient: { actor: "source" },
        rules: (rules, match) => { const at = rules.findIndex(rule => rule.key === "GrantItem" && rule.uuid === match[1]); return at >= 0 ? [at] : null; } },
    { pattern: /^You gain darkvision\.$/, recipient: { actor: "source" },
        rule: rule => rule.key === "Sense" && rule.selector === "darkvision" && Object.keys(rule).every(key => ["key", "selector"].includes(key)) },
    // Know the Enemy: "You can roll your check twice and use the better result." (PF2e's RollTwice on Recall Knowledge)
    { pattern: /^You can roll your check twice and use the better result\.$/, recipient: { actor: "source" },
        rule: rule => rule.key === "RollTwice" && rule.keep === "higher" && rule.selector === "skill-check" && JSON.stringify(rule.predicate) === '["action:recall-knowledge"]' },
    // Zealous Conviction: "The targets each gain 12 temporary Hit Points and a +2 status bonus to Will saves against mental effects, as their faith overrides
    // the signals from their own bodies and minds." — PF2e's TempHP and the Will bonus against mental effects (their fixed-rank values: the Heightened entry).
    { pattern: /^The targets each gain (\d+) temporary Hit Points and a \+(\d) (status) bonus to (Fortitude|Reflex|Will) saves against ([a-z]+) effects, as [^.]+\.$/, recipient: { actor: "target" },
        rules: (rules, match, step) => {
            const temp = rules.findIndex(rule => rule.key === "TempHP" && ruleValueAt(rule.value, step.baseRank) === Number(match[1]));
            const bonus = rules.findIndex(rule => rule.key === "FlatModifier" && [rule.selector].flat().join() === match[4].toLowerCase() && rule.type === match[3]
                && ruleValueAt(rule.value, step.baseRank) === Number(match[2]) && JSON.stringify(rule.predicate) === JSON.stringify([`item:trait:${match[5]}`]));
            return temp >= 0 && bonus >= 0 ? [temp, bonus] : null; } },
    // "The triggering ally gains 12 temporary Hit Points for 1 minute." (Return the Favor; "The temporary Hit Points increase by 4.")
    { pattern: /^The triggering ally gains (\d+) temporary Hit Points for \d+ minutes?\.$/, scaled: "temporary Hit Points", recipient: { actor: "target" },
        rule: (rule, match, step) => rule.key === "TempHP" && scales(rule.value, Number(match[1]), step?.amount ?? 0, step?.interval ?? 1, step?.baseRank ?? 1) },
    // Capital Dividend: "For the next minute, any time you would regain Hit Points from a healing effect, this magic amplifies the effect, and you regain
    // an additional 8 Hit Points." ("The additional healing increases by 2 Hit Points.")
    { pattern: /^For the next minute, any time you would regain Hit Points from a healing effect, this magic amplifies the effect, and you regain an additional (\d+) Hit Points\.$/,
        scaled: "additional healing", recipient: { actor: "source" },
        rule: (rule, match, step) => rule.key === "FlatModifier" && rule.selector === "healing-received" && JSON.stringify(rule.predicate) === '["item:trait:healing"]'
            && scales(rule.value, Number(match[1]), step?.amount ?? 0, step?.interval ?? 1, step?.baseRank ?? 1) },
    // Levitate: "A creature floating in the air from levitate takes a –2 circumstance penalty to attack rolls." / "A floating creature can spend an
    // Interact action to stabilize itself and negate this penalty for the remainder of its turn." (PF2e's toggle)
    { pattern: /^A creature floating in the air from [a-z]+ takes a [–−-](\d) circumstance penalty to attack rolls\.$/, recipient: { actor: "target" },
        rule: (rule, match) => rule.key === "FlatModifier" && rule.selector === "attack" && rule.type === "circumstance" && rule.value === -Number(match[1]) && JSON.stringify(rule.predicate) === '[{"not":"stabilized"}]' },
    { pattern: /^A floating creature can spend an Interact action to stabilize itself and negate this penalty for the remainder of its turn\.$/, recipient: { actor: "target" },
        rule: rule => rule.key === "RollOption" && rule.option === "stabilized" && rule.toggleable === true },
    // Ghost Rush: "You gain a +10-foot status bonus to your Speeds, then Stride twice." / "…, this movement ignores the effects of difficult terrain,
    // greater difficult terrain, and hazardous terrain and isn't impeded by physical barriers …" (PF2e's two terrain rules; the rest the GM's)
    { pattern: /^You gain a \+(\d+)-foot status bonus to your Speeds, then Stride twice\.$/, recipient: { actor: "source" }, note: () => "Then Stride twice (move your token).",
        rule: (rule, match) => rule.key === "FlatModifier" && rule.selector === "all-speeds" && rule.type === "status" && rule.value === Number(match[1]) },
    { pattern: /^While you don't become completely incorporeal, this movement ignores the effects of difficult terrain, greater difficult terrain, and hazardous terrain and isn't impeded by physical barriers that don't block your line of sight\.$/,
        recipient: { actor: "source" }, note: () => "The movement also ignores hazardous terrain and isn't impeded by physical barriers that don't block your line of sight.",
        rules: rules => { const kinds = ["difficult", "greater"].map(kind => rules.findIndex(rule => rule.key === "ActiveEffectLike" && rule.mode === "add" && rule.path === `system.movement.terrain.${kind}.ignored`));
            return kinds.every(index => index >= 0) ? kinds : null; } },
    // Spectral Advance: "During the movement, you (or your mount) have resistance equal to your level to all damage."
    { pattern: /^During the movement, you \(or your mount\) have resistance equal to your level to all damage\.$/, recipient: { actor: "source" },
        rule: rule => rule.key === "Resistance" && rule.type === "all-damage" && ["@item.origin.level", "@actor.level"].includes(rule.value) },
    // Filter Air: "As you breathe for the duration of the spell, you get the outcome one degree of success higher on your saving throws against inhaled
    // poisons and diseases."
    { pattern: /^As you breathe for the duration of the spell, you get the outcome one degree of success higher on your saving throws against inhaled poisons and diseases\.$/, recipient: { actor: "source" },
        rule: rule => rule.key === "AdjustDegreeOfSuccess" && rule.selector === "saving-throw" && rule.adjustment?.all === "one-degree-better"
            && JSON.stringify(rule.predicate) === '["item:trait:inhaled",{"or":["item:trait:disease","item:trait:poison"]}]' },
    // "Allied creatures who can hear and understand you gain a +1 status bonus to attack rolls, Fortitude saves, and Will saves against mental
    // effects." (Girzanje's March): PF2e's three modifiers, the same value (fixed-rank "The status bonus increases to +2." entries are checked).
    { pattern: /^Allied creatures who can hear and understand you gain an? \+(\d) status bonus to attack rolls, Fortitude saves, and Will saves against mental effects\.$/,
        recipient: { actor: "target" },
        rules: (rules, match, baseRank) => {
            const same = rule => rule.key === "FlatModifier" && rule.type === "status";
            const attack = rules.findIndex(rule => same(rule) && rule.selector === "attack" && rule.predicate == null);
            const fortitude = rules.findIndex(rule => same(rule) && rule.selector === "fortitude" && rule.predicate == null);
            const will = rules.findIndex(rule => same(rule) && rule.selector === "will" && JSON.stringify(rule.predicate) === '["mental"]');
            const indices = [attack, fortitude, will];
            return indices.every(index => index >= 0) && new Set(indices.map(index => JSON.stringify(rules[index].value))).size === 1 ? indices : null;
        }, bonusValue: true },
    // "You instantly teleport out of danger into an unoccupied space within range, and you gain resistance to all damage against the triggering
    // damage equal to your level." (Rapid Retreat): the resistance, gone after that damage; the teleport is the caster's move (a note).
    { pattern: /^You instantly teleport out of danger into an unoccupied space within range, and you gain resistance to all damage against the triggering damage equal to your level\.$/,
        endsAfterDamage: true, recipient: { actor: "source" }, note: () => "Teleport your token to an unoccupied space within range (the module doesn't move it).",
        rule: rule => rule.key === "Resistance" && rule.type === "all-damage" && rule.value === "@actor.level" },
    // "You're Concealed against the triggering attack and gain a +2 circumstance bonus to AC against it." (Unbreaking Wave Vapor): both, gone after
    // that attack roll.
    { pattern: new RegExp(String.raw`^You're ${CONDITION("Concealed")} against the triggering attack and gain an? \+(\d) (circumstance|status) bonus to AC against it\.$`), endsAfterAttack: true, recipient: { actor: "source" },
        rules: (rules, match) => { const ac = rules.findIndex(rule => rule.key === "FlatModifier" && rule.selector === "ac" && rule.type === match[2] && rule.value === Number(match[1]) && rule.predicate == null);
            const hidden = rules.findIndex(rule => rule.key === "GrantItem" && rule.uuid === "Compendium.pf2e.conditionitems.Item.DmAIPqOBomZ7H95W");
            return ac >= 0 && hidden >= 0 ? [ac, hidden] : null; } },
    // "While under this spell's effect, the target ignores effects that would give them a circumstance penalty to Speed." (Unfettered Movement)
    { pattern: /^While under this spell's effect, the target ignores effects that would give them a circumstance penalty to Speed\.$/, recipient: { actor: "target" },
        rule: rule => rule.key === "AdjustModifier" && rule.suppress === true && rule.selector === "land-speed" && JSON.stringify(rule.predicate) === '["penalty:type:circumstance"]' },
    // Font of Serenity: "Allies within the area gain a +1 status bonus to saving throws against emotion effects." — PF2e's modifier on the
    // allies inside (not the caster), stepped by "Heightened (+4) The bonus increases by 1."; where PF2e's value doesn't follow the text's
    // steps, the text's (an override).
    { pattern: /^Allies within the area gain a \+(\d) (status|circumstance) bonus to saving throws against ([a-z]+) effects\.$/, scaled: "bonus", recipient: { actor: "area", allies: true },
        rule: (rule, match) => rule.key === "FlatModifier" && rule.selector === "saving-throw" && rule.type === match[2] && JSON.stringify(rule.predicate) === JSON.stringify([`item:trait:${match[3]}`]),
        override: (rule, match, step) => step?.amount && scales(rule.value, Number(match[1]), step.amount, step.interval, step.baseRank) ? null
            : { key: rule.key, patch: { value: step?.amount ? `${match[1]} + floor((@item.level - ${step.baseRank}) / ${step.interval}) * ${step.amount}` : Number(match[1]) } } },
    // "An ally can touch the font at the center of the burst as an Interact action; if they do so, the spell attempts to counteract one emotion
    // effect affecting the ally of the ally's choice, after which that emotion effect is temporarily immune for 1 day." — the card's counteract
    // (the GM names the effect, its DC and rank).
    { pattern: /^An ally can touch the font at the center of the burst as an Interact action; if they do so, the spell attempts to counteract one ([a-z]+) effect affecting the ally of the ally's choice, after which that \1 effect is temporarily immune for (\d+) days?\.$/,
        rules: () => [], counteract: match => ({ target: `one ${match[1]} effect on the ally`, result: `is removed from that ally (not from other creatures); that effect is then immune to the font for ${match[2]} day${match[2] === "1" ? "" : "s"}` }) },
    // Sun's Fury: "The weapon deals an additional 1d4 fire and 1 spirit damage on a successful Strike." — PF2e's weapon choice, its damage die and
    // flat damage on that weapon; "In addition, the flame causes the weapon to glow as bright as a torch." — its light (20 feet bright, 20 dim).
    { pattern: /^The weapon deals an additional (\d+)d(\d+) ([a-z]+) and (\d+) ([a-z]+) damage on a successful Strike\.$/, recipient: { actor: "target" },
        rules: (rules, match) => { const choice = rules.findIndex(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems === true && JSON.stringify(rule.choices.types) === '["weapon"]');
            const flag = rules[choice]?.flag, selector = `{item|flags.system.rulesSelections.${flag}}-damage`;
            const dice = rules.findIndex(rule => rule.key === "DamageDice" && rule.selector === selector && rule.damageType === match[3] && Number(rule.diceNumber) === Number(match[1]) && rule.dieSize === `d${match[2]}` && rule.predicate == null);
            const flat = rules.findIndex(rule => rule.key === "FlatModifier" && rule.selector === selector && rule.damageType === match[5] && Number(rule.value) === Number(match[4]) && rule.predicate == null);
            return choice >= 0 && flag && dice >= 0 && flat >= 0 ? [choice, dice, flat] : null; } },
    { pattern: /^In addition, the flame causes the weapon to glow as bright as a torch\.$/, recipient: { actor: "target" },
        rule: rule => rule.key === "TokenLight" && Number(rule.value?.bright) === 20 && Number(rule.value?.dim) === 40 },
    // Ghostly Weapon: "It gains the effects of the Ghost Touch property rune, meaning it is magical if it wasn't already, …" — PF2e's weapon choice,
    // the rune and the magical trait.
    { pattern: /^It gains the effects of the @UUID\[Compendium\.pf2e\.equipment-srd\.Item\.[A-Za-z0-9]+\]\{Ghost Touch\} property rune, meaning it is magical if it wasn't already, is especially effective against incorporeal creatures, and can be wielded by a corporeal or incorporeal creature\.$/,
        recipient: { actor: "target" },
        rules: rules => { const choice = rules.findIndex(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems === true && JSON.stringify(rule.choices.types) === '["weapon"]');
            const flag = rules[choice]?.flag;
            const adjusts = ["ghost-touch", "magical"].map(value => rules.findIndex(rule => rule.key === "AdjustStrike" && rule.mode === "add" && rule.value === value
                && JSON.stringify(rule.definition) === JSON.stringify([`item:id:{item|flags.system.rulesSelections.${flag}}`])));
            return choice >= 0 && flag && adjusts.every(index => index >= 0) ? [choice, ...adjusts] : null; } },
    // "Each affected creature gains resistance 5 to bludgeoning and piercing damage." (Entwined Roots; its fixed-rank "The resistances increase to
    // 10." entries are checked against the rule at those ranks)
    { pattern: /^Each affected creature gains resistance (\d+) to ([a-z]+) and ([a-z]+) damage\.$/, recipient: { actor: "target" },
        rule: (rule, match, step) => rule.key === "Resistance" && JSON.stringify([rule.type].flat().sort()) === JSON.stringify([match[2], match[3]].sort())
            && ruleValueAt(rule.value, step?.baseRank ?? 1) === Number(match[1]) },
    // "When you Cast this Spell, a watery replica … appears in front of each of the targets, granting them a +1 circumstance bonus to AC and fire
    // resistance 5." (Domora's Defense)
    { pattern: /^When you Cast this Spell, [^,]+, granting them an? \+(\d) (circumstance|status) bonus to AC and ([a-z]+) resistance (\d+)\.$/, recipient: { actor: "target" },
        rules: (rules, match) => { const ac = rules.findIndex(rule => rule.key === "FlatModifier" && rule.selector === "ac" && rule.type === match[2] && Number(rule.value) === Number(match[1]));
            const resist = rules.findIndex(rule => rule.key === "Resistance" && [rule.type].flat().join() === match[3] && Number(rule.value) === Number(match[4]));
            return ac >= 0 && resist >= 0 ? [ac, resist] : null; } },
    // "You gain a fly Speed equal to your Speed." (Wind Jump)
    { pattern: /^You gain an? (fly|swim|climb|burrow) Speed equal to your Speed\.$/, recipient: { actor: "source" },
        rule: (rule, match) => rule.key === "BaseSpeed" && rule.selector === match[1] && rule.value === "@actor.system.movement.speeds.land.value" },
    // "You gain a +2 status bonus to the triggering save, and if the triggering save is against an incapacitation effect, it treats you as if you
    // were 2 levels higher." (Battlefield Persistence): the bonus, gone after that save; the incapacitation part is the GM's note.
    { pattern: /^You gain a \+(\d) (status|circumstance) bonus to the triggering save, and if the triggering save is against an incapacitation effect, it treats you as if you were (\d+) levels higher\.$/,
        endsAfterSave: true, recipient: { actor: "source" }, note: match => `If the triggering save is against an incapacitation effect, it treats you as if you were ${match[3]} levels higher.`,
        rule: (rule, match) => rule.key === "FlatModifier" && rule.selector === "saving-throw" && rule.type === match[2] && rule.value === Number(match[1]) && rule.predicate == null },
    // "The target gains a +2 circumstance bonus to AC against the triggering attack." (Repel Metal): gone after that attack roll.
    { pattern: /^The target gains an? \+(\d) (status|circumstance) bonus to AC against the triggering attack\.$/, endsAfterAttack: true, recipient: { actor: "target" },
        rule: (rule, match) => rule.key === "FlatModifier" && rule.selector === "ac" && rule.type === match[2] && rule.value === Number(match[1]) && rule.predicate == null },
    // Precious Metals: "The metal in the target transforms from its normal metal into cold iron, copper, gold, iron, silver, or steel." — PF2e's
    // material choice (exactly those, ungated) and its owned-item choice (the target's armor, shield or weapon: its holder gets the Effect).
    { pattern: /^The metal in the target transforms from its normal metal into ((?:[a-z ]+, )+or [a-z ]+)\.$/, recipient: { actor: "target" },
        note: () => "Target the creature holding the item; PF2e asks which of its armor, shields or weapons. Coins or loose metal are the GM's.",
        rules: (rules, match) => {
            const listed = match[1].split(/,\s*(?:or\s+)?/).map(name => name.trim().replace(/\s+/g, "-")).filter(Boolean);
            const material = rules.findIndex(rule => rule.key === "ChoiceSet" && rule.flag === "material" && Array.isArray(rule.choices)
                && JSON.stringify(rule.choices.filter(choice => !(choice.predicate ?? []).length).map(choice => choice.value).sort()) === JSON.stringify([...listed].sort()));
            const item = rules.findIndex(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems === true && JSON.stringify([...(rule.choices.types ?? [])].sort()) === '["armor","shield","weapon"]');
            return material >= 0 && item >= 0 ? [material, item] : null; } },
    // "If the spell's rank is 8th or higher, add adamantine and dawnsilver to the options.": the material choice's gated options, at the Effect's level.
    { pattern: /^If the spell's rank is (\d+)(?:st|nd|rd|th) or higher, add ([a-z]+) and ([a-z]+) to the options\.$/, recipient: { actor: "target" },
        rules: (rules, match) => { const choice = rules.find(rule => rule.key === "ChoiceSet" && rule.flag === "material" && Array.isArray(rule.choices));
            const gated = (choice?.choices ?? []).filter(entry => (entry.predicate ?? []).length);
            return gated.length === 2 && [match[2], match[3]].every(slug => gated.some(entry => entry.value === slug && JSON.stringify(entry.predicate) === `[{"gte":["{item|level}",${match[1]}]}]`)) ? [] : null; } },
    // "If you transform an object into copper, gold, or silver, its Hardness is reduced to 1."
    { pattern: /^If you transform an object into ((?:[a-z ]+, )+or [a-z ]+), its Hardness is reduced to (\d+)\.$/, recipient: { actor: "target" },
        rule: (rule, match) => rule.key === "ItemAlteration" && rule.property === "hardness" && rule.mode === "override" && Number(rule.value) === Number(match[2])
            && JSON.stringify([...(rule.predicate?.[0]?.or ?? [])].sort()) === JSON.stringify(match[1].split(/,\s*(?:or\s+)?/).map(name => `precious-metals:material:${name.trim().replace(/\s+/g, "-")}`).sort()) },
    // "Otherwise, its Hardness is increased to 10 if it was lower." ("If you increase the Hardness of the object, the new Hardness is 2 higher.")
    { pattern: /^Otherwise, its Hardness is increased to (\d+) if it was lower\.$/, scaled: "new Hardness", recipient: { actor: "target" },
        rule: (rule, match, step) => rule.key === "ItemAlteration" && rule.property === "hardness" && rule.mode === "upgrade" && Array.isArray(rule.predicate?.[0]?.nor)
            && scales(rule.value, Number(match[1]), step?.amount ?? 0, step?.interval ?? 1, step?.baseRank ?? 1) },
    // "An item transmuted in this way deals damage according to its new material." — PF2e's material change (for the precious materials).
    { pattern: /^An item transmuted in this way deals damage according to its new material\.$/, recipient: { actor: "target" },
        rule: rule => rule.key === "ItemAlteration" && rule.property === "material-type" && rule.mode === "override" && rule.value === "{item|flags.system.rulesSelections.material}" },
    // Runic Impression: "Your unarmed attacks or your weapon gain the benefits of a weapon rune you choose when you cast this spell: Corrosive, …, or
    // Thundering." — PF2e's choices (unarmed or a held weapon, then the rune: every listed rune offered at once, the rest from a later rank) and the
    // two AdjustStrike rules adding the chosen property rune.
    { pattern: /^Your unarmed attacks or your weapon gain the benefits of a weapon rune you choose when you cast this spell: (.+)\.$/, recipient: { actor: "source" },
        rules: (rules, match) => {
            // (Every listed name, linked or not: "@UUID[…]{Corrosive}, …, or @UUID[…]{Thundering}".)
            const listed = match[1].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").split(/,\s*(?:or\s+)?|\s+or\s+/).map(name => name.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean);
            const mode = rules.findIndex(rule => rule.key === "ChoiceSet" && Array.isArray(rule.choices) && JSON.stringify(rule.choices.map(choice => choice.value).sort()) === '["unarmed","weapon"]' && rule.rollOption);
            const weapon = rules.findIndex(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems === true && JSON.stringify(rule.choices.types) === '["weapon"]' && JSON.stringify(rule.predicate) === JSON.stringify([`${rules[mode]?.rollOption}:weapon`]));
            const rune = rules.findIndex(rule => rule.key === "ChoiceSet" && Array.isArray(rule.choices) && rule.flag && listed.length > 1
                && listed.every(slug => rule.choices.some(choice => choice.value === slug && choice.predicate == null))
                && rule.choices.every(choice => listed.includes(choice.value) || (choice.predicate ?? []).length));
            const adjust = (definition, option) => rules.findIndex(rule => rule.key === "AdjustStrike" && rule.mode === "add" && rule.property === "property-runes"
                && rule.value === `{item|flags.system.rulesSelections.${rules[rune]?.flag}}` && JSON.stringify(rule.definition) === JSON.stringify([definition]) && JSON.stringify(rule.predicate) === JSON.stringify([option]));
            const onWeapon = adjust(`item:id:{item|flags.system.rulesSelections.${rules[weapon]?.flag}}`, `${rules[mode]?.rollOption}:weapon`), onUnarmed = adjust("item:category:unarmed", `${rules[mode]?.rollOption}:unarmed`);
            const indices = [mode, weapon, rune, onWeapon, onUnarmed];
            return indices.every(index => index >= 0) ? indices : null; } },
    // Areas whose occupants hold PF2e's Effect while inside (the module's lingering area; leaving removes it):
    // Downpour: "Creatures in the area are Concealed and gain fire resistance 10." (the Effect's Resistance, stepped by "The fire resistance
    // increases by 2."; the Concealed the text states is added to the Effect)
    { pattern: /^Creatures in the area are @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.DmAIPqOBomZ7H95W)\]\{Concealed\} and gain ([a-z]+) resistance (\d+)\.$/, scaled: "resistance",
        recipient: { actor: "area" },
        rule: (rule, match, step) => rule.key === "Resistance" && [rule.type].flat().join() === match[2] && rule.predicate == null && scales(rule.value, Number(match[3]), step?.amount ?? 0, step?.interval ?? 1, step?.baseRank ?? 1),
        additions: () => [{ key: "GrantItem", uuid: "Compendium.pf2e.conditionitems.Item.DmAIPqOBomZ7H95W", flag: "conditionConcealed", allowDuplicate: true, onDeleteActions: { grantee: "restrict" } }] },
    // Anointed Ground: "Choose aberrations, celestials, dragons, fiends, monitors, or undead." / "All creatures in the area gain a +1 status bonus
    // to AC, attack rolls, damage rolls, and saving throws against the chosen creatures." (PF2e's ChoiceSet of those traits, the caster's pick
    // once for the area; its two modifiers against creatures of the trait)
    { pattern: /^Choose ([a-z]+(?:, [a-z]+)*,? or [a-z]+)\.$/, recipient: { actor: "area" },
        rules: (rules, match) => { const listed = match[1].split(/,\s*(?:or\s+)?|\s+or\s+/).map(word => word.trim().replace(/ies$/, "y").replace(/s$/, "")).filter(Boolean);
            const at = rules.findIndex(rule => rule.key === "ChoiceSet" && typeof rule.flag === "string" && Array.isArray(rule.choices)
                && JSON.stringify(rule.choices.map(choice => choice.value).sort()) === JSON.stringify([...listed].sort()));
            return at >= 0 ? [at] : null; },
        extra: (rules, indices) => ({ areaChoice: { index: indices[0], flag: rules[indices[0]].flag, choices: rules[indices[0]].choices.map(choice => choice.value) } }) },
    { pattern: /^All creatures in the area gain a \+(\d) (status|circumstance) bonus to AC, attack rolls, damage rolls, and saving throws against the chosen creatures\.$/, recipient: { actor: "area" },
        rules: (rules, match) => { const flag = rules.find(rule => rule.key === "ChoiceSet")?.flag;
            const pick = `{item|flags.system.rulesSelections.${flag}}`;
            const offence = rules.findIndex(rule => rule.key === "FlatModifier" && rule.type === match[2] && Number(rule.value) === Number(match[1])
                && JSON.stringify([rule.selector].flat().sort()) === '["attack-roll","damage"]' && JSON.stringify(rule.predicate) === JSON.stringify([`target:trait:${pick}`]));
            const defence = rules.findIndex(rule => rule.key === "FlatModifier" && rule.type === match[2] && Number(rule.value) === Number(match[1])
                && JSON.stringify([rule.selector].flat().sort()) === '["ac","saving-throw"]' && JSON.stringify(rule.predicate) === JSON.stringify([`origin:trait:${pick}`]));
            return flag && offence >= 0 && defence >= 0 ? [offence, defence] : null; } },
    // Safe Passage: "Anyone passing through the area gains the following benefits against harmful effects of the terrain and environment,
    // including environmental damage, hazardous terrain, and hazards in the area." (PF2e's toggle: on when the harm is the terrain's) /
    // "The spell grants a +2 status bonus to AC and saves against such effects, and resistance 5 to all damage from such effects."
    { pattern: /^Anyone passing through the area gains the following benefits against harmful effects of the terrain and environment, including environmental damage, hazardous terrain, and hazards in the area\.$/,
        recipient: { actor: "area" }, rule: rule => rule.key === "RollOption" && rule.toggleable === true && typeof rule.option === "string" && rule.predicate == null },
    { pattern: /^The spell grants a \+(\d) (status|circumstance) bonus to AC and saves against such effects, and resistance (\d+) to all damage from such effects\.$/, recipient: { actor: "area" },
        rules: (rules, match) => { const toggle = rules.find(rule => rule.key === "RollOption" && rule.toggleable === true)?.option;
            const bonus = rules.findIndex(rule => rule.key === "FlatModifier" && rule.type === match[2] && Number(rule.value) === Number(match[1])
                && JSON.stringify([rule.selector].flat().sort()) === '["ac","saving-throw"]' && JSON.stringify(rule.predicate) === JSON.stringify([toggle]));
            // (The stated value before any heightened entry; those are checked at their ranks.)
            const resist = rules.findIndex(rule => rule.key === "Resistance" && [rule.type].flat().join() === "all-damage" && JSON.stringify(rule.predicate) === JSON.stringify([toggle])
                && ruleValueAt(rule.value, 1) === Number(match[3]));
            return toggle && bonus >= 0 && resist >= 0 ? [bonus, resist] : null; } },
    // Soothing Blossoms: "When any creature in that area rolls a successful save against a poison or disease effect, it gets a critical success
    // instead." (PF2e's degree adjustment) / "The blossoms grant assisted recovery to everyone in the area to end their persistent damage, both
    // when the spell is cast and at the start of each of your turns." (the module rolls each occupant's recovery flat check then)
    { pattern: /^When any creature in that area rolls a successful save against a poison or disease effect, it gets a critical success instead\.$/, recipient: { actor: "area" },
        rule: rule => rule.key === "AdjustDegreeOfSuccess" && rule.selector === "saving-throw" && JSON.stringify(rule.adjustment) === '{"success":"one-degree-better"}'
            && JSON.stringify(rule.predicate) === '[{"or":["item:trait:poison","item:trait:disease"]}]' },
    { pattern: /^The blossoms grant assisted recovery to everyone in the area to end their persistent damage, both when the spell is cast and at the start of each of your turns\.$/,
        recipient: { actor: "area" }, rules: () => [], extra: () => ({ assistedRecovery: true }) },
    // Fire Shield: PF2e's Effect makes the shield (the actor's shield attribute) and the resistance (to the type its flag names):
    //   "As long as the shield persists, its heat grants you cold resistance 5 and makes you immune to mild and severe environmental cold." /
    //   "You can Raise a Shield with the fire shield as a normal shield to gain a +1 circumstance bonus to AC." / "You can use the Shield Block
    //   reaction with the fire shield, which has Hardness 10, is immune to fire, and has 40 HP (with no Broken Threshold), and its Hardness is
    //   halved against effects that have the water trait." (the environmental cold and the shield's fire immunity are notes)
    { pattern: /^As long as the shield persists, its heat grants you ([a-z]+) resistance (\d+) and makes you immune to mild and severe environmental \1\.$/, recipient: { actor: "source" }, scaled: "resistance",
        note: match => `You're immune to mild and severe environmental ${match[1]}.`,
        rules: (rules, match, step) => { const flag = rules.findIndex(rule => rule.key === "ActiveEffectLike" && rule.mode === "override" && /^flags\.system\.[A-Za-z]+\.resistance$/.test(rule.path ?? "") && rule.value === match[1]);
            const resist = rules.findIndex(rule => rule.key === "Resistance" && rule.type === `{actor|${rules[flag]?.path}}` && scales(rule.value, Number(match[2]), step?.amount ?? 0, step?.interval ?? 1, step?.baseRank ?? 1));
            return flag >= 0 && resist >= 0 ? [flag, resist] : null; } },
    { pattern: /^You can Raise a Shield with the [a-z ]+ as a normal shield to gain a \+(\d) circumstance bonus to AC\.$/, recipient: { actor: "source" },
        rules: (rules, match) => { const equipped = rules.findIndex(rule => rule.key === "RollOption" && rule.option === "self:shield:equipped" && !rule.toggleable);
            const shield = rules.findIndex(rule => rule.key === "ActiveEffectLike" && rule.path === "system.attributes.shield" && rule.value?.ac === Number(match[1]));
            return equipped >= 0 && shield >= 0 ? [equipped] : null; } },
    { pattern: /^You can use the (?:@UUID\[[^\]]+\]\{Shield Block\}|Shield Block) reaction with the [a-z ]+, which has Hardness (\d+), is immune to ([a-z]+), and has (\d+) HP \(with no Broken Threshold\), and its Hardness is halved against effects that have the ([a-z]+) trait\.$/,
        recipient: { actor: "source" }, scaled: "shield hp", note: match => `The shield is immune to ${match[2]}.`,
        rules: (rules, match, step) => { const shield = rules.findIndex(rule => rule.key === "ActiveEffectLike" && rule.path === "system.attributes.shield" && rule.value?.hardness === Number(match[1])
                && rule.value?.brokenThreshold === 0 && rule.value?.hp?.max === Number(match[3]));
            const hp = ["system.attributes.shield.max", "system.attributes.shield.value"].map(path => rules.findIndex(rule => rule.key === "ActiveEffectLike" && rule.path === path
                && scales(rule.value, Number(match[3]), step?.amount ?? 0, step?.interval ?? 1, step?.baseRank ?? 1)));
            const toggle = rules.findIndex(rule => rule.key === "RollOption" && rule.toggleable === true && new RegExp(`${match[4]}$`).test(rule.option ?? ""));
            const halved = rules.findIndex(rule => rule.key === "ActiveEffectLike" && rule.mode === "multiply" && rule.path === "system.attributes.shield.hardness" && Number(rule.value) === 0.5
                && JSON.stringify(rule.predicate) === JSON.stringify([rules[toggle]?.option]));
            return [shield, ...hp, toggle, halved].every(index => index >= 0) ? [shield, ...hp, toggle, halved] : null; } },
    // "If you Shield Block a melee attack that is either an unarmed attack or made by an adjacent attacker, the attacker takes 2d6 fire damage." —
    // the note carries the damage as a roll at the cast rank (the module can't see the Shield Block).
    { pattern: /^If you Shield Block a melee attack that is either an unarmed attack or made by an adjacent attacker, the attacker takes (\d+)d(\d+) ([a-z]+) damage\.$/, recipient: { actor: "source" },
        rules: () => [] },
    // Unblinking Flame Aura: "You recover 15 Hit Points." (the route's self-heal, its formula already checked) / "For the duration, you gain a +2
    // status bonus on Perception checks and resistance 10 to cold."
    { pattern: /^You recover (?:\d+ Hit Points|@Damage\[\(\d+\*@item\.level\)\[healing\]\](?:\{[^}]*\})?)\.$/, recipient: { actor: "source" }, rules: () => [] },
    { pattern: /^For the duration, you gain a \+(\d) (status|circumstance) bonus on Perception checks and resistance (\d+) to ([a-z]+)\.$/, recipient: { actor: "source" }, scaled: "resistance",
        rules: (rules, match, step) => { const bonus = rules.findIndex(rule => rule.key === "FlatModifier" && rule.selector === "perception" && rule.type === match[2] && Number(rule.value) === Number(match[1]));
            const resist = rules.findIndex(rule => rule.key === "Resistance" && [rule.type].flat().join() === match[4]
                && scales(rule.value, Number(match[3]), step?.amount ?? 0, step?.interval ?? 1, step?.baseRank ?? 1));
            return bonus >= 0 && resist >= 0 ? [bonus, resist] : null; } },
    // Life Connection: "When the spell is cast, you gain the Defend Life reaction; once you use the reaction, the spell ends." (PF2e's Effect
    // grants the action to the caster; the spell's end after the reaction is the GM's)
    // (Divine Dragon's Watch: "When the spell is complete, you gain the Dragon's Protection reaction; …".)
    { pattern: /^When the spell is (?:cast|complete), you gain the @UUID\[(Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\} reaction; once you use the reaction, the spell ends\.$/,
        recipient: { actor: "source" }, note: match => `Once you use ${match[2]}, the spell ends (remove its Effect).`,
        rule: (rule, match) => rule.key === "GrantItem" && rule.uuid === match[1] },
    // Spiral of Horrors: "Enemies in the area are Frightened 1 and can't reduce their frightened value below 1 for the spell's duration." (PF2e's
    // aura gives enemies in it an Effect granting the condition, which holds its value while they're inside)
    { pattern: /^Enemies in the area are @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Frightened (\d)\} and can't reduce their frightened value below \1 for the spell's duration\.$/,
        recipient: { actor: "source" },
        rule: rule => rule.key === "Aura" && (rule.effects ?? []).length === 1 && rule.effects[0].affects === "enemies" && (rule.effects[0].events ?? []).includes("enter") && (rule.traits ?? []).includes("fear") },
    // Tempest Cloak: "The twisting shield of wind creates difficult terrain in a @Template[burst|distance:5] surrounding the target." (PF2e's aura;
    // the terrain is the GM's note) / "The target also gains a +2 circumstance bonus to its AC against physical ranged attacks, such as attacks made
    // with bows, javelins, or slings." / "In addition, …, granting the target a +2 circumstance bonus to all defenses against auditory effects."
    { pattern: /^The [a-z ]+ creates difficult terrain in an? @Template\[burst\|distance:(\d+)\] surrounding the target\.$/, recipient: { actor: "target" },
        note: match => `The ${match[1]}-foot burst around the target is difficult terrain (it moves with the target).`,
        rule: (rule, match) => rule.key === "Aura" && Number(rule.radius) === Number(match[1]) && !(rule.effects ?? []).length },
    { pattern: /^The target also gains an? \+(\d) (circumstance|status) bonus to its AC against physical ranged attacks, such as attacks made with [a-z ,]+\.$/, recipient: { actor: "target" },
        rule: (rule, match) => rule.key === "FlatModifier" && rule.selector === "ac" && rule.type === match[2] && rule.value === Number(match[1])
            && JSON.stringify([...(rule.predicate ?? [])].sort()) === '["item:damage:category:physical","item:ranged"]' },
    { pattern: /^In addition, [a-z ,']+, granting the target an? \+(\d) (circumstance|status) bonus to all defenses against auditory effects\.$/, recipient: { actor: "target" },
        rule: (rule, match) => rule.key === "FlatModifier" && JSON.stringify([rule.selector].flat().sort()) === '["ac","saving-throw"]' && rule.type === match[2] && rule.value === Number(match[1])
            && JSON.stringify(rule.predicate) === '["item:trait:auditory"]' },
    // "You can see invisible creatures as though they weren't invisible, although their features are blurred, making them Concealed and
    // difficult to identify." — PF2e's see-invisibility sense.
    { pattern: new RegExp(String.raw`^You can see invisible creatures as though they weren't invisible, although their features are blurred, making them ${CONDITION("Concealed")} and difficult to identify\.$`),
        rule: rule => rule.key === "Sense" && rule.selector === "see-invisibility" && Object.keys(rule).every(key => ["key", "selector"].includes(key)) },
    // "Subtler clues also grant you a +2 status bonus to checks you make to disbelieve illusions."
    { pattern: /^Subtler clues also grant you a \+(\d) (status|circumstance) bonus to checks you make to disbelieve illusions\.$/,
        rule: (rule, match) => rule.key === "FlatModifier" && rule.value === Number(match[1]) && rule.type === match[2] && JSON.stringify(rule.predicate) === '["illusion"]'
            && JSON.stringify([rule.selector].flat().sort()) === '["perception","will"]' },
    // "Your eidolon gains Fast Healing 4 for 4 rounds." (Lifelink Surge)
    { pattern: /^Your eidolon gains Fast Healing (\d+) for \d+ rounds\.$/, scaled: "fast healing", recipient: { actor: "target", trait: "eidolon" },
        rule: (rule, match, step) => rule.key === "FastHealing" && scales(rule.value, Number(match[1]), step?.amount ?? 0, step?.interval ?? 1, step?.baseRank ?? 1) },
    // Apex Companion's list: "Your animal companion becomes Huge and its attacks have 15-foot reach." (PF2e's CreatureSize; a Huge creature's reach is 15 feet) /
    // "30 temporary Hit Points." / "Darkvision." / "Your animal companion's attack's damage dice increase by one step, and its attack gains the deadly d12 trait."
    // (the dice step and the trait on its weapons) / "+10-foot status bonus to its Speeds."
    // Regenerate: "The target temporarily gains regeneration 15, which restores 15 Hit Points to it at the start of each of its turns." (PF2e's FastHealing of the
    // regeneration type) / "If the target takes acid or fire damage, its regeneration deactivates until after the end of its next turn." (that rule's deactivatedBy)
    { pattern: /^The target temporarily gains regeneration (\d+), which restores \1 Hit Points to it at the start of each of its turns\.$/, recipient: { actor: "target" },
        rule: (rule, match, step) => rule.key === "FastHealing" && rule.type === "regeneration" && ruleValueAt(rule.value, step.baseRank) === Number(match[1]) },
    { pattern: /^If the target takes ([a-z]+) or ([a-z]+) damage, its regeneration deactivates until after the end of its next turn\.$/, shared: true,
        rule: (rule, match) => rule.key === "FastHealing" && rule.type === "regeneration" && JSON.stringify([...(rule.deactivatedBy ?? [])].sort()) === JSON.stringify([match[1], match[2]].sort()) },
    // (PF2e's size rule alone leaves an NPC's reach at 10: the stated reach is patched onto it — checked live, `reach: {override: 15}` gives 15.)
    { pattern: /^Your animal companion becomes (Large|Huge|Gargantuan) and its attacks have (\d+)-foot reach\.$/, recipient: { actor: "target" },
        rule: (rule, match) => rule.key === "CreatureSize" && rule.value === match[1].toLowerCase() && rule.reach == null,
        override: (rule, match) => ({ key: rule.key, patch: { reach: { override: Number(match[2]) } } }) },
    { pattern: /^(\d+) temporary Hit Points\.$/, recipient: { actor: "target" }, rule: (rule, match) => rule.key === "TempHP" && Number(rule.value) === Number(match[1]) },
    { pattern: /^Darkvision\.$/, recipient: { actor: "target" }, rule: rule => rule.key === "Sense" && rule.selector === "darkvision" },
    { pattern: /^Your animal companion's attack's damage dice increase by one step, and its attack gains the deadly (d\d+) trait\.$/, recipient: { actor: "target" },
        rules: (rules, match) => { const dice = rules.findIndex(rule => rule.key === "DamageDice" && rule.override?.upgrade === true && [rule.selector].flat().join() === "strike-damage");
            const deadly = rules.findIndex(rule => rule.key === "ItemAlteration" && rule.itemType === "weapon" && rule.mode === "add" && rule.property === "traits" && rule.value === `deadly-${match[1]}`);
            return dice >= 0 && deadly >= 0 ? [dice, deadly] : null; } },
    { pattern: /^\+(\d+)-foot status bonus to its Speeds\.$/, recipient: { actor: "target" },
        rule: (rule, match) => rule.key === "FlatModifier" && ["speed", "all-speeds"].includes([rule.selector].flat().join()) && rule.type === "status" && Number(rule.value) === Number(match[1]) },
    // Scintillating Safeguard: "Choose one type of physical or energy damage the triggering effect deals." (PF2e's damage-type ChoiceSet) / "Each target gains
    // resistance 10 against that damage type for the triggering effect." (its Resistance of the chosen type, +1 per rank; removed once the creature takes damage)
    { pattern: /^Choose one type of physical or energy damage the triggering effect deals\.$/, recipient: { actor: "target" }, extra: () => ({ casterChoice: { flag: "damageType" } }),
        rules: rules => { const at = rules.findIndex(rule => rule.key === "ChoiceSet" && rule.flag === "damageType" && Array.isArray(rule.choices)
            && ["bludgeoning", "piercing", "slashing", "fire", "cold", "acid", "electricity", "sonic"].every(type => rule.choices.some(choice => choice.value === type))); return at >= 0 ? [at] : null; } },
    { pattern: /^Each target gains resistance (\d+) against that damage type for the triggering effect\.$/, scaled: "resistance", endsAfterDamage: true, recipient: { actor: "target" },
        rule: (rule, match, step) => rule.key === "Resistance" && rule.type === "{item|flags.system.rulesSelections.damageType}" && scales(rule.value, Number(match[1]), step?.amount ?? 0, step?.interval ?? 1, step?.baseRank ?? 1) },
    // "The target gains resistance 5 to all damage against the triggering effect." (Warping Pull: removed once the creature takes damage)
    { pattern: /^The target gains resistance (\d+) to all damage against the triggering effect\.$/, scaled: "resistance", endsAfterDamage: true, recipient: { actor: "target" },
        rule: (rule, match, step) => rule.key === "Resistance" && rule.type === "all-damage" && scales(rule.value, Number(match[1]), step?.amount ?? 0, step?.interval ?? 1, step?.baseRank ?? 1) },
    // "It gains a +1 status bonus to Intimidation checks." (Thundering Dominance: "… increases by 1 (to a maximum of a +4 …)")
    { pattern: /^It gains a \+(\d) status bonus to (Intimidation|Deception|Diplomacy|Athletics|Acrobatics|Stealth) checks\.$/, scaled: "status bonus", recipient: { actor: "target" },
        rule: (rule, match, step) => rule.key === "FlatModifier" && rule.selector === match[2].toLowerCase() && rule.type === "status" && rule.predicate == null
            && scales(rule.value, Number(match[1]), step?.amount ?? 0, step?.interval ?? 1, step?.baseRank ?? 1, step?.max ?? Infinity) },
    // "Once during this spell's duration, it can take the Thundering Roar action." — PF2e grants the action (using it once is the GM's).
    { pattern: /^Once during this spell's duration, it can take the @UUID\[(Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+)\]\{[^}]+\} action\.$/,
        rule: (rule, match) => rule.key === "GrantItem" && rule.uuid === match[1] && Object.keys(rule).every(key => ["key", "uuid"].includes(key)) },
    // "It allows the target to ignore any circumstance penalties they might take for being disguised as dissimilar creatures, and it gives the
    // target a +4 status bonus to Deception checks to prevent other animals from seeing through their disguise." (Imitate Fauna)
    { pattern: /^It allows the target to ignore any circumstance penalties they might take for being disguised as dissimilar creatures, and it gives the target a \+(\d) status bonus to Deception checks to prevent other ([a-z]+)s from seeing through their disguise\.$/,
        recipient: { actor: "target", trait: "animal" },
        rule: (rule, match) => rule.key === "FlatModifier" && rule.selector === "deception" && rule.type === "status" && rule.value === Number(match[1])
            && JSON.stringify(rule.predicate) === JSON.stringify(["action:impersonate", `target:trait:${match[2]}`]) },
    // Spirit Sense: "You gain a +1 status bonus to the following checks regarding haunts or spirits: Perception checks to Seek, …" — PF2e's
    // modifier waits on a roll option nothing sets for those checks: the module adds the toggle (the text over the data).
    { pattern: /^You gain a \+(\d) status bonus to the following checks regarding haunts or spirits: Perception checks to (?:@UUID\[[^\]]+\]\{Seek\}|Seek), attempts to Recall Knowledge, skill checks to determine the reason for their existence, and skill checks to disable a haunt\.$/,
        recipient: { actor: "source" },
        rule: (rule, match) => rule.key === "FlatModifier" && rule.type === "status" && rule.value === Number(match[1])
            && ["perception", "skill-check"].every(selector => [rule.selector].flat().includes(selector)) && spiritOption(rule) != null,
        additions: rule => [{ key: "RollOption", domain: "all", option: spiritOption(rule), toggleable: true, label: "Checks regarding haunts or spirits" }] },
    // "You also gain a +1 status bonus to AC and saving throws against haunts and spirits." — the same modifier (by the creature's traits).
    { pattern: /^You also gain a \+(\d) status bonus to AC and saving throws against haunts and spirits\.$/, shared: true,
        rule: (rule, match) => rule.key === "FlatModifier" && rule.type === "status" && rule.value === Number(match[1])
            && ["ac", "saving-throw"].every(selector => [rule.selector].flat().includes(selector))
            && ["origin:trait:haunt", "origin:trait:spirit"].every(term => (rule.predicate?.[0]?.or ?? []).includes(term)) },
    // Vision of Weakness: "… gain a +2 status bonus to your next attack roll (or skill check made as part of an attack action) against that foe
    // before the end of your turn." — PF2e's mark on the foe and the two once-only modifiers predicated on it.
    { pattern: /^You also learn an inherent understanding of its movements and gain a \+(\d) status bonus to your next attack roll \(or skill check made as part of an attack action\) against that foe before the end of your turn\.$/,
        recipient: { actor: "source", subject: "target" },
        rules: (rules, match) => {
            const mark = rules.findIndex(rule => rule.key === "TokenMark" && /^[a-z-]+$/.test(rule.slug ?? ""));
            if (mark < 0) return null;
            const marked = `target:mark:${rules[mark].slug}`;
            const attack = rules.findIndex(rule => rule.key === "FlatModifier" && rule.selector === "attack" && rule.type === "status" && rule.value === Number(match[1])
                && rule.removeAfterRoll === "if-enabled" && JSON.stringify(rule.predicate) === JSON.stringify([marked]));
            const skill = rules.findIndex(rule => rule.key === "FlatModifier" && rule.selector === "skill-check" && rule.type === "status" && rule.value === Number(match[1])
                && rule.removeAfterRoll === "if-enabled" && JSON.stringify([...(rule.predicate ?? [])].sort()) === JSON.stringify(["attack", marked].sort()));
            return attack < 0 || skill < 0 ? null : [mark, attack, skill];
        } },
    // "If the creature has any weaknesses, you learn them, as well as which of its three saving throw modifiers is lowest." (user decision
    // 2026-10-01: read from PF2e and whispered to the GM and the caster)
    { pattern: /^If the creature has any weaknesses, you learn them, as well as which of its three saving throw modifiers is lowest\.$/, reveal: "weaknesses-and-lowest-save", rules: () => [] },
    // "The target is then temporarily immune to Vision of Weakness for 1 day."
    { pattern: /^The target is then temporarily immune to (?:<em>)?[A-Za-z' ]+(?:<\/em>)? for (\d+) (day|hour)s?\.$/, immunity: true, rules: () => [] },
    // "The target then becomes immune to this spell for 10 minutes." (Repel Metal)
    { pattern: /^The target then becomes (?:temporarily )?immune to this spell for (\d+) (minute|hour|day)s?\.$/, immunity: true, rules: () => [] },
    // Summoner's Visage: "Your eidolon gains a +4 status bonus to Deception checks to Impersonate you and can add its level to such checks even
    // if it's untrained." — PF2e's toggle (impersonating the summoner) and its two modifiers.
    { pattern: /^Your eidolon gains a \+(\d) status bonus to Deception checks to Impersonate you and can add its level to such checks even if it's untrained\.$/,
        recipient: { actor: "target", trait: "eidolon" },
        rules: (rules, match) => {
            const toggle = rules.findIndex(rule => rule.key === "RollOption" && rule.toggleable === true && /^[a-z-]+$/.test(rule.option ?? ""));
            if (toggle < 0) return null;
            const when = ["action:impersonate", rules[toggle].option];
            const status = rules.findIndex(rule => rule.key === "FlatModifier" && rule.selector === "deception" && rule.type === "status" && rule.value === Number(match[1])
                && JSON.stringify(rule.predicate) === JSON.stringify(when));
            const level = rules.findIndex(rule => rule.key === "FlatModifier" && rule.selector === "deception" && rule.type === "proficiency" && rule.value === "@actor.level"
                && JSON.stringify(rule.predicate) === JSON.stringify([...when, "proficiency:untrained"]));
            return status < 0 || level < 0 ? null : [toggle, status, level];
        } },
    // "Assuming you are a humanoid, the eidolon gains the humanoid trait …, as well as any other trait related to your form (such as elf or
    // gnome)." with "you transform your eidolon into your identical twin" and "If this transformation reduces your eidolon's size, …": the
    // caster's ancestry traits and size, read when cast (rules PF2e's Effect lacks).
    { pattern: /^Assuming you are a humanoid, the eidolon gains the humanoid trait in addition to its other traits while it's in this form, as well as any other trait related to your form \(such as elf or gnome\)\.$/,
        rules: () => [], additions: () => [{ key: "ActorTraits", add: "@caster:form-traits" }] },
    { pattern: /^If this transformation reduces your eidolon's size, the eidolon loses any other effects of its larger size, such as any increase to reach\.$/,
        rules: () => [], additions: () => [{ key: "CreatureSize", value: "@caster:size" }] },
    // Knock: "Knock grants a +4 status bonus to any creature that tries to open the target door, lock, or container with an Athletics or a
    // Thievery check." — PF2e's modifier on Force Open and Pick a Lock (on whoever gets the Effect).
    // (Whoever will try: the caster, or the creatures the caster targets — asked when cast.)
    { pattern: /^[A-Z][a-z]+ grants a \+(\d) status bonus to any creature that tries to open the target door, lock, or container with an Athletics or a Thievery check\.$/, recipient: { actor: "ask" },
        rule: (rule, match) => rule.key === "FlatModifier" && rule.type === "status" && rule.value === Number(match[1]) && JSON.stringify([rule.selector].flat().sort()) === '["athletics","thievery"]'
            && JSON.stringify(rule.predicate) === JSON.stringify([{ or: ["action:force-open", "action:pick-a-lock"] }]) },
    // "You can attempt a Thievery check to open the target as part of casting knock, and you add your level even if you're untrained." — the
    // card's button rolls it.
    { pattern: /^You can attempt a (Thievery) check to open the target as part of casting [a-z]+, and you add your level even if you're untrained\.$/, rules: () => [],
        castCheck: match => ({ skill: match[1].toLowerCase(), action: "pick-a-lock", addLevelUntrained: true }) },
    // "Knock counteracts Lock." — the card's counteract button.
    { pattern: /^[A-Z][a-z]+ counteracts (?:@UUID\[Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+\]\{([A-Za-z ]+)\}|([A-Z][a-z ]+))\.$/, rules: () => [],
        counteract: match => ({ target: match[1] ?? match[2], result: "is counteracted: it ends" }) },
    // Canopy Crawler: "For the duration of the spell, they gain a climb Speed equal to their highest Speed." — PF2e's climb Speed is the land
    // Speed: the module's override sets it to the recipient's highest Speed, read when cast (the text over the data).
    { pattern: /^For the duration of the spell, they gain a climb Speed equal to their highest Speed\.$/, recipient: { actor: "self-or-companion" },
        rule: rule => rule.key === "BaseSpeed" && rule.selector === "climb" && Object.keys(rule).every(key => ["key", "selector", "value"].includes(key)),
        override: rule => ({ key: rule.key, patch: { value: "@recipient:highest-speed" } }) },
    // Dancing Shield: "When you Cast the Spell and Sustain it, the shield uses the Raise a Shield action to protect the target creature." —
    // PF2e's choice of the shield's bonus (+1 to +3) and the circumstance bonus to AC it gives while the spell lasts (sustained: raised on each
    // Sustain); the runtime presets the choice from the shield.
    { pattern: /^When you Cast the Spell and Sustain it, the shield uses the (?:@UUID\[[^\]]+\]\{Raise a Shield\}|Raise a Shield) action to protect the target creature\.$/, recipient: { actor: "target" },
        rules: rules => {
            const choice = rules.findIndex(rule => rule.key === "ChoiceSet" && /^[A-Za-z]+$/.test(rule.flag ?? "") && JSON.stringify((rule.choices ?? []).map(entry => entry.value)) === "[1,2,3]");
            if (choice < 0) return null;
            const bonus = rules.findIndex(rule => rule.key === "FlatModifier" && rule.selector === "ac" && rule.type === "circumstance" && rule.value === `@item.flags.system.rulesSelections.${rules[choice].flag}`);
            return bonus < 0 ? null : [choice, bonus];
        },
        extra: (rules, indices) => ({ shieldChoice: { flag: rules[indices[0]].flag, min: 1, max: 3 } }) },
    // "The gemstone you touch glows, spreading bright light with a color of your choice in a 20-foot radius (and dim light for the next 20 feet)."
    // (The light is the gem's: on its holder, the caster.)
    { pattern: /^The [a-z]+ you touch glows, spreading bright light with a color of your choice in a (\d+)-foot radius \(and dim light for the next (\d+) feet\)\.$/, recipient: { actor: "source" },
        rule: (rule, match) => rule.key === "TokenLight" && Number(rule.value?.bright) === Number(match[1]) && Number(rule.value?.dim) === Number(match[1]) + Number(match[2]) }
];
// "Heightened (+1) The fast healing increases by 2." / "Heightened (+2) The resistance increases by 5.": the step a scaled reader checks. Or
// Thundering Dominance's "The status bonus to Intimidation checks increases by 1 (to a maximum of a +4 status bonus for an 8th-rank spell), and
// the damage from the roar increases by 2d8." (its maximum, and PF2e's roar dice alteration rising by the same dice).
const STEP = /^The (?:[a-z]+ (?=resistance))?(fast healing|resistance)s? increases? by (\d+)\.$|^The (status bonus) to [A-Z][a-z]+ checks increases by (\d+) \(to a maximum of a \+(\d+) status bonus for an? (\d+)(?:st|nd|rd|th)-rank spell\), and the damage from the ([a-z]+) increases by (\d+)d\d+\.$/;
// "The temporary Hit Points increase by 4." / "The additional healing increases by 2 Hit Points.": the same kind of step.
const STEP_MORE = /^The (temporary Hit Points|additional healing|bonus) increases? by (\d+)(?: Hit Points)?\.$|^If you increase the Hardness of the object, the (new Hardness) is (\d+) higher\.$/;
// "The damage increases by 1d4." where PF2e's Effect raises the granted action's dice by the rank (Divine Dragon's Watch): a DamageAlteration
// dice-number upgrade growing by that many dice each interval.
const STEP_DICE = /^The damage increases by (\d+)d(\d+)\.$/;
// "You recover an additional 3 Hit Points, and the resistance to cold increases by 2." (Unblinking Flame Aura): the self-heal's step (its
// formula's per-rank multiple) and the resistance's.
// "The cold resistance increases by 5, the HP increase by 10, and the fire damage increases by 1d6." (Fire Shield): three steps in one entry.
const STEP_SHIELD = /^The ([a-z]+) resistance increases by (\d+), the HP increase by (\d+), and the ([a-z]+) damage increases by (\d+)d(\d+)\.$/;
const STEP_HEAL_RESIST = /^You recover an additional (\d+) Hit Points, and the resistance to ([a-z]+) increases by (\d+)\.$/;
const STEP_EXTRA = (rule, found, interval) => found[7] && rule.key === "DamageAlteration" && rule.property === "dice-number" && rule.mode === "upgrade"
    && [rule.selectors ?? rule.selector].flat().every(selector => new RegExp(`^[a-z-]*${found[7]}[a-z-]*$`).test(String(selector)))
    && Array.from({ length: 8 }, (_, index) => index + 1).every(rank => ruleValueAt(rule.value, rank + interval) - ruleValueAt(rule.value, rank) === Number(found[8]));
// A fixed-rank entry that is where PF2e's Effect starts (Helpful Reload: "Heightened (4th) You reload your ally's weapon and grant them a +1
// status bonus to their next Strike with this weapon." — PF2e's weapon choice and once-only modifier), and later entries that keep it with notes.
const FROM_RANK = [
    { pattern: /^You reload your ally's weapon and grant them a \+(\d) status bonus to their next Strike with this weapon\.$/,
        rules: (rules, match) => {
            const choice = rules.findIndex(rule => rule.key === "ChoiceSet" && rule.flag === "weapon" && JSON.stringify(rule.choices?.types) === '["weapon"]' && rule.choices?.ownedItems === true);
            const bonus = rules.findIndex(rule => rule.key === "FlatModifier" && rule.type === "status" && rule.value === Number(match[1]) && rule.removeAfterRoll === "if-enabled"
                && rule.selector === "{item|flags.system.rulesSelections.weapon}-attack");
            return choice < 0 || bonus < 0 ? null : [choice, bonus];
        } }
];
const KEEPS = [/^You reload your ally's weapon with the ammunition of their choice from their inventory\. Your ally gains a \+(\d) status bonus to their next Strike with this weapon\.$/,
    /^The spell no longer requires your ally to have appropriate ammunition available\. You summon a single piece of common magical ammunition of 10th level or lower to reload your ally's weapon with\. Your ally gains a \+(\d) status bonus to their next Strike with this weapon\.$/];
// "Heightened (5th) You can target up to six willing animals.": the runtime's target limit reads it.
const TARGETS = /^You can target up to (?:\d+|two|three|four|five|six|ten) willing [a-z]+s\.$/;
// What the GM plays (no PF2e rule exists for it).
const NOTES = [
    // Flaming Fusillade: casting the named spell with it (the caster casts it; the module resolves that spell), and its shorter casting (the GM's).
    /^You cast @UUID\[Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+\]\{[A-Za-z ]+\} as part of casting [a-z ]+ ?\.$/,
    /^For the duration of [a-z ]+ ?, [a-z ]+ ?'s casting time is reduced from 2 actions to 1\.$/,
    // Regenerate: what regeneration does at 0 HP and with Wounded (the GM's), organs, and reattaching parts.
    /^While it has regeneration, the target can't die from taking Hit Point damage and its (?:@UUID\[[^\]]+\]\{Dying\}|Dying|dying) condition can't increase to a value that would kill it \(this stops most creatures' dying condition at dying 3\), though if its (?:@UUID\[[^\]]+\]\{Wounded\}|Wounded) value becomes 4 or higher, it stays (?:@UUID\[[^\]]+\]\{Unconscious\}|Unconscious) until its wounds are treated\.$/,
    /^Each time the creature regains Hit Points from regeneration, it also regrows one damaged or ruined organ \(if any\)\.$/,
    /^During the spell's duration, the creature can also reattach severed body parts by spending an Interact action to hold the body part to the area it was severed from\.$/,
    // Apex Companion: the list's lead, the space it needs, and terrain (the GM's).
    /^Your animal companion gains the following statistics and abilities while in its apex form\.$/,
    /^It must have enough space to expand into or the spell is lost\.$/,
    /^Ignores difficult terrain and greater difficult terrain\.$/,
    // Scintillating Safeguard: the barrier, and only the initial damage (the Effect ends after that damage).
    /^A sparkling magical barrier envelops each target, shielding them against the triggering effect\.$/,
    /^The resistance applies only against the initial damage, not against any persistent damage or other lingering effects\.$/,
    // Zealous Conviction: obeying the caster, and the repugnant task's end-of-turn Will save (the GM's).
    /^If you tell a target to do something, it must comply with your request, though if it would normally find the task repugnant, it can attempt a Will save at the end of its turn each round due to the cognitive dissonance\.$/,
    /^On a success, it ends the spell's effects on itself entirely\.$/,
    // Safeguard Secret: which secret (the caster's; the targets are those who know it).
    /^Choose one piece of information that at least some of the targets know, such as .+\.["”]$/,
    // Unusual Anatomy: how resistance to critical hits works (PF2e's own critical-hits resistance does exactly this).
    /^If the resistance is greater than the extra damage, it reduces the extra damage to 0 but doesn't reduce the attack's normal damage\.$/,
    // Precious Metals: an example, the GM's other effects of the material, and the value.
    /^For example, a steel sword transmuted to cold iron would deal additional damage to a creature with a weakness to cold iron\.$/,
    /^It can have other effects of the new material at the GM's discretion\.$/,
    /^This change is clearly magical and temporary, so the item's monetary value doesn't change; you couldn't transmute copper coins to gold and use them to purchase something\.$/,
    // Runic Impression: when it ends early, and the rune limits (the GM's).
    /^If you cast runic impression on a weapon, this spell ends if you cease holding the weapon, with the exception of throwing a returning weapon\.$/,
    /^If this spell would give a weapon more property runes than its normal maximum, one of the existing property runes \(your choice\) is suppressed until the spell ends\.$/,
    /^For unarmed attacks, if this spell would give you more property runes than you could have from @UUID\[[^\]]+\]\{Handwraps of Mighty Blows\}, one of the existing property runes is similarly suppressed\.$/,
    // Safe Passage: what the GM keeps from collapsing, and what it doesn't protect against.
    /^Furthermore, the spell prevents anything in the area that's prone to collapse, such as a rickety bridge or an unstable ceiling, from collapsing, except under extreme strain that would collapse a normal structure of its type\.$/,
    /^Safe passage protects only against harm, not inconvenience, and it doesn't reduce difficult terrain, remove the (?:@UUID\[[^\]]+\]\{Concealed\}|Concealed) condition caused by precipitation, or the like, nor does it protect against creatures within the spell's area\.$/,
    // Soothing Blossoms: the flowers afterwards, and the stage-length limit the GM keeps (PF2e's adjustment doesn't read the stage).
    /^Once the duration ends, the flowers lose their magical effect, but a few of them might survive in the area as long as they can naturally\.$/,
    /^This spell doesn't give a benefit on a save against an affliction unless the stage lasts 10 minutes or less\.$/,
    // Divine Dragon's Watch: the spirit, and the granted reaction's own text embedded (PF2e's action carries its rules).
    /^You summon an invisible divine draconic spirit to watch over your target\.$/,
    /^[A-Z][A-Za-z' ]+ R \([a-z, ]+\) @Embed\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+ inline\]$/,
    // Life Connection: the failsafe, sensing the target's damage, one connection per creature.
    /^When you cast this spell, you place a failsafe deep within the life force of the target that could save them in a time of need\.$/,
    /^You can sense when the target takes damage, provided you're within \d+ miles? of one another\.$/,
    /^A creature can be part of no more than one life connection simultaneously\.$/,
    // Downpour: what the GM handles around the rain.
    /^Creatures outside the area are (?:@UUID\[[^\]]+\]\{Concealed\}|Concealed) to those inside the area\.$/,
    /^If a creature with weakness to water ends its turn in the area, the downpour triggers its weakness\.$/,
    // Domora's Defense: the replica is a shield the target can Shield Block with (the GM's; the target's Effect ends when it dissipates).
    /^While the replica persists, a target can use the (?:@UUID\[[^\]]+\]\{Shield Block\}|Shield Block) reaction with the replica\.$/,
    /^The replica has Hardness (\d+) \(or Hardness (\d+) against [a-z]+ damage\)\.$/,
    /^They can use this reaction to reduce damage from any spell or magical effect, even if it doesn't deal physical damage\.$/,
    /^After a target uses (?:@UUID\[[^\]]+\]\{Shield Block\}|Shield Block), the replica dissipates\.$/,
    /^The spell ends when you no longer Sustain it or if all three replicas have dissipated, whichever happens first\.$/,
    /^Use a (?:@UUID\[[^\]]+\]\{Recall Knowledge\}|Recall Knowledge) action, rolling the appropriate skill check to identify the triggering creature's abilities\.$/,
    // Capital Dividend: "You remain at 1 Hit Point, and your skin takes on a slight warm glow." (the GM keeps the caster at 1 HP)
    /^You remain at 1 Hit Point, and your skin takes on a slight warm glow\.$/,
    /^You become temporarily ghostlike as you push forward, moving through obstacles in your path\.$/,
    /^You defy gravity and levitate the target \d+ feet off the ground\.$/,
    /^You can Sustain the spell to move the target up or down \d+ feet\.$/,
    /^If the target is adjacent to a fixed object or terrain of suitable stability, it can move across the surface by climbing \(if the surface is vertical, like a wall\) or crawling \(if the surface is horizontal, such as a ceiling\)\.$/,
    /^The GM determines which surfaces can be climbed or crawled across\.$/,
    /^If the movement would end in a space that would normally be obstructed, it instead ends at the nearest unobstructed space you pass through before reaching it\.$/,
    /^You can use [a-z ]+ to Fly or Swim instead of Stride if you have the corresponding movement type\.$/,
    /^If you're riding a mount or piloting a vehicle that's Large or smaller and unencumbered, you can cause the spell to affect the mount or vehicle instead, including any cargo or passengers\.$/,
    /^You Stride to a space adjacent to an enemy\.$/, /^If you cast the spell using 2 actions, you can Stride twice instead of once\.$/,
    /^If you have a fly Speed, you can Fly instead of Striding\.$/, /^If you're mounted, you can have your mount move instead of you\.$/,
    /^Movement from [a-z ]+ doesn't trigger reactions and ignores difficult terrain and greater difficult terrain\.$/,
    /^You can't Cast this Spell if there's no space to move into\.$/,
    /^After the triggering attack is complete, you can Step if the triggering attack hit or Step twice if the triggering attack missed\.$/,
    /^When they attempt to (?:@UUID\[[^\]]+\]\{Escape\}|Escape) an effect that has them .+?, they automatically succeed unless the effect is magical and of a higher rank than the [a-z ]+ spell\.$/,
    /^The target weapon becomes translucent and ghostly, and it can affect material and incorporeal creatures and objects\.$/,
    // Wind Jump: "You must end your turn on solid ground, or you fall."; Entwined Roots' caught ammunition.
    /^You must end your turn on solid ground, or you fall\.$/,
    /^Whenever a creature protected by these roots is targeted by a ranged weapon attack but takes no damage \(such as if the attack missed or the damage was reduced to 0 by resistance\), the roots snatch up the ammunition or thrown weapon and hold it\.$/,
    /^The protected creature can retrieve the thrown weapon or ammunition as an Interact action\.$/,
    // "If the attack then misses, you direct the Strike back at the attacker, who compares the attack roll to their own AC." (Repel Metal): the GM's.
    /^If the attack then misses, you direct the Strike back at the attacker, who compares the attack roll to their own AC\.$/,
    /^You can also see incorporeal creatures, like ghosts, phased through an object from within \d+ feet of an object's surface as blurry shapes seen through those objects\.$/,
    // (The GM moves the token: the caster picks the square.)
    /^You teleport the target to an unoccupied square up to \d+ feet closer to you\.$/,
    /^The spell ends immediately if the [a-z]+ is broken\.$/,
    /^This covers the target's visual appearance, scent, and voice\.$/,
    /^The target can communicate with other members of the species as though they shared a language but can't speak other languages while the spell persists\.$/,
    /^Casting [a-z ]+ counts as setting up a disguise for the purpose of the (?:@UUID\[[^\]]+\]\{Impersonate\}|Impersonate) action\.$/,
    /^You can Dismiss (?:this|the) spell\.$/,
    /^If the spell succeeds at the counteract check, it removes the [a-z]+ effect from your ally, though not from any other creatures the effect might be affecting\.$/,
    /^Although your eidolon looks like you, it doesn't gain any new abilities, and its statistics don't change in any way[-–—]the transformation is purely cosmetic\.$/,
    /^Your eidolon can still use gear only if it has the eidolon trait, which allows eidolons to use it\.$/,
    /^If necessary, any such eidolon items the eidolon was wearing remain active but change size and shape to reflect what you're wearing\.$/,
    /^You can Dismiss the spell to return your eidolon to their original form\.$/,
    /^You reload their weapon with a piece of mundane ammunition from the triggering creature's inventory\.$/,
    /^Even if you aren't (?:@UUID\[[^\]]+\]\{Searching\}|Searching), you get a check to find haunts and spirits in the area\.$/,
    // (Which hands are free is the table's.)
    /^The target can Climb with a hand occupied \(or two hands occupied if they have the (?:@UUID\[[^\]]+\]\{Combat Climber\}|Combat Climber) feat\)\.$/
];
const NARRATION = [new RegExp(String.raw`^Your gaze pierces through illusions and finds ${CONDITION("Invisible")} creatures and spirits\.$`),
    /^You make a quick gesture, tracing the link between yourself and your eidolon and drawing on your connection to slowly strengthen your shared life force\.$/,
    /^You get an ally out of danger with a teleporting pull\.$/,
    /^You open your mind to the metaphysical, enabling you to sense nearby spirits\.$/,
    /^You focus your gaze on a creature and gain a flash of divine insight into its nature\.$/,
    /^No one understands you more than your eidolon and vice versa\.$/,
    /^You make the target easier to open\.$/,
    /^The target weapon becomes wreathed in a glowing flame\.$/,
    /^With a quick gesture, you reload your ally's weapon, allowing them to focus on fighting the enemy\.$/,
    /^You shroud the target in a powerful predatory aura and amplify its vocalizations\.$/,
    /^You use your knowledge of nature to pass the target off as a common animal of the same size, representing a species chosen when the spell is cast\.$/,
    /^You levitate the touched shield and send it to orbit around a creature\.$/,
    /^The target grows a prehensile tail, or gains prehensile qualities in their existing tail, to help them climb with ease\.$/];

// A list of benefits the caster chooses from (Thermal Remedy): "Choose one of the benefits listed below." / "Any creature that consumes the
// targeted drink or food gains that benefit." / "Up to 10 creatures can partake in the meal, and a creature gets no extra benefit for consuming
// more than one portion." and the items "Gain 5 temporary Hit Points." / "Gain resistance 2 to fire." / "Gain a +1 circumstance bonus to saves
// against disease.", with entries "Heightened (4th) Your remedy provides two benefits of your choice instead of one. The temporary Hit Points
// increase to 10, the resistance to fire increases to 3, the bonus against disease increases to +2, and the duration is 2 hours." and
// "Heightened (7th) The remedy provides all three benefits. …". PF2e's Effect must be exactly: a ChoiceSet of the benefits below the all-benefits
// rank, a second one (excluding the first pick) from the two-benefits rank, and one rule per benefit predicated on its choice or that rank, whose
// value at each rank is the text's.
const BENEFIT_ITEMS = [
    { pattern: /^Gain (\d+) temporary Hit Points\.$/, noun: () => "temporary Hit Points", rule: rule => rule.key === "TempHP" && Object.keys(rule).every(key => ["key", "predicate", "value"].includes(key)) },
    { pattern: /^Gain resistance (\d+) to ([a-z]+)\.$/, noun: match => `resistance to ${match[2]}`,
        rule: (rule, match) => rule.key === "Resistance" && rule.type === match[2] && Object.keys(rule).every(key => ["key", "predicate", "type", "value"].includes(key)) },
    { pattern: /^Gain a \+(\d) (circumstance|status) bonus to saves against ([a-z]+)\.$/, noun: match => `bonus against ${match[3]}`, extraPredicate: match => [match[3]],
        rule: (rule, match) => rule.key === "FlatModifier" && rule.selector === "saving-throw" && rule.type === match[2]
            && Object.keys(rule).every(key => ["key", "predicate", "selector", "type", "value"].includes(key)) }
];
const NUMBER_WORDS = { one: 1, two: 2, three: 3 };
function proveBenefitChoice(sentences, entries, rules, baseRank) {
    const start = sentences.findIndex(sentence => /^Choose one of the benefits listed below\.$/.test(sentence));
    if (start < 0) return null;
    if (!/^Any creature that consumes the targeted (?:drink or food|food or drink) gains that benefit\.$/.test(sentences[start + 1] ?? "")) return null;
    const limit = /^Up to (\d+) creatures can partake in the meal, and a creature gets no extra benefit for consuming more than one portion\.$/.exec(sentences[start + 2] ?? "");
    if (!limit) return null;
    const items = [];
    for (let at = start + 3; at < sentences.length; at++) {
        const found = BENEFIT_ITEMS.map(entry => ({ entry, match: entry.pattern.exec(sentences[at]) })).find(candidate => candidate.match);
        if (!found) break;
        items.push({ ...found, index: at, noun: found.entry.noun(found.match), values: [{ rank: baseRank, value: Number(found.match[1]) }] });
    }
    if (items.length < 2 || start + 3 + items.length !== sentences.length) return null;
    // The entries: how many benefits from that rank, and each benefit's new value (every benefit named once).
    const picks = [{ rank: baseRank, count: 1 }];
    for (const entry of entries) {
        const text = entry.text.trim();
        const head = /^(?:Your|The) [a-z]+ provides (two|three|all three) benefits(?: of your choice instead of one)?\. (.+)$/.exec(text);
        if (!head || entry.step) return null;
        const clauses = head[2].replace(/\.$/, "").split(/, (?:and )?/);
        const duration = clauses.pop();
        if (!/^the duration is \d+ (?:hours?|minutes?|days?)$/.test(duration) || clauses.length !== items.length) return null;
        for (const item of items) {
            const clause = clauses.find(candidate => candidate.startsWith(`The ${item.noun} `) || candidate.startsWith(`the ${item.noun} `));
            const value = clause ? new RegExp(`^[Tt]he ${item.noun} increases? to \\+?(\\d+)$`).exec(clause) : null;
            if (!value) return null;
            item.values.push({ rank: entry.rank, value: Number(value[1]) });
        }
        const count = head[1].startsWith("all") ? items.length : NUMBER_WORDS[head[1]];
        if (!(count > picks.at(-1).count && entry.rank > picks.at(-1).rank)) return null;
        picks.push({ rank: entry.rank, count });
    }
    // (One pick, then two, then all of them: PF2e's two ChoiceSets.)
    if (picks.length !== 3 || picks[1].count !== 2 || picks[2].count !== items.length) return null;
    const [twoRank, allRank] = [picks[1].rank, picks[2].rank];
    const level = "{item|level}";
    const first = rules.findIndex(rule => rule.key === "ChoiceSet" && JSON.stringify(rule.predicate) === JSON.stringify([{ lt: [level, allRank] }]));
    const option = rules[first]?.rollOption;
    const second = rules.findIndex(rule => rule.key === "ChoiceSet" && rule.rollOption === option && JSON.stringify(rule.predicate) === JSON.stringify([{ gte: [level, twoRank] }, { lt: [level, allRank] }]));
    if (first < 0 || second < 0 || !/^[a-z-]+$/.test(option ?? "") || !rules[first].flag || !rules[second].flag) return null;
    const values = (rules[first].choices ?? []).map(choice => choice.value);
    if (values.length !== items.length || new Set(values).size !== values.length || rules[first].choices.some(choice => choice.predicate)) return null;
    if (JSON.stringify(rules[second].choices.map(choice => [choice.value, choice.predicate])) !== JSON.stringify(values.map(value => [value, [{ not: `${option}:${value}` }]]))) return null;
    const used = [first, second], choices = [];
    for (const item of items) {
        const at = rules.findIndex((rule, index) => !used.includes(index) && item.entry.rule(rule, item.match) && (() => {
            const extra = item.entry.extraPredicate?.(item.match) ?? [];
            const predicate = rule.predicate ?? [];
            if (predicate.length !== extra.length + 1 || JSON.stringify(predicate.slice(0, extra.length)) !== JSON.stringify(extra)) return false;
            const or = predicate.at(-1)?.or;
            const value = /^[a-z-]+:([a-z-]+)$/.exec(or?.[0] ?? "")?.[1];
            return or?.length === 2 && or[0] === `${option}:${value}` && values.includes(value) && JSON.stringify(or[1]) === JSON.stringify({ gte: [level, allRank] });
        })() && Array.from({ length: 11 - baseRank }, (_, offset) => baseRank + offset)
            .every(rank => ruleValueAt(rule.value, rank) === item.values.filter(entry => entry.rank <= rank).at(-1).value));
        if (at < 0) return null;
        used.push(at);
        choices.push({ value: rules[at].predicate.at(-1).or[0].slice(option.length + 1), label: item.noun[0].toUpperCase() + item.noun.slice(1), sentence: item.match[0] });
    }
    if (new Set(choices.map(choice => choice.value)).size !== choices.length) return null;
    return { used, consumed: [start, start + 1, start + 2, ...items.map(item => item.index)], limit: Number(limit[1]),
        benefitChoice: { flags: [rules[first].flag, rules[second].flag], picks, choices } };
}

// A creature's own attack made better (Clawsong): "The target's claw attack gains the versatile (piercing) trait, and deals 1d6 slashing damage."
// / "If the target's claw attack already deals 1d6 slashing damage, it deals 1d8 instead." / "If its claw attack already had the versatile
// (piercing) trait, it gains the deadly 1d8 trait." PF2e's Effect must be its two trait rules (the deadly one read before the versatile one is
// added) and a die upgrade on that attack's damage. PF2e's upgrade raises any die up to d6 one step and keeps the damage type; the text sets
// the attack to 1d6 slashing unless it already is (then 1d8): the module replaces the upgrade with the recipient's own rules (strikeUpgrade).
const LETTERS = { piercing: "p", slashing: "s", bludgeoning: "b" };
function proveStrikeUpgrade(sentences, rules) {
    const start = sentences.findIndex(sentence => /^The target's [a-z]+ attack gains the versatile \([a-z]+\) trait, and deals \d+d\d+ [a-z]+ damage\.$/.test(sentence));
    if (start < 0) return null;
    const first = /^The target's ([a-z]+) attack gains the versatile \((piercing|slashing|bludgeoning)\) trait, and deals (\d+)d(\d+) ([a-z]+) damage\.$/.exec(sentences[start]);
    const second = /^If the target's ([a-z]+) attack already deals (\d+)d(\d+) ([a-z]+) damage, it deals \2d(\d+) instead\.$/.exec(sentences[start + 1] ?? "");
    const third = /^If its ([a-z]+) attack already had the versatile \((piercing|slashing|bludgeoning)\) trait, it gains the deadly d?1?d(\d+) trait\.$/.exec(sentences[start + 2] ?? "");
    if (!first || !second || !third || second[1] !== first[1] || third[1] !== first[1] || third[2] !== first[2]) return null;
    if (second[2] !== first[3] || second[3] !== first[4] || second[4] !== first[5] || Number(second[5]) <= Number(first[4])) return null;
    const [name, versatile] = [first[1], `versatile-${LETTERS[first[2]]}`];
    const base = `item:base:${name}`, selector = `${name}-damage`;
    const added = rules.findIndex(rule => rule.key === "AdjustStrike" && rule.mode === "add" && rule.property === "weapon-traits" && rule.value === versatile
        && JSON.stringify(rule.definition) === JSON.stringify([base]));
    const deadly = rules.findIndex(rule => rule.key === "AdjustStrike" && rule.mode === "add" && rule.property === "weapon-traits" && rule.value === `deadly-d${third[3]}`
        && JSON.stringify(rule.definition) === JSON.stringify([base, `item:trait:${versatile}`]) && Number(rule.priority) < Number(rules[added]?.priority));
    const upgrade = rules.findIndex(rule => rule.key === "DamageAlteration" && rule.property === "dice-faces" && rule.mode === "upgrade" && JSON.stringify(rule.selectors) === JSON.stringify([selector]));
    if (added < 0 || deadly < 0 || upgrade < 0) return null;
    // (PF2e's item alterations see each other's changes, so the die can't be a fixed predicate: the runtime writes each of the recipient's such
    // weapons its own rules, read when cast — type, dice and the die the text gives it — before the versatile trait is checked.)
    return { used: [added, deadly, upgrade], consumed: [start, start + 1, start + 2], strike: name,
        overrides: [{ index: upgrade, key: "DamageAlteration", remove: true }],
        strikeUpgrade: { strike: name, type: first[5], dice: Number(first[3]), faces: Number(first[4]), alreadyFaces: Number(second[5]) } };
}
// "Heightened (4th) The spell can affect up to 6 willing creatures with unarmed claw Strikes.": the runtime's target limit from that rank.
const AFFECT_UP_TO = /^The spell can affect up to (\d+) willing creatures with unarmed ([a-z]+) Strikes\.$/;

/** {claims, notes} when every sentence is proved or a note and every Effect rule is claimed; null otherwise. */
export function proveEffectNote(adapted, effectNote, document) {
    const rules = document?.mechanics?.rules ?? [];
    if (!rules.length) return null;
    // (A reaction's Trigger paragraph is its own section.)
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    // (So is an Area paragraph naming a shape the GM draws: Safe Passage's "10-foot-wide, 10-foot-tall, 60-foot-long section of terrain".)
    const body = /^\s*<p>\s*<strong>\s*Trigger\s*<\/strong>[^<]*<\/p>\s*(?:<p>\s*<strong>\s*Requirements\s*<\/strong>[^<]*<\/p>\s*)?$/.test(sections[0] ?? "")
        || /^\s*<p>\s*<strong>\s*Area\s*<\/strong>[^<]*<\/p>\s*$/.test(sections[0] ?? "") ? sections[1] ?? "" : sections[0];
    // The heightened step a scaled sentence's rule must follow.
    const healResist = entry => { const match = STEP_HEAL_RESIST.exec(entry.text.trim());
        return match && effectNote.selfHeal && Number(match[1]) === effectNote.selfHeal.perRank * entry.step ? [entry.text.trim(), "resistance", match[3]] : null; };
    const steps = (effectNote.heightened ?? []).filter(entry => entry.step).map(entry => ({ ...entry, found: STEP.exec(entry.text.trim()) ?? STEP_MORE.exec(entry.text.trim()) ?? healResist(entry),
        dice: STEP_DICE.exec(entry.text.trim()) }))
        .map(entry => entry.found || !entry.dice ? entry : { ...entry, found: [entry.text.trim(), "dice"] })
        // (Fire Shield's three steps in one entry: the resistance, the shield's HP, and the Shield Block damage the note carries.)
        .flatMap(entry => { const shield = !entry.found ? STEP_SHIELD.exec(entry.text.trim()) : null;
            return shield ? [{ ...entry, found: [entry.text.trim(), "resistance", shield[2]], shieldDamage: { type: shield[4], dice: Number(shield[5]), faces: Number(shield[6]) } },
                { ...entry, found: [entry.text.trim(), "shield hp", shield[3]] }] : [entry]; });
    if (steps.some(entry => !entry.found)) return null;
    const stepFor = noun => {
        const entry = steps.find(candidate => (candidate.found[1] ?? candidate.found[3]) === noun);
        if (!entry) return null;
        // ("to a maximum of a +4 status bonus for an 8th-rank spell": the cap, reached at that rank.)
        return { amount: Number(entry.found[2] ?? entry.found[4]), interval: entry.step, baseRank: Number(adapted.rank), ...(entry.found[5] ? { max: Number(entry.found[5]), maxRank: Number(entry.found[6]) } : {}) };
    };
    // (A sentence may end inside its closing quotation mark: "… the password to enter the guild house.")
    // (A list's items are sentences of their own, even one opening with a number: Apex Companion's "30 temporary Hit Points.")
    const sentences = htmlToPlainText(body.replace(/@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/g, "").replace(/<\/li>\s*<li>/g, "</li> § <li>")).replace(/\s+/g, " ").trim()
        .split(/(?<=[.!?]["”]?)\s+(?=[A-Z@])|\s*§\s*/).map(sentence => sentence.trim()).filter(Boolean);
    const used = new Set(), claims = [], notes = [];
    // A chosen benefit (Thermal Remedy): the list, its entries and PF2e's ChoiceSets together.
    const benefit = proveBenefitChoice(sentences, (effectNote.heightened ?? []).filter(entry => !entry.step), rules, Number(adapted.rank));
    if (benefit) {
        benefit.used.forEach(index => used.add(index));
        claims.push({ sentence: benefit.consumed.map(index => sentences[index]).join(" "), rules: benefit.used, recipient: { actor: "target", limit: benefit.limit } });
    }
    // A creature's own attack made better (Clawsong): its three sentences and PF2e's rules together.
    const strike = benefit ? null : proveStrikeUpgrade(sentences, rules);
    if (strike) {
        strike.used.forEach(index => used.add(index));
        claims.push({ sentence: strike.consumed.map(index => sentences[index]).join(" "), rules: strike.used, recipient: { actor: "target", strike: strike.strike },
            overrides: strike.overrides, strikeUpgrade: strike.strikeUpgrade });
    }
    const group = benefit ?? strike;
    // (Leading narration: a run of rule-free sentences from the start, like Domora's Defense's story.)
    let narrated = 0;
    for (const [index, sentence] of sentences.entries()) {
        if (group?.consumed.includes(index)) continue;
        const reader = READERS.map(entry => ({ entry, match: entry.pattern.exec(sentence) })).find(found => found.match);
        // A sentence claiming several rules (or none: what the module does itself — a reveal, an immunity).
        if (reader?.entry.rules) {
            // (A scaled multi-rule sentence gets the heightened step its scaled rule must follow.)
            const multiStep = reader.entry.scaled ? stepFor(reader.entry.scaled) : null;
            const indices = reader.entry.rules(rules, reader.match, multiStep ?? { baseRank: Number(adapted.rank) });
            if (!indices || indices.some(index => used.has(index))) { if (globalThis.process?.env?.PROOF_DEBUG) console.error("rules not proved for:", sentence, JSON.stringify(indices)); return null; }
            indices.forEach(index => used.add(index));
            if (reader.entry.note) notes.push(reader.entry.note(reader.match));
            claims.push({ sentence, rules: indices, ...(multiStep ? { step: multiStep } : {}), ...(reader.entry.bonusValue ? { bonusValue: true } : {}), ...(reader.entry.endsAfterAttack ? { endsAfterAttack: true } : {}), ...(reader.entry.endsAfterSave ? { endsAfterSave: true } : {}),
                ...(reader.entry.extra ? { extra: reader.entry.extra(rules, indices) } : {}), ...(reader.entry.recipient ? { recipient: reader.entry.recipient } : {}), ...(reader.entry.reveal ? { reveal: reader.entry.reveal } : {}),
                ...(reader.entry.additions ? { additions: reader.entry.additions(rules) } : {}),
                ...(reader.entry.castCheck ? { castCheck: reader.entry.castCheck(reader.match) } : {}), ...(reader.entry.counteract ? { counteract: { ...reader.entry.counteract(reader.match), text: sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") } } : {}),
                ...(reader.entry.immunity ? { immunity: { value: Number(reader.match[1]), unit: `${reader.match[2]}s` } } : {}) });
            continue;
        }
        // A sentence stating a rule another sentence already claimed (Spirit Sense's AC and saves).
        if (reader?.entry.shared) {
            if (!rules.some(rule => reader.entry.rule(rule, reader.match))) return null;
            claims.push({ sentence, shared: true });
            continue;
        }
        if (reader) {
            const step = reader.entry.scaled ? stepFor(reader.entry.scaled) : null;
            const at = rules.findIndex((rule, ruleIndex) => !used.has(ruleIndex) && reader.entry.rule(rule, reader.match, step ?? { baseRank: Number(adapted.rank) }));
            if (at < 0) return null;
            if (reader.entry.note) notes.push(reader.entry.note(reader.match));
            used.add(at); claims.push({ sentence, rule: at, ...(reader.entry.endsAfterDamage ? { endsAfterDamage: true } : {}), ...(reader.entry.endsAfterSave ? { endsAfterSave: true } : {}),
                ...(reader.entry.endsAfterAttack ? { endsAfterAttack: true } : {}), ...(step ? { step } : {}),
                ...(reader.entry.override && reader.entry.override(rules[at], reader.match, step ?? { baseRank: Number(adapted.rank) })
                    ? { override: { index: at, ...reader.entry.override(rules[at], reader.match, step ?? { baseRank: Number(adapted.rank) }) } } : {}),
                ...(reader.entry.recipient ? { recipient: reader.entry.recipient } : {}), ...(reader.entry.additions ? { additions: reader.entry.additions(rules[at]) } : {}) });
            continue;
        }
        if (NOTES.some(pattern => pattern.test(sentence))) { notes.push(sentence); continue; }
        if (index === 0 && NARRATION.some(pattern => pattern.test(sentence))) { narrated = 1; continue; }
        // (An opening sentence with no rule words is narration: "You call forth a repelling field.")
        if ((index <= 2 || index === narrated) && !/\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|immunity|resistance|weakness|Hit Points|Sustain|can|can't|cannot|must|each|until|gains?|becomes?|AC|Speeds?|checks?|attacks? rolls?|DC)\b/i.test(sentence)
            && !/\b(?:blinded|clumsy|concealed|confused|controlled|dazzled|deafened|drained|enfeebled|fascinated|fatigued|fleeing|frightened|grabbed|hidden|immobilized|invisible|off-guard|paralyzed|prone|quickened|restrained|sickened|slowed|stunned|stupefied|unconscious)\b/i.test(sentence)) { if (index === narrated) narrated += 1; continue; }
        // (Before a chosen benefit's list: an opening sentence stating no rule.)
        if (index === 0 && group && !/\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|resistance|Hit Points|Sustain|can't|must|each|until|gains?)\b/i.test(sentence)) continue;
        // "Using this innate understanding, you transform your eidolon into your identical twin, allowing them to hide their presence or
        // impersonate you to a limited extent." (what the twin is: the traits and size sentences carry its rules)
        if (index === 1 && /^Using this innate understanding, you transform your eidolon into your identical twin, allowing them to hide their presence or impersonate you to a limited extent\.$/.test(sentence)) continue;
        if (globalThis.process?.env?.PROOF_DEBUG) console.error("unproved sentence:", sentence);
        return null;
    }
    // A fixed-rank entry where PF2e's Effect starts, and later entries that keep the same bonus.
    let effectFromRank = null;
    const fixedRank = (effectNote.heightened ?? []).filter(entry => !entry.step);
    for (const entry of fixedRank) {
        const reader = FROM_RANK.map(candidate => ({ candidate, match: candidate.pattern.exec(entry.text.trim()) })).find(found => found.match);
        if (reader && effectFromRank == null) {
            const indices = reader.candidate.rules(rules, reader.match);
            if (!indices || indices.some(index => used.has(index))) return null;
            indices.forEach(index => used.add(index));
            claims.push({ sentence: entry.text.trim(), rules: indices });
            effectFromRank = entry.rank;
            entry.claimed = true;
        } else if (effectFromRank != null && entry.rank > effectFromRank && KEEPS.some(pattern => pattern.test(entry.text.trim()))) entry.claimed = true;
    }
    // Fixed-rank entries: "The resistances increase to 10." — the claimed Resistance rule must give exactly that at that rank; Wind Jump's "At the end of
    // your turn, you can attempt a @Check[acrobatics|dc:30] check to find purchase in midair. If you succeed, you don't fall." — a note from that rank.
    const resistanceClaim = claims.find(claim => Number.isInteger(claim.rule) && rules[claim.rule]?.key === "Resistance");
    // (Or a Resistance claimed with other rules by one sentence.)
    const resistanceIndex = resistanceClaim ? resistanceClaim.rule : claims.flatMap(claim => claim.rules ?? []).find(index => rules[index]?.key === "Resistance") ?? null;
    // "The status bonus increases to +2.": every claimed status modifier gives exactly that at that rank, and the base value at the spell's rank.
    const bonusClaim = claims.find(claim => claim.bonusValue);
    if (bonusClaim) {
        const base = Number(/\+(\d)/.exec(bonusClaim.sentence)[1]);
        if (!bonusClaim.rules.every(index => ruleValueAt(rules[index].value, Number(adapted.rank)) === base)) return null;
        for (const entry of fixedRank) {
            const up = /^The status bonus increases to \+(\d)\.$/.exec(entry.text.trim());
            if (up && bonusClaim.rules.every(index => ruleValueAt(rules[index].value, entry.rank) === Number(up[1]))) entry.claimed = true;
        }
    }
    // "For the duration, you also gain a status bonus to damage dealt by ignition equal to flaming fusillade's spell rank." (Flaming Fusillade at 9th): PF2e's
    // bonus to that spell's damage, its value the rank, from that rank.
    for (const entry of fixedRank) {
        const named = /^For the duration, you also gain a status bonus to damage dealt by ([a-z ]+) equal to [a-z ]+ ?'s spell rank\.$/.exec(entry.text.trim());
        if (!named) continue;
        const slug = named[1].trim().replace(/\s+/g, "-");
        const at = rules.findIndex((rule, index) => !used.has(index) && rule.key === "FlatModifier" && [rule.selector].flat().join() === "spell-damage" && rule.type === "status" && rule.value === "@item.level"
            && JSON.stringify(rule.predicate) === JSON.stringify([`item:slug:${slug}`, { gte: ["parent:level", entry.rank] }]));
        if (at >= 0) { used.add(at); claims.push({ sentence: entry.text.trim(), rule: at }); entry.claimed = true; }
    }
    // "The regeneration increases to 20." (Regenerate at 9th): the claimed regeneration gives exactly that at that rank.
    for (const entry of fixedRank) {
        const up = /^The regeneration increases to (\d+)\.$/.exec(entry.text.trim());
        const at = up ? claims.flatMap(claim => Number.isInteger(claim.rule) ? [claim.rule] : []).find(index => rules[index]?.key === "FastHealing" && rules[index].type === "regeneration") : null;
        if (at != null && ruleValueAt(rules[at].value, entry.rank) === Number(up[1])) entry.claimed = true;
    }
    // "The temporary Hit Points increase to 18, and the status bonus to Will saves increases to +3." (Zealous Conviction): the claimed TempHP and save bonus give
    // exactly those at that rank.
    for (const entry of fixedRank) {
        const both = /^The temporary Hit Points increase to (\d+), and the status bonus to (Fortitude|Reflex|Will) saves increases to \+(\d)\.$/.exec(entry.text.trim());
        if (!both) continue;
        const claimed = claims.flatMap(claim => claim.rules ?? (Number.isInteger(claim.rule) ? [claim.rule] : []));
        const temp = claimed.find(index => rules[index]?.key === "TempHP"), bonus = claimed.find(index => rules[index]?.key === "FlatModifier" && [rules[index].selector].flat().join() === both[2].toLowerCase());
        if (temp != null && bonus != null && ruleValueAt(rules[temp].value, entry.rank) === Number(both[1]) && ruleValueAt(rules[bonus].value, entry.rank) === Number(both[3])) entry.claimed = true;
    }
    for (const entry of fixedRank) {
        // (Safe Passage: "The granted resistance increases to 10, and the area can be 120 feet long." — the GM draws the longer area.)
        const up = /^The (?:granted )?resistances? increases? to (\d+)(?:, and the area can be \d+ feet long)?\.$/.exec(entry.text.trim());
        if (up && resistanceIndex != null && ruleValueAt(rules[resistanceIndex].value, entry.rank) === Number(up[1])) entry.claimed = true;
        const midair = /^At the end of your turn, you can attempt a @Check\[acrobatics\|dc:(\d+)\] check to find purchase in midair\. If you succeed, you don't fall\.$/.exec(entry.text.trim());
        if (midair) { entry.claimed = true; notes.push(`From rank ${entry.rank}: at the end of your turn, you can attempt a DC ${midair[1]} Acrobatics check to find purchase in midair; if you succeed, you don't fall.`); }
    }
    // "Heightened (4th) If you have the Shield Block reaction, you can use your reaction to have the target shield use Shield Block when the target
    // creature would take damage from a physical attack, …": from that rank, the card's Shield Block (the shield's Hardness for the target).
    let shieldBlockFromRank = null;
    for (const entry of fixedRank) {
        if (!claims.some(claim => claim.extra?.shieldChoice)) break;
        if (/^If you have the Shield Block reaction, you can use your reaction to have the target shield use Shield Block when the target creature would take damage from a physical attack, in addition to the usual trigger\. In this case, Shield Block protects the target creature, rather than you\. Since the shield is using Shield Block and not you, additional effects or abilities that normally apply when you Shield Block don't apply\.$/.test(entry.text.trim())) {
            shieldBlockFromRank = entry.rank; entry.claimed = true;
        }
    }
    // Runic Impression's "Heightened (8th) Add keen to the list of runes you can choose as well as the greater versions of Corrosive, …": the rune
    // choice offers exactly those from that rank (PF2e's predicate on the caster's level, which is at least twice the rank minus one).
    const runeClaim = claims.find(claim => (claim.rules ?? []).some(index => rules[index]?.key === "ChoiceSet" && Array.isArray(rules[index].choices) && rules[index].choices.some(choice => choice.value === "keen")));
    for (const entry of fixedRank) {
        const more = /^Add keen to the list of runes you can choose as well as the greater versions of (.+)\.$/.exec(entry.text.trim());
        if (!more || !runeClaim) continue;
        const choice = rules[runeClaim.rules.find(index => rules[index]?.key === "ChoiceSet" && rules[index].choices?.some?.(item => item.value === "keen"))];
        const names = /\{/.test(more[1]) ? [...more[1].matchAll(/\{([^}]+)\}/g)].map(found => found[1]) : more[1].split(/,\s*(?:and\s+)?|\s+and\s+/).map(name => name.trim()).filter(Boolean);
        const added = ["keen", ...names.map(name => `greater-${name.toLowerCase().replace(/\s+/g, "-")}`)];
        const gated = choice.choices.filter(item => (item.predicate ?? []).length);
        if (gated.length === added.length && added.every(slug => gated.some(item => item.value === slug && JSON.stringify(item.predicate) === `[{"gte":["parent:level",${entry.rank}]}]`))) entry.claimed = true;
    }
    // "Heightened (4th) The spell can affect up to 6 willing creatures with unarmed claw Strikes."
    const targetsByRank = [];
    for (const entry of fixedRank) {
        const affect = AFFECT_UP_TO.exec(entry.text.trim());
        if (affect && strike && affect[2] === strike.strike) { targetsByRank.push({ rank: entry.rank, limit: Number(affect[1]) }); entry.claimed = true; }
    }
    // "Heightened (5th) The spell's duration increases to 1 hour, and you can target both yourself and your animal companion with a single
    // casting.": from that rank, both recipients (the duration is the note's parser).
    const both = fixedRank.find(entry => /^The spell's duration increases to \d+ (?:minutes?|hours?), and you can target both yourself and your animal companion with a single casting\.$/.test(entry.text.trim()));
    const bothFromRank = both ? both.rank : null;
    // Fire Shield's Shield Block damage: the note's roll at the cast rank (the Effect's level), stepping as the heightened entry says.
    const blockDamage = claims.map(claim => /^If you Shield Block a melee attack that is either an unarmed attack or made by an adjacent attacker, the attacker takes (\d+)d(\d+) ([a-z]+) damage\.$/.exec(claim.sentence)).find(Boolean);
    if (blockDamage) {
        const step = steps.find(entry => entry.shieldDamage);
        if (step && (step.shieldDamage.faces !== Number(blockDamage[2]) || step.shieldDamage.type !== blockDamage[3])) return null;
        const dice = step ? `(${blockDamage[1]}+floor((@item.level-${Number(adapted.rank)})/${step.step})*${step.shieldDamage.dice})` : blockDamage[1];
        notes.push(`If you Shield Block a melee attack that is either an unarmed attack or made by an adjacent attacker, the attacker takes @Damage[${dice}d${blockDamage[2]}[${blockDamage[3]}]] damage.`);
    }
    // A dice step the Effect's dice-number upgrade carries.
    for (const entry of steps.filter(candidate => candidate.dice)) {
        const at = rules.findIndex((rule, ruleIndex) => !used.has(ruleIndex) && rule.key === "DamageAlteration" && rule.property === "dice-number" && rule.mode === "upgrade"
            && Array.from({ length: 6 }, (_, index) => Number(adapted.rank) + index).every(rank => ruleValueAt(rule.value, rank + entry.step) - ruleValueAt(rule.value, rank) === Number(entry.dice[1])));
        if (at < 0) return null;
        used.add(at); claims.push({ sentence: entry.text.trim(), rule: at, step: { interval: entry.step, dice: Number(entry.dice[1]) } });
    }
    // A heightened step's extra rule (the roar's dice).
    for (const entry of steps.filter(candidate => candidate.found[7])) {
        const at = rules.findIndex((rule, ruleIndex) => !used.has(ruleIndex) && STEP_EXTRA(rule, entry.found, entry.step));
        if (at < 0) return null;
        used.add(at); claims.push({ sentence: entry.text.trim(), rule: at });
    }
    // Every rule of the Effect is one the text states; a heightened entry is a step a claimed rule follows, a duration (the note's parser), or
    // a larger target count (the runtime's limit).
    if (globalThis.process?.env?.PROOF_DEBUG) console.error("proof end:", used.size, rules.length, JSON.stringify(fixedRank.map(entry => [entry.rank, entry.claimed ?? false, entry.text.slice(0, 50)])), (effectNote.heightenedDurations ?? []).length);
    if (used.size !== rules.length) return null;
    const stepsUsed = new Set(claims.filter(claim => claim.step).map(claim => claim.step.interval));
    const fixedEntries = fixedRank.filter(entry => !entry.claimed && !TARGETS.test(entry.text.trim()));
    if (steps.some(entry => !stepsUsed.has(entry.step)) || fixedEntries.length !== (effectNote.heightenedDurations ?? []).length) return null;
    // Who gets the Effect, when a sentence says it (all such sentences must agree).
    const recipients = [...new Set(claims.filter(claim => claim.recipient).map(claim => JSON.stringify(claim.recipient)))];
    if (recipients.length > 1) return null;
    const additions = claims.flatMap(claim => claim.additions ?? []), reveal = claims.find(claim => claim.reveal)?.reveal, immunity = claims.find(claim => claim.immunity)?.immunity;
    const castCheck = claims.find(claim => claim.castCheck)?.castCheck, counteract = claims.find(claim => claim.counteract)?.counteract;
    return { claims, notes, ...(claims.some(claim => claim.endsAfterDamage) ? { endsAfterDamage: true } : {}),
        ...(claims.some(claim => claim.endsAfterSave) ? { endsAfterSave: true } : {}), ...(claims.some(claim => claim.endsAfterAttack) ? { endsAfterAttack: true } : {}), ...(recipients.length ? { recipient: JSON.parse(recipients[0]) } : {}),
        ...(additions.length ? { ruleAdditions: additions } : {}), ...(reveal ? { reveal } : {}), ...(immunity ? { immunity } : {}),
        ...(castCheck ? { castCheck } : {}), ...(counteract ? { counteract } : {}), ...(effectFromRank != null ? { effectFromRank } : {}),
        ...(benefit ? { benefitChoice: benefit.benefitChoice } : {}),
        ...(claims.some(claim => claim.override || claim.overrides) ? { ruleOverrides: claims.flatMap(claim => claim.overrides ?? (claim.override ? [claim.override] : [])) } : {}),
        ...(targetsByRank.length ? { targetsByRank } : {}),
        ...Object.assign({}, ...claims.map(claim => claim.extra ?? {})),
        ...(shieldBlockFromRank != null ? { shieldBlockFromRank } : {}),
        ...(strike ? { strikeUpgrade: strike.strikeUpgrade } : {}),
        ...(bothFromRank != null ? { bothFromRank } : {}) };
}
