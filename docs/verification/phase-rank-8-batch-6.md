# Rank 8 batch 6 — Spirit Song

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Spirit Song | Read as a basic Fortitude save (its rows are exactly half, full and double damage) with Stunned 1 on a failure and Stunned 2 on a critical failure. "Can't use reactions until the beginning of its turn" is a note on the success, failure and critical failure, lasting until that creature's turn starts. The solid-barriers sentence is a GM reminder about who's caught. |

## Tests

`test/rank-8-batch-6.test.js` is new. A whole-corpus compile (b739 → b740) changed only Spirit Song.

## Evidence

[Live evidence](phase-rank-8-batch-6-live-results.json), case `rank8Batch6`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A success and a critical failure (roll 58) | 29 and 116 damage; Stunned 0 and 2; the "No reactions" note on both; the barriers reminder on the card |

**Cleanup:** fixtures removed.
