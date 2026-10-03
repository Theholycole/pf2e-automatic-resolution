# Rank 4 batch 49 — Ice Storm

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Ice Storm (4) | When cast: 2d8 bludgeoning + 2d8 cold, basic Reflex (+1d8 each per 2 ranks). After Finalize, the card places the storm: difficult terrain, Sustained up to 1 minute. A creature that ends its turn inside takes floor(rank/2) cold, with no save. The outdoor second cloud is a note. |

## Rules

- **Storm area (`src/compiler/storm-area.js` `compileStormArea`):**
  - It reads the hail sentence (both of the item's damage entries and its basic save), the terrain sentence, the turn-end damage formula, the two cloud sentences, and the heightening, which must match the item's step and floor(rank/2).
  - It writes `resolution.areaTerrain` with `sustained`, a `hazard` (turn-end, a formula of the rank) and notes.
  - The rest of the description must be a plain basic save.
- **Validator:** `isStormArea` in `basic-save-core.js`. It exempts the save route's lifecycle check, because the storm is the sustained part.
- **Runtime:**
  - `placeAreaTerrain` starts the region area with the turn-end hazard at the cast rank, Sustained, with the notes.
  - The card names the damage: "3 cold damage (no save); Sustain it each turn".
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-49.test.js` is new. Its negative cases are another heightening step (not read) and a non-rank formula (not executable).

A whole-corpus compile (b498 → b499) changed only Ice Storm.

## Evidence

[Live evidence](phase-rank-4-batch-49-live-results.json), case `rank4Batch49`, in the `pftest` world, in combat, at 6th rank.

| Step | Result |
| --- | --- |
| Hail, failure | 3d8 bludgeoning + 3d8 cold = 33 lost |
| The storm placed | Sustained, turn-end, `(floor(6/2))`; the region has difficult terrain |
| The creature ends its turn inside | 3 cold lost |

**Cleanup:** fixtures removed.
