# Rank 4 batch 54 — Coral Eruption

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Coral Eruption (4) | Two 10-foot bursts (a third underwater): 6d6 piercing (+3d6 per 2 ranks), basic Reflex. A critical failure also deals 1d6 persistent bleed. After Finalize, the card places each burst's region as difficult terrain for 1 minute. The hazardous terrain's (floor(rank/2) + 1) piercing per square moved into is the GM's Ongoing control. |

## Rules

- **Reef terrain (`src/compiler/reef-terrain.js` `rewriteReefTerrain`):**
  - It reads the two-bursts Area line, the narration, the underwater note, the cast damage (the item's entry), the critical-failure bleed, the terrain and the per-square sentence, and the heightening (the item's step and floor(rank/2)).
  - It writes the save's rows and `resolution.areaTerrain` with `count` and a per-square `gmHazard`.
- **Validator:** `isReefTerrain` in `basic-save-core.js`.
- **Runtime:**
  - `placeAreaTerrain` places each selected region (up to one more than the count) as a region area.
  - Each region has the per-square control at the cast rank.
  - The card names the damage.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-54.test.js` is new. Its negative cases are another hazard (not read) and a non-rank formula (not executable). Ice Storm's test still passes.

A whole-corpus compile (b507 → b508) changed only Coral Eruption.

## Evidence

[Live evidence](phase-rank-4-batch-54-live-results.json), case `rank4Batch54`, in the `pftest` world, at 6th rank (9d6 piercing = 22).

| Step | Result |
| --- | --- |
| Critical failure, success | 44 lost with 1d6 persistent bleed; 11 lost |
| Two regions placed | Both difficult terrain; per-square control `(floor(6/2)+1)[piercing]` |
| A creature moved into 2 squares | 8 lost |

**Cleanup:** fixtures removed.
