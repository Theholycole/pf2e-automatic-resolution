// What a PF2e Effect does to one recipient, read from its rules, so the text's
// claim ("it also gains a +2 status bonus to AC for 1 round") can be proved
// against the Effect instead of trusted. Only FlatModifier and AdjustModifier
// rules are read, and only predicates whose truth follows from the recipient:
// whether it is the caster (the Effect's origin) and whether it is undead.
// Anything else makes the Effect unprovable (null).

const ATOMS = {
    "self:mode:undead": context => context.undead,
    "self:signature:{item|origin.signature}": context => context.self
};
const FLAT_KEYS = new Set(["key", "selector", "type", "value", "predicate", "hideIfDisabled", "slug", "label"]);
const ADJUST_KEYS = new Set(["key", "mode", "predicate", "selector", "slug", "value"]);
const TYPES = new Set(["status", "circumstance", "item"]);

function holds(predicate, context) {
    if (predicate == null) return true;
    if (!Array.isArray(predicate)) return null;
    let result = true;
    for (const term of predicate) {
        let value;
        if (typeof term === "string") value = ATOMS[term]?.(context);
        else if (term && typeof term === "object" && Object.keys(term).length === 1 && typeof term.not === "string") {
            const inner = ATOMS[term.not]?.(context);
            value = inner == null ? undefined : !inner;
        }
        if (typeof value !== "boolean") return null;
        result &&= value;
    }
    return result;
}

/** PF2e's rule-element slug for an Effect's own modifiers: its name without the "Spell Effect:" prefix. */
export function effectModifierSlug(name) {
    return String(name ?? "").replace(/^[^:]+:\s*|\s*\([^)]+\)$/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * The modifiers the Effect gives a recipient ({self, undead}), as [{selector, type, value}] sorted,
 * or null when a rule or predicate can't be read.
 */
export function effectModifiers(effect, context) {
    const rules = effect?.rules;
    if (!Array.isArray(rules) || !rules.length) return null;
    const slug = effectModifierSlug(effect.name);
    const modifiers = [];
    for (const rule of rules.filter(rule => rule?.key === "FlatModifier")) {
        if (Object.keys(rule).some(key => !FLAT_KEYS.has(key)) || typeof rule.selector !== "string"
            || !TYPES.has(rule.type) || !Number.isInteger(rule.value) || rule.value === 0) return null;
        const active = holds(rule.predicate, context);
        if (active == null) return null;
        if (active) modifiers.push({ selector: rule.selector, type: rule.type, value: rule.value, slug: rule.slug ?? slug });
    }
    for (const rule of rules.filter(rule => rule?.key !== "FlatModifier")) {
        if (rule?.key !== "AdjustModifier" || Object.keys(rule).some(key => !ADJUST_KEYS.has(key))
            || !["downgrade", "upgrade", "override"].includes(rule.mode) || !Number.isInteger(rule.value)) return null;
        // Only this Effect's own modifier (same selector and slug) may be adjusted.
        const own = modifiers.filter(modifier => modifier.selector === rule.selector && modifier.slug === rule.slug);
        if (rule.slug !== slug || rules.filter(other => other.key === "FlatModifier" && other.selector === rule.selector).length !== 1) return null;
        const active = holds(rule.predicate, context);
        if (active == null) return null;
        if (!active) continue;
        for (const modifier of own) {
            modifier.value = rule.mode === "override" ? rule.value
                : rule.mode === "downgrade" ? Math.min(modifier.value, rule.value) : Math.max(modifier.value, rule.value);
        }
    }
    return modifiers.map(({ selector, type, value }) => ({ selector, type, value }))
        .sort((a, b) => a.selector.localeCompare(b.selector));
}

/** A one-round Effect (PF2e's "for 1 round"). */
export function isOneRoundEffect(mechanics) {
    return mechanics?.duration?.unit === "rounds" && mechanics.duration.value === 1 && mechanics.duration.sustained !== true;
}

/**
 * The proof that an Effect gives exactly the claimed modifiers to its recipient:
 * {kind: "text-modifier", context: {self, undead}, modifiers: [...]}. The document is the
 * compiled catalog snapshot ({name, mechanics}) or a live template.
 */
export function inspectTextModifierProof(proof, document) {
    if (proof?.kind !== "text-modifier" || typeof proof.context?.self !== "boolean" || typeof proof.context?.undead !== "boolean"
        || !Array.isArray(proof.modifiers) || !proof.modifiers.length || typeof proof.claimText !== "string") return { supported: false, reason: "modifier proof is missing" };
    const mechanics = document?.mechanics ?? { rules: document?.system?.rules, duration: document?.system?.duration };
    if (!isOneRoundEffect(mechanics)) return { supported: false, reason: "the Effect doesn't last 1 round" };
    const actual = effectModifiers({ name: document?.name, rules: mechanics.rules }, proof.context);
    if (!actual || JSON.stringify(actual) !== JSON.stringify(proof.modifiers)) return { supported: false, reason: "the Effect's modifiers don't match the text" };
    return { supported: true, reason: null };
}

/**
 * Whether a recipient is the one the proof was made for: the caster or not, undead or not.
 * An Effect is applied only to a matching recipient; for any other it would give different modifiers.
 */
export function recipientMatchesProof(proof, actor, sourceActorUuid) {
    if (!proof?.context || !actor) return false;
    const traits = actor.traits && typeof actor.traits.has === "function" ? actor.traits : new Set(actor.system?.traits?.value ?? []);
    return proof.context.self === (actor.uuid === sourceActorUuid) && proof.context.undead === traits.has("undead");
}

function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonical(child)]));
    return value;
}

/** The live Effect's rules, duration and start are the ones the compiler proved. */
export function sameEffectMechanics(left, right) {
    return JSON.stringify(canonical(left ?? null)) === JSON.stringify(canonical(right ?? null));
}

const CLAIM_WORDS = { "saving-throw": String.raw`(?:saves|saving throws)`, ac: "AC", "attack-roll": "attack rolls", damage: "damage rolls" };

/**
 * An Effect that lasts as long as the spell's persistent damage ("As long as the target is taking persistent damage from
 * this spell, …"): it must have no timer of its own, and each of its rules must be stated by the text. FlatModifier:
 * "a –1 status penalty to saves". EphemeralEffect on the attacker (affects origin): "creatures gain a +1 status bonus to
 * attack rolls … against the target". Any other rule is refused.
 */
export function inspectLinkedEffectClaim(document, claimText) {
    const mechanics = document?.mechanics ?? { rules: document?.system?.rules, duration: document?.system?.duration };
    const claim = String(claimText ?? "").replace(/[–−]/g, "-");
    const rules = mechanics?.rules;
    // (An encounter-long Effect whose every rule applies only while the creature has persistent damage lasts, in effect, with it.)
    const persistentOnly = Array.isArray(rules) && rules.length > 0
        && rules.every(rule => Array.isArray(rule?.predicate) && rule.predicate.length === 1 && /^self:condition:persistent-damage:[a-z]+$/.test(rule.predicate[0]));
    if (mechanics?.duration?.unit !== "unlimited" && !(mechanics?.duration?.unit === "encounter" && persistentOnly)) return { supported: false, reason: "the Effect has its own duration" };
    if (!Array.isArray(rules) || !rules.length) return { supported: false, reason: "the Effect has no rules" };
    for (const rule of rules) {
        // "A creature taking persistent damage from this spell takes a –10-foot status penalty to its Speeds."
        if (rule?.key === "FlatModifier" && rule.selector === "all-speeds" && Number.isInteger(rule.value) && rule.value < 0 && TYPES.has(rule.type)) {
            if (!new RegExp(String.raw`\ba -${Math.abs(rule.value)}-foot ${rule.type} penalty to (?:its|their) Speeds\b`, "i").test(claim)) return { supported: false, reason: "the text doesn't state the Effect's Speed penalty" };
            continue;
        }
        if (rule?.key === "FlatModifier" && Number.isInteger(rule.value) && CLAIM_WORDS[rule.selector] && TYPES.has(rule.type)) {
            const stated = new RegExp(String.raw`\ba ${rule.value < 0 ? "-" : "\\+"}${Math.abs(rule.value)} ${rule.type} ${rule.value < 0 ? "penalty" : "bonus"} to ${CLAIM_WORDS[rule.selector]}\b`, "i");
            if (!stated.test(claim)) return { supported: false, reason: `the text doesn't state the Effect's ${rule.selector} modifier` };
        } else if (rule?.key === "Weakness" && Number.isInteger(rule.value) && rule.value > 0
            && (rule.predicate == null || (Array.isArray(rule.predicate) && rule.predicate.length === 1 && /^self:condition:persistent-damage:[a-z]+$/.test(rule.predicate[0])))) {
            // "the target has weakness 1 to piercing and slashing damage" (a predicate may limit it to the persistent damage it lasts with).
            const types = Array.isArray(rule.type) ? rule.type : [rule.type];
            if (!types.every(type => /^[a-z]+$/.test(type ?? "")) || !new RegExp(String.raw`\bweakness ${rule.value} to ${types.join(" and ")}(?: damage)?\.`, "i").test(claim)) return { supported: false, reason: "the text doesn't state the Effect's weakness" };
        } else if (rule?.key === "EphemeralEffect" && rule.affects === "origin" && Array.isArray(rule.selectors) && rule.selectors.length
            && rule.selectors.every(selector => CLAIM_WORDS[selector])) {
            const stated = rule.selectors.every(selector => new RegExp(String.raw`\bcreatures gain an? \+\d+ (?:status|circumstance) bonus to ${CLAIM_WORDS[selector]}\b[^.]*\bagainst the target\b`, "i").test(claim));
            if (!stated) return { supported: false, reason: "the text doesn't state the Effect's bonus for attackers" };
        } else return { supported: false, reason: `the Effect's ${rule?.key ?? "unknown"} rule isn't read` };
    }
    return { supported: true, reason: null };
}

/**
 * A caster benefit stated by a spell attack ("you gain a +1 circumstance bonus to your AC for the duration", "you gain a
 * fly Speed of 15 feet until the end of your next turn", "you gain 1d4 temporary Hit Points that last until the
 * beginning of your next turn") against the linked Effect: every rule must be stated, and its duration must be the
 * stated one. Rules read: FlatModifier (AC, saves, attack rolls, damage rolls), BaseSpeed, TempHP from a
 * "(@item.level)dN" badge. `rank` is the spell's rank (the badge's dice count there); `spellDuration` the spell's.
 */
export function inspectCasterBenefitClaim(document, claimText, { rank, spellDuration = null } = {}) {
    const mechanics = document?.mechanics ?? { rules: document?.system?.rules, duration: document?.system?.duration };
    const claim = String(claimText ?? "").replace(/[–−]/g, "-");
    const rules = mechanics?.rules;
    const fail = reason => ({ supported: false, reason });
    if (!Array.isArray(rules) || !rules.length) return fail("the Effect has no rules");
    for (const rule of rules) {
        // A save named by its statistic ("Will saving throws"), optionally only against effects with a trait ("against emotion
        // effects", the rule's one item:trait predicate).
        const saveWords = { will: String.raw`Will (?:saves|saving throws)`, fortitude: String.raw`Fortitude (?:saves|saving throws)`, reflex: String.raw`Reflex (?:saves|saving throws)` };
        const selector = Array.isArray(rule?.selector) && rule.selector.length === 1 ? rule.selector[0] : rule?.selector;
        const traitOnly = Array.isArray(rule?.predicate) && rule.predicate.length === 1 && /^item:trait:([a-z-]+)$/.exec(rule.predicate[0]);
        if (rule?.key === "FlatModifier" && Number.isInteger(rule.value) && (CLAIM_WORDS[selector] || saveWords[selector]) && TYPES.has(rule.type) && (rule.predicate == null || traitOnly)) {
            const stated = new RegExp(String.raw`\ba ${rule.value < 0 ? "-" : "\\+"}${Math.abs(rule.value)} ${rule.type} ${rule.value < 0 ? "penalty" : "bonus"} to (?:your )?${CLAIM_WORDS[selector] ?? saveWords[selector]}${traitOnly ? ` against ${traitOnly[1]} effects` : ""}\b`, "i");
            if (!stated.test(claim)) return fail(`the text doesn't state the Effect's ${selector} modifier`);
        } else if (rule?.key === "FlatModifier" && /^(swim|fly|climb|burrow|land)-speed$/.test(selector ?? "") && Number.isInteger(rule.value) && rule.value > 0
            && TYPES.has(rule.type) && rule.predicate == null) {
            // "… if you already have a swim Speed, you can Swim up to your Speed with a +10-foot circumstance bonus."
            const kind = selector.replace(/-speed$/, "");
            if (!new RegExp(String.raw`\byou already have an? ${kind} Speed, you can [A-Za-z]+ up to your Speed with a \+${rule.value}-foot ${rule.type} bonus\b`, "i").test(claim))
                return fail(`the text doesn't state the Effect's ${kind} Speed bonus`);
        } else if (rule?.key === "BaseSpeed" && /^[a-z]+$/.test(rule.selector ?? "") && Number.isInteger(rule.value) && rule.predicate == null) {
            if (!new RegExp(String.raw`\ban? ${rule.selector} Speed of ${rule.value} feet\b`, "i").test(claim)) return fail(`the text doesn't state the Effect's ${rule.selector} Speed`);
        } else if (rule?.key === "TokenLight" && Number.isInteger(rule.value?.bright) && Number.isInteger(rule.value?.dim)) {
            // "You radiate bright light in a 20-foot radius (and dim light for the next 20 feet)": the light's radii.
            const light = /\bbright light in a (\d+)-foot radius \(and dim light for the next (\d+) feet\)/i.exec(claim);
            if (!light || Number(light[1]) !== rule.value.bright || Number(light[1]) + Number(light[2]) !== rule.value.dim) return fail("the text doesn't state the Effect's light");
        } else if (rule?.key === "Resistance" && typeof rule.type === "string" && rule.predicate == null) {
            // "… gain mental resistance 5 (10 at 6th rank, 15 at 8th rank)": the value, or PF2e's ternary of the heightened values.
            const stated = new RegExp(String.raw`\b${rule.type} resistance (\d+)(?: \((\d+) at (\d+)th rank, (\d+) at (\d+)th rank\))?`, "i").exec(claim);
            if (!stated) return fail(`the text doesn't state the Effect's ${rule.type} resistance`);
            const expected = stated[2] ? `ternary(gte(@item.level,${stated[5]}),${stated[4]},ternary(gte(@item.level,${stated[3]}),${stated[2]},${stated[1]}))` : stated[1];
            if (String(rule.value).replace(/\s+/g, "") !== expected) return fail(`the Effect's ${rule.type} resistance isn't the stated one`);
        } else if (rule?.key === "TempHP" && rule.value === "@item.badge.value" && rule.predicate == null) {
            const badge = /^\(@item\.(?:level|rank)\)d(\d+)$/.exec(String(document?.badge?.value ?? document?.system?.badge?.value ?? ""));
            const stated = /\b(\d+)d(\d+) temporary Hit Points\b/.exec(claim);
            if (!badge || !stated || Number(stated[1]) !== Number(rank) || stated[2] !== badge[1]) return fail("the text doesn't state the Effect's temporary Hit Points");
        } else return fail(`the Effect's ${rule?.key ?? "unknown"} rule isn't read`);
    }
    // The stated duration is the Effect's.
    const duration = mechanics.duration ?? {};
    // "At the end of the movement, …": an Effect to the start of the caster's next turn covers the movement (a data note says to
    // remove it when the movement ends).
    const expected = /until the beginning of your next turn/i.test(claim) || /\bAt the end of the movement, /.test(claim) ? { unit: "rounds", value: 1, expiry: "turn-start" }
        : /until the end of your next turn/i.test(claim) ? { unit: "rounds", value: 1, expiry: "turn-end" }
            : /\bfor the duration\b/i.test(claim) && /^1 round$/i.test(String(spellDuration ?? "").trim()) ? { unit: "rounds", value: 1 }
                : /\bfor 1 minute\.?$/i.test(claim) ? { unit: "minutes", value: 1 }
                    // (A sustained spell's benefit with no time of its own — "You gain a +1 status bonus to AC." — lasts while it's sustained.)
                    : spellDuration === "sustained" && !/\b(?:for|until)\b/i.test(claim) ? { sustained: true } : null;
    if (!expected || Object.entries(expected).some(([key, value]) => duration[key] !== value)) return fail("the Effect's duration isn't the stated one");
    return { supported: true, reason: null };
}

// "The creature is distracted by its amusement and takes a -1 status penalty on Perception checks and Will saves for
// 1 round.": an Effect linked in a degree row whose only rules are the penalties the row states, lasting as stated.
const ROW_SELECTORS = [
    [/^Perception checks$/i, "perception"], [/^Will saves$/i, "will"], [/^Fortitude saves$/i, "fortitude"], [/^Reflex saves$/i, "reflex"],
    [/^(?:saving throws|saves)$/i, "saving-throw"], [/^attack rolls$/i, "attack-roll"], [/^AC$/, "ac"], [/^skill checks$/i, "skill-check"], [/^damage rolls$/i, "damage"]
];
const ROW_TIMING = {
    "for 1 round": { duration: { value: 1, unit: "rounds", expiry: "turn-start" }, durationAnchor: "effect-start", durationOffset: 0 },
    "for 1 minute": { duration: { value: 1, unit: "minutes" }, durationAnchor: "effect-start", durationOffset: 0 },
    "until the end of your next turn": { duration: { value: 1, unit: "rounds", expiry: "turn-end" }, durationAnchor: "source-turn", durationOffset: 1 }
};
const ROW_NARRATION_RULES = /\d|@UUID|\b(?:damage|save|bonus|penalty|immune|condition|can't|must|unaffected|round|minute)\b/i;

/** A rule value ("@item.level", "2*@item.rank", a number) at a rank: arithmetic on the rank only. */
function rankValue(value, rank) {
    if (typeof value === "number") return value;
    const expression = String(value ?? "").replace(/@item\.(?:level|rank)/g, String(Number(rank)));
    if (!/^(?:[\d+\-*/(). ,]|ceil|floor|max|min)*$/.test(expression)) return null;
    try {
        const result = Function("ceil", "floor", "max", "min", `return (${expression});`)(Math.ceil, Math.floor, Math.max, Math.min);
        return Number.isFinite(result) ? result : null;
    } catch { return null; }
}

/** The Effect's rules and duration prove the row sentence; returns {modifiers, timing} or null. */
const CONDITION_UUIDS = { "off-guard": "Compendium.pf2e.conditionitems.Item.AJh5ex99aV6VTggg", clumsy: "Compendium.pf2e.conditionitems.Item.i3OJZU2nk64Df3xm" };
export function proveRowModifierClaim(mechanics, sentence, { rank = null } = {}) {
    const text = String(sentence ?? "").replace(/[–−]/g, "-").trim();
    // "The creature has weakness to fire 3 for 1 minute.": an Effect whose only rules are that Weakness at the cast rank (Incendiary Ashes).
    if (rank != null && /^The (?:creature|target) has weakness\b/.test(text)) {
        const weakness = proveWeaknessClaim(mechanics, text, value => rankValue(value, rank));
        return weakness ? { modifiers: { weakness: { types: weakness.types, value: weakness.value } }, timing: { durationAnchor: weakness.timing.durationAnchor, durationOffset: weakness.timing.durationOffset } } : null;
    }
    // "The target is Clumsy 1 and takes a -10-foot status penalty to all its Speeds until the end of your next turn.": one
    // FlatModifier on all Speeds and the Effect's grant of that condition (value 1, or its badge raised to the value), lasting
    // as the row says. The row's condition is carried by the Effect.
    const speedCondition = /^The (?:creature|target) is ([A-Za-z-]+) (\d) and takes a -(\d+)-foot (status|circumstance) penalty to all its Speeds (for 1 round|for 1 minute|until the end of your next turn)\.$/.exec(text);
    if (speedCondition) {
        const rules = mechanics?.rules ?? [], duration = mechanics?.duration ?? {};
        const slug = speedCondition[1].toLowerCase(), value = Number(speedCondition[2]);
        const flat = rules.filter(rule => rule.key === "FlatModifier"), grants = rules.filter(rule => rule.key === "GrantItem");
        if (rules.length !== 2 || flat.length !== 1 || grants.length !== 1) return null;
        const [modifier] = flat, [grant] = grants;
        if (JSON.stringify([modifier.selector].flat()) !== '["all-speeds"]' || modifier.predicate != null || modifier.removeAfterRoll != null
            || modifier.type !== speedCondition[4] || Number(modifier.value) !== -Number(speedCondition[3])) return null;
        const badge = grant.alterations == null ? 1 : grant.alterations.length === 1 && grant.alterations[0].property === "badge-value" && grant.alterations[0].mode === "upgrade" ? Number(grant.alterations[0].value) : null;
        if (grant.uuid !== CONDITION_UUIDS[slug] || grant.predicate != null || badge !== value) return null;
        const timing = ROW_TIMING[speedCondition[5]];
        if (duration.sustained || Object.entries(timing.duration).some(([key, entry]) => duration[key] !== entry)) return null;
        return { modifiers: { type: modifier.type, value: Number(modifier.value), selectors: ["all-speeds"] }, timing: { durationAnchor: timing.durationAnchor, durationOffset: timing.durationOffset }, carries: slug };
    }
    // "The recoil imposes a -1 status penalty to the ranged attack and renders the target off-guard until the beginning of their
    // next turn.": a penalty to the triggering ranged attack. Either the Effect's modifier is removed after that roll and its
    // duration is unlimited (the condition is the row's), or it lasts until the start of the target's next turn and the Effect
    // grants the condition too ("Until the start of their next turn, any additional ranged attacks … take the same penalty.").
    const ranged = /^(?:The [a-z]+|It) imposes a -(\d) (status|circumstance) penalty to the ranged attack and renders the target ([a-z-]+) until the beginning of their next turn\.$/.exec(text);
    // "The target takes a -2 penalty to Perception checks involving vision until the end of its turn.": one Perception
    // FlatModifier limited to visual checks, lasting 1 round to the end of the target's turn (counted from its own turn). The
    // text gives no type; PF2e's Effect does (a data note).
    const vision = /^The (?:creature|target) takes a -(\d) (?:(status|circumstance) )?penalty to Perception checks involving vision until the end of its turn\.$/.exec(text);
    if (vision) {
        const rules = mechanics?.rules ?? [], duration = mechanics?.duration ?? {};
        const [rule] = rules;
        if (rules.length !== 1 || rule.key !== "FlatModifier" || rule.selector !== "perception" || JSON.stringify(rule.predicate) !== '["visual"]'
            || rule.value !== -Number(vision[1]) || rule.removeAfterRoll != null || (vision[2] && rule.type !== vision[2])) return null;
        if (duration.value !== 1 || duration.unit !== "rounds" || duration.expiry !== "turn-end" || duration.sustained) return null;
        return { modifiers: { type: rule.type, value: rule.value, selectors: ["perception"], predicate: ["visual"] },
            timing: { durationAnchor: "target-turn", durationOffset: 0 }, ...(vision[2] ? {} : { typeNote: rule.type }) };
    }
    if (ranged) {
        const rules = mechanics?.rules ?? [], duration = mechanics?.duration ?? {};
        const modifiers = rules.filter(rule => rule.key === "FlatModifier");
        const grants = rules.filter(rule => rule.key === "GrantItem");
        if (modifiers.length !== 1 || modifiers.length + grants.length !== rules.length) return null;
        const [modifier] = modifiers;
        if (modifier.selector !== "ranged-attack-roll" || modifier.predicate != null || modifier.value !== -Number(ranged[1]) || modifier.type !== ranged[2]) return null;
        const once = modifier.removeAfterRoll != null && duration.unit === "unlimited" && !grants.length;
        const round = modifier.removeAfterRoll == null && duration.value === 1 && duration.unit === "rounds" && duration.expiry === "turn-start" && !duration.sustained
            && grants.length === 1 && grants[0].uuid === CONDITION_UUIDS[ranged[3]];
        if (!once && !round) return null;
        return { modifiers: { type: ranged[2], value: -Number(ranged[1]), selectors: ["ranged-attack-roll"] },
            timing: { durationAnchor: "effect-start", durationOffset: 0 }, ...(once ? { onceCondition: ranged[3] } : { grants: ranged[3] }) };
    }
    // "The target takes a -1 circumstance penalty to attack rolls and damage rolls against you until the start of your next turn."
    // — the Effect's modifier limited to rolls against its origin (the caster).
    const against = /^The (?:creature|target) takes a -(\d) (status|circumstance) penalty to (attack rolls and damage rolls|attack and damage rolls) against you (until the start of your next turn|for 1 round)\.$/.exec(text);
    if (against) {
        const rules = mechanics?.rules ?? [], duration = mechanics?.duration ?? {};
        const [rule] = rules;
        if (rules.length !== 1 || rule.key !== "FlatModifier" || JSON.stringify(rule.predicate) !== '["target:signature:{item|origin.signature}"]' || rule.removeAfterRoll != null
            || rule.value !== -Number(against[1]) || rule.type !== against[2] || JSON.stringify([...[rule.selector].flat()].sort()) !== '["attack","damage"]') return null;
        if (duration.value !== 1 || duration.unit !== "rounds" || duration.expiry !== "turn-start" || duration.sustained) return null;
        return { modifiers: { type: rule.type, value: rule.value, selectors: ["attack", "damage"], predicate: "against-origin" },
            timing: against[4] === "for 1 round" ? { durationAnchor: "effect-start", durationOffset: 0 } : { durationAnchor: "source-turn", durationOffset: 1 } };
    }
    const match = /^The (?:creature|target) (?:(.+?) and )?takes a -(\d) (status|circumstance) penalty (?:on|to) (.+?) (for 1 round|for 1 minute|until the end of your next turn)\.$/.exec(text);
    if (!match || (match[1] && ROW_NARRATION_RULES.test(match[1]))) return null;
    const items = match[4].split(/,\s*(?:and\s+)?|\s+and\s+/).map(item => item.trim()).filter(Boolean);
    const selectors = items.map(item => ROW_SELECTORS.find(([pattern]) => pattern.test(item))?.[1] ?? null);
    if (!selectors.length || selectors.includes(null) || new Set(selectors).size !== selectors.length) return null;
    const rules = mechanics?.rules;
    if (!Array.isArray(rules) || !rules.length) return null;
    const given = [];
    for (const rule of rules) {
        if (rule.key !== "FlatModifier" || rule.predicate != null || rule.removeAfterRoll != null || rule.value !== -Number(match[2]) || rule.type !== match[3]) return null;
        given.push(...(Array.isArray(rule.selector) ? rule.selector : [rule.selector]).map(selector => selector === "attack" ? "attack-roll" : selector));
    }
    if (JSON.stringify([...given].sort()) !== JSON.stringify([...selectors].sort())) return null;
    const timing = ROW_TIMING[match[5]];
    const duration = mechanics.duration ?? {};
    if (duration.sustained || Object.entries(timing.duration).some(([key, value]) => duration[key] !== value)) return null;
    return { modifiers: { type: match[3], value: -Number(match[2]), selectors: [...selectors].sort() }, timing };
}

// "the target also gains weakness 1 to bludgeoning until the start of your next turn": an Effect whose only rules are
// unconditional Weakness rules giving exactly that at the cast rank, lasting as stated.
const WEAKNESS_TIMING = {
    ...ROW_TIMING,
    "until the start of your next turn": { duration: { value: 1, unit: "rounds", expiry: "turn-start" }, durationAnchor: "source-turn", durationOffset: 1 },
    // (The creature's own next turn: counted from its turn.)
    "until the start of its next turn": { duration: { value: 1, unit: "rounds", expiry: "turn-start" }, durationAnchor: "target-turn", durationOffset: 1 }
};

/** Returns {types, value, timing} or null. `valueAt(ruleValue)` evaluates a rule value at the cast rank. */
export function proveWeaknessClaim(mechanics, sentence, valueAt) {
    const text = String(sentence ?? "").trim();
    // ("has weakness to fire 3 …": the same, with the value last.)
    const after = /\b(?:gains|has) weakness to ([a-z]+) (\d+) (for 1 round|for 1 minute|until the end of your next turn|until the start of (?:your|its) next turn)\.$/.exec(text);
    const match = after ? [after[0], after[2], after[1], after[3]] : /\b(?:gains|has) weakness (\d+) to ([a-z]+(?: and [a-z]+)?)(?: damage)? (for 1 round|for 1 minute|until the end of your next turn|until the start of (?:your|its) next turn)\.$/.exec(text);
    const rules = mechanics?.rules;
    if (!match || !Array.isArray(rules) || !rules.length) return null;
    const stated = match[2].split(" and ").sort();
    const given = [];
    for (const rule of rules) {
        if (rule.key !== "Weakness" || rule.predicate != null || valueAt(rule.value) !== Number(match[1])) return null;
        given.push(...(Array.isArray(rule.type) ? rule.type : [rule.type]));
    }
    if (JSON.stringify(given.sort()) !== JSON.stringify(stated)) return null;
    const timing = WEAKNESS_TIMING[match[3]];
    const duration = mechanics.duration ?? {};
    if (duration.sustained || Object.entries(timing.duration).some(([key, value]) => duration[key] !== value)) return null;
    return { types: stated, value: Number(match[1]), timing };
}
