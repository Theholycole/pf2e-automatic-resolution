# Rank 5 batch 33 — Invoke Spirits

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Invoke Spirits (5) | A sustained 10-foot burst. Living creatures in it take 2d4 mental + 2d4 void (+1d4 each per 2 ranks), basic Will, when it's cast and wherever it's moved on the first Sustain each round. A critical failure means double damage, Frightened 2 and Fleeing for 1 round; on a Sustain, no Fleeing. |

## Rules

- **Moved basic save (`moved-area-save.js` `rewriteMovedBasicSave`):**
  - It reads the damage sentence (each part one of the item's entries), the critical-failure rider and the Sustain move with its exception.
  - It writes the basic save's rows with the rider, and `lingering.sustainDrops`.
- **Core:**
  - `lingeringExposurePlan(event: "sustain")` drops those conditions.
  - The validator ties them to the rows and the sentence.
  - `startLingering` builds the Sustain exposure plan.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-33.test.js` is new. Its negative cases are another exception (not read) and a condition the rows don't apply (not executable). Ancestral Winds' test still passes.

A whole-corpus compile (b503 → b504) changed only Invoke Spirits.

## Evidence

[Live evidence](phase-rank-5-batch-33-live-results.json), case `rank5Batch33`, in the `pftest` world, in combat, at 7th rank.

| Exposure, critical failure | Result |
| --- | --- |
| Cast | 3d4 mental + 3d4 void, doubled = 34 lost; Frightened 2, Fleeing |
| Sustain | 32 lost; Frightened 2, no Fleeing |

**Cleanup:** fixtures removed.
