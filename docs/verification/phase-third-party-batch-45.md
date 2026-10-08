# Third-party batch 45: Hyper-Arcane Pressure Point Strike

2026-10-06. The forty-fifth batch of the third-party modules' spells: a Strike's mark that the caster later sets off.

## What changed

- **Hyper-Arcane Pressure Point Strike (Magus+)** (new `pressure-point.js`; `effect-runtime.js`; `main.js`):
  - The Strike is the caster's own. The creature it hit is marked for the minute (the stated Effect on the cast's target).
  - **The activation:** a card option the GM presses when the caster spends the action. It starts the text's Fortitude save:
    - the damage is the caster's unarmed Strike damage, read from its sheet when it casts ("roll damage for the required unarmed Strike again"): half on a success, full on a failure, double on a critical failure;
    - Enfeebled 1 for 1 round (2 on a critical failure);
    - the failing rows' flat check on manipulate actions is a GM note.
  - Activating ends the spell: the mark is removed (`endsCast`).

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 44 | Batch 45 |
| --- | --- | --- |
| Effect | 72 | 73 |
| Not enabled | 26 | 25 |

Resolved: 200 of 227.

## Tests

`test/third-party-batch-45.test.js` (1). All 1,763 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-45-live-results.json), case `thirdPartyBatch45`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at rank 2 on the struck foe | The mark; the option's damage read as `(1d6+3)[bludgeoning]` (the magus's fist) |
| Activation | The mark removed; the Fortitude save card |
| Failure | 1d6 + 3 bludgeoning, 4 taken; Enfeebled 1; the flat-check note |
