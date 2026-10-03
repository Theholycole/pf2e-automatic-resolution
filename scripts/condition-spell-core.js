/** Recoverable conditions survive the spell that restricts their recovery. */
export function sickenedAfterRecovery(value, degree, { spellActive = false, visible = false } = {}) {
    if (!Number.isInteger(value) || value < 1) throw Error('A current Sickened value is required.');
    const reduction = { criticalSuccess: 2, success: 1, failure: 0, criticalFailure: 0 }[degree];
    if (reduction === undefined) throw Error('Finalize a Fortitude save first.');
    if (spellActive && visible == null && reduction) throw Error('Review whether the caster can see the target before resolving recovery.');
    return Math.max(spellActive && visible ? 1 : 0, value - reduction);
}
export function emptyConditionSavePlan(item, statistic = 'will') {
    return {
        compilerVersion: 'condition-spells-1', source: { name: item.name, uuid: item.uuid }, rank: item.baseRank ?? item.system.level.value,
        automation: { level: 'guided', pendingCapabilities: [], delegatedCapabilities: [] },
        targeting: { actorConstraints: { supportsActorTargets: true, complete: true, predicates: [] } },
        lifecycle: { durationSpec: { mode: 'instantaneous' }, controller: { required: false } },
        resolution: { kind: 'save', check: { statistic, basic: false }, sharedDamage: null,
            outcomes: Object.fromEntries(['criticalSuccess','success','failure','criticalFailure'].map(degree => [degree, {
                damage: { mode: 'none', multiplier: 0 }, effects: [], nativeEffects: [], followUps: [], decisions: [], manualInstructions: [], terminal: null,
                semanticCoverage: { fullyCompiled: true }
            }])) }
    };
}

/** Clinging Ice deals damage once; only its speed penalty is sustained. */
export function clingingIceSavePlan(item) {
    const plan = emptyConditionSavePlan(item, 'reflex');
    const components = Object.entries(item.system.damage ?? {}).map(([id, value]) => ({id, ...structuredClone(value)}));
    if (!components.length) throw Error('Clinging Ice needs native damage data.');
    plan.resolution.sharedDamage = {mode:'pf2e-item-damage',rollOnce:true,components};
    for (const [degree, multiplier] of Object.entries({criticalSuccess:0,success:0.5,failure:1,criticalFailure:2})) {
        plan.resolution.outcomes[degree].damage = {mode:multiplier?'shared':'none',multiplier,sourceComponentIds:components.map(c=>c.id)};
    }
    return plan;
}
