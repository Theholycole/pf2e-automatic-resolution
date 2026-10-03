import {DEGREES} from './constants.js';

function clauseDuration(text) {
    const fixed = /^for ([1-9]\d*) (round|rounds|minute|minutes|hour|hours)$/i.exec(text);
    if (fixed) {
        const unit = fixed[2].replace(/s$/i, '').toLowerCase() + 's';
        return {mode:'fixed',value:Number(fixed[1]),unit,
            expiry:unit === 'rounds' ? 'turn-start' : null,
            anchor:'effect-start',offset:0,sourceText:text};
    }
    // "until it leaves the area (or Escapes)": in a lingering area, the penalty ends when the creature leaves it (or Escapes).
    const leaves = /^until (?:it|they) leaves? the area( or Escapes?)?$/i.exec(text);
    if (leaves) return {mode:'leave-area',value:null,unit:null,expiry:null,anchor:'effect-start',offset:0,...(leaves[1] ? {escape:true} : {}),sourceText:text};
    // "unless it Escapes" / "until it Escapes": for the spell's duration, ending early on an Escape (Stone Lance's impaling lance).
    if (/^(?:until|unless) (?:it|they) Escapes?$/i.test(text)) return {mode:'escape',value:null,unit:null,expiry:null,anchor:'effect-start',offset:0,sourceText:text};
    const turn = /^until the (start|end) of (your|its|their) next turn$/i.exec(text);
    if (!turn) return null;
    return {mode:'fixed',value:1,unit:'rounds',
        expiry:turn[1].toLowerCase() === 'end' ? 'turn-end' : 'turn-start',
        anchor:turn[2].toLowerCase() === 'your' ? 'source-turn' : 'target-turn',
        offset:1,sourceText:text};
}

function conditionMatchesSource(effect) {
    const label = /\{([a-z][a-z-]*)(?:\s+(\d+))?\}$/i.exec(String(effect?.raw ?? ''))
        ?? /^is ([a-z][a-z-]*)(?:\s+(\d+))?$/i.exec(String(effect?.raw ?? ''));
    return effect?.kind === 'condition' && label
        && effect.slug === label[1].toLowerCase()
        && effect.value === (label[2] == null ? null : Number(label[2]));
}

export function parseGeneratedSpeedClause(outcome) {
    const text = String(outcome.rawText ?? '').replace(/\s+/g, ' ').trim();
    let normalized = text;
    for (const effect of outcome.effects ?? []) {
        if (effect.raw && normalized.includes(effect.raw)) normalized = normalized.replace(effect.raw, '<CONDITION>');
    }
    const match = /^(.*?)a [–−-]([1-9]\d*)-foot (circumstance|status|item) penalty to (its|their) Speeds? (for [1-9]\d* (?:rounds?|minutes?|hours?)|until the (?:start|end) of (?:your|its|their) next turn|until (?:it|they) leaves? the area(?: or Escapes?)?|(?:until|unless) (?:it|they) Escapes?)\.$/i.exec(normalized);
    if (!match) return null;
    const lead = match[1];
    // ("The target takes double damage, is Immobilized until it Escapes, and takes a …": the row's condition ends on Escape too — Stone Lance.)
    const damageAndHeld = /^The (?:target|creature) takes (half|full|double) damage, is <CONDITION> until (?:it|they) Escapes?, and takes $/i.exec(lead);
    const damage = damageAndHeld ?? /^The (?:target|creature) takes (half|full|double) damage(?:,? and (?:takes? )?)?$/i.exec(lead);
    const condition = /^The (?:target|creature) (?:is )?<CONDITION> and takes $/i.test(lead);
    const plain = /^The (?:target|creature) takes $/i.test(lead);
    if (!damage && !condition && !plain) return null;
    if (damageAndHeld && !(/^(?:until|unless) (?:it|they) Escapes?$/i.test(match[5]) && outcome.effects?.length === 1 && outcome.effects[0].kind === 'condition'
        && outcome.effects[0].endsWhen?.[0]?.event === 'escape')) return null;
    if (condition && (outcome.effects?.length !== 1 || outcome.effects[0].kind !== 'condition')) return null;
    const duration = clauseDuration(match[5]);
    if (!duration) return null;
    if (condition) {
        const effect = outcome.effects[0];
        if (!conditionMatchesSource(effect)
            || effect.duration?.mode !== 'fixed'
            || !['value','unit','expiry','anchor'].every(key => effect.duration[key] === duration[key])) return null;
    }
    const multiplier = damage?.[1]?.toLowerCase();
    if (multiplier && (outcome.damage?.mode !== 'shared'
        || outcome.damage.multiplier !== ({half:0.5,full:1,double:2})[multiplier])) return null;
    if (!multiplier && outcome.damage?.mode !== 'none') return null;
    return {
        kind:'speed-penalty',selector:'all-speeds',modifierType:match[3].toLowerCase(),
        value:-Number(match[2]),duration,claimText:text
    };
}

export function inheritedSpeedClauseComplete(outcomes, degree, inheritedDegree, modifier) {
    if (degree !== 'criticalFailure' || inheritedDegree !== 'failure') return false;
    const outcome = outcomes[degree];
    const raw = String(outcome.rawText ?? '').replace(/\s+/g,' ').trim();
    if (/^As failure, but the (?:target|creature) takes double damage\.$/i.test(raw)) {
        return outcome.damage?.mode === 'shared' && outcome.damage.multiplier === 2
            && JSON.stringify(outcome.effects ?? []) === JSON.stringify(outcomes.failure.effects ?? []);
    }
    // In a lingering area the added condition keeps its own lifetime: "knocked Prone" (none), or "Immobilized for 1 round or
    // until it Escapes" when the penalty also ends on an Escape.
    if (modifier.duration?.mode === 'leave-area') {
        const own = /^As failure, but the (?:target|creature) is also (.+?)\.$/i.exec(raw);
        const prior = outcomes.failure.effects ?? [];
        const current = outcome.effects ?? [];
        if (!own || current.length !== prior.length + 1 || !prior.every((effect,index) => JSON.stringify(effect) === JSON.stringify(current[index]))) return false;
        const condition = current.at(-1);
        if (condition?.kind !== 'condition' || condition.whileCondition) return false;
        if (condition.slug === 'prone') return /^knocked\b/.test(own[1]) && (condition.duration == null || condition.duration.mode === 'unlimited') && condition.endsWhen == null;
        const escapes = (Array.isArray(condition.endsWhen) ? condition.endsWhen : [condition.endsWhen]).filter(Boolean);
        return condition.duration?.mode === 'fixed' && /for 1 round or until it Escapes$/.test(own[1]) && modifier.duration.escape === true
            && escapes.length === 1 && escapes[0].event === 'escape';
    }
    // (Oneiric Mire: a penalty until it Escapes, and the critical failure's condition until it Escapes as well.)
    if (modifier.duration?.mode === 'escape') {
        const own = /^As failure, but the (?:target|creature) is also (.+?) until it Escapes\.$/i.exec(raw);
        const prior = outcomes.failure.effects ?? [];
        const current = outcome.effects ?? [];
        if (!own || current.length !== prior.length + 1 || !prior.every((effect,index) => JSON.stringify(effect) === JSON.stringify(current[index]))) return false;
        const condition = current.at(-1);
        const escapes = (Array.isArray(condition?.endsWhen) ? condition.endsWhen : [condition?.endsWhen]).filter(Boolean);
        return condition?.kind === 'condition' && !condition.whileCondition && (condition.duration == null || condition.duration.mode === 'unlimited')
            && escapes.length === 1 && escapes[0].event === 'escape';
    }
    const added = /^As failure, but the (?:target|creature) is also (.+) (for the duration|for [1-9]\d* (?:rounds?|minutes?|hours?))\.$/i.exec(raw);
    if (!added) return false;
    const prior = outcomes.failure.effects ?? [];
    const current = outcome.effects ?? [];
    if (current.length !== prior.length + 1
        || !prior.every((effect,index) => JSON.stringify(effect) === JSON.stringify(current[index]))) return false;
    const condition = current.at(-1);
    if (!conditionMatchesSource(condition) || !condition.duration || condition.whileCondition || condition.endsWhen
        || !(condition.raw === added[1] || condition.raw === `is ${added[1]}`)) return false;
    const expected = /^for the duration$/i.test(added[2]) ? modifier.duration : clauseDuration(added[2]);
    return expected?.mode === 'fixed'
        && ['value','unit','expiry','anchor'].every(key => condition.duration[key] === expected[key]);
}

/** Compile only full degree sentences whose Speed penalty and lifetime are explicit. */
export function compileGeneratedSpeedPenalties(plan, {lingering = false} = {}) {
    // A lingering area's exposures are instantaneous saves; the area's own duration is the Ongoing record's.
    // (Or a spell with a fixed duration whose every penalty lasts until the creature Escapes, the spell's time at most: Stone Lance.)
    const untilEscape = plan.lifecycle?.durationSpec?.mode === 'fixed' && !plan.lifecycle?.sustained
        && Object.values(plan.resolution?.outcomes ?? {}).every(outcome => { const modifier = parseGeneratedSpeedClause(outcome); return !modifier || modifier.duration.mode === 'escape'; })
        && Object.values(plan.resolution?.outcomes ?? {}).some(outcome => parseGeneratedSpeedClause(outcome));
    if (plan.resolution?.kind !== 'save' || (plan.lifecycle?.durationSpec?.mode !== 'instantaneous' && !lingering && !untilEscape)
        // (A sustained lingering area's controller is its Ongoing record.)
        || (plan.lifecycle?.controller?.required === true && !lingering)
        || Object.values(plan.resolution.outcomes ?? {}).some(outcome => outcome.nativeEffects?.length)) return null;
    const outcomes = plan.resolution.outcomes;
    const byDegree = Object.fromEntries(DEGREES.map(degree => [degree, []]));
    for (const degree of DEGREES) {
        const modifier = parseGeneratedSpeedClause(outcomes[degree]);
        if (modifier) byDegree[degree].push(modifier);
    }
    for (const degree of DEGREES) {
        if (byDegree[degree].length) continue;
        const source = /^As (critical success|success|failure|critical failure)\b/i.exec(
            String(outcomes[degree].rawText ?? '').trim());
        const inheritedDegree = source && ({'critical success':'criticalSuccess',success:'success',
            failure:'failure','critical failure':'criticalFailure'})[source[1].toLowerCase()];
        if (inheritedDegree && inheritedDegree !== degree && byDegree[inheritedDegree].length === 1) {
            byDegree[degree].push({...structuredClone(byDegree[inheritedDegree][0]),inheritedFrom:inheritedDegree});
        }
    }
    const critical = outcomes.criticalFailure;
    const inherited = /^As failure, but the (?:target|creature) is also (.+) for the duration\.$/i.exec(
        String(critical.rawText ?? '').replace(/\s+/g, ' ').trim());
    if (inherited && byDegree.failure.length === 1
        && byDegree.criticalFailure[0]?.inheritedFrom === 'failure') {
        const failureEffects = outcomes.failure.effects ?? [];
        const criticalEffects = critical.effects ?? [];
        const added = criticalEffects.slice(failureEffects.length);
        const speedDuration = byDegree.failure[0].duration;
        const sameDuration = duration => duration?.mode === 'fixed'
            && ['value','unit','expiry','anchor'].every(key => duration[key] === speedDuration[key]);
        if (criticalEffects.length === failureEffects.length + 1
            && failureEffects.every((effect,index) => JSON.stringify(effect) === JSON.stringify(criticalEffects[index])
                && sameDuration(effect.duration))
            && added[0]?.kind === 'condition'
            && (added[0].raw === inherited[1] || added[0].raw === `is ${inherited[1]}`)
            && added[0].duration == null && added[0].whileCondition == null
            && added[0].endsWhen == null) {
            added[0].duration = structuredClone(speedDuration);
            added[0].duration.sourceText = 'for the duration';
            added[0].expirationMode = 'duration';
        }
    }
    for (const degree of DEGREES) {
        const modifier = byDegree[degree][0];
        if (modifier?.inheritedFrom && !inheritedSpeedClauseComplete(outcomes,degree,modifier.inheritedFrom,modifier)) {
            plan.automation.pendingCapabilities.push('speed-modifier-inheritance');
        }
    }
    if (!Object.values(byDegree).some(entries => entries.length)) return null;
    for (const degree of DEGREES) outcomes[degree].modifiers = byDegree[degree];
    // A penalty that ends when the creature leaves the area exists only in a lingering area.
    if (Object.values(byDegree).flat().some(modifier => modifier.duration?.mode === 'leave-area') && !lingering) return null;
    return {kind:'degree-speed-penalties',...(lingering ? {lingering:true} : {}),
        sourceText:Object.fromEntries(DEGREES.map(degree => [degree, outcomes[degree].rawText])),
        byDegree:structuredClone(byDegree),
        conditionEffects:Object.fromEntries(DEGREES.map(degree => [degree,
            (outcomes[degree].effects ?? []).map(effect => ({slug:effect.slug,value:effect.value,duration:effect.duration}))]))};
}
