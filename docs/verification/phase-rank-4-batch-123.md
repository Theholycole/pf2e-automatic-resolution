# Rank 4 batch 123 — Murderous Vine

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Murderous Vine (4) | **The attack:** the card is PF2e's spell attack against the target's Fortitude DC (the item's passive defense, which PF2e's `rollAttack` uses). A hit or critical hit deals the item's 3d6 bludgeoning and 2d8 piercing (+1d8 each per 2 ranks, doubled on a critical hit). It also leaves the target Grabbed until it Escapes at the spell DC. **The crush:** an Ongoing record deals (⌊rank/2⌋)d6 bludgeoning at the end of each of the target's turns while it still holds that cast's Grabbed. **The vine:** its AC (the spell DC) and the 20 damage that destroys it are a GM note. The card's *The vine is destroyed* control removes the Grabbed and ends the record. |

## Rules

- **`src/compiler/grab-attack.js`:**
  - Reads the attack (its defense matching the item's passive one), the hit, the crush, the Escape DC and the notes.
  - Reads the Heightened entry: the item's 1d8 steps, and the crush's 1d6 per 2 ranks that the `floor(@item.level/2)` formula gives.
- **`compileSpell`:** the attack's written rows, with Grabbed until it Escapes.
- **`ongoing-families`:** `startTurnHazard` takes `whileHeld`; `applyHazardDamage` skips a creature without that cast's condition Effect.
- **Runtime:**
  - **New kind `grab-attack`:** the attack card, then the gated turn hazard.
  - **`cardAction("grab-destroyed")`:** a generic GM card control, bound in `main.js`.

## Interpretation

- **"Destroying or escaping from the vines ends the spell."** Escaping removes the Grabbed, so the crush stops; destroying is the card's control.
- **The critical hit doubles the initial damage** (the spell-attack convention), not the crush.

## Tests

`test/rank-4-batch-123.test.js` is new. It covers the data, the attack plan's support and statistic, Grabbed with its Escape, and a changed crush sentence (not read).

A whole-corpus compile (b662 → b663) changed only Murderous Vine.

## Evidence

[Live evidence](phase-rank-4-batch-123-live-results.json), case `rank4Batch123`, in the `pftest` world, cast at 6th rank, in combat.

| Step | Result |
| --- | --- |
| The attack hits | (1d8 + 3d6) bludgeoning + 3d8 piercing; Grabbed |
| The foe's turn ends | 15 bludgeoning from the 3d6 crush |
| The vine destroyed | No longer Grabbed; no damage at its next turn's end |

**Cleanup:** fixtures and combat removed.
