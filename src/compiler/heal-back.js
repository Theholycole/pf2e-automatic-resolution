// A drain that heals someone the caster picks (Life Tap):
//   Success "The creature is @UUID[…]{Drained 1} but recovers after 1 minute. You or an ally of your choice within 30 feet of the thrall
//   regains Hit Points equal to double the amount the creature lost. A creature can be healed by this spell only once every 10 minutes."
//   Failure "As success, but @UUID[…]{Drained 2}." / Critical Failure "As success, but @UUID[…]{Drained 3}." / Critical Success unaffected.
// Each row's Drained lasts that long; after Finalize, the caster targets the creature to heal (itself or an ally within that distance
// of the thrall), which regains double the Hit Points the saving creature lost (PF2e lowers them for Drained at once), and is then
// marked for the stated time, during which this spell can't heal it again.
const DRAINED = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Drained (\d)\}`;
const RECOVERS = new RegExp(String.raw`^The creature is ${DRAINED} but recovers after (\d+) (minute|round)s?\.$`);
const HEAL = /^You or an ally of your choice within (\d+) feet of the (thrall|target) regains Hit Points equal to (double|half) the amount the creature lost\.$/;
const ONCE = /^A creature can be healed by this spell only once every (\d+) (minute|hour)s?\.$/;
const AS_SUCCESS = new RegExp(String.raw`^As success, but ${DRAINED}\.$`);

const split = text => String(text ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);

/** Rewrites the rows' Drained durations and returns {healBack, claims} or null. */
export function compileHealBack(plan, { thrall = null } = {}) {
    const outcomes = plan.resolution?.outcomes ?? {};
    if (plan.resolution?.kind !== "save" || plan.resolution.check?.basic !== false) return null;
    const success = split(outcomes.success?.rawText);
    if (success.length !== 3) return null;
    const recovers = RECOVERS.exec(success[0]), heal = HEAL.exec(success[1]), once = ONCE.exec(success[2]);
    if (!recovers || !heal || !once) return null;
    if (heal[2] === "thrall" && !thrall) return null;
    if (!/^The (?:target|creature) is unaffected\.$/.test(String(outcomes.criticalSuccess?.rawText ?? "").trim())) return null;
    const rows = { success: Number(recovers[1]) };
    for (const degree of ["failure", "criticalFailure"]) {
        const inherited = AS_SUCCESS.exec(String(outcomes[degree]?.rawText ?? "").trim());
        if (!inherited) return null;
        rows[degree] = Number(inherited[1]);
    }
    const duration = { mode: "fixed", value: Number(recovers[2]), unit: `${recovers[3]}s`, expiry: null, anchor: "effect-start", sourceText: `recovers after ${recovers[2]} ${recovers[3]}${recovers[2] === "1" ? "" : "s"}` };
    for (const [degree, value] of Object.entries(rows)) {
        const effects = outcomes[degree].effects ?? [];
        if (effects.length !== 1 || effects[0].slug !== "drained" || effects[0].value !== value || effects[0].duration != null || effects[0].endsWhen) return null;
    }
    for (const degree of Object.keys(rows)) {
        const outcome = outcomes[degree];
        outcome.effects[0].duration = { ...duration };
        outcome.effects[0].expirationMode = "duration";
        outcome.manualInstructions = [];
        outcome.healBackClaims = degree === "success" ? [...success] : [String(outcome.rawText).trim()];
    }
    return {
        healBack: { multiplier: heal[3] === "double" ? 2 : 0.5, measure: "hp-lost", recipient: "caster-or-ally", within: { of: heal[2], feet: Number(heal[1]) },
            degrees: Object.keys(rows), onceEvery: { value: Number(once[1]), unit: `${once[2]}s` }, sourceText: [success[1], success[2]] },
        claims: success
    };
}
