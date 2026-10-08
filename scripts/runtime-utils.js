// Runtime helpers: the shared ones live in pf2e-resolution-core (moved there unchanged, 2026-10-08); this module keeps its own id for its flags.
export * from "../../pf2e-resolution-core/scripts/runtime-utils.js";
export const MODULE_ID = "pf2e-automatic-resolution";

/** pf2e-resolution-core's API (a required module: there from its init on). */
export const core = () => game.modules.get("pf2e-resolution-core")?.api ?? null;
