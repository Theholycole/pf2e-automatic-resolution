// Third-party save rows read from their text (2026-10-06): each row's stated modifiers become a generated Effect (a note Effect carrying
// PF2e rules) for the row's own time. The module's own Effect, where the spell links one, is checked against what the text says at that
// degree (user decision 2026-10-06: "Check each one"): the result goes in a data note, and the text's Effect is what the module applies.
//   - Cursed Mark: "The target gains a cursed mark on their body that lasts for 1 round. While the target has the mark on their body, the next
//     saving throw they attempt they must roll twice and take the worse result. After this saving throw, the mark disappears. The target can
//     spend a single Interact action to remove the mark." / "As success, except the mark lasts for 1 minute." / "As failure, except the target
//     must spend at least 2 Interact actions to remove the mark." — PF2e's RollTwice (keep the lower) on its next saving throw, removed after it.
//   - Demand Compliance: "The target takes a -1 status penalty to attack rolls, saves, and skill checks until the beginning of their next turn and
//     the spell immediately ends." / "… as long as the spell is active." / "As failure, except the status penalty is -2." — the penalty on each, and
//     the demand stated before the table (a GM note on the failing rows: the spell ends once it completes the demanded action).
//   - Golden Touch: "The target gains a weakness 4 to bludgeoning and electricity damage. The target takes a –2 circumstance penalty to Stealth
//     checks …" / "As success, but the weakness … is doubled. If the target is a creature, it is Slowed 1. …" / "As failure, but the target becomes
//     Petrified as if made of gold for the duration. …" — the weaknesses at the rank (Heightened (+1) adds 1), the Stealth penalty, and the
//     conditions for the spell's duration; what the text says of an object target is the GM's (a note: the module targets creatures).
import { htmlToPlainText } from "./description-parser.js";

const plain = text => String(text ?? "").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/@Check\[[^\]]*\]\{?([^}]*)\}?/g, "$1").replace(/\s+/g, " ").trim();
const sentences = text => String(text ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
const MINUS = "[–−-]";
const time = (value, unit, sourceText) => ({ mode: "fixed", value: Number(value), unit: `${unit}s`, expiry: unit === "round" ? "turn-start" : null, anchor: "effect-start", offset: 0, sourceText });
// "until the beginning of their next turn": the creature's own next turn start.
const TARGET_NEXT_TURN_START = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "target-turn", offset: 1, sourceText: "until the beginning of their next turn" };

/** The spell's own time for a note, from its duration (fixed, a turn boundary, or the most a sustained spell lasts). */
function spellTime(lifecycle) {
    const spec = lifecycle?.durationSpec;
    if (spec?.mode === "sustained" && spec.maximum?.mode === "fixed")
        return { mode: "fixed", value: spec.maximum.value, unit: spec.maximum.unit, expiry: "turn-start", anchor: "effect-start", offset: 0, sustained: true, sourceText: spec.raw ?? "sustained" };
    if (["fixed", "turn-boundary"].includes(spec?.mode) && Number.isInteger(spec.value) && spec.unit)
        return { mode: "fixed", value: spec.value, unit: spec.unit, expiry: spec.expiry ?? "turn-start", anchor: spec.anchor ?? "effect-start", offset: spec.offset ?? 0, sourceText: spec.raw ?? "the spell's duration" };
    return null;
}

const CURSED_MARK = {
    success: /^The target gains an? ([a-z]+ )?mark on (?:their|its) body that lasts for (\d+) (round|minute)s?\. While the target has the mark on (?:their|its) body, the next saving throw (?:they|it) attempts? (?:they|it) must roll twice and take the worse result\. After this saving throw, the mark disappears\. The target can spend a single Interact action to remove the mark\.$/,
    failure: /^As success, except the mark lasts for (\d+) (round|minute|hour)s?\.$/,
    criticalFailure: /^As failure, except the target must spend at least (\d) Interact actions to remove the mark\.$/
};

function cursedMark(row) {
    const success = CURSED_MARK.success.exec(row("success")), failure = CURSED_MARK.failure.exec(row("failure")), critical = CURSED_MARK.criticalFailure.exec(row("criticalFailure"));
    if (!success || !failure || !critical || !/^The target is unaffected\.$/.test(row("criticalSuccess"))) return null;
    const rules = [{ key: "RollTwice", selector: "saving-throw", keep: "lower", removeAfterRoll: true }];
    const text = actions => `Its next saving throw is rolled twice, keeping the worse result; the mark (this Effect) then disappears. It can remove the mark with ${actions === 1 ? "a single Interact action" : `${actions} Interact actions`} (remove this Effect).`;
    const note = (degree, actions, duration) => ({ label: "Cursed mark", text: text(actions), sourceText: row(degree), claimsRow: true, statedRules: true, rules: rules.map(rule => ({ ...rule })), duration });
    return {
        notes: {
            success: [note("success", 1, time(success[2], success[3], `lasts for ${success[2]} ${success[3]}`))],
            failure: [note("failure", 1, time(failure[1], failure[2], `lasts for ${failure[1]} ${failure[2]}`))],
            criticalFailure: [note("criticalFailure", Number(critical[1]), time(failure[1], failure[2], `lasts for ${failure[1]} ${failure[2]}`))]
        },
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

const DEMAND = {
    success: new RegExp(String.raw`^The target takes a ${MINUS}([1-4]) (status|circumstance) penalty to attack rolls, saves, and skill checks until the beginning of their next turn and the spell immediately ends\.$`),
    failure: new RegExp(String.raw`^The target takes a ${MINUS}([1-4]) (status|circumstance) penalty to attack rolls, saves, and skill checks as long as the spell is active\.$`),
    criticalFailure: new RegExp(String.raw`^As failure, except the (status|circumstance) penalty is ${MINUS}([1-4])\.$`),
    // The demand before the table.
    lead: [/^You shout a demand at the target and gesture in tandem\.$/,
        /^You can give a demand to the target to spend a single action to (approach you, run away \(as if it had the Fleeing condition\), release what it's holding, pick up an item, drop prone, or stand in place)\.$/,
        /^The effect lasts as long as the spell remains active or until the target completes the designated action, after which the spell immediately ends\.$/]
};

function demandCompliance(row, preamble, lifecycle) {
    const success = DEMAND.success.exec(row("success")), failure = DEMAND.failure.exec(row("failure")), critical = DEMAND.criticalFailure.exec(row("criticalFailure"));
    const rawLead = sentences(preamble), lead = rawLead.map(plain);
    const spell = spellTime(lifecycle);
    if (!success || !failure || !critical || critical[1] !== failure[2] || !spell || !/^The target is unaffected\.$/.test(row("criticalSuccess"))
        || lead.length !== DEMAND.lead.length || !lead.every((sentence, index) => DEMAND.lead[index].test(sentence))) return null;
    const choices = DEMAND.lead[1].exec(lead[1])[1];
    const penalty = (value, type) => ["attack-roll", "saving-throw", "skill-check"].map(selector => ({ key: "FlatModifier", selector, type, value: -Number(value) }));
    const penaltyNote = (degree, value, type, duration) => ({ label: "Demand Compliance penalty", text: `A –${value} ${type} penalty to attack rolls, saves and skill checks.`,
        sourceText: row(degree), claimsRow: true, rules: penalty(value, type), duration });
    const demand = degree => ({ label: "Demand", text: `On its turn it spends a single action to do what the caster demanded: ${choices}. Once it completes that action, the spell ends (remove the spell's Effects).`,
        sourceText: lead.slice(1).join(" "), sourceTexts: lead.slice(1), gmPlays: true, duration: { ...spell } });
    return {
        notes: {
            success: [penaltyNote("success", success[1], success[2], { ...TARGET_NEXT_TURN_START })],
            failure: [penaltyNote("failure", failure[1], failure[2], { ...spell }), demand("failure")],
            criticalFailure: [penaltyNote("criticalFailure", critical[2], failure[2], { ...spell }), demand("criticalFailure")]
        },
        preambleClaims: rawLead,
        // (A success ends the spell at once: no demand.)
        interpretation: "Demand Compliance's demand holds only on a failure or critical failure: a success ends the spell immediately.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

const GOLDEN = {
    success: [/^The target transmutes partially into gold\.$/, /^The target gains a weakness (\d+) to (bludgeoning) and (electricity) damage\.$/,
        new RegExp(String.raw`^The target takes a ${MINUS}([1-4]) (circumstance|status) penalty to (Stealth) checks or applies this penalty to any creature holding it if it was an item\.$`)],
    failure: [/^The transmutation is more powerful\.$/, /^As success, but the weakness to bludgeoning and electricity is doubled\.$/, /^If the target is a creature, it is @UUID\[Compendium\.pf2e\.conditionitems\.Item\.xYTAsEpcJE1Ccni3\]\{Slowed 1\}\.$/,
        new RegExp(String.raw`^If the target is an object, it grants a ${MINUS}[1-4] circumstance penalty to checks or DCs made with the object if it is not already made of gold\.$`)],
    criticalFailure: [/^As failure, but the target becomes @UUID\[Compendium\.pf2e\.conditionitems\.Item\.dTwPJuKgBQCMxixg\]\{Petrified\} as if made of gold for the duration\.$/,
        /^If the target was an object, it is treated as having the @UUID\[Compendium\.pf2e\.conditionitems\.Item\.6dNUvdb1dhToNDj3\]\{Broken\} condition if it is not already made of gold\.$/],
    heightened: /^Heightened \(\+1\) The weakness to bludgeoning and electricity on success increases by 1\.$/,
    lead: /^The target must make a (Fortitude) save; If the target is an object held by a creature, the creature makes the Fortitude save\.$/
};

function goldenTouch(row, preamble, heightenedText, { rank, baseRank, lifecycle, outcomes }) {
    const read = degree => { const parts = sentences(row(degree)); return parts.length === GOLDEN[degree].length && parts.every((part, index) => GOLDEN[degree][index].test(part)) ? parts : null; };
    const success = read("success"), failure = read("failure"), critical = read("criticalFailure");
    const rawLead = sentences(preamble), lead = rawLead.map(plain), spell = spellTime(lifecycle);
    const leadSave = lead.findIndex(sentence => GOLDEN.lead.test(sentence));
    if (!success || !failure || !critical || !spell || leadSave < 0 || !GOLDEN.heightened.test(heightenedText.trim()) || !/^The target is unaffected\.$/.test(row("criticalSuccess"))) return null;
    const conditions = degree => (outcomes[degree]?.effects ?? []).map(effect => effect.slug).sort().join(",");
    if (conditions("failure") !== "slowed" || conditions("criticalFailure") !== "broken,petrified,slowed") return null;
    const weakness = GOLDEN.success[1].exec(success[1]), penalty = GOLDEN.success[2].exec(success[2]);
    // (The stated number is the spell's at its lowest rank; Heightened (+1) adds 1 per rank: the cast rank, plus or minus the difference.)
    const shift = Number(weakness[1]) - Number(baseRank);
    const level = shift ? `(@item.level${shift > 0 ? "+" : "-"}${Math.abs(shift)})` : "@item.level";
    const rules = double => [{ key: "Weakness", type: [weakness[2], weakness[3]], value: double ? `${level}*2` : level },
        { key: "FlatModifier", selector: penalty[3].toLowerCase(), type: penalty[2], value: -Number(penalty[1]) }];
    const objectText = "If the target is an object (the module targets creatures; the GM's): a creature holding it takes the –2 circumstance penalty to Stealth checks";
    const note = (degree, double, extra) => ({ label: "Golden touch", text: `Weakness ${double ? "twice the spell's rank" : "equal to the spell's rank"} to bludgeoning and electricity; a –${penalty[1]} ${penalty[2]} penalty to Stealth checks.${extra}`,
        sourceText: row(degree), claimsRow: true, statedRules: true, rules: rules(double), duration: { ...spell } });
    return {
        notes: {
            success: [note("success", false, ` ${objectText}.`)],
            failure: [note("failure", true, ` ${objectText}, and checks or DCs made with the object take a –2 circumstance penalty unless it's already made of gold.`)],
            criticalFailure: [note("criticalFailure", true, ` ${objectText}, checks or DCs made with it take a –2 circumstance penalty, and it's treated as Broken unless it's already made of gold.`)]
        },
        // The object's Broken is the note's; Slowed and Petrified last the spell.
        dropConditions: { criticalFailure: ["broken"] },
        conditionDuration: { ...spell },
        preambleClaims: [rawLead[leadSave]],
        interpretation: "Golden Touch on an object: the module applies the rows to creatures; what they say of an object (its holder's Stealth penalty, checks with it, Broken) is a note for the GM.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Dynamic Daze's one-action version: "The target is Off-Guard against the next attack you attempt against it before the end of your current turn." (the
// failing rows) — a –2 circumstance penalty to AC against the caster's attacks only (PF2e's off-guard slug), until the caster's turn ends or its next
// attack against the creature (note-watchers.js removes it after that roll).
const NEXT_ATTACK = /^The target is @UUID\[Compendium\.pf2e\.conditionitems\.Item\.AJh5ex99aV6VTggg\]\{Off-Guard\} against the next attack you attempt against it before the end of your current turn\.$/;
function nextAttackOffGuard(row) {
    if (!NEXT_ATTACK.test(row("failure")) || row("criticalFailure") !== row("failure") || !/^The target is unaffected\.$/.test(row("success")) || !/^The target is unaffected\.$/.test(row("criticalSuccess"))) return null;
    const note = degree => ({ label: "Off-guard to the caster's next attack", text: "Off-guard against the caster's next attack before the end of the caster's turn.", sourceText: row(degree), claimsRow: true,
        rules: [{ key: "FlatModifier", selector: "ac", type: "circumstance", slug: "off-guard", value: -2, predicate: ["origin:signature:{caster-signature}"] }],
        consumedBySourceAttack: true, duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "source-turn", offset: 0, sourceText: "before the end of your current turn" } });
    return { notes: { success: [], failure: [note("failure")], criticalFailure: [note("criticalFailure")] }, dropConditions: { failure: ["off-guard"], criticalFailure: ["off-guard"] },
        interpretation: "Dynamic Daze's one-action version: off-guard against the caster only, removed after the caster's next attack roll against the creature or as the caster's turn ends.",
        evidence: ["failure", "criticalFailure"].map(row) };
}

// Old-Mage's Echo (Magic+): "The next time the target Casts a Spell during the duration of this effect, they take mental damage equal to twice that spell's
// rank." / "For the duration of this spell, whenever the target attempts to Cast a Spell, they take mental damage equal to twice that spell's rank." / "As
// failure, except the target is also Deafened until the beginning of their next turn whenever the target attempts to Cast a Spell and the flat check from
// the deafened condition applies to the spell being cast unless it has the subtle trait." — a note for the spell's duration whose Ongoing control (the GM
// gives the cast spell's rank) deals twice that rank: once on a success, each time otherwise; on a critical failure, Deafened until its next turn starts
// each time (the flat check for every non-subtle spell the note's).
const ECHO = {
    success: /^The next time the target Casts a Spell during the duration of this effect, they take ([a-z]+) damage equal to twice that spell's rank\.$/,
    failure: /^For the duration of this spell, whenever the target attempts to Cast a Spell, they take ([a-z]+) damage equal to twice that spell's rank\.$/,
    criticalFailure: /^As failure, except the target is also (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)\]\{Deafened\}) until the beginning of their next turn whenever the target attempts to Cast a Spell and the flat check from the deafened condition applies to the spell being cast unless it has the subtle trait\.$/
};
function echoRows(row, { lifecycle, components, baseRank }) {
    const success = ECHO.success.exec(row("success")), failure = ECHO.failure.exec(row("failure")), critical = ECHO.criticalFailure.exec(row("criticalFailure"));
    const spell = spellTime(lifecycle);
    if (!success || !failure || !critical || success[1] !== failure[1] || !spell || !/^The target is unaffected\.$/.test(row("criticalSuccess"))) return null;
    // (PF2e's item gives a placeholder amount; the text's is twice the cast spell's rank.)
    const component = components.length === 1 && !components[0].category && String(components[0].type).toLowerCase() === success[1] ? components[0] : null;
    if (!component) return null;
    const trigger = (frequency, extra = {}) => ({ trigger: "spell-cast-rank", perRank: 2, type: success[1], frequency, endsSpell: frequency === "once", baseRank: Number(baseRank) || 1, componentId: component.id, ...extra });
    const note = (degree, text, triggeredDamage) => ({ label: "Old-Mage's Echo", text, sourceText: row(degree), claimsRow: true, gmPlays: true, duration: { ...spell }, triggeredDamage });
    return {
        notes: {
            success: [note("success", `The next time it Casts a Spell (the caster's Ongoing control, with that spell's rank), it takes ${success[1]} damage equal to twice that rank.`, trigger("once"))],
            failure: [note("failure", `Each time it Casts a Spell (the caster's Ongoing control, with that spell's rank), it takes ${success[1]} damage equal to twice that rank.`, trigger("each"))],
            criticalFailure: [note("criticalFailure", `Each time it Casts a Spell (the caster's Ongoing control, with that spell's rank), it takes ${success[1]} damage equal to twice that rank and is Deafened until the start of its next turn; the deafened flat check applies to that spell unless it's subtle.`,
                trigger("each", { timedCondition: { uuid: `Compendium.pf2e.conditionitems.Item.${critical[2]}`, slug: "deafened", duration: { value: 1, unit: "rounds", expiry: "turn-start" } } }))]
        },
        noDamage: true,
        // (The critical failure's Deafened is each casting's, through the note: not applied now.)
        dropConditions: { criticalFailure: ["deafened"] },
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Silence of the Archmage (Magic+): "The target is Stupefied 1 and unable to speak until they pry themselves free from the magical bindings with an
// Interact action, after which the curse ends." / "As success, except the effect lasts until this curse is removed." / "As failure, except the target
// also has a –2 status penalty to all spell attack rolls and to the DC of all their spells. Whenever they attempt to Cast a Spell, Activate a magic Item,
// or affix a magic talisman to a piece of equipment, they must attempt a DC 11 flat check; on a failure, the action fails and any resources used for it
// are wasted (…)" — a note holding PF2e's Stupefied 1 (and the penalties) until the creature frees itself or the curse is removed; the critical failure's
// flat check rolled as it Casts a Spell (casting-rules-runtime.js), the items and talismans the GM's.
const SILENCE = {
    success: /^The target is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)\]\{Stupefied (\d)\}) and unable to speak until they pry themselves free from the magical bindings with an Interact action, after which the curse ends\.$/,
    failure: /^As success, except the effect lasts until this curse is removed\.$/,
    criticalFailure: /^As failure, except the target also has a [–−-](\d) status penalty to all spell attack rolls and to the DC of all their spells\. Whenever they attempt to Cast a Spell, Activate a magic Item, or affix a magic talisman to a piece of equipment, they must attempt a DC (\d+) flat check; on a failure, the action fails and any resources used for it are wasted \([^)]*\)\.?$/
};
function silenceRows(row) {
    const success = SILENCE.success.exec(row("success")), failure = SILENCE.failure.exec(row("failure")), critical = SILENCE.criticalFailure.exec(row("criticalFailure"));
    if (!success || !failure || !critical || !/^The target is unaffected\.$/.test(row("criticalSuccess"))) return null;
    const stupefied = { key: "GrantItem", uuid: `Compendium.pf2e.conditionitems.Item.${success[2]}`, flag: "conditionStupefied", allowDuplicate: true, onDeleteActions: { grantee: "cascade" },
        alterations: [{ mode: "override", property: "badge-value", value: Number(success[3]) }] };
    const penalty = -Number(critical[1]);
    const unlimited = { mode: "unlimited", sourceText: "until the curse ends" };
    const note = (degree, text, rules, extra = {}) => ({ label: "Silence of the Archmage", text, sourceText: row(degree), claimsRow: true, statedRules: true, rules, duration: { ...unlimited }, ...extra });
    return {
        notes: {
            success: [note("success", `Stupefied ${success[3]} and unable to speak; it can free itself with an Interact action (remove this Effect), ending the curse.`, [{ ...stupefied }])],
            failure: [note("failure", `Stupefied ${success[3]} and unable to speak until the curse is removed (remove this Effect then).`, [{ ...stupefied }])],
            criticalFailure: [note("criticalFailure", `Stupefied ${success[3]} and unable to speak until the curse is removed; a –${critical[1]} status penalty to spell attack rolls and spell DCs; a DC ${critical[2]} flat check whenever it Casts a Spell (the module rolls it), Activates a magic item or affixes a talisman (the GM's): on a failure the action fails and its resources are wasted.`,
                [{ ...stupefied }, { key: "FlatModifier", selector: "spell-attack-roll", type: "status", value: penalty }, { key: "FlatModifier", selector: "spell-dc", type: "status", value: penalty }],
                { castFlatCheck: { dc: Number(critical[2]) } })]
        },
        dropConditions: { success: ["stupefied"], failure: ["stupefied"], criticalFailure: ["stupefied"] },
        interpretation: "Silence of the Archmage: the creature removes the success's Effect when it frees itself with an Interact action; the curse's removal is the GM's. Activating items and affixing talismans under the critical failure's flat check is the GM's.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Lurking Doom (Witches+): "The target takes double damage and if the target attempts a concentrate action, it must succeed at a DC 5 flat check or it is
// lost; roll the check after spending the action, but before any effects are applied." — the row's damage, and a note until the next Sustain's save (the end
// of the caster's next turn) whose flat check casting-rules-runtime.js rolls for its concentrate spells (its other concentrate actions the GM's).
const CONCENTRATE = /^The target takes double damage and if the target attempts a concentrate action, it must succeed at a @Check\[flat\|dc:(\d+)(?:\|[a-z:]+)*\](?:\{[^}]*\})? or it is lost; roll the check after spending the action, but before any effects are applied\.$/;
function concentrateRows(row) {
    const critical = CONCENTRATE.exec(row("criticalFailure"));
    if (!critical || !/^The target takes half damage\.$/.test(row("success")) || !/^The target takes full damage\.$/.test(row("failure"))) return null;
    const dc = Number(critical[1]);
    return {
        notes: { success: [], failure: [], criticalFailure: [{ label: "Hard to concentrate", text: `Each concentrate action it uses needs a DC ${dc} flat check after the action is spent, before its effects; on a failure the action is lost (the module rolls it for its concentrate spells).`,
            sourceText: row("criticalFailure"), claimsRow: true, castFlatCheck: { dc, trait: "concentrate" },
            duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "source-turn", offset: 1, sourceText: "until the next Sustain's save" } }] },
        interpretation: "Lurking Doom's critical failure: the concentrate flat check lasts until the caster's next turn ends (when the next Sustain's save is made); the module rolls it for concentrate spells, the GM for other concentrate actions.",
        evidence: [row("criticalFailure")]
    };
}

// Holding Glyph (Witches+): "The target takes half damage and takes a -1 status penalty against forced movement effects." / "The target takes the full damage
// and takes a -2 status penalty against forced movement effects. In additon, each time the creature takes an action with the move trait, it takes 1 force
// damage." / "As failure, except the target takes double the initial force damage and double the force damage when it uses an action with the move trait."
// with "Heightened (+1) … the force damage on using actions with the move trait increases by 1." — the rows' initial damage (compiled), and a note until the
// next Sustain's save (the end of the caster's next turn): the penalty to its saves (and so their DCs against Shove and the like) while the GM's toggle "against
// forced movement" is on; the move-trait damage the Ongoing control deals when the GM reports such an action.
const GLYPH = {
    success: /^The target takes half damage and takes a [–−-](\d) (status) penalty against forced movement effects\.$/,
    failure: /^The target takes the full damage and takes a [–−-](\d) (status) penalty against forced movement effects\. In addit?i?on, each time the creature takes an action with the move trait, it takes (\d+) ([a-z]+) damage\.$/,
    criticalFailure: /^As failure, except the target takes double the initial ([a-z]+) damage and double the [a-z]+ damage when it uses an action with the move trait\.$/,
    heightened: /The initial [a-z]+ damage increases by \d+d\d+ and the [a-z]+ damage on using actions with the move trait increases by (\d+)\./
};
function glyphRows(row, heightenedText, baseRank) {
    const success = GLYPH.success.exec(row("success")), failure = GLYPH.failure.exec(row("failure")), critical = GLYPH.criticalFailure.exec(row("criticalFailure"));
    const step = GLYPH.heightened.exec(heightenedText);
    if (!success || !failure || !critical || !step || Number(failure[3]) !== 1 || Number(step[1]) !== 1 || !/^The target is unaffected and the spell immediately ends\.$/.test(row("criticalSuccess"))) return null;
    const option = "against-forced-movement";
    const toggle = { key: "RollOption", domain: "saving-throw", option, toggleable: true, label: "Against a forced movement effect (Holding Glyph)" };
    const penalty = value => ({ key: "FlatModifier", selector: "saving-throw", type: "status", value: -Number(value), predicate: [option] });
    const nextSave = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "source-turn", offset: 1, sourceText: "until the next Sustain's save" };
    // (The move-trait damage: the stated 1 at the spell's rank, +1 a rank — the cast rank — doubled on a critical failure.)
    const formula = double => double ? `2*(@item.rank - ${Number(baseRank) - 1})` : `(@item.rank - ${Number(baseRank) - 1})`;
    const moving = double => ({ trigger: "move-action", formula: formula(double), type: failure[4], frequency: "each", endsSpell: false, baseRank: Number(baseRank) || 1 });
    const note = (degree, value, text, triggeredDamage = null) => ({ label: "Holding glyph", text, sourceText: row(degree), claimsRow: true, gmPlays: true, statedRules: true,
        rules: [{ ...toggle }, penalty(value)], duration: { ...nextSave }, ...(triggeredDamage ? { triggeredDamage } : {}) });
    return {
        notes: {
            success: [note("success", success[1], `A –${success[1]} status penalty against forced movement effects (switch on the toggle for such a save or a Shove's or Reposition's DC).`)],
            failure: [note("failure", failure[1], `A –${failure[1]} status penalty against forced movement effects (the toggle); each action it takes with the move trait deals ${failure[3]} ${failure[4]} damage (+1 a rank; the caster's Ongoing control).`, moving(false))],
            criticalFailure: [note("criticalFailure", failure[1], `A –${failure[1]} status penalty against forced movement effects (the toggle); each action it takes with the move trait deals double the ${failure[4]} damage (the caster's Ongoing control).`, moving(true))]
        },
        interpretation: "Holding Glyph: the penalty against forced movement is the GM's toggle on its saves (and their DCs); the move-trait damage the GM reports; both until the next Sustain's save.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Lost in the Crowd (Witches+): "The target cannot tell who is their ally or their enemy. The target is Off-Guard to you and they treat all creatures as enemies
// for the purpose of determining flanking for 1 round. The creature can spend an action to Seek allies making a Perception check against your spell DC, and
// treating them as allies again on a success." / "As failure, except the target is off-guard to your allies in addition to you." — for the round: off-guard
// against the caster's attacks (a critical failure: PF2e's Off-Guard, the caster's allies being everyone else attacking it), and PF2e's "can't flank" with
// its own allies (the module's Effect's rule, checked) until its Seek succeeds (the Ongoing control rolls its Perception against the spell DC, ending that note).
const CROWD = {
    failure: /^The target cannot tell who is their ally or their enemy\. The target is @UUID\[Compendium\.pf2e\.conditionitems\.Item\.AJh5ex99aV6VTggg\]\{Off-Guard\} to you and they treat all creatures as enemies for the purpose of determining flanking for (\d+) rounds?\. The creature can spend an action to @UUID\[[^\]]+\]\{Seek\} allies making a Perception check against your spell DC, and treating them as allies again on a success\.$/,
    criticalFailure: /^As failure, except the target is off-guard to your allies in addition to you\.$/
};
function crowdRows(row) {
    const failure = CROWD.failure.exec(row("failure"));
    if (!failure || !CROWD.criticalFailure.test(row("criticalFailure")) || !/^The target is unaffected\.$/.test(row("success")) || !/^The spell immediately ends\.$/.test(row("criticalSuccess"))) return null;
    const round = { mode: "fixed", value: Number(failure[1]), unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `for ${failure[1]} round` };
    const offGuardToYou = { key: "FlatModifier", selector: "ac", type: "circumstance", slug: "off-guard", value: -2, predicate: ["origin:signature:{caster-signature}"] };
    const offGuard = { key: "GrantItem", uuid: "Compendium.pf2e.conditionitems.Item.AJh5ex99aV6VTggg", flag: "conditionOffGuard", allowDuplicate: true, onDeleteActions: { grantee: "cascade" } };
    const flank = { key: "ActiveEffectLike", mode: "override", path: "system.attributes.flanking.canFlank", value: false };
    const notes = (degree, critical) => [
        { label: "Lost in the crowd", text: critical ? "Off-guard (to the caster and the caster's allies) for the round." : "Off-guard to the caster for the round.", sourceText: row(degree), claimsRow: true, statedRules: true,
            rules: [critical ? { ...offGuard } : { ...offGuardToYou }], duration: { ...round } },
        { label: "Can't tell ally from enemy", text: "It treats all creatures as enemies for flanking (it can't flank with its allies) for the round, until it Seeks its allies: one action, a Perception check against the spell DC (the caster's Ongoing control); a success ends this.",
            sourceText: row("failure"), claimsRow: false, gmPlays: true, flankRule: true, rules: [{ ...flank }], disbelieve: { statistic: "perception", endsSpell: false, needs: "success" }, duration: { ...round } }];
    return {
        notes: { success: [], failure: notes("failure", false), criticalFailure: notes("criticalFailure", true) },
        dropConditions: { failure: ["off-guard"], criticalFailure: ["off-guard"] },
        interpretation: "Lost in the Crowd: a critical failure's off-guard is PF2e's Off-Guard (the caster's allies being the others attacking it); the flanking rule is PF2e's can't-flank for the round, ended by a successful Seek.",
        evidence: ["failure", "criticalFailure"].map(row)
    };
}

// Hemophilia (Magic+): "The target gains weakness 1 to bleed damage." / "As success, except the first time the target takes bleed damage while the spell is active,
// it becomes drained 1 or increases its drained value by 1." / "As failure, except the weakness to bleed damage is doubled." with "Heightened (+1) The weakness
// to bleed damage increases by 1." — a note for the spell's duration holding the weakness (the cast rank's, doubled on a critical failure); on the failing
// rows, the Ongoing control the GM uses the first time it takes bleed damage (drained +1, once).
const HEMO = {
    success: /^The target gains weakness (\d+) to ([a-z]+) damage\.$/,
    failure: /^As success, except the first time the target takes ([a-z]+) damage while the spell is active, it becomes drained 1 or increases its drained value by 1\.$/,
    criticalFailure: /^As failure, except the weakness to ([a-z]+) damage is doubled\.$/,
    heightened: /Heightened \(\+1\) The weakness to ([a-z]+) damage increases by 1\./
};
function hemophiliaRows(row, heightenedText, baseRank, lifecycle) {
    const success = HEMO.success.exec(row("success")), failure = HEMO.failure.exec(row("failure")), critical = HEMO.criticalFailure.exec(row("criticalFailure")), step = HEMO.heightened.exec(heightenedText);
    const spell = spellTime(lifecycle);
    if (!success || !failure || !critical || !step || !spell || ![failure[1], critical[1], step[1]].every(type => type === success[2]) || !/^The target is unaffected\.$/.test(row("criticalSuccess"))) return null;
    const shift = Number(success[1]) - Number(baseRank);
    const level = shift ? `(@item.level${shift > 0 ? "+" : "-"}${Math.abs(shift)})` : "@item.level";
    const weakness = double => ({ key: "Weakness", type: [success[2]], value: double ? `${level}*2` : level });
    const increase = { slug: "drained", maximum: 4, trigger: `took ${success[2]} damage for the first time`, once: true };
    const note = (degree, double, rise) => ({ label: "Hemophilia", text: `Weakness to ${success[2]} damage equal to ${double ? "twice " : ""}the spell's rank.${rise ? ` The first time it takes ${success[2]} damage while the spell lasts, it becomes drained 1 or its drained value increases by 1 (the GM's Ongoing control).` : ""}`,
        sourceText: row(degree), claimsRow: true, statedRules: true, rules: [weakness(double)], duration: { ...spell }, ...(rise ? { triggeredIncrease: { ...increase } } : {}) });
    return {
        notes: { success: [note("success", false, false)], failure: [note("failure", false, true)], criticalFailure: [note("criticalFailure", true, true)] },
        dropConditions: { failure: ["drained"], criticalFailure: ["drained"] },
        interpretation: "Hemophilia: the GM reports the first bleed damage while the spell lasts; drained rises by 1 once.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Creeping Cold (Magic+), whose item has no damage: "The target takes 1d6 persistent cold damage with a Fortitude save." with "Heightened (+1) The persistent damage
// increases by 1d6." — the text's persistent damage (rolled from the text at the cast rank); the rows "The target takes half persistent damage and a –1 status
// penalty to their Reflex saves until the start of their next turn." / "The target takes the full persistent damage and a –1 status penalty to their Reflex saves
// as long as they are taking this persistent damage." / "As failure, but the status penalty is –2." — the damage halved or full, and a note with the penalty for
// that time (as long as the persistent cold damage lasts: removed with it).
const CREEP = {
    lead: /^The target takes (\d+)d(\d+) persistent ([a-z]+) damage with an? (Fortitude|Reflex|Will) save\.$/,
    success: /^The target takes half persistent damage and a [–−-](\d) (status) penalty to their (Fortitude|Reflex|Will) saves until the start of their next turn\.$/,
    failure: /^The target takes the full persistent damage and a [–−-](\d) (status) penalty to their (Fortitude|Reflex|Will) saves as long as they are taking this persistent damage\.$/,
    criticalFailure: /^As failure, but the (status) penalty is [–−-](\d)\.$/,
    heightened: /Heightened \(\+(\d)\) The persistent damage increases by (\d+)d(\d+)\./
};
function creepingRows(row, preamble, heightenedText, baseRank, components) {
    const lead = sentences(preamble).map(sentence => ({ sentence, match: CREEP.lead.exec(sentence) })).find(entry => entry.match);
    const success = CREEP.success.exec(row("success")), failure = CREEP.failure.exec(row("failure")), critical = CREEP.criticalFailure.exec(row("criticalFailure")), step = CREEP.heightened.exec(heightenedText);
    if (!lead || !success || !failure || !critical || !step || (components ?? []).length || success[3] !== failure[3] || step[3] !== lead.match[2] || !/^The target is unaffected\.$/.test(row("criticalSuccess"))) return null;
    const [, dice, die, type] = lead.match;
    const formula = `(${dice}+floor((@item.rank - ${Number(baseRank) || 1})/${step[1]})*${step[2]})d${die}[persistent,${type}]`;
    const component = { id: "text-damage", formula: `${dice}d${die}`, type, category: "persistent", applyModifier: false, kinds: ["damage"], materials: [] };
    const save = success[3].toLowerCase();
    const penalty = value => ({ key: "FlatModifier", selector: save, type: "status", value: -Number(value) });
    const note = (degree, value, duration, extra = {}) => ({ label: "Creeping cold", text: `A –${value} status penalty to ${success[3]} saves.`, sourceText: row(degree), claimsRow: true, statedRules: true,
        rules: [penalty(value)], duration, ...extra });
    const whileCold = { mode: "unlimited", sourceText: "as long as they are taking this persistent damage" };
    return {
        notes: {
            success: [note("success", success[1], { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "target-turn", offset: 1, sourceText: "until the start of their next turn" })],
            failure: [note("failure", failure[1], { ...whileCold }, { whilePersistent: type })],
            criticalFailure: [note("criticalFailure", critical[2], { ...whileCold }, { whilePersistent: type })]
        },
        sharedDamage: { mode: "formula", rollOnce: true, formula, components: [component], textDerived: true },
        damage: { criticalSuccess: { mode: "none", multiplier: 0, sourceComponentIds: [] }, success: { mode: "shared", multiplier: 0.5, sourceComponentIds: [component.id] },
            failure: { mode: "shared", multiplier: 1, sourceComponentIds: [component.id] }, criticalFailure: { mode: "shared", multiplier: 1, sourceComponentIds: [component.id] } },
        textFormula: formula,
        preambleClaims: [lead.sentence],
        interpretation: "Creeping Cold: its item has no damage; the text's 1d6 persistent cold (+1d6 a rank) is rolled, halved on a success; the failing rows' penalty ends with that persistent damage.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Ravaging End (Witches+): "When you Cast this Spell, choose either acid, fire, or poison and the spell gains the trait you chose and deals 1d4 damage plus 2
// persistent damage of the same type. The persistent damage automatically ends when the spell ends and it can still be removed with a DC 15 flat check, but it
// cannot be removed automatically with assistance while the spell is active." with rows half / full / "double damage and the flat check to remove the persistent
// damage is DC 17" and "Heightened (+1) Increase the damage by 1d4 and the persistent damage by 2." — the caster's type for both parts (the item's are
// placeholders), rolled from the text; on each damaging row a note for the spell's duration holding the persistent damage (it ends with the note) at the row's
// recovery DC; assisted recovery is the note's.
const RAVAGE = {
    lead: /^When you Cast this Spell, choose either ([a-z]+), ([a-z]+), or ([a-z]+) and the spell gains the trait you chose and deals (\d+)d(\d+) damage plus (\d+) persistent damage of the same type\.$/,
    end: /^The persistent damage automatically ends when the spell ends and it can still be removed with a DC (\d+) flat check, but it cannot be removed automatically with assistance while the spell is active\.$/,
    critical: /^The target takes double damage and the flat check to remove the persistent damage is DC (\d+)\.$/,
    heightened: /Heightened \(\+(\d)\) Increase the damage by (\d+)d(\d+) and the persistent damage by (\d+)\./
};
function ravagingRows(row, preamble, heightenedText, baseRank, components, lifecycle) {
    const lead = sentences(preamble);
    const choice = lead.map(sentence => RAVAGE.lead.exec(sentence)).find(Boolean), end = lead.map(sentence => RAVAGE.end.exec(sentence)).find(Boolean);
    const critical = RAVAGE.critical.exec(row("criticalFailure")), step = RAVAGE.heightened.exec(heightenedText), spell = spellTime(lifecycle);
    if (!choice || !end || !critical || !step || !spell || lead.length !== 3 || !/^The target takes half damage\.$/.test(row("success")) || !/^The target takes full damage\.$/.test(row("failure"))
        || !/^The target is unaffected\.$/.test(row("criticalSuccess")) || step[3] !== choice[5]) return null;
    const direct = (components ?? []).find(component => !component.category), persistent = (components ?? []).find(component => component.category === "persistent");
    if ((components ?? []).length !== 2 || !direct || !persistent || String(direct.formula).replace(/\s+/g, "") !== `${choice[4]}d${choice[5]}` || String(persistent.formula).trim() !== choice[6]) return null;
    const base = Number(baseRank) || 1, every = Number(step[1]);
    const formula = `{(${choice[4]}+floor((@item.rank - ${base})/${every})*${step[2]})d${choice[5]}[untyped],(${choice[6]}+floor((@item.rank - ${base})/${every})*${step[4]})[persistent,untyped]}`;
    const note = (degree, dc) => ({ label: "Ravaging End", text: `Its persistent damage from this spell ends when the spell does (this Effect); its flat check to recover is DC ${dc}, and assistance can't end it automatically while the spell lasts.`,
        sourceText: row(degree), claimsRow: true, gmPlays: true, duration: { ...spell }, holdsPersistent: { dc } });
    return {
        notes: { success: [note("success", Number(end[1]))], failure: [note("failure", Number(end[1]))], criticalFailure: [note("criticalFailure", Number(critical[1]))] },
        sharedDamage: { mode: "formula", rollOnce: true, formula, components: [{ ...direct, type: "untyped" }, { ...persistent, type: "untyped" }], textDerived: true },
        casterChoice: { kind: "damage-type", values: [choice[1], choice[2], choice[3]], label: "Damage type", allPools: true },
        casterChoiceSentence: lead.find(sentence => RAVAGE.lead.test(sentence)),
        textFormula: formula,
        preambleClaims: lead,
        interpretation: "Ravaging End: the caster's type for both damage parts; the persistent damage ends with the spell's Effect on the creature, its recovery DC the row's; assisted recovery while it lasts is the GM's.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// The End is Nigh (Oracles+): "You see your own fate closing in on you and become Frightened 1." (the caster's, a critical success) / "The target fears the
// inevitability of their future and becomes Frightened 2 and cannot reduce their frightened condition below 1 for the duration of the spell. The next time the
// target attempts an attack roll or save, it must roll twice and take the lower result, after which the spell ends." / "As failure, except the creature becomes
// Frightened 3 and Fleeing for 1 round." — PF2e's Frightened (and Fleeing); a note for the spell's duration holding the misfortune on its next attack roll or
// save (PF2e removes it after that roll: the spell ends) and the floor of frightened 1 while it lasts (note-watchers.js).
const NIGH = {
    criticalSuccess: /^You [a-z ,']{3,60} and become (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Frightened (\d)\})\.$/,
    failure: /^The target fears the inevitability of their future and becomes @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Frightened (\d)\} and cannot reduce their frightened condition below (\d) for the duration of the spell\. The next time the target attempts an attack roll or save, it must roll twice and take the lower result, after which the spell ends\.$/,
    criticalFailure: /^As failure, except the creature becomes @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Frightened (\d)\} and @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Fleeing\} for (\d) rounds?\.$/
};
function nighRows(row, lifecycle, outcomes) {
    const critical = NIGH.criticalSuccess.exec(row("criticalSuccess")), failure = NIGH.failure.exec(row("failure")), worse = NIGH.criticalFailure.exec(row("criticalFailure"));
    const spell = spellTime(lifecycle);
    if (!critical || !failure || !worse || !spell || !/^The target is unaffected\.$/.test(row("success"))) return null;
    const note = degree => ({ label: "The end is nigh", text: `Its next attack roll or save is rolled twice, keeping the lower; then the spell ends (this Effect). Until then its frightened can't go below ${failure[2]}.`,
        sourceText: row(degree), claimsRow: true, statedRules: true, rules: [{ key: "RollTwice", selector: ["attack-roll", "saving-throw"], keep: "lower", removeAfterRoll: true }],
        conditionFloor: { slug: "frightened", value: Number(failure[2]) }, duration: { ...spell } });
    // (The rows' conditions: PF2e's, without the spell's time — frightened falls by itself, but not below the floor.)
    const frightened = value => { const base = (outcomes.failure?.effects ?? []).find(effect => effect.slug === "frightened"); if (!base) return null;
        const copy = { ...JSON.parse(JSON.stringify(base)), value, duration: null, raw: base.raw.replace(/Frightened \d/, `Frightened ${value}`) };
        delete copy.expirationMode; delete copy.endsWhen; delete copy.lifetimeProof; return copy; };
    const fleeing = (outcomes.criticalFailure?.effects ?? []).find(effect => effect.slug === "fleeing");
    if (!frightened(1) || !fleeing) return null;
    return {
        notes: { success: [], failure: [note("failure")], criticalFailure: [note("criticalFailure")] },
        effects: { failure: [frightened(Number(failure[1]))], criticalFailure: [frightened(Number(worse[1])), JSON.parse(JSON.stringify(fleeing))] },
        casterConditions: { criticalSuccess: [{ slug: "frightened", value: Number(critical[2]), sourceText: row("criticalSuccess") }] },
        interpretation: "The End is Nigh: the misfortune Effect ends the spell when PF2e removes it after the roll; the frightened floor lasts while it does.",
        evidence: ["criticalSuccess", "failure", "criticalFailure"].map(row)
    };
}

// Sensory Deprivation (Witches+): "Choose eyes, hands, or mouth. The target creature feels a strange warmth and the inability to use certain actions, as their eyes,
// hands, or mouth are restricted by false illusions for 1 round. The creature can spend a Seek action to disbelieve the effect as an illusion." with the list "Eyes
// The creature is Dazzled." / "Hands The creature cannot take actions with the manipulate trait." / "Mouth The creature cannot take actions with the auditory
// trait." / "As success, except the spell lasts the duration." / "As failure, except you can choose two options instead of one." — the caster's pick on the
// card (two on a critical failure): a note per option for the row's time (PF2e's Dazzled; its manipulate or auditory spells refused at the cast; its other such
// actions the GM's), disbelieved with a Seek (Perception against the spell DC ends the spell).
const SENSE = {
    success: /^Choose eyes, hands, or mouth\. The target creature feels a strange warmth and the inability to use certain actions, as their eyes, hands, or mouth are restricted by false illusions for (\d+) rounds?\. The creature can spend a @UUID\[[^\]]+\]\{Seek\} action to disbelieve the effect as an illusion\.$/,
    // (The list after the success row, in its own <ul>.)
    list: /<ul>\s*<li>\s*<strong>Eyes<\/strong>\s*The creature is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)\]\{Dazzled\})\.\s*<\/li>\s*<li>\s*<strong>Hands<\/strong>\s*The creature cannot take actions with the manipulate trait\.\s*<\/li>\s*<li>\s*<strong>Mouth<\/strong>\s*The creature cannot take actions with the auditory trait\.\s*<\/li>\s*<\/ul>/,
    failure: /^As success, except the spell lasts the duration\.$/,
    criticalFailure: /^As failure, except you can choose two options instead of one\.$/
};
function sensoryRows(row, lifecycle, html) {
    const success = SENSE.success.exec(row("success")), list = SENSE.list.exec(String(html ?? ""));
    const spell = spellTime(lifecycle);
    if (!success || !list || !SENSE.failure.test(row("failure")) || !SENSE.criticalFailure.test(row("criticalFailure")) || !spell || !/^The target is unaffected\.$/.test(row("criticalSuccess"))) return null;
    const round = { mode: "fixed", value: Number(success[1]), unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `for ${success[1]} round` };
    const dazzled = { key: "GrantItem", uuid: `Compendium.pf2e.conditionitems.Item.${list[2]}`, flag: "conditionDazzled", allowDuplicate: true, onDeleteActions: { grantee: "cascade" } };
    const options = {
        eyes: { text: "Its eyes are restricted: it's Dazzled.", rules: [dazzled] },
        hands: { text: "Its hands are restricted: it can't take actions with the manipulate trait (its manipulate spells are refused; the GM plays the rest).", castForbid: { trait: "manipulate" } },
        mouth: { text: "Its mouth is restricted: it can't take actions with the auditory trait (its auditory spells are refused; the GM plays the rest).", castForbid: { trait: "auditory" } }
    };
    const notes = (degree, duration) => Object.entries(options).map(([option, entry]) => ({ label: `Sensory deprivation (${option})`, text: `${entry.text} It can Seek to disbelieve the illusion (Perception against the spell DC; a success ends the spell).`,
        sourceText: row(degree), claimsRow: true, gmPlays: true, choiceGroup: "caster-option", option, duration: { ...duration }, disbelieve: { statistic: "perception", endsSpell: true },
        ...(entry.rules ? { rules: entry.rules.map(rule => ({ ...rule })) } : {}), ...(entry.castForbid ? { castForbid: { ...entry.castForbid } } : {}) }));
    return {
        notes: { success: notes("success", round), failure: notes("failure", spell), criticalFailure: notes("criticalFailure", spell) },
        dropConditions: { success: ["dazzled"], failure: ["dazzled"], criticalFailure: ["dazzled"] },
        casterChoice: { kind: "option", values: ["eyes", "hands", "mouth"], label: "Restriction", rows: ["success", "failure", "criticalFailure"], twoOn: ["criticalFailure"] },
        casterChoiceSentence: "Choose eyes, hands, or mouth.",
        sensory: true,
        interpretation: "Sensory Deprivation: the caster's pick (two on a critical failure); its manipulate or auditory spells are refused, its other such actions the GM's; a Seek's disbelief ends the spell.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Bewilder (Magic+): "Any time they attempt a hostile action, they must attempt a DC 6 flat check, failing to perform the hostile action on a failure. If the creature
// fails to complete a hostile action against another creature due to this spell, it treats the creature it targeted with the hostile action as its ally until its
// next turn." with rows "The target is affected until the end of their next turn." / "… for the duration of the spell, but it can attempt a Will save at the end of
// each of its turns. On a success, the spell ends." / "… for the duration of the spell and the DC for the flat check is increased to 11." — a note the GM plays (the
// flat check on each hostile action), for the row's time; the failure's end-of-turn Will save the module rolls (a success ends it).
const BEWILDER = {
    lead: [/^The target believes everyone might be their friend and is wary of attacking the wrong creature\.$/,
        /^Any time they attempt a hostile action, they must attempt a @Check\[flat\|dc:(\d+)\](?:\{[^}]*\})?, failing to perform the hostile action on a failure\.$/,
        /^If the creature fails to complete a hostile action against another creature due to this spell, it treats the creature it targeted with the hostile action as its ally until its next turn\.$/],
    success: /^The target is affected until the end of their next turn\.$/,
    failure: /^The target is affected for the duration of the spell, but it can attempt a (Fortitude|Reflex|Will) save at the end of each of its turns\. On a success, the spell ends\.$/,
    criticalFailure: /^The target is affected for the duration of the spell and the DC for the flat check is increased to @Check\[flat\|dc:(\d+)\](?:\{[^}]*\})?\.$/
};
function bewilderRows(row, preamble, lifecycle) {
    const lead = sentences(preamble);
    const at = lead.findIndex(sentence => BEWILDER.lead[0].test(sentence));
    const flat = at >= 0 ? BEWILDER.lead[1].exec(lead[at + 1] ?? "") : null;
    const failure = BEWILDER.failure.exec(row("failure")), critical = BEWILDER.criticalFailure.exec(row("criticalFailure"));
    const spec = lifecycle?.durationSpec;
    if (!flat || !BEWILDER.lead[2].test(lead[at + 2] ?? "") || !BEWILDER.success.test(row("success")) || !failure || !critical || !/^The target is unaffected\.$/.test(row("criticalSuccess"))
        || spec?.mode !== "fixed" || spec.unit !== "minutes") return null;
    const rounds = Number(spec.value) * 10;
    const text = dc => `Bewildered: each time it attempts a hostile action, it must succeed at a DC ${dc} flat check or fail to perform it; a creature it so failed to act against is its ally until its next turn (the GM rolls and plays it).`;
    const note = (degree, dc, duration, extra = {}) => ({ label: "Bewildered", text: text(dc), sourceText: row(degree), sourceTexts: [row(degree), ...lead.slice(at, at + 3)], claimsRow: true, gmPlays: true, duration, ...extra });
    return {
        notes: {
            success: [note("success", flat[1], { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "until the end of their next turn" })],
            failure: [note("failure", flat[1], { mode: "fixed", value: rounds, unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: "for the duration of the spell" },
                { recurringSave: { timing: "turn-end", mode: "end", statistic: failure[1].toLowerCase() } })],
            criticalFailure: [note("criticalFailure", critical[1], { mode: "fixed", value: rounds, unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: "for the duration of the spell" })]
        },
        preambleClaims: lead.slice(at, at + 3),
        interpretation: "Bewilder: the hostile-action flat check and the ally confusion are the GM's (a note); the failure's end-of-turn Will save is rolled.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Careless Swings (Magic+): "Choose either the manipulate or move trait." with rows "The first time the target Strikes before the end of its next turn, it gains
// the chosen trait." / "As failure, except all of the target's Strikes gain the chosen trait until the end of its next turn." — the caster's pick; a note for the
// row's time that the GM plays (the trait lets reactions to such actions trigger; the module adds no trait to the Strike).
const CARELESS = {
    choose: /^Choose either the (manipulate|move) or (manipulate|move) trait\.$/,
    failure: /^The first time the target Strikes before the end of its next turn, it gains the chosen trait\.$/,
    criticalFailure: /^As failure, except all of the target.s Strikes gain the chosen trait until the end of its next turn\.$/
};
function carelessRows(row, preamble) {
    const choose = sentences(preamble).map(sentence => CARELESS.choose.exec(sentence)).find(Boolean);
    if (!choose || choose[1] === choose[2] || !CARELESS.failure.test(row("failure")) || !CARELESS.criticalFailure.test(row("criticalFailure")) || !/^The target is unaffected\.$/.test(row("success"))) return null;
    const turn = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "before the end of its next turn" };
    const values = [choose[1], choose[2]].sort();
    const note = (degree, option, all) => ({ label: `Careless swings (${option})`, option, choiceGroup: "caster-option", claimsRow: true, gmPlays: true, sourceText: row(degree), duration: { ...turn },
        text: all ? `Until the end of its next turn, each of its Strikes has the ${option} trait (reactions to ${option} actions can trigger).`
            : `The first time it Strikes before the end of its next turn, that Strike has the ${option} trait (reactions to ${option} actions can trigger).` });
    return {
        notes: { failure: values.map(option => note("failure", option, false)), criticalFailure: values.map(option => note("criticalFailure", option, true)) },
        casterChoice: { kind: "option", values, label: "Trait", rows: ["failure", "criticalFailure"] },
        casterChoiceSentence: choose[0],
        optionNotes: true,
        interpretation: "Careless Swings: the caster's trait; the Strike's trait is a GM-played note (reactions are the players' and GM's).",
        evidence: ["failure", "criticalFailure"].map(row)
    };
}

// Shade of Night (Magic+): "The target creature attempts a Fortitude save, reducing their ability to see in darkness or low-light." / "Depending on their save,
// the target reduces their darkvision to low-light vision, and low-light vision to no special vision." / "If the creature has light sensitivity, it is suppressed
// for the duration." with rows "The target's vision is reduced for 1 round." / "… for 1 minute." / "As failure, except the target is also blinded for 1 round."
// and "Heightened (2nd) The spell reduces a creature's darkvision and low-light vision to no special vision." / "Heightened (4th) The spell reduces greater
// darkvision to low-light vision in addition to its other effects." — a note for the row's time (PF2e's senses are the GM's to play), its text the cast rank's;
// Blinded the critical failure's own condition.
const SHADE = {
    lead: [/^The target creature attempts a Fortitude save, reducing their ability to see in darkness or low-light\.$/,
        /^Depending on their save, the target reduces their darkvision to low-light vision, and low-light vision to no special vision\.$/,
        /^If the creature has light sensitivity, it is suppressed for the duration\.$/],
    success: /^The target.s vision is reduced for (\d+) round\.$/,
    failure: /^The target.s vision is reduced for (\d+) minute\.$/,
    criticalFailure: /^As failure, except the target is also (?:@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)\]\{)?blinded\}? for (\d+) round\.$/i,
    second: /Heightened \(2nd\) The spell reduces a creature's darkvision and low-light vision to no special vision\./,
    fourth: /Heightened \(4th\) The spell reduces greater darkvision to low-light vision in addition to its other effects\./
};
function shadeRows(row, preamble, heightenedText, baseRank) {
    const lead = sentences(preamble);
    const at = lead.findIndex(sentence => SHADE.lead[0].test(sentence));
    const success = SHADE.success.exec(row("success")), failure = SHADE.failure.exec(row("failure")), critical = SHADE.criticalFailure.exec(row("criticalFailure"));
    if (at < 0 || !SHADE.lead[1].test(lead[at + 1] ?? "") || !SHADE.lead[2].test(lead[at + 2] ?? "") || !success || !failure || !critical || !/^The target is unaffected\.$/.test(row("criticalSuccess"))
        || !SHADE.second.test(heightenedText) || !SHADE.fourth.test(heightenedText) || Number(baseRank) !== 1) return null;
    const light = " Any light sensitivity it has is suppressed.";
    const text = `Its vision is reduced: darkvision becomes low-light vision, and low-light vision becomes no special vision.${light}`;
    const rankText = [{ fromRank: 2, text: `Its vision is reduced: darkvision and low-light vision become no special vision.${light}` },
        { fromRank: 4, text: `Its vision is reduced: greater darkvision becomes low-light vision, and darkvision and low-light vision become no special vision.${light}` }];
    const note = (degree, duration) => ({ label: "Shade of night", text, rankText: rankText.map(entry => ({ ...entry })), sourceText: row(degree), sourceTexts: [row(degree), ...lead.slice(at, at + 3)],
        claimsRow: true, gmPlays: true, duration });
    const minute = { mode: "fixed", value: Number(failure[1]) * 10, unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `for ${failure[1]} minute` };
    return {
        notes: { success: [note("success", { mode: "fixed", value: Number(success[1]), unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `for ${success[1]} round` })],
            failure: [note("failure", minute)], criticalFailure: [note("criticalFailure", { ...minute })] },
        dropConditions: { success: ["blinded"], failure: ["blinded"] },
        preambleClaims: lead.slice(at, at + 3),
        interpretation: "Shade of Night: the reduced vision a GM-played note for the row's time, its text the cast rank's (2nd, 4th); Blinded on a critical failure.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Drown (Magic+): "Creatures that do not need to breathe are unaffected by this spell." / "Air bubble can counteract drown, and vice versa." with rows "The target
// takes a –2 status penalty to all checks it makes with the auditory or linguistics traits it attempts until the end of its turn." / "The target must hold its
// breath or it begins suffocating. The target creature can Interact to attempt to remove the bubble, allowing it to attempt a new Fortitude save to end the
// effect." / "As failure, except the target also halves the number of rounds it can hold its breath (minimum 0)." — the success's penalty a note with PF2e's
// modifier on checks of those traits; the failing rows' held breath a GM-played note for the spell (PF2e tracks no air), its Interact re-save the card's control
// (a success ends it for the creature); the two lead sentences GM reminders (a creature that doesn't breathe: set it unaffected).
const DROWN = {
    lead: [/^Creatures that do not need to breathe are unaffected by this spell\.$/, /^(?:@UUID\[[^\]]+\]\{)?[Aa]ir bubble\}? can counteract drown, and vice versa\.$/],
    success: /^The target takes a [–-](\d) status penalty to all checks it makes with the auditory or linguistics traits it attempts until the end of its turn\.$/,
    failure: /^The target must hold its breath or it begins suffocating\. The target creature can Interact to attempt to remove the bubble, allowing it to attempt a new (Fortitude|Reflex|Will) save to end the effect\.$/,
    criticalFailure: /^As failure, except the target also halves the number of rounds it can hold its breath \(minimum 0\)\.$/
};
function drownRows(row, preamble, lifecycle) {
    const lead = sentences(preamble);
    const at = lead.findIndex(sentence => DROWN.lead[0].test(sentence));
    const success = DROWN.success.exec(row("success")), failure = DROWN.failure.exec(row("failure"));
    const spell = spellTime(lifecycle);
    if (at < 0 || !DROWN.lead[1].test(lead[at + 1] ?? "") || !success || !failure || !DROWN.criticalFailure.test(row("criticalFailure")) || !/^The target is unaffected\.$/.test(row("criticalSuccess")) || !spell) return null;
    const bubble = (degree, half) => ({ label: "Drowning bubble", sourceText: row(degree), claimsRow: true, gmPlays: true, duration: { ...spell },
        text: `It must hold its breath or begin suffocating${half ? ", and it can hold its breath for only half its usual rounds (minimum 0)" : ""}. It can Interact to try to remove the bubble: a new ${failure[1]} save; a success ends the effect for it.`,
        endSave: { statistic: failure[1].toLowerCase(), label: "Interacts to remove the bubble", oncePerRound: false, scope: "creature" } });
    return {
        notes: {
            success: [{ label: "Drowning bubble", text: `A –${success[1]} status penalty to its checks with the auditory or linguistic trait until the end of its turn.`, sourceText: row("success"), claimsRow: true,
                rules: [{ key: "FlatModifier", selector: "check", type: "status", value: -Number(success[1]), predicate: [{ or: ["item:trait:auditory", "item:trait:linguistic"] }] }],
                duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "until the end of its turn" } }],
            failure: [bubble("failure", false)], criticalFailure: [bubble("criticalFailure", true)]
        },
        reminders: [{ kind: "third-party-note", text: "A creature that doesn't need to breathe is unaffected: set it unaffected on the card.", sourceText: lead[at] },
            { kind: "third-party-note", text: "Air bubble can counteract drown, and drown can counteract air bubble.", sourceText: lead[at + 1] }],
        preambleClaims: lead.slice(at, at + 2),
        interpretation: "Drown: the success's penalty as PF2e's modifier on auditory and linguistic checks; the held breath a GM-played note with the Interact re-save; non-breathers set unaffected by the GM.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Kinetic Tow (Magic+): "The target creature is drawn by an invisible chain towards another creature or object of your choice within 30 feet of the target,
// depending on its Fortitude save." / "This is forced movement." with rows "The target is unaffected and the spell ends." / "The target is moved 10 feet towards
// the creature or object and then the spell ends." / "The target is moved 15 feet towards the creature or object and cannot move more than 30 feet from the
// creature. The creature can attempt a new Fortitude save against the effect by spending an Interact action to break the chain. The target can choose to use its
// modifier in Athletics for its Fortitude save." / "As failure, except the target is moved 30 feet." — the GM's forced movement toward the caster's pick; the
// tether a GM-played note for the spell, its Interact re-save the card's control (Fortitude; the Athletics alternative is the GM's).
const TOW = {
    lead: [/^The target creature is drawn by an invisible chain towards another creature or object of your choice within (\d+) feet of the target, depending on its (Fortitude|Reflex|Will) save\.$/, /^This is forced movement\.$/],
    criticalSuccess: /^The target is unaffected and the spell ends\.$/,
    success: /^The target is moved (\d+) feet towards the creature or object and then the spell ends\.$/,
    failure: /^The target is moved (\d+) feet towards the creature or object and cannot move more than (\d+) feet from the creature\. The creature can attempt a new (Fortitude|Reflex|Will) save against the effect by spending an Interact action to break the chain\. The target can choose to use its modifier in Athletics for its \3 save\.$/,
    criticalFailure: /^As failure, except the target is moved (\d+) feet\.$/
};
function towRows(row, preamble, lifecycle) {
    const lead = sentences(preamble);
    const at = lead.findIndex(sentence => TOW.lead[0].test(sentence));
    const success = TOW.success.exec(row("success")), failure = TOW.failure.exec(row("failure")), critical = TOW.criticalFailure.exec(row("criticalFailure"));
    const spell = spellTime(lifecycle);
    if (at < 0 || !TOW.lead[1].test(lead[at + 1] ?? "") || !TOW.criticalSuccess.test(row("criticalSuccess")) || !success || !failure || !critical || !spell) return null;
    const move = (degree, feet) => ({ kind: "pull", distance: Number(feet), upTo: false, optional: false, direction: "chosen", sourceText: row(degree) });
    const chain = degree => ({ label: "Kinetic tow", sourceText: row(degree), claimsRow: true, gmPlays: true, duration: { ...spell },
        text: `Chained: it can't move more than ${failure[2]} feet from the chosen creature or object. It can Interact to break the chain: a new ${failure[3]} save (it can use its Athletics modifier instead); a success ends the spell.`,
        endSave: { statistic: failure[3].toLowerCase(), label: "Interacts to break the chain", oncePerRound: false } });
    return {
        notes: { failure: [chain("failure")], criticalFailure: [chain("criticalFailure")] },
        forcedMovement: { success: move("success", success[1]), failure: move("failure", failure[1]), criticalFailure: move("criticalFailure", critical[1]) },
        preambleClaims: lead.slice(at, at + 2),
        interpretation: "Kinetic Tow: the GM moves the target toward the caster's chosen creature or object; the tether a note whose Interact re-save is Fortitude (Athletics instead is the GM's).",
        evidence: ["criticalSuccess", "success", "failure", "criticalFailure"].map(row)
    };
}

// Eternal Slumber (Witches+): "The target becomes drowsy and takes a -2 status penalty to Perception checks to Seek and must attempt a DC 5 flat check to use
// concentrate actions, losing the action on a failure." / "The target creature becomes Unconscious for the duration and the creature does not automatically wake
// up under the circumstances that would cause them to wake unless they succeed at a Will save." / "As failure, but the creature remains unconscious permanently
// even after the spell ends. You can set a condition that will end this effect, but otherwise the unconscious condition can be removed only through Wish, or other
// powerful magic." — the success a note for the spell (PF2e's Seek penalty, the concentrate flat check rolled for its concentrate spells); Unconscious for the spell
// (sustained), or with no end on a critical failure; the waking save and the ending condition GM-played notes.
const SLUMBER = {
    success: /^The target becomes drowsy and takes a [-–](\d) status penalty to Perception checks to (?:@UUID\[[^\]]+\]\{Seek\}|Seek) and must attempt a @Check\[(?:type:)?flat\|dc:(\d+)\](?:\{[^}]*\})? to use concentrate actions, losing the action on a failure\.$/,
    failure: /^The target creature becomes (?:@UUID\[[^\]]+\]\{Unconscious\}|Unconscious) for the duration and the creature does not automatically wake up under the circumstances that would cause them to wake unless they succeed at a (Fortitude|Reflex|Will) save\.$/,
    criticalFailure: /^As failure, but the creature remains unconscious permanently even after the spell ends\. You can set a condition that will end this effect, but otherwise the unconscious condition can be removed only through (?:@UUID\[[^\]]+\]\{Wish\}|Wish), or other powerful magic\.$/
};
function slumberRows(row, lifecycle, outcomes) {
    const success = SLUMBER.success.exec(row("success")), failure = SLUMBER.failure.exec(row("failure"));
    const spec = lifecycle?.durationSpec, spell = spellTime(lifecycle);
    const unconscious = (outcomes?.failure?.effects ?? []).filter(effect => effect.kind === "condition");
    if (!success || !failure || !SLUMBER.criticalFailure.test(row("criticalFailure")) || !/^The target is unaffected\.$/.test(row("criticalSuccess")) || spec?.mode !== "sustained" || !spell
        || unconscious.length !== 1 || unconscious[0].slug !== "unconscious") return null;
    const statistic = failure[1];
    const wake = (degree, permanent) => ({ label: "Eternal slumber", sourceText: row(degree), claimsRow: true, gmPlays: true, duration: permanent ? { mode: "unlimited" } : { ...spell },
        text: permanent ? `It stays unconscious permanently, even after the spell ends, unless the caster's chosen condition is met (the caster sets it) or Wish or other powerful magic removes it. It doesn't wake when something would wake it unless it succeeds at a ${statistic} save (the GM rolls it).`
            : `It doesn't wake when something would wake it unless it succeeds at a ${statistic} save (the GM rolls it).` });
    const asleep = permanent => ({ ...JSON.parse(JSON.stringify(unconscious[0])), duration: permanent ? { mode: "unlimited", value: null, unit: null } : JSON.parse(JSON.stringify(spec)),
        ...(permanent ? { expirationMode: "duration" } : { endsWhen: [{ event: "spell-ended" }], expirationMode: "first" }) });
    return {
        notes: {
            success: [{ label: "Drowsy", sourceText: row("success"), claimsRow: true, duration: { ...spell }, castFlatCheck: { dc: Number(success[2]), trait: "concentrate" },
                rules: [{ key: "FlatModifier", selector: "perception", type: "status", value: -Number(success[1]), predicate: ["action:seek"] }],
                text: `A –${success[1]} status penalty to Perception checks to Seek. Each concentrate action needs a DC ${success[2]} flat check; on a failure the action is lost (the module rolls it for its concentrate spells; the GM for its other concentrate actions).` }],
            failure: [wake("failure", false)], criticalFailure: [wake("criticalFailure", true)]
        },
        effects: { success: [], failure: [asleep(false)], criticalFailure: [asleep(true)] },
        interpretation: "Eternal Slumber: Unconscious for the spell (sustained), or permanently on a critical failure; the waking Will save and the caster's ending condition are the GM's; the success's concentrate flat check rolled for concentrate spells.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Summon Jury (Wizards+), each phase's table: Arrive's "The target takes a –1 status penalty to its next attack roll for 1 round." / "… to all attack rolls for 1
// round." / "… to attack rolls for 1 round and to its save against the Depart effect."; Depart's "… to its next saving throw for 1 round." / "… to saving throws for
// 1 round." / "The target is condemned for its crimes and takes a –1 status penalty to saving throws for 1 minute."; and "Heightened (5th) The status penalties
// increase to 2." / "Heightened (9th) … to 3." — a note per row with PF2e's status penalty (the "next" roll's removed after it), its value the cast rank's; the
// critical failure's penalty to the Depart save a toggle the GM switches on for that save.
const JURY = {
    arrive: { success: /^The target takes a [–-](\d) status penalty to its next attack roll for (\d+) round\.$/, failure: /^The target takes a [–-](\d) status penalty to all attack rolls for (\d+) round\.$/,
        criticalFailure: /^The target takes a [–-](\d) status penalty to attack rolls for (\d+) round and to its save against the Depart effect\.$/ },
    depart: { success: /^The target takes a [–-](\d) status penalty to its next saving throw for (\d+) round\.$/, failure: /^The target takes a [–-](\d) status penalty to saving throws for (\d+) round\.$/,
        criticalFailure: /^The target is condemned for its crimes and takes a [–-](\d) status penalty to saving throws for (\d+) minute\.$/ },
    heightened: /Heightened \((\d+)(?:st|nd|rd|th)\) The status penalties increase to (\d+)\./g
};
function juryRows(row, heightenedText) {
    const phase = ["arrive", "depart"].find(key => ["success", "failure", "criticalFailure"].every(degree => JURY[key][degree].test(row(degree))));
    if (!phase || !/^The target is unaffected\.$/.test(row("criticalSuccess"))) return null;
    const matched = Object.fromEntries(["success", "failure", "criticalFailure"].map(degree => [degree, JURY[phase][degree].exec(row(degree))]));
    if (new Set(Object.values(matched).map(match => match[1])).size !== 1) return null;
    const steps = [...String(heightenedText ?? "").matchAll(JURY.heightened)].map(match => ({ fromRank: Number(match[1]), value: -Number(match[2]) }));
    const base = -Number(matched.success[1]);
    if (steps.some((step, index) => step.value >= (index ? steps[index - 1].value : base))) return null;
    const round = rounds => ({ mode: "fixed", value: Number(rounds), unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `for ${rounds} round` });
    const selector = phase === "arrive" ? "attack-roll" : "saving-throw", noun = phase === "arrive" ? "attack rolls" : "saving throws";
    const penalty = extra => ({ key: "FlatModifier", selector, type: "status", value: base, ...extra });
    const note = (degree, rules, text, duration) => ({ label: phase === "arrive" ? "Called to order" : "Verdict", sourceText: row(degree), claimsRow: true, rules, text, duration,
        ...(steps.length ? { rankValues: steps.map(step => ({ ...step })) } : {}) });
    const amount = steps.length ? `${-base} (more from higher ranks)` : `${-base}`;
    return {
        notes: {
            success: [note("success", [penalty({ removeAfterRoll: true })], `A –${amount} status penalty to its next ${phase === "arrive" ? "attack roll" : "saving throw"} (removed after it).`, round(matched.success[2]))],
            failure: [note("failure", [penalty()], `A –${amount} status penalty to ${noun}.`, round(matched.failure[2]))],
            criticalFailure: [phase === "arrive"
                ? note("criticalFailure", [penalty(), { key: "RollOption", domain: "all", option: "summon-jury-verdict", toggleable: true, label: "Saving against the jury's verdict (Depart)" },
                    { key: "FlatModifier", selector: "saving-throw", type: "status", value: base, predicate: ["summon-jury-verdict"] }],
                    `A –${amount} status penalty to attack rolls, and to its save against the Depart verdict (switch the toggle on for that save).`, round(matched.criticalFailure[2]))
                : note("criticalFailure", [penalty()], `Condemned: a –${amount} status penalty to saving throws.`, { mode: "fixed", value: Number(matched.criticalFailure[2]) * 10, unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `for ${matched.criticalFailure[2]} minute` })]
        },
        interpretation: "Summon Jury: each row's status penalty a note at the cast rank's value; a \"next\" roll's removed after it; the Arrive critical failure's Depart-save penalty a toggle the GM switches on.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Sudden Outbreak (Witches+): "The target must attempt a save against the DC of one of its diseases to progress to the next stage (target's choice) and then the
// spell immediately ends." / "As success, except the target must attempt a save to progress to the next stage of one of its diseases (target's choice) the first
// time you Sustain the spell on subsequent turns. If a creature gets a critical success at its save to progress to the next stage, this spell ends." / "As failure,
// but the spell does not end when a creature critically succeeds at its save to progress one of its diseases." — its diseases are the GM's (PF2e's afflictions):
// GM-played notes for the row's time, the success's a reminder for the turn.
const OUTBREAK = {
    success: /^The target must attempt a save against the DC of one of its diseases to progress to the next stage \(target's choice\) and then the spell immediately ends\.$/,
    failure: /^As success, except the target must attempt a save to progress to the next stage of one of its diseases \(target's choice\) the first time you Sustain the spell on subsequent turns\. If a creature gets a critical success at its save to progress to the next stage, this spell ends\.$/,
    criticalFailure: /^As failure, but the spell does not end when a creature critically succeeds at its save to progress one of its diseases\.$/
};
function outbreakRows(row, lifecycle) {
    const spell = spellTime(lifecycle);
    if (!OUTBREAK.success.test(row("success")) || !OUTBREAK.failure.test(row("failure")) || !OUTBREAK.criticalFailure.test(row("criticalFailure")) || !/^The target is unaffected\.$/.test(row("criticalSuccess")) || !spell?.sustained) return null;
    const now = "It attempts a save against the DC of one of its diseases (its choice) to progress that disease to its next stage (the GM rolls it).";
    const note = (degree, text, duration) => ({ label: "Sudden outbreak", sourceText: row(degree), claimsRow: true, gmPlays: true, text, duration });
    return {
        notes: {
            success: [note("success", `${now} Then the spell ends.`, { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "source-turn", offset: 0, sourceText: "then the spell immediately ends" })],
            failure: [note("failure", `${now} Again the first time the caster Sustains the spell on each later turn. A critical success at that save ends the spell.`, { ...spell })],
            criticalFailure: [note("criticalFailure", `${now} Again the first time the caster Sustains the spell on each later turn, and a critical success doesn't end the spell.`, { ...spell })]
        },
        clears: ["manual:conditional-effect", "sustain-effect"],
        interpretation: "Sudden Outbreak: the disease saves are the GM's (PF2e's afflictions), from a note for the row's time; the Sustain repeats them.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Ruler of Everything (Clerics+): "The creature must Drop Prone. The creature can spend its reaction to rebuke your claim of nobility, allowing them to avoid this
// effect." / "The creature must Drop Prone and it cannot take hostile actions against you unless you or your allies take hostile actions against it." / "As failure,
// except the creature cannot Stand up until you or one of your allies takes a hostile action against it or you move further than 15 feet away from them." — PF2e's
// Prone on each failing row (the Drop Prone action's result), and GM-played notes: the reaction that avoids it, the hostility restriction, the critical failure's
// Stand restriction (no time stated: until their ends happen).
const RULER = {
    success: /^The creature must (?:@UUID\[[^\]]+\]\{Drop Prone\}|Drop Prone)\. The creature can spend its reaction to rebuke your claim of nobility, allowing them to avoid this effect\.$/,
    failure: /^The creature must (?:@UUID\[[^\]]+\]\{Drop Prone\}|Drop Prone) and it cannot take hostile actions against you unless you or your allies take hostile actions against it\.$/,
    criticalFailure: /^As failure, except the creature cannot Stand up until you or one of your allies takes a hostile action against it or you move further than (\d+) feet away from them\.$/
};
function rulerRows(row) {
    const critical = RULER.criticalFailure.exec(row("criticalFailure"));
    if (!RULER.success.test(row("success")) || !RULER.failure.test(row("failure")) || !critical || !/^The creature is unaffected\.$/.test(row("criticalSuccess"))) return null;
    const prone = degree => ({ kind: "condition", slug: "prone", name: "Prone", value: null, duration: { mode: "unlimited", value: null, unit: null }, source: "description-reference",
        reference: "j91X7x0XSomq8d60", raw: "Drop Prone", sourceText: row(degree), expirationMode: "duration" });
    const unlimited = { mode: "unlimited" };
    const hostile = "It can't take hostile actions against the caster unless the caster or the caster's allies take hostile actions against it (then remove this).";
    const note = (degree, text, duration = unlimited) => ({ label: "Bend the knee", sourceText: row(degree), claimsRow: true, gmPlays: true, text, duration });
    return {
        notes: {
            success: [note("success", "It can spend its reaction to rebuke the caster's claim of nobility and avoid this: if it does, remove its Prone.", { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: "its reaction" })],
            failure: [note("failure", hostile)],
            criticalFailure: [note("criticalFailure", `${hostile} It can't Stand until the caster or an ally takes a hostile action against it or the caster moves more than ${critical[1]} feet away.`)]
        },
        effects: { success: [prone("success")], failure: [prone("failure")], criticalFailure: [prone("criticalFailure")] },
        clears: ["manual:attitude-or-hostility", "manual:conditional-effect", "manual:forced-movement", "manual:action-restriction"],
        interpretation: "Ruler of Everything: Drop Prone is PF2e's Prone; the rebuking reaction, the hostility restriction and the critical failure's Stand restriction are GM-played notes until their ends happen.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Web of Darkness (Oracles+): "Creatures can try to Escape the strands of darkness, and it or others can attempt to cut themselves free from the darkness by
// attacking the strands (the strands have AC [[/r 30+(@item.level - 6)*3]] and [[/r 30+(@item.level - 6)*5]] Hit Points)." with rows "The creature takes a –5-foot
// circumstance penalty to its Speed." / "As success, except the creature has a –10-foot circumstance penalty to its Speed and it can't move more than 30 feet away
// from the space it was in when you Cast the Spell." / "The target is Immobilized." and "Heightened (+1) The strands' AC increases by 3, and their Hit Points
// increase by 5." — PF2e's Speed penalty in a note for the spell, the tether and the way out (Escape against the spell DC, or the strands' AC and Hit Points at the
// cast rank) the GM's; Immobilized for the spell.
const WEB = {
    lead: /^Creatures can try to Escape the strands of darkness, and it or others can attempt to cut themselves free from the darkness by attacking the strands \(the strands have AC \[\[\/r (\d+)\+\(@item\.level - (\d+)\)\*(\d+)\]\](?:\{[^}]*\})? and \[\[\/r (\d+)\+\(@item\.level - \2\)\*(\d+)\]\](?:\{[^}]*\})? Hit Points\)\.$/,
    success: /^The creature takes a [–-](\d+)-foot (circumstance|status) penalty to its Speed\.$/,
    failure: /^As success, except the creature has a [–-](\d+)-foot \2 penalty to its Speed and it can.t move more than (\d+) feet away from the space it was in when you Cast the Spell\.$/,
    criticalFailure: /^The target is (?:@UUID\[Compendium\.pf2e\.conditionitems\.Item\.eIcWbB5o3pP6OIMe\]\{Immobilized\}|Immobilized)\.$/,
    heightened: /Heightened \(\+1\) The strands. AC increases by (\d+), and their Hit Points increase by (\d+)\./
};
function webRows(row, preamble, heightenedText, lifecycle, outcomes) {
    const lead = sentences(preamble);
    const at = lead.findIndex(sentence => WEB.lead.test(sentence));
    const strands = at >= 0 ? WEB.lead.exec(lead[at]) : null, success = WEB.success.exec(row("success"));
    const failure = success ? new RegExp(WEB.failure.source.replace("\\2", success[2])).exec(row("failure")) : null;
    const step = WEB.heightened.exec(heightenedText ?? ""), spec = lifecycle?.durationSpec, spell = spellTime(lifecycle);
    const held = (outcomes?.criticalFailure?.effects ?? []).filter(effect => effect.kind === "condition");
    if (!strands || !success || !failure || !WEB.criticalFailure.test(row("criticalFailure")) || !/^The creature is unaffected\.$/.test(row("criticalSuccess")) || !step
        || Number(step[1]) !== Number(strands[3]) || Number(step[2]) !== Number(strands[5]) || spec?.mode !== "sustained" || !spell || held.length !== 1 || held[0].slug !== "immobilized") return null;
    const ways = "It (or another creature) can end this by Escaping the strands (against the spell DC) or by cutting it free: the strands have AC {amount} and {amount2} Hit Points (the GM's).";
    const amounts = { rankAmount: { base: Number(strands[1]), step: Number(strands[3]), interval: 1, baseRank: Number(strands[2]), multiplier: 1 },
        rankAmount2: { base: Number(strands[4]), step: Number(strands[5]), interval: 1, baseRank: Number(strands[2]), multiplier: 1 } };
    const note = (degree, text, rules) => ({ label: "Web of darkness", sourceText: row(degree), sourceTexts: [row(degree), lead[at]], claimsRow: true, gmPlays: true, text: `${text} ${ways}`,
        duration: { ...spell }, ...amounts, ...(rules ? { rules } : {}) });
    const speed = value => [{ key: "FlatModifier", selector: "all-speeds", type: success[2], value: -Number(value) }];
    return {
        notes: {
            success: [note("success", `A –${success[1]}-foot ${success[2]} penalty to its Speeds.`, speed(success[1]))],
            failure: [note("failure", `A –${failure[1]}-foot ${success[2]} penalty to its Speeds, and it can't move more than ${failure[2]} feet from the space it was in when the spell was cast.`, speed(failure[1]))],
            criticalFailure: [note("criticalFailure", "It's Immobilized by the strands.")]
        },
        effects: { success: [], failure: [], criticalFailure: [{ ...JSON.parse(JSON.stringify(held[0])), duration: JSON.parse(JSON.stringify(spec)), endsWhen: [{ event: "spell-ended" }], expirationMode: "first" }] },
        clears: ["manual:forced-movement"],
        preambleClaims: [lead[at]],
        interpretation: "Web of Darkness: the Speed penalties as PF2e modifiers for the sustained spell; the tether, the Escape and cutting free (the strands' AC and HP at the cast rank) the GM's; Immobilized for the spell.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Divine Adjudication (Clerics+): "You scour through the wrongdoings of your opponent, causing divine power to whip their soul. The target takes full damage. If the
// target has committed any serious acts of anathema to your deity within the last week (or even further back for egregious acts), you gain a +1 status bonus to
// attack rolls against the creature for 1 minute." / "Your judgment is absolute. As a failure, but you deal double damage." — the rows' damage (compiled); the
// caster's bonus hangs on what only the GM knows (the creature's acts against the deity), so it's a GM-played note on the creature for the minute.
const ADJUDICATION = {
    failure: /^You scour through the wrongdoings of your opponent, causing divine power to whip their soul\. The target takes full damage\. If the target has committed any serious acts of anathema to your deity within the last week \(or even further back for egregious acts\), you gain a \+(\d) status bonus to attack rolls against the creature for (\d+) minute\.$/,
    criticalFailure: /^Your judgment is absolute\. As a failure, but you deal double damage\.$/
};
function adjudicationRows(row, outcomes) {
    const failure = ADJUDICATION.failure.exec(row("failure"));
    if (!failure || !ADJUDICATION.criticalFailure.test(row("criticalFailure")) || outcomes?.failure?.damage?.multiplier !== 1 || outcomes?.criticalFailure?.damage?.multiplier !== 2) return null;
    const note = degree => ({ label: "Judged", sourceText: row(degree), claimsRow: true, gmPlays: true,
        text: `If it has committed any serious acts of anathema to the caster's deity within the last week (or further back for egregious acts), the caster has a +${failure[1]} status bonus to attack rolls against it for the minute (the GM applies it).`,
        duration: { mode: "fixed", value: Number(failure[2]) * 10, unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `for ${failure[2]} minute` } });
    return {
        notes: { failure: [note("failure")], criticalFailure: [note("criticalFailure")] },
        clears: ["manual:conditional-effect"],
        interpretation: "Divine Adjudication: the caster's attack bonus depends on the creature's acts, which only the GM knows: a GM-played note for the minute.",
        evidence: ["failure", "criticalFailure"].map(row)
    };
}

// Beguile (Witches+): "Choose voice or appearance and this spell gains the auditory or visual trait respectively." with rows "The target is Fascinated by you for 1
// round after which the spell ends." / "The target is fascinated by you and Dazzled if you chose appearance, or fascinated and Deafened if you chose voice. These effects
// last until the spell ends or until you take a hostile action against the creature or its allies." / "As failure, except the target cannot take hostile actions
// against you and must attempt an additional Will save at the beginning of each of its turns it is fascinated. If it fails, it must Step or Stride towards you as its
// first action for the turn. If the creature is already adjacent to you, it is Off-Guard until the beginning of your next turn." — the caster's pick on the card;
// Fascinated, and Dazzled or Deafened by the pick, for the sustained spell; the hostile action that ends them, the critical failure's restriction, its turn-start
// save, its move and the adjacency's Off-Guard GM-played notes.
const BEGUILE = {
    choose: /^You call out to the target with an enchanting voice or illusion of a face or by offering the target an irresistible gift\. Choose voice or appearance and this spell gains the auditory or visual trait respectively\.$/,
    success: /^The target is (?:@UUID\[[^\]]+\]\{Fascinated\}|Fascinated) by you for (\d+) round after which the spell ends\.$/,
    failure: /^The target is fascinated by you and (?:@UUID\[[^\]]+\]\{Dazzled\}|Dazzled) if you chose appearance, or fascinated and (?:@UUID\[[^\]]+\]\{Deafened\}|Deafened) if you chose voice\. These effects last until the spell ends or until you take a hostile action against the creature or its allies\.$/,
    criticalFailure: /^As failure, except the target cannot take hostile actions against you and must attempt an additional (Fortitude|Reflex|Will) save at the beginning of each of its turns it is fascinated\. If it fails, it must Step or Stride towards you as its first action for the turn\. If the creature is already adjacent to you, it is (?:@UUID\[[^\]]+\]\{Off-Guard\}|Off-Guard) until the beginning of your next turn\.$/
};
function beguileRows(row, preamble, lifecycle, outcomes) {
    const lead = sentences(preamble).join(" ");
    const critical = BEGUILE.criticalFailure.exec(row("criticalFailure")), spec = lifecycle?.durationSpec, spell = spellTime(lifecycle);
    const pick = slug => (outcomes?.failure?.effects ?? []).find(effect => effect.kind === "condition" && effect.slug === slug);
    if (!BEGUILE.choose.test(lead) || !BEGUILE.success.test(row("success")) || !BEGUILE.failure.test(row("failure")) || !critical || !/^The target is unaffected\.$/.test(row("criticalSuccess"))
        || spec?.mode !== "sustained" || !spell || !pick("fascinated") || !pick("dazzled") || !pick("deafened")) return null;
    const lasting = (slug, option) => ({ ...JSON.parse(JSON.stringify(pick(slug))), duration: JSON.parse(JSON.stringify(spec)), endsWhen: [{ event: "spell-ended" }], expirationMode: "first",
        ...(option ? { choiceGroup: "caster-option", option } : {}) });
    const conditions = () => [lasting("fascinated"), lasting("dazzled", "appearance"), lasting("deafened", "voice")];
    const ends = "Fascinated (and Dazzled or Deafened) end if the caster takes a hostile action against it or its allies: remove them then.";
    const note = (degree, text) => ({ label: "Beguiled", sourceText: row(degree), claimsRow: true, gmPlays: true, text, duration: { ...spell } });
    return {
        notes: {
            failure: [note("failure", ends)],
            criticalFailure: [note("criticalFailure", `${ends} It can't take hostile actions against the caster. At the start of each of its turns while fascinated it attempts a ${critical[1]} save (the GM rolls it): on a failure it must Step or Stride toward the caster as its first action, and if it's already adjacent it's Off-Guard until the start of the caster's next turn.`)]
        },
        effects: { success: cloneEffects(outcomes?.success?.effects), failure: conditions(), criticalFailure: conditions() },
        casterChoice: { kind: "option", values: ["appearance", "voice"], label: "Voice or appearance", rows: ["failure", "criticalFailure"] },
        casterChoiceSentence: lead,
        optionConditions: true,
        clears: ["manual:attitude-or-hostility", "manual:conditional-effect", "manual:secondary-save"],
        reminders: [{ kind: "third-party-note", text: "The spell has the visual trait if the caster chose appearance, or the auditory trait if voice.", sourceText: lead }],
        preambleClaims: [lead],
        interpretation: "Beguile: the caster's pick on the card; the conditions last the sustained spell; the hostile action ending them, the critical failure's restriction and turn-start save, its move and the adjacency's Off-Guard are the GM's.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}
const cloneEffects = effects => JSON.parse(JSON.stringify(effects ?? []));

// Dream Come True (Oracles+): "Choose either fantasy or nightmare when you Cast the Spell …" with rows "The target is Off-Guard until the end of your next turn. If you
// chose a fantasy, the target is also Stupefied 1 for as long as it is off-guard. If you chose a nightmare, the target is Frightened 1 in addition to being off-guard
// and it cannot reduce its frightened condition below 1 while off-guard from this effect. The target can attempt to disbelieve the effect with a single action with the
// concentrate trait." / "As success, except the duration of the off-guard condition is 1 minute." / "As failure, except the frightened and stupefied values increase to
// 2. If you chose fantasy, the target is Fascinated by the effect and the fascinated condition does not end until the target disbelieves the illusion. If you chose
// nightmare, the target is also Confused for as long as it is frightened." — the caster's pick on the card; Off-Guard for the row's time, Stupefied (fantasy) for the
// same time; Frightened (nightmare) with its floor of 1 for that time; Fascinated until disbelieved and Confused while frightened on a critical failure; disbelief the GM's.
const DREAM = {
    choose: /Choose either fantasy or nightmare when you Cast the Spell and the target must attempt a (Fortitude|Reflex|Will) save as you create figments from one of its dreams\.$/,
    success: /^The target is (?:@UUID\[[^\]]+\]\{Off-Guard\}|Off-Guard) until the end of your next turn\. If you chose a fantasy, the target is also (?:@UUID\[[^\]]+\]\{Stupefied 1\}|Stupefied 1) for as long as it is off-guard\. If you chose a nightmare, the target is (?:@UUID\[[^\]]+\]\{Frightened 1\}|Frightened 1) in addition to being off-guard and it cannot reduce its frightened condition below 1 while off-guard from this effect\. The target can attempt to disbelieve the effect with a single action with the concentrate trait\.$/,
    failure: /^As success, except the duration of the off-guard condition is (\d+) minute\.$/,
    criticalFailure: /^As failure, except the frightened and stupefied values increase to (\d)\. If you chose fantasy, the target is (?:@UUID\[[^\]]+\]\{Fascinated\}|Fascinated) by the effect and the fascinated condition does not end until the target disbelieves the illusion\. If you chose nightmare, the target is also (?:@UUID\[[^\]]+\]\{Confused\}|Confused) for as long as it is frightened\.$/
};
function dreamRows(row, preamble, outcomes) {
    const lead = sentences(preamble).join(" ");
    const failure = DREAM.failure.exec(row("failure")), critical = DREAM.criticalFailure.exec(row("criticalFailure"));
    const base = slug => [...(outcomes?.criticalFailure?.effects ?? []), ...(outcomes?.success?.effects ?? [])].find(effect => effect.kind === "condition" && effect.slug === slug);
    if (!DREAM.choose.test(lead) || !DREAM.success.test(row("success")) || !failure || !critical || !/^The target is unaffected\.$/.test(row("criticalSuccess"))
        || !["off-guard", "stupefied", "frightened", "fascinated", "confused"].every(base)) return null;
    const round = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "source-turn", offset: 1, sourceText: "until the end of your next turn" };
    const minute = { mode: "fixed", value: Number(failure[1]) * 10, unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `${failure[1]} minute` };
    const condition = (slug, value, duration, option, degree) => {
        const { endsWhen, whileCondition, expirationMode, lifetimeProof, ...plain } = JSON.parse(JSON.stringify(base(slug)));
        return { ...plain, value, duration: duration ? { ...duration } : null, sourceText: row(degree), ...(duration ? { expirationMode: "duration" } : {}), ...(option ? { choiceGroup: "caster-option", option } : {}) };
    };
    // ("Stupefied 1 for as long as it is off-guard": it ends with the row's Off-Guard.)
    const whileOffGuard = (value, degree) => ({ ...condition("stupefied", value, null, "fantasy", degree), whileCondition: "off-guard", endsWhen: { event: "condition-removed", condition: "off-guard" } });
    const floor = (degree, duration) => ({ label: "Nightmare", sourceText: row(degree), claimsRow: true, choiceGroup: "caster-option", option: "nightmare", conditionFloor: { slug: "frightened", value: 1 },
        text: "Its frightened can't fall below 1 while it's off-guard from this spell.", duration: { ...duration } });
    const disbelief = (degree, duration, fascinated) => ({ label: "Dream come true", sourceText: row(degree), claimsRow: true, gmPlays: true, duration: { ...duration },
        text: `It can try to disbelieve the illusion with a single action with the concentrate trait (the GM sets the check); disbelieving ends these effects${fascinated ? " — and Fascinated (fantasy), which lasts until it disbelieves" : ""}.` });
    const value = Number(critical[1]);
    return {
        notes: {
            success: [floor("success", round), disbelief("success", round)],
            failure: [floor("failure", minute), disbelief("failure", minute)],
            criticalFailure: [floor("criticalFailure", minute), disbelief("criticalFailure", minute, true),
                { label: "Nightmare confusion", sourceText: row("criticalFailure"), claimsRow: true, choiceGroup: "caster-option", option: "nightmare", whileCondition: "frightened", duration: { mode: "unlimited" },
                    rules: [{ key: "GrantItem", uuid: `Compendium.pf2e.conditionitems.Item.${base("confused").reference ?? "yblD8fOR1J8rDwEQ"}`, flag: "conditionConfused", allowDuplicate: true, onDeleteActions: { grantee: "cascade" } }],
                    text: "Confused for as long as it's frightened." }]
        },
        effects: {
            success: [condition("off-guard", null, round, null, "success"), whileOffGuard(1, "success"), condition("frightened", 1, null, "nightmare", "success")],
            failure: [condition("off-guard", null, minute, null, "failure"), whileOffGuard(1, "failure"), condition("frightened", 1, null, "nightmare", "failure")],
            criticalFailure: [condition("off-guard", null, minute, null, "criticalFailure"), whileOffGuard(value, "criticalFailure"),
                condition("fascinated", null, { mode: "unlimited", value: null, unit: null }, "fantasy", "criticalFailure"), condition("frightened", value, null, "nightmare", "criticalFailure")]
        },
        casterChoice: { kind: "option", values: ["fantasy", "nightmare"], label: "Fantasy or nightmare", rows: ["success", "failure", "criticalFailure"] },
        casterChoiceSentence: lead,
        optionSets: true,
        rowDurations: true,
        clears: ["manual:perception-or-illusion", "manual:condition-floor", "manual:conditional-effect"],
        preambleClaims: [lead],
        interpretation: "Dream Come True: the caster's pick on the card; Stupefied lasts as Off-Guard does; the nightmare's frightened floor of 1 for that time; Confused while frightened; Fascinated until disbelieved; disbelief the GM's.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

// Dynamic Caustic Blast's one-action version (its table, glyph-versions.js): "The target's Hardness is reduced by N the next time it applies before the end of your next
// turn." on each failing row, with "Heightened (+2) The Hardness reduction increases by 1 on a success, by 3 on a failure, and by 6 on a critical failure." — a GM-played
// note (PF2e has no Hardness rule to lower once) whose amount is the cast rank's.
const HARDNESS = { row: /^The target.s Hardness is reduced by (\d+) the next time it applies before the end of your next turn\.$/,
    step: /Heightened \(\+(\d+)\) The Hardness reduction increases by (\d+) on a success, by (\d+) on a failure, and by (\d+) on a critical failure\./ };
function hardnessRows(row, heightenedText, baseRank) {
    const rows = ["success", "failure", "criticalFailure"].map(degree => HARDNESS.row.exec(row(degree)));
    const step = HARDNESS.step.exec(heightenedText ?? "");
    if (rows.some(match => !match) || !step || !/^The target is unaffected\.$/.test(row("criticalSuccess"))) return null;
    const note = (degree, index) => ({ label: "Caustic acid", sourceText: row(degree), claimsRow: true, gmPlays: true,
        text: "Its Hardness is reduced by {amount} the next time it applies before the end of the caster's next turn (the GM applies it).",
        rankAmount: { base: Number(rows[index][1]), step: Number(step[index + 2]), interval: Number(step[1]), baseRank: Number(baseRank) || 1, multiplier: 1 },
        duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "source-turn", offset: 1, sourceText: "before the end of your next turn" } });
    return {
        notes: { success: [note("success", 0)], failure: [note("failure", 1)], criticalFailure: [note("criticalFailure", 2)] },
        interpretation: "Dynamic Caustic Blast (one action): the Hardness reduction, once before the end of the caster's next turn, is a GM-played note at the cast rank's amount.",
        evidence: ["success", "failure", "criticalFailure"].map(row)
    };
}

/** The rows' generated Effects for the spells above, or null. */
// Planar Court (Clerics+): "You teleport yourself and your target to a court in another plane … You and your opponent vanish from the field until the start of their next
// turn. … You accuse the target of a transgression before the planar court, choosing one of its ability attributes to be punished in recompense and the target must attempt a
// Will save." with rows "… You become Doomed 1." / "The target leaves the planar court satisfied. They are unaffected and the spell ends." / "The court finds that your
// accusation has merit. The court punishes the target of your spell and the creature takes a –1 status penalty to all checks, DCs, and saves of the ability attribute you
// chose for as long as you Sustain the spell." / "… As failure, except the status penalty is –2." — the caster's pick of the attribute on the card; the failing rows a note
// for the sustained spell (the penalty to that attribute's checks and DCs: PF2e's "-based" selector); the caster Doomed 1 on a critical success; the vanishing the GM's.
const COURT = {
    lead: [/^You teleport yourself and your target to a court in another plane to rule on the fate of your opponent['’]s soul\.$/, /^(You and your opponent vanish from the field until the start of their next turn\.)$/,
        /^The court battle is often long and arduous for yourself and your opponent, though for others it appears in only a single instant\.$/,
        /^(You accuse the target of a transgression before the planar court, choosing one of its ability attributes to be punished in recompense) and the target must attempt a (Fortitude|Reflex|Will) save\.$/],
    criticalSuccess: /^Not only are your claims refuted, but they shed doubt on your own soul in front of the jury\. You become @UUID\[[^\]]+\]\{Doomed (\d)\}\.$/,
    success: /^The target leaves the planar court satisfied\. They are unaffected and the spell ends\.$/,
    failure: /^The court finds that your accusation has merit\. The court punishes the target of your spell and the creature takes a [–-](\d) status penalty to all checks, DCs, and saves of the ability attribute you chose for as long as you Sustain the spell\.$/,
    criticalFailure: /^The court lambasts the target, proclaiming them undeniably guilty\. As failure, except the status penalty is [–-](\d)\.$/
};
// (The row as written, its condition link kept: the clause the residual check compares.)
const rowRawText = (row, degree) => row(degree);
const ATTRIBUTES = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };
function courtRows(row, preamble, lifecycle) {
    const lead = sentences(preamble);
    const at = lead.findIndex(sentence => COURT.lead[0].test(sentence));
    const spell = spellTime(lifecycle);
    const critical = COURT.criticalSuccess.exec(row("criticalSuccess")), failure = COURT.failure.exec(row("failure")), worse = COURT.criticalFailure.exec(row("criticalFailure"));
    if (at < 0 || COURT.lead.some((re, index) => !re.test(lead[at + index] ?? "")) || !COURT.success.test(row("success")) || !critical || !failure || !worse || !spell?.sustained) return null;
    const notes = (degree, value) => Object.entries(ATTRIBUTES).map(([option, label]) => ({ label: `Planar court (${label})`, text: `A –${value} status penalty to ${label}-based checks, DCs and saves, while the spell is sustained.`,
        sourceText: row(degree), claimsRow: true, choiceGroup: "caster-option", option, duration: { ...spell }, rules: [{ key: "FlatModifier", selector: `${option}-based`, type: "status", value: -Number(value) }] }));
    return {
        notes: { success: [], failure: notes("failure", failure[1]), criticalFailure: notes("criticalFailure", worse[1]) },
        casterChoice: { kind: "option", values: Object.keys(ATTRIBUTES), label: "The ability attribute to punish", rows: ["failure", "criticalFailure"] },
        casterChoiceSentence: COURT.lead[3].exec(lead[at + 3])[1],
        court: true,
        casterConditions: { criticalSuccess: [{ slug: "doomed", value: Number(critical[1]), sourceText: sentences(rowRawText(row, "criticalSuccess"))[1] }] },
        narration: { criticalSuccess: [sentences(row("criticalSuccess"))[0]] },
        reminders: [{ kind: "third-party-note", text: `${lead[at + 1]} (The GM hides both tokens until the start of the target's next turn.) On a success, the spell ends: no Effect is made.`, sourceText: lead[at + 1] }],
        preambleClaims: lead.slice(at, at + 4),
        clears: ["sustain-effect"],
        interpretation: "Planar Court: the caster names the attribute on the card; the -based selector covers its checks, DCs and saves; the vanishing is the GM's.",
        evidence: ["criticalSuccess", "success", "failure", "criticalFailure"].map(row)
    };
}

export function compileThirdPartyRows(rowRaw, { descriptionHTML = "", rank = null, baseRank = null, lifecycle = {}, outcomes = {}, components = [] } = {}) {
    // (A row's own link to the module's Effect is not part of its rules.)
    const row = degree => rowRaw(degree).replace(/\s*@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[A-Za-z0-9]+\]\{[^}]+\}\s*$/, "").trim();
    const html = String(descriptionHTML ?? "");
    const preamble = htmlToPlainText(html.split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0])
        .replace(/^\s*Trigger\b.*?(?=\n|$)/, "").replace(/^\s*Domain\s+\S+(?:\s+\([^)]*\))?\s*/, "");
    const heightenedText = htmlToPlainText(html.split(/<hr\s*\/?>/i).slice(1).join(" ").replace(/^[\s\S]*?(?=<p><strong>Heightened)/, "").replace(/<p>@UUID[^<]*<\/p>/g, "")).replace(/\s+/g, " ");
    return cursedMark(row) ?? nextAttackOffGuard(row) ?? courtRows(row, preamble, lifecycle) ?? carelessRows(row, preamble) ?? drownRows(row, preamble, lifecycle) ?? hardnessRows(row, heightenedText, baseRank) ?? dreamRows(row, preamble, outcomes) ?? beguileRows(row, preamble, lifecycle, outcomes) ?? adjudicationRows(row, outcomes) ?? webRows(row, preamble, heightenedText, lifecycle, outcomes) ?? rulerRows(row) ?? outbreakRows(row, lifecycle) ?? juryRows(row, heightenedText) ?? slumberRows(row, lifecycle, outcomes) ?? towRows(row, preamble, lifecycle) ?? shadeRows(row, preamble, heightenedText, baseRank) ?? bewilderRows(row, preamble, lifecycle) ?? sensoryRows(row, lifecycle, html) ?? nighRows(row, lifecycle, outcomes) ?? silenceRows(row) ?? concentrateRows(row) ?? crowdRows(row) ?? glyphRows(row, heightenedText, baseRank) ?? hemophiliaRows(row, heightenedText, baseRank, lifecycle) ?? creepingRows(row, preamble, heightenedText, baseRank, components) ?? ravagingRows(row, preamble, heightenedText, baseRank, components, lifecycle) ?? echoRows(row, { lifecycle, components, baseRank }) ?? demandCompliance(row, preamble, lifecycle)
        ?? goldenTouch(row, preamble, /Heightened/.test(heightenedText) ? heightenedText : "", { rank, baseRank, lifecycle, outcomes });
}

// ---------------------------------------------------------------------------------------------------------------------
// The module's own Effect at a degree: its degree ChoiceSet ("Success"/"Failure"/"Critical Failure" or PF2e's degree labels, a value or
// an object of values; or a rollOption choice of degree strings), its other ChoiceSets at the stated choice (Golden Touch's creature), the
// rules active then with the selection read in, values at the rank. Null when it can't be read.
const DEGREE_LABEL = { "Success": "success", "Failure": "failure", "Critical Failure": "criticalFailure", "PF2E.Check.Result.Degree.Check.success": "success",
    "PF2E.Check.Result.Degree.Check.failure": "failure", "PF2E.Check.Result.Degree.Check.criticalFailure": "criticalFailure" };
const DEGREE_OPTION = { success: "success", failure: "failure", criticalFailure: "critical-failure" };

function holds(term, options) {
    if (typeof term === "string") return options.has(term);
    if (Array.isArray(term?.or)) return term.or.some(entry => holds(entry, options));
    if (Array.isArray(term?.and)) return term.and.every(entry => holds(entry, options));
    if (term?.not != null) return !holds(term.not, options);
    if (Array.isArray(term?.eq)) return String(term.eq[0]) === String(term.eq[1]);
    return null;
}

export function moduleEffectAt(rules, degree, { rank, picks = {} } = {}) {
    if (!Array.isArray(rules)) return null;
    let selections = {}, options = new Set();
    const choiceSets = rules.filter(rule => rule.key === "ChoiceSet");
    for (const choice of choiceSets) {
        const byDegree = (choice.choices ?? []).find(entry => DEGREE_LABEL[entry?.label] === degree || (choice.rollOption && entry?.value === DEGREE_OPTION[degree]));
        const degreeShaped = (choice.choices ?? []).some(entry => DEGREE_LABEL[entry?.label] || Object.values(DEGREE_OPTION).includes(entry?.value));
        const value = degreeShaped ? byDegree?.value : picks[choice.rollOption ?? choice.flag];
        if (value === undefined) return degreeShaped ? { offered: false } : null;
        if (choice.flag) selections[choice.flag] = value;
        if (choice.rollOption) options.add(`${choice.rollOption}:${value}`);
    }
    const read = expression => {
        let text = String(expression);
        for (const [flag, value] of Object.entries(selections)) {
            for (const [path, inner] of typeof value === "object" && value ? Object.entries(value).map(([key, entry]) => [`${flag}.${key}`, entry]) : [[flag, value]])
                for (const form of [`@item.flags.pf2e.rulesSelections.${path}`, `{item|flags.pf2e.rulesSelections.${path}}`, `@item.flags.system.rulesSelections.${path}`, `{item|flags.system.rulesSelections.${path}}`])
                    text = text.split(form).join(`(${inner})`);
        }
        return text;
    };
    const active = [];
    for (const rule of rules) {
        if (rule.key === "ChoiceSet") continue;
        const predicate = (rule.predicate ?? []).map(term => typeof term === "object" && Array.isArray(term.eq) ? { eq: term.eq.map(read) } : term)
            .map(term => typeof term === "object" && Array.isArray(term.eq) ? { eq: term.eq.map(entry => String(entry).replace(/^\((.*)\)$/, "$1")) } : term);
        const results = predicate.map(term => holds(term, options));
        if (results.some(result => result === null)) return null;
        if (!results.every(Boolean)) continue;
        const value = rule.value == null ? null : (() => { const text = read(rule.value).replace(/@item\.(?:level|rank)|\{item\|level\}/g, String(rank));
            return /^[\d+\-*/(). ]+$/.test(text) ? Function(`return (${text});`)() : null; })();
        if (rule.value != null && !Number.isFinite(value)) return null;
        active.push({ ...rule, ...(rule.value != null ? { value } : {}) });
    }
    return { offered: true, active };
}

/** Whether the module's active rules state the same modifiers as the text's (Weakness by type at its highest, FlatModifiers by selector). */
export function sameStatedRules(moduleRules, textRules, rank = null) {
    const atRank = value => typeof value === "number" ? value : /^[\d+\-*/(). @a-z.]+$/.test(String(value)) && rank != null
        ? (() => { const text = String(value).replace(/@item\.(?:level|rank)/g, String(rank)); return /^[\d+\-*/(). ]+$/.test(text) ? Function(`return (${text});`)() : null; })() : null;
    const atoms = rules => {
        const out = new Map();
        for (const raw of rules) {
            const rule = raw.value != null ? { ...raw, value: atRank(raw.value) } : raw;
            if (rule.key === "Weakness") for (const type of [rule.type].flat()) out.set(`weakness:${type}`, Math.max(out.get(`weakness:${type}`) ?? 0, rule.value));
            else if (rule.key === "FlatModifier") for (const selector of [rule.selector].flat()) out.set(`modifier:${selector === "saves" ? "saving-throw" : selector}:${rule.type}:${JSON.stringify(rule.predicate ?? null)}`, rule.value);
            else if (rule.key === "RollTwice") out.set(`twice:${[rule.selector].flat().join(",")}:${rule.keep}`, rule.removeAfterRoll === true);
            else if (rule.key === "GrantItem") out.set(`grant:${rule.uuid}`, true);
            else return null;
        }
        return out;
    };
    const a = atoms(moduleRules), b = atoms(textRules);
    return !!a && !!b && a.size === b.size && [...a].every(([key, value]) => b.get(key) === value);
}

// Grand Finale: "Choose a single creature affected by the required spell, a single square within the area of the required spell, or yourself if the
// spell does not target creatures or an area. You end the required spell and its effect immediately, creating an explosion that deals 4d12 fire
// damage and 4d6 sonic damage." — the card's reminder: the caster ends the other spell (its Effects are removed) and centres the area there.
const FINALE = [/^Choose a single creature affected by the required spell, a single square within the area of the required spell, or yourself if the spell does not target creatures or an area\.$/,
    /^You end the required spell and its effect immediately, creating an explosion that deals \d+d\d+ [a-z]+ damage and \d+d\d+ [a-z]+ damage\.$/];

/** Reminders for sentences before a third-party table that only the caster or GM can carry out. */
export function compileThirdPartyReminders(descriptionHTML, area) {
    const lead = sentences(htmlToPlainText(String(descriptionHTML ?? "").split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0]));
    const at = lead.findIndex(sentence => FINALE[0].test(sentence));
    if (at < 0 || !FINALE[1].test(lead[at + 1] ?? "") || area?.type !== "emanation") return null;
    return { reminders: [{ kind: "required-spell", text: `Centre the ${area.value}-foot emanation on a creature affected by the required spell, a square in its area, or the caster (if it has neither); end the required spell (remove its Effects), then target the creatures in the area.`,
        sourceText: lead[at] }], claims: [lead[at], lead[at + 1]] };
}

// The Witches+ hexes' repeated save: "The creature attempts a Will save when you Cast the Spell and the first time you Sustain the spell on subsequent
// rounds (each round), suffering the listed effects." — the cast's save card again on the caster's first Sustain each round, up to the spell's maximum
// (the cast message's "Sustain: Again"); a row that ends the spell ("The target is unaffected and the spell immediately ends.", "… then the spell ends.")
// closes the repeats.
const RESAVE = /^The creature attempts an? (Fortitude|Reflex|Will) save when you Cast the Spell and the first time you Sustain the spell (?:on subsequent rounds|each round), suffering the listed effects\.$/;
const ENDS = /(?:^|,? and |,? then |^)the spell (?:immediately )?ends\.$/i;
export function compileSustainResave(descriptionHTML, { statistic, lifecycle }) {
    const lead = sentences(htmlToPlainText(String(descriptionHTML ?? "").split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0]));
    const sentence = lead.find(entry => RESAVE.test(entry));
    const spec = lifecycle?.durationSpec;
    if (!sentence || RESAVE.exec(sentence)[1].toLowerCase() !== statistic || spec?.mode !== "sustained" || spec.maximum?.mode !== "fixed") return null;
    const rounds = Number(spec.maximum.value) * ({ rounds: 1, minutes: 10, hours: 600 }[spec.maximum.unit] ?? NaN);
    if (!Number.isInteger(rounds) || rounds < 1) return null;
    return { repeatable: { window: "sustain", save: true, attacks: Math.min(101, rounds + 1), actions: 1, onCast: true, sourceText: sentence }, sentence };
}
/** Whether a row's last clause ends the spell ("… and the spell immediately ends.", "The spell immediately ends."). */
export const rowEndsSpell = text => ENDS.test(String(text ?? "").trim());

// Judge Soul (Witches+), before the table: "Your word is final when you judge the souls of others. Choose a target in range. The effect depends on whether the
// target is living or undead." (narration) / "The target takes 6d6 void damage or 6d6 vitality damage if it has void healing along with the listed effects
// depending on its save." (the item's data says bludgeoning: the text's void, vitality for an undead or void-healing creature) / "A creature reduced to 0 Hit
// Points by this spell dies or is destroyed permanently if it was undead and the target can't be returned to life or unlife through any means, except for
// powerful magic such as a Wish ritual." (death at 0 Hit Points; the rest a GM note) / the paragraph about shades and the caster's reincarnation (a GM note).
const JUDGE = [/^Your word is final when you judge the souls of others\.$/, /^Choose a target in range\.$/, /^The effect depends on whether the target is living or undead\.$/,
    /^The target takes (\d+d\d+) void damage or \1 vitality damage if it has void healing along with the listed effects depending on its save\.$/,
    /^A creature reduced to 0 Hit Points by this spell dies or is destroyed permanently if it was undead and the target can't be returned to life or unlife through any means, except for powerful magic such as a @UUID\[[^\]]+\]\{Wish\} ritual\.$/];
const SHADES = [/^All creatures who die or are destroyed by this spell become shades in the realm of your patron\.$/,
    /^If you have Cast this spell at least once that resulted in the death of another, when you die you are reincarnated as a celestial, fiend, elemental, hag, or other entity appropriate to your patron\.$/,
    /^As per usual rules, you likely only remember your past life like a dream in this way\.$/];
export function compileJudgeLead(descriptionHTML, components) {
    const lead = String(descriptionHTML ?? "").split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0];
    const paragraphs = [...lead.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => sentences(htmlToPlainText(match[1])));
    if (paragraphs.length !== 2) return null;
    const [first, second] = paragraphs;
    const main = first.filter(sentence => !RESAVE.test(sentence));
    if (main.length !== JUDGE.length || !main.every((sentence, index) => JUDGE[index].test(sentence)) || second.length !== SHADES.length || !second.every((sentence, index) => SHADES[index].test(sentence))) return null;
    const dice = JUDGE[3].exec(main[3])[1];
    const component = components?.length === 1 && !components[0].category && String(components[0].formula).replace(/\s+/g, "") === dice ? components[0] : null;
    if (!component) return null;
    return {
        damageTypeFrom: { kind: "text", type: "void", sourceText: main[3] },
        damageSwap: { from: "void", to: "vitality", when: "undead-or-void-healing", sourceText: main[3] },
        death: main[4],
        reminders: [{ kind: "spell-note", text: "A creature this spell reduces to 0 Hit Points dies (an undead is destroyed) permanently: it can't be returned to life or unlife except by magic such as a Wish ritual. It becomes a shade in the realm of the caster's patron; once the spell has killed, the caster is reincarnated as an entity of the patron when they die.", sourceText: main[4] }],
        claims: [...main, ...second],
        componentId: component.id
    };
}
