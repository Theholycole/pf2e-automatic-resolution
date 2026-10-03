# Rank 5 batch 36 — Corrosive Muck

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Corrosive Muck (5) | Two 10-foot bursts (one more every 2 ranks) of greater difficult terrain for 1 minute. A creature that starts its turn in a pool or enters one takes 8d6 acid, basic Reflex, once a round; a critical failure also deals 1d6 persistent acid. |

## Rules

- **Acid pools (`src/compiler/acid-pools.js` `rewriteAcidPools`):**
  - It reads the Area line (the text's bursts; PF2e's item has none), the narration, the terrain, the strike, the critical-failure rider, the once-only sentence and the heightening.
  - It writes a separate-areas lingering table.
  - Post-compile: once a round, greater difficult terrain (3), and `areaCountStep`.
- **Core:**
  - The validator allows terrain difficulty 3 and `areaCountStep` only with this evidence.
  - `startLingering` adds the step's areas at the cast rank, and places them with the plan's shape when the item has none.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-36.test.js` is new. Its negative cases are another heightening (not read) and missing evidence (not executable).

A whole-corpus compile (b508 → b509) changed only Corrosive Muck.

## Evidence

[Live evidence](phase-rank-5-batch-36-live-results.json), case `rank5Batch36`, in the `pftest` world, in combat, at 7th rank.

| Step | Result |
| --- | --- |
| Started with 3 regions | `areaCount` 3; each region's walking cost ×3 |
| The creature starts its turn in a pool, critical failure | 8d6 acid doubled = 36 lost; 1d6 persistent acid |

**Cleanup:** fixtures removed.
