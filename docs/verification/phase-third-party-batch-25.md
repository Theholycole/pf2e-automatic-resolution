# Third-party batch 25: Cosmic Glow

2026-10-06. The twenty-fifth batch of the third-party modules' spells: a glowing square that moves on each Sustain.

## What changed

- **Cosmic Glow (Wizards+)** (new `cosmic-glow.js`):
  - A placed 5-foot square. Each creature in it attempts a basic Reflex save against the item's 2d4 fire (+1d4 per rank), when cast and after each Sustain. A critical failure is also Fascinated.
  - The GM blinks the square (up to 15 feet, in range) by moving the region before the Sustain (`moveOnSustain`, as Earth's Bile).
  - The caster and its allies standing in the square hold an Effect with a +2 status bonus to Recall Knowledge checks (`skill-check`, `action:recall-knowledge`) while there.
    - This uses the area's member rules (`memberRules`, `memberAllies`), now also for a placed area, with `memberCaster` including the caster.
    - The check accepts this only with the sentences the compiler read (`basic-save-core.js`, `ongoing-families.js`).
  - To give the bonus instead of damage, the caster leaves that creature out when reviewing the targets.
  - The light is a note.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 24 | Batch 25 |
| --- | --- | --- |
| Ongoing | 5 | 6 |
| Not enabled | 46 | 45 |

Resolved: 180 of 227.

## Tests

`test/third-party-batch-25.test.js` (1). All 1,743 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-25-live-results.json), case `thirdPartyBatch25`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast on a foe's square, critical failure | 2d4 fire, 5 doubled to 10; Fascinated; only the foe asked |
| Square blinked onto an ally, Sustain | Only the ally asked; left out, no damage |
| The ally in the square | +2 status Recall Knowledge Effect; the foe outside has none |
| Spell ended | The Effect removed |
