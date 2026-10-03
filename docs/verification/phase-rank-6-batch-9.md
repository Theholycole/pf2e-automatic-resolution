# Rank 6 batch 9 — Suspended Retribution

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Suspended Retribution | Purifying Veil's route (a GM-triggered save on the cast's target): the omen is on the target for 1 minute. When the target takes the chosen triggering action, the GM's control opens its basic Reflex save against PF2e's damage (70 mental, +10 per rank above 6th), and the omen is spent (the spell ends). The trigger list (the caster's pick) and the warding (3 concentrate actions, then the GM ends the spell) are notes. |

## Tests

`test/rank-6-batch-9.test.js` is new. A whole-corpus compile (b740 → b741) changed only Suspended Retribution.

## Evidence

[Live evidence](phase-rank-6-batch-9-live-results.json), case `rank6Batch9`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 7th, the GM's control, a failure | The two notes; the save card for 80 mental; 80 damage taken; the spell ended |

**Cleanup:** fixtures removed.
