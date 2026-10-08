# Rank 6 batch 25: group 14, things picked up

2026-10-05. Spells that make things creatures pick up and use, each as a card.

| Spell | Now |
| --- | --- |
| Fire Seeds | The caster gets the four acorns as an item, which can be handed to others. **Throw an acorn** (four times) uses one up. The GM places the 5-foot burst and the module starts the save card (4d6 fire, basic Reflex, the caster's DC; 5d6 at 8th, 6d6 at 9th) for the creatures in it. The burst becomes burning ground: 2d6 fire (3d6 from 8th) to a creature entering it or ending its turn there. Every acorn's flames are one area, so the damage comes once per round. The flames burn a minute from the latest throw. The acorns rot when the spell ends. |
| Tree of Seasons | **The spring, summer, autumn and winter pods**, each usable once while the spell lasts. The GM places the 5-foot burst and the module starts the save card: 6d6 (+1d6 per rank) electricity, fire, poison or cold, basic Reflex. The tree's place is a GM note. |
| Bounty of the Sky | **A gift is consumed**, as often as wanted for the minute, by the caster or an ally within 30 feet; an enemy's turns to ash. The benefit is picked: 4d6 Hit Points (+2d6 per 2 ranks); one poison or disease's stage down by 1 (not below 1; the afflictions the module tracks); or Clumsy, Drained, Enfeebled or Stupefied down by 2, or two of them down by 1. |

New runtime:

- Card parts: **seed**, **pod** and **gift** (`scripts/pickup-runtime.js`).
- A card's things as an item on the caster, removed with the spell.
- One shared burning area across throws.
- Lowering an affliction's stage.
- Fixed Heightened entries as one formula (the highest rank checked first).

## Tests

`test/rank-6-batch-25.test.js` is new. A whole-corpus compile (b797 → b798) changed only these three spells.

## Evidence

[Live evidence](phase-rank-6-batch-25-live-results.json), case `rank6Batch25`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Fire Seeds: two throws (failures), a creature walking into the flames, then into the second burst's flames the same round | 4 acorns → 2; 15 each; one area of 2 shapes, no flame damage to those in the bursts; 7, then 0 more |
| Tree of Seasons: the summer pod (failure); the summer pod again | 28 fire; refused (already used) |
| Bounty of the Sky: Hit Points; Clumsy 2 alone; Enfeebled 1 and Stupefied 1 together; a poison at stage 3; an enemy | +16; Clumsy 0; both 0; stage 2; ash |
