# Rank 4 batch 120 — Necrotic Radiation

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Necrotic Radiation (4) | The GM picks what was touched. The damage is 2d6 void at 4th, +1d6 per 2 ranks. **A 10-foot square:** the selected region, where each creature ending its turn inside takes the damage for 24 hours (an Ongoing region area). **An unattended object:** the card's control starts the damage on whoever now holds it. **An attended object:** the holder first rolls a Reflex save against the spell DC. Critical success: unaffected. Success: 1 minute. Failure: 10 minutes. Critical failure: 24 hours. The holder then takes the damage at the end of each of its turns. **Changing hands:** the card's control ends the old holder's damage and starts it on the targeted new holder for the time left. |

## Rules

- **`src/compiler/imbued-hazard.js`:** reads the five sentences, the four rows (the spell's time by result, the critical failure the full duration) and the Heightened entry (the item's own). `imbuedHazardFormula` gives the dice at a rank.
- **Runtime:**
  - **New kind `imbued-hazard`:** `startRegionArea` with a turn-end hazard for the square; `startTurnHazard` on the holder for an object.
  - **`imbuedHazardHolder`:** the card's control (GM-only), bound in `main.js`.
  - **Prompts:** the `mode`, `region` and `skipDialog` options skip them.

## Interpretation

- **The attended object's save is PF2e's own roll.** It is rolled with the spell's DC; it isn't a save card, since its result is only the spell's time.
- **Who holds or carries the object is the GM's.** The GM moves it from the card.
- **A Heightened sentence without its final period** is still read.

## Tests

`test/rank-4-batch-120.test.js` is new. It covers the rows' times, the type, save and duration, the dice by rank, and a changed row (not read).

A whole-corpus compile (b659 → b660) changed only Necrotic Radiation.

## Evidence

[Live evidence](phase-rank-4-batch-120-live-results.json), case `rank4Batch120`, in the `pftest` world, cast at 6th rank, in combat.

| Step | Result |
| --- | --- |
| The holder (Reflex −20) | Critical failure, 24 hours, 3d6 |
| The holder's turn ends | 14 void damage |
| Handed on: the new holder's turn ends | 15 damage |
| The square: the walker's turn ends inside | 15 damage |
| The first holder's next turn | No damage |

**Cleanup:** fixtures, combat and the region removed.
