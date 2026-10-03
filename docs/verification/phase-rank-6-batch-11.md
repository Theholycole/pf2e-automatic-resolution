# Rank 6 batch 11 — Tentacular Innervation

2026-10-03. Ranks 6–10 pass, continued.

| Spell | Now |
| --- | --- |
| Tentacular Innervation | The spell-Strike route (Tracking Mayflies' family): the card offers only the caster's unarmed Strikes (PF2e's unarmed trait or category). A hit gives the target Sickened 1 (PF2e's condition) and Grabbed for the spell's 1 minute (an Effect whose description says an Escape against the spell DC ends it). The extra 10-foot reach, "isn't Immobilized but can't move beyond the reach", the Escape ending the spell and the tentacles' AC and HP are notes on the card. |

## Tests

`test/rank-6-batch-11.test.js` is new. A whole-corpus compile (b743 → b744) changed only Tentacular Innervation.

## Evidence

[Live evidence](phase-rank-6-batch-11-live-results.json), case `rank6Batch11`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast with an unarmed and a weapon attack | One button, the unarmed one; 5 notes |
| The unarmed Strike against AC 5 | A critical hit; Sickened 1; Grabbed for 1 minute, with the Escape note |

**Cleanup:** fixtures removed.
