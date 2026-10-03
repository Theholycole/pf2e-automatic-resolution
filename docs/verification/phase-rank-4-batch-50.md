# Rank 4 batch 50 — Stifling Stillness

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Stifling Stillness (4) | A 1-minute burst of difficult terrain. A creature that starts its turn inside saves: the basic Fortitude save's 3d6 poison (+3d6 per 2 ranks) and Fatigued on every row. Its action straining to breathe, and who breathes, are notes. |

## Rules

- **Stifling air (`src/compiler/stifling-air.js` `rewriteStiflingAir`):**
  - It reads the narration, the terrain sentence, the strain sentence (the item's one damage entry, its save and the condition) and PF2e's heightening.
  - It rewrites them as the lingering area's turn-start exposure, with the basic save's four rows each carrying the condition. The rows make it a degree save.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-50.test.js` is new. Its negative case is another wording of the condition (not read).

A whole-corpus compile (b499 → b500) changed only Stifling Stillness.

## Evidence

[Live evidence](phase-rank-4-batch-50-live-results.json), case `rank4Batch50`, in the `pftest` world, in combat, at 6th rank.

| Step | Result |
| --- | --- |
| Placed | The region is difficult terrain; 2 notes |
| The creature starts its turn inside, failure | 6d6 poison = 30 lost; Fatigued |

**Cleanup:** fixtures removed.
