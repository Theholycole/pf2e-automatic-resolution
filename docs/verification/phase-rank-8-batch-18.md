# Rank 8 batch 18: group 9, part 2

2026-10-05. Prismatic cards: random colours rolled by the module, each colour's own part, and a wall whose layers run in order.

| Spell | Now |
| --- | --- |
| Prismatic Spray | **The beams**: the module rolls 1d8 for each targeted creature and runs that beam's part on it. On an 8 it rolls twice, rerolling 8s and repeats. Red, orange and yellow are 50 fire, 60 acid and 70 electricity (Reflex). Green is 30 poison and Enfeebled 1 for 1 minute (Fortitude). Blue casts Petrify and indigo casts Warp Mind, both at 7th rank. Violet is Slowed for 1 minute (Will); its critical failure's planar trip is a GM note. "The same d20 for all its saves" is a reminder. |
| Rainbow Fumarole | **The fumarole**: the module rolls the colour and the GM places the 20-foot cylinder. It is difficult terrain for 1 minute. Each creature caught in it, moving through it or ending its turn there (once per turn) takes that colour's damage with a basic Reflex save, and on a failure the added effect: Prone, Sickened 2, Paralyzed for 1 round, Confused or Slowed 1 for 1 minute, or a 10-foot push (GM reminder). On **All**, the caster picks a colour for each creature as it is hit. |
| Prismatic Wall | **The wall's light**: Chromatic Wall-style Will save (Dazzled or Blinded), then immune for 1 hour. **Passing through**: each of the seven layers' saves on the creature in turn. Red to green are Chromatic Wall at 5th rank; blue (Petrify) and indigo (Warp Mind) are at 7th; violet is Slowed. |

New runtime:

- The **beam-roll** part (a die per creature naming hidden parts, and the roll-twice result), the **sequence** part (hidden parts in order) and the **fumarole** part.
- Area hazards with a basic save now apply a failure's added effect: conditions (for stated rounds through an Effect), or a push reminder. A per-creature colour choice is also supported.
- The runtime compiler now loads spells named by referenced spells (two levels), so Prismatic Wall gets Chromatic Wall's Petrify and Warp Mind.

## Tests

`test/rank-8-batch-18.test.js` is new. A whole-corpus compile (b793 → b794) changed only these three spells.

## Evidence

[Live evidence](phase-rank-8-batch-18-live-results.json), case `rank8Batch18`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Prismatic Spray: red beam failure; potent beam rolls 8, 8, 2, 2, 3 | 50; orange and yellow, 130 |
| Rainbow Fumarole (blue): a creature caught in it | 60 (critical failure), Paralyzed; difficult terrain |
| Rainbow Fumarole (All, orange picked) | 100, Prone |
| Prismatic Wall: the light's failure; a creature passes through (failures) | Blinded; 7 layers run, 85 damage |
