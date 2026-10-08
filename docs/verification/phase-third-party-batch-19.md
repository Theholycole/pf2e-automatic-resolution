# Third-party batch 19: Dynamic Caustic Blast, Dynamic Telekinetic Projectile

2026-10-06. The nineteenth batch of the third-party modules' spells: two "Dynamic" spells whose versions each need their own route. Each PF2e variant (overlay) now compiles.

## What changed

- **Dynamic Caustic Blast (Magic+)** (`glyph-versions.js` `fitCausticVersion`, `third-party-rows.js` `hardnessRows`, `direct-damage.js`, `effect-runtime.js`):
  - **One action:** a Fortitude degree table. The variant's data marks it basic, but the text has no damage.
    - Each failing row's Hardness reduction (1, 3 or 6) is a GM-played note for the next time the Hardness applies before the end of the caster's next turn. The amount is the cast rank's (+1, +3, +6 every 2 ranks).
    - "A creature with Hardness" is the GM's question.
  - **Two actions:** the table of half, full and double acid. The critical failure adds the persistent acid from the text's inline formula, rising 1 every 2 ranks as stated. The variant's data marks it not basic; the text's basic save is used.
  - **Three actions:**
    - The "Blast" variant is the two-action table at 60 feet, with the splash ring as a reminder.
    - The "Splash" variant is the ring's 2 acid splash damage (+2 every 2 ranks), with no save, on each creature the caster targets (a direct-damage card for any number of targets).
- **Dynamic Telekinetic Projectile (Magic+)** (`fitProjectileVersion`):
  - **One action:** the caster's held ranged weapon (picked) gets +10 feet of range increment until the end of the turn. This is PF2e's `AdjustStrike` on an Effect lasting 0 rounds to the turn's end (`stated-effect`, `untilTurnEnd`).
  - **Two actions:** each damage-type variant (piercing, slashing, bludgeoning) is the spell attack, with double damage on a critical hit and the text's +1d6 a rank. The object's limits are reminders.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 18 | Batch 19 |
| --- | --- | --- |
| Save | 54 | 56 |
| Not enabled | 57 | 55 |

Resolved: 170 of 227.

## Tests

`test/third-party-batch-19.test.js` (2). All 1,731 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-19-live-results.json), case `thirdPartyBatch19`, in the `pftest` world. Each variant was loaded with PF2e's `loadVariant`.

| Spell | Result |
| --- | --- |
| Caustic Blast, one action, failure | The Hardness note (reduced by 3) |
| Caustic Blast, two actions | Failure: 7 acid. Critical failure: 14 and persistent acid |
| Caustic Blast, Splash | 2 splash to each of two targeted creatures |
| Telekinetic Projectile, one action | The shortbow's range increment +10; the Effect ends at the turn's end (0 rounds) |
| Telekinetic Projectile, Piercing, hit | 2d6 piercing, all taken |
