# Rank 8 batch 9 — Falling Sky

2026-10-04.

| Spell | Now |
| --- | --- |
| Falling Sky | A 30-foot-radius cylinder. Every creature in it attempts a Fortitude save. Critical success: unaffected. Success: Prone. Failure: Prone and Stunned 2. Critical failure: Prone and Stunned for 1 round. Each creature above the ground (its token's elevation) first drops to the ground and takes twice the falling damage for the distance, which is the distance itself, to a maximum of 60 bludgeoning, whatever its save. |

Interpretations: the area's bottom is the ground. If the cylinder starts in the air, the GM adjusts the distance and elevation (the card's reminder). A flyer that critically succeeds still takes the fall but isn't Prone.

Runtime: a save card can drop its flying targets to the ground with falling damage.

## Tests

`test/rank-8-batch-9.test.js` is new. A whole-corpus compile (b763 → b764) changed only Falling Sky.

## Evidence

[Live evidence](phase-rank-8-batch-9-live-results.json), case `rank8Batch9`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Flying at 40 feet, critical success | Lands; 40 bludgeoning; not Prone |
| On the ground, failure | No fall; Prone and Stunned 2 |
| Flying at 80 feet, critical failure | Lands; 60 (the maximum); Prone and Stunned for 1 round |

**Cleanup:** fixtures removed.
