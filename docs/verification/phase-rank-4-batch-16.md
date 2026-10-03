# Rank 4 batch 16 — Spike Stones

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Spike Stones (4) | The GM places the burst, which is difficult terrain for 1 hour (hazardous terrain too, as a note). The GM's per-square control deals 3 piercing damage (+1 a rank) for each of the area's squares a creature moving on the ground moves into. |

## Rules

- **Hazard area (`hazard-area.js`):**
  - "A creature that moves on the ground through the area takes N T damage for every square of that area it moves into." is a flat per-square control for any creature.
  - The amount must be the item's entry, stepped by "Increase the damage by N" (the item's own heightening).
  - "The area becomes difficult terrain and hazardous terrain." is read.
  - Durations in hours are read.
- **Runtime:** the control's label and question say "a creature … on the ground" for this kind.

## Tests

1066 pass. `test/rank-4-batch-16.test.js` is new, with a negative case: an amount other than the item's stays blocked.

## Evidence

[Live evidence](phase-rank-4-batch-16-live-results.json), case `rank3Batch31` (one case for rank 3 batch 31 and rank 4 batch 16), in the `pftest` world.
- At 6th the formula was 5[piercing]; a creature moving into 2 squares lost 10.
- The region carries difficult terrain.
- **Cleanup:** fixtures removed.
