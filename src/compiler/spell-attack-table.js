// Spell attacks: "Make a spell attack roll against the target's AC. On a hit,
// the target takes 2d4 spirit damage (double damage on a critical hit)."
// PF2e stores no defense for these; the attack trait and the text say it all.
// The description is rewritten as a standard table keyed by the attack's degree
// (Critical Success = critical hit, Success = hit, Failure and Critical Failure
// = miss) and the defense becomes `spell-attack`, so the ordinary degree
// compilers judge every outcome and the save card rolls the caster's spell
// attack against each target instead of a save.

import { isDamageBenefitSentence } from "./damage-benefit-compiler.js";
import { CONDITION, DICE_DAMAGE as DICE, ROUND_WORDS as ORDINAL } from "./text-patterns.js";

// (ATTACK_DEBUG=1 names the line a spell attack was refused at.)
const nope = line => { if (globalThis.process?.env?.ATTACK_DEBUG) console.error("spell-attack refused at line", line); return null; };
const HEADING = /<strong\b[^>]*>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/gi;
const LINK = /@UUID\[[^\]]+\]\{[^}]+\}/g;
// "Make a (ranged|melee) spell attack (roll) (against the/a target's AC / against the target)." A reaction names its
// target by the trigger: "Make a ranged spell attack against the triggering creature's AC."
const ATTACK = String.raw`(?:Make|Attempt) an? (?:ranged |melee )?spell attack(?: roll)?(?: against (?:(?:the|a|each|your) target(?:'s AC)?|each creature|a single creature|a target within range|the triggering creature's AC|a creature within \d+ feet|the AC of a target within \d+ feet))?`;
// A reaction's one target: "the triggering creature", "the creature that took damage".
const TRIGGERING_TARGET = /^the (?:triggering creature|creature that took damage)$/i;
// Several targets: "1 or 2 creatures", "up to 3 creatures", "2 creatures".
const TARGETS = /^(?:(?:1|one) (?:living )?creature(?: or (?:unattended )?object)?|the triggering creature|the creature that took damage|(?:1|one) or (?:2|two) creatures|(?:1|2|one|two) or more creatures|up to (?:[2-9]|two|three|four) creatures|(?:2|3|two|three) creatures(?: no more than \d+ feet from each other)?)$/i;
// "If you're attacking two creatures, this counts as two attacks for your multiple attack penalty, but the penalty doesn't increase until after both attacks."
const SHARED_MAP = /^(?:(?:If you're attacking (?:two|several|multiple) creatures, )?(?:this|each attack) counts (?:as (?:two|\d+) attacks )?(?:toward|for) your multiple attack penalty, but (?:the|your) penalty doesn't increase until (?:after )?(?:you've made )?(?:both|all your) attacks|These attacks each increase your multiple attack penalty, but you don't increase your multiple attack penalty until after you make (?:both|all the) spell attack rolls for [a-z' ]+)\.$/i;
// Sentences about the number of actions spent. The player targets accordingly; the chosen PF2e variant carries the data.
// "For each additional action you use when Casting the Spell, you can fire an additional ray at a different target, to a maximum of three rays targeting three different targets for 3 actions."
// "You can spend a third action while casting this spell to fire splinters at two different targets instead of one."
const ACTION_TARGETS = /^(?:For each additional action you use when Casting the Spell, you can fire an additional [a-z]+ at a different target, to a maximum of (?:two|three) [a-z]+ targeting (?:two|three) different targets for [23] actions|You can spend a third action while casting this spell to fire [a-z]+ at two different targets instead of one)\.$/i;
// "If you spend 2 or more actions Casting the Spell, the damage increases to 4d6 fire damage on a hit, and it still deals double damage on a critical hit."
const ACTION_DAMAGE = /^If you spend ([23]) or more actions Casting the Spell, the damage increases to (\d+d\d+) ([a-z]+) damage on a hit, and it still deals double damage on a critical hit\.$/i;
const FORMS = [
    // "On a hit, the target takes 2d6 fire damage, and on a critical hit, the target takes double damage."
    new RegExp(String.raw`^${ATTACK}\. On a hit, the target takes ${DICE}, and on a critical hit, the target takes double damage\.$`),
    // "… On a hit, the target takes 2d4 spirit damage (double damage on a critical hit)." ("(or double damage …)")
    new RegExp(String.raw`^${ATTACK}\. On a (?:hit|success), the target takes ${DICE} \((?:or )?double damage on a critical hit\)\.$`),
    // "Make a melee spell attack against a target's AC, dealing 5d8 piercing damage … (double damage on a critical hit)."
    new RegExp(String.raw`^${ATTACK}, dealing ${DICE} \(double damage on a critical hit\)\.$`),
    // "Make a spell attack roll against the target's AC, dealing 1d8 fire damage and 1d8 persistent fire damage on a hit."
    // A spell attack's critical hit deals double damage.
    new RegExp(String.raw`^${ATTACK}, dealing ${DICE} on a (?:hit|success)\.$`),
    // "… On a hit, the target takes 3d6 bludgeoning damage and 3d6 piercing damage, or double damage on a critical hit."
    new RegExp(String.raw`^${ATTACK}\. On a hit, the target takes ${DICE}, or double damage on a critical hit\.$`),
    // "… On a hit, the target takes 4d6 piercing damage. On a critical hit, the target takes double damage." (Piercing Jet, PF2e 8.6)
    new RegExp(String.raw`^${ATTACK}\. On a hit, the target takes ${DICE}\. On a critical hit, the target takes double damage\.$`),
    // "… On a hit, the target takes 2d12 electricity damage." / "If you hit, the projectile deals 7d10 bludgeoning damage."
    // (a spell attack's critical hit deals double damage)
    new RegExp(String.raw`^${ATTACK}\. (?:On a hit, the target takes|(?:If you hit|On a hit), the [a-z]+ deals) ${DICE}\.$`),
    // "Make a ranged spell attack roll, dealing 1d8 piercing damage on a success and double damage on a critical success."
    new RegExp(String.raw`^${ATTACK}, dealing ${DICE} on a (?:success|hit) and double damage on a critical (?:success|hit)\.$`),
    // "Make a ranged spell attack roll against a creature within 30 feet, dealing 2d6 sonic damage if you hit (or double damage on a critical hit)."
    new RegExp(String.raw`^${ATTACK}, dealing ${DICE} (?:if you hit|on a (?:hit|success)) \((?:or )?double damage on a critical hit\)\.$`),
    // "Make a spell attack roll against the target's AC. The ray deals 2d6 fire damage on a hit (or double damage on a critical hit)."
    new RegExp(String.raw`^${ATTACK}\. The [a-z]+ deals ${DICE} on a hit \((?:or )?double damage on a critical hit\)\.$`),
    // "Make a melee spell attack against a target. On a hit, you deal 4d4 piercing damage and 2 persistent bleed damage (or double damage on a
    // critical hit)."
    new RegExp(String.raw`^${ATTACK}\. On a hit, you deal ${DICE} \((?:or )?double damage on a critical hit\)\.$`),
    // "… On a hit, salt scours its open wound, dealing 2d6 persistent acid damage." (a critical hit doubles it)
    new RegExp(String.raw`^${ATTACK}\. On a hit, [a-z' ]+, dealing ${DICE}\.$`)
];
// The damage named before a written table: "… that deals 10d8 cold damage.", "The ray deals 2d6 bludgeoning damage.",
// "The target takes 2d4 cold damage and potentially other effects, depending on the result of your spell attack roll.",
// "The stone deals 2d6 bludgeoning damage depending on your spell attack roll against the target's AC."
// ("Your head splits vertically into an enormous maw, which feasts upon the target's blood, dealing 12d6 piercing damage, depending on your
// spell attack roll.": the narration's damage and the attack in one sentence.)
const DEALS_BEFORE_TABLE = new RegExp(String.raw`(?:\b(?:that|which) deals ${DICE}|^(?:The [a-z]+(?: of [a-z]+)?|This|It|Your [a-z]+) (?:deals?|takes) ${DICE}(?: and potentially other effects,| and might cause bleeding)?(?:,? depending on (?:the result of )?your (?:ranged |melee )?spell attack roll(?: against the target's AC)?)?|^[A-Z][a-z' ,]+, dealing ${DICE}, depending on your spell attack roll)\.$`);
// A projectile that lodges and explodes at the end of the target's next turn unless removed (Winter Bolt):
//   "The bolt deals 1d8 piercing damage and lodges in the target." / "At the end of the target's next turn, the bolt shatters, releasing
//   a whirl of snow and ice that deals @Damage[(@item.rank)d12[cold]|options:area-damage] damage to the target and all adjacent
//   creatures." / "The bolt can be removed with an Interact action, which causes it to melt harmlessly without detonating." with rows
//   "The initial bolt deals full damage and is especially well anchored, taking 2 Interact actions to remove. The bolt's explosion deals
//   double damage." / "The bolt and its explosion deal full damage."
const LODGES = new RegExp(String.raw`^The ([a-z]+) deals ${DICE} and lodges in the target\.$`);
const EXPLODES = /^At the end of the target's next turn, the ([a-z]+) shatters, releasing [a-z ,']{3,60} that deals @Damage\[\(@item\.rank\)d(\d+)\[([a-z]+)\](?:\|options:area-damage)?\] damage to the target and all adjacent creatures\.$/;
const REMOVED = /^The ([a-z]+) can be removed with an Interact action, which causes it to melt harmlessly without detonating\.$/;
const LODGED_CRITICAL = /^The initial ([a-z]+) deals full damage and is especially well anchored, taking (\d) Interact actions to remove\. The \1's explosion deals double damage\.$/;
const LODGED_SUCCESS = /^The ([a-z]+) and its explosion deal full damage\.$/;
// Withering Grasp: "If a creature uses an item to block withering grasp, such as with the Shield Block reaction, the item is automatically
// affected, but the creature doesn't take damage (even if there is damage left over after the shield's Hardness)." (a GM reminder) and
// "Unlike normal void damage, the void damage from withering grasp damages objects, constructs, and the like by eroding away their
// substance." (the module lifts a construct's void immunity for this spell's damage).
const SHIELD_BLOCKED = /^If a creature uses an item to block [a-z' ]+, such as with the Shield Block reaction, the item is automatically affected, but the creature doesn't take damage \(even if there is damage left over after the shield's Hardness\)\.$/;
const VOID_CONSTRUCTS = /^Unlike normal void damage, the void damage from [a-z' ]+ damages objects, constructs, and the like by eroding away their substance\.$/;
// "… If you target an object, lower its Hardness by 4 for 1 minute." at the end of a hit row: the object's, the GM's.
const OBJECT_HARDNESS = /\s*If you target an object, lower its Hardness by (\d+) for (\d+) minutes?\./;
const CRITICAL_PERSISTENT = /^On a critical (?:success|hit), (?:a|the) target also takes (@Damage\[\((?:@item\.(?:level|rank))\)d\d+\[(?:persistent,([a-z]+)|(bleed))\]\]) damage\.$/i;
// "The ray deals an additional @Damage[…] damage to creatures with the undead trait." — kept for the conditional-damage compiler.
const CONDITIONAL = /^(?:(?:The [a-z]+|It|This spell) deals an additional @Damage\[[^\[\]]+\[[a-z]+\]\] damage to (?:creatures|each creature|targets|each target) with the [a-z-]+ trait(?: in the area)?|If the target has the [a-z-]+ trait, you deal an extra \d+d\d+ [a-z]+ damage)\.$/;
// After the table: "If the ray passes through an area of magical light or targets a creature affected by magical
// light, chilling darkness attempts to counteract the light. If you need to determine whether the ray passes
// through an area of light, draw a line between yourself and the spell's target." The GM resolves it; the card says so.
const COUNTERACT_RAY = /^If the (ray|light|beam) passes through an area of magical (light|darkness) or targets a creature affected by magical \2, [a-z' ]+ attempts to counteract the \2\. If you need to determine whether the \1 passes through an area of \2, draw a line between yourself and the spell's target\.$/i;
// Forced movement the GM carries out (the module doesn't move tokens):
// "you can push it up to 10 feet", "can choose to detonate your weapon to push the target 10 feet away from you",
// "the target is pulled up to 10 feet toward you", "is knocked back 10 feet", "is pushed 10 feet away from you".
const MOVE = String.raw`(?:you can push it up to (\d+) feet|can choose to [a-z ]{3,40}? to push the target (\d+) feet away from you|the target is pulled up to (\d+) feet toward you|is knocked back (\d+) feet|is pushed (\d+) feet away from you|can choose to push the target up to (\d+) feet away from you)`;
// (Staff Striker, Wizards+: "can choose to push the target up to 5 feet away from you" — up to, away, the caster's choice.)
function movement(match, offset = 0) {
    const [pushUpTo, detonate, pullUpTo, knocked, pushed, awayUpTo] = match.slice(offset, offset + 6);
    if (awayUpTo) return { kind: "push", distance: Number(awayUpTo), upTo: true, optional: true, direction: "away" };
    if (pushUpTo) return { kind: "push", distance: Number(pushUpTo), upTo: true, optional: true, direction: "any" };
    if (detonate) return { kind: "push", distance: Number(detonate), upTo: false, optional: true, direction: "away" };
    if (pullUpTo) return { kind: "pull", distance: Number(pullUpTo), upTo: true, optional: false, direction: "toward" };
    if (knocked) return { kind: "push", distance: Number(knocked), upTo: false, optional: false, direction: "away" };
    return { kind: "push", distance: Number(pushed), upTo: false, optional: false, direction: "away" };
}
// A table row "The target takes double damage and you can push it up to 10 feet." keeps its damage; the movement is recorded.
const ROW_MOVE = new RegExp(String.raw`^(The target takes (?:double|full|normal) damage),? and ${MOVE}\.$`);
// "If you hit, you deal 2d6 force damage. On a critical success, you deal double damage and can choose to … push the target 10 feet away from you."
// "On a hit, you deal 5d10 void damage, and the target is pulled up to 10 feet toward you. On a critical hit, you deal double the damage, and the target is pulled up to 20 feet toward you."
const HIT_THEN_CRIT = new RegExp(String.raw`^${ATTACK}\. (?:If you hit|On a hit|If it hits), (?:you deal|the target takes) ${DICE}(?:,? and ${MOVE})?\. On a critical (?:success|hit), (?:you deal|the target takes) double (?:the )?damage,? and ${MOVE}\.$`);
// "If the target is pushed into an obstacle or structure that's Large or larger, the target becomes skewered by the ice spike and is Immobilized for
// 1 minute or until it Escapes." (Glacial Skewer): added to both hit rows as the GM's question for that target.
const PUSHED_INTO = /^If the target is pushed into an obstacle or structure that's (Large|Huge) or larger, the target becomes [a-z ]+ and is (@@\d+@@) for (\d+) (round|minute)s? or until it Escapes\.$/;
// "On a hit, you deal 3d8 acid damage plus @Damage[(floor(@item.rank/2))d6[persistent,acid]] damage. On a critical hit,
// double the initial damage, but not the persistent damage." — the persistent roll is added once to both hit rows.
const PERSISTENT_NOT_DOUBLED = new RegExp(String.raw`^${ATTACK}\. (?:On a hit|If you hit|If it hits), you deal ${DICE} plus (@Damage\[[^\[\]]+\[persistent,[a-z]+\]\]) damage\. On a critical hit, double the initial damage, but not the persistent damage\.$`);
// "This is silver damage for the purposes of weaknesses, resistances, and the like." / "Moonlight ray's cold damage is
// silver damage …": true only when the damage entry already carries the material, which PF2e's roll applies.
const MATERIAL = /^(?:This|(?:[A-Za-z' ]+'s )?(?:([a-z]+) )?damage) is (silver|cold iron|adamantine) damage for the purposes of weaknesses, resistances, and the like\.$/i;
const materialStated = (adapted, sentence) => {
    const match = MATERIAL.exec(sentence.replace(/^This\b/, "This"));
    if (!match) return false;
    const material = match[2].toLowerCase().replace(" ", "-");
    return adapted.damageComponents.some(component => (component.materials ?? []).includes(material)
        && (!match[1] || String(component.type).toLowerCase() === match[1].toLowerCase()));
};
// "On a hit, the splinters deal 4d6 piercing damage. The splinters deal double damage on a critical hit and @Damage[(floor(@item.level/2))[bleed]] damage."
const HIT_THEN_CRIT_EXTRA = new RegExp(String.raw`^${ATTACK}\. On a hit, the [a-z]+ deals? ${DICE}\. The [a-z]+ deals? double damage on a critical hit and (@Damage\[[^\[\]]+\[(?:bleed|persistent,[a-z]+)\]\]) damage\.$`);
const ATTACK_IN_DAMAGE = /\bdepending on (?:the result of )?your spell attack roll\b/;
// "On a hit, the target takes 6d4 piercing damage and is Dazzled for 1 round (double damage and Blinded for 1 round on a critical hit)."
// "If you hit, you deal <damage>. On a critical success, you deal double damage and double bleed damage." — the second
// "double" names the spell's persistent entry, which doubles with the rest.
const HIT_DOUBLE_NAMED = new RegExp(String.raw`^${ATTACK}\. (?:If you hit|On a hit|On a success), you deal ${DICE}\. On a critical (?:success|hit), you deal double damage and double ([a-z]+) damage\.$`);
// "On a success, the icicle deals <damage>, and if the target is undead, the icicle deals an additional 1d4 vitality damage.
// On a critical success, the target takes double damage and takes a –10-foot circumstance penalty to its Speeds for 1 round
// as the icicle lodges inside them." The trait's extra damage is the conditional-damage rule; the critical rider is a row.
const HIT_TRAIT_EXTRA = new RegExp(String.raw`^${ATTACK}\. On a (?:success|hit), the [a-z]+ deals ${DICE}, and if the target is (?:an? )?([a-z-]+), the [a-z]+ deals an additional (\d+d\d+) ([a-z]+) damage\. On a critical (?:success|hit), the target takes double damage(?: and (takes an? [–-]\d+-foot (?:status|circumstance) penalty to its Speeds for \d+ rounds?))?(?: as (?:the|it|its) [a-z ]+)?\.$`);
// "On a hit, you deal 2d6 poison damage, plus you blast the target's eyes, making them Dazzled for 1 round as the stinging
// ink blurs … On a critical hit, double the poison damage, and the target becomes dazzled for 1 minute by the foul ink."
// The critical row's condition replaces the hit row's (its own duration).
const HIT_CONDITION_CRIT_CONDITION = new RegExp(String.raw`^${ATTACK}\. On a hit, you deal ${DICE}, plus [a-z' ]+?, making (?:them|it|the target) (${CONDITION})(?: as [a-z' ]+)?\. On a critical hit, double the (?:([a-z]+) )?damage, and the target becomes (${CONDITION})(?: by [a-z' ]+)?\.$`);
// "If you hit, you deal 5d10 acid damage and 1d6 persistent acid damage, and the target is Blinded for the duration."
// with "When the target's persistent acid damage ends, the spell automatically ends.": the condition lasts the spell's
// duration or until that persistent damage ends.
// "… dealing 1d6 acid damage and causing the target to be Dazzled for 1 round if you hit. On a critical hit, you deal double damage
// and the target takes @Damage[@item.level[persistent,acid]] damage." (a critical hit is a hit: the condition too)
const HIT_CAUSING_CRIT_PERSISTENT = new RegExp(String.raw`^${ATTACK}, dealing ${DICE} and causing the target to be (${CONDITION}) if you hit\. On a critical hit, you deal double damage and the target (?:also )?takes (@Damage\[[^\[\]]+\[persistent,[a-z]+\]\]) damage\.$`);
const HIT_CONDITION_FOR_DURATION = new RegExp(String.raw`^${ATTACK}\. (?:If you hit|On a hit), you deal ${DICE}, and the target is (@@\d+@@|[A-Za-z]+(?: \d+)?) for the duration\.$`);
const SPELL_ENDS_WITH_PERSISTENT = /^When the target's persistent ([a-z]+) damage ends, the spell (?:automatically )?ends\.$/;
// "The foam can be removed with 3 Interact actions, which ends the persistent acid damage." (and "These Interact
// actions don't need to be consecutive."): the GM removes the persistent damage; what's linked to it ends with it.
const REMOVAL = /^The [a-z]+ can be removed with (\d+|an?) Interact actions?, which ends the persistent ([a-z]+) damage\.$/;
const REMOVAL_NOTE = /^These Interact actions don't need to be consecutive\.$/;
// A mark with no rule: "The ink stain remains for 1 hour before fading, although vigorous cleansing (or magic such as a
// prestidigitation cantrip) can remove the ink before then."
// "On any result other than a critical failure, the ground in the target's space catches fire, dealing @Damage[(@item.rank)d6[fire]]
// damage to each creature that ends its turn in one of the squares.": a hazard left in the target's squares for the spell's
// duration. The module places a region there and deals the damage (no save) when a creature ends its turn (or enters) inside.
const GROUND_HAZARD = /^On (any result other than a critical failure|a hit|a critical hit), the (?:ground|floor) in the target's space ([a-z ]{3,40}?), dealing @Damage\[((?:\([^\[\]]+\)|\d+)d\d+|\([^\[\]]+\))\[([a-z]+)\]\] damage to each creature that (ends its turn|starts its turn|enters or ends its turn|enters) in (?:one of )?(?:the|those) squares?\.$/i;
const HAZARD_DEGREES = { "any result other than a critical failure": ["criticalSuccess", "success", "failure"], "a hit": ["criticalSuccess", "success"], "a critical hit": ["criticalSuccess"] };
const HAZARD_EVENTS = { "ends its turn": ["turn-end"], "starts its turn": ["turn-start"], "enters or ends its turn": ["enter", "turn-end"], "enters": ["enter"] };
const COSMETIC_MARK = /^The [a-z]+ stain remains for \d+ (?:hours?|days?) before fading(?:, although [^.]+ can remove the [a-z]+ before then)?\.$/;
const HIT_CONDITION = new RegExp(String.raw`^${ATTACK}\. On a hit, the target takes ${DICE} and is (${CONDITION}) \(double damage and (${CONDITION}) on a critical hit\)\.$`);
// "If you hit, you deal <damage>. On a critical success, the target also takes @Damage[…persistent…] damage." /
// "… On a critical success, the target is also Deafened for 1 round." — the critical rider joins the doubled row.
const HIT_CRIT_ALSO = new RegExp(String.raw`^${ATTACK}\. (?:If you hit|On a hit|On a success), you (?:deal|inflict) ${DICE}\. On a critical (?:success|hit), (?:the target (?:(?:also )?takes (@Damage\[[^\[\]]+\[persistent,[a-z]+\]\]) damage|is also (${CONDITION})|takes double damage and is (${CONDITION}))|the [a-z]+ knocks the target (${CONDITION}))\.$`);
// "If you hit, you deal 4d6 bludgeoning damage plus 1d6 bludgeoning splash damage. On a critical hit, double the initial
// damage, but not the splash damage, and the target you hit must succeed at a Fortitude saving throw or fall Prone."
// The critical row's save is the ordinary follow-up save; splash damage is never doubled.
// "On a hit, the target takes 2d4 spirit damage (double damage on a critical hit). If you critically hit, the target is Dazzled until the end of your
// next turn." (Magic+'s Dynamic Divine Lance, three actions): the critical row's condition for that time.
const HIT_PAREN_CRIT_CONDITION = new RegExp(String.raw`^${ATTACK}\. On a hit, the target takes ${DICE} \(double damage on a critical hit\)\. If you critically hit, the target is (${CONDITION}) (until the (?:start|end) of your next turn)\.$`);
const HIT_CRIT_SPLASH_SAVE = new RegExp(String.raw`^${ATTACK}\. (?:If you hit|On a hit), you deal ${DICE}\. On a critical hit, double the initial damage, but not the splash damage(?:, and the target you hit (must succeed at an? (?:Fortitude|Reflex|Will) (?:save|saving throw) or [^.]+))?\.$`);
// Blasts repeated during the turn: "For the remainder of your turn, you can blast targets within 30 feet with this fire
// by spending a single action which has the attack and concentrate traits. When you do so, attempt a ranged spell
// attack roll." Each blast is its own attack card; the pair reads as the attack.
const REPEAT_WINDOW = /^For the remainder of your turn, you can blast targets within (\d+) feet with this [a-z]+ by spending a single action which has the attack and concentrate traits\.$/;
const REPEAT_ATTACK = /^When you do so, attempt a ranged spell attack roll\.$/;
// “You can attack with your words once when you finish Casting the Spell, and can repeat the attack once on each of your subsequent
// turns by taking a single action, which has the attack, concentrate, and linguistic traits.” / “After your third attack total, the
// spell ends.” / “When you attack with biting words, make a ranged spell attack roll …”: one attack now, and one more on each later
// turn of the caster's (a single action), up to the stated total, within the spell's duration.
const REPEAT_TURNS = /^You can [a-z ]{3,40}? once (?:when )?you finish Casting the Spell,? and can repeat the attack once on each of your subsequent turns by taking a single action, which has the ([a-z, ]+?) traits\.$/i;
const REPEAT_TOTAL = /^After your (second|third|fourth|fifth) (?:[a-z]+ )?attack(?: total)?, the spell ends\.$/i;
const WHEN_ATTACK = /^When you attack with [a-z' ]+, (make an? (?:ranged |melee )?spell attack .+)$/i;

const matchesDamage = (adapted, formula, type) => formula === LIST_FORMULA && type === LIST_TYPE
    ? adapted.damageComponents.length >= 1
    : adapted.damageComponents.length === 1 && !adapted.damageComponents[0].category
        && String(adapted.damageComponents[0].formula).replace(/\s+/g, "") === formula
        && String(adapted.damageComponents[0].type).toLowerCase() === type.toLowerCase();

// Several damage entries named together (or the spell's one persistent entry): "1d4 slashing damage and 1d4 electricity damage", "2d6 piercing damage and
// 1d6 cold damage", "1d8 fire damage and 1d8 persistent fire damage", "2d6 slashing damage, plus 2 persistent bleed
// damage". A list naming every structured entry exactly once becomes one token the forms read as "the damage".
const LIST_FORMULA = "0d0", LIST_TYPE = "components";
// "1 splash acid damage" / "1d4 sonic splash damage" name a splash entry.
const ITEM = /(\d+d\d+|\d+) (persistent |splash )?([a-z]+)( splash)? damage/y;
const JOIN = /(?:,? and|,? plus) /y;
const persistentEntry = component => component.category === "persistent" || component.type === "bleed";
function componentListText(text, adapted) {
    const components = adapted.damageComponents ?? [];
    // One entry is read as a list only when it's persistent ("dealing 2d6 persistent acid damage").
    const lone = components.length === 1 && persistentEntry(components[0]);
    if (components.length < 2 && !lone) return text;
    // "your choice of 2d6 slashing damage or 2d6 piercing damage": the PF2e variant cast carries the chosen type.
    let source = text.replace(/\byour choice of (\d+d\d+) ([a-z]+) damage or (\d+d\d+) ([a-z]+) damage\b/g, (all, f1, t1, f2, t2) => {
        const chosen = components.filter(component => !persistentEntry(component) && [t1, t2].includes(String(component.type).toLowerCase())
            && String(component.formula).replace(/\s+/g, "") === (String(component.type).toLowerCase() === t1 ? f1 : f2));
        return chosen.length === 1 ? `${String(chosen[0].formula).replace(/\s+/g, "")} ${String(chosen[0].type).toLowerCase()} damage` : all;
    });
    const matchItem = (value, at) => { ITEM.lastIndex = at; return ITEM.exec(value); };
    for (let start = 0; start < source.length; start++) {
        if (start > 0 && /[a-z0-9]/i.test(source[start - 1])) continue;
        const items = [];
        let at = start, first = matchItem(source, at);
        if (!first) continue;
        items.push(first); at = ITEM.lastIndex;
        for (;;) {
            JOIN.lastIndex = at;
            const join = JOIN.exec(source);
            if (!join) break;
            const next = matchItem(source, JOIN.lastIndex);
            if (!next) break;
            items.push(next); at = ITEM.lastIndex;
        }
        if (items.length < (lone ? 1 : 2)) continue;
        const used = new Set();
        const covered = items.every(([, formula, prefix, type, suffix]) => {
            const splash = prefix === "splash " || Boolean(suffix);
            if (splash && prefix === "persistent ") return false;
            const component = components.find(candidate => !used.has(candidate.id)
                && String(candidate.formula).replace(/\s+/g, "") === formula && String(candidate.type).toLowerCase() === type
                && persistentEntry(candidate) === (prefix === "persistent " || type === "bleed")
                && (candidate.category === "splash") === splash);
            if (!component) return false;
            used.add(component.id);
            return true;
        });
        if (!covered || used.size !== components.length) return source;
        return `${source.slice(0, start)}${LIST_FORMULA} ${LIST_TYPE} damage${source.slice(at)}`;
    }
    return source;
}
// A condition that lasts as long as the spell's persistent damage: "The target is Enfeebled 1 until they recover from
// their persistent fire damage." / "Additionally, the target is Enfeebled 1 until it removes the persistent poison damage."
const PERSISTENT_CONDITION = /^(?:Additionally, )?the target is (@@\d+@@|[A-Za-z]+(?: \d+)?) until (?:they|it) (?:recovers? from|removes?) (?:their|its|the) persistent ([a-z]+) damage\.$/i;
// An Effect that lasts as long as the spell's persistent damage: "As long as the target is taking persistent damage from
// this spell, <what the Effect does>." followed by the Effect link.
const PERSISTENT_EFFECT = /^As long as the target is taking (?:this )?persistent (?:([a-z]+) )?damage(?: from this spell)?, (.+)\.$/i;
const EFFECT_LINK = /^@@(\d+)@@$/;
// The spell's persistent entry of that type (one, and only one).
function persistentOfType(adapted, type) {
    const matches = (adapted.damageComponents ?? []).filter(component => persistentEntry(component) && (!type || String(component.type).toLowerCase() === type.toLowerCase()));
    return matches.length === 1 ? String(matches[0].type).toLowerCase() : null;
}
// A written miss row keeping one entry: "The target takes the electricity damage, but not the slashing damage."
const SELECTIVE_ROW = /^The target takes the ([a-z]+) damage, but not the ([a-z]+) damage\.$/i;

const htmlToPlain = html => String(html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z@])/).find(sentence => REPEAT_WINDOW.test(sentence.trim()))?.trim() ?? "";
// Paragraphs describing PF2e variants by action count: "<span class="action-glyph">3</span> This spell has a range of
// 60 feet and deals half damage on a failure (but not a critical failure) as …", and a "Two Rounds" paragraph. The cast
// variant's paragraph applies (its range must be the variant's range); every other paragraph must also read as a
// variant paragraph and is set aside, because it describes a different variant.
const ACTIONS_INTRO = /^The number of actions you spend when Casting this Spell determines (?:its |the )?range(?:,? (?:as well as|and) other parameters)?\.$/i;
const ACTION_PARAGRAPH = /^This spell has a range of (\d+) feet(?: and deals half damage on a failure \(but not a critical failure\)(?: as [a-z ,']+)?)?\.$/i;
// (PF2e 8.6 writes Moonlight Ray's Success row before its Critical Success: a run of degree rows, each once, is read in the usual order.)
const ROW_ORDER = ["Critical Success", "Success", "Failure", "Critical Failure"];
function usualRowOrder(html) {
    const run = /(?:<p>\s*<strong>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>[\s\S]*?<\/p>\s*)+/.exec(html);
    if (!run) return html;
    const rows = [...run[0].matchAll(/<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>[\s\S]*?<\/p>/g)];
    if (rows.length < 2 || new Set(rows.map(row => row[1])).size !== rows.length
        || rows.every((row, index) => !index || ROW_ORDER.indexOf(row[1]) > ROW_ORDER.indexOf(rows[index - 1][1]))) return html;
    const sorted = [...rows].sort((a, b) => ROW_ORDER.indexOf(a[1]) - ROW_ORDER.indexOf(b[1])).map(row => row[0]).join("\n");
    return `${html.slice(0, run.index)}${sorted}\n${html.slice(run.index + run[0].length)}`;
}

function variantParagraphs(base, adapted) {
    const time = String(adapted.activation?.time ?? "").trim();
    const range = String(adapted.targeting?.range ?? "").trim().toLowerCase();
    let halfOnFailure = false, own = false, found = false;
    const kept = base.replace(/<p>\s*<span class="action-glyph">\s*(\d)\s*<\/span>([\s\S]*?)<\/p>/gi, (paragraph, actions, body) => {
        found = true;
        const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const match = ACTION_PARAGRAPH.exec(text);
        if (!match) return paragraph; // not a variant paragraph: left for the compilers to judge (and block)
        if (actions === time) {
            if (range !== `${match[1]} feet`) return paragraph;
            own = true;
            halfOnFailure = /half damage on a failure/i.test(text);
        }
        return "";
    }).replace(/<p>\s*<strong>\s*(?:One|Two|Three) Rounds?\s*<\/strong>[\s\S]*?<\/p>/gi, paragraph => {
        found = true;
        return /^\d+ rounds?$/i.test(time) ? paragraph : "";
    });
    if (!found) return { base, halfOnFailure: false };
    if (!own) return nope(277);
    return { base: kept, halfOnFailure };
}

// "you deal 2d6 bludgeoning, piercing, or slashing damage—as appropriate for the object you hurled": the PF2e
// variant cast carries the type, which must be one of the listed types.
function typeChoiceText(text, adapted) {
    return text.replace(/\b(\d+d\d+) ((?:[a-z]+, )+or [a-z]+|[a-z]+ or [a-z]+) damage(?:\s*[—–-]\s*|, )as appropriate for [^.]+/g, (all, formula, list) => {
        const types = list.split(/,? or |, /).map(type => type.trim());
        const components = adapted.damageComponents ?? [];
        return components.length === 1 && types.includes(String(components[0].type).toLowerCase())
            && String(components[0].formula).replace(/\s+/g, "") === formula ? `${formula} ${String(components[0].type).toLowerCase()} damage` : all;
    });
}
// Clarifications that add no rule to the attack: "No specific traits or magic properties of the hurled item affect
// the attack or the damage."; the metal of variant-chosen needles, which the variant's damage entry carries
// ("The needles impart any special properties of the metal that forms them; …" / "All the needles are made of the
// same metal, and the metal returns to you after the attack.").
const CASTER_FORM = /^If you are an? ([a-z]+), increase the ([a-z]+) damage by (\d+)d(\d+) and increase the @@(\d+)@@ you deal on a critical hit by (\d+)d(\d+)\.$/;
const APPEARANCE = /^This spell doesn't alter an? ([a-z]+)'s appearance\.$/;
const matchesDamageType = (adapted, type) => (adapted.damageComponents ?? []).length === 1 && String(adapted.damageComponents[0].type).toLowerCase() === type;
const NO_RULE = [
    // ("After the spell, your head sews back together as if it had never split apart.": what the caster's body does afterwards.)
    /^After the spell, your [a-z]+ sews back together as if it had never split apart\.$/,
    /^No (?:specific )?traits or (?:magic )?properties of the [a-z ]+ affect the attack or the damage\.$/i,
    /^The [a-z]+ impart any special properties of the metal that forms them; for instance, [^.]+\.$/i,
    /^All the [a-z]+ are made of the same metal, and the metal returns to you after the attack\.$/i
];
// "If the target is within your melee reach, you can choose to make a melee spell attack with the flame instead of a
// ranged spell attack, which increases all the spell's damage dice to d6s." — the melee choice is its own PF2e
// variant; the ranged variant (not touch) keeps the stated dice.
const MELEE_OPTION = /^If the target is within your melee reach, you can choose to make a melee spell attack(?: with the [a-z]+)? instead of a ranged spell attack, which increases all the spell's damage dice to d(\d+)s\.$/i;

// Target-dependent attack adjustments the GM answers per target on the card:
//   "if the target is wearing metal armor or is made of metal, you gain a +1 circumstance bonus to your attack roll with …"
//   "if the target has any circumstance bonuses to AC (such as from a shield or cover), reduce that bonus by 2 for this attack"
// and Shocking Grasp's form, whose metal target also takes persistent damage on a hit (not doubled on a critical hit).
const METAL = /^if the target is wearing metal armor or is made of metal, you gain a \+(\d+) circumstance bonus to your attack roll with [a-z ]+$/i;
const COVER_REDUCTION = /^if the target has any circumstance bonuses to AC \(such as from a shield or cover\), reduce that bonus by (\d+) for this attack$/i;
const METAL_PERSISTENT = /^If the target is wearing metal armor or is made of metal, you gain a \+(\d+) circumstance bonus to your attack roll with [a-z ]+, and the target also takes (@Damage\[[^\[\]]+\[persistent,[a-z]+\]\]) damage on a hit\.$/;
const NOT_PERSISTENT = /^On a critical hit, double the initial damage, but not the persistent damage\.$/;
// "This attack ignores the target's Concealed condition and ignores all cover except greater cover." — the GM applies it.
const IGNORES_COVER = /^This attack ignores the target's @@\d+@@ condition and ignores all cover except greater cover\.$/;
const metalQuestion = bonus => ({ question: "Is the target wearing metal armor or made of metal?", modifierType: "circumstance",
    choices: [{ label: `Yes (+${bonus} circumstance to the attack)`, value: bonus }, { label: "No", value: 0 }] });
// A benefit for the caster, carried by the linked Effect: "Regardless of whether you hit, you gain a fly Speed of 15
// feet until the end of your next turn." / "You gain a +1 circumstance bonus to your AC for the duration, as …" (always),
// or "On a hit, the mouth deals 2d6 piercing damage, and you gain 1d4 temporary Hit Points that last until the
// beginning of your next turn." (on a hit). The Effect's rules are checked against the clause when the plan is built.
const LODGED = /^The ([a-z]+) remains lodged within a creature it hits, making the target (@@\d+@@) \(or increasing its ([a-z-]+) condition by 1 if it is already ([a-z-]+)\) for (\d+) (minute|round)s? or until the \1 is removed with a successful Athletics check against your spell DC as an Interact action, whichever comes first\.$/;
const ALWAYS_BENEFIT = /^(?:Regardless of whether you hit, (you gain .+)|(You gain an? .+ for the duration)(?:, as [^.]+)?)\.$/;
// Movement after the attack, carried by the caster's Effect: "Then, Swim up to 30 feet; if you already have a swim Speed, you can
// Swim up to your Speed with a +10-foot circumstance bonus." / "You gain a +2 circumstance bonus to your AC against reactions
// triggered by this movement." / "At the end of the movement, your lower limbs return to normal." The caster moves the token.
const MOVE_AFTER = /^Then, (Swim|Stride|Fly|Climb|Burrow) up to (\d+) feet; if you already have an? ([a-z]+) Speed, you can \1 up to your Speed with a \+(\d+)-foot (circumstance|status) bonus\.$/;
const MOVE_AC = /^You gain a \+(\d) (circumstance|status) bonus to your AC against reactions triggered by this movement\.$/;
const MOVE_END = /^At the end of the movement, [a-z' ]+ returns? to normal\.$/;
const HIT_BENEFIT = new RegExp(String.raw`^((?:On a hit|If you hit), the [a-z]+ deals? \d+d\d+ [a-z]+ damage), and (you gain .+)\.$`);
function attackAdjustments(sentences, unmask, heightenedText, links = []) {
    let adjustment = null, gated = null, notPersistent = false, casterLink = null, casterBenefit = null;
    const effectLinkSentences = [];
    const reminders = [];
    const kept = [];
    for (const sentence of sentences) {
        // An Effect link stays where it is unless a caster-benefit clause claims it (other rules own their links).
        const linkOnly = /^@@(\d+)@@$/.exec(sentence);
        if (linkOnly && /^@UUID\[Compendium\.pf2e\.spell-effects\./.test(links[Number(linkOnly[1])] ?? "")) {
            effectLinkSentences.push(sentence);
            kept.push(sentence);
            continue;
        }
        const moveAfter = MOVE_AFTER.exec(sentence);
        if (moveAfter && moveAfter[1].toLowerCase() === moveAfter[3].toLowerCase()) {
            if (casterBenefit) return nope(345);
            casterBenefit = { when: "always", claimText: unmask(sentence), movement: { action: moveAfter[1], feet: Number(moveAfter[2]) } };
            reminders.push({ kind: "caster-movement", text: unmask(sentence), sourceText: unmask(sentence) });
            continue;
        }
        if (casterBenefit?.movement && (MOVE_AC.test(sentence) || MOVE_END.test(sentence))) {
            casterBenefit.claimText += ` ${unmask(sentence)}`;
            if (MOVE_END.test(sentence)) casterBenefit.movement.ends = true;
            continue;
        }
        const always = ALWAYS_BENEFIT.exec(sentence);
        if (always) { if (casterBenefit) return nope(356); casterBenefit = { when: "always", claimText: unmask(sentence) }; continue; }
        const onHit = HIT_BENEFIT.exec(sentence);
        if (onHit) { if (casterBenefit) return nope(358); casterBenefit = { when: "hit", claimText: unmask(onHit[2]) }; kept.push(`${onHit[1]}.`); continue; }
        const split = new RegExp(String.raw`^(${ATTACK}); (if the target .+)\.$`).exec(sentence);
        if (split && !adjustment) {
            const metal = METAL.exec(split[2]), cover = COVER_REDUCTION.exec(split[2]);
            if (metal) adjustment = { ...metalQuestion(Number(metal[1])), sourceText: sentence };
            else if (cover) {
                const most = Number(cover[1]);
                adjustment = { question: "What circumstance bonus to AC (shield, cover) does the target have against this attack? The attack reduces it by up to " + most + ".",
                    modifierType: "untyped", sourceText: sentence,
                    choices: Array.from({ length: most + 1 }, (_, value) => ({ label: value === 0 ? "None" : value === most ? `+${value} or more` : `+${value}`, value })) };
            } else return nope(368);
            kept.push(`${split[1]}.`);
            continue;
        }
        const gatedMatch = METAL_PERSISTENT.exec(sentence);
        if (gatedMatch && !adjustment) {
            adjustment = { ...metalQuestion(Number(gatedMatch[1])), sourceText: sentence };
            gated = { formula: gatedMatch[2].replace(/^@Damage\[/, "").replace(/\]$/, ""), sourceText: sentence };
            if ([...gated.formula.matchAll(/@([a-z0-9_.]+)/gi)].some(match => !["item.rank", "item.level"].includes(match[1].toLowerCase()))) return nope(376);
            continue;
        }
        // "… but not the persistent damage" belongs with the metal-gated persistent roll (other forms read it themselves).
        if (gated && NOT_PERSISTENT.test(sentence)) { notPersistent = true; continue; }
        if (IGNORES_COVER.test(sentence)) {
            // The link's label reads as plain text on the card; a Heightened entry that changes the rule is named with its rank.
            const plain = unmask(sentence).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
            const rank = /Heightened \(([^)]+)\)(?:(?!Heightened \()[\s\S])*?\bignores cover completely\b/i.exec(heightenedText.replace(/<[^>]+>/g, " "));
            reminders.push({ kind: "attack-cover", text: `${plain}${rank ? ` Heightened (${rank[1]}): it ignores cover completely.` : ""}` });
            continue;
        }
        kept.push(sentence);
    }
    if (gated && !notPersistent) return nope(390); // a gated persistent must say it isn't doubled
    if (casterBenefit) {
        // The clause needs exactly one Effect link, which it then owns.
        if (effectLinkSentences.length !== 1) return nope(393);
        casterLink = links[Number(/^@@(\d+)@@$/.exec(effectLinkSentences[0])[1])];
        kept.splice(kept.indexOf(effectLinkSentences[0]), 1);
    }
    return { sentences: kept, adjustment, gated, reminders, ...(casterLink ? { casterEffect: { link: casterLink, ...casterBenefit } } : {}) };
}

export function expandSpellAttackTable(adapted) {
    if (!adapted.activation?.traits?.includes("attack")) return nope(401);
    // The item's own save is allowed only as a result row's follow-up save ("… must succeed at a Fortitude saving throw").
    const followUpSave = adapted.defense?.kind === "save" && adapted.defense.basic === false
        && new RegExp(String.raw`must succeed at an? ${adapted.defense.statistic} (?:save|saving throw)`, "i").test(String(adapted.descriptionHTML ?? ""))
        && !/\bbasic (?:Fortitude|Reflex|Will) save\b/i.test(String(adapted.descriptionHTML ?? ""));
    if (adapted.defense?.kind !== "none" && !followUpSave) return nope(406);
    // Repeated blasts target one creature each, whatever the item's (empty) Target says.
    const repeatable = REPEAT_WINDOW.test(htmlToPlain(adapted.descriptionHTML)) || /\brepeat the attack once on each of your subsequent turns\b/i.test(String(adapted.descriptionHTML ?? ""));
    // PF2e sometimes leaves Target empty for "Make a spell attack roll against the target." — one creature.
    const namesTarget = /\bspell attack(?: roll)? against the target(?:'s AC)?\./.test(String(adapted.descriptionHTML ?? ""));
    const targets = String(adapted.targeting?.target ?? "").trim() || (repeatable || namesTarget ? "1 creature" : "");
    if (!TARGETS.test(targets) || adapted.targeting?.area) return nope(412);
    const multiple = !/^(?:1|one) (?:living )?creature(?: or (?:unattended )?object)?$/i.test(targets) && !TRIGGERING_TARGET.test(targets);
    // The triggering creature is attacked only by a spell whose attack names it.
    if (TRIGGERING_TARGET.test(targets) && !/\bagainst the triggering creature's AC\b/.test(String(adapted.descriptionHTML ?? ""))) return nope(415);
    const html = String(adapted.descriptionHTML ?? "");
    // Rules up to the heightening entries; an <hr> between the attack and its table is dropped.
    const heightening = html.search(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i);
    const base0 = (heightening >= 0 ? html.slice(0, heightening) : html).replace(/<hr\b[^>]*>/gi, "");
    const variants = variantParagraphs(base0, adapted);
    if (!variants) return nope(421);
    const base = usualRowOrder(variants.base);
    const rest = heightening >= 0 ? [html.slice(heightening)] : [];
    const links = [];
    const masked = base.replace(LINK, link => `@@${links.push(link) - 1}@@`);
    const unmask = text => text.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]);
    // A variant dealing "half damage on a failure (but not a critical failure)" has a half-damage miss row.
    // A condition the hit leaves (the lodged projectile, below), added to both hit rows.
    let hitRider = null;
    const withRider = row => hitRider ? `${row.replace(/\.$/, "")} and is ${hitRider.condition}.` : row;
    const table = (critical, hit) => [["Critical Success", withRider(critical)], ["Success", withRider(hit)],
        ["Failure", variants.halfOnFailure ? "The target takes half damage." : "The target is unaffected."], ["Critical Failure", "The target is unaffected."]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const saveSentence = "The target must attempt a spell attack.";

    // A written table: the attack sentence (and optionally the damage) before it, hit rows only.
    const headings = [...base.matchAll(HEADING)].map(match => match[1].toLowerCase());
    if (headings.length) {
        // Hit rows, optionally a written miss row; a critical failure is always a miss.
        const allRows = headings.join() === "critical success,success,failure,critical failure";
        if (!["critical success,success", "critical success,success,failure"].includes(headings.join()) && !allRows) return nope(441);
        const missRows = allRows ? ""
            : headings.includes("failure")
                ? "<p><strong>Critical Failure</strong> As failure.</p>"
                : "<p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is unaffected.</p>";
        const [preambleHTML] = masked.split(/<p>\s*<strong\b/i);
        if (variants.halfOnFailure) return nope(447); // a written table states its own rows
        const preamble = componentListText(typeChoiceText(preambleHTML.replace(/<[^>]+>/g, " ")
            .replace(/@Damage\[(\d+d\d+)\[([a-z]+)\]\] damage/gi, "$1 $2 damage").replace(/\s+/g, " ").trim(), adapted), adapted);
        // ("The ray deals 5d6 cold damage; if the target has the unholy trait, you deal an extra 5d6 spirit damage." is the damage and the
        // conditional-damage sentence.)
        const split = preamble.replace(/^(.*? deals? \d+d\d+ [a-z]+ damage); if (the target has the [a-z-]+ trait, you deal an extra \d+d\d+ [a-z]+ damage\.)/m, (all, first, second) => `${first}. If ${second}`)
            .replace(/ deals? (\d+d\d+ [a-z]+ damage); if (the target has the [a-z-]+ trait, you deal an extra \d+d\d+ [a-z]+ damage\.)/, (all, first, second) => ` deals ${first}. If ${second}`);
        // (Silver Spear, PF2e 8.6: a table under an attack spell's text that names no attack — the attack trait's spell attack —, "The spear is made of silver and
        // deals 12d6 piercing damage." of an entry carrying the material, and "If the target is a fiend, it deals an additional 12d6 spirit damage." — the
        // trait's extra damage.)
        let stated = split.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean)
            .map(sentence => sentence.replace(/^The ([a-z]+) is made of (silver|cold iron|adamantine) and deals (\d+d\d+) ([a-z]+) damage\.$/, (all, noun, material, dice, type) =>
                adapted.damageComponents.some(component => String(component.formula).replace(/\s+/g, "") === dice && String(component.type).toLowerCase() === type && (component.materials ?? []).includes(material.replace(" ", "-")))
                    ? `The ${noun} deals ${dice} ${type} damage.` : all)
                .replace(/^If the target is an? ([a-z-]+), it deals an additional (\d+d\d+ [a-z]+ damage)\.$/, "If the target has the $1 trait, you deal an extra $2."));
        const range = String(adapted.targeting?.range ?? "").trim().toLowerCase();
        if (!stated.some(sentence => new RegExp(String.raw`^${ATTACK}\b`).test(sentence)) && /^\d+ feet$/.test(range) && /^(?:1|one) creature$/i.test(targets)
            && headings.join() === "critical success,success" && stated.some(sentence => /^The [a-z]+ deals \d+d\d+ [a-z]+ damage\.$/.test(sentence)))
            stated = [...stated.filter(sentence => !/^The [a-z]+ deals \d+d\d+ [a-z]+ damage\.$/.test(sentence) && !/^If the target has the [a-z-]+ trait, you deal an extra /.test(sentence)),
                "Make a ranged spell attack roll against the target.", ...stated.filter(sentence => /^The [a-z]+ deals \d+d\d+ [a-z]+ damage\.$/.test(sentence) || /^If the target has the [a-z-]+ trait, you deal an extra /.test(sentence))];
        const adjusted = attackAdjustments(stated, unmask, rest.join(" "), links);
        if (!adjusted || adjusted.gated || adjusted.casterEffect) return nope(455); // read in the one-sentence forms only // a gated persistent rider is read in the one-sentence form only
        const sentences = adjusted.sentences;
        // The preamble is narration, one attack statement, and at most one damage sentence (the spell's damage).
        let casterForm = null;
        let attack = null, damage = 0, sharedMap = false, criticalExtra = null, linkedEffect = null, linkedLink = null, tableEffectLink = null, lodged = null, shieldBlocked = null, voidConstructs = null;
        const kept = [], materials = [];
        const narration = [];
        for (const sentence of sentences) {
            const deals = DEALS_BEFORE_TABLE.exec(sentence);
            if (attack && !shieldBlocked && SHIELD_BLOCKED.test(sentence)) { shieldBlocked = unmask(sentence); continue; }
            if (attack && !voidConstructs && VOID_CONSTRUCTS.test(sentence) && adapted.damageComponents.every(component => String(component.type).toLowerCase() === "void")) { voidConstructs = unmask(sentence); continue; }
            // The lodging projectile, its explosion and its removal.
            const lodges = attack && !lodged ? LODGES.exec(sentence) : null;
            if (lodges) { if (!matchesDamage(adapted, lodges[2], lodges[3]) || damage++) return nope(467); lodged = { noun: lodges[1], sentences: [sentence] }; continue; }
            const explodes = lodged && !lodged.explosion ? EXPLODES.exec(sentence) : null;
            if (explodes && explodes[1] === lodged.noun) { lodged.explosion = { die: Number(explodes[2]), type: explodes[3] }; lodged.sentences.push(unmask(sentence)); continue; }
            const removed = lodged && !lodged.removal ? REMOVED.exec(sentence) : null;
            if (removed && removed[1] === lodged.noun) { lodged.removal = sentence; lodged.sentences.push(sentence); continue; }
            if (new RegExp(String.raw`^${ATTACK}\.$`).test(sentence) && !attack) { attack = sentence; continue; }
            // "Make a spell attack roll against the target's AC, dealing 2d4 fire damage on a hit." before a written table.
            const dealing = !attack && new RegExp(String.raw`^${ATTACK}, dealing ${DICE} on a (?:hit|success)\.$`).exec(sentence);
            if (dealing) { if (!matchesDamage(adapted, dealing[1], dealing[2]) || damage++) return nope(475); attack = sentence; continue; }
            // "If you hit, you deal 2d6 bludgeoning damage." — the damage the rows scale.
            const onHit = attack && new RegExp(String.raw`^(?:If you hit|On a hit|On a success), you deal ${DICE}\.$`).exec(sentence);
            if (onHit) { if (!matchesDamage(adapted, onHit[1], onHit[2]) || damage++) return nope(478); continue; }
            // "If you are a gug, increase the piercing damage by 2d6 and increase the Persistent Bleed Damage you deal on a critical hit by
            // 1d8." with "This spell doesn't alter a gug's appearance.": the caster's answer on the card adds the dice.
            const form = attack && !casterForm ? CASTER_FORM.exec(sentence) : null;
            if (form) {
                if (!/\{Persistent Bleed Damage\}$/.test(links[Number(form[5])] ?? "") || !matchesDamageType(adapted, form[2])) return nope(486);
                casterForm = { creature: form[1], dice: { count: Number(form[3]), faces: Number(form[4]), type: form[2] }, persistent: { count: Number(form[6]), faces: Number(form[7]), type: "bleed" },
                    sourceText: [unmask(sentence)] };
                continue;
            }
            const look = casterForm ? APPEARANCE.exec(sentence) : null;
            if (look && look[1] === casterForm.creature) { casterForm.sourceText.push(sentence); continue; }
            if (attack && NO_RULE.some(pattern => pattern.test(sentence))) continue;
            const melee = attack ? MELEE_OPTION.exec(sentence) : null;
            if (melee) {
                // Only the ranged variant is read here; its dice must not already be the melee size.
                if (String(adapted.targeting?.range ?? "").trim().toLowerCase() === "touch"
                    || adapted.damageComponents.some(component => new RegExp(`d${melee[1]}\\b`).test(String(component.formula)))) return nope(484);
                continue;
            }
            if (attack && ACTIONS_INTRO.test(sentence)) continue;
            if (multiple && SHARED_MAP.test(sentence)) { sharedMap = true; continue; }
            if (attack && CONDITIONAL.test(sentence)) { kept.push(unmask(sentence)); continue; }
            // "You gain temporary Hit Points for 1 minute equal to half the piercing damage the target takes.": kept for the damage-benefit
            // compiler (the preamble check refuses it if that compiler doesn't claim it).
            if (attack && isDamageBenefitSentence(unmask(sentence))) { kept.push(unmask(sentence)); continue; }
            // "As long as the target is taking persistent damage from this spell, …" and its Effect link.
            const linked = attack && !linkedEffect ? PERSISTENT_EFFECT.exec(sentence) : null;
            if (linked) { linkedEffect = { type: persistentOfType(adapted, linked[1]), claimText: unmask(sentence) }; if (!linkedEffect.type) return nope(492); continue; }
            const link = EFFECT_LINK.exec(sentence);
            if (link && linkedEffect && !linkedLink && /^@UUID\[Compendium\.pf2e\.spell-effects\./.test(links[Number(link[1])])) { linkedLink = links[Number(link[1])]; continue; }
            // A spell Effect linked after the attack sentence is the table's Effect (the degree compilers judge its rows).
            if (link && attack && !linkedEffect && !tableEffectLink && /^@UUID\[Compendium\.pf2e\.spell-effects\./.test(links[Number(link[1])])) { tableEffectLink = links[Number(link[1])]; continue; }
            if (materialStated(adapted, sentence)) { materials.push(sentence); continue; }
            // "On a critical success, a target also takes @Damage[(@item.level)d4[bleed]] damage." restates the
            // critical row's persistent damage with its heightening; the row takes the inline roll.
            const extra = CRITICAL_PERSISTENT.exec(sentence);
            if (extra && attack && !criticalExtra) { criticalExtra = { roll: extra[1], type: (extra[3] ?? extra[2]).toLowerCase() }; continue; }
            if (deals) {
                if (!matchesDamage(adapted, deals[1] ?? deals[3] ?? deals[5], deals[2] ?? deals[4] ?? deals[6]) || damage++) return nope(503);
                if (ATTACK_IN_DAMAGE.test(sentence)) attack ??= sentence;
                continue;
            }
            if (attack || /\d|\bspell attack\b/i.test(sentence.replace(/\b\d+ Bulk or less\b/g, ""))) return nope(507); // rules after the attack, or another attack
            narration.push(unmask(sentence));
        }
        if (!attack || (linkedEffect && !linkedLink) || (lodged && !(lodged.explosion && lodged.removal))) return nope(510);
        // Keep the written rows; a paragraph after them must be the counteract-along-the-ray rule.
        let tableHTML = base.slice(base.search(/<p>\s*<strong\b/i)).trim();
        // (PF2e 8.6 states a critical hit's persistent damage at the base rank — "double damage and 5 persistent spirit damage" — with "Heightened (+1) … The
        // persistent spirit damage on a critical hit increases by 1.", where 8.5 wrote "@Damage[(@item.rank)[persistent,spirit]] damage": the spell's rank.)
        const rankStep = /<strong>\s*Heightened \(\+1\)\s*<\/strong>[^<]*\bThe persistent ([a-z]+) damage on a critical hit increases by 1\./.exec(rest[0] ?? "");
        if (rankStep && Number(adapted.rank) > 0) tableHTML = tableHTML.replace(new RegExp(String.raw`(<strong>\s*Critical Success\s*<\/strong>[^<]*? and )${Number(adapted.rank)} persistent ${rankStep[1]} damage\b`),
            `$1@Damage[(@item.rank)[persistent,${rankStep[1]}]] damage`);
        // "You miss and the creature takes no damage." is the miss row's "unaffected".
        tableHTML = tableHTML.replace(/(<strong>\s*Failure\s*<\/strong>)\s*You miss and the (?:creature|target) takes no damage\./, "$1 The target is unaffected.");
        // "The target takes double cold damage, as well as double spirit damage if a fiend or undead." with the extra damage kept above: the
        // critical row doubles both (the extra damage scales with the row).
        const extraType = /you deal an extra \d+d\d+ ([a-z]+) damage\.$/.exec(kept.find(sentence => /^If the target has the [a-z-]+ trait/.test(sentence)) ?? "")?.[1];
        tableHTML = tableHTML.replace(/(<strong>\s*Critical Success\s*<\/strong>)\s*The target takes double ([a-z]+) damage, as well as double ([a-z]+) damage if an? [a-z ]+\./, (all, heading, own, extra) =>
            extraType === extra && adapted.damageComponents.length === 1 && String(adapted.damageComponents[0].type).toLowerCase() === own ? `${heading} The target takes double damage.` : all);
        // All four rows written: the miss is a hit on one damage entry only, and a critical miss does nothing.
        const componentRows = {};
        if (allRows) {
            const rowText = heading => {
                const row = new RegExp(String.raw`<p\b[^>]*>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(tableHTML);
                return row ? { row: row[0], text: row[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() } : null;
            };
            const miss = rowText("Failure"), criticalMiss = rowText("Critical Failure");
            // (PF2e 8.6 writes the kept entry as a labelled roll — "The target takes the @Damage[(max(5,@item.rank))d6[spirit]]{spirit} damage, but not the
            // piercing damage." (Warshard Shot): read as the entry named by its type, the item's own entry giving the dice.)
            const missText = miss?.text.replace(/@Damage\[(?:[^\[\]]|\[[^\[\]]*\])*\[([a-z]+)\]\]\{([a-z]+)\} damage/g, (all, type, label) => type === label ? `${label} damage` : all);
            const selective = miss && SELECTIVE_ROW.exec(missText);
            // (Or a miss for half damage, with its own conditions: the degree compilers judge the row as written.)
            const halfMiss = !selective && /^The target takes half damage(?: and is [^.]+)?\.$/.test(miss?.text ?? "") && criticalMiss?.text === "The target is unaffected.";
            if (!halfMiss) {
                if (!selective || criticalMiss?.text !== "The target is unaffected.") return nope(527);
                const direct = adapted.damageComponents.filter(component => !persistentEntry(component));
                const kept = direct.filter(component => String(component.type).toLowerCase() === selective[1].toLowerCase());
                const dropped = direct.filter(component => String(component.type).toLowerCase() === selective[2].toLowerCase());
                if (adapted.damageComponents.length !== 2 || kept.length !== 1 || dropped.length !== 1) return nope(531);
                componentRows.failure = { sourceComponentIds: [kept[0].id], sourceText: miss.text };
                tableHTML = tableHTML.replace(miss.row, "<p><strong>Failure</strong> The target takes full damage.</p>");
            }
        }
        const reminders = [];
        const forcedMovement = {};
        // The lodged projectile's rows: the initial damage is full on both hits; each hit leaves the explosion (double on a critical hit)
        // and says how many Interact actions remove it.
        let lodgedRows = null;
        if (lodged) {
            const rowText = heading => new RegExp(String.raw`<p\b[^>]*>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(tableHTML);
            const critical = rowText("Critical Success"), success = rowText("Success");
            const plain = row => row?.[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";
            const criticalMatch = LODGED_CRITICAL.exec(plain(critical)), successMatch = LODGED_SUCCESS.exec(plain(success));
            if (!criticalMatch || !successMatch || criticalMatch[1] !== lodged.noun || successMatch[1] !== lodged.noun) return nope(545);
            // The explosion is one die a rank ("(@item.rank)d12"): its Heightened (+1) step must say so.
            if (!new RegExp(String.raw`Heightened \(\+1\)[^<]*\bthe explosion damage increases by 1d${lodged.explosion.die}\b`, "i").test(rest.join(" ").replace(/<[^>]+>/g, " "))) return nope(547);
            tableHTML = tableHTML.replace(critical[0], "<p><strong>Critical Success</strong> The target takes full damage.</p>")
                .replace(success[0], "<p><strong>Success</strong> The target takes full damage.</p>");
            lodgedRows = { noun: lodged.noun, explosion: lodged.explosion, sentences: lodged.sentences, removal: lodged.removal,
                criticalSuccess: { multiplier: 2, interacts: Number(criticalMatch[2]), sourceText: plain(critical) }, success: { multiplier: 1, interacts: 1, sourceText: plain(success) } };
        }
        // An object's Hardness on a hit row ("If you target an object, lower its Hardness by 4 for 1 minute."): the GM's reminder.
        const objectHardness = {};
        for (const heading of ["Critical Success", "Success"]) {
            const row = new RegExp(String.raw`(<strong>\s*${heading}\s*<\/strong>[^<]*?)${OBJECT_HARDNESS.source}`, "i").exec(tableHTML);
            if (!row) continue;
            objectHardness[heading] = { value: Number(row[2]), minutes: Number(row[3]) };
            tableHTML = tableHTML.replace(row[0], row[1]);
        }
        // "The beam deals double damage" is the target's damage.
        tableHTML = tableHTML.replace(/(<strong>\s*(?:Critical Success|Success)\s*<\/strong>\s*)(?:The [a-z]+ deals|You deal|Your [a-z]+ deals) (double|full|normal) damage\b/gi, "$1The target takes $2 damage");
        // "double damage (both initial and persistent)" restates that doubling covers every entry.
        tableHTML = tableHTML.replace(/(The target takes double damage) \(both initial and persistent\)\./g, "$1.");
        if (Object.keys(objectHardness).length) {
            const step = /If you target an object, lower its Hardness by an additional (\d+) point on both a success and a critical success\./.exec(rest.join(" ").replace(/<[^>]+>/g, " "));
            reminders.push({ kind: "object-hardness", text: `An object target: lower its Hardness by ${Object.entries(objectHardness).map(([heading, entry]) => `${entry.value} on a ${heading.toLowerCase().replace("critical success", "critical hit").replace("success", "hit")}`).join(", ")}`
                + `${step ? ` (${step[1]} more per rank)` : ""}, for ${Object.values(objectHardness)[0].minutes} minute. The module resolves creatures only.`, sourceText: Object.keys(objectHardness).join(",") });
        }
        // "double damage, both initial and persistent" restates that doubling covers every entry.
        tableHTML = tableHTML.replace(/(The target takes double damage), both initial and persistent\./g, "$1.");
        // A row stating the spell's own dice, or twice them ("takes 4d6 bludgeoning damage" when the entry is 2d6), is
        // full or double damage, so the item's heightening scales it.
        if (adapted.damageComponents.length === 1 && !adapted.damageComponents[0].category) {
            const [count, faces] = String(adapted.damageComponents[0].formula).replace(/\s+/g, "").split("d").map(Number);
            const type = String(adapted.damageComponents[0].type).toLowerCase();
            tableHTML = tableHTML.replace(new RegExp(String.raw`(<strong>\s*(?:Critical Success|Success)\s*<\/strong>\s*)The (?:creature|target) takes (\d+)d${faces} ${type} damage\b`, "gi"),
                (all, head, dice) => Number(dice) === count ? `${head}The target takes full damage` : Number(dice) === 2 * count ? `${head}The target takes double damage` : all);
        }
        // Narration after a condition's duration ("… for 1 minute as saltwater sprays into its eyes.") carries no rule.
        tableHTML = tableHTML.replace(/(for \d+ (?:rounds?|minutes?)) as [a-z' ]+(?=\.)/g, "$1");
        // A Spell Effects link between rows restating a row's Speed penalty: the row's text is compiled (a generated
        // Speed penalty), so PF2e's convenience link is set aside and recorded.
        const rowEffectLinks = [];
        tableHTML = tableHTML.replace(/(<p\b[^>]*>\s*<strong>\s*(?:Critical Success|Success)\s*<\/strong>[^<]*penalty to its Speeds[^<]*<\/p>\s*)<p>\s*(@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\})\s*<\/p>/gi,
            (all, row, link) => { rowEffectLinks.push(link); return row; });
        for (const [row, heading, body] of [...tableHTML.matchAll(/<p\b[^>]*>\s*<strong>\s*(Critical Success|Success)\s*<\/strong>([\s\S]*?)<\/p>/gi)]) {
            const moved = ROW_MOVE.exec(body.replace(/\s+/g, " ").trim());
            if (!moved) continue;
            forcedMovement[heading.toLowerCase() === "success" ? "success" : "criticalSuccess"] = movement(moved, 2);
            tableHTML = tableHTML.replace(row, `<p><strong>${heading}</strong> ${moved[1]}.</p>`);
        }
        const paragraphs = [...tableHTML.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];
        for (const [paragraph, inner] of paragraphs) {
            if (/<strong\b/i.test(inner)) continue;
            const plain = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
            const counteract = COUNTERACT_RAY.exec(plain);
            if (!counteract) continue; // left in place: the degree compilers will judge (and block) it
            reminders.push({ kind: "counteract-along-path", target: counteract[2].toLowerCase(), text: plain });
            tableHTML = tableHTML.replace(paragraph, "");
        }
        if (criticalExtra) {
            const row = new RegExp(String.raw`(<strong>\s*Critical Success\s*</strong>[^<]*?)\b\d+d\d+ persistent ${criticalExtra.type} damage`, "i");
            if (!row.test(tableHTML)) return nope(604);
            tableHTML = tableHTML.replace(row, `$1${criticalExtra.roll} damage`);
        }
        return {
            // The Effect link goes with the hit row (its degree compiler binds it to each row it offers).
            html: `<p>${[...narration, saveSentence, ...kept].join(" ")}</p>${tableEffectLink ? tableHTML.replace(/(<p\b[^>]*>\s*<strong>\s*Success\s*<\/strong>[\s\S]*?<\/p>)/i, `$1<p>${tableEffectLink}</p>`) : tableHTML}${missRows}${rest.join("")}`,
            sourceText: attack,
            ...(reminders.length ? { reminders } : {}),
            ...(Object.keys(forcedMovement).length ? { forcedMovement } : {}),
            ...(materials.length ? { materialSentences: materials } : {}),
            ...(Object.keys(componentRows).length ? { componentRows } : {}),
            ...(linkedEffect ? { persistentLinks: [{ kind: "effect", damageType: linkedEffect.type, link: linkedLink, claimText: linkedEffect.claimText, degrees: ["criticalSuccess", "success"] }] } : {}),
            ...(adjusted.adjustment ? { attackAdjustment: adjusted.adjustment } : {}),
            ...(rowEffectLinks.length ? { rowEffectLinks } : {}),
            ...(adjusted.reminders.length ? { reminders: [...(reminders ?? []), ...adjusted.reminders] } : {}),
            ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}),
            ...(lodgedRows ? { lodgedExplosion: lodgedRows } : {}),
            ...(shieldBlocked ? { shieldBlocked } : {}),
            ...(voidConstructs ? { voidConstructs } : {}),
            ...(casterForm ? { casterForm } : {})
        };
    }

    // A one-sentence attack: its last sentence names the damage and the critical-hit doubling.
    // "@Damage[5d10[void]] damage" reads as "5d10 void damage" (it must still be the spell's damage entry).
    const text = componentListText(typeChoiceText(masked.replace(/<[^>]+>/g, " ").replace(/@Damage\[(\d+d\d+)\[([a-z]+)\]\] damage/gi, "$1 $2 damage").replace(/\s+/g, " ").trim(), adapted), adapted);
    let rawSentences = text.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    // "The spear remains lodged within a creature it hits, making the target Clumsy 1 (or increasing its clumsy condition by 1 if it is
    // already clumsy) for 1 minute or until the spear is removed with a successful Athletics check against your spell DC as an Interact
    // action, whichever comes first.": the hit's condition (raised by 1 if the creature already has it), ending at the time or when the
    // creature removes the projectile with an Interact action (the GM checks its Athletics check against the spell DC).
    const lodgedIndex = rawSentences.findIndex(sentence => LODGED.test(sentence));
    if (lodgedIndex >= 0) {
        const lodged = LODGED.exec(rawSentences[lodgedIndex]);
        const link = unmask(lodged[2]);
        const named = /\{([A-Za-z-]+)(?: \d)?\}$/.exec(link)?.[1]?.toLowerCase();
        if (!named || named !== lodged[3].toLowerCase() || named !== lodged[4].toLowerCase()) return nope(639);
        hitRider = { condition: `${link} for ${lodged[5]} ${lodged[6]}${lodged[5] === "1" ? "" : "s"} or until it uses an Interact action to remove the ${lodged[1]}`, increment: named,
            sourceText: unmask(rawSentences[lodgedIndex]) };
        rawSentences = rawSentences.filter((_, index) => index !== lodgedIndex);
    }
    let repeatWindow = null;
    const windowIndex = rawSentences.findIndex(sentence => REPEAT_WINDOW.test(sentence));
    if (windowIndex >= 0) {
        if (!REPEAT_ATTACK.test(rawSentences[windowIndex + 1] ?? "")) return nope(647);
        repeatWindow = { window: "turn", range: Number(REPEAT_WINDOW.exec(rawSentences[windowIndex])[1]), sourceText: `${rawSentences[windowIndex]} ${rawSentences[windowIndex + 1]}` };
        rawSentences = [...rawSentences.slice(0, windowIndex), "Make a ranged spell attack roll.", ...rawSentences.slice(windowIndex + 2)];
    }
    const turnsIndex = rawSentences.findIndex(sentence => REPEAT_TURNS.test(sentence));
    if (turnsIndex >= 0) {
        const total = REPEAT_TOTAL.exec(rawSentences[turnsIndex + 1] ?? "");
        const when = WHEN_ATTACK.exec(rawSentences[turnsIndex + 2] ?? "");
        if (repeatWindow || !total || !when) return nope(655);
        repeatWindow = { window: "subsequent-turns", attacks: ORDINAL[total[1].toLowerCase()], actions: 1,
            traits: REPEAT_TURNS.exec(rawSentences[turnsIndex])[1].split(/,? and |, /).map(trait => trait.trim().toLowerCase()).filter(Boolean),
            sourceText: rawSentences.slice(turnsIndex, turnsIndex + 2).map(unmask).join(" ") };
        rawSentences = [...rawSentences.slice(0, turnsIndex), when[1][0].toUpperCase() + when[1].slice(1), ...rawSentences.slice(turnsIndex + 3)];
    }
    const adjusted = attackAdjustments(rawSentences, unmask, rest.join(" "), links);
    if (!adjusted) return nope(662);
    const allSentences = adjusted.sentences;
    // Everything the one-sentence forms return also carries the adjustment and its reminders.
    const withAdjustment = result => !result ? result : {
        ...result,
        ...(adjusted.adjustment ? { attackAdjustment: { ...adjusted.adjustment, ...(adjusted.gated ? { onApplies: adjusted.gated } : {}) } } : {}),
        ...(adjusted.reminders.length ? { reminders: [...(result.reminders ?? []), ...adjusted.reminders] } : {}),
        ...(adjusted.casterEffect ? { casterEffect: adjusted.casterEffect } : {}),
        ...(repeatWindow ? { repeatable: repeatWindow } : {}),
        ...(groundHazard ? { groundHazard } : {}),
        ...(hitRider ? { hitRider: { increment: hitRider.increment, sourceText: hitRider.sourceText } } : {})
    };
    // Action-count sentences: targets by actions (needs several targets), and damage by actions (must match the variant cast).
    let actionDamage = null, actionTargets = false, pushedInto = null, linkedCondition = null, spellEndsWith = null, groundHazard = null;
    const removals = [];
    const sentences = allSentences.filter(sentence => {
        if (COSMETIC_MARK.test(sentence)) return false;
        const hazard = !groundHazard ? GROUND_HAZARD.exec(unmask(sentence)) : null;
        if (hazard && ![...hazard[3].matchAll(/@([a-z0-9_.]+)/gi)].some(match => !["item.rank", "item.level"].includes(match[1].toLowerCase()))) {
            groundHazard = { where: "target-space", degrees: HAZARD_DEGREES[hazard[1].toLowerCase()], events: HAZARD_EVENTS[hazard[5].toLowerCase()],
                damage: { formula: hazard[3], type: hazard[4].toLowerCase() }, label: hazard[2], sourceText: unmask(sentence) };
            return false;
        }
        const ends = SPELL_ENDS_WITH_PERSISTENT.exec(sentence);
        if (ends && !spellEndsWith) { spellEndsWith = { type: ends[1], claimText: sentence }; return false; }
        const removal = REMOVAL.exec(sentence);
        if (removal) { removals.push({ type: removal[2], text: sentence }); return false; }
        if (REMOVAL_NOTE.test(sentence) && removals.length) { removals[removals.length - 1].text += ` ${sentence}`; return false; }
        if (ACTIONS_INTRO.test(sentence) && variants.base !== base0) return false;
        const linked = PERSISTENT_CONDITION.exec(sentence);
        if (linked && !linkedCondition) { linkedCondition = { condition: unmask(linked[1]), type: persistentOfType(adapted, linked[2]), claimText: unmask(sentence) }; return false; }
        if (ACTION_TARGETS.test(sentence)) { actionTargets = true; return false; }
        const byActions = ACTION_DAMAGE.exec(sentence);
        if (byActions) { actionDamage = { actions: Number(byActions[1]), formula: byActions[2], type: byActions[3] }; return false; }
        const into = PUSHED_INTO.exec(sentence);
        if (into && !pushedInto) { pushedInto = ` If the target is pushed into an obstacle or structure that's ${into[1]} or larger, it becomes ${unmask(into[2])} for ${into[3]} ${into[4]}${into[3] === "1" ? "" : "s"} or until it Escapes.`; return false; }
        return true;
    });
    // The variant's fewest actions decides which damage the text gives it.
    const fewestActions = Number(/^(\d)/.exec(String(adapted.activation?.time ?? ""))?.[1]);
    const damageFor = (formula, type) => actionDamage && Number.isInteger(fewestActions) && fewestActions >= actionDamage.actions
        ? matchesDamage(adapted, actionDamage.formula, actionDamage.type) && actionDamage.type.toLowerCase() === type.toLowerCase()
        : matchesDamage(adapted, formula, type);
    // "This counts as two attacks for your multiple attack penalty, …" may sit between the attack and its hit sentence.
    let middleMap = false;
    {
        const at = sentences.findIndex(sentence => new RegExp(String.raw`^${ATTACK}\.$`).test(sentence));
        if (multiple && at >= 0 && SHARED_MAP.test(sentences[at + 1] ?? "") && sentences.length > at + 2) { sentences.splice(at + 1, 1); middleMap = true; }
    }
    const attackIndex = sentences.findIndex(sentence => new RegExp(String.raw`^${ATTACK}\b`).test(sentence));
    // The attack and at most two result sentences end the text (a trailing shared-penalty sentence aside).
    const trailingMap = SHARED_MAP.test(sentences.at(-1) ?? "") ? 1 : 0;
    if (attackIndex < 0 || attackIndex < sentences.length - 3 - trailingMap) return nope(714);
    let combined = sentences.slice(attackIndex).join(" ");
    // A trailing shared-penalty sentence with several targets.
    let sharedMap = middleMap;
    const last = sentences.at(-1);
    if (multiple && SHARED_MAP.test(last) && sentences.length - 1 > attackIndex) { sharedMap = true; combined = sentences.slice(attackIndex, -1).join(" "); }
    // A single-target variant: the shared-penalty sentence describes the extra targets of other action counts.
    else if (!multiple && actionTargets && SHARED_MAP.test(last) && sentences.length - 1 > attackIndex) combined = sentences.slice(attackIndex, -1).join(" ");
    // Narration before the attack must carry no numbers (rules).
    const narration = sentences.slice(0, attackIndex);
    if (narration.some(sentence => /\d/.test(sentence))) return nope(724);
    const lead = `<p>${narration.map(unmask).concat(saveSentence).join(" ")}</p>`;
    const critExtra = HIT_THEN_CRIT_EXTRA.exec(combined);
    if (critExtra) {
        if (linkedCondition) return nope(728); // only the plain forms carry a persistent-linked condition
        if (!damageFor(critExtra[1], critExtra[2])) return nope(729);
        const extraFormula = critExtra[3].replace(/^@Damage\[/, "").replace(/\]$/, "");
        if ([...extraFormula.matchAll(/@([a-z0-9_.]+)/gi)].some(match => !["item.rank", "item.level"].includes(match[1].toLowerCase()))) return nope(731);
        return withAdjustment({ html: `${lead}${table(`The target takes double damage and ${critExtra[3]} damage.`, "The target takes full damage.")}${rest.join("")}`, sourceText: combined,
            ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}) });
    }
    const persistentOnce = PERSISTENT_NOT_DOUBLED.exec(combined);
    if (persistentOnce) {
        if (linkedCondition) return nope(737); // only the plain forms carry a persistent-linked condition
        if (!matchesDamage(adapted, persistentOnce[1], persistentOnce[2])) return nope(738);
        // The persistent formula may read only the cast rank.
        const persistentFormula = persistentOnce[3].replace(/^@Damage\[/, "").replace(/\]$/, "");
        if ([...persistentFormula.matchAll(/@([a-z0-9_.]+)/gi)].some(match => !["item.rank", "item.level"].includes(match[1].toLowerCase()))) return nope(741);
        const extra = unmask(persistentOnce[3]);
        return withAdjustment({ html: `${lead}${table(`The target takes double damage and ${extra} damage.`, `The target takes full damage and ${extra} damage.`)}${rest.join("")}`, sourceText: unmask(combined),
            ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}) });
    }
    const hitThenCrit = HIT_THEN_CRIT.exec(combined);
    if (hitThenCrit) {
        if (linkedCondition) return nope(748); // only the plain forms carry a persistent-linked condition
        if (!matchesDamage(adapted, hitThenCrit[1], hitThenCrit[2])) return nope(749);
        const forcedMovement = { criticalSuccess: movement(hitThenCrit, 9) };
        if (hitThenCrit.slice(3, 9).some(Boolean)) forcedMovement.success = movement(hitThenCrit, 3);
        // (The obstacle's condition only with a push on both rows.)
        if (pushedInto && !forcedMovement.success) return nope(753);
        return withAdjustment({ html: `${lead}${table(`The target takes double damage.${pushedInto ?? ""}`, `The target takes full damage.${pushedInto ?? ""}`)}${rest.join("")}`, sourceText: combined, forcedMovement,
            ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}) });
    }
    const critAlso = HIT_CRIT_ALSO.exec(combined);
    if (critAlso) {
        if (linkedCondition) return nope(759);
        if (!damageFor(critAlso[1], critAlso[2])) return nope(760);
        if (critAlso[3] && [...critAlso[3].replace(/^@Damage\[/, "").matchAll(/@([a-z0-9_.]+)/gi)].some(match => !["item.rank", "item.level"].includes(match[1].toLowerCase()))) return nope(761);
        const critical = critAlso[3] ? `The target takes double damage and ${critAlso[3]} damage.` : `The target takes double damage and is ${unmask(critAlso[4] ?? critAlso[5] ?? critAlso[6])}.`;
        return withAdjustment({ html: `${lead}${table(critical, "The target takes full damage.")}${rest.join("")}`, sourceText: unmask(combined),
            ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}) });
    }
    const parenCrit = HIT_PAREN_CRIT_CONDITION.exec(combined);
    if (parenCrit) {
        if (linkedCondition || !damageFor(parenCrit[1], parenCrit[2])) return nope(801);
        return withAdjustment({ html: `${lead}${table(`The target takes double damage and is ${unmask(parenCrit[3])} ${parenCrit[4]}.`, "The target takes full damage.")}${rest.join("")}`, sourceText: unmask(combined),
            ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}) });
    }
    const causing = HIT_CAUSING_CRIT_PERSISTENT.exec(combined);
    if (causing) {
        if (linkedCondition || !damageFor(causing[1], causing[2])) return nope(768);
        if ([...causing[4].replace(/^@Damage\[/, "").matchAll(/@([a-z0-9_.]+)/gi)].some(match => !["item.rank", "item.level"].includes(match[1].toLowerCase()))) return nope(769);
        const condition = unmask(causing[3]);
        return withAdjustment({ html: `${lead}${table(`The target takes double damage and ${causing[4]} damage, and is ${condition}.`, `The target takes full damage and is ${condition}.`)}${rest.join("")}`,
            sourceText: unmask(combined), ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}) });
    }
    const splashSave = HIT_CRIT_SPLASH_SAVE.exec(combined);
    if (splashSave) {
        if (linkedCondition) return nope(776);
        if (!damageFor(splashSave[1], splashSave[2]) || !adapted.damageComponents.some(component => component.category === "splash")) return nope(777);
        // The follow-up save is its own sentence, as the degree compilers read it.
        const critical = `The target takes double damage.${splashSave[3] ? ` The target ${unmask(splashSave[3])}.` : ""}`;
        return withAdjustment({ html: `${lead}${table(critical, "The target takes full damage.")}${rest.join("")}`, sourceText: unmask(combined),
            ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}) });
    }
    const doubleNamed = HIT_DOUBLE_NAMED.exec(combined);
    if (doubleNamed) {
        if (linkedCondition) return nope(785); // only the plain forms carry a persistent-linked condition
        if (!damageFor(doubleNamed[1], doubleNamed[2])
            || !adapted.damageComponents.some(component => persistentEntry(component) && String(component.type).toLowerCase() === doubleNamed[3])) return nope(787);
        return withAdjustment({ html: `${lead}${table("The target takes double damage.", "The target takes full damage.")}${rest.join("")}`, sourceText: combined,
            ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}) });
    }
    const traitExtra = HIT_TRAIT_EXTRA.exec(combined);
    if (traitExtra) {
        if (linkedCondition) return nope(793); // only the plain forms carry a persistent-linked condition
        if (!damageFor(traitExtra[1], traitExtra[2])) return nope(794);
        const extraSentence = `If the target has the ${traitExtra[3]} trait, you deal an extra ${traitExtra[4]} ${traitExtra[5]} damage.`;
        const critical = `The target takes double damage${traitExtra[6] ? ` and ${traitExtra[6]}` : ""}.`;
        return withAdjustment({ html: `<p>${narration.map(unmask).concat(saveSentence, extraSentence).join(" ")}</p>${table(critical, "The target takes full damage.")}${rest.join("")}`,
            sourceText: combined, ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}) });
    }
    // Sentences about the persistent damage belong only to the "for the duration" form.
    const forDuration = HIT_CONDITION_FOR_DURATION.exec(combined);
    if ((spellEndsWith || removals.length) && !forDuration) return nope(802);
    if (forDuration) {
        if (linkedCondition || !spellEndsWith || !damageFor(forDuration[1], forDuration[2])) return nope(804);
        const type = persistentOfType(adapted, spellEndsWith.type);
        if (!type || removals.some(removal => removal.type !== type)) return nope(806);
        const condition = unmask(forDuration[3]);
        return withAdjustment({ html: `${lead}${table(`The target takes double damage and is ${condition}.`, `The target takes full damage and is ${condition}.`)}${rest.join("")}`,
            sourceText: unmask(combined),
            persistentLinks: [{ kind: "condition", damageType: type, claimText: `${unmask(combined)} ${spellEndsWith.claimText}`, degrees: ["criticalSuccess", "success"] }],
            ...(removals.length ? { reminders: removals.map(removal => ({ kind: "removal", text: removal.text })) } : {}),
            ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}) });
    }
    const critCondition = HIT_CONDITION_CRIT_CONDITION.exec(combined);
    if (critCondition) {
        if (linkedCondition || !matchesDamage(adapted, critCondition[1], critCondition[2])) return nope(816);
        // "double the poison damage" names the spell's damage.
        if (critCondition[4] && critCondition[4].toLowerCase() !== critCondition[2].toLowerCase()) return nope(818);
        return withAdjustment({ html: `${lead}${table(`The target takes double damage and is ${unmask(critCondition[5])}.`, `The target takes full damage and is ${unmask(critCondition[3])}.`)}${rest.join("")}`,
            sourceText: unmask(combined), ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}) });
    }
    const withCondition = HIT_CONDITION.exec(combined);
    if (withCondition) {
        if (linkedCondition) return nope(824); // only the plain forms carry a persistent-linked condition
        if (!matchesDamage(adapted, withCondition[1], withCondition[2])) return nope(825);
        return withAdjustment({ html: `${lead}${table(`The target takes double damage and is ${unmask(withCondition[4])}.`, `The target takes full damage and is ${unmask(withCondition[3])}.`)}${rest.join("")}`, sourceText: unmask(combined), ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}) });
    }
    // "…, ignoring the target's Hardness if it's @Damage[@item.level*2] or lower." (Piercing Jet): the GM's reminder for a target with Hardness.
    const IGNORE_HARDNESS = /, ignoring the target's Hardness if it's (?:@Damage\[@item\.(?:level|rank)\*(\d+)\]|(\d+)) or lower(?=\.)/;
    const ignore = IGNORE_HARDNESS.exec(combined);
    const ignoreReminder = ignore ? { kind: "ignore-hardness", text: ignore[1]
        ? `A target with Hardness: the damage ignores it if it's ${ignore[1] === "2" ? "twice" : `${ignore[1]} times`} the spell's rank or lower (the GM).`
        : `A target with Hardness: the damage ignores it if it's ${ignore[2]} or lower (the GM).`, sourceText: unmask(combined) } : null;
    if (ignore) combined = combined.replace(ignore[0], "");
    const match = FORMS.map(form => form.exec(combined)).find(Boolean);
    if (!match || !damageFor(match[1], match[2])) return nope(829);
    // A condition lasting as long as the persistent damage joins both hit rows.
    if (linkedCondition) {
        if (!linkedCondition.type) return nope(832);
        return withAdjustment({ html: `${lead}${table(`The target takes double damage and is ${linkedCondition.condition}.`, `The target takes full damage and is ${linkedCondition.condition}.`)}${rest.join("")}`,
            sourceText: unmask(combined),
            persistentLinks: [{ kind: "condition", damageType: linkedCondition.type, claimText: linkedCondition.claimText, degrees: ["criticalSuccess", "success"] }],
            ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}) });
    }
    return withAdjustment({ html: `${lead}${table("The target takes double damage.", "The target takes full damage.")}${rest.join("")}`, sourceText: ignoreReminder?.sourceText ?? combined,
        ...(ignoreReminder ? { reminders: [ignoreReminder] } : {}), ...(multiple ? { multipleTargets: true, sharedMultipleAttackPenalty: sharedMap } : {}) });
}
