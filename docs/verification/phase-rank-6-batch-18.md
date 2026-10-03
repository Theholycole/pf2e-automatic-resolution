# Rank 6 batch 18 — Awaken Entropy

2026-10-03. Growing areas.

| Spell | Now |
| --- | --- |
| Awaken Entropy | A sustained lingering burst: a creature entering it or starting its turn inside takes 8d6 void (basic Fortitude, heightened). A creature PF2e says void doesn't affect (a construct, an undead) takes the same roll as force instead. The first Sustain each turn grows the region by 10 feet (to at most 40) and steps the dice to the next listed formula at the cast rank: (2+rank)d8, then d10, then d12. |

Runtime: a growth on every Sustain may have a maximum and stepped dice (the exposures' damage becomes the next formula); a new damage swap, "not-affected" (the second type when PF2e says the first doesn't affect the creature).

## Tests

`test/rank-6-batch-18.test.js` is new. A whole-corpus compile (b755 → b756) changed only Awaken Entropy.

## Evidence

[Live evidence](phase-rank-6-batch-18-live-results.json), case `rank6Batch18`, in the `pftest` world.

| Step | Result |
| --- | --- |
| The first Sustain | The burst grows to 20 feet |
| A living creature and a construct start their turns inside | 8d8 void each; the construct's swapped to force (34 and 24 damage) |
| Three more Sustains | The burst stops at 40 feet (region too); the dice reach 8d12 |

**Cleanup:** fixtures removed.
