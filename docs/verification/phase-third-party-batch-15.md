# Third-party batch 15: Freezing Cold, Blood Surge

2026-10-06. The fifteenth batch of the third-party modules' spells.

## What changed

- **Freezing Cold (Oracles+)** (`glyph-versions.js` `fitActionAreas`):
  - The item is cast with 1 to 3 actions but has no PF2e versions. Its action paragraphs change only the area (2, 4 or 6 contiguous squares) and the difficult terrain's rounds (1, 2 or 3).
  - It compiles as one basic Reflex save for 1d6 cold, from the item's entry and its heightening.
  - The area by actions (the caster places it; the GM targets the creatures in it) and the terrain by actions are the card's reminders.
  - "Duration varies" is the terrain's time, so the cast is instantaneous.
- **Blood Surge (Barbarians+)** (`fitSelfInArea`, `basic-save-core.js` `isCasterShare`):
  - "You must include yourself in the area, but you treat your degree of success on your save as one step better" is the caster-share rule (Debilitating Dichotomy's): the card adds the caster, whose result is one degree better.
  - The rule now also accepts an area spell when the caster must be in it (`casterShareArea`).
  - The blood rage's additional damage, and its optional damage type, are the class's, so they're reminders.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 14 | Batch 15 |
| --- | --- | --- |
| Save | 51 | 53 |
| Not enabled | 67 | 65 |

## Tests

`test/third-party-batch-15.test.js` (2). All 1,724 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-15-live-results.json), case `thirdPartyBatch15`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Freezing Cold, two failures | Each took the 4 cold rolled; the card shows the areas by actions |
| Blood Surge, a foe fails | The card added the caster. Its Reflex at −10 rolled a critical failure, which the card made a failure: both took the full 2 |
