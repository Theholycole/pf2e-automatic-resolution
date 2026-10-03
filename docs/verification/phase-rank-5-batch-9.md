# Rank 5 batch 9 — Plasma Whirl

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Plasma Whirl (5) | Each PF2e action variant is a basic Reflex save: 1 action is a 15-foot cone, 2d6 + 2d6; 2 actions is a 30-foot cone, 5d6 + 5d6; 3 actions is a 60-foot cone, 5d6 + 5d6. The 3-action variant adds Sickened 1 on a failure and Sickened 2 on a critical failure. |

## Rules

- **Gate (`semantic-gate.js`):** "a temporary portal" is narration ("temporary" stays a signal elsewhere).
- **Degree riders (`basic-degree-rider.js`):** "X (Y on a critical failure)" with a trailing "due to …" flavor is read like ", or Y on a critical failure".

## Tests

1064 pass. `test/rank-5-batch-9.test.js` is new.

## Evidence

[Live evidence](phase-rank-5-batch-9-live-results.json), case `rank3Batch30` (one case for rank 3 batch 30, rank 4 batch 15 and rank 5 batch 9), in the `pftest` world.
- 3-action variant: a failure lost 35 and was Sickened 1; a critical failure lost 70 and was Sickened 2.
- 1-action variant: a failure lost 15, with no condition.
- **Cleanup:** fixtures removed.
