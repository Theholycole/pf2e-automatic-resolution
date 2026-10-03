# Rank 4 batch 42 — Soothing Spring

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Soothing Spring (4) | A pool card for 1 hour with 16 places. For each creature that spent the full hour soaking, the GM presses Soak: it regains 10d8 Hit Points (+2d8 per rank, PF2e's healing roll) and loses Fatigued. Notes cover the pool's size and capacity, the structure trait, and fatigue's underlying source. |

## Rules

- **Soak (`food-healing.js` `compileSpring`):** it reads "Any creature that spends the full hour soaking in the … regains NdM Hit Points and feels refreshed, losing the Fatigued condition." (the item's healing entry), the capacity sentence (the number of soaks), the pool and fatigue notes, and the item's own Heightened healing step.
  - The result is the food route with verb `soak` and `removes: ["fatigued"]`.
- **Runtime (`effect-runtime.js`):** the card is worded for soaking, and `consumeFood` removes the listed conditions after healing and records them.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-42.test.js` is new. Its negative case is healing other than the item's.

A whole-corpus compile (b468 → b469) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-42-live-results.json), case `rank4Batch42`, in the `pftest` world, cast at 5th rank.
- The card shows 16 places, the notes and a Soak button.
- A Fatigued, wounded creature soaked: 12d8 vitality healing = 46. It is no longer Fatigued, and 15 places are left.
- **Cleanup:** fixtures removed.
