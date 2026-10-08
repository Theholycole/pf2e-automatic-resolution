# Third-party batch 17: Tidal Grasp

2026-10-06. The seventeenth batch of the third-party modules' spells.

## What changed

- **Tidal Grasp (Witches+)** (`glyph-versions.js` `fitSaveDCAttack`, `basic-save-runtime.js`, `basic-save-core.js`):
  - "you make a spell attack roll against the target's Fortitude DC": PF2e rolls the attack against AC, and the card adds the difference to the Fortitude DC (`resolution.attackDefense`, as Shadow Signet's spellshape does).
  - Success: Grabbed until the end of the caster's next turn, or until it Escapes against the spell DC.
  - Critical success: the same, plus the text's "2 × rank" bludgeoning damage (the item has none, so the text's formula is rolled at the cast rank).
  - "When you Sustain the spell, you make another spell attack roll." offers the card again on each Sustain, up to the minute (`repeatable`, now allowed for a spell attack: `sustainAttackAgain`).
  - The attack's critical failure leaves the target immune for 1 minute. An Escape's critical success doing the same is a GM reminder.
  - The target's size is the GM's question on the card (Large or smaller, Huge from 3rd rank, Gargantuan from 7th), so the heightened sizes are covered.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 16 | Batch 17 |
| --- | --- | --- |
| Save | 53 | 54 |
| Not enabled | 58 | 57 |

Resolved: 166 of 227.

## Tests

`test/third-party-batch-17.test.js` (1). All 1,727 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-17-live-results.json), case `thirdPartyBatch17`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Tidal Grasp, rank 3, a foe of AC 25 and Fortitude DC 12 | The GM's size question; the attack at +27 (the caster's +14 and +13); critical success: Grabbed and 6 bludgeoning |
| Tidal Grasp, another foe, critical failure | Temporary immunity, not Grabbed |
