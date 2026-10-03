export const IMMEDIATE_FLAG = 'immediateCast';
export const DEGREES = ['criticalFailure', 'failure', 'success', 'criticalSuccess'];
export const PROFILES = { heal: 'rfZpqmj0AIIdkVIs', 'force-barrage': 'gKKqvLohtrSJj3BM', disintegrate: 'r7ihOgKv19eJQnik' };
export function degree(value) { return typeof value === 'number' ? DEGREES[value] : DEGREES.includes(value) ? value : null; }
export function effectiveCheck(target, stage) { return target[`${stage}Override`]?.degree ?? target[stage]?.degree ?? null; }
export function saveDegree(state, target) {
    const result = effectiveCheck(target, 'save');
    return result && state.kind === 'disintegrate' && effectiveCheck(target, 'attack') === 'criticalSuccess'
        ? DEGREES[Math.max(0, DEGREES.indexOf(result) - 1)] : result;
}
export function needsSave(state, target) {
    return !target.excluded && (state.kind === 'heal' ? target.mode === 'damage'
        : state.kind === 'disintegrate' && target.mode !== 'object' && ['success','criticalSuccess'].includes(effectiveCheck(target,'attack')));
}
export function readiness(state) {
    if (state.status !== 'collecting') return 'This cast is locked.';
    for (const t of state.targets.filter(t => !t.excluded)) {
        if (state.kind === 'disintegrate' && !effectiveCheck(t,'attack')) return `${t.name}: roll the attack first.`;
        if (needsSave(state,t) && !effectiveCheck(t,'save')) return `${t.name}: roll the Fortitude save.`;
    }
    return null;
}
export function recordCheck(state, id, stage, roll, revision) {
    const t = state.targets.find(t => t.id === id);
    if (state.status !== 'collecting' || !t || t.excluded || t.revision !== revision) throw Error('This target changed or is locked. Refresh before rolling again.');
    if (!['attack','save'].includes(stage) || !degree(roll.degree)) throw Error('Invalid native check result.');
    if (stage === 'save' && !needsSave(state,t)) throw Error('The preceding attack does not allow this save.');
    if (stage === 'attack' && state.kind !== 'disintegrate') throw Error('This cast has no attack.');
    t[stage] = {...roll, degree:degree(roll.degree)}; t[`${stage}Override`] = null;
    if (stage === 'attack') { t.save = null; t.saveOverride = null; }
    t.revision++;
}
export function correctTarget(state, id, correction, userId) {
    const t = state.targets.find(t => t.id === id);
    if (!t || state.status !== 'collecting' || correction.revision !== t.revision) throw Error('This target changed or is locked.');
    if (correction.action === 'eligibility') {
        if(state.kind!=='heal'||!['healing','damage'].includes(correction.mode))throw Error('Choose a Heal eligibility mode.');
        t.mode=correction.mode;t.eligibilityOverride={mode:correction.mode,userId};t.excluded=false;t.save=null;t.saveOverride=null;
    } else if (correction.action === 'exclude') {
        if(t.excluded&&t.mode==='unaffected')throw Error('Choose an explicit Heal eligibility override before restoring this target.');
        t.excluded = !t.excluded;
    }
    else {
        const stage=correction.stage;
        if (!['attack','save'].includes(stage) || !t[stage] || !degree(correction.degree)) throw Error('Roll this check before adjusting its degree.');
        t[`${stage}Override`] = {degree:correction.degree,userId};
        if (stage === 'attack') { t.save = null; t.saveOverride = null; }
    }
    t.revision++;
}
export function validateChoices(kind, rank, actions, targets) {
    const minimum = kind === 'disintegrate' ? 6 : 1;
    if (!Number.isInteger(rank) || rank < minimum || rank > 10) throw Error('Choose a legal spell rank.');
    if (!targets.length) throw Error('Select at least one target.');
    if (kind === 'disintegrate' && targets.length !== 1) throw Error('Disintegrate requires exactly one target.');
    if (kind !== 'disintegrate' && ![1,2,3].includes(actions)) throw Error('Choose one, two, or three actions.');
    if (kind === 'heal' && actions < 3 && targets.length !== 1) throw Error('One- and two-action Heal require exactly one target.');
    if (kind === 'force-barrage') {
        const count = actions * (1 + Math.floor((rank - 1) / 2));
        if (targets.some(t => !Number.isInteger(t.shards) || t.shards < 1) || targets.reduce((n,t)=>n+t.shards,0) !== count) throw Error(`Allocate exactly ${count} shards, with at least one per selected target.`);
    }
}

/** A private check may narrow an existing cast audience, never widen it. */
export function checkAudience(current, visibility, gmIds, rollerId) {
    if (!visibility?.blind && !visibility?.whisper?.length) return current;
    const allowed = new Set([...gmIds, ...(!visibility.blind ? [rollerId, ...(visibility.whisper ?? [])] : [])]);
    return current?.length ? [...new Set([...gmIds, ...current.filter(id => allowed.has(id))])] : [...allowed];
}
