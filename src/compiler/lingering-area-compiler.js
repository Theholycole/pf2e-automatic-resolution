// Lingering damage areas: a basic-save spell whose area persists for its
// duration and damages creatures that enter it, or start or end their turns
// in it ("A creature that enters the storm or starts its turn in the storm …
// takes 2d10 slashing damage with a basic Reflex save."). Every sentence must
// be a trigger, its damage, a once-per-round limit, an initial-exposure
// clause, or narration; anything else leaves the spell to other compilers.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";
import { compileBasicDegreeRiders } from "./basic-degree-rider.js";
import { WORD_NUMBERS_2_5 as COUNTS, DICE_DAMAGE as DICE, MUST_ATTEMPT_SAVE as FIRST_SAVE } from "./text-patterns.js";

// The area's own name ("the storm", "the squall", "the spell's area").
const NOUN = String.raw`(?:spell's area|[a-z]+(?: [a-z]+)?)`;
const WHERE = String.raw`(?:in|within|inside) (?:the ${NOUN}|it)`;
const EVENT = [
    ["enter", new RegExp(String.raw`\b(?:enters|moves into) (?:the ${NOUN}|it)\b|\benters or (?:starts|begins|ends) (?:its|their) turns? ${WHERE}`, "i")],
    ["turn-start", new RegExp(String.raw`\b(?:starts|begins) (?:its|their) turns? ${WHERE}\b`, "i")],
    ["turn-end", new RegExp(String.raw`\bends (?:its|their) turns? ${WHERE}\b`, "i")],
    ["initial", new RegExp(String.raw`\b(?:(?:is|'s) (?:in|inside) the ${NOUN} when (?:it's created|you Cast the Spell|the spell is cast))\b`, "i")],
    // "Any creature that's in the area or enters the area before the start of your next turn": exposed when cast, and on entering
    // until the area ends at the start of the caster's next turn.
    ["initial", /\b(?:is|'s) in the area or enters the area before the start of your next turn\b/i],
    ["enter", /\b(?:is|'s) in the area or enters the area before the start of your next turn\b/i]
];
const UNTIL_NEXT_TURN = /\b(?:is|'s) in the area or enters the area before the start of your next turn\b/i;
const SUBJECT = /^(?:A|Any|Each|An) (?:creature|enemy)(?: other than you)? (?:that|who)(?:'s)?\b/i;
const BASIC = String.raw`(?:,? with a basic (Fortitude|Reflex|Will) sav(?:e|ing throw)| \(basic (Fortitude|Reflex|Will) save\))`;
// A short causal flavour clause may end the damage sentence ("… as the birds peck at it.").
const FLAVOUR = String.raw`(?: as [a-z' ]{3,40})?`;
const TAKES = new RegExp(String.raw`\btakes? ${DICE}${BASIC}?${FLAVOUR}\.$`, "i");
// "takes 4d4 bludgeoning or piercing damage (your choice), with a basic Reflex saving throw.": the spell's untyped damage, of
// the type the caster chooses.
const TAKES_CHOICE = new RegExp(String.raw`\btakes? (\d+d\d+) ([a-z]+) or ([a-z]+) damage \(your choice\)${BASIC}\.$`, "i");
// "All creatures within the cloud become concealed, and all creatures outside the cloud become concealed to creatures within it."
const AREA_NAME = String.raw`(?:spell's area|[a-z]+(?: [a-z]+){0,3})`;
const CONCEALMENT = new RegExp(String.raw`^(?:All )?creatures (?:with)?in the ${AREA_NAME} (?:become|are) concealed, and all creatures outside the ${AREA_NAME} (?:become|are) concealed to creatures within it\.$`, "i");
const DEALS = new RegExp(String.raw`^(?:You deal|The (?:cloud|fog|mist|storm) deals) ${DICE} to (?:each|any) (?:breathing )?(?:creature|enemy) (?:that|who) (.+?)${BASIC}?\.$`, "i");
const TOUCH_RETALIATION = /^Each creature that hits you with an unarmed attack, Grapples you, or otherwise touches you takes @Damage\[(\d+)\[([a-z]+)\]\] damage\.$/;
const SUSTAIN_TAKES = new RegExp(String.raw`^(.+?),? takes? ${DICE}${BASIC}\.$`, "i");
const IN_AREA = String.raw`to (?:each|all|every) creatures? in the (?:area|spell's area)`;
// "This assault deals 2d10 bludgeoning damage (basic Reflex save) to each creature in the area." — the exposure when cast.
const CAST_DEALS = new RegExp(String.raw`^(?:This|The|It) (?:[a-z]+ ){0,3}?deals ${DICE}${BASIC} ${IN_AREA}\.$`, "i");
// "On subsequent rounds, the first time each round you Sustain this Spell, it deals @Damage[(floor(@item.level/2))d10[bludgeoning]] damage (basic Reflex save) to each creature in the area."
const SUSTAIN_DEALS = new RegExp(String.raw`^On subsequent (?:rounds|turns), the first time (?:each round )?you Sustain (?:this|the) Spell(?: each round)?, it deals @Damage\[([^\[\]]+)\[([a-z]+)\]\] damage${BASIC} ${IN_AREA}\.$`, "i");
// "Each creature except you in the area when you Cast the Spell takes 1d6 poison damage (basic Fortitude save)." — exposed on casting.
const CAST_EACH = new RegExp(String.raw`^Each creature( except you| other than you)? in the (?:area|spell's area) when you Cast (?:the|this) Spell takes? ${DICE}${BASIC}\.$`, "i");
// "Any creature in the area takes 1d4 piercing damage with a basic Reflex saving throw." / "The scattering rocks deal 2d4
// bludgeoning damage (basic Reflex save)." — the area's damage when it's cast.
const CAST_ANY = new RegExp(String.raw`^(?:(?:Any|Each) creature in the (?:area|square) takes?|The [a-z ]{3,40} deals?) ${DICE}${BASIC}\.$`, "i");
// "Sharp flowstone formations protrude from the ground and ceiling, dealing 6d6 piercing damage to creatures in the area with a
// basic Reflex save." — narration, then the area's damage when it's cast.
const CAST_DEALING = new RegExp(String.raw`^[A-Z][a-z ,']{3,120}, dealing ${DICE} to (?:all |each )?creatures in the area${BASIC}\.$`);
// "The protrusions turn to dust when the spell ends." — what's left when it ends.
// "When you Cast this Spell, you deal 2d4 cold damage to each creature in the area (basic Reflex save)." — the exposure when cast.
const CAST_YOU_DEAL = new RegExp(String.raw`^When you Cast (?:this|the) Spell, you deal ${DICE} to (?:each|every|all) creatures? in the area${BASIC}\.$`, "i");
// "You also create a layer of ice on all surfaces in the area, which become difficult terrain."
const SURFACE_TERRAIN = /^You (?:also )?create a layer of [a-z]+ on all surfaces in the area, which become difficult terrain\.$/i;
// What the area does to objects, for the GM: "Unattended objects in the area become slick with ice, and picking them up requires a
// successful Reflex save or Acrobatics check against your spell DC." / "The ice melts on any object that takes fire damage as well as in
// any square included in the area of a higher-rank spell or effect with the fire trait."
const OBJECT_NOTE = /^Unattended objects in the area become [a-z ]{3,30}, and picking them up requires a successful (?:Fortitude|Reflex|Will) save or [A-Z][a-z]+ check against your spell DC\.$|^The [a-z]+ melts on any object that takes fire damage(?: as well as in any square included in the area of a higher-rank spell or effect with the fire trait)?\.$/;
const DUST = /^The [a-z]+ (?:turn to dust|crumble(?: away)?|vanish|fade away) when the spell ends\.$/i;
const DISMISS = /^You can Dismiss (?:the|this) (?:spell|cloud)\.$/;
// "The ground in the area becomes difficult terrain for the duration of the spell." / "Until the start of your next turn, the
// area is difficult terrain and hazardous terrain." — PF2e's difficult terrain on the area's region.
const TERRAIN = /^(Until the start of your next turn, |[A-Z][a-z ]{3,40} with [a-z]+, )?the (?:ground in the )?area(?: they fill)? (?:is|becomes) difficult terrain( and hazardous terrain)?(?: for the duration(?: of the spell)?)?\.$/i;
// "Snowdrifts and icy gales fill the area until the start of your next turn, making the area difficult terrain." (Howling Blizzard)
const FILL_TERRAIN = /^[A-Z][a-z ]{3,40} fill the area until the start of your next turn, making the area difficult terrain\.$/;
// "If you Cast this Spell with 2 actions, it has an area of a 60-foot cone; if you Cast this Spell with 3 actions, it has a range of 500 feet and
// an area of a 30-foot burst." — PF2e's action variants; the item (or its variant) must have the stated area for its action count.
const ACTION_AREAS = /^If you Cast this Spell with 2 actions, it has an area of an? (\d+)-foot (cone|burst|line|emanation); if you Cast this Spell with 3 actions, it has a range of (\d+) feet and an area of an? (\d+)-foot (cone|burst|line|emanation)\.$/;
// "Any creature entering the square takes @Damage[(1d4 + ceil(@item.level / 2) - 1)[piercing]] damage with a basic Reflex
// saving throw." — entering deals its own formula.
const ENTER_DAMAGE = new RegExp(String.raw`^Any creature entering the (?:square|area) takes @Damage\[(\([^\[\]]+\)|\d+d\d+)\[([a-z]+)\]\] damage${BASIC}\.$`, "i");
// "A creature can Interact to clear a square of this scree.": the GM removes that square from the area.
const CLEAR = /^A creature can Interact to clear a square of this [a-z]+\.$/;
// "If you cast this spell again, any previous scatter scree you've cast ends."
const RECAST = /^If you cast this spell again, any previous ([a-z' ]+) you've cast ends\.$/i;
// "This smoke can be dispersed by a strong wind.": the GM ends the spell when it happens.
const DISPERSAL = /^This [a-z]+ can be dispersed by (?:a )?strong wind\.$/i;
const IT_TAKES = new RegExp(String.raw`^It takes ${DICE}${BASIC}\.$`, "i");
const ONCE = /^A creature can (?:only )?take damage from the [a-z ]+ only once per round\b[^.]*\.$|^A creature can take this damage only once per (?:round|turn)\.$/i;
// Diamond Dust: what the area does to light effects aimed into it, and its Sustain toggle (the GM's: notes).
const AREA_NOTES = [
    // Toxic Cloud's drifting fog (rewritten from "This functions as Mist, except the area moves 10 feet away from you each round."): the GM moves
    // the region each round.
    /^The area moves \d+ feet away from you each round: move the region\.$/,
    /^The [a-z]+ scatter and refract light; if a light effect enters [a-z ]+'s area, any creatures targeted by that effect gain a \+\d status bonus to AC and saves against it\.$/,
    /^While the spell persists, you can activate or deactivate this aura by Sustaining the spell\.$/
];
const ENDING = /^At the end of the duration, [^.]*\bharmlessly\b[^.]*\.$/i;
// "On subsequent rounds, the first time you Sustain the spell each round, you can expand the radius of the clockwork device by 5 feet." (Conjured
// Clockwork): an optional growth of the placed region, once per round after a Sustain (the record's control).
// Rouse Skeletons: "Their grasping claws deal 2d6 slashing damage to creatures on the ground in the area when the skeletons first appear with a
// basic Reflex save." / "On subsequent rounds, the first time you Sustain the Spell each round, you can move the area of skeletons up to 20 feet
// within the range of the spell and deal 2d6 slashing damage with a basic Reflex save to each creature in the new area." / "Damaging or
// destroying the skeletons is irrelevant, as new bones pull forth from the ground to repair and replace any that are obliterated." — the save
// when cast and on each Sustain (the GM moves the region first; creatures off the ground are left out on review).
const FIRST_APPEAR = /^Their [a-z ]+ deal (\d+d\d+) ([a-z]+) damage to creatures on the ground in the area when the [a-z]+ first appear with a basic (Fortitude|Reflex|Will) save\.$/;
const SUSTAIN_MOVE_DEAL = /^On subsequent rounds, the first time you Sustain the Spell each round, you can move the area of [a-z]+ up to (\d+) feet within the range of the spell and deal (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save to each creature in the new area\.$/;
const IRRELEVANT = /^Damaging or destroying the [a-z]+ is irrelevant, as new [a-z]+ pull forth from the ground to repair and replace any that are obliterated\.$/;
// Incendiary Fog: "If any open flame or fire effect is within the spell's area when it's cast, or later enters or occurs within the area, the
// cloud ignites." / "Creatures in the cloud take @Damage[10d6[fire]] damage (basic Reflex save), and the spell ends." — the GM's control when
// the cloud ignites (the creatures in it save), after which the spell ends.
const IGNITES = /^If any open flame or fire effect is within the spell's area when it's cast, or later enters or occurs within the area, the cloud ignites\.$/;
const IGNITED = /^Creatures in the cloud take (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\), and the spell ends\.$/;
// Rust Cloud: "Metal that rusts off of a creature adds to the cloud." / "When a metal creature takes damage from the cloud, the cloud's area
// increases by 5 feet (to a maximum of a @Template[burst|distance:40]), and the creature starts to rust, taking @Damage[(floor(@item.level/2)-1)d4
// [persistent,slashing]] damage." — after a creature of that trait takes the area's damage, the module deals that persistent damage and grows
// the region (up to the maximum).
const RUST_ADDS = /^Metal that rusts off of a creature adds to the cloud\.$/;
const TRAIT_RUST = /^When a ([a-z]+) creature takes damage from the cloud, the cloud's area increases by (\d+) feet \(to a maximum of a @Template\[burst\|distance:(\d+)\]\), and the creature starts to rust, taking @Damage\[(\([^\[\]]+\)d\d+)\[persistent,([a-z]+)\]\] damage\.$/;
const SUSTAIN_EXPAND = /^On subsequent rounds, the first time you Sustain the spell each round, you can expand the radius of the [a-z ]+ by (\d+) feet\.$/;
const RULE_WORDS = /\d|\b(?:damage|save|saving throw|condition|concealed|mist|immune|bonus|penalty|Sustain|Dismiss|counteract|move|moves|choose|difficult terrain)\b/i;

function eventsIn(text) {
    return [...new Set(EVENT.filter(([, pattern]) => pattern.test(text)).map(([name]) => name))];
}

/** Seconds the area lasts: "N rounds/minutes", or a bare sustained duration (PF2e: up to 10 minutes). */
function areaSeconds(adapted) {
    const raw = String(adapted.lifecycle?.duration ?? "").trim().replace(/^sustained up to /i, "");
    if (!raw && adapted.lifecycle?.sustained === true) return 600;
    const duration = /^(\d+) (round|minute)s?$/i.exec(raw);
    return duration ? Number(duration[1]) * (duration[2].toLowerCase() === "round" ? 6 : 60) : null;
}

// A sustained basic save on its targets, repeated on Sustain: "The target is cloaked in the freezing void, which deals
// 3d6 cold damage immediately and the first time each round you Sustain the Spell on future turns, with a basic
// Fortitude save." and optionally "The target is Fatigued for as long as the effect persists."
const TARGET_REPEAT = /(?:^|,? which |\b)(?:deals?|takes?) (\d+d\d+) ([a-z]+) damage immediately and the first time each round you Sustain the Spell(?: on (?:future|subsequent) turns)?, with a basic (Fortitude|Reflex|Will) save\.$/i;
const WHILE_CONDITION = /^The target is ([A-Z][a-z-]+)(?: (\d+))? for as long as the effect persists\.$/;
const CONDITION_SLUGS = new Set(["fatigued", "clumsy", "enfeebled", "stupefied", "sickened", "frightened", "dazzled", "deafened", "off-guard", "slowed", "drained"]);

function compileTargetRepeat(adapted) {
    const target = String(adapted.targeting?.target ?? "").trim();
    if (!/^(?:1|one) creature$/i.test(target) || adapted.lifecycle?.sustained !== true) return null;
    const seconds = areaSeconds(adapted);
    const components = adapted.damageComponents ?? [];
    if (!seconds || components.length !== 1 || components[0].category || components[0].kinds?.join() !== "damage") return null;
    const text = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    let repeat = null, memberCondition = null, narrated = 0;
    const claimed = [];
    for (const sentence of sentences) {
        const match = !repeat ? TARGET_REPEAT.exec(sentence) : null;
        if (match) {
            if (String(components[0].formula).replace(/\s+/g, "") !== match[1] || String(components[0].type).toLowerCase() !== match[2].toLowerCase()
                || match[3].toLowerCase() !== adapted.defense.statistic) return null;
            repeat = sentence; claimed.push(sentence); continue;
        }
        const held = WHILE_CONDITION.exec(sentence);
        if (held && !memberCondition && CONDITION_SLUGS.has(held[1].toLowerCase())) {
            memberCondition = { slug: held[1].toLowerCase(), value: held[2] ? Number(held[2]) : null, sourceText: sentence }; claimed.push(sentence); continue;
        }
        if (!repeat && narrated < 1 && !RULE_WORDS.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!repeat) return null;
    return { lingering: { events: ["sustain"], initial: true, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: null, centre: "targets",
        durationSeconds: seconds, sustained: true, concealment: false, ...(memberCondition ? { memberCondition } : {}), sourceText: claimed } };
}

// An area whose save is only when cast, then a lasting effect on creatures of a trait while they're inside (Hallowed Ground):
//   "Each undead creature in the area takes 1d6 vitality damage and 1d4 spirit damage when you Cast the Spell, with a basic Fortitude
//   save." / "After that, undead creatures have weakness 1 to vitality damage and your necromancy spells while in the area." / "This spell
//   also automatically attempts to counteract any attempt to raise undead in the area (…)." / "If you Cast this Spell again, any previous
//   hallowed ground you had cast ends." and the linked Effect (the weakness).
const AFTER_SAVE = /^Each ([a-z]+) creature in the area takes (.+?) when you Cast (?:the|this) Spell, with a basic (Fortitude|Reflex|Will) save\.$/;
const AFTER_WEAKNESS = /^After that, ([a-z]+) creatures have weakness (\d+) to ([a-z]+) damage and your necromancy spells while in the area\.$/;
const RAISE_COUNTERACT = /^This spell also automatically attempts to counteract any attempt to raise undead in the area \(if either the undead would appear in the area or the effect's caster or creator is in it\)\.$/;
const AFTER_RECAST = /^If you Cast this Spell again, any previous ([a-z' ]+) you had cast ends\.$/i;

function compileAreaAfterEffect(adapted, area) {
    if (area.type !== "burst" || adapted.lifecycle?.sustained === true) return null;
    const seconds = areaSeconds(adapted);
    const components = adapted.damageComponents ?? [];
    if (!seconds || !components.length || components.some(component => component.category)) return null;
    const text = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML));
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const at = pattern => sentences.findIndex(sentence => pattern.test(sentence));
    const save = at(AFTER_SAVE), weakness = at(AFTER_WEAKNESS);
    if (save < 0 || weakness !== save + 1) return null;
    const [, trait, list, statistic] = AFTER_SAVE.exec(sentences[save]);
    const [, weakTrait, value, type] = AFTER_WEAKNESS.exec(sentences[weakness]);
    if (weakTrait !== trait || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    // The damage list names every entry once ("1d6 vitality damage and 1d4 spirit damage").
    const items = list.split(/,? and |, /).map(item => /^(\d+d\d+) ([a-z]+) damage$/.exec(item.trim()));
    if (items.some(item => !item) || items.length !== components.length
        || !components.every(component => items.some(item => item[1] === String(component.formula).replace(/\s+/g, "") && item[2] === String(component.type).toLowerCase()))) return null;
    const claimed = [sentences[save], sentences[weakness]];
    let counteract = null, recastEnds = false;
    for (const [index, sentence] of sentences.entries()) {
        if (index === save || index === weakness) continue;
        if (RAISE_COUNTERACT.test(sentence) && !counteract) { counteract = sentence; claimed.push(sentence); continue; }
        const recast = AFTER_RECAST.exec(sentence);
        if (recast && recast[1].toLowerCase() === String(adapted.source?.name ?? "").toLowerCase()) { recastEnds = true; claimed.push(sentence); continue; }
        if (/^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/.test(sentence)) continue;
        if (index < save && !RULE_WORDS.test(sentence)) continue;
        return null;
    }
    return {
        lingering: { events: [], initial: true, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: { type: area.type, value: Number(area.value) },
            centre: "placed", durationSeconds: seconds, sustained: false, concealment: false, ...(recastEnds ? { recastEnds: true } : {}),
            memberEffect: { trait, weakness: { value: Number(value), type }, sourceText: sentences[weakness] }, sourceText: claimed },
        ...(counteract ? { counteract } : {}),
        claimedSentences: claimed
    };
}

// A sustained area placed anew each time (Earth's Bile): "When you Cast this Spell and the first time you Sustain it each round
// thereafter, choose an area within range." / "Each creature in the area takes 1d4 fire damage, 1d4 bludgeoning damage, and
// @Damage[(ceil(@item.rank/2))[persistent,fire]] damage (the persistent fire damage is negated on a successful save)." with "Heightened (+2)
// … and the persistent fire damage increases by 1.": a basic save when cast and on each Sustain (the GM moves the area first); the
// persistent damage only on a failed save (doubled on a critical failure).
const CHOOSE_AREA = /^When you Cast (?:this|the) Spell and the first time you Sustain it each round thereafter, choose an area within range\.$/;
const LIST_WITH_PERSISTENT = /^Each creature in the area takes (.+?),? and @Damage\[\(ceil\(@item\.rank\/(\d)\)\)\[persistent,([a-z]+)\]\] damage \(the persistent \3 damage is negated on a successful save\)\.$/;

function compileMovingArea(adapted, area) {
    if (adapted.lifecycle?.sustained !== true || !["burst", "cylinder"].includes(area.type)) return null;
    const seconds = areaSeconds(adapted);
    const components = adapted.damageComponents ?? [];
    if (!seconds || !components.length || components.some(component => component.category)) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const sentences = htmlToPlainText(stripHeighteningHTML(html)).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const choose = sentences.findIndex(sentence => CHOOSE_AREA.test(sentence));
    const deals = sentences.findIndex(sentence => LIST_WITH_PERSISTENT.test(sentence));
    if (choose < 0 || deals !== choose + 1 || sentences.length !== deals + 1 || sentences.slice(0, choose).some(sentence => RULE_WORDS.test(sentence)) || choose > 2) return null;
    const [, list, interval, type] = LIST_WITH_PERSISTENT.exec(sentences[deals]);
    const items = list.split(/,? and |, /).map(item => /^(\d+d\d+) ([a-z]+) damage$/.exec(item.trim()));
    if (items.some(item => !item) || items.length !== components.length
        || !components.every(component => items.some(item => item[1] === String(component.formula).replace(/\s+/g, "") && item[2] === String(component.type).toLowerCase()))) return null;
    // The persistent damage rises 1 per its interval: the Heightened (+interval) entry says so.
    if (!new RegExp(String.raw`Heightened \(\+${interval}\)[^<]*\bthe persistent ${type} damage increases by 1\b`, "i").test(htmlToPlainText(html))) return null;
    const claimed = [sentences[choose], sentences[deals]];
    return {
        lingering: { events: ["sustain"], initial: true, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: { type: area.type, value: Number(area.value) },
            centre: "placed", durationSeconds: seconds, sustained: true, concealment: false, moveOnSustain: true,
            notes: ["Each time you Sustain it, choose a new area within range: move the area there first; creatures in it save."], sourceText: claimed },
        persistentOnFailure: { formula: `(ceil(@item.rank/${interval}))[persistent,${type}]`, doubled: `(2*(ceil(@item.rank/${interval})))[persistent,${type}]`, sourceText: sentences[deals] },
        claimedSentences: claimed
    };
}

// A damaging burst that leaves debris as difficult terrain for the spell's duration (Iron Rain):
//   "These blades deal 6d4 piercing damage and 3 persistent bleed damage to all creatures in the area." / "As the rain dissipates, the ground is
//   littered with hundreds of knives, creating difficult terrain that lasts for the duration of the spell." / "Any creature that's within the
//   difficult terrain can Interact to pick up one of the knives and wield it as a mundane dagger."
// The item's two damage entries (direct and persistent) when cast, with its basic save; then the placed area is difficult terrain; picking
// up a knife is a note.
const DEBRIS_DEALS = /^These [a-z]+ deal (\d+d\d+) ([a-z]+) damage and (\d+(?:d\d+)?) persistent ([a-z]+) damage to all creatures in the area\.$/;
const DEBRIS_TERRAIN = /^As the [a-z]+ dissipates, the ground is littered with [a-z ]+, creating difficult terrain that lasts for the duration of the spell\.$/;
const DEBRIS_PICKUP = /^Any creature that's within the difficult terrain can Interact to pick up one of the [a-z]+ and wield it as a mundane [a-z]+\.$/;
function compileDebrisTerrain(adapted, area) {
    if (!["burst", "cylinder"].includes(area.type) || adapted.lifecycle?.sustained) return null;
    const seconds = areaSeconds(adapted);
    const components = adapted.damageComponents ?? [];
    const direct = components.filter(component => !component.category), persistent = components.filter(component => component.category === "persistent");
    if (!seconds || components.length !== 2 || direct.length !== 1 || persistent.length !== 1) return null;
    const sentences = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => DEBRIS_DEALS.test(sentence));
    if (at < 0 || sentences.length !== at + 3 || sentences.slice(0, at).some(sentence => /\d|@|\b(?:damage|saves?|terrain|conditions?|must|each)\b/i.test(sentence))) return null;
    const deals = DEBRIS_DEALS.exec(sentences[at]);
    if (String(direct[0].formula).replace(/\s+/g, "") !== deals[1] || String(direct[0].type).toLowerCase() !== deals[2]
        || String(persistent[0].formula).replace(/\s+/g, "") !== deals[3] || String(persistent[0].type).toLowerCase() !== deals[4]) return null;
    if (!DEBRIS_TERRAIN.test(sentences[at + 1]) || !DEBRIS_PICKUP.test(sentences[at + 2])) return null;
    // "Heightened (+1) The piercing damage increases by 2d4, and the persistent bleed damage increases by 1.": PF2e's steps must be the text's.
    const html = String(adapted.descriptionHTML ?? "");
    if (/Heightened/.test(html)) {
        const step = /<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The ([a-z]+) damage increases by (\d+d\d+), and the persistent ([a-z]+) damage increases by (\d+(?:d\d+)?)\.\s*<\/p>/.exec(html);
        const h = adapted.heightening;
        if (!step || step[2] !== deals[2] || step[4] !== deals[4] || h?.type !== "interval" || Number(h.interval) !== Number(step[1])
            || h.damage?.[direct[0].id] !== step[3] || String(h.damage?.[persistent[0].id]) !== step[5]) return null;
    }
    const claimed = sentences.slice(at);
    return {
        lingering: { events: [], initial: true, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: { type: area.type, value: Number(area.value) },
            centre: "placed", durationSeconds: seconds, sustained: false, concealment: false, terrain: { difficulty: 2, movement: ["walk"], hazardous: false },
            notes: [sentences[at + 2]], sourceText: claimed },
        claimedSentences: claimed
    };
}

export function compileLingeringArea(adapted) {
    const area = adapted.targeting?.area;
    if (!area) return compileTargetRepeat(adapted);
    if (adapted.defense?.kind === "save" && adapted.defense.basic) {
        const after = compileAreaAfterEffect(adapted, area) ?? compileMovingArea(adapted, area);
        if (after) return after;
    }
    if (adapted.defense?.kind !== "save" || !adapted.defense.basic || !area || !["burst", "emanation", "cylinder", "cube", "line", "cone"].includes(area.type)) return null;
    // (A cone only as an action variant's terrain left until the caster's next turn: Howling Blizzard.)
    if (area.type === "cone" && !FILL_TERRAIN.test(htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z@])/).find(sentence => FILL_TERRAIN.test(sentence.trim())) ?? "")) return null;
    const debris = compileDebrisTerrain(adapted, area);
    if (debris) return debris;
    const sustained = adapted.lifecycle?.sustained === true;
    // An area lasting until the start of the caster's next turn has no item duration; its sentence says so.
    const plainAll = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML));
    const untilNextTurn = UNTIL_NEXT_TURN.test(plainAll) && !String(adapted.lifecycle?.duration ?? "").trim() && !sustained;
    const terrainNextTurn = (/\bUntil the start of your next turn, the (?:ground in the )?area (?:is|becomes) difficult terrain\b/i.test(plainAll)
        || /\bfill the area until the start of your next turn, making the area difficult terrain\b/.test(plainAll)) && !String(adapted.lifecycle?.duration ?? "").trim() && !sustained;
    const seconds = untilNextTurn || terrainNextTurn ? 6 : areaSeconds(adapted);
    if (!seconds) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || components[0].kinds?.join() !== "damage") return null;
    const component = components[0];
    const text = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML))
        .replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")
        .replace(/@Damage\[(\d+d\d+)\[([a-z]+)\]\]/gi, "$1 $2");
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    // Degree riders on the save ("A creature that critically fails the saving throw also becomes Sickened 1.").
    const riders = compileBasicDegreeRiders(adapted);
    const riderText = new Set((riders?.sentences ?? []).map(sentence => sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").trim()));
    const notes = [];
    let oncePerTurn = false;
    let events = [], oncePerRound = false, excludeCaster = false, enemiesOnly = false, damage = null, narrated = 0, pendingTrigger = null, concealment = false;
    let retaliation = null;
    let castDamage = null, sustainDamage = null, damageTypeChoice = null, terrain = null, enterDamage = null, recastEnds = false, terrainUntilNextTurn = false, dismissible = false, expandGrowth = null, ignition = null, traitRust = null;
    const claimed = [];
    const matchesComponent = (formula, type, statistic) => formula === String(component.formula).replace(/\s+/g, "")
        && type.toLowerCase() === String(component.type).toLowerCase()
        && (!statistic || statistic.toLowerCase() === adapted.defense.statistic);
    for (const sentence of sentences) {
        const dealing = !damage && !castDamage ? CAST_DEALING.exec(sentence) : null;
        if (dealing) {
            if (!matchesComponent(dealing[1], dealing[2], dealing[3] ?? dealing[4])) return null;
            events = ["initial"]; damage = sentence; claimed.push(sentence); continue;
        }
        if (DUST.test(sentence) && terrain) { claimed.push(sentence); continue; }
        const youDeal = !damage && !castDamage ? CAST_YOU_DEAL.exec(sentence) : null;
        if (youDeal) {
            if (!matchesComponent(youDeal[1], youDeal[2], youDeal[3] ?? youDeal[4])) return null;
            events = ["initial"]; damage = sentence; claimed.push(sentence); continue;
        }
        if (!terrain && damage && SURFACE_TERRAIN.test(sentence)) { terrain = { difficulty: 2, movement: ["walk"], hazardous: false }; claimed.push(sentence); continue; }
        if (terrain && OBJECT_NOTE.test(sentence)) { notes.push(sentence); claimed.push(sentence); continue; }
        if (DISMISS.test(sentence) && damage) { dismissible = true; claimed.push(sentence); continue; }
        const any = !damage && !castDamage ? CAST_ANY.exec(sentence) : null;
        if (any) {
            if (!matchesComponent(any[1], any[2], any[3] ?? any[4])) return null;
            events = ["initial"]; damage = sentence; claimed.push(sentence); continue;
        }
        if (!terrain && FILL_TERRAIN.test(sentence)) { terrain = { difficulty: 2, movement: ["walk"], hazardous: false }; terrainUntilNextTurn = true; claimed.push(sentence); continue; }
        const variants = ACTION_AREAS.exec(sentence);
        if (variants) {
            const time = String(adapted.activation?.time ?? adapted.time ?? "").trim();
            const stated = time === "3" ? { value: Number(variants[4]), type: variants[5] } : { value: Number(variants[1]), type: variants[2] };
            if (stated.type !== area.type || stated.value !== Number(area.value)) return null;
            claimed.push(sentence); continue;
        }
        const ground = !terrain ? TERRAIN.exec(sentence) : null;
        if (ground) {
            terrain = { difficulty: 2, movement: ["walk"], hazardous: !!ground[2] };
            terrainUntilNextTurn = /^Until the start of your next turn/i.test(ground[1] ?? ""); claimed.push(sentence); continue;
        }
        const entering = damage && !enterDamage ? ENTER_DAMAGE.exec(sentence) : null;
        if (entering) {
            const statistic = entering[3] ?? entering[4];
            if (statistic && statistic.toLowerCase() !== adapted.defense.statistic) return null;
            if ([...entering[1].matchAll(/@([a-z0-9_.-]+)/gi)].some(match => !["item.rank", "item.level"].includes(match[1].toLowerCase()))) return null;
            enterDamage = { formula: `${entering[1]}[${entering[2].toLowerCase()}]`, type: entering[2].toLowerCase() };
            events = [...new Set([...events, "enter"])]; claimed.push(sentence); continue;
        }
        if (CLEAR.test(sentence) && damage) { notes.push(sentence); claimed.push(sentence); continue; }
        const recast = RECAST.exec(sentence);
        if (recast) {
            if (recast[1].toLowerCase() !== String(adapted.source?.name ?? "").toLowerCase()) return null;
            recastEnds = true; claimed.push(sentence); continue;
        }
        const each = !damage && !castDamage ? CAST_EACH.exec(sentence) : null;
        if (each) {
            if (!matchesComponent(each[2], each[3], each[4] ?? each[5])) return null;
            events = ["initial"]; excludeCaster = !!each[1]; damage = sentence; claimed.push(sentence); continue;
        }
        if (riderText.has(sentence) && damage) { claimed.push(sentence); continue; }
        if (DISPERSAL.test(sentence)) { notes.push(sentence); claimed.push(sentence); continue; }
        const cast = CAST_DEALS.exec(sentence);
        if (cast && !damage && !castDamage) {
            if (!matchesComponent(cast[1], cast[2], cast[3] ?? cast[4])) return null;
            castDamage = sentence; claimed.push(sentence); continue;
        }
        const sustainDeals = SUSTAIN_DEALS.exec(sentence);
        if (sustainDeals && castDamage && !sustainDamage) {
            // Its own formula, of the spell's damage type and save; the formula may use only the cast rank.
            if (sustainDeals[2].toLowerCase() !== String(component.type).toLowerCase()) return null;
            const statistic = sustainDeals[3] ?? sustainDeals[4];
            if (statistic && statistic.toLowerCase() !== adapted.defense.statistic) return null;
            if ([...sustainDeals[1].matchAll(/@([a-z0-9_.-]+)/gi)].some(match => !["item.rank", "item.level"].includes(match[1].toLowerCase()))) return null;
            sustainDamage = { formula: `${sustainDeals[1]}[${sustainDeals[2].toLowerCase()}]`, type: sustainDeals[2].toLowerCase() };
            claimed.push(sentence); continue;
        }
        const deals = DEALS.exec(sentence);
        if (deals && !damage) {
            const found = eventsIn(` ${deals[3]}`);
            if (!found.length || !matchesComponent(deals[1], deals[2], deals[4] ?? deals[5])) return null;
            // "to each breathing creature" (Toxic Cloud): the GM leaves out creatures that don't breathe when reviewing who's in the area.
            if (/\bbreathing\b/i.test(sentence)) notes.push("Only creatures that breathe take the damage: leave out creatures that don't breathe when you review the targets.");
            events = found; damage = sentence; enemiesOnly = /\bto (?:each|any) enemy\b/i.test(sentence); claimed.push(sentence); continue;
        }
        if (SUBJECT.test(sentence) && eventsIn(sentence).length && !damage) {
            const takes = TAKES.exec(sentence);
            events = eventsIn(sentence);
            excludeCaster = /\bother than you\b/i.test(sentence);
            enemiesOnly = /^(?:A|Any|Each|An) enemy\b/i.test(sentence);
            const choice = !takes ? TAKES_CHOICE.exec(sentence) : null;
            if (takes) {
                if (!matchesComponent(takes[1], takes[2], takes[3] ?? takes[4])) return null;
                damage = sentence;
            } else if (choice) {
                // The item's damage is untyped; the text gives the two types to choose from.
                if (String(component.type).toLowerCase() !== "untyped" || choice[1] !== String(component.formula).replace(/\s+/g, "")
                    || choice[2].toLowerCase() === choice[3].toLowerCase() || (choice[4] ?? choice[5]).toLowerCase() !== adapted.defense.statistic) return null;
                damageTypeChoice = { values: [choice[2].toLowerCase(), choice[3].toLowerCase()], sourceText: sentence };
                damage = sentence;
            } else pendingTrigger = sentence; // "… is sliced by the petals." then "It takes …"
            claimed.push(sentence);
            continue;
        }
        // "When you Cast the Spell and the first time you Sustain it each round, each creature in the area takes 2d6 fire damage (basic Reflex save)."
        // ("the first time you sustain it each round": the text's lowercase too.)
        const sustainTakes = !damage && /\bSustain\b/i.test(sentence) ? SUSTAIN_TAKES.exec(sentence) : null;
        const sustainEvents = sustainTakes ? lingeringTriggerEvents(sustainTakes[1]) : null;
        if (sustainEvents?.includes("sustain")) {
            if (!matchesComponent(sustainTakes[2], sustainTakes[3], sustainTakes[4] ?? sustainTakes[5])) return null;
            events = sustainEvents; damage = sentence; claimed.push(sentence); continue;
        }
        const it = IT_TAKES.exec(sentence);
        if (it && pendingTrigger && !damage) {
            if (!matchesComponent(it[1], it[2], it[3] ?? it[4])) return null;
            damage = sentence; claimed.push(sentence); continue;
        }
        if (CONCEALMENT.test(sentence)) { concealment = true; claimed.push(sentence); continue; }
        if (damage && AREA_NOTES.some(pattern => pattern.test(sentence))) { notes.push(sentence); claimed.push(sentence); continue; }
        if (ONCE.test(sentence)) { if (/once per turn\.$/i.test(sentence)) oncePerTurn = true; else oncePerRound = true; claimed.push(sentence); continue; }
        if (ENDING.test(sentence)) { claimed.push(sentence); continue; }
        if (damage && RUST_ADDS.test(sentence)) { claimed.push(sentence); continue; }
        const rust = damage && !traitRust ? TRAIT_RUST.exec(sentence) : null;
        if (rust) {
            if ([...rust[4].matchAll(/@([a-z0-9_.-]+)/gi)].some(match => !["item.rank", "item.level"].includes(match[1].toLowerCase()))) return null;
            traitRust = { trait: rust[1], feet: Number(rust[2]), maxRadius: Number(rust[3]), formula: rust[4], type: rust[5], sourceText: sentence };
            claimed.push(sentence); continue;
        }
        if (!ignition && !damage && IGNITES.test(sentence)) { ignition = { sourceText: sentence }; claimed.push(sentence); continue; }
        const ignited = ignition && !damage ? IGNITED.exec(sentence) : null;
        if (ignited) {
            if (!matchesComponent(ignited[1], ignited[2], ignited[3])) return null;
            events = []; damage = sentence; ignition.sourceText = `${ignition.sourceText} ${sentence}`; claimed.push(sentence); continue;
        }
        const appear = !damage ? FIRST_APPEAR.exec(sentence) : null;
        if (appear) {
            if (!matchesComponent(appear[1], appear[2], appear[3])) return null;
            events = [...new Set([...events, "initial"])]; damage = sentence;
            notes.push("Only creatures on the ground in the area take the damage: leave flying creatures out when you review the targets."); claimed.push(sentence); continue;
        }
        const moveDeal = damage && !events.includes("sustain") ? SUSTAIN_MOVE_DEAL.exec(sentence) : null;
        if (moveDeal) {
            if (!matchesComponent(moveDeal[2], moveDeal[3], moveDeal[4])) return null;
            events = [...events, "sustain"];
            notes.push(`The first time you Sustain it each round, you can move the area up to ${moveDeal[1]} feet within range: move the region first; each creature in the new area saves.`);
            claimed.push(sentence); continue;
        }
        if (IRRELEVANT.test(sentence)) { claimed.push(sentence); continue; }
        // Shroud of Flame: "Each creature that hits you with an unarmed attack, Grapples you, or otherwise touches you takes @Damage[3[fire]] damage."
        // with "Heightened (+1) The damage caused by touching you increases by 1, …": a retaliation marker on the caster for the area's lifetime
        // (the GM's Retaliate control), its flat damage stepping by 1 a rank.
        const touched = !retaliation && area.type === "emanation" ? TOUCH_RETALIATION.exec(sentence) : null;
        if (touched) {
            const step = /Heightened \(\+1\) The damage caused by touching you increases by 1\b/.exec(htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " "));
            if (!step && /Heightened/.test(String(adapted.descriptionHTML ?? ""))) return null;
            retaliation = { triggers: [{ trigger: "A creature hits the caster with an unarmed attack, Grapples them, or otherwise touches them.",
                damage: { formula: step ? `${touched[1]} + @item.rank - ${Number(adapted.rank)}` : touched[1], type: touched[2] }, sourceText: sentence }] };
            claimed.push(sentence); continue;
        }
        const expand = !expandGrowth ? SUSTAIN_EXPAND.exec(sentence) : null;
        if (expand) { expandGrowth = { feet: Number(expand[1]), optional: true, sourceText: sentence }; claimed.push(sentence); continue; }
        // Up to two opening sentences of narration (they may mention the spell's duration).
        if (narrated < 2 && !claimed.length && !RULE_WORDS.test(sentence.replace(/\bfor the spell's duration\b/i, ""))) { narrated++; continue; }
        if (globalThis.process?.env?.LINGER_DEBUG) console.error("lingering area: unread sentence:", sentence);
        return null;
    }
    // Cast damage with different Sustain damage: exposed when cast and on each Sustain.
    if (castDamage) {
        if (damage || !sustainDamage) return null;
        damage = castDamage; events = ["initial", "sustain"];
    }
    if (!damage || (!events.length && !(ignition && concealment))) return null;
    // Only a save on casting is an ordinary area save, unless the area lingers to conceal or as terrain.
    if (events.every(event => event === "initial") && !concealment && !terrain) return null;
    // Hazardous terrain is the entering damage; clearing squares is terrain's.
    if (terrain?.hazardous && !enterDamage) return null;
    if (enterDamage && !terrain?.hazardous) return null;
    if (notes.some(note => CLEAR.test(note)) && !terrain) return null;
    // "Until the start of your next turn, the area is …" sets the lifetime of an area with no item duration.
    if (terrainUntilNextTurn && String(adapted.lifecycle?.duration ?? "").trim()) return null;
    // Every rider sentence was claimed after the damage.
    if (riders && riders.sentences.length !== claimed.filter(sentence => riderText.has(sentence)).length) return null;
    // A 1-round area ends at the start of the caster's next turn.
    const oneRound = !sustained && /^1 round$/i.test(String(adapted.lifecycle?.duration ?? "").trim());
    if (events.includes("sustain") && !sustained) return null;
    if (expandGrowth && (!sustained || area.type !== "burst")) return null;
    if (traitRust && (area.type !== "burst" || traitRust.maxRadius <= Number(area.value))) return null;
    return {
        lingering: {
            events: events.filter(event => event !== "initial"),
            initial: events.includes("initial"),
            oncePerRound: oncePerRound || events.every(event => ["turn-start", "turn-end"].includes(event)) && events.length === 1,
            ...(expandGrowth ? { sustainGrowth: expandGrowth } : {}),
            // (A growth on every Sustain read before this compiler — Awaken Entropy.)
            ...(!expandGrowth && adapted.sustainGrowth?.optional === false && sustained && area.type === "burst" ? { sustainGrowth: { ...adapted.sustainGrowth } } : {}),
            ...(traitRust && area.type === "burst" ? { traitRust } : {}),
            // (The GM's ignition control; the spell ends once its saves are done.)
            ...(ignition ? { gmAction: { actions: ["ignite"], label: "was in the cloud when it ignited", endsSpell: true, sourceText: ignition.sourceText } } : {}),
            ...(oncePerTurn ? { oncePerTurn: true } : {}),
            excludeCaster,
            enemiesOnly,
            ...(sustainDamage ? { sustainDamage } : {}),
            ...(retaliation ? { retaliation } : {}),
            area: { type: area.type, value: Number(area.value) },
            centre: area.type === "emanation" ? "caster" : "placed",
            durationSeconds: seconds,
            ...(untilNextTurn || oneRound || terrainUntilNextTurn ? { endsAt: "caster-turn-start" } : {}),
            ...(terrain ? { terrain } : {}),
            ...(enterDamage ? { enterDamage } : {}),
            ...(recastEnds ? { recastEnds: true } : {}),
            ...(dismissible ? { dismissible: true } : {}),
            sustained,
            concealment,
            ...(notes.length || adapted.lingeringNotes?.length ? { notes: [...notes, ...(adapted.lingeringNotes ?? [])] } : {}),
            // (Zombie Horde: the area grows by the thralls destroyed in it — the GM's control.)
            ...(adapted.thrallGrowth ? { thrallGrowth: { ...adapted.thrallGrowth } } : {}),
            sourceText: claimed
        },
        ...(damageTypeChoice ? { damageTypeChoice } : {}),
        ...(riders && claimed.some(sentence => riderText.has(sentence)) ? { riders } : {})
    };
}

// Degree-save areas: the preamble names who must save and when ("Each creature
// in the area when the spell is cast or that ends its turn in the area
// afterward must attempt a Fortitude save."); the degree table says what
// happens. Every event phrase is removed from the sentence, and what remains
// must be a bare subject: any qualifier (enemies, living creatures, sizes,
// extra damage) leaves residue and refuses the area.
const AREA_REF = String.raw`(?:the |this )?(?:spell's area|area|emanation|aura|burst|cloud|[a-z]+ (?:area|cloud|field|zone)|[a-z]+'s space)`;
const TRIGGER_PHRASES = [
    // "the first time a creature enters a cluster each round": entering exposes a creature once per round.
    [["enter-once"], new RegExp(String.raw`\bthe first time (?:a creature|an enemy|it) (?:enters?|moves? into) ${AREA_REF} each round\b`, "gi")],
    [["initial", "sustain"], new RegExp(String.raw`\bwhen you Cast (?:the|this) Spell,? and (?:the first time (?:each (?:round|turn) )?you Sustain (?:it|the Spell|this Spell)(?: each (?:round|turn))?(?: on subsequent (?:rounds|turns))?|each time you Sustain (?:it|the Spell|this Spell))\b`, "gi")],
    // "The first time you Sustain the spell each round" alone (Freezing Rain, rewritten): exposed only on a Sustain, never when cast.
    [["sustain"], new RegExp(String.raw`\bthe first time you Sustain (?:the|this) Spell each round\b`, "gi")],
    // "in the area when the spell is cast and at the start of each round" (the merged Mushroom Patch trigger).
    [["initial", "round-start"], new RegExp(String.raw`\b(?:in|within) ${AREA_REF} when the spell is cast and at the start of each round\b`, "gi")],
    [["initial"], new RegExp(String.raw`\b(?:is )?(?:in|within) ${AREA_REF} when (?:the spell is cast|you cast (?:the|this) spell|this spell is cast|it's created)\b`, "gi")],
    // "enter or begin their turn in the rainbow's space": the object of "enter" is the same area.
    [["enter", "turn-start"], new RegExp(String.raw`\benters? or (?:starts?|begins?) (?:its|their) turns? (?:in|within) ${AREA_REF}\b`, "gi")],
    [["enter", "turn-end"], new RegExp(String.raw`\benters? or ends? (?:its|their) turns? (?:in|within) ${AREA_REF}\b`, "gi")],
    [["enter"], new RegExp(String.raw`\b(?:later )?(?:enters?|moves? into) ${AREA_REF}\b`, "gi")],
    [["turn-start"], new RegExp(String.raw`\b(?:starts?|begins?|beginning|starting) (?:its|their) turns? (?:in|within) ${AREA_REF}\b`, "gi")],
    [["turn-end"], new RegExp(String.raw`\bends? (?:its|their) turns? (?:in|within) ${AREA_REF}(?: afterward| during the spell's duration)?\b`, "gi")]
];
const BARE_SUBJECT = /^(?:(?:each round that|each|any|every|an?|all|that's|that|who|if|whenever|it|they|the|creatures?|enem(?:y|ies)|is|or|and|later|,)\s*)+$/i;
// "each creature in the area" names who is exposed at the moment of casting or Sustaining.
const MOMENT_SUBJECT = new RegExp(String.raw`\b(?:each|all|every) (?:living )?(?:creatures?|enem(?:y|ies)) (?:in|within) ${AREA_REF}\b`, "gi");
// The trigger may also deal the spell's damage first: "… takes 1d4 mental damage and must attempt a Will save."
const DEGREE_TRIGGER = /^(.+?)(?:,? takes? (\d+d\d+) ([a-z]+) damage and)?,? (?:must attempt|attempts?) an? (Fortitude|Reflex|Will) sav(?:e|ing throw)(?: against [a-z' ]{3,40}| with the following effects)?\.$/i;
const OBJECTS_UNAFFECTED = /^Objects are unaffected\.$/i;
// "In addition, a creature must attempt a Will saving throw if it is inside the cloud when you cast it, when it enters the cloud, when it ends its
// turn within the cloud, or if it uses a Seek or Interact action on the cloud.": the listed exposures; using an action on the area is the
// GM's control (the module can't see it).
const LIST_TRIGGER = /^(?:In addition, )?(?:[Aa]|[Ee]ach) creature must attempt an? (Fortitude|Reflex|Will) sav(?:ing throw|e) (.+)\.$/;
const LIST_CLAUSES = [
    [/^if it(?: is|'s) (?:inside|in|within) the ([a-z]+) when you cast it$/, "initial"],
    // (Confusing Colors: "…, enters the cloud, ends its turn within the cloud, …" — the clauses without "when it".)
    [/^(?:when it )?enters the ([a-z]+)$/, "enter"],
    [/^(?:when it )?ends its turn (?:inside|in|within) the ([a-z]+)$/, "turn-end"],
    [/^when it (?:starts|begins) its turn (?:inside|in|within) the ([a-z]+)$/, "turn-start"]
];
// "Whenever a creature attempts to enter or leave the area, they must attempt a Will saving throw.": an attempt the module can't see; the GM's
// control exposes the creature (Unbounded Sphere).
const CROSSING = /^Whenever a creature attempts to enter or leave the area, (?:they|it) must attempt an? (Fortitude|Reflex|Will) saving throw\.$/;
// (Radiant Globe, rewritten: "An attacker targeting creatures or objects through the globe's surface with a physical ranged attack must attempt a
// Fortitude save.") — the GM's control for the attacker, wherever it stands.
const THROUGH_SURFACE = /^An attacker targeting creatures or objects through the [a-z]+'s surface with a physical ranged attack must attempt an? (Fortitude|Reflex|Will) save\.$/;
const ACTION_CLAUSE = /^(?:if it )?uses an? ([A-Z][a-z]+) or ([A-Z][a-z]+) action on the ([a-z]+)$/;
// "Creatures are Dazzled while inside the cloud.": each creature inside holds the condition.
// (Confusing Colors: ", as are those within 20 feet of the cloud's area" — the GM's, a note.)
const WHILE_INSIDE = /^Creatures are ([A-Z][a-z]+) while inside the ([a-z]+)(, as are those within (\d+) feet of the \2's area)?\.$/;
// "A creature currently Fascinated by hypnotize doesn't attempt new saves.": no exposure while this spell's condition holds.
// ("A creature currently affected by the cloud doesn't need to attempt new saves.": any condition the rows give.)
const NO_NEW_SAVES = /^A creature currently ([A-Z][a-z]+|affected) by [a-z' ]+ doesn't (?:need to )?attempt new sav(?:es|ing throws)\.$/;
const HEALING_COUNTERACT = /^When a creature in the spell's area would be healed by a (vitality|void) effect, the [a-z ]+ attempts to counteract that effect, preventing that healing but not otherwise preventing the effect if it's counteracted\.$/;
// "All surfaces in the area are difficult terrain." / "The area becomes difficult terrain, similarly to a shallow bog."
const DEGREE_TERRAIN = /^(?:All surfaces in the area are|The area (?:is|becomes)|The ground in the area (?:is|becomes)) difficult terrain(?:, similarly to an? [a-z ]{3,30})?\.$/i;
// "Corpses within a cluster rapidly decompose.": what happens to corpses, not creatures.
const CORPSES = /^Corpses (?:within|in) (?:the|an?) [a-z]+ (?:rapidly |quickly )?decompose\.$/i;
// "…, it takes 3d4 poison damage with a Fortitude save as poisonous spores fill the air.": the trigger, then the damage and the
// save the degree table scales.
const DEGREE_TAKES = /^(.+?),? it takes (\d+d\d+) ([a-z]+) damage with an? (Fortitude|Reflex|Will) save(?: as [a-z' ]{3,40})?\.$/i;
// "Creatures that start their turn within the cloud take 2d4 fire damage as their lungs fill with the hot, acrid smoke, with a Fortitude save."
const DEGREE_TAKE_AS = /^(.+?) takes? (\d+d\d+) ([a-z]+) damage(?: as [a-z' ,]{3,60})?, with an? (Fortitude|Reflex|Will) save\.$/i;
// "The cloud is difficult terrain for flying creatures, and creatures in the cloud can't detect anything using their sense of smell.":
// terrain for flying only; the restriction is a note for the GM.
const FLYING_TERRAIN = /^The (?:area|cloud|[a-z]+ cloud) is difficult terrain for flying creatures(?:, and creatures in the (?:area|cloud) (can't [a-z' ]{5,80}))?\.$/i;
// "<p><strong>Area</strong> three 5-foot bursts that don't overlap</p>": several separate areas of the item's shape and size.
const AREA_COUNT_PARAGRAPH = /<p>\s*<strong>\s*Area\s*<\/strong>\s*([^<]*?)\s*<\/p>\s*(?:<hr\s*\/?>\s*)?/i;

export function lingeringTriggerEvents(text) {
    let rest = ` ${text} `;
    const events = new Set();
    for (const [names, pattern] of TRIGGER_PHRASES) {
        if (!pattern.test(rest)) continue;
        pattern.lastIndex = 0;
        rest = rest.replace(pattern, " , ");
        for (const name of names) events.add(name);
    }
    if (events.has("initial") || events.has("sustain")) rest = rest.replace(MOMENT_SUBJECT, match => /enem/i.test(match) ? " each enemy " : " each creature ");
    if (!events.size || !BARE_SUBJECT.test(rest.replace(/\s+/g, " ").trim())) return null;
    return [...events];
}

/**
 * The lingering declaration for a degree-save area, with the preamble sentences
 * it claims. The degree table itself is compiled by the normal save compiler.
 */
// "For the duration of the spell, the target must attempt a Fortitude save at the beginning of its turn.": a single target that
// saves at the start of each of its turns while the spell lasts (no save when cast); the degree table says what each save does.
const TARGET_TURN_SAVE = /^(?:For the duration of the spell, the target must attempt an? (Fortitude|Reflex|Will) save at the (?:beginning|start) of (?:its|each of its) turns?|At the start of each of the target's turns, it must attempt an? (Fortitude|Reflex|Will) saving throw)\.$/;
// "The target can spend its entire turn running as far away as possible to escape the spirit and end the spell early.": the GM ends it.
const RUN_AWAY = /^The target can spend its entire turn running as far away as possible to escape the [a-z]+ and end the spell early\.$/;
// "The portal follows the target around, and the tentacle can't be targeted or harmed.": the spell's visible parts, not a rule.
const FOLLOWS = /^The [a-z]+ follows the target around, and the [a-z]+ can't be targeted or harmed\.$/;

function compileTargetTurnSaves(adapted) {
    if (!/^(?:1|one) (?:living )?creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const seconds = areaSeconds(adapted);
    if (!seconds || (adapted.damageComponents ?? []).length) return null;
    const prefix = String(adapted.descriptionHTML ?? "").split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0];
    const sentences = htmlToPlainText(prefix).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const trigger = sentences.find(sentence => TARGET_TURN_SAVE.test(sentence));
    const statistic = trigger ? TARGET_TURN_SAVE.exec(trigger).slice(1).find(Boolean) : null;
    if (!trigger || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const runAway = sentences.filter(sentence => RUN_AWAY.test(sentence));
    const claimed = [trigger, ...sentences.filter(sentence => FOLLOWS.test(sentence)), ...runAway];
    return {
        lingering: { events: ["turn-start"], initial: false, oncePerRound: true, excludeCaster: false, enemiesOnly: false, area: null, centre: "targets",
            durationSeconds: seconds, sustained: adapted.lifecycle?.sustained === true, concealment: false, ...(runAway.length ? { notes: runAway } : {}), sourceText: claimed },
        claimedSentences: claimed
    };
}

// "The target must attempt a Will save. Each time you Sustain this Spell, the target attempts another Will save.": a sustained single target
// that saves when cast and again on each Sustain; the degree table says what each save does. One opening sentence of narration.
const SUSTAIN_SAVE = /^Each time you Sustain (?:this|the) Spell, the target attempts another (Fortitude|Reflex|Will) save\.$/;

function compileTargetSustainSaves(adapted) {
    if (!/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.lifecycle?.sustained !== true) return null;
    const seconds = areaSeconds(adapted);
    if (!seconds || (adapted.damageComponents ?? []).length) return null;
    const prefix = String(adapted.descriptionHTML ?? "").split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0];
    const sentences = htmlToPlainText(prefix).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const first = sentences.findIndex(sentence => FIRST_SAVE.test(sentence)), again = sentences.findIndex(sentence => SUSTAIN_SAVE.test(sentence));
    if (first < 0 || again !== first + 1 || sentences.length !== again + 1 || first > 1 || (first === 1 && RULE_WORDS.test(sentences[0]))) return null;
    if ([FIRST_SAVE.exec(sentences[first])[1], SUSTAIN_SAVE.exec(sentences[again])[1]].some(statistic => statistic.toLowerCase() !== adapted.defense.statistic)) return null;
    const claimed = [sentences[first], sentences[again]];
    return {
        lingering: { events: ["sustain"], initial: true, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: null, centre: "targets",
            durationSeconds: seconds, sustained: true, concealment: false, sourceText: claimed },
        claimedSentences: claimed
    };
}

// "The target glows intensely with an otherworldly light, blinding any who approach." / "Any creature that begins its turn adjacent to the target
// must attempt a Fortitude save." (Gleaming Pet): the creatures within 5 feet of the targeted companion save as their turns begin (not the target,
// and not when cast); the degree table says what each save does.
const ADJACENT_TURN_SAVE = /^Any creature that begins its turn adjacent to the target must attempt an? (Fortitude|Reflex|Will) save\.$/;

function compileTargetAuraSaves(adapted) {
    if (!/^(?:your (?:companion or eidolon|animal companion|eidolon|companion)|(?:1|one) (?:creature|ally))$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const seconds = areaSeconds(adapted);
    if (!seconds || (adapted.damageComponents ?? []).length) return null;
    const prefix = String(adapted.descriptionHTML ?? "").split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0];
    const sentences = htmlToPlainText(prefix).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => ADJACENT_TURN_SAVE.test(sentence));
    if (at < 0 || sentences.length !== at + 1 || at > 1 || (at === 1 && RULE_WORDS.test(sentences[0]))) return null;
    if (ADJACENT_TURN_SAVE.exec(sentences[at])[1].toLowerCase() !== adapted.defense.statistic) return null;
    return {
        lingering: { events: ["turn-start"], initial: false, oncePerRound: true, excludeCaster: false, enemiesOnly: false, area: null, centre: "targets", aura: { feet: 5 },
            durationSeconds: seconds, sustained: adapted.lifecycle?.sustained === true, concealment: false, sourceText: [sentences[at]] },
        claimedSentences: sentences.slice(0, at + 1)
    };
}

export function compileLingeringSaveTriggers(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind === "save" && !adapted.defense.basic && !area) return compileTargetTurnSaves(adapted) ?? compileTargetSustainSaves(adapted) ?? compileTargetAuraSaves(adapted);
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || !area || !["burst", "emanation", "cylinder", "line", "square"].includes(area.type)) return null;
    // "until the start of your next turn" (Gust of Wind): one round, ending when the caster's turn starts.
    const untilNextTurn = /^until the start of your next turn$/i.test(String(adapted.lifecycle?.duration ?? "").trim()) && adapted.lifecycle?.sustained !== true;
    const seconds = areaSeconds(adapted) ?? (untilNextTurn ? 6 : null);
    if (!seconds) return null;
    let prefix = String(adapted.descriptionHTML ?? "").split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0];
    // Several areas: exactly the item's shape and size, stated as separate.
    let areaCount = 1;
    const areaParagraph = AREA_COUNT_PARAGRAPH.exec(prefix);
    if (areaParagraph) {
        const count = /^(two|three|four|five) (\d+)-foot (bursts|cylinders) that don't overlap$/i.exec(areaParagraph[1].trim());
        if (!count || count[3].toLowerCase() !== `${area.type}s` || Number(count[2]) !== Number(area.value)) return null;
        areaCount = COUNTS[count[1].toLowerCase()];
        prefix = prefix.replace(areaParagraph[0], "");
    }
    let text = htmlToPlainText(prefix).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")
        .replace(/@Damage\[(\d+d\d+)\[([a-z]+)\]\]/gi, "$1 $2");
    // The areas' own noun ("one of the clusters", "a cluster") is "the area".
    const noun = areaCount > 1 ? /\bone of the ([a-z]+)s\b/.exec(text)?.[1] : null;
    if (areaCount > 1 && !noun) return null;
    const original = new Map();
    const split = text.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean).map(sentence => {
        if (!noun) return sentence;
        const rewritten = sentence.replace(new RegExp(String.raw`\b(?:one of the ${noun}s|an? ${noun}|the ${noun}s?)\b`, "g"), "the area");
        original.set(rewritten, sentence);
        return rewritten;
    });
    // "…, each creature in the area takes 7d6 spirit damage. An affected creature attempts a Fortitude save." is one trigger.
    const sentences = [], origins = new Map();
    let breathingOnly = false;
    for (let index = 0; index < split.length; index++) {
        // "When the spell is cast and at the beginning of each round, the mushroom's release a cloud of irritating spores." / "Creatures in the
        // area must attempt a Fortitude save.": one trigger.
        const rounds = /^When the spell is cast and at the (?:beginning|start) of each round, [^.@\d]+\.$/.exec(split[index]);
        const roundSave = /^Creatures in the area must attempt an? (Fortitude|Reflex|Will) save\.$/.exec(split[index + 1] ?? "");
        if (rounds && roundSave && !/\b(?:damage|save|bonus|penalty|condition)\b/i.test(split[index])) {
            const merged = `Each creature in the area when the spell is cast and at the start of each round must attempt a ${roundSave[1]} save.`;
            sentences.push(merged); origins.set(merged, [split[index], split[index + 1]]); index++;
            continue;
        }
        // "You deal 4d6 poison damage to each breathing creature that starts its turn in the area." / "Each affected creature must attempt a Fortitude
        // save.": one trigger (only breathing creatures: the GM's review, a note).
        const youDeal = /^You deal (\d+d\d+ [a-z]+ damage) to each (breathing )?creature (that (?:starts|ends) its turn in the area)\.$/.exec(split[index]);
        const youSave = /^Each affected creature must attempt an? (Fortitude|Reflex|Will) save\.$/.exec(split[index + 1] ?? "");
        if (youDeal && youSave) {
            const merged = `Each creature ${youDeal[3]} takes ${youDeal[1]} and must attempt a ${youSave[1]} save.`;
            if (youDeal[2]) breathingOnly = true;
            sentences.push(merged); origins.set(merged, [split[index], split[index + 1]]); index++;
            continue;
        }
        const damage = /^(.+?),? takes? (\d+d\d+ [a-z]+ damage)\.$/i.exec(split[index]);
        const save = /^(?:An|Each) affected creature attempts an? (Fortitude|Reflex|Will) sav(?:e|ing throw)\.$/i.exec(split[index + 1] ?? "");
        if (damage && save) {
            const merged = `${damage[1]} takes ${damage[2]} and must attempt a ${save[1]} save.`;
            sentences.push(merged); origins.set(merged, [split[index], split[index + 1]]); index++;
        }
        else sentences.push(split[index]);
    }
    let events = null, enemiesOnly = false, terrain = null, notImmune = null, dismissible = false, concealment = false;
    let memberCondition = null, gmAction = null, skipWhile = null;
    // The sentence as the description has it (with its links), for the preamble check's claims.
    const rawSentences = htmlToPlainText(prefix).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const raw = sentence => rawSentences.find(candidate => candidate.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") === sentence) ?? original.get(sentence) ?? sentence;
    const restrictions = [];
    const claimed = [];
    const components = adapted.damageComponents ?? [];
    for (const sentence of sentences) {
        const listed = !events ? LIST_TRIGGER.exec(sentence) : null;
        if (listed) {
            if (listed[1].toLowerCase() !== adapted.defense.statistic) return null;
            const found = [];
            for (const clause of listed[2].split(/, /).map(part => part.replace(/^or /, "").trim())) {
                const event = LIST_CLAUSES.find(([pattern]) => pattern.test(clause));
                if (event) { found.push(event[1]); continue; }
                const action = ACTION_CLAUSE.exec(clause);
                if (action && !gmAction) { gmAction = { actions: [action[1], action[2]], sourceText: clause }; continue; }
                return null;
            }
            events = [...new Set(found)];
            claimed.push(raw(sentence));
            continue;
        }
        const through = !events ? THROUGH_SURFACE.exec(sentence) : null;
        if (through) {
            if (through[1].toLowerCase() !== adapted.defense.statistic) return null;
            events = []; gmAction = { actions: ["shoot"], label: "made a physical ranged attack through the area's surface", sourceText: sentence };
            claimed.push(raw(sentence)); continue;
        }
        const crossing = !events ? CROSSING.exec(sentence) : null;
        if (crossing) {
            if (crossing[1].toLowerCase() !== adapted.defense.statistic) return null;
            events = []; gmAction = { actions: ["enter", "leave"], label: "tried to enter or leave the area", sourceText: sentence };
            claimed.push(raw(sentence)); continue;
        }
        const inside = !memberCondition ? WHILE_INSIDE.exec(sentence) : null;
        if (inside) {
            memberCondition = { slug: inside[1].toLowerCase() }; claimed.push(raw(sentence));
            if (inside[3]) restrictions.push(`Creatures within ${inside[4]} feet of the area are also ${inside[1]}: apply it to them by hand.`);
            continue;
        }
        const noNew = !skipWhile ? NO_NEW_SAVES.exec(sentence) : null;
        if (noNew) {
            // (Affected: each condition the rows give.)
            const slugs = noNew[1] === "affected" ? [...new Set([...String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).slice(1).join(" ").matchAll(/<strong>\s*(?:Failure|Critical Failure)\s*<\/strong>([\s\S]*?)<\/p>/gi)]
                .flatMap(row => [...row[1].matchAll(/@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([A-Z][a-z]+)/g)].map(link => link[1].toLowerCase())))] : null;
            if (slugs && !slugs.length) return null;
            skipWhile = slugs ? { slugs, sourceText: sentence } : { slug: noNew[1].toLowerCase(), sourceText: sentence }; claimed.push(raw(sentence)); continue;
        }
        const takes = DEGREE_TAKES.exec(sentence) ?? DEGREE_TAKE_AS.exec(sentence);
        const trigger = DEGREE_TRIGGER.exec(sentence) ?? (takes ? [takes[0], takes[1], takes[2], takes[3], takes[4]] : null);
        if (trigger && !events) {
            if (trigger[4].toLowerCase() !== adapted.defense.statistic) return null;
            // "When a creature that isn't immune to spirit damage begins its turn within the area, it …": only creatures PF2e doesn't
            // list as immune to that damage type.
            const immune = /^When a creature that isn't immune to ([a-z]+) damage (.+), it$/.exec(trigger[1]);
            if (immune) { notImmune = immune[1]; trigger[1] = `a creature ${immune[2]}`; }
            // Damage in the trigger must be the spell's only damage entry (the degree table scales it).
            if (trigger[2] && !(components.length === 1 && !components[0].category
                && String(components[0].formula).replace(/\s+/g, "") === trigger[2] && String(components[0].type).toLowerCase() === trigger[3].toLowerCase())) return null;
            // (Or the rows deal it: "The creature takes full damage, is pushed …" on one row only.)
            // (Or the damage is a failed attack's, which the record's control deals: Discomfiting Whispers.)
            if (!trigger[2] && components.length && !adapted.failedAttackDamage && !adapted.hazardMove && !/<strong>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>\s*The creature takes (?:full|half|double) damage\b/i.test(String(adapted.descriptionHTML ?? ""))) return null;
            events = lingeringTriggerEvents(trigger[1]);
            if (!events) return null;
            enemiesOnly = /\benem(?:y|ies)\b/i.test(trigger[1]);
            claimed.push(...(origins.get(sentence) ?? [sentence]).map(value => original.get(value) ?? value));
        } else if (OBJECTS_UNAFFECTED.test(sentence) || CORPSES.test(sentence)) claimed.push(original.get(sentence) ?? sentence);
        // "All creatures within the cloud become concealed, and all creatures outside the cloud become concealed to creatures within it."
        else if (!concealment && CONCEALMENT.test(sentence)) { concealment = true; claimed.push(original.get(sentence) ?? sentence); }
        // "You can Dismiss the veil.": the caster ends the whole cast.
        else if (/^You can Dismiss (?:the|this) (?:spell|[a-z]+)\.$/.test(sentence) && sentence !== "You can Dismiss the area.") { dismissible = true; claimed.push(original.get(sentence) ?? sentence); }
        // "When a creature in the spell's area would be healed by a vitality effect, the carrion mire attempts to counteract that effect, …": the
        // GM's (a note, with the spell's counteract).
        else if (HEALING_COUNTERACT.test(sentence)) { restrictions.push(sentence); claimed.push(original.get(sentence) ?? sentence); }
        // Gasping Marsh: "When you Sustain the Spell, the mist dissipates completely from the previous area, and you can select a new area within range
        // to fill with the mist." (the GM moves the region) and "If you don't Sustain the Spell, the mist dissipates and the spell ends." (a
        // sustained spell's end).
        else if (adapted.lifecycle?.sustained === true && /^When you Sustain the Spell, the [a-z]+ dissipates completely from the previous area, and you can select a new area within range to fill with the [a-z]+\.$/.test(sentence)) {
            restrictions.push("When you Sustain the spell, you can move the area anywhere within range: move the region (the old area is gone)."); claimed.push(original.get(sentence) ?? sentence); }
        else if (adapted.lifecycle?.sustained === true && /^If you don't Sustain the Spell, the [a-z]+ dissipates and the spell ends\.$/.test(sentence)) claimed.push(original.get(sentence) ?? sentence);
        else if (!terrain && DEGREE_TERRAIN.test(sentence)) { terrain = { difficulty: 2, movement: ["walk"], hazardous: false }; claimed.push(original.get(sentence) ?? sentence); }
        else if (!terrain && FLYING_TERRAIN.test(sentence)) {
            terrain = { difficulty: 2, movement: ["fly"], hazardous: false }; claimed.push(original.get(sentence) ?? sentence);
            const restriction = FLYING_TERRAIN.exec(sentence)[1];
            if (restriction) restrictions.push(`Creatures in the area ${restriction}.`);
        }
    }
    if (!events) return null;
    // (Only the GM's control exposes creatures: the area itself has no automatic exposure.)
    const gmOnly = !events.length && gmAction?.label;
    // "all squares in a 20-foot-radius burst that contain plants": the GM trims the placed area.
    const details = String(area.details ?? "").trim();
    const trim = /\bthat contain ([a-z ]+)$/i.exec(details);
    const notes = [...(trim ? [`Only squares that contain ${trim[1]} are in the area: remove the other squares from the region.`] : []), ...restrictions,
        ...(breathingOnly ? ["Only creatures that breathe are affected: leave out creatures that don't breathe when you review the exposures."] : [])];
    // Entering once per round is still an enter exposure, limited to the first each round.
    const enterOnce = events.includes("enter-once");
    if (enterOnce) events = [...new Set(events.map(event => event === "enter-once" ? "enter" : event))];
    const sustained = adapted.lifecycle?.sustained === true;
    // An aura that grows on an optional Sustain (the compact-table rewrite's `growingAura`) exposes on Sustain without being sustained.
    const growing = adapted.growingAura && adapted.targeting?.area?.type === "emanation" ? adapted.growingAura : null;
    if (events.includes("sustain") && !sustained && !growing) return null;
    const recurring = events.filter(event => !["initial", "sustain"].includes(event));
    // Only a save when the spell is cast is an ordinary area save, not a lingering area — unless the area also becomes
    // difficult terrain for the spell's duration (Swampcall): the area stays as terrain, with no later saves.
    if (!recurring.length && !events.includes("sustain") && !(terrain && events.includes("initial")) && !gmOnly) return null;
    return {
        lingering: {
            events: events.filter(event => event !== "initial"),
            initial: events.includes("initial"),
            oncePerRound: recurring.length === 1 && recurring[0] !== "enter" && !events.includes("sustain"),
            excludeCaster: false,
            enemiesOnly,
            area: { type: area.type, value: Number(area.value) },
            centre: area.type === "emanation" ? "caster" : "placed",
            durationSeconds: seconds,
            sustained,
            concealment,
            ...(memberCondition ? { memberCondition } : {}),
            ...(gmAction ? { gmAction } : {}),
            ...(skipWhile ? { skipWhile } : {}),
            ...(enterOnce ? { enterOncePerRound: true } : {}),
            ...(areaCount > 1 ? { areaCount, separateAreas: true } : {}),
            ...(terrain ? { terrain } : {}),
            ...(untilNextTurn ? { endsAt: "caster-turn-start" } : {}),
            ...(dismissible ? { dismissible: true } : {}),
            ...(notImmune ? { notImmune } : {}),
            // On each Sustain the radius grows, and only enemies not yet affected save.
            ...(growing ? { optionalSustain: true, growth: { feet: growing.feet }, unaffectedOnly: true } : {}),
            ...(notes.length || adapted.lingeringNotes?.length ? { notes: [...notes, ...(adapted.lingeringNotes ?? [])] } : {}),
            // (Zombie Horde: the area grows by the thralls destroyed in it — the GM's control.)
            ...(adapted.thrallGrowth ? { thrallGrowth: { ...adapted.thrallGrowth } } : {}),
            ...(adapted.failedAttackDamage ? { failedAttackDamage: { ...adapted.failedAttackDamage, heightening: adapted.heightening?.damage?.[adapted.failedAttackDamage.componentId]
                ? { interval: Number(adapted.heightening.interval), dice: adapted.heightening.damage[adapted.failedAttackDamage.componentId] } : null } } : {}),
            // Hazardous terrain dealing damage per square moved into (the record's control), and a radius growing on each Sustain.
            ...(adapted.hazardMove && sustained ? { hazardMove: adapted.hazardMove, sustainGrowth: adapted.sustainGrowth } : {}),
            // (Or the radius growing on each round's first Sustain, with no hazard: Consuming Darkness.)
            ...(!adapted.hazardMove && adapted.sustainGrowth?.optional === false && sustained ? { sustainGrowth: { ...adapted.sustainGrowth } } : {}),
            sourceText: [...(areaParagraph ? [htmlToPlainText(areaParagraph[0]).trim()] : []), ...claimed, ...(growing ? [growing.sourceText] : [])]
        },
        claimedSentences: claimed
    };
}
