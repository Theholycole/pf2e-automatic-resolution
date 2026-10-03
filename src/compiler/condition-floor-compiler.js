// Curse condition floors: "The target becomes sickened 1 and can't reduce its
// sickened condition below 1 while the curse remains." The condition itself is
// an ordinary outcome grant; the floor is a curse Effect holding a locked
// grant of the floor value until the curse is lifted. Optional exact
// sentences name the curse's ending ("The curse can be lifted by …") and a
// situational extra condition ("Whenever the target is sickened and on the
// water at least a mile from shore, it is also Slowed 1."), which becomes a
// GM toggle on the curse Effect. Every sentence of the outcome must match.

const CONDITIONS = "(clumsy|drained|enfeebled|frightened|sickened|stupefied)";
const LINK = String.raw`(?:@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([^}]+)\}|([a-z]+ \d+))`;
const FLOOR = new RegExp(String.raw`^The target becomes ${LINK} and can't reduce its ${CONDITIONS} condition below (\d+) while the curse remains\.$`, "i");
const LIFTED = /^The curse can be lifted by (.+?)\.$/i;
const WHENEVER = new RegExp(String.raw`^Whenever the target is ${CONDITIONS} and (.+?), it is also ${LINK}\.$`, "i");
const AS_FAILURE = new RegExp(String.raw`^As failure, but the target becomes ${LINK}\.$`, "i");

const sentences = text => String(text ?? "").replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
const plain = value => String(value ?? "").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
function grant(label) {
    const match = /^([a-z-]+)\s+(\d+)$/i.exec(String(label ?? "").trim());
    return match ? { slug: match[1].toLowerCase(), value: Number(match[2]) } : null;
}

function condition(slug, value, raw) {
    return { kind: "condition", slug, name: slug[0].toUpperCase() + slug.slice(1), value, duration: null, source: "condition-floor", raw };
}

function compileFloorOutcome(rawText) {
    const parts = sentences(rawText);
    const floor = FLOOR.exec(parts[0] ?? "");
    if (!floor) return null;
    const granted = grant(floor[1] ?? floor[2]);
    if (!granted || granted.slug !== floor[3].toLowerCase()) return null;
    const result = {
        effects: [condition(granted.slug, granted.value, parts[0])],
        conditionFloor: { slug: granted.slug, value: Number(floor[4]), lifetime: "curse", liftedBy: null, situational: null, sourceTexts: [parts[0]] }
    };
    if (result.conditionFloor.value < 1 || result.conditionFloor.value > granted.value) return null;
    for (const sentence of parts.slice(1)) {
        const lifted = LIFTED.exec(plain(sentence));
        if (lifted && !result.conditionFloor.liftedBy) {
            result.conditionFloor.liftedBy = lifted[1];
            result.conditionFloor.sourceTexts.push(sentence);
            continue;
        }
        const whenever = WHENEVER.exec(sentence);
        const extra = whenever && grant(whenever[3] ?? whenever[4]);
        if (extra && !result.conditionFloor.situational && whenever[1].toLowerCase() === granted.slug) {
            result.conditionFloor.situational = { requires: granted.slug, circumstance: whenever[2], grant: extra };
            result.conditionFloor.sourceTexts.push(sentence);
            continue;
        }
        return null;
    }
    return result;
}

/** Rewrites the failure/critical-failure outcomes of a curse floor; null when absent. */
export function compileConditionFloors(outcomes) {
    const failure = compileFloorOutcome(outcomes.failure?.rawText);
    if (!failure) return null;
    const critical = AS_FAILURE.exec(String(outcomes.criticalFailure?.rawText ?? "").trim());
    const criticalGrant = critical && grant(critical[1] ?? critical[2]);
    if (!criticalGrant || criticalGrant.slug !== failure.conditionFloor.slug) return { blocked: true };
    const apply = (outcome, compiled, sourceTexts) => {
        outcome.effects = compiled.effects;
        outcome.conditionFloor = { ...compiled.conditionFloor, sourceTexts };
        outcome.manualInstructions = [];
    };
    apply(outcomes.failure, failure, failure.conditionFloor.sourceTexts);
    apply(outcomes.criticalFailure, { effects: [condition(criticalGrant.slug, criticalGrant.value, outcomes.criticalFailure.rawText)],
        conditionFloor: failure.conditionFloor }, [String(outcomes.criticalFailure.rawText).trim()]);
    return { floor: failure.conditionFloor };
}

// "The sickened value can't be reduced below 1 while the spell is active.": a floor for as long as the spell lasts, in the
// row that grants that condition. The condition itself keeps PF2e's own lifetime; only the floor ends with the spell.
const SPELL_FLOOR = new RegExp(String.raw`^The ${CONDITIONS} value can't be reduced below (\d+) while the spell is active\.$`, "i");

const THIS_SPELL_FLOOR = /^This condition can't be reduced below (\d+) while the spell is active(?: and (the target can hear you))?\.$/;

// "It can't reduce the value of its frightened condition below 1 as long as it remains stupefied by this spell.": a floor while the row's
// other condition (with its own timer) lasts. The floor Effect grants the floor value only while the creature has that condition, and
// ends with that condition's timer.
const WHILE_CONDITION_FLOOR = new RegExp(String.raw`^It can't reduce the value of its ${CONDITIONS} condition below (\d+) as long as it remains ${CONDITIONS} by this spell\.$`, "i");

// "Until it stops bleeding, its frightened value can't decrease below frightened 1.": a floor while the creature takes persistent bleed
// damage (the spell's targets must be); the floor Effect ends with the last persistent bleed condition. A critical failure "As failure,
// but the target is Frightened 3." keeps the failure's floor.
const WHILE_BLEEDING_FLOOR = new RegExp(String.raw`^Until it stops bleeding, its ${CONDITIONS} value can't decrease below ${CONDITIONS} (\d+)\.$`, "i");
const AS_FAILURE_IS = new RegExp(String.raw`^As failure, but the target is ${LINK}\.$`, "i");

// "The target is Sickened 2 and can't reduce this condition below sickened 1 until it first consumes some raw meat; if the creature doesn't have
// access to raw meat, it can take a bite out of a corpse within reach as an Interact action." (and "As failure, but the target can't reduce
// the condition below sickened 2 until it consumes raw meat."): a floor that lasts until the creature does the stated thing — the floor
// Effect is the GM's to delete then; the rest of the sentence is its note.
const UNTIL_LIFTED = new RegExp(String.raw`^The target is ${LINK} and can't reduce this condition below ${CONDITIONS} (\d+) until it (?:first )?([a-z][a-z ]{3,60}?)(?:; ([^.]{10,200}))?\.$`, "i");
const UNTIL_LIFTED_AS = new RegExp(String.raw`^As failure, but the target can't reduce the condition below ${CONDITIONS} (\d+) until it (?:first )?([a-z][a-z ]{3,60}?)\.$`, "i");

function compileUntilLifted(outcomes) {
    const failure = outcomes?.failure, critical = outcomes?.criticalFailure;
    const raw = String(failure?.rawText ?? "").replace(/\s+/g, " ").trim();
    const match = UNTIL_LIFTED.exec(raw);
    if (!match) return null;
    const granted = grant(match[1] ?? match[2]);
    const slug = match[3].toLowerCase(), value = Number(match[4]);
    const own = (failure.effects ?? []).filter(effect => effect.kind === "condition");
    if (!granted || granted.slug !== slug || own.length !== 1 || own[0].slug !== slug || value < 1 || value > granted.value) return { blocked: true };
    // (The row's clauses as the analysis splits them: at the semicolon.)
    const clauses = match[6] ? [raw.slice(0, raw.indexOf("; ") + 1), raw.slice(raw.indexOf("; ") + 2)] : [raw];
    failure.conditionFloor = { slug, value, lifetime: "until-lifted", liftedBy: `it ${match[5]}`, situational: null, sourceTexts: clauses, ...(match[6] ? { liftNote: match[6] } : {}) };
    failure.manualInstructions = (failure.manualInstructions ?? []).filter(instruction => !["condition-floor", "conditional-effect"].includes(instruction.kind));
    const as = UNTIL_LIFTED_AS.exec(String(critical?.rawText ?? "").replace(/\s+/g, " ").trim());
    if (as) {
        const cvalue = Number(as[2]);
        const inherited = (critical.effects ?? []).filter(effect => effect.kind === "condition" && effect.slug === slug);
        if (as[1].toLowerCase() !== slug || inherited.length !== 1 || !(inherited[0].value >= cvalue)) return { blocked: true };
        critical.conditionFloor = { slug, value: cvalue, lifetime: "until-lifted", liftedBy: `it ${as[3]}`, situational: null, sourceTexts: [critical.rawText.replace(/\s+/g, " ").trim()],
            ...(match[6] ? { liftNote: match[6] } : {}) };
        critical.manualInstructions = (critical.manualInstructions ?? []).filter(instruction => !["condition-floor", "conditional-effect"].includes(instruction.kind));
    }
    return { found: true };
}

export function compileSpellFloors(outcomes, { sustained = true, persistentTarget = null } = {}) {
    let found = false;
    const lifted = compileUntilLifted(outcomes);
    if (lifted?.blocked) return lifted;
    if (lifted) found = true;
    for (const [degree, outcome] of Object.entries(outcomes ?? {})) {
        if (outcome?.conditionFloor?.lifetime === "until-lifted") continue;
        const parts = sentences(outcome?.rawText);
        const bleeding = parts.map(sentence => [sentence, WHILE_BLEEDING_FLOOR.exec(plain(sentence))]).filter(([, match]) => match);
        if (bleeding.length) {
            const [[sentence, match]] = bleeding;
            const slug = match[1].toLowerCase(), value = Number(match[3]);
            const floored = (outcome.effects ?? []).filter(effect => effect.kind === "condition" && effect.slug === slug);
            if (bleeding.length > 1 || persistentTarget !== "bleed" || match[2].toLowerCase() !== slug || floored.length !== 1 || !(floored[0].value >= value) || value < 1
                || floored[0].duration != null) return { blocked: true };
            outcome.conditionFloor = { slug, value, lifetime: "while-persistent", persistentDamage: "bleed", liftedBy: null, situational: null, sourceTexts: [sentence] };
            outcome.manualInstructions = (outcome.manualInstructions ?? []).filter(instruction => instruction.kind !== "condition-floor");
            const critical = outcomes.criticalFailure;
            const inherited = degree === "failure" ? AS_FAILURE_IS.exec(String(critical?.rawText ?? "").replace(/\s+/g, " ").trim()) : null;
            const raised = inherited && grant(inherited[1] ?? inherited[2]);
            if (inherited) {
                const own = (critical.effects ?? []).filter(effect => effect.kind === "condition");
                if (raised?.slug !== slug || !(raised.value >= value) || own.length !== 1 || own[0].slug !== slug) return { blocked: true };
                critical.conditionFloor = { ...outcome.conditionFloor, sourceTexts: [sentence], inheritedFrom: "failure" };
            }
            found = true;
            continue;
        }
        const whileFloors = parts.map(sentence => [sentence, WHILE_CONDITION_FLOOR.exec(plain(sentence))]).filter(([, match]) => match);
        if (whileFloors.length > 1) return { blocked: true };
        if (whileFloors.length === 1) {
            const [[sentence, match]] = whileFloors;
            const slug = match[1].toLowerCase(), value = Number(match[2]), holder = match[3].toLowerCase();
            const floored = (outcome.effects ?? []).filter(effect => effect.kind === "condition" && effect.slug === slug);
            const held = (outcome.effects ?? []).filter(effect => effect.kind === "condition" && effect.slug === holder);
            if (slug === holder || floored.length !== 1 || held.length !== 1 || !(floored[0].value >= value) || value < 1 || held[0].duration?.mode !== "fixed"
                || !Number.isInteger(held[0].duration.value) || !["rounds", "minutes"].includes(held[0].duration.unit)) return { blocked: true };
            // (The sentence isn't the floored condition's own end: it keeps PF2e's lifetime.)
            delete floored[0].whileCondition; delete floored[0].whileConditionName;
            if (floored[0].endsWhen?.event === "condition-removed") { delete floored[0].endsWhen; floored[0].expirationMode = floored[0].duration ? "duration" : undefined; if (floored[0].expirationMode === undefined) delete floored[0].expirationMode; }
            outcome.conditionFloor = { slug, value, lifetime: "while-condition", whileCondition: { slug: holder, duration: { value: held[0].duration.value, unit: held[0].duration.unit } },
                liftedBy: null, situational: null, sourceTexts: [sentence] };
            outcome.manualInstructions = (outcome.manualInstructions ?? []).filter(instruction => instruction.kind !== "condition-floor");
            found = true;
            continue;
        }
        // "This condition can't be reduced below 1 while the spell is active and the target can hear you.": the row's one valued condition;
        // the hearing qualifier is the GM's (a note on the floor Effect).
        const own = (outcome?.effects ?? []).filter(effect => effect.kind === "condition");
        const floors = parts.map(sentence => [sentence, SPELL_FLOOR.exec(plain(sentence)) ?? (own.length === 1 ? THIS_SPELL_FLOOR.exec(plain(sentence)) : null)]).filter(([, match]) => match);
        if (!floors.length) continue;
        // A floor "while the spell is active" needs a sustained spell.
        if (floors.length > 1 || !sustained) return { blocked: true };
        const [[sentence, match]] = floors;
        const thisFloor = match.length === 3 && !SPELL_FLOOR.test(plain(sentence));
        const slug = thisFloor ? own[0].slug : match[1].toLowerCase(), value = Number(thisFloor ? match[1] : match[2]);
        const whileText = thisFloor && match[2] ? match[2] : null;
        if (thisFloor && !CONDITIONS.replace(/[()]/g, "").split("|").includes(slug)) return { blocked: true };
        const granted = (outcome.effects ?? []).filter(effect => effect.kind === "condition" && effect.slug === slug);
        if (granted.length !== 1 || !(granted[0].value >= value) || value < 1 || granted[0].duration != null) return { blocked: true };
        granted[0].duration = { mode: "unlimited", value: null, sourceText: sentence };
        outcome.conditionFloor = { slug, value, lifetime: "spell", liftedBy: null, situational: null, sourceTexts: [sentence], ...(whileText ? { whileText } : {}) };
        outcome.manualInstructions = (outcome.manualInstructions ?? []).filter(instruction => instruction.kind !== "condition-floor");
        found = true;
    }
    return found ? { found } : null;
}

