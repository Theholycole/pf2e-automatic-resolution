# Rank 7 batch 12 — Orb of Twisting Fate, Beheading Buzz Saw, Expunge Blood

2026-10-04.

| Spell | Now |
| --- | --- |
| Orb of Twisting Fate | Will save. Each failing result gives the target a GM note (choose Stride in a random direction or do nothing with its first action). The note lasts until the end of its next turn on a success; for the spell's 10 rounds on a failure, with a Will save at the end of each of its turns that ends it; and for the whole minute on a critical failure. |
| Beheading Buzz Saw | A 60-foot line: 5d10 slashing and 4d6 persistent bleed (+1d10 and +1d6 a rank). There's no critical success row, so it's unaffected, as on a success. Failure: full damage. Critical failure: double, then a Fortitude save (death, incapacitation) that kills on a failure. The card reminds the GM to skip that save for a creature without a head it needs. |
| Expunge Blood | Fortitude save. The GM confirms the target has blood (one without is immune). Success: Drained 1 and Clumsy 1 for 1 round. Failure: Drained 2 and Clumsy 1 for 1 minute. Critical failure: Drained 3 and Clumsy 2 for 1 minute. Drained keeps its own recovery. Clumsy rises by 1 while the target has persistent bleed damage (a rule on the row's note). |

Interpretations: "Drained 1 and Clumsy 1 for 1 round" times only Clumsy; Drained recovers as PF2e's condition does (the user's ruling on such lists). A missing critical success row reads as the success row (unaffected).

Runtime: a degree table may scale both its entries, one persistent, as a basic save does; a row note can carry a condition's value rise while the creature has a persistent damage type.

## Tests

`test/rank-7-batch-12.test.js` is new. A whole-corpus compile (b760 → b761) changed only these three spells.

## Evidence

[Live evidence](phase-rank-7-batch-12-live-results.json), case `rank7Batch12`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Orb: success, failure, critical failure | Notes for 1 round, 10 rounds, 1 minute; the failure's save card at its turn's end |
| Buzz Saw: success, failure, critical failure (second save failed) | 0; 22 and 4d6 persistent bleed; dead; the head reminder on the card |
| Expunge Blood: failure | Drained 2 (own recovery), Clumsy 1; Clumsy 2 while bleeding, 1 after |

**Cleanup:** fixtures and combat removed.
