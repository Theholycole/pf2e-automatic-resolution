# Rank 6 batch 17 — Cast into Time

2026-10-03. Ranks 6–10 pass, continued.

| Spell | Now |
| --- | --- |
| Cast into Time | The table's damage (5d8 mental and 5d6 bludgeoning: half, full, double) and Sickened 1 / 2 apply at once. "Falls into time" is a GM reminder: hide the token until the end of the caster's turn, then return it (nearest empty space if needed). Creatures immune to mental effects still take the bludgeoning (PF2e's own immunity removes the mental part; a reminder). |

## Tests

`test/rank-6-batch-17.test.js` is new. A whole-corpus compile (b754 → b755) changed only Cast into Time.

## Evidence

[Live evidence](phase-rank-6-batch-17-live-results.json), case `rank6Batch17`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A success / a critical failure | 13 / 54 damage; Sickened 0 / 2; the reminder on the card |

**Cleanup:** fixtures removed.
