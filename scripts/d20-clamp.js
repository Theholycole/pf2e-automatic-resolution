// A d20 limit a module Effect gives ("… who roll below 10 on a d20 for an attack roll, Perception check, saving throw, or skill check get a 10
// instead", "any time it rolls above 10 … it gets a 10 instead"): PF2e's check roll is marked with the limit when its actor holds such an Effect,
// and the marked roll's d20 is set to the limit before PF2e reads the total and grades the check.
import { MODULE_ID } from "./runtime-utils.js";

const MARK = "pf2e-auto-d20:";

/** The d20 limits on the actor's Effects for a check type: {min, max} (the tightest of each), or null. */
export function d20LimitsFor(actor, type) {
    let min = null, max = null;
    for (const effect of actor?.itemTypes?.effect ?? []) {
        const clamp = effect.flags?.[MODULE_ID]?.runtime?.d20Clamp;
        if (!clamp || !(clamp.types ?? []).includes(type)) continue;
        if (Number.isInteger(clamp.min)) min = Math.max(min ?? 1, clamp.min);
        if (Number.isInteger(clamp.max)) max = Math.min(max ?? 20, clamp.max);
    }
    return min == null && max == null ? null : { min, max };
}

/** A d20 result within the limits. */
export function clampD20(result, { min = null, max = null }) {
    let value = result;
    if (min != null) value = Math.max(value, min);
    if (max != null) value = Math.min(value, max);
    return value;
}

/** Wraps PF2e's Check.roll (marking the roll) and CheckRoll#evaluate (applying the mark). Once, at ready. */
export function installD20Clamp() {
    const Check = game.pf2e?.Check;
    const CheckRoll = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "CheckRoll");
    if (!Check?.roll || !CheckRoll || Check.roll[MODULE_ID]) return false;
    const roll = Check.roll;
    Check.roll = async function (check, context = {}, ...rest) {
        const actor = context?.origin?.actor ?? context?.actor ?? null;
        const limits = actor ? d20LimitsFor(actor, context?.type) : null;
        if (limits) context.domains = [...(context.domains ?? []), `${MARK}${limits.min ?? ""}:${limits.max ?? ""}`];
        return roll.call(this, check, context, ...rest);
    };
    Check.roll[MODULE_ID] = true;
    const evaluate = CheckRoll.prototype.evaluate;
    CheckRoll.prototype.evaluate = async function (...args) {
        const result = await evaluate.apply(this, args);
        const mark = (this.options?.domains ?? []).find(domain => typeof domain === "string" && domain.startsWith(MARK));
        if (!mark) return result;
        const [min, max] = mark.slice(MARK.length).split(":").map(value => value === "" ? null : Number(value));
        let changed = false;
        for (const die of this.dice.filter(term => term.faces === 20)) for (const entry of die.results) {
            const value = clampD20(entry.result, { min, max });
            if (value !== entry.result) { entry.result = value; changed = true; }
        }
        if (changed) {
            // (Keep-highest/lowest picks again from the limited results; the total follows.)
            for (const die of this.dice.filter(term => term.faces === 20 && term.results.length > 1)) {
                const keep = die.modifiers.includes("kh") ? "max" : die.modifiers.includes("kl") ? "min" : null;
                if (!keep) continue;
                const best = Math[keep](...die.results.map(entry => entry.result));
                let kept = false;
                for (const entry of die.results) { const keepThis = !kept && entry.result === best; entry.active = keepThis; entry.discarded = !keepThis; if (keepThis) kept = true; }
            }
            this._total = this._evaluateTotal();
            this.options.d20Clamped = { min, max };
        }
        return result;
    };
    return true;
}
