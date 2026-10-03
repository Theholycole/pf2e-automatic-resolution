# Rank 6 batch 16 — Spellwrack

2026-10-03. Ranks 6–10 pass, continued.

| Spell | Now |
| --- | --- |
| Spellwrack | Each failing row is a curse note on the target: 1 minute on a success, with no end on a failure or critical failure. Its Ongoing control ("became affected by a spell with a duration") gives the target the persistent force damage, 2d12 (4d12 on a critical failure), each time the GM reports it. The shortened spell durations and the Arcana-only recovery are in the note for the GM. |

Runtime: a new triggered-damage trigger, "spell-affected", giving persistent damage each time.

## Tests

`test/rank-6-batch-16.test.js` is new. A whole-corpus compile (b752 → b753) changed only Spellwrack.

## Evidence

[Live evidence](phase-rank-6-batch-16-live-results.json), case `rank6Batch16`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A success / a critical failure | The 1-minute note / the unlimited note |
| The critical failure's control | PF2e's persistent damage condition: 4d12 force |

**Cleanup:** fixtures removed.
