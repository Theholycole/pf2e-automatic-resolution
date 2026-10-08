// A d20 limit a module Effect gives ("… who roll below 10 on a d20 for an attack roll, Perception check, saving throw, or skill check get a 10
// instead", "any time it rolls above 10 … it gets a 10 instead"): pf2e-resolution-core's d20 patch asks this module's limit provider (main.js)
// on each check roll and sets the d20 to the limit before PF2e reads the total and grades the check.
import { MODULE_ID } from "./runtime-utils.js";

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
