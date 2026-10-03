# Rank 3 batch 31 — Wall of Virtue

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Wall of Virtue (3) | The GM draws the wall. A creature that crosses it, or is in it as its turn starts, takes one roll of 1d8 spirit + 1d8 vitality (+1d8 each per 2 ranks), applied with PF2e's IWR. Vitality harms only undead and void-healing creatures. The light is a GM note; the counteract against magical darkness is the card's button. |

## Rules

- **Damaging wall (`damaging-wall.js`):**
  - A crossing sentence with two damage types is read; each type must be one of the item's entries, with "Heightened (+N) The X damage increases by …, and the Y damage increases by …" as both steps.
  - At a cast rank the damage is one roll, "{AdB[x],CdD[y]}".
  - The shape sentence without "of <material>" and the light sentence are notes.
- **Light/darkness counteract (`compile-ability.js`):** on a damaging wall, the counteract becomes the wall card's button rather than a pending route.
- **Runtime:**
  - The wall card lists its notes and the counteract button.
  - The GM hazard and turn-start damage accept a formula carrying its own types.

## Tests

1066 pass. `test/rank-3-batch-31.test.js` is new, with a negative case: a step for only one type stays blocked.

A whole-corpus compile (b399 → b400) changed only Wall of Virtue and Spike Stones.

## Evidence

[Live evidence](phase-rank-3-batch-31-live-results.json), case `rank3Batch31` (one case for rank 3 batch 31 and rank 4 batch 16), in the `pftest` world.
- At 5th the formula was {2d8[spirit],2d8[vitality]}. The crossing control dealt 21 to an undead creature and 6 to a living one (spirit only).
- The card's counteract against a DC 10, rank 1 darkness succeeded.
- **Cleanup:** fixtures removed.
