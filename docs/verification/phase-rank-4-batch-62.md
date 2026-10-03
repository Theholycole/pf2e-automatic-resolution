# Rank 4 batch 62 — Daydreamer's Curse

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Daydreamer's Curse (4) | Will. A generated Effect: Medicine, Nature, Perception and Survival rolled twice keeping the worse, and a concentrate action's critical success at Perception or a skill becomes a success. It lasts 10 minutes on a success and permanently on a failure. **Critical failure:** permanent, with every concentrate check one degree worse instead. |

## Rules

- **Skill curse, daydream variant (`skill-curse.js`):**
  - It reads the three rows.
  - Success and failure: `RollTwice` on the four checks, and `AdjustDegreeOfSuccess {criticalSuccess: to-success}` on Perception and skill checks with the predicate `item:trait:concentrate`.
  - Critical failure: `RollTwice` and `AdjustDegreeOfSuccess {all: one-degree-worse}` on every check with that predicate.
- **Note rules:** RollTwice may include Perception; the two concentrate adjustments are accepted only exactly so.
- **Check:** a Seek check (a concentrate action) carries `item:trait:concentrate` in PF2e's roll options.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-62.test.js` is new. Its negative case is another trait (not read). Clownish Curse's test still passes.

A whole-corpus compile (b523 → b524) changed only Daydreamer's Curse.

## Evidence

[Live evidence](phase-rank-4-batch-62-live-results.json), case `rank4Batch62`, in the `pftest` world.

| Result | Effect | Rules |
| --- | --- | --- |
| Success | 10 minutes | 3, none ignored |
| Failure | permanent | 3, none ignored |
| Critical failure | permanent | 2, none ignored |

**Cleanup:** fixtures removed.
