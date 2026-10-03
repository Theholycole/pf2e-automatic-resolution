// Affliction handoff: a save outcome that afflicts a creature "at stage N"
// is compiled as an explicit handoff. The module records the affliction and
// its starting stage; stage effects and progression stay delegated to the GM
// (the accepted affliction exception). Every accepted sentence must match
// exactly, and the named affliction must be the description's single stage
// block.
import { htmlToPlainText } from "./description-parser.js";

const DEGREE_HEADING = /<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/gi;
const BLOCK_LABELS = /^(?:Level(?: \d+)?|Saving Throw|Maximum Duration|Onset|Stage \d+|Critical Success|Success|Failure|Critical Failure|Heightened.*)$/i;
const normalize = value => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();

/** The single affliction stage block after the degree table, or null. */
export function parseAfflictionBlock(html) {
    const source = String(html ?? "");
    const headings = [...source.matchAll(DEGREE_HEADING)];
    // Without a degree table (a basic save), the block follows the first rule.
    const hr = /<hr\b[^>]*>/i.exec(source);
    if (!headings.length && !hr) return null;
    const STAGES = /<strong\b[^>]*>\s*Stage\s+(\d+)\s*<\/strong>([\s\S]*?)(?=<strong\b[^>]*>\s*Stage\s+\d+|<hr\b|<h\d\b|$)/gi;
    let tail = headings.length ? source.slice(headings.at(-1).index + headings.at(-1)[0].length) : source.slice(hr.index);
    let stageMatches = [...tail.matchAll(STAGES)];
    // A block placed between rules before the degree table.
    if (!stageMatches.length && headings.length && hr && hr.index < headings[0].index) {
        tail = source.slice(hr.index, headings[0].index);
        stageMatches = [...tail.matchAll(STAGES)];
    }
    if (!stageMatches.length) return null;
    const beforeStages = tail.slice(0, stageMatches[0].index);
    const names = [...beforeStages.matchAll(/<(?:strong|h\d)\b[^>]*>\s*([^<]+?)\s*<\/(?:strong|h\d)>/gi)]
        .map(match => ({ name: match[1].trim(), index: match.index, end: match.index + match[0].length }))
        .filter(entry => !BLOCK_LABELS.test(entry.name));
    if (names.length !== 1) return null;
    const blockStart = names[0].index;
    const stages = stageMatches.map(match => ({ stage: Number(match[1]), text: htmlToPlainText(match[2]).trim() }));
    if (stages.some((stage, index) => stage.stage !== index + 1)) return null;
    // "<strong>Voidcap Spores (disease)</strong>": the traits inside the heading.
    const headed = /^(.+?)\s*\(([a-z, ]+)\)$/i.exec(names[0].name);
    if (headed) names[0].name = headed[1];
    const traits = (headed?.[2] ?? /^\s*\(([^)]+)\)/.exec(htmlToPlainText(beforeStages.slice(names[0].end)))?.[1])
        ?.split(",").map(value => value.trim().toLowerCase()).filter(Boolean) ?? [];
    const body = htmlToPlainText(beforeStages.slice(names[0].end));
    // "Creatures that have the goblin trait and goblin dogs are immune": the
    // trait part is checked per target; any other named creatures are the GM's.
    const immune = /\bCreatures that have the ([a-z]+) trait(?: and ([^.;]+?))? are immune\b/i.exec(body);
    // "This disease ends when the spell ends;": the affliction lasts only as long as the cast (a sustained spell's).
    const endsWithSpell = /^\s*(?:\([^)]*\)\s*)?This (?:disease|curse|poison) ends when the spell ends[.;]?\s*$/i.test(body);
    const lastStage = stageMatches.at(-1);
    return {
        endsWithSpell,
        immunity: immune ? { traits: [immune[1].toLowerCase()], others: immune[2]?.trim() ?? null, sourceText: immune[0] } : null,
        blockHTML: tail.slice(names[0].index, lastStage.index + lastStage[0].length),
        name: names[0].name,
        traits,
        level: Number(/\bLevel\s+(\d+)/i.exec(body)?.[1]) || null,
        maximumDuration: /\bMaximum Duration\s+([^.]+?)\s*(?:\.|$)/i.exec(body)?.[1]?.trim() ?? null,
        stages,
        sourceHTML: tail.slice(blockStart)
    };
}

const SUBJECT = "The (?:target|creature)";
// (Curse of Death's critical failure has no closing period.)
const AFFLICTED = new RegExp(`^${SUBJECT} is afflicted with (?:(.+?) at stage (\\d+)|stage (\\d+) (.+?))\\.?$`, "i");
// "The target is afflicted with the curse of death at stage 1, and the stage of the curse can't increase beyond stage 1."
const AFFLICTED_CAPPED = new RegExp(`^${SUBJECT} is afflicted with (.+?) at stage (\\d+), and the stage of the (disease|curse|poison) can't increase beyond stage (\\d+)\\.$`, "i");
const DAMAGE_THEN_AFFLICTED = new RegExp(`^${SUBJECT} takes (full|double the) ([a-z]+) damage and becomes afflicted with (.+?) at stage (\\d+)\\.$`, "i");
const TYPED_SHARED = new RegExp(`^${SUBJECT} takes (\\d+d\\d+) ([a-z]+) damage\\.$`, "i");

const IMMUNE = new RegExp(`^${SUBJECT} is unaffected and is immune to (.+?) for (\\d+|one|a) (rounds?|minutes?|hours?|days?|weeks?)\\.$`, "i");
const PER_RANK_AND_PENALTY = new RegExp(`^${SUBJECT} takes (\\d+) ([a-z]+) damage per spell rank, and takes a [-–](\\d+) status penalty to saves against (.+?) for (\\d+|one|a) (rounds?|minutes?|hours?|days?|weeks?) or until the (?:target|creature) contracts it, whichever comes first\\.$`, "i");
const DURATION_UNITS = { round: "rounds", minute: "minutes", hour: "hours", day: "days", week: "days" };
function durationOf(amount, unit) {
    const value = /^(?:one|a)$/i.test(amount) ? 1 : Number(amount);
    const base = String(unit).toLowerCase().replace(/s$/, "");
    if (!Number.isInteger(value) || value < 1 || !DURATION_UNITS[base]) return null;
    return { value: base === "week" ? value * 7 : value, unit: DURATION_UNITS[base] };
}

function clauseSplit(text) {
    return String(text ?? "").replace(/\s+/g, " ").split(/(?<=[.!?;])\s+/).map(value => value.trim()).filter(Boolean);
}

function stageRef(block, name, stage, traits = []) {
    // "breath of the mantis god poison": a trailing affliction type is part
    // of the reference only when the spell carries that trait.
    // "the bone moth's kiss": a leading article is not part of the name.
    name = String(name ?? "").replace(/^the\s+/i, "");
    const kind = /\s+(poison|disease|curse)$/i.exec(normalize(name))?.[1];
    const bare = kind && traits.includes(kind) ? normalize(name).slice(0, -kind.length).trim() : normalize(name);
    if (bare !== normalize(block.name) && normalize(name) !== normalize(block.name)) return null;
    const value = Number(stage);
    return Number.isInteger(value) && value >= 1 && value <= block.stages.length ? value : null;
}

const DICE = String.raw`(?:@Damage\[(\d+d\d+)\[([a-z]+)\]\]|(\d+d\d+) ([a-z]+))`;
const dice = (match, offset) => ({ formula: match[offset] ?? match[offset + 2], type: (match[offset + 1] ?? match[offset + 3]).toLowerCase() });

/**
 * The delivery sentence of a touch or area affliction, dealt before and
 * independently of the save, so it applies at every degree:
 * - "You deal 1d4 piercing damage to the touched creature and afflict it with
 *   spider venom. The target must attempt a Fortitude save."
 * - Damage-gated: "... If the target takes piercing damage, they [also take
 *   1d6 spirit damage and] must attempt a Fortitude save." / "Creatures in the
 *   affected area take 1d6 piercing damage. Each creature that takes piercing
 *   damage must attempt a Fortitude save." A creature that takes none of the
 *   delivery damage makes no save and suffers nothing further.
 */
function deliverySentence(html, block, component, statistic) {
    const prefix = String(html ?? "").split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0];
    const sentences = htmlToPlainText(prefix).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const matchesComponent = deal => component && String(component.formula).replace(/\s+/g, "") === deal.formula && normalize(component.type) === deal.type;
    for (let index = 0; index < sentences.length - 1; index++) {
        const touch = new RegExp(`^You deal ${DICE} damage to the (?:touched|targeted) creature and afflict (?:it|the creature) with (.+?)\\.$`, "i").exec(sentences[index]);
        const area = new RegExp(`^Creatures in the (?:affected )?area take ${DICE} damage\\.$`, "i").exec(sentences[index]);
        if (!touch && !area) continue;
        const deal = dice(touch ?? area, 1);
        if (touch && normalize(touch[5]) !== normalize(block.name)) return null;
        if (!matchesComponent(deal)) return null;
        const next = sentences[index + 1];
        const plain = touch && new RegExp(`^The target must attempt an? (Fortitude|Reflex|Will) save\\.$`, "i").exec(next);
        const gated = touch
            ? new RegExp(`^If the target takes ${deal.type} damage, they (?:also take ${DICE} damage and )?must attempt an? (Fortitude|Reflex|Will) save\\.$`, "i").exec(next)
            : new RegExp(`^Each creature that takes ${deal.type} damage must attempt an? (Fortitude|Reflex|Will) save\\.$`, "i").exec(next);
        const save = plain?.[1] ?? gated?.at(-1);
        if (!save || normalize(save) !== normalize(statistic)) return null;
        const extra = gated && touch && (gated[1] || gated[3]) ? dice(gated, 1) : null;
        return { sentence: sentences[index], saveSentence: next, gate: gated ? { damageType: deal.type } : null,
            gatedFormulas: extra ? [{ formula: `${extra.formula}[${extra.type}]`, source: "description-inline" }] : [] };
    }
    return null;
}

/**
 * Compile affliction handoffs onto non-basic save outcomes. Returns null when
 * the spell has no stage block, or {blocked: reason} when a clause names an
 * affliction that cannot be proved.
 */
export function compileAfflictionHandoff(plan, adapted) {
    const block = parseAfflictionBlock(adapted.descriptionHTML);
    if (!block || plan.resolution?.kind !== "save" || plan.resolution.check?.basic !== false) return null;
    // A lasting cast only when the block says the affliction ends with the spell (the affliction Effect then ends with the cast).
    if ((plan.lifecycle?.durationSpec?.mode !== "instantaneous" || plan.lifecycle?.sustained) && !block.endsWithSpell) return { blocked: "lifecycle" };
    const components = adapted.damageComponents ?? [];
    const single = components.length === 1 && components[0].kinds?.length === 1 && components[0].kinds[0] === "damage"
        && !components[0].category ? components[0] : null;
    const outcomes = plan.resolution.outcomes;
    const claims = {};
    let afflicted = 0;
    for (const [degree, outcome] of Object.entries(outcomes)) {
        claims[degree] = [];
        for (const clause of clauseSplit(outcome.rawText)) {
            let match = AFFLICTED.exec(clause);
            if (match) {
                const stage = stageRef(block, match[1] ?? match[4], match[2] ?? match[3], plan.traits ?? []);
                if (!stage) return { blocked: "affliction-name" };
                outcome.affliction = { name: block.name, stage, sourceText: clause };
                afflicted++;
                continue;
            }
            match = AFFLICTED_CAPPED.exec(clause);
            if (match) {
                const stage = stageRef(block, match[1], match[2], plan.traits ?? []), cap = stageRef(block, match[1], match[4], plan.traits ?? []);
                if (!stage || !cap || cap < stage || !(block.traits.includes(match[3].toLowerCase()) || (plan.traits ?? []).includes(match[3].toLowerCase()))) return { blocked: "affliction-cap" };
                outcome.affliction = { name: block.name, stage, maxStage: cap, sourceText: clause };
                afflicted++;
                continue;
            }
            match = DAMAGE_THEN_AFFLICTED.exec(clause);
            if (match) {
                const stage = stageRef(block, match[3], match[4], plan.traits ?? []);
                if (!stage || !single || normalize(single.type) !== normalize(match[2])) return { blocked: "affliction-damage" };
                outcome.damage = { mode: "shared", multiplier: /double/i.test(match[1]) ? 2 : 1, sourceComponentIds: [single.id] };
                outcome.affliction = { name: block.name, stage, sourceText: clause };
                afflicted++;
                continue;
            }
            // "The creature is unaffected and is immune to blister pox for 1 week."
            match = IMMUNE.exec(clause);
            if (match) {
                if (!stageRef(block, match[1], 1, plan.traits ?? [])) return { blocked: "affliction-name" };
                const duration = durationOf(match[2], match[3]);
                if (!duration) return { blocked: "affliction-immunity" };
                outcome.afflictionImmunity = { name: block.name, duration, sourceText: clause };
                continue;
            }
            // "The target takes 2 spirit damage per spell rank, and takes a -2 status
            // penalty to saves against Abyssal plague for 1 day or until the target
            // contracts it, whichever comes first."
            match = PER_RANK_AND_PENALTY.exec(clause);
            if (match) {
                if (!stageRef(block, match[4], 1, plan.traits ?? []) || outcome.damage?.mode === "formulas" && outcome.damage.formulas.length) return { blocked: "affliction-penalty" };
                const duration = durationOf(match[5], match[6]);
                if (!duration) return { blocked: "affliction-penalty" };
                outcome.damage = { mode: "formulas", formulas: [{ formula: `(${Number(match[1])}*@item.rank)[${match[2].toLowerCase()}]`, source: "description-per-rank" }], rollScope: "outcome" };
                outcome.afflictionSavePenalty = { name: block.name, value: -Number(match[3]), type: "status", duration, endsOnContraction: true, sourceText: clause };
                continue;
            }
            match = TYPED_SHARED.exec(clause);
            if (match && outcome.damage?.mode !== "formulas") {
                if (single && String(single.formula).replace(/\s+/g, "") === match[1] && normalize(single.type) === normalize(match[2])) {
                    outcome.damage = { mode: "shared", multiplier: 1, sourceComponentIds: [single.id] };
                    claims[degree].push(clause);
                } else if (!adapted.heightening) {
                    // Plain outcome dice with no structured component.
                    outcome.damage = { mode: "formulas", formulas: [{ formula: `${match[1]}[${match[2].toLowerCase()}]`, source: "description-plain" }], rollScope: "outcome" };
                    claims[degree].push(clause);
                } else return { blocked: "affliction-outcome-damage" };
                continue;
            }
            // A stray copy of the block heading (e.g. an <h2> caught in the
            // last degree section) is a heading, not a rule.
            if (normalize(clause.replace(/\.$/, "")) === normalize(block.name)) outcome.afflictionHeading = clause;
        }
    }
    if (!afflicted) return null;
    // "Regardless of the result, the target is temporarily immune to all curses of death for 1 day.": every degree's immunity.
    const castImmunity = wholeCastImmunity(adapted.descriptionHTML, block);
    if (castImmunity?.blocked) return castImmunity;
    if (castImmunity) for (const outcome of Object.values(outcomes)) {
        if (outcome.afflictionImmunity) return { blocked: "affliction-immunity" };
        outcome.afflictionImmunity = { name: block.name, duration: castImmunity.duration, sourceText: castImmunity.sentence };
    }
    const behaviour = compileAfflictionBehaviourChoice(adapted.descriptionHTML, block);
    const delivery = deliverySentence(adapted.descriptionHTML, block, single, plan.resolution.check.statistic);
    if (delivery) {
        for (const outcome of Object.values(outcomes)) {
            const shared = { multiplier: 1, sourceComponentIds: [single.id] };
            const formulas = [...delivery.gatedFormulas.map(entry => ({ ...entry })), ...(outcome.damage?.mode === "formulas" ? outcome.damage.formulas : [])];
            if (outcome.damage?.mode !== "formulas" && outcome.damage?.mode !== "none" && outcome.damage != null) return { blocked: "affliction-delivery-damage" };
            outcome.damage = formulas.length ? { mode: "mixed", shared, formulas, rollScope: "outcome" } : { mode: "shared", ...shared };
        }
    }
    // "@Damage[(max(4,(@item.rank)-1))d6[void]]": a stage's dice count from the cast rank (Pseudo Afflictions can't read it); the runtime resolves it.
    const rankDamage = {};
    for (const stage of block.stages) {
        const found = [...stage.text.matchAll(/@Damage\[(\((?:[\d\s,+*()-]|max|min|@item\.rank)+\))d(\d+)\[([a-z]+)\]\]/g)];
        if (found.length === 1 && found[0][1].includes("@item.rank")) rankDamage[stage.stage] = { count: found[0][1], faces: Number(found[0][2]), type: found[0][3] };
        else if (/@item\.rank/.test(stage.text)) return { blocked: "affliction-stage-damage" };
    }
    return {
        block: { name: block.name, traits: block.traits, level: block.level, maximumDuration: block.maximumDuration,
            stages: block.stages, ...(block.immunity ? { immunity: block.immunity } : {}), ...(block.endsWithSpell ? { endsWithSpell: true } : {}),
            ...(Object.keys(rankDamage).length ? { rankDamage } : {}) },
        blockHTML: block.blockHTML,
        delivery,
        castChoice: behaviour?.choice ?? null,
        optionsHTML: behaviour?.optionsHTML ?? [],
        castImmunity: castImmunity?.sentence ?? null,
        claimedSentences: [...(delivery ? [delivery.sentence, ...(delivery.gate ? [delivery.saveSentence] : [])] : []), ...(behaviour?.claimedSentences ?? [])]
    };
}

/**
 * Basic save with an affliction rider and no degree table:
 * "Creatures who fail their save are afflicted with stage 1 of blightburn
 * sickness (on a critical failure, the creature moves immediately to stage
 * 2)." An optional sentence setting the affliction's level from the spell's
 * rank and its DC from the caster's DC is part of the handoff (the handler
 * receives the cast DC). The rest of the rules before the block must pass the
 * simple basic-save gate, which the caller checks with `remainder`.
 */
export function compileBasicAfflictionRider(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    if (DEGREE_HEADING.test(html)) { DEGREE_HEADING.lastIndex = 0; return null; }
    DEGREE_HEADING.lastIndex = 0;
    const block = parseAfflictionBlock(html);
    const hr = /<hr\b[^>]*>/i.exec(html);
    if (!block || !hr) return null;
    const sentences = htmlToPlainText(html.slice(0, hr.index)).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const claimed = [];
    let failure = null, criticalFailure = null;
    for (const sentence of sentences) {
        const rider = /^Creatures who fail their save are afflicted with stage (\d+) of (.+?) \(on a critical failure, the creature moves immediately to stage (\d+)\)\.$/i.exec(sentence);
        if (rider) {
            if (failure) return null;
            failure = stageRef(block, rider[2], rider[1]);
            criticalFailure = stageRef(block, rider[2], rider[3]);
            if (!failure || !criticalFailure) return null;
            claimed.push(sentence);
            continue;
        }
        const level = /^The level of (.+?) caused by this spell is equal to twice the spell's rank, and the disease's save DC uses the caster's DC\.$/i.exec(sentence);
        if (level && normalize(level[1]) === normalize(block.name)) claimed.push(sentence);
    }
    if (!failure) return null;
    return {
        block: { name: block.name, traits: block.traits, level: block.level, maximumDuration: block.maximumDuration, stages: block.stages },
        byDegree: { failure: { name: block.name, stage: failure, sourceText: claimed[0] }, criticalFailure: { name: block.name, stage: criticalFailure, sourceText: claimed[0] } },
        claimed,
        remainder: sentences.filter(sentence => !claimed.includes(sentence))
    };
}

/**
 * A cast-time choice that shapes a delegated stage's behaviour ("When you
 * Cast this Spell, choose one of the following behaviors that the fungus
 * compels: ascend, consume, descend, or lure. While the target is controlled
 * by the cordyceps toxin's stage 3 effects, it performs that behavior. …"),
 * followed by one "<strong>Name</strong>: text" paragraph per option. The
 * choice and the rest of that paragraph describe the handler's stage; they are
 * recorded for the GM and written onto the affliction, never dropped.
 */
export function compileAfflictionBehaviourChoice(html, block) {
    const source = String(html ?? "");
    const hr = /<hr\b[^>]*>/i.exec(source);
    if (!block || !hr) return null;
    const prefix = source.slice(0, hr.index);
    const paragraphs = [...prefix.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];
    if (paragraphs.length < 3) return null;
    const sentences = htmlToPlainText(paragraphs[0][1]).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const choiceAt = sentences.findIndex(sentence => /^When you Cast this Spell, choose one of the following behaviors that the [a-z]+ compels: /i.test(sentence));
    if (choiceAt < 0) return null;
    const list = /: (.+)\.$/.exec(sentences[choiceAt])[1].split(/,\s*(?:or\s+)?|\s+or\s+/).map(value => value.trim().toLowerCase()).filter(Boolean);
    const stage = /^While the target is controlled by the (.+?)'s stage (\d+) effects, it performs that behavior\.$/i.exec(sentences[choiceAt + 1] ?? "");
    if (!stage || normalize(stage[1]) !== normalize(block.name) || Number(stage[2]) > block.stages.length) return null;
    const options = paragraphs.slice(1).map(match => /^\s*<strong\b[^>]*>\s*([^<]+?)\s*<\/strong>\s*:\s*([\s\S]+)$/i.exec(match[1]))
        .map(match => match && { name: match[1].trim(), text: htmlToPlainText(match[2]).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").trim() });
    if (options.some(option => !option) || options.length !== list.length
        || options.some((option, index) => option.name.toLowerCase() !== list[index])) return null;
    const notes = sentences.slice(choiceAt + 2);
    return {
        choice: { kind: "affliction-behaviour", label: "Compelled behaviour", affliction: block.name, stage: Number(stage[2]),
            options, notes, sourceText: sentences[choiceAt] },
        claimedSentences: [sentences[choiceAt], sentences[choiceAt + 1], ...notes],
        optionsHTML: paragraphs.slice(1).map(match => match[0])
    };
}

/**
 * Before the table, a lifted immunity to the spell's own affliction: "Undead that aren't incorporeal, such as skeletons and
 * zombies, don't have their normal immunity to this disease, as the spores can still colonize their remaining flesh and
 * bone." and, optionally, "This might also apply to other non-living creatures made of organic material at the GM's
 * discretion." The handoff never checks a creature's own immunity to the affliction's kind, so these are the GM's: a
 * reminder on the card. {sentences, reminder} or null.
 */
function wholeCastImmunity(html, block) {
    const prefix = String(html ?? "").split(/<hr\b[^>]*>|<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0];
    const sentences = htmlToPlainText(prefix).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    for (const sentence of sentences) {
        const match = /^Regardless of the result, the (?:target|creature) is temporarily immune to (?:all )?(.+?) for (\d+|one|a) (rounds?|minutes?|hours?|days?|weeks?)\.$/i.exec(sentence);
        if (!match) continue;
        // "all curses of death": the plural of the block's name.
        const name = normalize(match[1]), plain = name.replace(/^([a-z]+)s\b/, "$1");
        if (name !== normalize(block.name) && plain !== normalize(block.name)) return { blocked: "affliction-immunity" };
        const duration = durationOf(match[2], match[3]);
        return duration ? { sentence, duration } : { blocked: "affliction-immunity" };
    }
    return null;
}

export function compileLiftedAfflictionImmunity(html, block) {
    const prefix = String(html ?? "").split(/<hr\b[^>]*>|<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0];
    const sentences = htmlToPlainText(prefix).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => /^[A-Z][a-z]+ that aren't [a-z]+(?:, such as [a-z ,]+,)? don't have their normal immunity to this (?:disease|curse|poison)\b[^.]*\.$/.test(sentence));
    if (at < 0 || !block?.traits?.some(trait => new RegExp(`immunity to this ${trait}\\b`).test(sentences[at]))) return null;
    const claimed = [sentences[at]];
    if (/^This might also apply to [^.]+ at the GM's discretion\.$/.test(sentences[at + 1] ?? "")) claimed.push(sentences[at + 1]);
    return { sentences: claimed, reminder: { kind: "spell-note", text: `${claimed.join(" ")} The module doesn't check a target's own immunity to ${block.name}; decide who is immune before applying.`, sourceText: claimed[0] } };
}
