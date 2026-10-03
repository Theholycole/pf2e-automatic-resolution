// A ritual's confirmed result applied as actions (the ritual workflow decision: the ceremony and its checks are the GM's; the module starts from the confirmed
// degree). Every sentence of the body, the four results and the Heightened entries is read: a sentence with no rule words is the GM's note; a sentence with rule
// words must be one of the readers below, which turn it into actions on the primary caster ("you"), all casters, the secondary casters, or the creatures the GM
// targets (the ritual's target, "each living creature in the area", …):
//   - a condition for a stated time ("All casters become {Doomed 1} for 1 week.", "… leaves you {Stupefied 1} for 24 hours.", "the casters are all {Stupefied 4}
//     for 1 week"), or locked at its value ("… becomes {Sickened 2} and can't reduce the value of this condition for 24 hours.");
//   - a condition while an outcome lasts ("… renders the target {Stupefied 2} while within.");
//   - damage with a basic save ("… dealing @Damage[(4d12+26)[force]] damage to all secondary casters (@Check[reflex|dc:26|basic] save).");
//   - the outcome recorded on the target (an Effect carrying the sentence: "The target is trapped within …", the spirit's sequestering with its counteract threshold);
//   - a rolled time ("[[/r 1d6 #days]]");
//   - "As critical success, but …" / "As failure, and …" / "As failure, but in addition, …": that result's actions, then the rest;
//   - a stated outcome the GM tracks (the portal's, the plane's, the food's) — the GM's note, read by its own pattern.
import { htmlToPlainText } from "./description-parser.js";

const RULE_WORDS = /\d|@|\[\[|\b(?:damage|saves?|saving throws?|checks?|DCs?|bonus|penalty|conditions?|immune|immunity|Hit Points|attacks?|Speeds?|weakness|resistance)\b/i;
const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)(?: (\d))?\}`;
const UNIT = { hour: 3600, hours: 3600, day: 86400, days: 86400, week: 604800, weeks: 604800, month: 2592000, months: 2592000, year: 31536000, years: 31536000 };
const LABELS = { "Critical Success": "criticalSuccess", Success: "success", Failure: "failure", "Critical Failure": "criticalFailure" };
// (A note's text with PF2e's links read as their labels.)
const plain = text => htmlToPlainText(text).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+([,.])/g, "$1");
const G = String.raw`(?:<em>)?geas(?:<\/em>)?`;
// (The obligation recorded with its strain: the Sickened it gives while the creature can't comply, raised a day at a time, ended by complying.)
const geasMark = (who, context) => ({ type: "mark", who, name: "under the geas", seconds: 0, strain: context.strain,
    text: `Under the geas. Unable to fulfill it: ${context.strain.name} ${context.strain.start}, +1 for each consecutive day (at most ${context.strain.max}); it ends only when the creature follows the geas again.` });
// (A disease's name as the text repeats it: "the witch's hunger", any apostrophe.)
const sameName = (left, right) => String(left).toLowerCase().replace(/[’']/g, "'").replace(/^the /, "").trim() === String(right).toLowerCase().replace(/[’']/g, "'").replace(/^the /, "").trim();
const carrier = (context, virulent) => ({ type: "carrier", who: "primary", virulent, radius: context.carrier.radius, seconds: context.seconds });
// An affliction's stage: its conditions, death, or the text's contagion note, and its time ("Enfeebled 3, sickened 3, and a creature who … (1 day)").
const CONDITION_SLUGS = new Set(["blinded", "clumsy", "confused", "dazzled", "deafened", "doomed", "drained", "enfeebled", "fatigued", "frightened", "paralyzed", "sickened", "slowed", "stunned", "stupefied", "unconscious", "wounded", "off-guard", "immobilized", "petrified"]);
const TIME_UNITS = { round: "rounds", minute: "minutes", hour: "hours", day: "days", week: "weeks" };
export function readStage(text) {
    const plainText = plain(text).replace(/\s+/g, " ").trim();
    const timed = /^(.*?)\s*\((\d+|\d+d\d+) (rounds?|minutes?|hours?|days?|weeks?)\)$/.exec(plainText);
    const body = timed ? timed[1] : plainText;
    const stage = { conditions: [], duration: timed ? { value: /d/.test(timed[2]) ? timed[2] : Number(timed[2]), unit: TIME_UNITS[timed[3].replace(/s$/, "")] } : null, death: false, notes: [] };
    for (const part of body.split(/,\s*(?:and\s+)?|\s+and\s+/).map(entry => entry.trim()).filter(Boolean)) {
        const named = /^([A-Za-z-]+)(?: (\d+))?$/.exec(part);
        if (named && CONDITION_SLUGS.has(named[1].toLowerCase())) { stage.conditions.push({ slug: named[1].toLowerCase(), value: named[2] ? Number(named[2]) : null }); continue; }
        if (/^death$/i.test(part)) { stage.death = true; continue; }
        if (/^a creature who comes into physical contact with the (?:afflicted|corpse) is exposed to [a-z' ]+$/i.test(part)) { stage.notes.push(part); continue; }
        return null;
    }
    return stage;
}
/** The ritual's own affliction block: name, traits, level, save, onset, stages; null when a line isn't read. */
export function readAfflictionBlock(paragraphs) {
    const head = /^<strong>([^<]+)<\/strong>\s*\(([a-z, ]+)\)(?:\s*Level (\d+))?$/i.exec(paragraphs[0] ?? "");
    if (!head) return null;
    const block = { name: plain(head[1]).trim(), traits: head[2].split(",").map(trait => trait.trim().toLowerCase()), level: head[3] ? Number(head[3]) : null, save: null, onset: null, stages: [] };
    for (const paragraph of paragraphs.slice(1)) {
        const line = /^<strong>(Saving Throw|Onset|Stage (\d+))<\/strong>\s*([\s\S]*)$/.exec(paragraph);
        if (!line) return null;
        if (line[1] === "Saving Throw") {
            const check = /^@Check\[(fortitude|reflex|will)\|dc:(\d+)\]$/i.exec(line[3]) ?? /^(Fortitude|Reflex|Will)$/i.exec(line[3]);
            if (!check) return null;
            block.save = { statistic: check[1].toLowerCase(), dc: check[2] ? Number(check[2]) : null };
        } else if (line[1] === "Onset") {
            const onset = /^(?:\[\[\/r (\d+d\d+) #(hours|days|minutes)\]\]\{[^}]+\}|(\d+) (minutes?|hours?|days?))$/.exec(line[3].trim());
            if (!onset) return null;
            block.onset = onset[1] ? { value: onset[1], unit: onset[2] } : { value: Number(onset[3]), unit: TIME_UNITS[onset[4].replace(/s$/, "")] };
        } else {
            if (Number(line[2]) !== block.stages.length + 1) return null;
            const stage = readStage(line[3]);
            if (!stage) return null;
            block.stages.push(stage);
        }
    }
    return block.save && block.stages.length ? block : null;
}
const condition = (who, match, seconds, extra = {}) => ({ type: "condition", who, uuid: match[1], name: match[2], value: match[3] ? Number(match[3]) : null, seconds, ...extra });

// Each reader: [pattern, (match, context) => actions]. A reader returning [] claims the sentence as the GM's note.
const READERS = [
    // Conditions.
    [new RegExp(String.raw`^All casters become ${C} for (\d+) (hours?|days?|weeks?|months?)\.$`), m => [condition("casters", m, Number(m[4]) * UNIT[m[5]])]],
    [new RegExp(String.raw`^the casters are all ${C} for (\d+) (hours?|days?|weeks?|months?)\.?$`), m => [condition("casters", m, Number(m[4]) * UNIT[m[5]])]],
    [new RegExp(String.raw`^You fail to [a-z ]+, and magical backlash leaves you ${C} for (\d+) (hours?|days?)\.$`), m => [condition("primary", m, Number(m[4]) * UNIT[m[5]])]],
    [new RegExp(String.raw`^Each living creature in the area becomes ${C} and can't reduce the value of this condition for (\d+) (hours?|days?)\.$`), m => [condition("targets", m, Number(m[4]) * UNIT[m[5]], { lock: true, living: true })]],
    [new RegExp(String.raw`^the twisted space renders the target ${C} while within\.?$`), m => [condition("target", m, 0)]],
    // Damage with a basic save, after the outcome the GM tracks.
    [/^(You sever [^,]+), but the ritual backfires, dealing @Damage\[\(?([0-9d+ ]+?)\)?\[([a-z]+)\]\] damage to all secondary casters \(@Check\[(reflex|fortitude|will)\|dc:(\d+)\|basic\] save\)\.$/,
        m => [{ type: "note", text: `${m[1]}.` }, { type: "damage", who: "secondaries", formula: m[2].replace(/\s+/g, ""), damageType: m[3], save: { statistic: m[4], dc: Number(m[5]), basic: true } }]],
    // ("The ritual backfires as a failure but doesn't sever …": the failure's damage, not its outcome.)
    [/^The ritual backfires as a failure but doesn't ([^.]+)\.$/, (m, context) => [...(context.degrees.failure ?? []).filter(action => action.type === "damage"), { type: "note", text: `The ritual doesn't ${m[1]}.` }]],
    // The outcome recorded on the target.
    [/^The target is trapped within the ([a-z ]+) for the duration of ritual\.$/, m => [{ type: "mark", who: "target", name: `trapped in the ${m[1]}`, text: m[0], seconds: 0 }]],
    [/^Attempts to communicate with the dead creature, return it to life, turn it into an undead, or otherwise disturb its afterlife fail unless the effect's counteract rank is at least (\d+) higher than that of [a-z ]+ or originates from an artifact or a deity\.$/,
        m => [{ type: "mark", who: "target", name: "spirit sequestered", text: m[0], seconds: 0, rankAbove: Number(m[1]) }]],
    [/^effects to interact with the spirit fail unless the effect's counteract rank is higher than that of [a-z ]+ or originates from an artifact or a deity\.$/,
        () => [{ type: "mark", who: "target", name: "spirit sequestered", text: `Effects to interact with the spirit fail unless the effect's counteract rank is higher than the ritual's or originates from an artifact or a deity.`, seconds: 0, rankAbove: 1 }]],
    // A rolled time.
    [/^if the portal's other side is not awakened, this side remains awakened for only \[\[\/r (\d+d\d+) #days\]\]\{[^}]+\} before it fades and falls dormant again\.$/,
        m => [{ type: "roll", formula: m[1], label: "days the portal stays awake if its other side isn't" }]],
    // A GM's choice between outcomes (Mindscape Door): mental feedback to all casters with a basic save, or casters pulled in.
    [/^The GM decides whether mental feedback deals @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage to all ritual casters \(@Check\[(will|fortitude|reflex)\|dc:(\d+)\|basic\]\) or (\d+d\d+) casters are unwillingly pulled into the mindscape \(or ejected from it\)\.$/,
        m => [{ type: "choice", label: "The GM decides", options: [
            { key: "feedback", label: "Mental feedback", actions: [{ type: "damage", who: "casters", formula: m[1], damageType: m[2], save: { statistic: m[3], dc: Number(m[4]), basic: true }, stepped: true }] },
            { key: "pulled", label: `${m[5]} casters pulled in (or ejected)`, actions: [{ type: "roll", formula: m[5], label: "casters unwillingly pulled into the mindscape (or ejected from it)" }] }] }]],
    // Astral Projection: the stronger silver cord; the catastrophe.
    [/^Each target's silver cord is stronger than usual, providing them a \+(\d) (circumstance|status) bonus to its Fortitude save to avoid dying if its astral form dies\.$/,
        m => [{ type: "bonus", who: "targets", name: "strong silver cord", seconds: 0, text: m[0], toggle: "Your astral form died: the save against dying",
            rules: [{ key: "FlatModifier", selector: "fortitude", type: m[2], value: Number(m[1]) }] }]],
    [new RegExp(String.raw`^All casters become ${C}, are immediately reduced to 0 Hit Points, and begin dying\.?$`), m => [{ type: "permanent", who: "casters", name: m[2], value: m[3] ? Number(m[3]) : null }, { type: "knockout", who: "casters" }]],
    // Oblivious Expulsion: the target's memories, how hard the spell is to detect, the target's immunity.
    [/^The ritual removes all memories of [^.]+ from the target's memory\.$/, m => [{ type: "mark", who: "target", name: "memories removed", text: m[0], seconds: 0 }]],
    [/^The spell is hard to detect: a @UUID\[[^\]]+\]\{Detect Magic\} spell or similar effect must be a higher rank than (?:<em>)?[a-z ]+(?:<\/em>)? to detect it\.$/,
        () => [{ type: "mark", who: "target", name: "hard to detect", text: "A Detect Magic spell or similar effect must be of a higher rank than the ritual to detect it.", seconds: 0 }]],
    [/^the spell isn't harder to detect with (?:<em>)?detect magic(?:<\/em>)? ?\.$/, () => [{ type: "drop", name: "hard to detect" }]],
    [/^The ritual fails, and the target is temporarily immune for (\d+) (months?|years?|days?)\.$/, m => [{ type: "mark", who: "target", name: "immune to the ritual", text: m[0], seconds: Number(m[1]) * UNIT[m[2]] }]],
    // Garden of Death: the casters' bonus (PF2e's Effect), not on a success.
    // (Fortifying Brew: the drinkers', its result's choice preselected; the text's numbers kept to check against PF2e's Effect.)
    [/^@UUID\[Compendium\.pf2e\.spell-effects\.Item\.([^\]]+)\]\{(Spell Effect: [^}]+)\}$/, (m, context) => [context.brew ? { type: "native", who: "targets", name: m[2], selection: "critical-success",
        proof: { tempHP: context.brew.tempHP, bonus: context.brew.bonus, seconds: context.brew.seconds } } : { type: "native", who: "casters", name: m[2] }]],
    [/^A poisonous garden forms, and you and the secondary casters gain a \+\d circumstance bonus to Nature or Crafting checks to deal with the plants or animals, such as feeding them or harvesting poison from them\.$/, () => []],
    [/^without the circumstance bonus when interacting with the garden\.$/, () => [{ type: "drop", kind: "native" }]],
    // Call Spirit: the spirit's penalty (on its token, when the GM targets one).
    [/^The spirit is particularly cooperative, and even if it has strong reasons to deceive you, it takes a -(\d) (circumstance|status) penalty to its Deception checks\.$/,
        m => [{ type: "bonus", who: "target", optional: true, name: "cooperative spirit", seconds: 0, text: m[0], rules: [{ key: "FlatModifier", selector: "deception", type: m[2], value: -Number(m[1]) }] }]],
    // Rune Trap: the backfire by the stored spell's rank (the GM's), to the casters and the creatures near the area (targeted).
    [/^The rune backfires, dealing (\d+)d(\d+) ([a-z]+) damage per rank of the rune's spell to you, the secondary caster, and all creatures within \d+ feet of the ritual's area\.?$/,
        m => [{ type: "damage", who: "castersAndTargets", formula: null, perRank: { dice: Number(m[1]), faces: Number(m[2]) }, damageType: m[3], save: null, input: "storedRank" }]],
    // Portrait of Spite: the punishment chosen (one of the conditions), the value by the target's save; on a critical failure, the casters take it as a critical success.
    [/^Once the portrait is complete, .+ choosing from the clumsy, enfeebled, drained, or stupefied condition\. ?The target must attempt a Will saving throw\.$/, m => [{ type: "note", text: htmlToPlainText(m[0]).replace(/\.(?=\S)/, ". ") }]],
    [/^The target suffers the effects over the course of (\d+d\d+) hours, during which time .+$/, (m, context) => { context.onset = m[1]; return [{ type: "note", text: htmlToPlainText(m[0]) }]; }],
    [new RegExp(String.raw`^The target is either ${C}, ${C}, ${C}, or ${C}, depending on the punishment you chose\.$`), (m, context) => {
        const options = [0, 1, 2, 3].map(index => ({ uuid: m[1 + index * 3], name: m[2 + index * 3], value: Number(m[3 + index * 3]) }));
        if (options.some(option => !option.value || option.value !== options[0].value)) return null;
        return [{ type: "punish", who: "target", options: options.map(({ uuid, name }) => ({ uuid, name })), degreeValues: { failure: options[0].value, criticalFailure: options[0].value }, seconds: context.seconds, onset: context.onset ?? null }];
    }],
    [/^On a successful (Will|Fortitude|Reflex) save, the condition value is (\d), and the target is unaffected on a critical success\.$/,
        m => [{ type: "amend", kind: "punish", statistic: m[1].toLowerCase(), degreeValues: { success: Number(m[2]), criticalSuccess: 0 } }]],
    [/^Over the course of the next (\d+d\d+) hours, you and the secondary casters experience the curse you had intended to place upon the target with the effects of a critical success\.$/,
        (m, context) => { const cursed = (context.degrees.criticalSuccess ?? []).filter(action => action.type === "punish"); return cursed.length ? cursed.map(action => ({ ...structuredClone(action), who: "casters", onset: m[1] })) : null; }],
    // Geas: the target's geas (its Sickened while it can't comply: the card's controls), the skill bonus when upholding it, the caster's own geas.
    [new RegExp(String.raw`^If the target is unable to fulfill the ${G}, it becomes ${C}, and the sickened condition increases by 1 for each consecutive day it is prevented from following the ${G}, to a maximum of sickened (\d)\.$`),
        (m, context) => { context.strain = { uuid: m[1], name: m[2], start: Number(m[3]), max: Number(m[4]) }; return [{ type: "note", text: plain(m[0]) }]; }],
    [new RegExp(String.raw`^The ${G} succeeds\.$`), (_m, context) => context.strain ? [geasMark("target", context)] : null],
    [new RegExp(String.raw`^The ${G} succeeds, and the target receives a \+(\d) (status|circumstance) bonus to skill checks that directly uphold the ${G} \(at the GM's discretion\)\.$`), (m, context) => context.strain ? [geasMark("target", context),
        { type: "bonus", who: "target", name: "upholding the geas", seconds: 0, text: htmlToPlainText(m[0]), toggle: "This skill check directly upholds the geas", rules: [{ key: "FlatModifier", selector: "skill-check", type: m[2], value: Number(m[1]) }] }] : null],
    [new RegExp(String.raw`^The ${G} fails, and you are instead affected by the ${G} you were attempting to place on the target\.$`), (_m, context) => context.strain ? [geasMark("primary", context)] : null],
    // Brews and teas (Fortifying Brew, Winter's Breath): the spells the drink casts on each drinker (the GM's control per spell, the counteract from the primary skill);
    // the drinkers' temporary Hit Points and bonus (PF2e's Effect where it has one); the spoiled drink's locked Sickened on you and the drinkers.
    [/^(?:It|The tea) casts (.+?) on each (?:drinker|guest)(?: for each relevant affliction or condition, using your modifier for the primary skill check as the counteract modifier)?\.$/, m => {
        const spells = [...m[1].matchAll(/(?:a (\d+)(?:st|nd|rd|th)-rank )?@UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\}/g)].map(entry => ({ uuid: entry[2], name: entry[3], rank: entry[1] ? Number(entry[1]) : null }));
        const rest = m[1].replace(/(?:a (\d+)(?:st|nd|rd|th)-rank )?@UUID\[[^\]]+\]\{[^}]+\}/g, "").replace(/<\/?em>/g, "");
        if (spells.length < 2 || !/^(?:,\s*)*(?:,?\s*and\s*)?(?:at a rank equal to that which [a-z' ]+ was cast)?\s*$/.test(rest)) return null;
        const atCast = /at a rank equal to that which/.test(rest);
        if (spells.some(spell => (spell.rank == null) !== atCast)) return null;
        return [{ type: "cast", who: "targets", spells, modifier: "primary" }];
    }],
    [/^Each drinker also gains (\d+) temporary Hit Points that last (\d+) hours and a \+(\d) status bonus to saves against diseases and poisons for the next \2 hours\.$/,
        (m, context) => { context.brew = { tempHP: Number(m[1]), seconds: Number(m[2]) * 3600, bonus: Number(m[3]) }; return []; }],
    [/^drinkers gain only (\d+) temporary Hit Points, and don't gain the status bonus to saves\.$/, m => [{ type: "amend", kind: "native", selection: "success", proof: { tempHP: Number(m[1]), bonus: 0 } }]],
    [/^Each guest also gains (\d+) temporary Hit Points and a \+(\d) status bonus to saves against emotion effects for the next (\d+) hours\.$/, m => [{ type: "bonus", who: "targets", name: "the tea's comfort", seconds: Number(m[3]) * 3600,
        text: m[0], rules: [{ key: "TempHP", value: Number(m[1]) }, { key: "FlatModifier", selector: "saving-throw", type: "status", value: Number(m[2]), predicate: ["item:trait:emotion"] }] }]],
    [/^guests must choose which one of the (?:four|five) spells are cast on them, and they don't gain the status bonus to saves\.$/, () => [{ type: "amend", kind: "cast", choose: 1 }, { type: "amend", kind: "bonus", dropRules: ["FlatModifier"] }]],
    [new RegExp(String.raw`^You and (?:the other drinkers|your guests) (?:become|are) ${C} and can't reduce the condition for (\d+) (hours?|days?)\.$`), m => [condition("primaryAndTargets", m, Number(m[4]) * UNIT[m[5]], { lock: true })]],
    // A disease the ritual carries (Plague Shot, Mosquito Blight): the stage block is compiled (below); the ammunition's carrier, the infested area's controls and
    // the hive token; a creature exposed (at a later stage, or the caster).
    [/^In addition to its normal damage or other effects, a successful attack with a piece of the affected ammunition exposes every creature within a (\d+)-foot-radius emanation from the point of impact to ([a-z' ]+)\.$/i,
        (m, context) => { context.carrier = { radius: Number(m[1]), name: m[2] }; return [{ type: "note", text: m[0] }]; }],
    [/^The ([a-z' ]+) gains the virulent trait\.$/i, (m, context) => context.carrier && sameName(m[1], context.carrier.name) ? [carrier(context, true)] : null],
    [/^The ([a-z' ]+) is normal\.$/i, (m, context) => context.carrier && sameName(m[1], context.carrier.name) ? [carrier(context, false)] : null],
    [/^Each creature within a (\d+)-foot emanation centered on the primary caster is exposed to ([a-z' ]+) at stage (\d+)\.$/i,
        (m, context) => context.carrier && sameName(m[2], context.carrier.name) ? [{ type: "expose", who: "targets", stage: Number(m[3]), text: m[0] }] : null],
    [/^Arthropods \(insects, spiders, and similar invertebrates\) are unaffected and instead gain a \+(\d) status bonus to attack rolls, skill checks, saving throws, and Perception checks while within the area\.$/,
        (m, context) => { context.arthropods = { bonus: Number(m[1]), text: m[0] }; return [{ type: "note", text: m[0] }]; }],
    [/^All other creatures are harassed by insects and exposed to the disease ([a-z'’ ]+) when they enter the area and once per day thereafter that they remain in the area\.$/i,
        (m, context) => { context.infest = { name: m[1] }; return [{ type: "note", text: m[0] }]; }],
    [/^As part of casting this ritual, you create a (Tiny|Small) ritual insect hive \(Hardness (\d+), (\d+) HP\) that must remain in the ritual's area\.$/,
        (m, context) => { context.hive = { size: m[1].toLowerCase(), hardness: Number(m[2]), hp: Number(m[3]), endsAfter: null }; return [{ type: "note", text: m[0] }]; }],
    [/^If the hive is removed or destroyed, the ritual's effect ends (\d+) (hours?|minutes?) later\.$/,
        (m, context) => { if (!context.hive) return null; context.hive.endsAfter = Number(m[1]) * (/^hour/.test(m[2]) ? 3600 : 60); return [{ type: "note", text: m[0] }]; }],
    [/^You create the ritual hive and cast the ritual\.$/, (_m, context) => context.hive && context.infest ? [{ type: "infestation", who: "primary", seconds: context.seconds, hive: context.hive,
        arthropods: context.arthropods ?? null, stageOverride: null }] : null],
    [/^the disease is especially deadly, with Stage (\d) instead causing unconsciousness and Stage (\d) instead causing death\.$/,
        m => [{ type: "amend", kind: "infestation", stageOverride: { [m[1]]: "unconscious", [m[2]]: "death" } }]],
    [/^You fail to cast the ritual and instead cause ravenous insects to torment you, immediately exposing you to the ([a-z'’ ]+) disease\.$/i,
        (m, context) => context.infest && sameName(m[1], context.infest.name) ? [{ type: "expose", who: "primary", stage: 1, text: m[0] }] : null],
    // Secure Siege Weapons: the targeted siege weapons' Hardness and Hit Points (by their level) for the duration, with the caster's controls for an enemy operating
    // one (its save, or a misfortune on loading and striking) and for the targets of one an enemy launches (a fortune on their save); the backfire's Broken.
    [/^In addition, enemies who try to operate or move an affected mounted siege weapon or pick up an affected portable siege weapon must succeed at a @Check\[(will|fortitude|reflex)\|dc:(\d+)\] saving throw or be forced to roll twice and take the worse result on any check to Load or Strike with the siege weapon; this is a misfortune effect\.$/,
        (m, context) => { context.siege = { ...context.siege, commandeer: { statistic: m[1], dc: Number(m[2]) } }; return [{ type: "note", text: plain(m[0]) }]; }],
    [/^Finally, if an enemy Launches an affected siege weapon, their targets can roll twice and take the better result for any resulting saving throw; this is a fortune effect\.$/,
        (m, context) => { context.siege = { ...context.siege, launch: true }; return [{ type: "note", text: m[0] }]; }],
    [/^Each affected siege weapon's Hardness increases by (\d+), and its maximum Hit Points increase by an amount equal to (twice|three times|four times) the siege weapon's level\.$/,
        (m, context) => context.siege?.commandeer && context.siege.launch ? [{ type: "fortify", who: "targets", hardness: Number(m[1]), hpPerLevel: { twice: 2, "three times": 3, "four times": 4 }[m[2]], seconds: context.seconds, siege: context.siege }] : null],
    [/^All allied siege weapons in the area gain the broken condition\.$/, () => [{ type: "permanent", who: "targets", name: "Broken", value: null }]],
    // Wild Feast: the penalty to Command an Animal and Demoralize against animals, fungi and plants, on the creatures in the area (targeted); on a critical success,
    // the masters' daily check (the caster's control: a failure strips the companion's minion trait for the day); the casters' curse on a critical failure.
    [/^Animal companions, pets, familiars with the animal, fungus, or plant trait, and similar creatures don't turn on their masters, but attempts to @UUID\[[^\]]+\]\{Command an Animal\} or to @UUID\[[^\]]+\]\{Demoralize\} any creatures with the animal, fungus, or plant trait take a [–-](\d) (status|circumstance) penalty\.$/,
        (m, context) => [{ type: "bonus", who: "targets", name: "the wild's hostility", seconds: context.seconds, text: plain(m[0]),
            rules: [{ key: "FlatModifier", selector: "skill-check", type: m[2], value: -Number(m[1]), predicate: [{ or: ["action:command-an-animal", "action:demoralize"] }, { or: ["target:trait:animal", "target:trait:fungus", "target:trait:plant"] }] }] }]],
    [/^animal companions, pets, familiars with the animal, fungus, or plant trait, and similar creatures \(subject to the GM's discretion\) are also initially affected\.$/, m => [{ type: "note", text: m[0] }]],
    [/^Each day for the duration, during daily preparations, its master must succeed at a @Check\[([a-z]+)\] or @Check\[([a-z]+)\] check against a DC equal to the ritual's casting DC or the creature temporarily loses the minion trait and can't be Commanded that day\.$/,
        (m, context) => [{ type: "companions", who: "primary", skills: [m[1], m[2]], seconds: context.seconds, text: plain(m[0]) }]],
    [/^Each caster is permanently cursed to hunger for the taste of flesh of their own ancestry; this is identical to the ghoul's forbidden cravings curse, except the raw meat must be from a member of their own ancestry\.$/,
        m => [{ type: "mark", who: "casters", name: "cursed with forbidden cravings", seconds: 0, text: m[0] }]],
    [/^The DC of this curse is equal to the ritual's casting DC\.$/, m => [{ type: "note", text: m[0] }]],
    // Loyalty's Ward: the criteria chosen at the cast; a creature meeting them (or, on a critical failure, not) saves against the caster's higher class or spell DC
    // when it tries to leave (the caster's control), a failure holding it for the stated time.
    [/^When you set these wards, select one of the following criteria\.$/, (m, context) => { context.criteria = []; return [{ type: "note", text: m[0] }]; }],
    [/^Those that (mean you harm|are unholy|are holy|are members of a specified faction)\.?$/, (m, context) => { if (!context.criteria) return null; context.criteria.push(`Those that ${m[1]}`); return []; }],
    [/^Your wards hold, and those that meet the criteria must attempt a (Will|Fortitude|Reflex) save against the higher of your class DC or spell DC when they try to leave the area by any means\.$/,
        (m, context) => context.criteria?.length ? [{ type: "ward", who: "primary", statistic: m[1].toLowerCase(), retrySeconds: null, inverted: false, seconds: context.seconds, criteria: context.criteria }] : null],
    [/^On a failure, they cannot move out of the warded area and cannot attempt to leave the area again for (\d+) (hours?|days?)\.$/, m => [{ type: "amend", kind: "ward", retrySeconds: Number(m[1]) * UNIT[m[2]] }]],
    [/^on a failure, they can attempt to leave again after (\d+) (hours?|minutes?)\.$/, m => [{ type: "amend", kind: "ward", retrySeconds: Number(m[1]) * (/^hour/.test(m[2]) ? 3600 : 60) }]],
    [/^The wards turn against your intentions, instead holding those that do not meet the selected criteria \(which likely includes all casters\)\.$/,
        (_m, context) => { const ward = (context.degrees.criticalSuccess ?? []).find(action => action.type === "ward"); return ward ? [{ ...structuredClone(ward), inverted: true }] : null; }],
    // Footholds and Foothills: the option chosen at the cast (add, remove, roughen, smooth) on the area's region, for the duration or permanently; the crater's fall;
    // the caster's own terrain trouble on a critical failure.
    [/^When you cast this ritual, select to add, remove, roughen, or smooth out the area\.$/, (m, context) => { context.terrain = { options: ["add", "remove", "roughen", "smooth"], crater: null }; return [{ type: "note", text: m[0] }]; }],
    [/^You create a (\d+)-foot-deep crater-like depression in the area\.$/, (m, context) => { if (!context.terrain) return null; context.terrain.crater = Number(m[1]); return [{ type: "note", text: m[0] }]; }],
    [/^Creatures standing on the destroyed terrain can attempt to @UUID\[[^\]]+\]\{Grab an Edge\} if they are adjacent to a non-destroyed space\.$/, m => [{ type: "note", text: plain(m[0]) }]],
    [/^You transform the area (?:of your choice permanently|for the ritual's duration)\.$/, (m, context) => context.terrain ? [{ type: "terrain", who: "primary", seconds: /permanently/.test(m[0]) ? 0 : context.seconds, ...context.terrain }] : null],
    [/^For the next (week|day|month), the primary caster treats all instances of the terrain they attempted to manipulate as difficult terrain \(or difficult terrain as greater difficult terrain\)\.$/,
        m => [{ type: "mark", who: "primary", name: "the land knows how to beat you", seconds: UNIT[m[1]], text: m[0] }]],
    // Binding Circle: the called creature's level (double the rank); held for a day on a critical success; the bargaining the GM's.
    [/^You call forth an extraplanar creature of a level no greater than double that of the (?:<em>)?[a-z ]+(?:<\/em>)? ritual's rank and attempt to bargain with it, generally to perform a task for you in exchange for payment\.$/,
        (m, context) => { context.levelPerRank = 2; return [{ type: "note", text: plain(m[0]) }]; }],
    [/^A creature that doesn't wish to negotiate at all can attempt a Will save to stay on its home plane\.$/, m => [{ type: "note", text: m[0] }]],
    [/^However, some extraplanar creatures may want payments other than money, such as permission to cast a @UUID\[[^\]]+\]\{Geas\} on you to fulfill an unspecified later favor or obtain ownership of your soul via an infernal contract\.$/, m => [{ type: "note", text: plain(m[0]) }]],
    [/^This uses the Crafting skill and has the same DC as a secondary check would\.$/, m => [{ type: "note", text: m[0] }]],
    [/^You call the extraplanar creature and can prevent it from returning home for up to a full day, potentially allowing you to negotiate a better deal by threatening to leave it in the wards for the duration\.$/,
        m => [{ type: "mark", who: "target", name: "held by the binding circle", seconds: 86400, text: m[0] }]],
    // Separation: the two targets kept apart for the result's time; the backfire on the caster.
    [/^Each target can attempt a Will save against the higher of your class DC or spell DC if they are not willing\.$/, m => [{ type: "note", text: m[0] }]],
    [/^If either target succeeds at their save, the ritual fails\.$/, m => [{ type: "note", text: m[0] }]],
    [/^For the duration of this ritual, the targets cannot approach within (\d+) feet of each other\.$/, (m, context) => { context.apart = { feet: Number(m[1]), text: m[0] }; return [{ type: "note", text: m[0] }]; }],
    [/^If an effect would attempt to force them together, the ritual attempts to counteract that effect\.$/, m => [{ type: "note", text: m[0] }]],
    [/^Creatures separated from each other must attempt a @Check\[flat\|dc:(\d+)\] when they target the other creature with an attack or spell, even if it is a ranged attack\.$/,
        (m, context) => { context.apartCheck = `A DC ${m[1]} flat check to target the other with an attack or spell (on a failure, the action is lost).`; return [{ type: "note", text: plain(m[0]) }]; }],
    [/^On a failure, their action is lost\.$/, () => []],
    [/^This ritual lasts for (\d+) (months?|years?|weeks?)\.$/, (m, context) => context.apart ? [{ type: "mark", who: "targets", name: "separated", seconds: Number(m[1]) * UNIT[m[2]],
        text: `It can't approach within ${context.apart.feet} feet of the other target. ${context.apartCheck ?? ""}`.trim() }] : null],
    [/^the ritual lasts for (\d+) (months?|years?|weeks?)\.$/, m => [{ type: "amend", kind: "mark", seconds: Number(m[1]) * UNIT[m[2]] }]],
    [/^If you start your turn within \d+ feet of both targets, these effects are cumulative, so you must spend one action moving toward one target and then another action moving toward the other\.$/, m => [{ type: "note", text: m[0] }]],
    [/^For the next (year|month|week), whenever you start your turn within (\d+) feet of one of the targets, you must spend at least one action per turn moving closer to them\.$/,
        m => [{ type: "mark", who: "primary", name: "fate intertwined with the targets", seconds: UNIT[m[1]], text: m[0] }]],
    // Freedom: the target freed (Petrified ended; the rest the GM's), its bonus against those effects on a critical success; the backfire the GM's.
    [/^You free the target from all magical effects imprisoning it, petrifying it, or putting it into stasis\.$/, m => [{ type: "free", who: "target", conditions: ["petrified"], text: m[0] }]],
    [/^It gains a \+(\d) (status|circumstance) bonus to saving throws to resist those same magical effects for (\d+) (weeks?|days?|months?)\.$/, m => [{ type: "bonus", who: "target", name: "freed",
        seconds: Number(m[3]) * UNIT[m[4]], text: m[0], toggle: "A save against the effect it was freed from", rules: [{ key: "FlatModifier", selector: "saving-throw", type: m[2], value: Number(m[1]) }] }]],
    // Imprisonment: the form the caster picks (the GM's text for it) on the target, or on the casters on a critical failure.
    [/^You perform a ritual to imprison a creature in one of several forms\.$/, (m, context) => context.forms ? [{ type: "note", text: m[0] }] : null],
    [/^While some versions of this ritual offer all the forms, others include only a single form or only a few of them\.$/, () => []],
    [/^Whichever form you use, the effect can't be counteracted, though it can be ended by @UUID\[[^\]]+\]\{Freedom\}\.$/, m => [{ type: "note", text: plain(m[0]) }]],
    [/^Some forms of (?:<em>)?imprisonment(?:<\/em>)? can be ended by other means\.$/, () => []],
    [/^Because the ritual requires the target to remain within \d+ feet at all times, it typically requires you to subdue the target first\.$/, m => [{ type: "note", text: m[0] }]],
    [/^You imprison the target\.$/, (_m, context) => context.forms ? [{ type: "form", who: "target", forms: context.forms }] : null],
    [/^You can either use a form of (?:<em>)?imprisonment(?:<\/em>)? that usually requires a spell rank 1 higher than your ritual or impose an [–-]2 circumstance penalty to any checks for (?:<em>)?freedom(?:<\/em>)? rituals that would free the creature\.$/,
        (m, context) => context.forms ? [{ type: "amend", kind: "form", bonusRank: 1, note: plain(m[0]) }] : null],
    [/^You imprison yourself and the secondary casters in the same way you intended to imprison the target\.$/, (_m, context) => context.forms ? [{ type: "form", who: "casters", forms: context.forms, same: true }] : null],
    // Sleepless Season: each living creature in the area saves (the GM's DC, the ritual's); a failure's curse for the duration, a critical success's Enfeebled
    // rising each fatigued day (the GM's control, as Geas's strain); the casters' backfire.
    [/^Each living creature in the target area must attempt a (Fortitude|Reflex|Will) saving throw against the ritual's casting DC or become unable to gain the benefits of a full night's rest for (\d+) (weeks?|days?|months?)\.$/,
        (m, context) => { context.curseSave = { statistic: m[1].toLowerCase(), seconds: Number(m[2]) * UNIT[m[3]] }; return [{ type: "note", text: m[0] }]; }],
    [/^The curse can be removed before that time with cleanse affliction or similar magic\.$/, m => [{ type: "note", text: m[0] }]],
    [/^Sleep is unattainable for anyone in the target area who fails the saving throw\.$/, (m, context) => context.curseSave ? [{ type: "curse-save", who: "targets", living: true, ...context.curseSave, name: "sleepless (no sleep)", text: m[0] }] : null],
    [/^Sleep can only be caught in short bursts for anyone in the target area who fails the saving throw\.$/, (m, context) => context.curseSave ? [{ type: "curse-save", who: "targets", living: true, ...context.curseSave, name: "sleepless (short bursts)", text: m[0] }] : null],
    [/^As usual, a living creature who goes more than (\d+) hours without sleeping becomes @UUID\[[^\]]+\]\{Fatigued\}\.$/, m => [{ type: "note", text: plain(m[0]) }]],
    [new RegExp(String.raw`^A target who becomes fatigued in this way is also ${C}; the value of this condition can't be reduced while they're fatigued\.$`),
        m => [{ type: "amend", kind: "curse-save", strain: { uuid: m[1], name: m[2], start: Number(m[3] ?? 1), max: 4 }, strainText: plain(m[0]) }]],
    [/^For every subsequent day an affected target is fatigued, the value of their enfeebled condition increases by 1 \(to a maximum of (\d)\)\.$/, m => [{ type: "amend", kind: "curse-save", strainMax: Number(m[1]) }]],
    [/^a fatigued target doesn't become enfeebled\.$/, () => [{ type: "amend", kind: "curse-save", strain: null }]],
    [/^The notion of sleep itself abandons the casters\.$/, () => []],
    [/^The casters become fatigued and can't gain the benefits of a full night's rest for (\d+) (months?|weeks?)\.$/, m => [{ type: "permanent", who: "casters", name: "Fatigued", value: null },
        { type: "mark", who: "casters", name: "can't gain a full night's rest", seconds: Number(m[1]) * UNIT[m[2]], text: m[0] }]],
    [/^This is a curse effect\.$/, () => []],
    // Void Harvest: the area's controls for the year (the GM targets the creatures): a living creature's first damage each day — its Will save or Doomed +1;
    // undead inside — vitality resistance equal to their level; on a critical success, living creatures inside — −2 to saves against death and void; the casters'
    // Drained 4, locked for a week, on a critical failure.
    [/^Each year on the anniversary of the ritual's casting, .+ to sustain the effect\.$/, m => [{ type: "note", text: m[0] }]],
    [/^To do so, one caster must spend 1 Mythic Point and succeed at a Religion check against the ritual's casting DC\.$/, m => [{ type: "note", text: m[0] }]],
    [/^Each year the ritual is successfully sustained, the radius increases from its original point by (\d+) miles?\.$/, m => [{ type: "note", text: m[0] }]],
    [/^The first time each day a living creature in the area takes damage, it must succeed at a (Will|Fortitude|Reflex) save with a DC equal to the ritual's casting DC or gain the @UUID\[[^\]]+\]\{Doomed 1\} condition; if it already has the doomed condition, it instead increases the value of it by 1\.$/,
        (m, context) => [{ type: "area-controls", who: "primary", seconds: context.seconds, controls: [{ key: "doom", kind: "save-increase", statistic: m[1].toLowerCase(), condition: "doomed",
            label: "A living creature in the area took damage for the first time today (target it): its Will save or Doomed +1", text: plain(m[0]) }] }]],
    [/^Dead creatures can't be raised or resurrected so long as their body remains in the ritual's area\.$/, m => [{ type: "note", text: m[0] }]],
    [/^Undead creatures gain ([a-z]+) resistance equal to their level while in the area\.$/, m => [{ type: "amend", kind: "area-controls", add: { key: "undead", kind: "effect", trait: "undead",
        label: `Undead in the area (target them): ${m[1]} resistance equal to their level while inside`, name: `${m[1]} resistance`, rules: [{ key: "Resistance", type: m[1], value: "@actor.level" }], text: m[0] } }]],
    [/^living creatures in the area take a [–-](\d) status penalty to saves against death effects or effects that deal void damage\.$/, m => [{ type: "amend", kind: "area-controls", add: { key: "living", kind: "effect", living: true,
        label: `Living creatures in the area (target them): –${m[1]} status to saves against death and void effects while inside`, name: "the Void's pull",
        rules: [{ key: "FlatModifier", selector: "saving-throw", type: "status", value: -Number(m[1]), predicate: [{ or: ["item:trait:death", "item:trait:void"] }] }], text: m[0] } }]],
    [/^An explosion of energy from the Void washes over the casters\.$/, () => []],
    [/^The effect fades away if the check fails or if there are no other attempts to sustain the ritual\.$/, m => [{ type: "note", text: m[0] }]],
    [new RegExp(String.raw`^Each caster becomes ${C}\.$`), m => [condition("casters", m, 0)]],
    [/^This condition can't be removed for (\d+) (weeks?|days?|months?)\.$/, m => [{ type: "amend", kind: "condition", lock: true, seconds: Number(m[1]) * UNIT[m[2]] }]],
    // Awaken Curse: the curse's holder recorded with the result (its counteract rank raised; the first counteract fails on a critical success; its leaps the GM's);
    // the casters cursed on a critical failure.
    [/^The difficulty of the counteract check to remove the curse changes based on the success of the ritual\.$/, m => [{ type: "note", text: m[0] }]],
    [/^Additionally, the first three times the curse is successfully counteracted, it leaps to the closest possible target within (\d+) feet, forcing the new target to attempt a saving throw against the curse's initial effects\.$/, m => [{ type: "note", text: m[0] }]],
    [/^Saves against the curse are attempted at the same DC as the curse when it was cast, subject to changes based on the ritual's success\.$/, m => [{ type: "note", text: m[0] }]],
    [/^If any creature successfully saves against the curse's initial effects, the curse dissipates harmlessly\.$/, m => [{ type: "note", text: m[0] }]],
    [/^The first counteract attempt against the curse automatically fails\.$/, m => [{ type: "mark", who: "target", name: "the curse awakened", seconds: 0, text: m[0] }]],
    [/^After that, the curse's counteract rank increases by (\d) \(to a maximum of 10\)\.$/, m => [{ type: "amend", kind: "mark", append: ` After that, the curse's counteract rank is ${m[1]} higher (at most 10).` }]],
    [/^The curse's counteract rank increases by (\d) \(to a maximum of 10\)\.$/, m => [{ type: "mark", who: "target", name: "the curse awakened", seconds: 0, text: `The curse's counteract rank is ${m[1]} higher (at most 10).` }]],
    [/^The curse's counteract rank is unchanged\.$/, m => [{ type: "note", text: m[0] }]],
    [/^You fail to grasp the curse's nuances and entangle yourself in its effects\.$/, () => []],
    [/^The curse is lifted from the original target, and you and each secondary caster is affected by the curse with no saving throw\.$/, m => [{ type: "note", text: `${m[0]} (Delete the curse's Effect from the target and give it to each caster.)` }]],
    // The GM's: outcomes the module can't see.
    [/^You free them from all such effects, even effects like @UUID\[[^\]]+\]\{Imprisonment\} that don't have a duration, as long as (?:<em>)?freedom(?:<\/em>)?'s spell rank is equal to or higher than the effect's spell rank\.$/, m => [{ type: "note", text: plain(m[0]) }]],
    [/^To perform the ritual, you must be within \d+ feet of the target, or within \d+ feet of the place where the target was imprisoned .+$/, m => [{ type: "note", text: plain(m[0]) }]],
    [/^You must know the name of the creature and details of its background; if the creature isn't a close associate, a failure or critical failure on a secondary @Check\[society[^\]]*\] check reduces even a critical success on the primary check to a failure\.$/, m => [{ type: "note", text: plain(m[0]) }]],
    [/^At the successful conclusion of the ritual, each allied siege weapon in the area gains an increase to its Hardness and Hit Points for the duration\.$/, () => []],
    [/^Once the ritual is successfully concluded, the affected pieces of ammunition glow a sickly green and must be launched within the hour or the enchantment fades\.$/, m => [{ type: "note", text: m[0] }]],
    [/^Instead of being imbued in the ammunition, the disease becomes airborne at the site of the ritual\.$/, () => []],
    [/^The ritual speeds along any natural processes to make the brew, such as [^.]+\.$/, () => []],
    [/^At the conclusion of the first \d+ hours of the ritual, you produce enough brew for up to \d+ people to drink, any of whom can be the secondary caster of the ritual\.$/, m => [{ type: "note", text: m[0] }]],
    [/^(?:Once that hour is completed|At the ceremony's end, the ritual is completed), (?:and )?you and the secondary caster attempt your checks as normal\.$/, () => []],
    [/^Despite the ritual's name, it can be cast during any season, but unless it's cast during winter, the DCs for successfully casting (?:<em>)?winter's breath(?:<\/em>)? increase by \d+ \(or by \d+ if the ritual is cast during summer\)\.$/, m => [{ type: "note", text: plain(m[0]) }]],
    [/^You're only able to perform this ritual if you know the target's name .+ must be able to paint or draw the target from memory\.$/, () => []],
    [/^If the duration expires or the target removes the curse with a .+, their portrait slowly returns back to its original form\.$/, () => []],
    [new RegExp(String.raw`^The sickened condition ends immediately when it follows the ${G} again; it can't remove the sickened condition in any other way\.$`), () => []],
    [new RegExp(String.raw`^Only powerful magic such as a @UUID\[[^\]]+\]\{Wish\} ritual can remove the effects of ${G} from a willing target\.$`), () => []],
    [new RegExp(String.raw`^You are considered an unwilling target, so the ${G} can be counteracted with a @UUID\[[^\]]+\]\{Cleanse Affliction\} spell\.$`), m => [{ type: "note", text: plain(m[0]) }]],
    [/^You sever [^,]+ (?:permanently|for \d+ (?:years?|months?))\.$/, () => []],
    [/^If its other side is not awakened, this side remains awakened for \d+ years?, possibly allowing you enough time to find and awaken the connecting portal\.$/, () => []],
    [/^You attempt to reactivate a dormant gate, portal, or @UUID\[[^\]]+\]\{Teleportation Circle\} by infusing it with magical energies\.$/, () => []],
    [/^a hostile creature is drawn through the portal and immediately attacks anyone present\.$/, () => []],
    [/^A single meal of the affected food contains enough nourishment to sustain a typical human for \d+ days?\.$/, () => []],
    [/^A spirit that doesn't wish to be so constrained can attempt a Will save to resist this ritual; on a critical success, it fools you into believing the ritual succeeded\.$/, () => []],
    [/^An unwilling target must be @UUID\[[^\]]+\]\{Immobilized\}, @UUID\[[^\]]+\]\{Unconscious\}, or otherwise prevented from leaving the area for the entire casting time, or the ritual fails\.$/, () => []],
    [/^An unwilling target can attempt a Will save to resist the ritual; on a critical success, treat the result as critically failing to cast the ritual\.$/, () => []],
    [/^Instead the only way to escape is by succeeding at a [A-Za-z ,]+ check against the [a-z ]+'s DC\.$/, () => []],
    [/^This check can be attempted once per week, and the first check can only be attempted after a week has passed\.$/, () => []],
    [/^If all casters spend one Mythic Point each, this interval changes to one year, and the DC uses the primary caster's mythic proficiency\.$/, () => []],
    [/^If the mindscape's creator wants to prevent anyone from entering or exiting, the DC of the primary check is the creator's Will DC if that would be higher than the ritual's normal DC\.$/, () => []],
    [/^These astral forms can be used to explore the Astral Plane indefinitely, while the targets' bodies remain safely in stasis on the plane where the ritual was cast \(where they remain @UUID\[[^\]]+\]\{Unconscious\} and can't be awoken normally\)\.$/, () => []],
    [/^If a target's astral form is slain, the silver cord immediately rips them back to their physical body; the strain requires them to attempt a Fortitude save with the same DC as the ritual's primary check\.$/, () => []],
    [/^On a failure, the creature dies; on a success, it becomes .+ for 1 week; these conditions can't be removed or reduced by any means until the week has passed\.$/, () => []],
    [/^It's difficult to cast this ritual unless the target is willing or @UUID\[[^\]]+\]\{Restrained\}\.$/, () => []],
    [/^If the creature is unwilling to accept the ritual, it can attempt a Will save to negate the effect\.$/, () => []],
    [/^The effects of the ritual depend on the results of your [A-Z][a-z]+ check\.$/, () => []],
    [/^This deadly ecosystem flourishes, if at all possible \(plants still need light and water, for instance\), for \d+ years? and gradually disperses after this period\.$/, () => []],
    [/^If this ritual is successfully cast on the grounds of an existing [a-z ]+, it resets the duration and expands the [a-z' ]+ radius by \d+ feet instead\.$/, () => []],
    [/^The maximum level of plants or animals called by the ritual is equal to its spell rank, and the called plants and animals can use the ritual's spell DC instead of their own poison DC, whichever is higher\.$/, () => []],
    [/^A spirit unwilling to heed your call can attempt a Will save to avoid it; on a critical success, a trickster spirit Impersonates the spirit you meant to call\.$/, () => []],
    [/^The DC of the Will save is \d+ lower if you haven't met the spirit in life\.$/, () => []],
    [/^One or more evil spirits appear and attack\.$/, () => []],
    [/^The stored spell must take \d+ actions or fewer to cast, have a hostile effect, and target one creature or have an area\.$/, () => []],
    [/^The rune is a magical trap, using your spell DC for both the Perception check to notice it and the Thievery check to disable it; both checks require the creature attempting them to be trained in order to succeed\.$/, () => []],
    [/^You create a particularly effective rune, granting a \+\d circumstance bonus to the DC to notice and disable the rune\.$/, () => []]
];
const AS = /^As (critical success|success|failure|critical failure)(?:,? but in addition,|,? but|,? and|,? except|,|\.)\s*(.*)$/i;
const DEGREE_KEY = { "critical success": "criticalSuccess", success: "success", failure: "failure", "critical failure": "criticalFailure" };
// The Heightened entries' maximum target level ("The maximum level of the target is 10.") and their other lines (the GM's).
const H_LEVEL = /^The maximum level of the target is (\d+)\.$/;
// ("The ritual targets up to 100 willing creatures, the critical failure damage increases to 20d6, and the critical failure save DC increases to 40.")
const H_DAMAGE = /^The ritual targets up to \d+ willing creatures, the critical failure damage increases to (\d+d\d+), and the critical failure save DC increases to (\d+)\.$/;
// Geas from 5th: an unwilling target's save, and how long the geas lasts on it at each rank.
const H_UNWILLING = /^You can use geas on an unwilling creature; it can attempt a (Will|Fortitude) save to negate the effect\.$/;
const H_UNWILLING_TIME = /^(?:If the target fails this Will save, the geas lasts up to|As \d+(?:st|nd|rd|th) rank, but the geas lasts for(?: up to)?) (?:(\d+) (weeks?|months?|years?)|a duration you choose \(even unlimited\))(?: on an unwilling creature)?\.$/;
const H_RANK_NOTES = [/^A cleanse affliction spell can counteract a geas on an unwilling creature, in addition to powerful magic such as a wish ritual\.$/,
    /^A clever unwilling creature can subvert the geas by contriving situations that prevent it from complying, but in that case it becomes (?:@UUID\[[^\]]+\]\{Sickened\}|Sickened) \(as described above\)\.$/];
// (Imprisonment: "You can use the object form of imprisonment in addition to the other options, and you can target a creature of up to 18th level.")
const H_FORMS = /^You can use the [a-z ]+ forms? of [a-z]+ in addition to the other options, and you can target a creature of up to (\d+)(?:st|nd|rd|th) level\.$/;
const H_NOTES = [/^The base cost increases to [\d,]+ gp\.$/, /^The cost is the target's level \(minimum 1\) × \d+ gp\.$/, /^The interval becomes \d+ (?:months?|years?), and spending Mythic Points increases it to \d+ years\.$/];

const sentencesOf = text => text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);

/** One sentence's actions, or null when a sentence with rule words has no reader. */
export function readSentence(raw, context) {
    const sentence = raw.replace(/\s+/g, " ").trim();
    for (const [pattern, build] of READERS) {
        const match = pattern.exec(sentence) ?? pattern.exec(`${sentence}.`);
        if (match) return build(match, context);
    }
    if (!RULE_WORDS.test(htmlToPlainText(sentence))) return [{ type: "note", text: htmlToPlainText(sentence) }];
    return null;
}

/** {ritualDegrees, claimed} or null. */
export function compileRitualDegrees(item, adapted) {
    const ritual = item?.system?.ritual;
    if (!ritual?.primary) return null;
    const html = String(adapted.descriptionHTML ?? "");
    // (A list of forms the caster picks from — Imprisonment's: each "<li><strong>Chains</strong> …</li>", its rank from the name "(9th or 10th rank)"; the GM's text.)
    let forms = null;
    const list = /<ul>([\s\S]*?)<\/ul>/.exec(html);
    let rest = html;
    if (list && /<li>\s*(?:<p>\s*)?<strong>/.test(list[1])) {
        forms = [...list[1].matchAll(/<li>\s*(?:<p>\s*)?<strong>([^<]+)<\/strong>\s*([\s\S]*?)(?:<\/p>\s*)?<\/li>/g)].map(match => {
            const named = /^(.+?)\s*\((\d+)(?:st|nd|rd|th)(?: or \d+(?:st|nd|rd|th))? rank(?: only)?\)$/.exec(match[1].trim());
            return { name: (named ? named[1] : match[1]).trim(), minRank: named ? Number(named[2]) : null, text: plain(match[2]) };
        });
        if (!forms.length || forms.some(form => !form.text)) return null;
        rest = html.replace(list[0], "");
    }
    const paragraphs = [...rest.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim()).filter(Boolean);
    const body = [], rows = {}, heightened = [];
    for (const paragraph of paragraphs) {
        const row = /^<strong>(Critical Success|Success|Failure|Critical Failure)<\/strong>\s*([\s\S]*)$/.exec(paragraph);
        const high = /^<strong>Heightened \((\d+)(?:st|nd|rd|th)\)<\/strong>\s*([\s\S]*)$/.exec(paragraph) ?? /^<strong>Heightened \(\+(\d+)\)<\/strong>\s*([\s\S]*)$/.exec(paragraph)?.map((part, index) => index === 1 ? `+${part}` : part);
        if (row) { if (rows[LABELS[row[1]]]) return null; rows[LABELS[row[1]]] = row[2]; }
        else if (high) heightened.push(high[1].startsWith("+") ? { step: Number(high[1].slice(1)), text: high[2] } : { rank: Number(high[1]), text: high[2] });
        // (PF2e's Effect link in a paragraph of its own: part of the result before it.)
        else if (Object.keys(rows).length && /^@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}$/.test(paragraph) && !heightened.length) { const last = Object.keys(rows).at(-1); rows[last] = `${rows[last]} ${paragraph}`; }
        else if (Object.keys(rows).length) return null;
        else body.push(paragraph);
    }
    if (Object.keys(rows).length !== 4) return null;
    const lasting = /^(\d+) (hours?|days?|weeks?|months?|years?)$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const context = { degrees: {}, seconds: lasting ? Number(lasting[1]) * UNIT[lasting[2]] : 0, forms }, claimed = [];
    // (A disease's stage block among the body's paragraphs: compiled whole, not read as sentences.)
    const start = body.findIndex(paragraph => /^<strong>[^<]+<\/strong>\s*\((?:disease|poison|curse)\)/i.test(paragraph));
    let affliction = null;
    if (start >= 0) {
        let end = start + 1;
        while (end < body.length && /^<strong>(?:Saving Throw|Onset|Stage \d+)<\/strong>/.test(body[end])) end++;
        affliction = readAfflictionBlock(body.slice(start, end));
        if (!affliction) return null;
        claimed.push(...body.splice(start, end - start).map(paragraph => plain(paragraph)));
    }
    const notes = [];
    for (const paragraph of body) {
        // ("<strong>Roughen</strong> You transform …": an option chosen at the cast, its sentences that option's notes.)
        const option = context.terrain && /^<strong>(Add|Remove|Roughen|Smooth)<\/strong>\s*([\s\S]*)$/.exec(paragraph);
        for (const sentence of sentencesOf(option ? option[2] : paragraph)) {
        const actions = readSentence(sentence, context);
        if (!actions) return null;
        if (option) { (context.terrain.notes ??= {})[option[1].toLowerCase()] = [...(context.terrain.notes?.[option[1].toLowerCase()] ?? []), ...actions.filter(action => action.type === "note").map(action => action.text)]; if (actions.some(action => action.type !== "note")) return null; claimed.push(htmlToPlainText(sentence)); continue; }
        notes.push(...actions.filter(action => action.type === "note").map(action => action.text));
        if (actions.some(action => action.type !== "note")) return null;
        claimed.push(htmlToPlainText(sentence));
        }
    }
    // The results: a pass at a time, so "As success, …" waits for the success it borrows.
    const pending = ["criticalSuccess", "success", "failure", "criticalFailure"];
    for (let pass = 0; pending.length && pass < 4; pass++) {
        for (const key of [...pending]) {
            const sentences = sentencesOf(rows[key]);
            const borrowed = sentences.map(sentence => AS.exec(sentence)).filter(Boolean).map(as => DEGREE_KEY[as[1].toLowerCase()]);
            if (borrowed.some(from => !context.degrees[from])) continue;
            const actions = [];
            for (const sentence of sentences) {
                const as = AS.exec(sentence);
                let rest = sentence;
                if (as) {
                    actions.push(...structuredClone(context.degrees[DEGREE_KEY[as[1].toLowerCase()]].filter(action => action.type !== "roll")));
                    rest = as[2];
                    if (!rest.trim()) { claimed.push(htmlToPlainText(sentence)); continue; }
                }
                if (/^The ritual (?:has no effect|fails)\.?$/.test(rest) || /^The ritual fails, and the spirits you appealed to are angered\.$/.test(rest)) { claimed.push(htmlToPlainText(sentence)); continue; }
                const read = readSentence(rest, context);
                if (!read) return null;
                // ("As critical success, but …": a recorded outcome of the same name replaces the borrowed one.)
                for (const action of read.filter(entry => entry.type === "mark")) for (let index = actions.length - 1; index >= 0; index--) if (actions[index].type === "mark" && actions[index].name === action.name) actions.splice(index, 1);
                // ("… except the spell isn't harder to detect", "… but without the circumstance bonus": a borrowed action taken away.)
                for (const drop of read.filter(entry => entry.type === "drop")) for (let index = actions.length - 1; index >= 0; index--) if ((drop.name && actions[index].name === drop.name) || (drop.kind && actions[index].type === drop.kind)) actions.splice(index, 1);
                // ("On a successful Will save, the condition value is 2, …": the previous action of that kind amended.)
                for (const amend of read.filter(entry => entry.type === "amend")) {
                    const target = actions.findLast(action => action.type === amend.kind);
                    if (!target) return null;
                    const { type: _type, kind: _kind, dropRules, append, add, ...fields } = amend;
                    if (dropRules) target.rules = target.rules.filter(rule => !dropRules.includes(rule.key));
                    if (append) target.text = `${target.text}${append}`;
                    if (add) target.controls = [...(target.controls ?? []), add];
                    for (const [field, value] of Object.entries(fields)) target[field] = value && typeof value === "object" && !Array.isArray(value) ? { ...target[field], ...value } : value;
                }
                actions.push(...read.filter(entry => entry.type !== "drop" && entry.type !== "amend"));
                claimed.push(htmlToPlainText(sentence));
            }
            // (One curse per result: a result's own curse replaces the one it borrowed — Sleepless Season's success.)
            const curses = actions.filter(action => action.type === "curse-save");
            for (const extra of curses.slice(1)) actions.splice(actions.indexOf(extra), 1);
            context.degrees[key] = actions;
            pending.splice(pending.indexOf(key), 1);
        }
    }
    if (pending.length) return null;
    // (The carrier, the infestation and the exposures need the disease's block, of the name the text gives.)
    const afflicting = Object.values(context.degrees).flat().filter(action => ["carrier", "infestation", "expose"].includes(action.type));
    if (afflicting.length && (!affliction || ![context.carrier?.name, context.infest?.name].filter(Boolean).every(name => sameName(name, affliction.name)))) return null;
    // (A ritual that is notes only stays a note-only ritual, apart: the user's decision.)
    if (!Object.values(context.degrees).some(actions => actions.some(action => action.type !== "note"))) return null;
    const levels = [], steps = [], unwilling = [];
    // (The ritual's area, for the card: "Heightened (+2) Double the ritual's area.")
    const area = adapted.targeting?.area?.value ? { type: adapted.targeting.area.type ?? null, value: Number(adapted.targeting.area.value), doubleEvery: null } : null;
    for (const entry of heightened) {
        // "Heightened (+N)": each step's change to the results' temporary Hit Points (the spells cast at the ritual's rank already).
        if (entry.step) {
            const sentence = htmlToPlainText(entry.text).replace(/\s+/g, " ").trim();
            const all = Object.values(context.degrees).flat();
            const brew = /^The temporary Hit Points increases by (\d+) \(or (\d+) on a critical success\)\.$/.exec(sentence);
            const tea = /^The spells associated with a success or critical success are heightened by 1 rank, and the temporary Hit Points granted are increased by (\d+)\.$/.exec(sentence);
            // (PF2e's Fortifying Brew Effect scales its temporary Hit Points by its level, the cast rank: the text's step kept to check against it.)
            if (brew && all.some(action => action.type === "native" && action.selection)) for (const action of all.filter(entry => entry.type === "native" && entry.selection)) action.proof.step = { every: entry.step, success: Number(brew[1]), criticalSuccess: Number(brew[2]) };
            else if (/^Double the ritual's area\.$/.test(sentence) && area) area.doubleEvery = entry.step;
            else if (/^The area increases by (\d+) feet\.$/.test(sentence) && area) area.addEvery = { step: entry.step, feet: Number(/(\d+)/.exec(sentence)[1]) };
            else if (tea && all.some(action => action.type === "cast" && !action.spells.some(spell => spell.rank != null))) for (const rule of all.filter(entry => entry.type === "bonus").flatMap(entry => entry.rules).filter(rule => rule.key === "TempHP")) rule.step = { every: entry.step, add: Number(tea[1]), from: Number(adapted.rank) };
            else return null;
            claimed.push(sentence);
            continue;
        }
        for (const sentence of sentencesOf(htmlToPlainText(entry.text))) {
            const reach = H_FORMS.exec(sentence);
            if (reach && forms) { levels.push({ rank: entry.rank, maxLevel: Number(reach[1]) }); continue; }
            const level = H_LEVEL.exec(sentence);
            if (level) { levels.push({ rank: entry.rank, maxLevel: Number(level[1]) }); continue; }
            const damage = H_DAMAGE.exec(sentence);
            if (damage) { steps.push({ rank: entry.rank, formula: damage[1], dc: Number(damage[2]) }); continue; }
            const resist = H_UNWILLING.exec(sentence);
            if (resist) { unwilling.push({ rank: entry.rank, statistic: resist[1].toLowerCase() }); continue; }
            const lasts = H_UNWILLING_TIME.exec(sentence);
            if (lasts && unwilling.length) { unwilling.push({ rank: entry.rank, seconds: lasts[1] ? Number(lasts[1]) * UNIT[lasts[2]] : 0 }); continue; }
            const note = H_RANK_NOTES.find(pattern => pattern.test(sentence));
            if (note) { notes.push(`From ${entry.rank}th rank: ${plain(sentence)}`); continue; }
            if (H_NOTES.some(pattern => pattern.test(sentence))) continue;
            return null;
        }
        claimed.push(htmlToPlainText(entry.text));
    }
    const target = String(adapted.targeting?.target ?? "").trim();
    const baseLevel = /^1 creature of up to (\d+)(?:st|nd|rd|th) level$/i.exec(target);
    // ("1 creature of a level no greater than double the geas ritual's rank")
    const perRank = /^1 creature of a level no greater than (double|triple) the [a-z' ]+ rank$/i.exec(target);
    return { ritualDegrees: { primary: ritual.primary.check, secondary: { casters: Number(ritual.secondary?.casters ?? 0), checks: ritual.secondary?.checks ?? "" }, target,
            targetLevels: baseLevel ? [{ rank: Number(adapted.rank), maxLevel: Number(baseLevel[1]) }, ...levels] : [], levelPerRank: perRank ? { double: 2, triple: 3 }[perRank[1].toLowerCase()] : context.levelPerRank ?? null, forms, affliction, area,
            unwilling: unwilling.length ? { rank: unwilling[0].rank, statistic: unwilling[0].statistic, seconds: unwilling.filter(entry => "seconds" in entry).map(({ rank, seconds }) => ({ rank, seconds })) } : null, damageSteps: steps, cost: adapted.activation?.cost ?? null, notes,
            degrees: context.degrees },
        claimed };
}
