# Rank 9 batch 4 — Unspeakable Shadow

2026-10-03. Ranks 6–10 pass, continued.

| Spell | Now |
| --- | --- |
| Unspeakable Shadow | A success: Frightened 2. A failure: Frightened 3 and a floor (it can't go below Frightened 1) for 1 minute. A critical failure: Phantasmal Killer's form — a Fortitude save with the incapacitation trait; a failure dies; a success is Frightened 4, with the same 1-minute floor. "Must spend an action each turn attacking or fleeing its shadow" is a note while it's Frightened by the spell (on the critical failure, only if it survives). |

Runtime: condition floors gain a fixed lifetime ("for 1 minute"); a second save's notes go with its own results.

## Tests

`test/rank-9-batch-4.test.js` is new. A whole-corpus compile (b750 → b751) changed only Unspeakable Shadow.

## Evidence

[Live evidence](phase-rank-9-batch-4-live-results.json), case `rank9Batch4`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A failure / a critical failure that survives / one that doesn't | Frightened 3 with the 1-minute floor and the Shadow note / Frightened 4 with the floor / dead |
| Reducing the failure's Frightened four times | It stops at 1 |

**Cleanup:** fixtures removed.
