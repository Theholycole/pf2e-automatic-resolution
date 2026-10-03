# Rank 6 batch 8 — Necrotize

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Necrotize | The damage by the rows (half, full, double). The card rolls the 1d4 when cast; the result picks the body part on PF2e's Effect for the row (the success's until the end of the caster's next turn, the failure's 1 minute). Each part's rule in PF2e's Effect is proved against the list (Bones weakness 3 to bludgeoning, Joints Clumsy 1, Legs –10-foot status penalty to Speeds, Muscles Enfeebled 1). A critical failure gets the 1-minute Effect twice: the rolled part, and a second part the caster picks on the card (asked only when a target critically fails). |

## Tests

`test/rank-6-batch-8.test.js` is new. A whole-corpus compile (b736 → b737) changed only Necrotize.

## Evidence

[Live evidence](phase-rank-6-batch-8-live-results.json), case `rank6Batch8`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Roll fixed at 2 (Joints), caster's pick Muscles; failure / critical failure | 38 / 76 damage; the 1-minute Effect on Joints (Clumsy 1) / two 1-minute Effects, Joints and Muscles (Clumsy 1, Enfeebled 1) |

**Cleanup:** fixtures removed.
