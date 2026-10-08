# Switching onto pf2e-resolution-core

2026-10-08. Milestone 2, step 2 of the module family (the core's `docs/switch-over.md`). PF2e's shared functions are now wrapped once, by `pf2e-resolution-core`, and this module plugs its parts into the core's patches. This module no longer wraps any PF2e or Foundry function. Resolution should not change.

## What changed

- **`module.json`** requires `pf2e-resolution-core`.
- **Shared helpers forward to the core:**
  - `scripts/runtime-utils.js` is `export *` from the core, plus `MODULE_ID` (this module's flags stay its own) and `core()`, the core's API.
  - `src/compiler/text-patterns.js` is `export *` from the core. The path is `../../../`: from `src/compiler/`, `../../` is this module's own root.
- **Five wrappers removed and registered with the core instead.** The registration is in `main.js`, on the core's `pf2eResolutionCoreReady` hook, which fires during `init`. That hook is set up when `main.js` loads, so it works whichever module Foundry loads first; see Live below.

  | Was | Now |
  |---|---|
  | `installD20Clamp` (`Check.roll`, `CheckRoll#evaluate`) | `d20.registerLimitProvider` with `d20LimitsFor` |
  | `installTextRules`, the `prepareRuleElements` wrapper | `rules.registerRewriter` with `rulesFromText` (text-rules.js) |
  | `installTextRules`, the `ItemPF2e.createDocuments` wrapper | `rules.registerCreateTransformer` with `cascadeTypeAhead` |
  | `patchSelectiveTerrain` (`_getTerrainEffects`) | `terrain.registerProvider` reading the behavior's `selectiveTerrain` flag. The difficulty rules are the core's `selectiveDifficulty`, moved unchanged. |
  | `wrapApplyDamage` | `damage.onApply` with `damageFollowUps`, registered first. Before the damage it returns `{ params, after }`: Duplicate Foe's copy's halved Strikes go in as the new parameters. After the damage the core awaits, in order and before the caller's await resolves: Spiritual Guardian, Soulshelter Vessel, Reflective Scales, Phoenix Ward, Shielding Formation and Palm-Held Sun's fire report. |
  | `installDamageTypeMemory` and `attachDamageSource` | `damage.onApply` with `shieldShardsBlock` (Demon Bone Tiles), registered second, so it runs after the follow-ups as before. The core remembers the damage types and source. |

- **Readers:**
  - `catalystSporesOnDamage` reads `core().patches.damage.lastTypes`.
  - `catalystOnDamage` reads `core().patches.damage.sourceOf`, which also reads the older stamp.
- **Also fixed:** an orphaned comment (Steel Fortifications' Broken Threshold) was moved back to its hook.

## Expected differences (from the core)

- The rules patch still installs at `setup`, because this module registers its rewriter during `init`. Text rules on actors already in the world at load were checked live, before and after the switch (see Live).
- The damage stamp is `flags.pf2e-resolution-core.damageSource`.
- The d20 domain mark is `pf2e-resolution-core-d20:min:max`. `options.d20Clamped` is set as before.

## Evidence (offline)

- **Unit tests:** all 1876 pass.
- **Compiled output is byte-identical** to before the 2026-10-08 cleanup:
  - the official compiler report (1,994 plans, minus `generatedAt`) and its three analysis reports;
  - the snapshot of the 227 third-party spells and every reader over 4,703 items.
- **Every runtime and compiler file links in node.** `main.js` stops only at Foundry's `Hooks` global.
- **`tools/core-provider-check.mjs`** runs this module's providers through the core's real `scripts/patches.js` with Foundry faked. Every check passes:
  - the d20 limit on saves only, including keep-highest;
  - a "+" Effect's rules from its text, with official items untouched;
  - selective terrain per creature, by size, for the living, and for unflagged regions;
  - Demon Bone Tiles' shield marked only on a Shield Block, after the follow-ups and before the caller's await resolves;
  - Duplicate Foe's halved Strikes reaching PF2e's `applyDamage` through `{ params }` (the real `halvedCopyDamage`);
  - both damage readers.

## Live

In pftest, after the user's Foundry restart. [Results](core-switch-over-2026-10-08-live-results.json).

- **Before the switch:** with the core enabled and this module unchanged, `api.patches.status()` showed `"spell-module"` four times. The core stood aside and nothing was wrapped twice.
- **After the switch:** `"core"` four times, and this module's old markers are gone. PF2e's `applyDamage` is owned by `CONFIG.Actor.documentClass.prototype`, which is the prototype the core wraps.
- **Load order:** the first reload registered nothing.
  - Foundry reads `relationships.requires` only when the server starts, so it still loaded this module before the core, and `init` found no API.
  - Registration moved to the core's `pf2eResolutionCoreReady` hook, which is set up when `main.js` loads. It works whichever module loads first.
- **Text rules after a reload:** a world actor and an unlinked token, each holding Scholar's Lore, kept the rules from its text after a reload. That held before the switch and after it, once the load-order fix was in.
- **Regression:** 157 runs over the cleanup's 99 cases plus 20 for the moved parts (d20 limits, text rules, Arcane Cascade, selective terrain, damage memory and source, damage follow-ups).
  - Part 1 was stopped when a started combat leaked by a harness case (`spellshapeBatch4`) cascaded into later cases' turn timing.
  - The harness now deletes every case's combats in a `finally`. `spellshapeBatch4` used to delete every combat in the world.
  - Everything passes except the three known older failures (`lingering`, `longTailBatch3`, `attackConditionRiders`).
- **Found and fixed along the way:**
  - **Tiny tokens:** they were measured from a half-square footprint (`token-distance.js`), so a familiar's 10-foot aura missed a creature two squares away.
  - **Mosquito Blight's hive:** destroying it ended the ritual at once instead of an hour later. `summonEndsAtZero` (added in 3f519de) deleted the ritual's Effect. It now leaves `endsAfter` hives to the hook that shortens them.
  - **Stale wording:** `rank7Batch17` and `rank8Batch14` checked for card wording from before forced movement and elevation were automated.
- **The core's registry:** `preparePlan(spell).plan` equals `readPlan(await api.compile(spell))`, as described in [native-numbers-2026-10-08.md](native-numbers-2026-10-08.md).
