# Third-party batch 67: Animated Spark

2026-10-07. The sixty-seventh batch of the third-party modules' spells.

## What changed

- **Animated Spark (Wizards+)** (new `animated-spark.js`, kind `animated-spark`; `effect-runtime.js`; `main.js`):
  - **The objects:** a PF2e `familiar` actor whose master is the caster, so its statistics are a familiar's for the caster's level. Its token goes at the objects (or beside the caster).
    - It has Construct, plus the 2 familiar abilities chosen (`options.abilities`, or asked; Spellcasting excluded).
    - It has a weakness equal to the caster's level, to the type chosen (`options.weakness`, or asked).
  - **The caster's Effect** lasts the sustained 10 minutes and holds the summon. Casting the spell again ends the earlier spark.
  - **Disperse** (`sparkDisperse`, the card's control; also on the API):
    - (1+rank)d4 of bludgeoning, piercing or slashing (chosen), on the creatures within 5 feet, with a basic Reflex save against the spell DC.
    - The save card comes from a variant of the spell.
    - The spell then ends and the objects go.
    - A Tiny token's half square is measured as the square it occupies.
  - The unsustained task, the 11th-level familiar abilities, and the School of Unified Magical Theory are notes.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 66 | Batch 67 |
| --- | --- | --- |
| Effect | 97 | 98 |
| Not enabled | 3 | 2 |

Resolved: 225 of 227. The remaining two need the user's decision: Patron's Apocalypse, whose apocalypse table is missing from the module's data, and the empty Dynamic Breathe Fire duplicate.

## Tests

`test/third-party-batch-67.test.js` (1). All 1,787 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-67-live-results.json), case `thirdPartyBatch67`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 3rd: Darkvision and Fast Movement, weakness fire | A familiar mastered by the wizard: Construct, Darkvision, Fast Movement (Land); weakness fire 5; 25 HP |
| Cast again | The first spark's token and Effect gone; the second there |
| It disperses, bludgeoning | `4d4` save card on the foe beside it; the spell ends, the objects gone |
