import { DURATION_ROW, DEGREE_LABEL as FLAG_LABEL } from "./text-patterns.js";

const DEGREE_LABEL = Object.freeze({
    success: 'success', failure: 'failure', criticalFailure: 'criticalFailure'
});

function onlyKeys(value, keys) {
    return value && typeof value === 'object' && !Array.isArray(value)
        && Object.keys(value).every(key => keys.includes(key));
}

function durationFromClause(value) {
    const text = String(value ?? '').toLowerCase();
    const turn = text.match(/^until the (start|end) of your next turn$/);
    if (turn) return {
        duration: {value: 1, unit: 'rounds', expiry: turn[1] === 'end' ? 'turn-end' : 'turn-start', sustained: false},
        anchor: 'source-turn', offset: 1
    };
    const fixed = text.match(/^for ([1-9]\d*) (round|rounds|minute|minutes|hour|hours)$/);
    if (!fixed) return null;
    const unit = fixed[2].replace(/s$/, '') + 's';
    return {
        duration: {value: Number(fixed[1]), unit, expiry: unit === 'rounds' ? 'turn-start' : null, sustained: false},
        anchor: 'effect-start', offset: 0
    };
}

function degreeChoice(rule, degree) {
    const suffix = `.${DEGREE_LABEL[degree]}`.toLowerCase();
    const choices = (rule.choices ?? []).filter(choice =>
        typeof choice.label === 'string'
        && choice.label.toLowerCase().endsWith(suffix)
        && Number.isInteger(choice.value) && choice.value < 0);
    return choices.length === 1 ? choices[0] : null;
}

function speedRuleSpecification(effect) {
    if (effect.recipient?.actor !== 'target' || effect.scope !== 'outcome'
        || effect.resolutionStatus !== 'resolved' || effect.document?.type !== 'effect') return null;
    const rules = effect.document.mechanics?.rules;
    const duration = effect.document.mechanics?.duration;
    const start = effect.document.mechanics?.start;
    if (!Array.isArray(rules) || rules.length !== 2
        || !onlyKeys(duration, ['value', 'unit', 'expiry', 'sustained'])
        || !Number.isInteger(duration.value) || duration.value < 1
        || !['rounds', 'minutes', 'hours'].includes(duration.unit)
        || duration.sustained !== false
        || !onlyKeys(start, ['value', 'initiative'])
        || start.value !== 0 || start.initiative !== null) return null;
    const choice = rules.find(rule => rule.key === 'ChoiceSet');
    const modifier = rules.find(rule => rule.key === 'FlatModifier');
    if (!choice || !modifier || !choice.flag
        || !onlyKeys(choice, ['key', 'choices', 'flag', 'prompt', 'rollOption'])
        || !Array.isArray(choice.choices) || choice.choices.length !== 3
        || !choice.choices.every(entry => onlyKeys(entry, ['label', 'value']))
        || !onlyKeys(modifier, ['key', 'selector', 'type', 'value'])
        || modifier.selector !== 'all-speeds'
        || !['circumstance', 'status', 'item'].includes(modifier.type)) return null;
    const readsSelection = [
        `@item.flags.system.rulesSelections.${choice.flag}`,
        `{item|flags.system.rulesSelections.${choice.flag}}`
    ];
    if (!readsSelection.includes(modifier.value)) return null;
    const selected = Object.fromEntries(Object.keys(DEGREE_LABEL).map(degree =>
        [degree, degreeChoice(choice, degree)]));
    if (Object.values(selected).some(value => !value)) return null;
    return { flag: choice.flag, selected, duration, start, modifierType: modifier.type };
}

function clause(section, effect = null) {
    return String(section?.text ?? '').replace(effect?.sourceText ?? '\u0000', '')
        .replace(/\s+/g, ' ').trim();
}

/** Bind a native degree-choice Speed modifier to exact save-degree prose. */
export function compileDegreeSpeedNativeEffects(compilation, {sections = {}, lifecycle = {}} = {}) {
    if (lifecycle.durationSpec?.mode !== 'instantaneous') return compilation;
    const linked = Object.values(compilation.outcomes ?? {}).flat();
    if (linked.length !== 1 || compilation.unscoped?.length) return compilation;
    const effect = linked[0];
    const specification = speedRuleSpecification(effect);
    if (!specification) return compilation;
    const success = clause(sections.success);
    const failure = clause(sections.failure);
    const criticalFailure = clause(sections.criticalFailure, effect);
    const speedClause = /^The (?:target|creature) takes (half|full) damage,? and (?:takes? )?a [–−-](\d+)-foot (circumstance|status|item) penalty to its Speeds (until the (?:start|end) of your next turn|for [1-9]\d* (?:rounds?|minutes?|hours?))\.$/i;
    const successMatch = success.match(speedClause);
    const failureMatch = failure.match(speedClause);
    const successDuration = durationFromClause(successMatch?.[4]);
    const failureDuration = durationFromClause(failureMatch?.[4]);
    if (successMatch?.[1]?.toLowerCase() !== 'half'
        || failureMatch?.[1]?.toLowerCase() !== 'full'
        || Number(successMatch[2]) !== -specification.selected.success.value
        || Number(failureMatch[2]) !== -specification.selected.failure.value
        || successMatch[3].toLowerCase() !== specification.modifierType
        || failureMatch[3].toLowerCase() !== specification.modifierType
        || !successDuration || !failureDuration
        || ['value', 'unit', 'expiry', 'sustained'].some(key =>
            successDuration.duration[key] !== specification.duration[key]
            || failureDuration.duration[key] !== specification.duration[key])
        || successDuration.anchor !== failureDuration.anchor
        || successDuration.offset !== failureDuration.offset
        || !/^As failure, but the (?:target|creature) takes double damage\.$/i.test(criticalFailure)
        || specification.selected.criticalFailure.value !== specification.selected.failure.value) return compilation;

    const outcomes = Object.fromEntries(Object.entries(compilation.outcomes).map(([degree, entries]) =>
        [degree, [...entries]]));
    const claims = { success, failure, criticalFailure };
    for (const degree of Object.keys(DEGREE_LABEL)) {
        const enriched = {
            ...effect,
            degrees: [degree],
            outcomeRule: {
                kind: 'degree-speed-penalty',
                degree,
                selectionFlag: specification.flag,
                selectionValue: specification.selected[degree].value,
                modifierType: specification.modifierType,
                claimText: claims[degree],
                durationAnchor: successDuration.anchor,
                durationOffset: successDuration.offset,
                templateDuration: specification.duration,
                templateStart: specification.start
            }
        };
        outcomes[degree] = [enriched];
    }
    return { ...compilation, outcomes };
}

// A flag Effect choosing a Speed penalty by degree and granting a condition (Swampcall):
//   Failure "The creature sinks partially into the mud. The creature takes a –10-foot circumstance penalty to its Speeds (except for
//   its swim Speed, if any) and becomes Off-Guard. These effects last until the creature leaves the area or until the end of its next
//   turn, whichever comes first." / Critical Failure "As failure, but the penalty to Speeds (except Swim speed) is -15 feet."
// with a ChoiceSet (failure / critical failure values), one FlatModifier on the listed Speeds reading it, and one GrantItem condition.
const SPEEDS = ['land-speed', 'burrow-speed', 'climb-speed', 'fly-speed', 'swim-speed'];

/** The Effect's shape: {flag, offered, modifierType, selectors, conditionId}, or null. */
export function speedConditionShape(rules) {
    if (!Array.isArray(rules) || rules.length !== 3) return null;
    const choice = rules.find(rule => rule.key === 'ChoiceSet');
    const modifier = rules.find(rule => rule.key === 'FlatModifier');
    const grant = rules.find(rule => rule.key === 'GrantItem');
    if (!choice || !modifier || !grant || !onlyKeys(choice, ['key', 'choices', 'flag', 'prompt']) || !/^[A-Za-z][A-Za-z0-9]*$/.test(choice.flag ?? '')
        || !onlyKeys(modifier, ['key', 'selector', 'type', 'value']) || !onlyKeys(grant, ['key', 'uuid', 'inMemoryOnly'])) return null;
    const offered = {};
    for (const entry of choice.choices ?? []) {
        const label = FLAG_LABEL.exec(String(entry?.label ?? ''));
        if (!label || !onlyKeys(entry, ['label', 'value']) || !Number.isInteger(entry.value) || entry.value >= 0 || entry.value % 5 || offered[label[1]] != null) return null;
        offered[label[1]] = entry.value;
    }
    const selectors = Array.isArray(modifier.selector) ? modifier.selector : [modifier.selector];
    const condition = /^Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)$/.exec(String(grant.uuid ?? ''));
    if (!Object.keys(offered).length || !condition || !['circumstance', 'status'].includes(modifier.type)
        || ![`@item.flags.system.rulesSelections.${choice.flag}`, `{item|flags.system.rulesSelections.${choice.flag}}`].includes(modifier.value)
        || !selectors.every(selector => SPEEDS.includes(selector)) || new Set(selectors).size !== selectors.length) return null;
    return { flag: choice.flag, offered, modifierType: modifier.type, selectors: [...selectors].sort(), conditionId: condition[1] };
}

const SPEED_ROW = /^The (?:creature|target) takes a [–−-](\d+)-foot (circumstance|status) penalty to its Speeds( \(except for its swim Speed, if any\))? and becomes @UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)\]\{([A-Za-z-]+)\}\.$/;
const SPEED_LIFETIME = /^These effects last until the (?:creature|target) leaves the area or until the end of its next turn, whichever comes first\.$/;
const SPEED_CRITICAL = /^As failure, but the penalty to Speeds(?: \(except (?:for its )?[Ss]wim [Ss]peed(?:, if any)?\))? is [–−-](\d+) feet\.$/;
const ROW_NARRATION = /^The (?:creature|target) (?!takes\b|becomes\b|is\b)[a-z ,']{3,80}\.$/;

/** The rows' claims against the shape: {byDegree: {degree: {value, claims, leaveArea}}, conditionSlug} or null. */
export function proveSpeedConditionRows(shape, rows) {
    if (!shape) return null;
    const sentences = text => String(text ?? '').replace(/\s+/g, ' ').trim().split(/(?<=\.)\s+(?=[A-Z@])/).filter(Boolean);
    const failure = sentences(rows.failure);
    const narration = ROW_NARRATION.test(failure[0] ?? '') && !/\d|@/.test(failure[0]) ? failure.shift() : null;
    const main = SPEED_ROW.exec(failure[0] ?? '');
    const lifetime = SPEED_LIFETIME.test(failure[1] ?? '');
    if (!main || failure.length !== (lifetime ? 2 : 1) || main[2] !== shape.modifierType || main[4] !== shape.conditionId) return null;
    const expected = main[3] ? SPEEDS.filter(speed => speed !== 'swim-speed').sort() : [...SPEEDS].sort();
    if (JSON.stringify(expected) !== JSON.stringify(shape.selectors) || -Number(main[1]) !== shape.offered.failure) return null;
    const byDegree = { failure: { value: shape.offered.failure, claims: [...(narration ? [narration] : []), ...failure], leaveArea: lifetime } };
    if (shape.offered.criticalFailure != null) {
        const critical = sentences(rows.criticalFailure);
        const match = critical.length === 1 && SPEED_CRITICAL.exec(critical[0]);
        if (!match || -Number(match[1]) !== shape.offered.criticalFailure) return null;
        byDegree.criticalFailure = { value: shape.offered.criticalFailure, claims: critical, leaveArea: lifetime };
    }
    if (Object.keys(shape.offered).some(degree => !byDegree[degree])) return null;
    return { byDegree, conditionSlug: main[5].toLowerCase() };
}

/** Bind the Effect to each degree it offers; "leaves the area" needs the spell's lingering area. */
export function compileDegreeSpeedConditionEffects(compilation, { sections = {}, lingering = false } = {}) {
    const linked = Object.values(compilation.outcomes ?? {}).flat().filter((entry, index, all) => all.findIndex(other => other.uuid === entry.uuid) === index);
    if (linked.length !== 1 || compilation.unscoped?.length) return compilation;
    const effect = linked[0];
    if (effect.recipient?.actor !== 'target' || effect.scope !== 'outcome' || effect.resolutionStatus !== 'resolved' || effect.document?.type !== 'effect') return compilation;
    const duration = effect.document.mechanics?.duration;
    if (!(duration?.value === 1 && duration.unit === 'rounds' && duration.expiry === 'turn-start' && duration.sustained === false)) return compilation;
    const shape = speedConditionShape(effect.document.mechanics?.rules);
    const rows = Object.fromEntries(['failure', 'criticalFailure'].map(degree => [degree, clause(sections[degree], effect)]));
    const proof = proveSpeedConditionRows(shape, rows);
    if (!proof || (Object.values(proof.byDegree).some(row => row.leaveArea) && !lingering)) return compilation;
    const outcomes = Object.fromEntries(Object.entries(compilation.outcomes).map(([degree, entries]) => [degree, entries.filter(entry => entry !== effect)]));
    for (const [degree, row] of Object.entries(proof.byDegree)) {
        outcomes[degree] = [...outcomes[degree], { ...effect, degrees: [degree], outcomeRule: { kind: 'degree-speed-condition', degree, selectionFlag: shape.flag,
            selectionValue: row.value, modifierType: shape.modifierType, selectors: shape.selectors, conditionId: shape.conditionId, carriedConditions: [proof.conditionSlug],
            claims: row.claims, claimText: null, leaveArea: row.leaveArea, durationAnchor: 'source-turn', durationOffset: 1, templateDuration: duration } }];
    }
    return { ...compilation, outcomes };
}

// "The creature takes a –1 status penalty to attack rolls as long as it's in the area." (the growing-aura rewrite, Bane / Malediction)
// with "As failure." — PF2e's Effect is exactly that one FlatModifier (attack rolls: "attack"; AC: "ac"), lasting unlimited or the
// spell's duration; the lingering area removes it when the creature leaves.
const AREA_PENALTY_ROW = /^The creature takes a [–−-](\d) (status|circumstance) penalty to (attack rolls|AC) as long as it's in the area\.$/;
const AREA_PENALTY_SELECTOR = { "attack rolls": "attack", AC: "ac" };

/** The Effect's rules give exactly the row's penalty: true or false. */
// "The creature takes a –2 circumstance penalty to Athletics checks to Swim and a –10-foot circumstance penalty to its swim Speed, if it has one,
// until it leaves the area." (Undertow): the Swim checks' penalty (only on the Swim action) and the swim Speed's.
const SWIM_PENALTY_ROW = /^The creature takes a [–−-](\d) (circumstance|status) penalty to Athletics checks to Swim and a [–−-](\d+)-foot \2 penalty to its swim Speed, if it has one, until it leaves the area\.$/;
function proveSwimPenalty(rules, row) {
    const match = SWIM_PENALTY_ROW.exec(String(row ?? ""));
    if (!match || !Array.isArray(rules) || rules.length !== 2) return false;
    const check = rules.find(rule => rule.selector === "athletics"), speed = rules.find(rule => rule.selector === "swim-speed");
    return !!check && !!speed && [check, speed].every(rule => rule.key === "FlatModifier" && rule.type === match[2])
        && onlyKeys(check, ["key", "selector", "type", "value", "predicate"]) && JSON.stringify(check.predicate) === '["action:swim"]' && Number(check.value) === -Number(match[1])
        && onlyKeys(speed, ["key", "selector", "type", "value"]) && Number(speed.value) === -Number(match[3]);
}

export function proveAreaPenalty(rules, row) {
    if (SWIM_PENALTY_ROW.test(String(row ?? ""))) return proveSwimPenalty(rules, row);
    const match = AREA_PENALTY_ROW.exec(String(row ?? ""));
    if (!match || !Array.isArray(rules) || rules.length !== 1) return false;
    const [rule] = rules;
    return rule.key === "FlatModifier" && onlyKeys(rule, ["key", "selector", "type", "value"]) && rule.selector === AREA_PENALTY_SELECTOR[match[3]]
        && rule.type === match[2] && Number(rule.value) === -Number(match[1]);
}

// "The creature rolls twice on its first attack roll this round and takes the lower result." (the roll-twice aura's rewritten row):
// PF2e's Effect whose only rule rolls the next attack twice, keeping the lower, removed after that roll.
const ROLL_TWICE_ROW = /^The creature rolls twice on its first attack roll this round and takes the lower result\.$/;
export function proveRollTwice(rules, row) {
    if (!ROLL_TWICE_ROW.test(String(row ?? "")) || !Array.isArray(rules) || rules.length !== 1) return false;
    const [rule] = rules;
    return rule.key === "RollTwice" && onlyKeys(rule, ["key", "keep", "removeAfterRoll", "selector"]) && rule.keep === "lower" && rule.selector === "attack" && rule.removeAfterRoll === true;
}

// A curse that makes some skill checks roll twice, keep the worse (Outcast's Curse): "For 10 minutes, the target must roll twice and use the worse
// result whenever attempting a Deception, Diplomacy, Intimidation, or Performance check, and creatures they encounter have an initial attitude
// toward them of one step worse (…)." / "As success, but the effect is permanent." / "As failure, and creatures that the target encounters have an
// initial attitude toward them of two steps worse.": PF2e's two Effects whose only rule rolls those skills twice keeping the lower — the stated
// minutes' one for a success, the unlimited one for the failing rows (told apart by their durations, not their names). The attitudes are notes.
const SKILL_TWICE_ROW = /^For (\d+) minutes, the target must roll twice and use the worse result whenever attempting an? ([A-Z][a-z]+(?:, [A-Z][a-z]+)*,? or [A-Z][a-z]+) check, and creatures they encounter have an initial attitude toward them of one step worse \(for instance, .+\)\.$/;
// (Sage's Curse: "For 10 minutes, the target must roll twice and use the worse result whenever attempting an Arcana, Lore, Occultism, or Society check.
// If the target succeeds at a check to Recall Knowledge, …" / "As success, but the effect is permanent." / "As failure, and the target treats the
// outcomes of all checks to Recall Knowledge as one degree of success worse …": the permanent Effect's choice of result — PF2e's own rule makes
// Recall Knowledge one degree worse for the critical failure.)
const SAGE_ROW = /^For (\d+) minutes, the target must roll twice and use the worse result whenever attempting an? ([A-Z][a-z]+(?:, [A-Z][a-z]+)*,? or [A-Z][a-z]+) check\. (If the target succeeds at a check to Recall Knowledge, .+)$/;
const SAGE_CRITICAL = /^As failure, and the target treats the outcomes of all checks to Recall Knowledge as one degree of success worse than the result the target rolled \(.+\)\.$/;
const skillSelector = skill => skill === "lore" ? "lore-skill-check" : skill;
export function proveSkillRollTwice(rules, skills, recall = null) {
    if (!Array.isArray(rules) || rules.length !== (recall ? 3 : 1)) return false;
    const [rule] = rules;
    if (!(rule.key === "RollTwice" && onlyKeys(rule, ["key", "keep", "removeAfterRoll", "selector"]) && rule.keep === "lower" && rule.removeAfterRoll === false
        && Array.isArray(rule.selector) && JSON.stringify([...rule.selector].sort()) === JSON.stringify(skills.map(skillSelector).sort()))) return false;
    if (!recall) return true;
    const choice = rules[1], adjust = rules[2];
    return choice.key === "ChoiceSet" && /^[a-z-]+$/.test(choice.rollOption ?? "") && JSON.stringify((choice.choices ?? []).map(option => option.value)) === '["failure","critical-failure"]'
        && adjust.key === "AdjustDegreeOfSuccess" && adjust.selector === "skill-check" && JSON.stringify(adjust.adjustment) === '{"all":"one-degree-worse"}'
        && JSON.stringify(adjust.predicate) === JSON.stringify(["action:recall-knowledge", `${choice.rollOption}:critical-failure`]);
}
export function compileSkillRollTwiceEffects(compilation, { sections = {} } = {}) {
    const linked = Object.values(compilation.outcomes ?? {}).flat().filter((entry, index, all) => all.findIndex(other => other.uuid === entry.uuid) === index);
    if (linked.length !== 2 || compilation.unscoped?.length) return compilation;
    const success = String(sections.success?.text ?? "").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim().replace(/\s*Spell Effect: .*$/, "");
    const sage = !SKILL_TWICE_ROW.test(success) ? SAGE_ROW.exec(success) : null;
    const row = SKILL_TWICE_ROW.exec(success) ?? sage;
    if (!row || clause(sections.criticalSuccess) !== "The target is unaffected.") return compilation;
    const criticalRow = String(sections.criticalFailure?.text ?? "").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();
    if (sage && !SAGE_CRITICAL.test(criticalRow)) return compilation;
    const skills = row[2].replace(/,? or /, ", ").split(/, /).map(skill => skill.toLowerCase());
    const timed = linked.find(entry => entry.document?.mechanics?.duration?.unit === "minutes" && Number(entry.document.mechanics.duration.value) === Number(row[1]));
    const lasting = linked.find(entry => entry.document?.mechanics?.duration?.unit === "unlimited");
    if (!timed || !lasting || [timed, lasting].some(entry => entry.recipient?.actor !== "target" || entry.scope !== "outcome" || entry.resolutionStatus !== "resolved" || entry.document?.type !== "effect"
        || !proveSkillRollTwice(entry.document.mechanics?.rules, skills, sage && entry === lasting ? true : null))) return compilation;
    const failure = String(sections.failure?.text ?? "").replace(/\s+/g, " ").replace(/\s*@UUID\[[^\]]+\]\{Spell Effect:[^}]+\}\s*$/, "").trim();
    if (!/^As success, but the effect is permanent\.$/.test(failure)) return compilation;
    const recall = sage ? lasting.document.mechanics.rules[1].rollOption : null;
    const rule = (entry, degree, claims) => ({ ...entry, degrees: [degree], outcomeRule: { kind: "skill-roll-twice-effect", degree, skills, claimText: row[0], claims,
        variant: sage ? "recall" : "attitude", ...(recall && entry === lasting ? { recallChoice: { rollOption: recall, value: degree === "criticalFailure" ? "critical-failure" : "failure" } } : {}),
        durationAnchor: "effect-start", durationOffset: 0, templateDuration: entry.document.mechanics.duration } });
    const outcomes = { criticalSuccess: [], success: [rule(timed, "success", [row[0]])], failure: [rule(lasting, "failure", [failure])],
        criticalFailure: [rule(lasting, "criticalFailure", sage ? [criticalRow] : [failure])] };
    return { ...compilation, outcomes };
}

// Bestial Curse's rewritten rows: "… and gains weakness 1 to silver." on the failure (for its hours) and the critical failure (unlimited), each with
// PF2e's Effect whose only rule is exactly that weakness — bound by their durations, not their names.
const WEAKNESS_ROW = /\bgains weakness (\d+) to ([a-z]+)\.$/;
export function compileWeaknessCurseEffects(compilation, { sections = {} } = {}) {
    const linked = Object.values(compilation.outcomes ?? {}).flat().filter((entry, index, all) => all.findIndex(other => other.uuid === entry.uuid) === index);
    if (linked.length !== 2 || compilation.unscoped?.length) return compilation;
    const rowText = degree => String(sections[degree]?.text ?? "").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").replace(/\s*Spell Effect: .*$/, "").trim();
    const failure = WEAKNESS_ROW.exec(rowText("failure")), critical = WEAKNESS_ROW.exec(rowText("criticalFailure"));
    const hours = /\bfor (\d+) (hour|minute)s?\b/.exec(rowText("failure"));
    if (!failure || !critical || failure[1] !== critical[1] || failure[2] !== critical[2] || !hours) return compilation;
    const proves = entry => { const rules = entry.document?.mechanics?.rules ?? [];
        return rules.length === 1 && rules[0].key === "Weakness" && rules[0].type === failure[2] && Number(rules[0].value) === Number(failure[1]) && onlyKeys(rules[0], ["key", "type", "value"]); };
    const timed = linked.find(entry => entry.document?.mechanics?.duration?.unit === `${hours[2]}s` && Number(entry.document.mechanics.duration.value) === Number(hours[1]));
    const lasting = linked.find(entry => entry.document?.mechanics?.duration?.unit === "unlimited");
    if (!timed || !lasting || [timed, lasting].some(entry => entry.recipient?.actor !== "target" || entry.scope !== "outcome" || entry.resolutionStatus !== "resolved" || !proves(entry))) return compilation;
    const rule = (entry, degree) => ({ ...entry, degrees: [degree], outcomeRule: { kind: "weakness-curse-effect", degree, weakness: { type: failure[2], value: Number(failure[1]) },
        claimText: rowText(degree), claims: [rowText(degree)], durationAnchor: "effect-start", durationOffset: 0, templateDuration: entry.document.mechanics.duration } });
    return { ...compilation, outcomes: { criticalSuccess: [], success: [], failure: [rule(timed, "failure")], criticalFailure: [rule(lasting, "criticalFailure")] } };
}

// A penalty Effect per result, told apart by duration (Infectious Melody): the success row "For 1 round, … In addition, the creature takes a -2 status
// penalty on linguistic Intimidation checks, …" with "As success, but the duration is 3 rounds." / "… 1 hour.", and PF2e's three Effects whose only
// rule is that penalty: each row gets the Effect lasting its stated time.
const LINGUISTIC_PENALTY = /\bthe creature takes a -(\d) (status|circumstance) penalty on linguistic ([A-Z][a-z]+) checks\b/;
export function compileDurationBoundPenaltyEffects(compilation, { sections = {} } = {}) {
    const linked = Object.values(compilation.outcomes ?? {}).flat().filter((entry, index, all) => all.findIndex(other => other.uuid === entry.uuid) === index);
    if (linked.length !== 3 || compilation.unscoped?.length) return compilation;
    const text = degree => String(sections[degree]?.text ?? "").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").replace(/\s*Spell Effect: .*$/, "").trim();
    const first = /^For (\d+) (round|minute|hour)s?, /.exec(text("success")), penalty = LINGUISTIC_PENALTY.exec(text("success"));
    const failure = DURATION_ROW.exec(text("failure")), critical = DURATION_ROW.exec(text("criticalFailure"));
    if (!first || !penalty || !failure || !critical || clause(sections.criticalSuccess) !== "The creature is unaffected.") return compilation;
    const skill = penalty[3].toLowerCase();
    const proves = entry => { const rules = entry.document?.mechanics?.rules ?? [];
        return rules.length === 1 && rules[0].key === "FlatModifier" && rules[0].selector === skill && rules[0].type === penalty[2] && Number(rules[0].value) === -Number(penalty[1])
            && JSON.stringify(rules[0].predicate) === '["item:trait:linguistic"]' && onlyKeys(rules[0], ["key", "selector", "type", "value", "predicate"]); };
    const find = ([, value, unit]) => linked.find(entry => entry.document?.mechanics?.duration?.unit === `${unit}s` && Number(entry.document.mechanics.duration.value) === Number(value));
    const bound = { success: find(first), failure: find(failure), criticalFailure: find(critical) };
    if (Object.values(bound).some(entry => !entry || entry.recipient?.actor !== "target" || entry.scope !== "outcome" || entry.resolutionStatus !== "resolved" || !proves(entry))
        || new Set(Object.values(bound).map(entry => entry.uuid)).size !== 3) return compilation;
    const rule = degree => ({ ...bound[degree], degrees: [degree], outcomeRule: { kind: "duration-bound-penalty-effect", degree, penalty: { selector: skill, type: penalty[2], value: -Number(penalty[1]) },
        claimText: text(degree), claims: [text(degree)], durationAnchor: "effect-start", durationOffset: 0, templateDuration: bound[degree].document.mechanics.duration } });
    return { ...compilation, outcomes: { criticalSuccess: [], success: [rule("success")], failure: [rule("failure")], criticalFailure: [rule("criticalFailure")] } };
}

// A weakness to the caster's chosen type for each failing result's time (Seal Fate): "Choose one type of damage from the following list: acid, …" with
// rows "The target gains weakness 2 to the chosen damage type until the end of your next turn." / "As success, but the duration is 1 minute. …" / "As
// failure, but the duration is unlimited." and PF2e's one Effect (linked outside the rows): its ChoiceSet of exactly the listed types and its
// Weakness of the selected type at floor(rank/2) (the text's 2 at its rank, +1 each 2 ranks). Each row gets it for its own time; the caster's pick
// presets the choice.
const CHOSEN_LIST = /Choose one type of damage from the following list: ([a-z]+(?:, [a-z]+)*,? or [a-z]+)\./;
const CHOSEN_SUCCESS = /^The target gains weakness (\d+) to the chosen damage type until the end of your next turn\.$/;
export function compileChosenWeaknessEffects(compilation, { sections = {}, preamble = "", rank = null } = {}) {
    const linked = [...Object.values(compilation.outcomes ?? {}).flat(), ...(compilation.unscoped ?? [])];
    if (linked.length !== 1) return compilation;
    const [effect] = linked;
    const list = CHOSEN_LIST.exec(String(preamble).replace(/\s+/g, " "));
    const text = degree => String(sections[degree]?.text ?? "").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();
    const success = CHOSEN_SUCCESS.exec(text("success"));
    const failure = /^As success, but the duration is (\d+) (minute|hour)s?\./.exec(text("failure")), critical = /^As failure, but the duration is unlimited\.$/.test(text("criticalFailure"));
    if (!list || !success || !failure || !critical || effect.document?.type !== "effect" || Math.floor(Number(rank) / 2) !== Number(success[1])) return compilation;
    const types = list[1].replace(/,? or /, ", ").split(/, /);
    const rules = effect.document?.mechanics?.rules ?? [];
    const choice = rules.find(rule => rule.key === "ChoiceSet"), weakness = rules.find(rule => rule.key === "Weakness");
    if (rules.length !== 2 || !choice || !weakness || JSON.stringify((choice.choices ?? []).map(option => option.value).sort()) !== JSON.stringify([...types].sort())
        || weakness.type !== `{item|flags.system.rulesSelections.${choice.flag}}` || String(weakness.value).replace(/\s+/g, "") !== "floor(@item.level/2)") return compilation;
    const casterChoice = { flag: choice.flag, values: (choice.choices ?? []).map(option => option.value) };
    const rule = (degree, timing) => ({ ...effect, scope: "outcome", degrees: [degree], outcomeRule: { kind: "chosen-weakness-effect", degree, casterChoice, claimText: text(degree), claims: [text(degree)],
        ...timing, templateDuration: effect.document.mechanics.duration } });
    return { ...compilation, unscoped: [], outcomes: { criticalSuccess: [], success: [rule("success", { durationAnchor: "source-turn", durationOffset: 1, durationOverride: { value: 1, unit: "rounds", expiry: "turn-end" } })],
        failure: [rule("failure", { durationAnchor: "effect-start", durationOffset: 0, durationOverride: { value: Number(failure[1]), unit: `${failure[2]}s`, expiry: null } })],
        criticalFailure: [rule("criticalFailure", { durationAnchor: "effect-start", durationOffset: 0 })] } };
}

export function compileRollTwiceEffects(compilation, { sections = {}, lingering = false } = {}) {
    if (!lingering) return compilation;
    const linked = Object.values(compilation.outcomes ?? {}).flat().filter((entry, index, all) => all.findIndex(other => other.uuid === entry.uuid) === index);
    if (linked.length !== 1 || compilation.unscoped?.length) return compilation;
    const effect = linked[0];
    if (effect.recipient?.actor !== 'target' || effect.scope !== 'outcome' || effect.resolutionStatus !== 'resolved' || effect.document?.type !== 'effect') return compilation;
    const duration = effect.document.mechanics?.duration;
    const failure = clause(sections.failure, effect), critical = clause(sections.criticalFailure, effect);
    // The Effect lasts at most until the end of the creature's turn (PF2e removes it after the roll).
    const brief = duration?.unit === 'rounds' && Number(duration.value) <= 1 && duration.expiry === 'turn-end' && !duration.sustained;
    if (!brief || !proveRollTwice(effect.document.mechanics?.rules, failure) || critical !== 'As failure.'
        || clause(sections.success, effect) !== 'The creature is unaffected.' || clause(sections.criticalSuccess, effect) !== 'The creature is unaffected.') return compilation;
    const outcomes = Object.fromEntries(Object.entries(compilation.outcomes).map(([degree, entries]) => [degree, entries.filter(entry => entry.uuid !== effect.uuid)]));
    for (const degree of ['failure', 'criticalFailure']) {
        outcomes[degree] = [...outcomes[degree], { ...effect, degrees: [degree], outcomeRule: { kind: 'roll-twice-effect', degree, claimText: failure,
            claims: degree === 'failure' ? [failure] : [critical], durationAnchor: 'effect-start', durationOffset: 0, templateDuration: duration } }];
    }
    return { ...compilation, outcomes };
}

export function compileAreaPenaltyEffects(compilation, { sections = {}, lifecycle = {}, lingering = false } = {}) {
    if (!lingering) return compilation;
    const linked = Object.values(compilation.outcomes ?? {}).flat().filter((entry, index, all) => all.findIndex(other => other.uuid === entry.uuid) === index);
    if (linked.length !== 1 || compilation.unscoped?.length) return compilation;
    const effect = linked[0];
    if (effect.recipient?.actor !== 'target' || effect.scope !== 'outcome' || effect.resolutionStatus !== 'resolved' || effect.document?.type !== 'effect') return compilation;
    const duration = effect.document.mechanics?.duration;
    const spell = lifecycle.durationSpec;
    const lasts = duration?.unit === 'unlimited' || (spell?.mode === 'fixed' && duration?.value === Number(spell.value) && duration.unit === spell.unit && !duration.sustained);
    const failure = clause(sections.failure, effect), critical = clause(sections.criticalFailure, effect);
    if (!lasts || !proveAreaPenalty(effect.document.mechanics?.rules, failure) || critical !== 'As failure.'
        || clause(sections.success, effect) !== 'The creature is unaffected.' || clause(sections.criticalSuccess, effect) !== 'The creature is unaffected.') return compilation;
    const outcomes = Object.fromEntries(Object.entries(compilation.outcomes).map(([degree, entries]) => [degree, entries.filter(entry => entry !== effect)]));
    for (const degree of ['failure', 'criticalFailure']) {
        outcomes[degree] = [...outcomes[degree], { ...effect, degrees: [degree], outcomeRule: { kind: 'area-penalty-effect', degree, claimText: failure,
            claims: degree === 'failure' ? [failure] : [critical], leaveArea: true, durationAnchor: 'effect-start', durationOffset: 0, templateDuration: duration } }];
    }
    return { ...compilation, outcomes };
}

// Rewired senses (Synesthesia): the preamble's three effects — "the target must succeed at a DC 5 flat check each time it uses a concentrate action, or
// the action fails and is wasted", everything Concealed from it, "Clumsy 3 and … a –10-foot status penalty to its Speeds" — with rows "The target is
// affected for 1 round." / "The target is affected for 1 minute." / "As failure, and the target is Stunned 2 …", and PF2e's two Effects: the
// round's (the concentrate note, Clumsy and the Speed penalty) and the minute's (the same, and a result choice whose critical failure grants
// Stunned). Each row gets the Effect lasting its time, the minute's preset to the row's result; Concealed is a note (below).
const SENSES_FLAT = /the target must succeed at a DC (\d+) flat check each time it uses a concentrate action, or the action fails and is wasted\./;
const SENSES_MOVE = /making it Clumsy (\d) and giving it a [–−-](\d+)-foot (status|circumstance) penalty to its Speeds\./;
const SENSES_ROW = /^The target is affected for (\d+) (round|minute)s?\.$/;
const SENSES_CRITICAL = /^As failure, and the target is Stunned (\d) [a-z ]+\.$/;
export function compileSensesEffects(compilation, { sections = {}, preamble = "" } = {}) {
    const linked = Object.values(compilation.outcomes ?? {}).flat().filter((entry, index, all) => all.findIndex(other => other.uuid === entry.uuid) === index);
    if (linked.length !== 2 || compilation.unscoped?.length) return compilation;
    const text = degree => String(sections[degree]?.text ?? "").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").replace(/\s*Spell Effect: .*$/, "").trim();
    const plainPreamble = String(preamble).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/@Check\[flat\|dc:(\d+)[^\]]*\]/g, "DC $1 flat check").replace(/\s+/g, " ");
    const flat = SENSES_FLAT.exec(plainPreamble), move = SENSES_MOVE.exec(plainPreamble);
    const success = SENSES_ROW.exec(text("success")), failure = SENSES_ROW.exec(text("failure")), critical = SENSES_CRITICAL.exec(text("criticalFailure"));
    if (!flat || !move || !success || !failure || !critical || clause(sections.criticalSuccess) !== "The target is unaffected.") return compilation;
    const find = ([, value, unit]) => linked.find(entry => entry.document?.mechanics?.duration?.unit === `${unit}s` && Number(entry.document.mechanics.duration.value) === Number(value));
    const short = find(success), long = find(failure);
    if (!short || !long || short === long || [short, long].some(entry => entry.recipient?.actor !== "target" || entry.scope !== "outcome" || entry.resolutionStatus !== "resolved" || entry.document?.type !== "effect")) return compilation;
    const choice = (long.document.mechanics.rules ?? []).find(rule => rule.key === "ChoiceSet");
    if (!choice?.rollOption) return compilation;
    const senses = { flatDC: Number(flat[1]), clumsy: Number(move[1]), speed: { type: move[3], value: -Number(move[2]) }, stunned: Number(critical[1]) };
    // (The Effects must state the text's numbers: Clumsy's and Stunned's values, the Speed penalty.)
    const badge = rule => (rule.alterations ?? []).find(alteration => alteration.property === "badge-value")?.value;
    const states = entry => { const rules = entry.document.mechanics.rules ?? [];
        return rules.some(rule => rule.key === "GrantItem" && /i3OJZU2nk64Df3xm$/.test(rule.uuid ?? "") && badge(rule) === senses.clumsy)
            && rules.some(rule => rule.key === "FlatModifier" && JSON.stringify([rule.selector].flat()) === '["all-speeds"]' && rule.type === senses.speed.type && Number(rule.value) === senses.speed.value); };
    const stuns = (long.document.mechanics.rules ?? []).some(rule => rule.key === "GrantItem" && /dfCMdR4wnpbYNTix$/.test(rule.uuid ?? "") && badge(rule) === senses.stunned
        && JSON.stringify(rule.predicate) === JSON.stringify([`${choice.rollOption}:critical-failure`]));
    if (!states(short) || !states(long) || !stuns) return compilation;
    const rule = (entry, degree, value) => ({ ...entry, degrees: [degree], outcomeRule: { kind: "senses-effect", degree, senses, claimText: text(degree), claims: [text(degree)],
        ...(value ? { degreeChoice: { rollOption: choice.rollOption, value } } : {}), durationAnchor: "effect-start", durationOffset: 0, templateDuration: entry.document.mechanics.duration } });
    return { ...compilation, outcomes: { criticalSuccess: [], success: [rule(short, "success", null)], failure: [rule(long, "failure", "failure")], criticalFailure: [rule(long, "criticalFailure", "critical-failure")] } };
}

// Wishes against the target (Wish-Twisted Form): the preamble's list — "The target gains weakness 5 to one energy type of your choice.", "The target's
// resistances are reduced by 5.", "The target takes a –10-foot status penalty to all its Speeds.", "The target takes a -1 status penalty to its saving
// throws." — with rows "The target takes the penalties for 1 round." / "… for 1 minute." / "As failure, and the target takes a -1 status penalty to AC
// for the duration." and "Heightened (+1) Increase the weakness and the reduction to resistances by 1.", and PF2e's two Effects: the round's and the
// minute's, each the weakness to the chosen type at the spell's rank, the Speed and save penalties (the minute's also a result choice whose critical
// failure gives the AC penalty). Each row gets the Effect lasting its time, preset to the caster's type and the row's result; the resistance
// reduction PF2e doesn't carry is a note (below).
const TWIST_ITEMS = [/^The target gains weakness (\d+) to one energy type of your choice\.$/, /^The target's resistances are reduced by (\d+)\.$/,
    /^The target takes a [–−-](\d+)-foot (status) penalty to all its Speeds\.$/, /^The target takes a [–−-](\d+) (status) penalty to its saving throws\.$/];
const TWIST_ROW = /^The target takes the penalties for (\d+) (round|minute)s?\.$/;
const TWIST_CRITICAL = /^As failure, and the target takes a [–−-](\d+) (status) penalty to AC for the duration\.$/;
const ENERGY = new Set(["acid", "cold", "electricity", "fire", "force", "sonic", "vitality", "void"]);
export function twistedFormRulesMatch(rules, claim, choiceValue = null) {
    const list = Array.isArray(rules) ? rules : [];
    const choice = list.find(rule => rule.key === "ChoiceSet" && rule.flag), degree = list.find(rule => rule.key === "ChoiceSet" && rule.rollOption);
    const weakness = list.filter(rule => rule.key === "Weakness"), mods = list.filter(rule => rule.key === "FlatModifier");
    const speed = mods.find(rule => JSON.stringify([rule.selector].flat()) === '["all-speeds"]'), saves = mods.find(rule => JSON.stringify([rule.selector].flat()) === '["saving-throw"]');
    const ac = mods.find(rule => JSON.stringify([rule.selector].flat()) === '["ac"]');
    const base = choice && (choice.choices ?? []).length >= 2 && (choice.choices ?? []).every(option => ENERGY.has(option.value))
        && weakness.length === 1 && weakness[0].type === `{item|flags.system.rulesSelections.${choice.flag}}` && String(weakness[0].value).replace(/\s+/g, "") === "@item.level"
        && speed?.type === claim.speed.type && Number(speed.value) === claim.speed.value && !speed.predicate?.length
        && saves?.type === claim.saves.type && Number(saves.value) === claim.saves.value && !saves.predicate?.length;
    if (!base) return false;
    if (!choiceValue) return list.length === 4 && !degree && !ac;
    return list.length === 6 && degree && JSON.stringify((degree.choices ?? []).map(option => option.value)) === '["failure","critical-failure"]'
        && ac?.type === claim.ac.type && Number(ac.value) === claim.ac.value && JSON.stringify(ac.predicate) === JSON.stringify([`${degree.rollOption}:critical-failure`])
        && (degree.choices ?? []).some(option => option.value === choiceValue);
}
export function compileTwistedFormEffects(compilation, { sections = {}, preamble = "", rank = null, heightened = "" } = {}) {
    const linked = Object.values(compilation.outcomes ?? {}).flat().filter((entry, index, all) => all.findIndex(other => other.uuid === entry.uuid) === index);
    if (linked.length !== 2 || compilation.unscoped?.length) return compilation;
    const text = degree => String(sections[degree]?.text ?? "").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").replace(/\s*Spell Effect: .*$/, "").trim();
    const items = String(preamble).replace(/\s+/g, " ").split(/(?<=\.)\s+(?=The target)/).map(item => item.trim()).filter(item => /^The target/.test(item) && !/^The target must attempt one (?:Fortitude|Reflex|Will) saving throw for all of the following effects\.$/.test(item));
    const read = TWIST_ITEMS.map((pattern, index) => pattern.exec(items[index] ?? ""));
    const success = TWIST_ROW.exec(text("success")), failure = TWIST_ROW.exec(text("failure")), critical = TWIST_CRITICAL.exec(text("criticalFailure"));
    const step = /Heightened \(\+1\) Increase the weakness and the reduction to resistances by 1\./.test(String(heightened).replace(/\s+/g, " "));
    if (items.length !== 4 || read.some(match => !match) || !success || !failure || !critical || !step || clause(sections.criticalSuccess) !== "The target is unaffected."
        || Number(read[0][1]) !== Number(rank) || Number(read[1][1]) !== Number(rank)) return compilation;
    const claim = { speed: { type: read[2][2], value: -Number(read[2][1]) }, saves: { type: read[3][2], value: -Number(read[3][1]) }, ac: { type: critical[2], value: -Number(critical[1]) },
        resistanceReduction: Number(read[1][1]) };
    const find = ([, value, unit]) => linked.find(entry => entry.document?.mechanics?.duration?.unit === `${unit}s` && Number(entry.document.mechanics.duration.value) === Number(value));
    const short = find(success), long = find(failure);
    if (!short || !long || short === long || [short, long].some(entry => entry.recipient?.actor !== "target" || entry.scope !== "outcome" || entry.resolutionStatus !== "resolved" || entry.document?.type !== "effect")
        || !twistedFormRulesMatch(short.document.mechanics.rules, claim) || !twistedFormRulesMatch(long.document.mechanics.rules, claim, "failure")) return compilation;
    const flagChoice = rules => rules.find(rule => rule.key === "ChoiceSet" && rule.flag);
    const casterChoice = { flag: flagChoice(short.document.mechanics.rules).flag, values: flagChoice(short.document.mechanics.rules).choices.map(option => option.value) };
    if (flagChoice(long.document.mechanics.rules).flag !== casterChoice.flag || JSON.stringify(flagChoice(long.document.mechanics.rules).choices.map(option => option.value)) !== JSON.stringify(casterChoice.values)) return compilation;
    const rollOption = long.document.mechanics.rules.find(rule => rule.key === "ChoiceSet" && rule.rollOption).rollOption;
    const rule = (entry, degree, value) => ({ ...entry, degrees: [degree], outcomeRule: { kind: "twisted-form-effect", degree, claim, casterChoice, claimText: text(degree), claims: [text(degree)],
        ...(value ? { degreeChoice: { rollOption, value } } : {}), durationAnchor: "effect-start", durationOffset: 0, templateDuration: entry.document.mechanics.duration } });
    return { ...compilation, outcomes: { criticalSuccess: [], success: [rule(short, "success", null)], failure: [rule(long, "failure", "failure")], criticalFailure: [rule(long, "criticalFailure", "critical-failure")] } };
}

// A grief curse per result (Canticle of Everlasting Grief): "A creature cursed by this spell can't benefit from circumstance or status bonuses, for the duration
// noted in the degree of success." with rows "The target takes half damage, is {Frightened 1}, and is cursed for 1 round." / "… full damage, … {Frightened 3}, …
// for 1 week." / "… double damage, … {Frightened 4}, … for an unlimited duration. While the curse remains, the target's allies are also affected by the curse
// while within 15 feet of the creature." — each row's PF2e Effect, proved to be exactly the suppressed bonuses, the row's Frightened value (granted), the
// row's duration, and (critical failure) the allies' aura of that radius.
const GRIEF_LEAD = /A creature cursed by this spell can't benefit from circumstance or status bonuses, for the duration noted in the degree of success\./;
const GRIEF_ROW = /^The target takes (half|full|double) damage, is @UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)\]\{Frightened (\d)\}, and is cursed for (1 round|1 week|an unlimited duration)\.$/;
const GRIEF_ALLIES = /^While the curse remains, the target's allies are also affected by the curse while within (\d+) feet of the creature\.$/;
const GRIEF_LENGTH = { "1 round": { unit: "rounds", value: 1 }, "1 week": { unit: "days", value: 7 }, "an unlimited duration": { unit: "unlimited" } };
export function griefCurseProves(rules, { frightenedUuid, value, allies }) {
    const [suppress, grant, aura, ...rest] = rules ?? [];
    const suppressed = suppress?.key === "AdjustModifier" && suppress.selector === "all" && suppress.suppress === true
        && JSON.stringify(suppress.predicate) === JSON.stringify([{ or: ["bonus:type:circumstance", "bonus:type:status"] }]);
    const badge = (grant?.alterations ?? []).find(alteration => alteration.property === "badge-value");
    const granted = grant?.key === "GrantItem" && grant.uuid === `Compendium.pf2e.conditionitems.Item.${frightenedUuid}` && (badge ? Number(badge.value) === value && badge.mode === "override" : value === 1)
        && (grant.alterations ?? []).every(alteration => alteration.property === "badge-value");
    const aured = allies == null ? aura == null : (aura?.key === "Aura" && Number(aura.radius) === allies && (aura.effects ?? []).length === 1 && aura.effects[0].affects === "allies" && aura.effects[0].includesSelf === false);
    return suppressed && granted && aured && !rest.length;
}
export function compileGriefCurseEffects(compilation, { sections = {}, preamble = "" } = {}) {
    const lead = GRIEF_LEAD.exec(String(preamble).replace(/\s+/g, " "));
    if (!lead || compilation.unscoped?.length) return compilation;
    const outcomes = { criticalSuccess: [], success: [], failure: [], criticalFailure: [] };
    for (const degree of ["success", "failure", "criticalFailure"]) {
        const [rowText] = String(sections[degree]?.text ?? "").split("\n");
        const parts = rowText.replace(/\s+/g, " ").trim().split(/(?<=\.)\s+(?=[A-Z])/);
        const row = GRIEF_ROW.exec(parts[0] ?? ""), allies = degree === "criticalFailure" ? GRIEF_ALLIES.exec(parts[1] ?? "") : null;
        if (!row || parts.length !== (degree === "criticalFailure" ? 2 : 1) || (degree === "criticalFailure" && !allies)) return compilation;
        if ({ success: "half", failure: "full", criticalFailure: "double" }[degree] !== row[1]) return compilation;
        const entries = compilation.outcomes?.[degree] ?? [];
        const length = GRIEF_LENGTH[row[4]], duration = entries[0]?.document?.mechanics?.duration;
        if (entries.length !== 1 || entries[0].recipient?.actor !== "target" || entries[0].scope !== "outcome" || entries[0].resolutionStatus !== "resolved"
            || duration?.unit !== length.unit || (length.value != null && Number(duration.value) !== length.value)
            || !griefCurseProves(entries[0].document?.mechanics?.rules, { frightenedUuid: row[2], value: Number(row[3]), allies: allies ? Number(allies[1]) : null })) return compilation;
        outcomes[degree] = [{ ...entries[0], degrees: [degree], outcomeRule: { kind: "grief-curse-effect", degree, frightened: { uuid: row[2], value: Number(row[3]) }, allies: allies ? Number(allies[1]) : null,
            claimText: parts[0], claims: parts, preamble: lead[0], templateDuration: duration } }];
    }
    return { ...compilation, outcomes };
}

// A rolled body part's Effect (Necrotize): "The target takes 12d6 void damage and one of the following debilitations; roll [[/r 1d4 #Necrotize]] to randomly
// determine which." with a list ("Bones … weakness 3 to bludgeoning damage." / "Joints … {Clumsy 1}." / "Legs … a –10-foot status penalty to their Speeds." /
// "Muscles … {Enfeebled 1}.") and rows "The target takes half damage and the debilitation lasts until the end of your next turn." / "… full damage and the
// debilitation lasts for 1 minute." / "… double damage, and you can pick a second debilitation to apply, in addition to the one you rolled randomly. Both
// debilitations last for 1 minute." — PF2e's two Effects (a ChoiceSet of those parts, each part's rule proved against its item) with the part the cast's roll
// gives; on a critical failure the minute's Effect twice, the second with the caster's pick.
const PART_ROLL = /one of the following debilitations; roll \[\[\/r 1d(\d+) #[A-Za-z ]+\]\] to randomly determine which\./;
const PART_ROWS = {
    success: /^The target takes half damage and the debilitation lasts until the end of your next turn\.$/,
    failure: /^The target takes full damage and the debilitation lasts for 1 minute\.$/,
    criticalFailure: /^The target takes double damage, and you can pick a second debilitation to apply, in addition to the one you rolled randomly\. Both debilitations last for 1 minute\.$/
};
function partRuleMatches(text, rules, predicate) {
    const own = rules.filter(rule => JSON.stringify(rule.predicate) === JSON.stringify([predicate]));
    if (own.length !== 1) return false;
    const [rule] = own;
    const weakness = /\bweakness (\d+) to ([a-z]+) damage\.$/.exec(text);
    if (weakness) return rule.key === "Weakness" && rule.type === weakness[2] && Number(rule.value) === Number(weakness[1]);
    const condition = /\bbecomes? @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{[A-Z][a-z]+ 1\}\.$/.exec(text);
    if (condition) return rule.key === "GrantItem" && rule.uuid === condition[1] && !rule.alterations;
    const speed = /\btakes a [–-](\d+)-foot (status|circumstance) penalty to their Speeds\.$/.exec(text);
    if (speed) return rule.key === "FlatModifier" && rule.selector === "all-speeds" && rule.type === speed[2] && Number(rule.value) === -Number(speed[1]);
    return false;
}
export function rolledPartRulesMatch(rules, rollOption, parts) {
    const [choice, ...rest] = rules ?? [];
    return choice?.key === "ChoiceSet" && choice.rollOption === rollOption && JSON.stringify((choice.choices ?? []).map(entry => entry.value)) === JSON.stringify(parts.map(part => part.value))
        && rest.length === parts.length && parts.every(part => partRuleMatches(part.text, rest, `${rollOption}:${part.value}`));
}
export function compileRolledPartEffects(compilation, { sections = {}, preambleHTML = "" } = {}) {
    const roll = PART_ROLL.exec(String(preambleHTML).replace(/\s+/g, " "));
    if (!roll || compilation.unscoped?.length) return compilation;
    const parts = [...String(preambleHTML).matchAll(/<li>\s*(?:<p>)?\s*<strong>([A-Z][a-z]+)<\/strong>\s*([\s\S]*?)\s*(?:<\/p>)?\s*<\/li>/g)]
        .map(match => ({ value: match[1].toLowerCase(), text: match[2].replace(/\s+/g, " ").trim() }));
    if (parts.length !== Number(roll[1])) return compilation;
    const rowText = degree => String(sections[degree]?.text ?? "").split("\n")[0].replace(/\s+/g, " ").trim();
    if (!Object.entries(PART_ROWS).every(([degree, pattern]) => pattern.test(rowText(degree)))) return compilation;
    const success = compilation.outcomes?.success ?? [], failure = compilation.outcomes?.failure ?? [];
    if (success.length !== 1 || failure.length !== 1 || (compilation.outcomes?.criticalFailure ?? []).length) return compilation;
    const choice = entry => (entry.document?.mechanics?.rules ?? [])[0];
    const rollOption = choice(failure[0])?.rollOption;
    const timed = (entry, unit, value, expiry) => entry.document?.mechanics?.duration?.unit === unit && Number(entry.document.mechanics.duration.value) === value && entry.document.mechanics.duration.expiry === expiry;
    if (!rollOption || [success[0], failure[0]].some(entry => entry.recipient?.actor !== "target" || entry.scope !== "outcome" || entry.resolutionStatus !== "resolved"
        || !rolledPartRulesMatch(entry.document?.mechanics?.rules, rollOption, parts)) || !timed(success[0], "rounds", 1, "turn-end") || !timed(failure[0], "minutes", 1, "turn-start")) return compilation;
    const values = parts.map(part => part.value);
    const rule = (entry, degree, pick) => ({ ...entry, degrees: [degree], outcomeRule: { kind: "rolled-part-effect", degree, pick, rollOption, parts, claimText: rowText(degree),
        claims: rowText(degree).split(/(?<=\.)\s+(?=[A-Z])/), templateDuration: entry.document.mechanics.duration } });
    return { ...compilation, outcomes: { criticalSuccess: [], success: [rule(success[0], "success", "rolled")], failure: [rule(failure[0], "failure", "rolled")],
        criticalFailure: [rule(failure[0], "criticalFailure", "rolled"), rule(failure[0], "criticalFailure", "caster")] },
        rolledParts: { formula: `1d${roll[1]}`, values, sourceText: roll[0], parts } };
}
