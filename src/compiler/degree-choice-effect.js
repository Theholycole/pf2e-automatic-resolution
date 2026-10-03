// A PF2e Effect that picks its rules by the save's degree of success: a ChoiceSet (rollOption R) offering "success",
// "failure", "critical-failure", and rules predicated on "R:<degree>" (Distracting Decoy, Ill Omen). The Effect is
// applied on each degree it offers, with that degree preset, when its rules for the degree state exactly what the row
// says; a condition it grants is the row's own condition (carried by the Effect, not applied twice).
const DEGREE_VALUE = Object.freeze({ criticalSuccess: "critical-success", success: "success", failure: "failure", criticalFailure: "critical-failure" });
const CONDITION_SLUG = Object.freeze({
    "Compendium.pf2e.conditionitems.Item.AJh5ex99aV6VTggg": "off-guard",
    "Compendium.pf2e.conditionitems.Item.D5mg6Tc7Jzrj6ro7": "encumbered",
    "Compendium.pf2e.conditionitems.Item.eIcWbB5o3pP6OIMe": "immobilized",
    "Compendium.pf2e.conditionitems.Item.i3OJZU2nk64Df3xm": "clumsy",
    "Compendium.pf2e.conditionitems.Item.TkIyaNPgTZFBCCuh": "dazzled"
});
// A Weakness of the caster's level ("equal to your level") or half of it ("equal to half your level"), as PF2e reads it from the origin.
const CASTER_LEVEL = { half: /^\(?@item\.origin\.level ?\/ ?2\)?$/, full: /^@item\.origin\.level$/ };

// A rule value such as "1+@item.level" or "ceil(@item.level/2)*2", at a rank. Only arithmetic on the rank is read.
export function ruleValueAtRank(value, rank) {
    if (typeof value === "number") return value;
    const expression = String(value ?? "").replace(/@item\.(?:level|rank)/g, String(Number(rank)));
    // Only numbers, arithmetic and PF2e's ceil/floor/max/min/ternary/gte/gt/lte/lt functions.
    if (!/^(?:[\d+\-*/(). ,]|ceil|floor|max|min|ternary|gte|gt|lte|lt)*$/.test(expression)) return null;
    try {
        const result = Function("ceil", "floor", "max", "min", "ternary", "gte", "gt", "lte", "lt", `return (${expression});`)(
            Math.ceil, Math.floor, Math.max, Math.min, (condition, a, b) => condition ? a : b, (a, b) => a >= b, (a, b) => a > b, (a, b) => a <= b, (a, b) => a < b);
        return Number.isFinite(result) ? result : null;
    } catch { return null; }
}

const plainRow = text => String(text ?? "").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();

function predicateHolds(predicate, options) {
    if (predicate == null) return true;
    if (!Array.isArray(predicate)) return false;
    return predicate.every(term => typeof term === "string" ? options.has(term)
        : Array.isArray(term?.or) ? term.or.some(entry => typeof entry === "string" && options.has(entry)) : false);
}

/** The degree ChoiceSet, and the rules active for one degree; null when the Effect isn't this shape. */
export function degreeChoiceRules(rules, degreeValue) {
    if (!Array.isArray(rules)) return null;
    const choices = rules.filter(rule => rule.key === "ChoiceSet");
    const degreeChoices = choices.filter(rule => rule.rollOption);
    if (degreeChoices.length !== 1) return null;
    const [choice] = degreeChoices;
    const offered = (choice.choices ?? []).map(entry => entry?.value);
    if (!offered.length || !offered.every(value => Object.values(DEGREE_VALUE).includes(value))) return null;
    // At most one more ChoiceSet: the caster's choice of damage type, stored in a flag the Weakness rules read.
    const others = choices.filter(rule => rule !== choice);
    if (others.length > 1) return null;
    const casterChoice = others.length ? casterTypeChoice(others[0]) : null;
    if (others.length && !casterChoice) return null;
    const options = new Set([`${choice.rollOption}:${degreeValue}`]);
    const active = [];
    for (const rule of rules) {
        if (rule === choice || rule === others[0]) continue;
        // "… can't benefit from bonuses to its Speeds or take other penalties to its Speeds": an AdjustModifier suppressing every
        // other Speed modifier (active at every degree).
        if (rule.key === "AdjustModifier" && rule.suppress === true && rule.selector === "all-speeds" && Array.isArray(rule.predicate) && rule.predicate.length === 1
            && typeof rule.predicate[0]?.not === "string" && /^penalty:slug:[a-z-]+$/.test(rule.predicate[0].not)) { active.push(rule); continue; }
        if (!["FlatModifier", "RollTwice", "GrantItem", "Weakness"].includes(rule.key)) return null;
        // A Weakness type is a literal type, or the caster's chosen one.
        if (rule.key === "Weakness" && /[{@]/.test(String(rule.type)) && rule.type !== casterChoice?.reference) return null;
        // Every other rule is unconditional or gated only on this Effect's own degree choice.
        const terms = (rule.predicate ?? []).flatMap(term => typeof term === "string" ? [term] : term?.or ?? [null]);
        if (terms.some(term => typeof term !== "string" || !term.startsWith(`${choice.rollOption}:`))) return null;
        if (predicateHolds(rule.predicate, options)) active.push(rule);
    }
    return { choice, offered, active, casterChoice };
}

const DAMAGE_TYPES = new Set(["acid", "cold", "electricity", "fire", "force", "sonic", "mental", "poison", "spirit", "vitality", "void",
    "bludgeoning", "piercing", "slashing", "bleed"]);

/** A flag ChoiceSet offering damage types, with no predicate: the caster's choice, read as "{item|flags.system.rulesSelections.<flag>}". */
export function casterTypeChoice(rule) {
    if (rule?.key !== "ChoiceSet" || !rule.flag || rule.rollOption || rule.predicate || typeof rule.choices === "string" || !Array.isArray(rule.choices)) return null;
    const values = rule.choices.map(entry => entry?.value);
    if (values.length < 2 || !values.every(value => typeof value === "string" && DAMAGE_TYPES.has(value)) || new Set(values).size !== values.length) return null;
    return { flag: rule.flag, values, reference: `{item|flags.system.rulesSelections.${rule.flag}}` };
}

/** "Choose one type of damage from the following list: acid, cold, electricity, fire, force, or sonic." — exactly the choice's types. */
export function casterChoiceSentence(preambleText, casterChoice) {
    const match = /(?:^|(?<=[.!?]\s))Choose (?:one|a) (?:type of damage|damage type) from the following list: ([a-z, ]+?)\.(?=\s|$)/.exec(String(preambleText ?? "").replace(/\s+/g, " "));
    if (!match || !casterChoice) return null;
    const listed = match[1].split(/,\s*(?:or\s+)?|\s+or\s+/).map(value => value.trim()).filter(Boolean);
    if (JSON.stringify([...listed].sort()) !== JSON.stringify([...casterChoice.values].sort())) return null;
    return match[0].trim();
}

/** What the row says the Effect gives, checked against its active rules. Returns {claims, conditions} or null. */
export function proveDegreeChoiceRow(active, rowText, { rank = null, casterChoice = null, inherited = null } = {}) {
    const text = plainRow(rowText);
    const unclaimed = new Set(active);
    const claims = [];
    let chosenWeakness = null, escapeEnds = false, speedSlug = null;
    const carried = [];
    const named = new Set();
    // The Weakness to the caster's chosen type, at a value.
    const takeChosen = (value, sentence) => {
        if (!casterChoice || rank == null || !Number.isFinite(value)) return false;
        if (!take(rule => rule.key === "Weakness" && rule.type === casterChoice.reference && ruleValueAtRank(rule.value, rank) === value, sentence)) return false;
        chosenWeakness = value; return true;
    };
    const take = (predicate, sentence) => {
        const rule = [...unclaimed].find(predicate);
        if (!rule) return false;
        unclaimed.delete(rule); claims.push(sentence); return true;
    };
    for (const sentence of text.split(/(?<=\.)\s+(?=[A-Z])/)) {
        // "The first time during the duration that the target attempts an attack roll or skill check, it must roll twice
        // and use the worse result." / "Every time …"
        const twice = /^(The first time|Every time) during the duration that the (?:target|creature) attempts an attack roll or skill check, it must roll twice and use the worse result\.$/.exec(sentence);
        if (twice) {
            const every = twice[1] === "Every time";
            if (!take(rule => rule.key === "RollTwice" && rule.keep === "lower" && JSON.stringify([...(rule.selector ?? [])].sort()) === '["attack-roll","skill-check"]'
                && (every ? rule.removeAfterRoll === false : rule.removeAfterRoll !== false), sentence)) return null;
            continue;
        }
        // "The target is Encumbered and has weakness 2 to electricity (until the end of your next turn)." — the condition
        // is the Effect's GrantItem; the weakness its Weakness rule at the spell's rank.
        const weakness = /^The (?:target|creature) is [A-Za-z-]+(?: \d+)? and has weakness (\d+) to ([a-z]+)(?: until the end of your next turn)?\.$/.exec(sentence);
        if (weakness) {
            if (rank == null || !take(rule => rule.key === "Weakness" && rule.type === weakness[2] && ruleValueAtRank(rule.value, rank) === Number(weakness[1]), sentence)) return null;
            continue;
        }
        // "The creature is dazzled and gains a weakness to spirit damage equal to half your level until the beginning of its next turn as
        // spiritual energy clings to it." / "As failure, but the weakness is equal to your level.": a Weakness of the caster's level.
        const levelWeakness = /^The (?:target|creature) is ([a-z-]+) and gains a weakness to ([a-z]+) damage equal to (half )?your level until the beginning of its next turn(?: as [a-z' ]{3,50})?\.$/.exec(sentence);
        if (levelWeakness) {
            if (!active.some(rule => rule.key === "GrantItem" && CONDITION_SLUG[rule.uuid] === levelWeakness[1])) return null;
            if (!take(rule => rule.key === "Weakness" && rule.type === levelWeakness[2] && CASTER_LEVEL[levelWeakness[3] ? "half" : "full"].test(String(rule.value).trim()), sentence)) return null;
            continue;
        }
        const levelInherited = /^As failure, but the weakness is equal to (half )?your level\.$/.exec(sentence);
        if (levelInherited) {
            if (!inherited?.levelWeakness || !take(rule => rule.key === "Weakness" && rule.type === inherited.levelWeakness && CASTER_LEVEL[levelInherited[1] ? "half" : "full"].test(String(rule.value).trim()), sentence)) return null;
            continue;
        }
        // "The creature gains weakness 1 to the chosen damage type for 1 round."
        const chosen = /^The (?:target|creature) gains weakness (\d+) to the chosen damage type(?: for 1 round)?\.$/.exec(sentence);
        if (chosen) {
            if (!takeChosen(Number(chosen[1]), sentence)) return null;
            continue;
        }
        // "As success, except the weakness is doubled." — the inherited row's chosen weakness, doubled.
        if (/^As (?:success|failure), except the weakness is doubled\.$/.test(sentence)) {
            if (!takeChosen(inherited?.chosenWeakness * 2, sentence)) return null;
            continue;
        }
        // "As failure, and the creature becomes Immobilized for 1 round or until they escape." — the inherited weakness, and a
        // condition the Effect grants; escaping ends only the condition (PF2e keeps the Effect when its grant is removed).
        const plus = /^As (?:success|failure), and the (?:creature|target) becomes ([A-Z][a-z-]+) for 1 round(?: or until (?:they|it) (?:\[\[\/act escape\]\]|Escapes?|escapes?))?\.$/.exec(sentence);
        if (plus) {
            if (!takeChosen(inherited?.chosenWeakness, sentence)) return null;
            const slug = plus[1].toLowerCase();
            const grant = [...unclaimed].find(rule => rule.key === "GrantItem" && CONDITION_SLUG[rule.uuid] === slug);
            if (!grant || (/until/.test(sentence) && grant.onDeleteActions?.grantee !== "detach")) return null;
            continue;
        }
        // "The target is Clumsy 1 and takes a –15-foot status penalty to all its Speeds for 1 minute.": the Speed modifier and the
        // Effect's grant of that condition at that value (1, or its badge raised to it). The Effect carries the condition.
        const speedCondition = /^The (?:target|creature) is ([A-Za-z-]+) (\d) and takes a [–−-](\d+)-foot (status|circumstance) penalty to all its Speeds for (\d+) (?:minute|round)s?\.$/.exec(sentence);
        if (speedCondition) {
            const slug = speedCondition[1].toLowerCase(), value = Number(speedCondition[2]);
            const badge = rule => rule.alterations == null ? 1 : rule.alterations.length === 1 && rule.alterations[0].property === "badge-value" && rule.alterations[0].mode === "upgrade" ? Number(rule.alterations[0].value) : null;
            if (!take(rule => rule.key === "FlatModifier" && JSON.stringify([rule.selector].flat()) === '["all-speeds"]' && rule.type === speedCondition[4]
                && Number(rule.value) === -Number(speedCondition[3]) && rule.predicate == null, sentence)) return null;
            const grant = [...unclaimed].find(rule => rule.key === "GrantItem" && CONDITION_SLUG[rule.uuid] === slug && badge(rule) === value);
            if (!grant) return null;
            unclaimed.delete(grant); carried.push(slug); speedSlug = active.find(rule => rule.key === "FlatModifier" && JSON.stringify([rule.selector].flat()) === '["all-speeds"]')?.slug ?? null;
            continue;
        }
        if (/^During this time, it can't benefit from bonuses to its Speeds or take other penalties to its Speeds\.$/.test(sentence)) {
            if (!speedSlug || !take(rule => rule.key === "AdjustModifier" && rule.predicate?.[0]?.not === `penalty:slug:${speedSlug}`, sentence)) return null;
            continue;
        }
        // "The target (gains the Immobilized condition and) takes a –10-foot circumstance penalty to its Speeds for 1 round."
        const speed = /^The (?:target|creature) (?:gains the ([A-Z][a-z-]+) condition and )?takes a [–−-](\d+)-foot (circumstance|status) penalty to (?:its|all its) Speeds for 1 round\.$/.exec(sentence);
        if (speed) {
            if (speed[1] && !active.some(rule => rule.key === "GrantItem" && CONDITION_SLUG[rule.uuid] === speed[1].toLowerCase())) return null;
            if (!take(rule => rule.key === "FlatModifier" && (rule.selector === "all-speeds" || JSON.stringify(rule.selector) === '["all-speeds"]') && rule.type === speed[3]
                && Number(rule.value) === -Number(speed[2]) && rule.predicate == null, sentence)) return null;
            if (speed[1]) named.add(speed[1].toLowerCase());
            continue;
        }
        // "The target takes full damage, is Off-Guard, and takes a –10-foot circumstance penalty to Speed." (the row's damage is compiled
        // with the row): the Effect's land-Speed modifier and its grant of that condition.
        const damageSpeed = /^The (?:target|creature) takes (?:full|half|double) damage, is ([A-Za-z-]+), and takes a [–−-](\d+)-foot (circumstance|status) penalty to Speed\.$/.exec(sentence);
        if (damageSpeed) {
            if (!active.some(rule => rule.key === "GrantItem" && CONDITION_SLUG[rule.uuid] === damageSpeed[1].toLowerCase())) return null;
            if (!take(rule => rule.key === "FlatModifier" && JSON.stringify([rule.selector].flat()) === '["land-speed"]' && rule.type === damageSpeed[3]
                && Number(rule.value) === -Number(damageSpeed[2]), sentence)) return null;
            continue;
        }
        // "It can attempt to Escape against your spell DC to remove the penalty (and the immobilized condition)." — Escaping
        // ends the whole Effect, so it must name every condition the Effect grants.
        const escape = /^It can attempt to Escape against your spell DC to remove the penalty(?: and the ([a-z-]+) condition)?\.$/.exec(sentence);
        if (escape) {
            const grants = active.filter(rule => rule.key === "GrantItem").map(rule => CONDITION_SLUG[rule.uuid]);
            if (JSON.stringify(grants) !== JSON.stringify(escape[1] ? [escape[1]] : [])) return null;
            escapeEnds = true; claims.push(sentence); continue;
        }
        // "It can attempt to [[/act escape]] against your spell DC." with the Effect granting Immobilized: a successful Escape ends the
        // Effect (PF2e's grant can't be escaped alone; a data note names what else ends with it).
        if (/^It can attempt to (?:\[\[\/act escape\]\]|Escape) against your spell DC\.$/.test(sentence)) {
            if (!active.some(rule => rule.key === "GrantItem" && CONDITION_SLUG[rule.uuid] === "immobilized")) return null;
            escapeEnds = true; claims.push(sentence); continue;
        }
        // "The spell can't be sustained." — only on a row with its own end ("until the end of your next turn").
        if (/^The spell can't be sustained\.$/.test(sentence)) {
            if (!/\buntil the end of your next turn\b/.test(text)) return null;
            claims.push(sentence); continue;
        }
        // "As failure, but the creature also takes a –2 circumstance penalty to attacks while it's off-guard."
        // "The creature takes a –2 circumstance penalty to the triggering Strike's attack roll." (Anchoring Air): a melee Strike modifier
        // PF2e removes after that roll.
        const triggering = /^The (?:creature|target) takes a [–−-](\d+) (circumstance|status) penalty to the triggering Strike's attack roll\.$/.exec(sentence);
        if (triggering) {
            if (!take(rule => rule.key === "FlatModifier" && ["melee-strike-attack-roll", "strike-attack-roll"].includes(rule.selector) && rule.type === triggering[2]
                && Number(rule.value) === -Number(triggering[1]) && rule.removeAfterRoll != null && rule.removeAfterRoll !== false, sentence)) return null;
            continue;
        }
        const penalty = /^(?:As failure, but )?the (?:creature|target) (?:also )?takes a [–−-](\d+) (circumstance|status) penalty to (?:attacks|attack rolls|all attack rolls)( while it's off-guard)?(?: until the end of its turn)?\.$/i.exec(sentence);
        if (penalty) {
            // "while it's off-guard": the same Effect grants the off-guard it lasts with.
            if (penalty[3] && !active.some(rule => rule.key === "GrantItem" && CONDITION_SLUG[rule.uuid] === "off-guard")) return null;
            if (!take(rule => rule.key === "FlatModifier" && ["attack", "attack-roll"].includes(rule.selector) && rule.type === penalty[2].toLowerCase()
                && Number(rule.value) === -Number(penalty[1]) && rule.removeAfterRoll == null, sentence)) return null;
        }
    }
    // Granted conditions are the row's own (compiled from its text); nothing else may be left unstated.
    const conditions = [...carried];
    for (const rule of unclaimed) {
        if (rule.key !== "GrantItem" || !CONDITION_SLUG[rule.uuid] || rule.alterations) return null;
        conditions.push(CONDITION_SLUG[rule.uuid]);
    }
    const levelWeakness = /\bgains a weakness to ([a-z]+) damage equal to (?:half )?your level\b/.exec(text)?.[1] ?? null;
    return { claims, conditions, ...(chosenWeakness != null ? { chosenWeakness } : {}), ...(levelWeakness ? { levelWeakness } : {}), ...(escapeEnds ? { escape: true } : {}) };
}

/** Bind a degree-choice Effect linked after the table to every degree it offers. */
export function compileDegreeChoiceNativeEffects(compilation, { sections = {}, lifecycle = {}, rank = null, heightenedDurations = null } = {}) {
    // The one linked Effect with a degree ChoiceSet (a row's own Effect, linked in that row, is left for the row's proof).
    const linked = Object.values(compilation.outcomes ?? {}).flat().filter((entry, index, all) => all.findIndex(other => other.uuid === entry.uuid) === index);
    const choosing = linked.filter(entry => degreeChoiceRules(entry.document?.mechanics?.rules, "failure"));
    if (!linked.length || compilation.unscoped?.length || (linked.length !== 1 && choosing.length !== 1)) return compilation;
    const effect = linked.length === 1 ? linked[0] : choosing[0];
    if (effect.recipient?.actor !== "target" || effect.scope !== "outcome" || effect.resolutionStatus !== "resolved" || effect.document?.type !== "effect") return compilation;
    const rules = effect.document.mechanics?.rules;
    const duration = effect.document.mechanics?.duration;
    const probe = degreeChoiceRules(rules, "failure");
    if (!probe) return compilation;
    // The Effect lasts one round from the start of the caster's next turn back to now: "until the start of your next
    // turn", or a spell lasting 1 round.
    const oneRound = duration?.value === 1 && duration.unit === "rounds" && duration.expiry === "turn-start" && duration.sustained === false;
    // Or the spell's own duration (a sustained spell's maximum, or its fixed duration).
    const spell = lifecycle.durationSpec?.mode === "sustained" ? lifecycle.durationSpec.maximum : lifecycle.durationSpec;
    const spellLong = spell?.mode === "fixed" && duration?.value === Number(spell.value) && duration.unit === spell.unit && duration.sustained === false;
    // Or the Effect's own fixed duration, which every row it's bound to states ("for 1 minute").
    const ownPhrase = duration?.sustained === false && Number.isInteger(duration.value) && ["minutes", "rounds"].includes(duration.unit)
        ? `for ${duration.value} ${duration.value === 1 ? duration.unit.replace(/s$/, "") : duration.unit}` : null;
    const ownStated = !oneRound && !spellLong && ownPhrase && probe.offered.every(value => {
        const degree = Object.keys(DEGREE_VALUE).find(key => DEGREE_VALUE[key] === value);
        return plainRow(String(sections[degree]?.text ?? "")).includes(`${ownPhrase}.`);
    });
    // Or one round ending at a turn's end, every row ending with the creature's own turn: "until the end of its turn" or the triggering
    // Strike's roll (a reaction during its turn; PF2e removes that modifier after the roll).
    const endOfItsTurn = !oneRound && !spellLong && !ownStated && duration?.value === 1 && duration.unit === "rounds" && duration.expiry === "turn-end" && duration.sustained === false
        && probe.offered.every(value => {
            const degree = Object.keys(DEGREE_VALUE).find(key => DEGREE_VALUE[key] === value);
            const plain = plainRow(String(sections[degree]?.text ?? ""));
            return /\buntil the end of its turn\.$/.test(plain) || /\bthe triggering Strike's attack roll\.$/.test(plain);
        });
    if (!oneRound && !spellLong && !ownStated && !endOfItsTurn) return compilation;
    const outcomes = Object.fromEntries(Object.entries(compilation.outcomes).map(([degree, entries]) => [degree, [...entries]]));
    const bound = {};
    const rowName = { success: "success", failure: "failure" };
    for (const [degree, value] of Object.entries(DEGREE_VALUE)) {
        const row = String(sections[degree]?.text ?? "").replace(effect.sourceText ?? "\u0000", "").trim();
        if (!probe.offered.includes(value)) {
            outcomes[degree] = (outcomes[degree] ?? []).filter(entry => entry !== effect);
            // "As failure, but the creature is also Immobilized until the start of its next turn." on a degree the Effect doesn't offer: the
            // named row's Effect, preset the same; the added condition is the row's own (compiled from its link).
            const also = /^As (failure|success), but the (?:creature|target) is also [A-Z][a-z-]+(?: \d)? until the start of its next turn\.$/.exec(plainRow(row));
            const from = also ? outcomes[also[1]]?.find(entry => entry.outcomeRule?.kind === "degree-choice") : null;
            if (endOfItsTurn && from) {
                outcomes[degree] = [...outcomes[degree], { ...from, degrees: [degree], outcomeRule: { ...from.outcomeRule, degree, inheritedRow: also[1] } }];
            }
            continue;
        }
        const { active, casterChoice } = degreeChoiceRules(rules, value);
        // "As success, …" reads the named row's proof.
        const named = /^As (success|failure)\b/.exec(plainRow(row))?.[1];
        const inherited = named ? bound[Object.keys(rowName).find(key => rowName[key] === named)] ?? null : null;
        const proof = proveDegreeChoiceRow(active, row, { rank, casterChoice, inherited });
        if (!proof) return compilation;
        const plain = plainRow(row);
        let timing;
        if (endOfItsTurn) timing = { durationAnchor: "target-turn", durationOffset: 0 };
        else if (ownStated) timing = { durationAnchor: "effect-start", durationOffset: 0 };
        else if (oneRound && /\buntil the beginning of its next turn\b/i.test(plain) || (oneRound && /^As failure\b/i.test(plain) && bound.failure?.targetTurn)) {
            timing = { durationAnchor: "target-turn", durationOffset: 1 };
            proof.targetTurn = true;
        } else if (oneRound) {
            const timed = /\buntil the start of your next turn\b/i.test(plain) || /^1 round$/i.test(String(lifecycle.durationSpec?.raw ?? lifecycle.duration ?? "").trim())
                || /^As failure\b/i.test(plain) || /\bfor 1 round\.(?:\s|$)/.test(plain) || (casterChoice && /^As success\b/.test(plain) && bound.success);
            if (!timed) return compilation;
            timing = { durationAnchor: "source-turn", durationOffset: 1 };
        } else if (/\buntil the end of your next turn\b/i.test(plain)) {
            // This row ends sooner than the Effect's own (the spell's) duration.
            timing = { durationAnchor: "source-turn", durationOffset: 1, durationOverride: { value: 1, unit: "rounds", expiry: "turn-end" } };
        } else if (!/\b(?:until|for \d|round|minute|hour)\b/i.test(plain)) {
            timing = { durationAnchor: "effect-start", durationOffset: 0 };
        } else return compilation;
        bound[degree] = proof;
        // The claims as the row writes them (links kept), so the residual-prose analysis matches its own clauses.
        const rowSentences = row.replace(/\s+/g, " ").trim().split(/(?<=\.)\s+(?=[A-Z@])/);
        const claims = proof.claims.map(claim => rowSentences.find(sentence => plainRow(sentence) === claim) ?? claim);
        outcomes[degree] = [{ ...effect, degrees: [degree], outcomeRule: { kind: "degree-choice", degree, rollOption: probe.choice.rollOption, selectionValue: value,
            claimText: claims.length === 1 ? claims[0] : null, claims, carriedConditions: proof.conditions,
            ...(proof.escape ? { escape: { dc: "spell" } } : {}),
            // "Heightened (2nd) The effects last for 2 rounds.": the created Effect's duration from that rank.
            ...(oneRound && heightenedDurations?.length ? { heightenedDurations: heightenedDurations.map(entry => ({ minRank: entry.minRank, value: entry.value, unit: entry.unit })) } : {}),
            ...(casterChoice ? { casterChoice: { flag: casterChoice.flag, values: casterChoice.values }, chosenWeakness: proof.chosenWeakness ?? null, ...(inherited ? { inherited: { chosenWeakness: inherited.chosenWeakness } } : {}) } : {}),
            ...(!casterChoice && inherited?.levelWeakness ? { inherited: { levelWeakness: inherited.levelWeakness } } : {}),
            rank, ...timing, templateDuration: duration } }];
    }
    if (!Object.keys(bound).length) return compilation;
    return { ...compilation, outcomes };
}

// A ChoiceSet that stores a number in a flag, one choice per degree ("PF2E.Check.Result.Degree.Check.failure": 1,
// "…criticalFailure": 2), and Weakness rules scaled by that number (Fungal Infestation:
// "floor(@item.level/2)*{item|flags.system.rulesSelections.fungalInfestation}").
const DEGREE_LABEL = /^PF2E\.Check\.Result\.Degree\.Check\.(success|failure|criticalFailure)$/;

/** The flag ChoiceSet, the value it offers per degree, and the rules at one degree's value; null when not this shape. */
export function degreeFlagRules(rules, degree) {
    if (!Array.isArray(rules)) return null;
    const choices = rules.filter(rule => rule.key === "ChoiceSet");
    if (choices.length !== 1) return null;
    const [choice] = choices;
    if (typeof choice.flag !== "string" || !/^[A-Za-z][A-Za-z0-9]*$/.test(choice.flag) || choice.rollOption) return null;
    const offered = {};
    for (const entry of choice.choices ?? []) {
        const label = DEGREE_LABEL.exec(String(entry?.label ?? ""));
        if (!label || !Number.isFinite(entry.value) || offered[label[1]] != null) return null;
        offered[label[1]] = entry.value;
    }
    if (!Object.keys(offered).length || offered[degree] == null) return offered[degree] == null && Object.keys(offered).length ? { choice, offered, active: null } : null;
    const references = [`{item|flags.system.rulesSelections.${choice.flag}}`, `@item.flags.system.rulesSelections.${choice.flag}`];
    const active = [];
    for (const rule of rules) {
        if (rule === choice) continue;
        if (rule.key !== "Weakness" || rule.predicate != null || typeof rule.value !== "string" && typeof rule.value !== "number") return null;
        let value = String(rule.value);
        for (const reference of references) value = value.split(reference).join(`(${offered[degree]})`);
        active.push({ ...rule, value });
    }
    return { choice, offered, active };
}

/**
 * “While it's taking this persistent poison damage, it has weakness 1 to fire and weakness 1 to slashing.”: exactly the
 * active Weakness rules at the cast rank. Returns {damageType, claimText} or null.
 */
export function proveDegreeFlagRow(active, rowText, { rank = null } = {}) {
    const text = plainRow(rowText);
    const found = /(?:^|\.\s)(While it's taking this persistent ([a-z]+) damage, it has (weakness \d+ to [a-z]+(?:(?:, | and |, and )weakness \d+ to [a-z]+)*)\.)$/.exec(text);
    if (!found || rank == null || !active?.length) return null;
    const stated = [...found[3].matchAll(/weakness (\d+) to ([a-z]+)/g)].map(([, value, type]) => `${type}:${value}`).sort();
    const given = active.flatMap(rule => {
        const value = ruleValueAtRank(rule.value, rank);
        return (Array.isArray(rule.type) ? rule.type : [rule.type]).map(type => `${type}:${value}`);
    }).sort();
    if (given.some(entry => /:null$/.test(entry)) || JSON.stringify(stated) !== JSON.stringify(given)) return null;
    return { damageType: found[2], claimText: found[1] };
}

/** Bind a flag-choice Effect linked after the table to each degree it offers, lasting while the persistent damage does. */
export function compileDegreeFlagNativeEffects(compilation, { sections = {}, rank = null, damageComponents = [] } = {}) {
    const linked = Object.values(compilation.outcomes ?? {}).flat();
    if (linked.length !== 1 || compilation.unscoped?.length) return compilation;
    const effect = linked[0];
    if (effect.recipient?.actor !== "target" || effect.scope !== "outcome" || effect.resolutionStatus !== "resolved" || effect.document?.type !== "effect") return compilation;
    const rules = effect.document.mechanics?.rules;
    const duration = effect.document.mechanics?.duration;
    const probe = Object.keys(DEGREE_VALUE).map(degree => degreeFlagRules(rules, degree)).find(Boolean);
    // The Effect's own duration is unlimited: it lasts while the persistent damage does.
    if (!probe || duration?.unit !== "unlimited" || duration.sustained) return compilation;
    const outcomes = Object.fromEntries(Object.entries(compilation.outcomes).map(([degree, entries]) => [degree, entries.filter(entry => entry !== effect)]));
    for (const degree of Object.keys(DEGREE_VALUE)) {
        if (probe.offered[degree] == null) continue;
        const { active } = degreeFlagRules(rules, degree);
        const row = String(sections[degree]?.text ?? "").replace(effect.sourceText ?? "\u0000", "").trim();
        const proof = proveDegreeFlagRow(active, row, { rank });
        if (!proof || !damageComponents.some(component => component.category === "persistent" && String(component.type).toLowerCase() === proof.damageType)) return compilation;
        outcomes[degree] = [...outcomes[degree], { ...effect, degrees: [degree], outcomeRule: { kind: "persistent-linked-degree-effect", degree, selectionFlag: probe.choice.flag,
            selectionValue: probe.offered[degree], damageType: proof.damageType, claimText: proof.claimText, rank, templateDuration: duration } }];
    }
    return { ...compilation, outcomes };
}

// ---------------------------------------------------------------------------------------------------------------------
// Penalty Effects the rows state: "The target takes a –1 status penalty to saves against your emotion effects" (Appeal to
// Authority), "… takes half damage and the penalty." with the penalty defined before the table ("cause it to take a -1
// status penalty to attack rolls against creatures other than you", Draw Ire), "the status penalty is –2". The Effect's
// FlatModifier must give exactly that penalty, its predicate exactly the stated qualifier.
const QUALIFIERS = [
    { text: "against your emotion effects", matches: predicate => Array.isArray(predicate) && predicate.length === 2
        && predicate.includes("item:trait:emotion") && predicate.includes("origin:signature:{item|origin.signature}") },
    { text: "against creatures other than you", matches: predicate => Array.isArray(predicate) && predicate.length === 1
        && JSON.stringify(predicate[0]) === JSON.stringify({ not: "target:signature:{item|origin.signature}" }) },
    // (PF2e's Pact Broker Effect has no predicate: it applies the penalty to every attack and damage roll; a data note says so.)
    { text: "against you and your allies", matches: predicate => predicate == null, dataNote: true }
];
const PENALTY_SELECTORS = { "saves": ["saving-throw"], "saving throws": ["saving-throw"], "attack rolls": ["attack", "attack-roll"], "attack and damage rolls": [["attack-roll", "damage"]] };
const PENALTY = new RegExp(String.raw`\b(?:takes?|taking) a [–−-](\d) (status|circumstance) penalty to (saves|saving throws|attack rolls|attack and damage rolls) (${QUALIFIERS.map(qualifier => qualifier.text).join("|")})`);
const RECURRING_END = /, but can attempt another (Fortitude|Reflex|Will) save at the end of each of its turns, ending the spell's effect on a success\.$/;
const NARRATION_RULES = /\d|@|\b(?:damage|save|bonus|penalty|immune|condition|can't|must|round|minute|turn|spell)\b/i;

const plainSentences = text => plainRow(text).split(/(?<=\.)\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);

/** "… take a -1 status penalty to attack rolls against creatures other than you." in the text before the table. */
export function preamblePenalty(preambleText) {
    const found = plainSentences(preambleText).map(sentence => ({ sentence, match: /\bcause it to take a [–−-](\d) (status|circumstance) penalty to (saves|saving throws|attack rolls) (against [a-z ]+?)\.$/.exec(sentence) })).filter(entry => entry.match);
    if (found.length !== 1 || !QUALIFIERS.some(qualifier => qualifier.text === found[0].match[4])) return null;
    const [{ sentence, match }] = found;
    return { sentence, penalty: { value: Number(match[1]), type: match[2], statistic: match[3], qualifier: match[4] } };
}

/** A row's penalty (with an optional recurring save and a target-turn end), or null when anything else is stated. */
export function parsePenaltyRow(rowText, { preamble = null, inherited = null } = {}) {
    let penalty = null, recurring = null, endsAfterTargetTurn = false;
    const claims = [];
    for (const sentence of plainSentences(rowText)) {
        let match;
        if ((match = /^The (?:target|creature) takes (?:half|full|double) damage and the penalty\.$/.exec(sentence)) && preamble) { penalty = { ...preamble }; claims.push(sentence); continue; }
        if ((match = /^The (?:target|creature) takes (?:half|full|double) damage, and the status penalty is [–−-](\d)\.$/.exec(sentence)) && preamble) { penalty = { ...preamble, value: Number(match[1]) }; claims.push(sentence); continue; }
        if ((match = /^As failure, (?:except the status penalty|but the penalty) is [–−-](\d)\.$/.exec(sentence)) && inherited) { penalty = { ...inherited, value: Number(match[1]) }; claims.push(sentence); continue; }
        // "The target takes full damage and a –1 status penalty to attack and damage rolls against you and your allies for the hex's duration."
        if ((match = new RegExp(String.raw`^The (?:target|creature) takes (?:half|full|double) damage and a [–−-](\d) (status|circumstance) penalty to (attack and damage rolls) (against you and your allies) for the (?:hex|spell)'s duration\.$`).exec(sentence)) && !penalty) {
            penalty = { value: Number(match[1]), type: match[2], statistic: match[3], qualifier: match[4], spellLong: true }; claims.push(sentence); continue;
        }
        if (/^The spell ends at the end of the target's next turn\.$/.test(sentence)) { endsAfterTargetTurn = true; claims.push(sentence); continue; }
        if ((match = PENALTY.exec(sentence)) && !penalty) {
            // Words before the penalty may only be narration ("The target believes the resemblance and is susceptible to
            // your influence, taking …"); after it, only the recurring save.
            const before = sentence.slice(0, match.index).replace(/^The (?:target|creature)\s*/, "");
            const after = sentence.slice(match.index + match[0].length);
            if (NARRATION_RULES.test(before)) return null;
            const recurs = RECURRING_END.exec(after);
            if (after !== "." && !(recurs && recurs.index === 0)) return null;
            if (recurs) recurring = { mode: "end", statistic: recurs[1].toLowerCase() };
            penalty = { value: Number(match[1]), type: match[2], statistic: match[3], qualifier: match[4] };
            claims.push(sentence); continue;
        }
        // Narration with no rule in it ("The target harbors some small resentment toward the authority figure you invoked.").
        if (!NARRATION_RULES.test(sentence)) { claims.push(sentence); continue; }
        return null;
    }
    return penalty ? { penalty, recurring, endsAfterTargetTurn, claims } : null;
}

/** Whether a FlatModifier gives exactly the stated penalty (value may be the flag's chosen value). */
function modifierGives(rule, penalty, value = rule.value) {
    const selectors = Array.isArray(rule.selector) ? rule.selector : [rule.selector];
    const qualifier = QUALIFIERS.find(entry => entry.text === penalty.qualifier);
    const sameSelectors = expected => Array.isArray(expected) ? selectors.length === expected.length && expected.every(selector => selectors.includes(selector)) : selectors.length === 1 && selectors[0] === expected;
    return rule.key === "FlatModifier" && rule.type === penalty.type && Number(value) === -penalty.value && rule.removeAfterRoll == null
        && PENALTY_SELECTORS[penalty.statistic].some(sameSelectors) && qualifier?.matches(rule.predicate);
}

/** The flag ChoiceSet (degree-labelled values) and one FlatModifier reading it; null when the Effect isn't this shape. */
export function flagModifierShape(rules) {
    if (!Array.isArray(rules) || rules.length !== 2) return null;
    const choice = rules.find(rule => rule.key === "ChoiceSet"), modifier = rules.find(rule => rule.key === "FlatModifier");
    if (!choice || !modifier || typeof choice.flag !== "string" || choice.rollOption) return null;
    if (![`@item.flags.system.rulesSelections.${choice.flag}`, `{item|flags.system.rulesSelections.${choice.flag}}`].includes(modifier.value)) return null;
    const offered = {};
    for (const entry of choice.choices ?? []) {
        const label = DEGREE_LABEL.exec(String(entry?.label ?? ""));
        if (!label || !Number.isFinite(Number(entry.value)) || offered[label[1]] != null) return null;
        offered[label[1]] = entry.value;
    }
    return Object.keys(offered).length ? { choice, modifier, offered } : null;
}

/** Proof that a flag Effect preset to a degree gives the row's penalty. */
export function proveFlagModifier(rules, degree, penalty) {
    const shape = flagModifierShape(rules);
    if (!shape || shape.offered[degree] == null) return null;
    return modifierGives(shape.modifier, penalty, shape.offered[degree]) ? { flag: shape.choice.flag, value: shape.offered[degree] } : null;
}

/** Proof that a plain Effect's one FlatModifier gives the row's penalty. */
export function proveStaticModifier(rules, penalty) {
    return Array.isArray(rules) && rules.length === 1 && modifierGives(rules[0], penalty);
}

/**
 * Bind penalty Effects to the rows that state them: a flag Effect (linked after the table) on each degree it offers,
 * lasting the spell's own duration; a row's own plain Effect, lasting until the end of the target's next turn when the
 * row says the spell ends then. Returns {compilation, preambleSentence} or null when nothing was bound.
 */
export function compilePenaltyEffects(compilation, { sections = {}, lifecycle = {}, preambleText = "", heldDuration = null } = {}) {
    const entries = [...new Set(Object.values(compilation.outcomes ?? {}).flat())];
    if (!entries.length || compilation.unscoped?.length || entries.some(entry => entry.recipient?.actor !== "target" || entry.scope !== "outcome" || entry.resolutionStatus !== "resolved")) return null;
    // (The same flag Effect linked in several rows is one Effect.)
    const flagged = entries.filter(entry => flagModifierShape(entry.document?.mechanics?.rules)).filter((entry, index, all) => all.findIndex(other => other.uuid === entry.uuid) === index);
    if (flagged.length > 1) return null;
    const pre = preamblePenalty(preambleText);
    const spell = lifecycle.durationSpec;
    const outcomes = Object.fromEntries(Object.entries(compilation.outcomes).map(([degree, list]) => [degree, list.filter(entry => !flagged.some(flag => flag.uuid === entry.uuid))]));
    const rows = {};
    for (const degree of ["success", "failure", "criticalFailure"]) {
        const row = entries.reduce((text, entry) => text.replace(entry.sourceText ?? "\u0000", ""), String(sections[degree]?.text ?? "")).trim();
        rows[degree] = parsePenaltyRow(row, { preamble: pre?.penalty, inherited: rows.failure?.penalty });
    }
    let bound = 0;
    // The row's own Effect (not the flag Effect): a fixed penalty, with its own end.
    for (const [degree, list] of Object.entries(outcomes)) {
        outcomes[degree] = list.map(entry => {
            const parsed = rows[degree];
            const duration = entry.document?.mechanics?.duration;
            if (!parsed || !proveStaticModifier(entry.document?.mechanics?.rules, parsed.penalty) || parsed.recurring) return entry;
            const turnEnd = parsed.endsAfterTargetTurn && duration?.value === 1 && duration.unit === "rounds" && duration.expiry === "turn-end" && !duration.sustained;
            if (!turnEnd) return entry;
            bound++;
            return { ...entry, degrees: [degree], outcomeRule: { kind: "penalty-effect", degree, penalty: parsed.penalty, claims: parsed.claims, claimText: parsed.claims.length === 1 ? parsed.claims[0] : null,
                durationAnchor: "target-turn", durationOffset: 1, templateDuration: duration } };
        });
    }
    // The flag Effect: on every degree it offers, lasting the spell's fixed duration.
    if (flagged.length) {
        const [entry] = flagged;
        const duration = entry.document.mechanics.duration;
        // (Or a spell held on its target by a trigger: the spell's own duration, which the rows state as "for the hex's duration".)
        const spellLong = (spell?.mode === "fixed" && duration?.value === Number(spell.value) && duration.unit === spell.unit && !duration.sustained)
            || (heldDuration != null && duration?.value === heldDuration.value && duration.unit === heldDuration.unit && !duration.sustained);
        const shape = flagModifierShape(entry.document.mechanics.rules);
        if (!spellLong) return null;
        for (const degree of Object.keys(shape.offered)) {
            const parsed = rows[degree];
            const proof = parsed && !parsed.endsAfterTargetTurn ? proveFlagModifier(entry.document.mechanics.rules, degree, parsed.penalty) : null;
            if (!proof) return null;
            outcomes[degree] = [...outcomes[degree], { ...entry, degrees: [degree], outcomeRule: { kind: "flag-penalty-effect", degree, selectionFlag: proof.flag, selectionValue: proof.value,
                penalty: parsed.penalty, claims: parsed.claims, claimText: parsed.claims.length === 1 ? parsed.claims[0] : null, ...(parsed.recurring ? { recurringSave: parsed.recurring } : {}),
                durationAnchor: "effect-start", durationOffset: 0, templateDuration: duration } }];
            bound++;
        }
    }
    if (!bound) return null;
    // Every row that states a penalty must have its Effect.
    for (const degree of ["success", "failure", "criticalFailure"]) {
        if (rows[degree] && !outcomes[degree].some(entry => entry.outcomeRule && ["penalty-effect", "flag-penalty-effect"].includes(entry.outcomeRule.kind))) return null;
    }
    return { compilation: { ...compilation, outcomes }, preambleSentence: pre?.sentence ?? null };
}

// ---------------------------------------------------------------------------------------------------------------------
// An Effect linked after the table whose rules one row states, applied on that row and on rows that are "As <that row>":
//   "The target loses any immunity to bleed and is considered to be a creature with blood for the purposes of effects and
//   requirements." (Blood Infusion: Immunity, mode remove, bleed)
const IMMUNITY_LOSS = /^The (?:target|creature) loses any immunity to ([a-z]+)( and is considered to be a creature with blood for the purposes of effects and requirements)?\.$/;

/** Whether the Effect's rules are exactly what the sentence states. */
// "The target takes a -1 status penalty to Perception, attack rolls, and Will saves. This penalty increases to -2 for Will saves
// against sleep effects.": one FlatModifier on exactly those statistics, and an AdjustModifier overriding the Will penalty for
// effects with that trait. Nothing else.
const STAT_WORDS = { Perception: "perception", "attack rolls": "attack", "Will saves": "will", "Fortitude saves": "fortitude", "Reflex saves": "reflex", AC: "ac" };
const LISTED_PENALTY = /^The target takes a [–−-]([1-4]) (status|circumstance) penalty to ((?:Perception|attack rolls|AC|(?:Fortitude|Reflex|Will) saves)(?:, (?:Perception|attack rolls|AC|(?:Fortitude|Reflex|Will) saves))*,? and (?:Perception|attack rolls|AC|(?:Fortitude|Reflex|Will) saves))\. This penalty increases to [–−-]([1-4]) for (Fortitude|Reflex|Will) saves against ([a-z]+) effects\.$/;

function proveListedPenalty(rules, sentence) {
    const match = LISTED_PENALTY.exec(plainRow(sentence));
    if (!match || !Array.isArray(rules) || rules.length !== 2) return false;
    const stats = match[3].split(/,\s*(?:and\s+)?|\s+and\s+/).map(word => STAT_WORDS[word.trim()]);
    const flat = rules.find(rule => rule.key === "FlatModifier"), adjust = rules.find(rule => rule.key === "AdjustModifier");
    return !!flat && !!adjust && stats.every(Boolean) && flat.predicate == null && flat.type === match[2] && Number(flat.value) === -Number(match[1])
        && JSON.stringify([flat.selector].flat().sort()) === JSON.stringify([...stats].sort())
        && adjust.mode === "override" && adjust.selector === match[5].toLowerCase() && Number(adjust.value) === -Number(match[4])
        && JSON.stringify(adjust.predicate) === JSON.stringify([`item:trait:${match[6]}`]) && stats.includes(match[5].toLowerCase());
}

// "The target gains weakness 3 to physical damage.": exactly one Weakness rule of that type, worth that at the spell's rank.
const STATED_WEAKNESS = /^The (?:target|creature) gains weakness (\d+) to ([a-z]+) damage\.$/;

export function proveStatedEffect(rules, sentence, { rank = null } = {}) {
    if (proveListedPenalty(rules, sentence)) return true;
    const weakness = STATED_WEAKNESS.exec(plainRow(sentence));
    if (weakness) return Array.isArray(rules) && rules.length === 1 && rules[0].key === "Weakness" && rules[0].predicate == null
        && rules[0].type === weakness[2] && rank != null && ruleValueAtRank(rules[0].value, rank) === Number(weakness[1]);
    const match = IMMUNITY_LOSS.exec(plainRow(sentence));
    if (!match || (match[2] && match[1] !== "bleed") || !Array.isArray(rules) || rules.length !== 1) return false;
    const [rule] = rules;
    return rule.key === "Immunity" && rule.mode === "remove" && rule.type === match[1] && rule.predicate == null;
}

export function compileStatedEffect(compilation, { sections = {}, lifecycle = {}, rank = null } = {}) {
    // (One link after the table is listed in each row it could belong to: the same Effect.)
    const linked = Object.values(compilation.outcomes ?? {}).flat().filter((entry, index, all) => all.findIndex(other => other.uuid === entry.uuid) === index);
    if (linked.length !== 1 || compilation.unscoped?.length) return null;
    const [effect] = linked;
    if (effect.recipient?.actor !== "target" || effect.scope !== "outcome" || effect.resolutionStatus !== "resolved" || effect.document?.type !== "effect") return null;
    const rules = effect.document.mechanics?.rules, duration = effect.document.mechanics?.duration;
    const spell = lifecycle.durationSpec;
    // The spell's fixed duration, or a sustained spell's maximum with PF2e's sustained Effect.
    const fixed = spell?.mode === "fixed" && duration?.value === Number(spell.value) && duration.unit === spell.unit && !duration.sustained;
    const sustained = spell?.mode === "sustained" && spell.maximum?.mode === "fixed" && duration?.value === Number(spell.maximum.value)
        && duration.unit === spell.maximum.unit && duration.sustained === true;
    if (!fixed && !sustained) return null;
    const rowOf = degree => String(sections[degree]?.text ?? "").replace(effect.sourceText ?? "\u0000", "").trim();
    const stating = {};
    for (const degree of ["success", "failure", "criticalFailure"]) {
        // A single sentence, or two in a row (a penalty and its "This penalty increases …").
        const sentences = plainSentences(rowOf(degree));
        const candidates = [...sentences, ...sentences.slice(1).map((sentence, index) => `${sentences[index]} ${sentence}`)];
        const sentence = candidates.find(candidate => proveStatedEffect(rules, candidate, { rank }));
        if (sentence) stating[degree] = sentence;
    }
    if (Object.keys(stating).length !== 1) return null;
    const [[source, claim]] = Object.entries(stating);
    const label = { success: "success", failure: "failure", criticalFailure: "critical failure" }[source];
    const outcomes = Object.fromEntries(Object.entries(compilation.outcomes).map(([degree, list]) => [degree, list.filter(entry => entry.uuid !== effect.uuid)]));
    for (const degree of ["success", "failure", "criticalFailure"]) {
        const inherits = new RegExp(`^As ${label}\\b`, "i").test(plainRow(rowOf(degree)));
        if (degree !== source && !inherits) continue;
        outcomes[degree] = [...outcomes[degree], { ...effect, degrees: [degree], outcomeRule: { kind: "stated-effect", degree, claimText: claim, claims: plainSentences(claim), rank,
            durationAnchor: "effect-start", durationOffset: 0, templateDuration: duration } }];
    }
    return { ...compilation, outcomes };
}

// ---------------------------------------------------------------------------------------------------------------------
// A flag ChoiceSet whose values are objects {badge, degree}, one per degree (Overstuff): a RollOption "<flag>:{…degree}",
// a GrantItem condition whose badge is the chosen badge, Speed penalties that apply only while the creature has that
// condition, and an optional description addendum for one degree. Nothing else.
const GRANTED_CONDITION = Object.freeze({ "Compendium.pf2e.conditionitems.Item.fesd1n5eVhpCSS18": "sickened" });
const KEBAB_DEGREE = Object.freeze({ success: "success", failure: "failure", criticalFailure: "critical-failure" });

/** The object-valued degree ChoiceSet and what its Effect gives; null when the Effect isn't exactly this shape. */
export function degreeObjectRules(rules) {
    if (!Array.isArray(rules)) return null;
    const by = key => rules.filter(rule => rule.key === key);
    const [choice] = by("ChoiceSet"), [option] = by("RollOption"), [grant] = by("GrantItem");
    if (by("ChoiceSet").length !== 1 || by("RollOption").length !== 1 || by("GrantItem").length !== 1) return null;
    if (typeof choice.flag !== "string" || !/^[A-Za-z][A-Za-z0-9]*$/.test(choice.flag) || choice.rollOption || !Array.isArray(choice.choices)) return null;
    const flag = choice.flag, offered = {};
    for (const entry of choice.choices) {
        const label = DEGREE_LABEL.exec(String(entry?.label ?? "")), value = entry?.value;
        if (!label || offered[label[1]] || !value || typeof value !== "object" || Object.keys(value).sort().join() !== "badge,degree"
            || !Number.isInteger(value.badge) || value.badge < 1 || value.badge > 4 || value.degree !== KEBAB_DEGREE[label[1]]) return null;
        offered[label[1]] = { badge: value.badge, degree: value.degree };
    }
    if (!Object.keys(offered).length) return null;
    if (option.option !== `${flag}:{item|flags.system.rulesSelections.${flag}.degree}` || option.predicate != null) return null;
    const slug = GRANTED_CONDITION[grant.uuid];
    if (!slug || grant.onDeleteActions?.grantee !== "cascade" || grant.predicate != null
        || JSON.stringify(grant.alterations) !== JSON.stringify([{ mode: "override", property: "badge-value", value: `@item.flags.system.rulesSelections.${flag}.badge` }])) return null;
    const speeds = [];
    let addendum = null;
    for (const rule of rules) {
        if ([choice, option, grant].includes(rule)) continue;
        if (rule.key === "FlatModifier") {
            const selector = [rule.selector].flat();
            if (JSON.stringify(rule.predicate) !== JSON.stringify([`self:condition:${slug}`]) || selector.length !== 1 || !["land-speed", "all-speeds"].includes(selector[0])
                || !["status", "circumstance"].includes(rule.type) || !Number.isInteger(rule.value) || rule.value >= 0) return null;
            speeds.push({ selector: selector[0], type: rule.type, value: rule.value });
            continue;
        }
        // A text addendum on the granted condition for one degree (PF2e's own wording of the row's extra).
        if (rule.key === "ItemAlteration" && !addendum && rule.itemType === "condition" && rule.mode === "add" && rule.property === "description"
            && Array.isArray(rule.predicate) && rule.predicate.length === 2 && rule.predicate[0] === "item:granter:id:{item|id}") {
            const degree = Object.keys(KEBAB_DEGREE).find(key => rule.predicate[1] === `${flag}:${KEBAB_DEGREE[key]}`);
            if (!degree || !offered[degree]) return null;
            addendum = degree; continue;
        }
        return null;
    }
    return { flag, offered, condition: slug, speeds, addendum };
}

/**
 * Bind such an Effect linked after the table to each degree it offers. Each row states exactly the granted condition at
 * the chosen badge; one preamble sentence states the Speed penalty while the condition lasts ("A target sickened by this
 * spell takes a –10-foot status penalty to its Speed until it's no longer sickened."); the addendum's degree row may say
 * one more clause after its condition (", but if it spends an action to end the condition, it succeeds automatically").
 */
export function compileDegreeObjectNativeEffects(compilation, { sections = {}, preambleText = "" } = {}) {
    const linked = Object.values(compilation.outcomes ?? {}).flat();
    if (linked.length !== 1 || compilation.unscoped?.length) return null;
    const effect = linked[0];
    if (effect.recipient?.actor !== "target" || effect.scope !== "outcome" || effect.resolutionStatus !== "resolved" || effect.document?.type !== "effect") return null;
    const shape = degreeObjectRules(effect.document.mechanics?.rules);
    const duration = effect.document.mechanics?.duration;
    if (!shape || shape.speeds.length !== 1 || duration?.unit !== "unlimited" || duration.sustained) return null;
    const [speed] = shape.speeds;
    const sentence = new RegExp(String.raw`(?:^|(?<=[.!?]\s))A (?:target|creature) ${shape.condition} by this spell takes a [–−-]${-speed.value}-foot ${speed.type} penalty to its ${speed.selector === "land-speed" ? "Speed" : "Speeds"} until it's no longer ${shape.condition}\.(?=\s|$)`)
        .exec(String(preambleText).replace(/\s+/g, " "));
    if (!sentence) return null;
    const outcomes = Object.fromEntries(Object.entries(compilation.outcomes).map(([degree, entries]) => [degree, entries.filter(entry => entry !== effect)]));
    for (const degree of Object.keys(DEGREE_VALUE)) {
        const offered = shape.offered[degree];
        const row = plainRow(String(sections[degree]?.text ?? "").replace(effect.sourceText ?? "\u0000", ""));
        // A degree the Effect doesn't offer must not give its condition.
        if (!offered) { if (new RegExp(String.raw`\b${shape.condition}\b`, "i").test(row)) return null; continue; }
        // The row is exactly the granted condition at the chosen badge (and the addendum's clause on its degree).
        const name = `${shape.condition} ${offered.badge}`;
        const bare = new RegExp(String.raw`^The (?:target|creature) is ${name}\.$`, "i");
        const extra = new RegExp(String.raw`^The (?:target|creature) is ${name}, but if it spends an action to end the condition, it succeeds automatically\.$`, "i");
        const claims = [];
        if (shape.addendum === degree) { if (!extra.test(row)) return null; claims.push(String(sections[degree]?.text ?? "").replace(effect.sourceText ?? "\u0000", "").replace(/\s+/g, " ").trim()); }
        else if (!bare.test(row)) return null;
        outcomes[degree] = [...outcomes[degree], { ...effect, degrees: [degree], outcomeRule: { kind: "degree-object-effect", degree, selectionFlag: shape.flag,
            selectionValue: offered, carriedConditions: [shape.condition], claims, claimText: claims[0] ?? null, templateDuration: duration } }];
    }
    return { compilation: { ...compilation, outcomes }, preambleSentence: sentence[0] };
}
