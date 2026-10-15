// Runtime helpers: the shared ones live in pf2e-resolution-core (moved there unchanged, 2026-10-08); this module keeps its own id for its flags.
export * from "../../pf2e-resolution-core/scripts/runtime-utils.js";
export const MODULE_ID = "pf2e-automatic-resolution";

/** pf2e-resolution-core's API (a required module: there from its init on). */
export const core = () => game.modules.get("pf2e-resolution-core")?.api ?? null;

/** The id of the item that gave an actor's temporary Hit Points (PF2e 8.6 writes `hp.tempSource`; 8.5 wrote `hp.tempsource`). */
export const tempHPSourceId = hp => { const id = hp?.tempSource ?? hp?.tempsource; return typeof id === "string" ? id : null; };
