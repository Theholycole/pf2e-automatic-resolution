# Third-party batch 39: Metamorphic Armor

2026-10-06. The thirty-ninth batch of the third-party modules' spells: a switchable armor Effect.

## What changed

- **Metamorphic Armor (Magus+)** (`rule-sets.js` `metamorphic`):
  - The caster's switchable Effect for 1 minute. Each listed effect is an option, and each resistance type is its own option:
    - resistance to bludgeoning, piercing or slashing equal to half the level (at least 1);
    - resistance to acid, cold, electricity or fire equal to half the level + 2;
    - +1 circumstance to AC;
    - +1 status to Reflex saves against area spells.
  - The Effect's control switches the option when the caster Strikes an enemy (the existing rule-set switch).
  - Two parts stay with the caster or the GM: the opening melee Strike is the caster's, and "or increase one of these resistances by half your level" is a GM note on the energy options.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 38 | Batch 39 |
| --- | --- | --- |
| Effect | 68 | 69 |
| Not enabled | 32 | 31 |

Resolved: 194 of 227.

## Tests

`test/third-party-batch-39.test.js` (1). All 1,757 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-39-live-results.json), case `thirdPartyBatch39`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Level 6, fire chosen | Resistance fire 5; 1 minute |
| Switched to the AC option | Resistance gone; AC +1 |
