# Rank 3 batch 50 — Hedge Prison

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Hedge Prison (3) | One Medium or smaller creature (Large from 5th, Huge from 7th) saves (Reflex). Success, failure and critical failure each add a "Trapped in the hedge" note, sustained for 1 minute. It gives the hedge's AC 5 and its Hardness and Hit Points at the cast rank: Hardness 5 (+2 per rank) and 20 Hit Points (+10 per rank), halved on a success and increased by half on a critical failure. Critical success: a GM note (it escapes). |

## Rules

- **Prison field (`prison-field.js` `compilePrisonField`):** it reads the conjure sentence, the statistics sentence, the immunity sentence, the escape and trapped rows, and the fixed Heightened table.
  - The table must be one linear step a rank for both numbers.
  - Its size sentences must match PF2e's target data at those ranks.

  The trapped rows become a note with `{amount}` (Hit Points × 0.5 / 1 / 1.5) and `{amount2}` (Hardness). The size limit gets `byRank`.
- **Note runtime (`note-effects.js`):** a second number at the cast rank (`rankAmount2`, "{amount2}"), and the 1.5 multiplier.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-50.test.js` is new. Its negative case is a Heightened table that isn't one step a rank.

A whole-corpus compile (b465 → b466) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-50-live-results.json), case `rank3Batch50`, in the `pftest` world, cast at 5th rank.
- The three Large creatures were eligible; the Huge one wasn't.
- The notes gave Hardness 9 with 20 Hit Points on a success, 40 on a failure and 60 on a critical failure.
- **Cleanup:** fixtures removed.
