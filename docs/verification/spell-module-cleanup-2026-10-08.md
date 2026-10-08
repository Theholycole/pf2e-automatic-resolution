# Spell module cleanup: dead and redundant code

2026-10-08. The user asked to "clean up the code for the spell module. Remove any dead or redundant code". This is a refactor with no intended change to resolution. Its one deliberate behaviour change is a performance fix: three hooks are now guarded.

## What changed

- **Dead code removed:**
  - 4 exports nothing used: `shapeHoneFor`, which duplicated the "hone" rider's own handling; `shapeRidersOfType`; `bloodMagicPlain`; `APOCALYPSE_SOURCE`.
  - 2 unused imports and 7 unused constants.
  - In the tests, 115 unused helpers and imports, mostly `withText`.
  - What those removals left unused (`unlink` in blood-magic.js, 13 import lines).
- **Copies merged.** 677 copies of 117 one-line helpers were pasted into each file.
  - The compiler's copies are now one definition each in the new `src/compiler/text-patterns.js`, grouped into commented sections: rule words, links, sentences, degree and word tables.
  - The runtimes' copies are in `scripts/runtime-utils.js`, which already held `escapeHTML`.
  - Each file imports its helper under its old local name, so no use site changed.
  - Four whole functions were also moved: `isLeadGM`, `degreeOf`, `unique` and `baseReference`.
- **Not merged:**
  - top-level regexes with a g flag (they keep state);
  - the per-file `new Map()`/`new Set()` caches;
  - helpers that read a file's own constants.
- **Shared tables are frozen.**
- **Performance (found by the auto-combat session).** Every Combat update ran a full ongoing-spell reconcile, up to a second of freeze with 16 combatants. It now runs only when the turn or round changes. The updateUser reconcile now runs only on role or active changes, and the updateToken reconcile only on position, size, elevation, hidden, disposition or actor changes.

## Evidence

- **Unit tests:** all 1876 pass.
- **Compiled output is byte-identical before and after:**
  - the official compiler report (1,994 plans, minus `generatedAt`) and its three analysis reports;
  - a snapshot of the 227 third-party spells' plans (with action variants);
  - every reader's output for 4,703 items.
- **Every runtime file links in node.** `main.js` fails only on Foundry's missing `Hooks` global.
- **Live check:** [99 cases](spell-module-cleanup-2026-10-08-live-results.json): every third-party feature batch, every spell-features and notes batch, and a case for each runtime family. 94 passed on the first pass.
  - `thirdPartyFeaturesBatch5`: a natural 1. It passes alone.
  - `thirdPartyBatch65`: orphaned summon tokens from earlier test runs (their casters long deleted) stood inside the test areas. With them removed, it passes.
  - `longTailBatch3`, `lingering` and `attackConditionRiders` fail the same way with the three old unguarded hooks restored in memory. The cleanup changed only identical-helper imports in the code they use. They're pre-existing failures (the last recorded pass of `attackConditionRiders` is 2026-09-26), left for their own investigation.
