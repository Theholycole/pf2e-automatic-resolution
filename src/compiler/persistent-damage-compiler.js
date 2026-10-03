import { analyzeDescription, extractInlineExpressions, htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";
import { assessSimpleBasicSaveDescription } from "./semantic-gate.js";

function plain(text) {
    return htmlToPlainText(text).replace(/\s+/g, " ").trim();
}

// This family claims only a short description of how the damage is delivered.
// Any other introductory clause remains for manual resolution.
function isDeliveryNarrative(sentence) {
    return /^You (?:fling|hurl|throw|exhale|breathe|release|emit) (?:a|an) (?:(?:large|small|shimmering|dense|bright|dark|pale|thick|thin|corrosive|toxic|burning|freezing) )*(?:glob|cloud|burst|wave|spray|mist|breath|ray|bolt) of (?:acid|poison|toxic breath|flame|fire|water|cold|dust|sand|energy)(?: that (?:immediately )?(?:detonates|erupts|bursts), (?:spraying|engulfing) nearby creatures| at (?:an?|the) (?:enemy|creature|target)'s (?:face|body|feet))?\.$/i.test(sentence);
}

// A plain "You …" narration with nothing mechanical in it ("You inflict pain upon the target and revel in their anguish.").
const NARRATION_BLOCKERS = /\d|@|\b(?:damage|saves?|saving|bonus|penalty|conditions?|immune|can't|cannot|must|until|takes?|deals?|rounds?|minutes?|turns?|actions?|heal(?:s|ing)?|Hit Points|curse[sd]?|suffers?|afflict\w*|becomes?|gains?|loses?|traits?|spells?|effects?|create[sd]?|summons?|conjures?|all(?:y|ies))\b/i;
// The plain narration only before "This deals …", which says the narrated act is the damage.
function isNarration(sentence, next) {
    return isDeliveryNarrative(sentence) || (/^This deals\b/.test(next ?? "") && /^You [a-z' ,]{10,160}\.$/i.test(sentence) && !NARRATION_BLOCKERS.test(sentence));
}

function heighteningText(adapted) {
    const source = adapted.descriptionHTML;
    return plain(source.slice(stripHeighteningHTML(source).length));
}

function onePersistentFormula(text) {
    const expressions = extractInlineExpressions(text, "@Damage[");
    if (expressions.length !== 1) return null;
    const expression = expressions[0];
    if (!/^.+\[persistent,[a-z][a-z-]*\]$/i.test(expression.body)) return null;
    return { formula: expression.body, markedText: text.replace(expression.raw, "<DAMAGE>") };
}

function positiveDiceFormula(formula) {
    const match = /^(\d+)d(\d+)$/.exec(formula ?? "");
    return match && Number(match[1]) > 0 && Number(match[2]) > 1 ? match : null;
}

function oneInitialComponent(adapted) {
    const [component] = adapted.damageComponents;
    return adapted.damageComponents.length === 1
        && component?.category == null
        && component.kinds.length === 1 && component.kinds[0] === "damage"
        && component.applyModifier === false
        && positiveDiceFormula(component.formula)
        ? component : null;
}

/** A basic save followed by one critical-failure-only rank-scaled persistent amount. */
export function compileBasicPersistentDamageRider(adapted) {
    if (!adapted.defense.basic) return null;
    const component = oneInitialComponent(adapted);
    if (!component) return null;
    const text = plain(stripHeighteningHTML(adapted.descriptionHTML));
    const parts = text.split(/;\s*/);
    if (parts.length !== 2) return null;
    const rider = onePersistentFormula(parts[1]);
    if (!rider || !/^on a critical failure, (?:the target|the creature) also takes <DAMAGE> damage\.$/i.test(rider.markedText)) return null;

    const baseText = `${parts[0].replace(/\.$/, "")}.`;
    const sentences = baseText.split(/(?<=[.!?])\s+(?=[A-Z@])/);
    if (sentences.length !== 2 || !isDeliveryNarrative(sentences[0])) return null;
    const baseDamage = /^(?:creatures? in the area take|(?:the target|the creature) takes) (\d+d\d+) ([a-z][a-z-]*) damage with a basic (fortitude|reflex|will) save\.$/i.exec(sentences[1]);
    if (!baseDamage || baseDamage[1] !== component.formula
        || baseDamage[2].toLowerCase() !== component.type
        || baseDamage[3].toLowerCase() !== adapted.defense.statistic) return null;
    const base = { ...adapted, descriptionHTML: baseText };
    if (!assessSimpleBasicSaveDescription(base, analyzeDescription(baseText)).complete) return null;

    const formula = /^\((\d+)\+floor\(\(@item\.(?:rank|level)\s*-\s*(\d+)\)\/(\d+)\)\)\[persistent,([a-z][a-z-]*)\]$/i.exec(rider.formula);
    if (!formula || Number(formula[1]) < 1 || !Number.isInteger(adapted.rank) || adapted.rank < 1
        || !Number.isInteger(adapted.heightening?.interval) || adapted.heightening.interval < 1
        || Number(formula[2]) !== adapted.rank || Number(formula[3]) !== adapted.heightening.interval
        || formula[4].toLowerCase() !== component.type) return null;
    const initialIncrease = adapted.heightening?.damage?.[component.id];
    if (!positiveDiceFormula(initialIncrease)
        || positiveDiceFormula(initialIncrease)[2] !== positiveDiceFormula(component.formula)[2]) return null;
    const expectedHeightening = `Heightened (+${formula[3]}) The initial damage increases by ${initialIncrease}, and the persistent damage on a critical failure increases by 1.`;
    if (heighteningText(adapted) !== expectedHeightening) return null;

    return { formula: rider.formula, sourceText: parts[1] };
}

/** Four explicit save degrees with independent initial and persistent damage. */
export function compileDegreePersistentDamage(adapted, description) {
    if (adapted.defense.basic || description.sectionCount !== 4 || description.explicitSectionCount !== 4) return null;
    const component = oneInitialComponent(adapted);
    if (!component) return null;
    const source = stripHeighteningHTML(adapted.descriptionHTML);
    const boundaries = [...source.matchAll(/<hr\b[^>]*>/gi)];
    const headings = [...source.matchAll(/<strong\b[^>]*>\s*(?:Critical\s+Success|Critical\s+Failure|Success|Failure)\s*<\/strong>/gi)];
    if (boundaries.length !== 2 || headings.length !== 4
        || headings[0].index < boundaries[0].index || headings[3].index > boundaries[1].index
        || plain(source.slice(boundaries[0].index + boundaries[0][0].length, headings[0].index))
        || plain(source.slice(boundaries[1].index + boundaries[1][0].length))) return null;
    const introduction = plain(source.split(/<hr\b/i, 1)[0]);
    const sentences = introduction.split(/(?<=[.!?])\s+(?=[A-Z@])/);
    // One more introduction sentence is left to the preamble gate, which must see it claimed (a caster mark's bonus).
    if (![2, 3].includes(sentences.length) || !isNarration(sentences[0], sentences[1])) return null;
    const introductionDamage = onePersistentFormula(sentences[1]);
    if (!introductionDamage) return null;
    // "The target takes 1d4 poison damage and <persistent>, depending on its Fortitude save." or "This deals 1d4 mental damage and
    // <persistent> damage; the target must attempt a Will save."
    const damageSentence = /^(?:the target|the creature) takes (\d+d\d+) ([a-z][a-z-]*) damage and <DAMAGE>, depending on its (fortitude|reflex|will) save\.$/i.exec(introductionDamage.markedText)
        ?? /^This deals (\d+d\d+) ([a-z][a-z-]*) damage and <DAMAGE> damage; (?:the target|the creature) must attempt an? (fortitude|reflex|will) save\.$/i.exec(introductionDamage.markedText);
    if (!damageSentence || damageSentence[1] !== component.formula
        || damageSentence[2].toLowerCase() !== component.type
        || damageSentence[3].toLowerCase() !== adapted.defense.statistic) return null;

    // "(ceil(@item.level/2))d4" (one die per interval) or "(@item.level)d4" (one die per rank, heightened by 1 rank).
    const perRank = /^\(@item\.(?:rank|level)\)d(\d+)\[persistent,([a-z][a-z-]*)\]$/i.exec(introductionDamage.formula);
    const formula = perRank ? [perRank[0], "1", perRank[1], perRank[2]]
        : /^\(ceil\(@item\.(?:rank|level)\/(\d+)\)\)d(\d+)\[persistent,([a-z][a-z-]*)\]$/i.exec(introductionDamage.formula);
    if (!formula || Number(formula[2]) < 2
        || !Number.isInteger(adapted.heightening?.interval) || adapted.heightening.interval < 1
        || Number(formula[1]) !== adapted.heightening.interval
        || formula[3].toLowerCase() !== component.type) return null;
    const baseDice = /^(\d+)d(\d+)$/.exec(component.formula);
    if (Number(baseDice[1]) !== 1 || baseDice[2] !== formula[2]) return null;
    const initialIncrease = adapted.heightening?.damage?.[component.id];
    const expectedHeightening = [`Heightened (+${formula[1]}) The initial ${component.type} damage increases by ${initialIncrease}, and the persistent ${component.type} damage increases by 1d${formula[2]}.`,
        `Heightened (+${formula[1]}) The initial damage increases by ${initialIncrease} and the persistent damage increases by 1d${formula[2]}.`];
    if (!expectedHeightening.includes(heighteningText(adapted)) || initialIncrease !== `1d${formula[2]}`) return null;

    // A bare Spell Effect link after a row is the linked Effect's (proved or blocked on its own), not the row's damage.
    const sections = Object.fromEntries(Object.entries(description.sections).map(([degree, section]) => [degree,
        plain(section.text).replace(/\s*@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}$/, "")]));
    if (!/^(?:the target|the creature) is unaffected\.$/i.test(sections.criticalSuccess)
        || !/^(?:the target|the creature) takes half (?:initial )?damage and no persistent damage\.$/i.test(sections.success)
        || !/^(?:the target|the creature) takes full initial and persistent damage\.$/i.test(sections.failure)
        || !/^(?:the target|the creature) takes double initial and persistent damage\.$/i.test(sections.criticalFailure)) return null;

    const persistent = { formula: introductionDamage.formula, source: "description-inline" };
    const baseExpression = introductionDamage.formula.replace(/\[persistent,[a-z][a-z-]*\]$/i, "");
    // PF2e needs the damage annotation on the entire product. Annotating only
    // its right operand parses as untyped immediate damage in the native runtime.
    const doubled = { formula: `(2*(${baseExpression}))[persistent,${component.type}]`, source: "description-inline" };
    const shared = multiplier => ({ multiplier, sourceComponentIds: [component.id] });
    return {
        criticalSuccess: { mode: "none", multiplier: 0, sourceComponentIds: [] },
        success: { mode: "shared", ...shared(0.5) },
        failure: { mode: "mixed", shared: shared(1), formulas: [persistent], rollScope: "outcome" },
        criticalFailure: { mode: "mixed", shared: shared(2), formulas: [doubled], rollScope: "outcome" }
    };
}

/**
 * Four degree rows whose persistent damage ends with the condition the failure rows grant (Phantom Pain):
 *   "Illusory pain wracks the target, dealing 2d4 mental damage and @Damage[(@item.level)d4[persistent,mental]] damage." /
 *   "The target must attempt a Will save." / Success "The target takes full initial damage but no persistent damage, and the
 *   spell ends immediately." / Failure "The target takes full initial and persistent damage, and the target is Sickened 1. If
 *   the target recovers from being Sickened, the persistent damage ends and the spell ends." / Critical Failure "As failure,
 *   but the target is Sickened 2." / "Heightened (+1) The damage increases by 2d4 and the persistent damage by 1d4."
 * The critical failure repeats the failure's damage. Returns {damage by degree, link} or null; the conditions are the rows' own.
 */
export function compileConditionEndedPersistentDamage(adapted, description) {
    if (adapted.defense.basic || description.sectionCount !== 4 || description.explicitSectionCount !== 4) return null;
    const component = oneInitialComponent(adapted);
    if (!component) return null;
    const source = stripHeighteningHTML(adapted.descriptionHTML);
    const sentences = plain(source.split(/<hr\b/i, 1)[0]).split(/(?<=[.!?])\s+(?=[A-Z@])/);
    if (sentences.length !== 2) return null;
    const introductionDamage = onePersistentFormula(sentences[0]);
    const damageSentence = introductionDamage && /^([A-Z][a-z' ]{3,60}), dealing (\d+d\d+) ([a-z][a-z-]*) damage and <DAMAGE> damage\.$/.exec(introductionDamage.markedText);
    const save = /^(?:The target|The creature) must attempt an? (Fortitude|Reflex|Will) save\.$/.exec(sentences[1]);
    if (!damageSentence || NARRATION_BLOCKERS.test(damageSentence[1]) || !save || damageSentence[2] !== component.formula
        || damageSentence[3].toLowerCase() !== component.type || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const perRank = /^\(@item\.(?:rank|level)\)d(\d+)\[persistent,([a-z][a-z-]*)\]$/i.exec(introductionDamage.formula);
    if (!perRank || perRank[2].toLowerCase() !== component.type || adapted.heightening?.interval !== 1) return null;
    const initialIncrease = positiveDiceFormula(adapted.heightening?.damage?.[component.id]);
    if (!initialIncrease || initialIncrease[2] !== positiveDiceFormula(component.formula)[2]
        || heighteningText(adapted) !== `Heightened (+1) The damage increases by ${initialIncrease[0]} and the persistent damage by 1d${perRank[1]}.`) return null;
    const CONDITION = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([A-Z][a-z-]+) \d+\}`;
    const sections = Object.fromEntries(Object.entries(description.sections).map(([degree, section]) => [degree, plain(section.text)]));
    const failure = new RegExp(String.raw`^(?:the target|the creature) takes full initial and persistent damage, and (?:the target|it) is ${CONDITION}\. (If (?:the target|it) recovers from being ([A-Z][a-z-]+), the persistent damage ends and the spell ends\.)$`, "i").exec(sections.failure);
    const critical = new RegExp(String.raw`^As failure, but (?:the target|it) is ${CONDITION}\.$`, "i").exec(sections.criticalFailure);
    if (!/^(?:the target|the creature) is unaffected\.$/i.test(sections.criticalSuccess)
        || !/^(?:the target|the creature) takes full initial damage but no persistent damage(?:, and the spell ends immediately)?\.$/i.test(sections.success)
        || !failure || !critical || failure[1].toLowerCase() !== failure[3].toLowerCase() || critical[1].toLowerCase() !== failure[1].toLowerCase()) return null;
    const persistent = { formula: introductionDamage.formula, source: "description-inline" };
    const shared = multiplier => ({ multiplier, sourceComponentIds: [component.id] });
    const mixed = () => ({ mode: "mixed", shared: shared(1), formulas: [{ ...persistent }], rollScope: "outcome" });
    return {
        damage: {
            criticalSuccess: { mode: "none", multiplier: 0, sourceComponentIds: [] },
            success: { mode: "shared", ...shared(1) },
            failure: mixed(),
            criticalFailure: mixed()
        },
        link: { condition: failure[1].toLowerCase(), damageType: component.type, sourceText: failure[2], degrees: ["failure", "criticalFailure"] }
    };
}

// Rows that read the initial damage and the introduction's inline persistent damage separately, in the usual wordings:
//   "The target takes 2d8 acid damage plus @Damage[floor(@item.level/2)d6[persistent,acid]] damage depending on its Reflex save." /
//   "The fire deals 4d8 fire damage and @Damage[2d6[persistent,fire]] damage to the creature, which must attempt a Fortitude save."
//   Success "… takes half damage and (takes) no persistent damage", failure "… full damage(,) and / as well as (full) persistent damage"
//   (or "full initial and persistent damage"), critical failure "… double damage(,) and / as well as full / double (the) persistent
//   damage" (or "double initial and persistent damage"). Each row may end ", and the <thing> moves it up to N feet in a direction of
//   your choice" (the caster's move, which the GM carries out). The introduction's other sentences must be narration or
//   "A creature taking persistent damage from this spell takes a –N-foot status penalty to its Speeds." with the Spell Effect linked
//   after it (applied on the rows that deal the persistent damage, and removed with it).
const MOVE_TAIL = /, and the [a-z]+ moves it up to (\d+) feet in a direction of your choice\.$/i;
const ROW_DAMAGE = {
    success: [/^The (?:creature|target) takes half (?:initial )?damage and (?:takes )?no persistent damage$/i, 0.5, 0],
    failure: [/^The (?:creature|target) takes full (?:initial and persistent damage|(?:initial )?damage(?:,)? (?:and|as well as) (?:full )?persistent damage)$/i, 1, 1],
    criticalFailure: [/^The (?:creature|target) takes double (?:(initial and) persistent damage|(?:initial )?damage(?:,)? (?:and|as well as) (full|double(?: the)?) persistent damage)$/i, 2, null]
};
const PERSISTENT_SPEED = /^A creature taking persistent damage from this spell takes a [–-](\d+)-foot status penalty to its Speeds\.$/;
// Worm's Repast's rows: "… takes full initial damage but no persistent damage, and the spell ends immediately", "… takes full initial and
// persistent damage and is Off-Guard due to the pain for as long as it takes persistent damage", "As failure, but the target takes double
// the initial damage and is also Slowed 1 by the pain for as long as it takes persistent damage" (the conditions end with the persistent
// damage), and a critical success "The worms writhe away harmlessly and the target takes no damage."
const CONDITION_LINK = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][A-Za-z-]+(?: \d+)?\}`;
const WHILE_PERSISTENT_TAIL = new RegExp(String.raw` and is (?:also )?(${CONDITION_LINK})(?: (?:due to|by) the [a-z]+)? for as long as it takes persistent damage$`);
const ROW_DAMAGE_ENDING = {
    success: [/^The (?:creature|target) takes full initial damage but no persistent damage, and the spell ends immediately$/i, 1, 0],
    failure: [/^The (?:creature|target) takes full initial and persistent damage$/i, 1, 1],
    criticalFailure: [/^As failure, but the (?:creature|target) takes double the initial damage$/i, 2, 1]
};
// "If the target is a non-skeletal corporeal undead creature, you deal an extra @Damage[…[persistent,piercing]] damage.": the extra
// persistent damage for a creature of that trait (not one with the excluded trait; "corporeal" only when the spell's target already is).
const TRAIT_EXTRA = /^If the target is an? ((?:[a-z-]+ ){0,2})([a-z]+) creature, you deal an extra @Damage\[([^\[\]]+\[persistent,([a-z-]+)\])\] damage\.$/;

export function compileInlinePersistentRows(adapted, description) {
    if (adapted.defense?.kind !== "save" || description.explicitSectionCount !== 4) return null;
    const component = oneInitialComponent(adapted);
    if (!component) return null;
    const source = stripHeighteningHTML(adapted.descriptionHTML);
    let introduction = plain(source.split(/<hr\b/i, 1)[0]);
    // The trait's extra persistent damage, taken out before the introduction is read.
    let traitExtra = null;
    for (const sentence of introduction.split(/(?<=[.!?])\s+(?=[A-Z@])/)) {
        const extra = TRAIT_EXTRA.exec(sentence);
        if (!extra) continue;
        if (traitExtra) return null;
        const qualifiers = extra[1].trim().split(/\s+/).filter(Boolean);
        const target = String(adapted.targeting?.target ?? "").toLowerCase();
        if (qualifiers.some(word => !(word === "non-skeletal" || (word === "corporeal" && /\bcorporeal\b/.test(target))))) return null;
        traitExtra = { trait: extra[2], excludedTraits: qualifiers.includes("non-skeletal") ? ["skeleton"] : [], formula: extra[3], type: extra[4].toLowerCase(), sourceText: sentence };
        introduction = introduction.replace(sentence, "").replace(/\s+/g, " ").trim();
    }
    const persistent = onePersistentFormula(introduction);
    const typed = persistent && /^(.+)\[persistent,([a-z][a-z-]*)\]$/i.exec(persistent.formula);
    if (!typed || typed[2].toLowerCase() !== component.type) return null;
    const type = component.type;
    // The introduction, sentence by sentence (the Spell Effect link is the persistent sentence's, when there is one).
    const linkPattern = /\s*@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/g;
    const links = [...introduction.matchAll(linkPattern)];
    const sentences = persistent.markedText.replace(linkPattern, "").trim().split(/(?<=[.!?])\s+(?=[A-Z@<])/);
    let damageSentence = null, speed = null, saveAfter = false;
    const claimed = [];
    for (const sentence of sentences) {
        // "Gnawing worms materialize within the flesh of the target creature, dealing 4d6 piercing damage and <DAMAGE> damage." then
        // "The target must attempt a Fortitude save."
        const dealing = !damageSentence && /^([A-Z][a-z' -]{3,80}), dealing (\d+d\d+) ([a-z-]+) damage and <DAMAGE> damage\.$/.exec(sentence);
        if (dealing && !NARRATION_BLOCKERS.test(dealing[1])) {
            if (dealing[2] !== component.formula || dealing[3].toLowerCase() !== type) return null;
            damageSentence = sentence.replace("<DAMAGE>", `@Damage[${persistent.formula}]`);
            claimed.push(damageSentence); saveAfter = true;
            continue;
        }
        const save = saveAfter && /^The (?:target|creature) must attempt an? (Fortitude|Reflex|Will) save\.$/.exec(sentence);
        if (save) {
            if (save[1].toLowerCase() !== adapted.defense.statistic) return null;
            claimed.push(sentence); saveAfter = false;
            continue;
        }
        const damage = /^The (?:target|creature) takes (\d+d\d+) ([a-z-]+) damage plus <DAMAGE> damage depending on its (fortitude|reflex|will) save\.$/i.exec(sentence)
            ?? /^The [a-z]+ deals (\d+d\d+) ([a-z-]+) damage and <DAMAGE> damage to the (?:creature|target), which must attempt an? (fortitude|reflex|will) save\.$/i.exec(sentence);
        if (damage && !damageSentence) {
            if (damage[1] !== component.formula || damage[2].toLowerCase() !== type || damage[3].toLowerCase() !== adapted.defense.statistic) return null;
            damageSentence = sentence.replace("<DAMAGE>", `@Damage[${persistent.formula}]`);
            claimed.push(damageSentence);
            continue;
        }
        const penalty = PERSISTENT_SPEED.exec(sentence);
        if (penalty && !speed) { speed = { value: Number(penalty[1]), sourceText: sentence }; claimed.push(sentence); continue; }
        if (/^[A-Z][A-Za-z' ,-]{10,160}\.$/.test(sentence) && !NARRATION_BLOCKERS.test(sentence)) { claimed.push(sentence); continue; }
        return null;
    }
    // One Spell Effect link, only with the speed sentence.
    if (!damageSentence || saveAfter || links.length !== (speed ? 1 : 0)) return null;
    if (speed) speed.link = links[0][0].trim();

    // The persistent amount at the cast rank: a formula that scales itself, or a fixed one the heightened entry raises.
    const heightened = heighteningText(adapted);
    const initialIncrease = adapted.heightening?.damage?.[component.id] ?? null;
    let base = typed[1];
    if (heightened) {
        const step = /^Heightened \(\+(\d+)\) (?:The initial damage increases by (\d+d\d+),? and the persistent (?:[a-z]+ )?damage increases by (\d+d\d+)|Increase the initial damage by (\d+d\d+) and the persistent damage by (\d+d\d+)(?:\[[a-z]+\])?|The initial and persistent damage increase by (\d+d\d+) and (\d+d\d+), respectively)\.?$/i
            .exec(heightened.replace(/@Damage\[(\d+d\d+)\[[a-z]+\]\]/i, "$1"));
        if (!step || !Number.isInteger(adapted.heightening?.interval) || Number(step[1]) !== adapted.heightening.interval || (step[2] ?? step[4] ?? step[6]) !== initialIncrease) return null;
        const interval = Number(step[1]), [perStep, faces] = (step[3] ?? step[5] ?? step[7]).split("d").map(Number);
        // The trait's extra dice rise with the persistent damage: "floor((@item.level/2)+1)d6".
        if (traitExtra) {
            const extra = /^floor\(\(@item\.(?:level|rank)\/(\d+)\)\+(\d+)\)d(\d+)$/.exec(traitExtra.formula.replace(/\[persistent,[a-z-]+\]$/, ""));
            if (!extra || Number(extra[1]) !== interval || Number(extra[3]) !== faces || perStep !== 1 || traitExtra.type !== type) return null;
            traitExtra.base = `(floor(@item.level/${interval})+${extra[2]})d${faces}`;
        }
        const scaling = /^(floor|ceil)\(@item\.(?:level|rank)\/(\d+)\)d(\d+)$/.exec(base) ?? /^\((floor|ceil)\(@item\.(?:level|rank)\/(\d+)\)\)d(\d+)$/.exec(base);
        const fixed = /^(\d+)d(\d+)$/.exec(base);
        if (scaling) {
            // One die per interval: floor(rank/2)d6 with "+2 … increases by 1d6".
            if (Number(scaling[2]) !== interval || Number(scaling[3]) !== faces || perStep !== 1) return null;
            base = `(${scaling[1]}(@item.level/${interval}))d${faces}`;
        } else if (fixed && Number(fixed[2]) === faces && Number.isInteger(adapted.rank)) {
            base = interval === 1 && perStep === 1 ? `(@item.level - ${adapted.rank - Number(fixed[1])})d${faces}` : `(${fixed[1]}+${perStep}*floor((@item.level - ${adapted.rank})/${interval}))d${faces}`;
        } else return null;
    } else if (/@item\./.test(base) || traitExtra) return null;

    const ids = [component.id];
    const byDegree = { criticalSuccess: { mode: "none", multiplier: 0, sourceComponentIds: [] } };
    const moves = {};
    const texts = Object.fromEntries(DEGREE_KEYS.map(degree => [degree, plain(description.sections[degree]?.text ?? "")]));
    if (!/^The (?:creature|target) is unaffected\.$/i.test(texts.criticalSuccess)
        && !(/^[A-Z][a-z' ]{3,60} and the (?:creature|target) takes no damage\.$/.test(texts.criticalSuccess) && !NARRATION_BLOCKERS.test(texts.criticalSuccess.split(" and the ")[0]))) return null;
    const moving = MOVE_TAIL.test(texts.success);
    // The rows ending their conditions with the persistent damage (all three, or none).
    const ending = ROW_DAMAGE_ENDING.success[0].test(texts.success.replace(/\.$/, ""));
    const whilePersistent = {};
    for (const [degree, [pattern, initial, fixedPersistent]] of Object.entries(ending ? ROW_DAMAGE_ENDING : ROW_DAMAGE)) {
        const tail = MOVE_TAIL.exec(texts[degree]);
        if (!!tail !== moving) return null;
        let body = tail ? texts[degree].slice(0, tail.index) : texts[degree].replace(/\.$/, "");
        if (ending && degree !== "success") {
            const condition = WHILE_PERSISTENT_TAIL.exec(body);
            if (!condition) return null;
            whilePersistent[degree] = condition[1];
            body = body.slice(0, condition.index);
        }
        const match = pattern.exec(body);
        if (!match) return null;
        const persistentMultiplier = fixedPersistent ?? (match[1] || /^double/i.test(match[2] ?? "") ? 2 : 1);
        if (tail) moves[degree] = Number(tail[1]);
        const formula = persistentMultiplier === 2 ? `(2*(${base}))[persistent,${type}]` : `${base}[persistent,${type}]`;
        byDegree[degree] = persistentMultiplier === 0 ? { mode: "shared", multiplier: initial, sourceComponentIds: [...ids] }
            : { mode: "mixed", shared: { multiplier: initial, sourceComponentIds: [...ids] }, formulas: [{ formula, source: "description-inline" }], rollScope: "outcome" };
    }
    if (moving && !(moves.success < moves.failure && moves.failure <= moves.criticalFailure)) return null;
    // The trait's rows: the same, with the extra dice added to the persistent damage (never doubled here: those rows deal it once).
    let traitRows = null;
    if (traitExtra) {
        if (!ending) return null;
        traitRows = Object.fromEntries(Object.entries(byDegree).map(([degree, damage]) => [degree, damage.mode !== "mixed" ? structuredClone(damage)
            : { ...structuredClone(damage), formulas: [{ formula: `(${base} + ${traitExtra.base})[persistent,${type}]`, source: "description-inline" }] }]));
        claimed.push(traitExtra.sourceText);
    }
    return { byDegree, moves, speed, persistentType: type, claimed, sourceTexts: texts, whilePersistent, traitExtra, traitRows };
}
const DEGREE_KEYS = ["criticalSuccess", "success", "failure", "criticalFailure"];
