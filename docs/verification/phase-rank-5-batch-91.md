# Rank 5 batch 91 — Blossoming Gore

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Blossoming Gore (5) | **The targeted thrall** is destroyed (0 HP). **The field** is a 20-foot burst region at a corner of its space (the top-left; the GM can move it), run as two Ongoing areas. A creature entering or starting its turn inside takes 10 persistent bleed (+2 per rank). A bleeding creature ending its turn inside attempts a Fortitude save: Drained 1 on a success or a failure, Drained 2 on a critical failure. **The thralls** the failures create (1, or 2) are a GM line on the card. Dismiss is ending the areas in Ongoing spells. |

## Rules

- **`src/compiler/gore-field.js`:** reads every sentence, the rows and the Heightened entry.
- **`applyHazardDamage`:** a `goreSave` branch (a bleeding creature only).
- **Runtime:** new kind `gore-field`.

## Interpretation

- **QUESTION: the thralls created.** As with Create Thrall (a note) and Conglomerate of Limbs, a thrall's statistics come from the necromancer's rules, so the GM places them.
- **The field's corner** is the thrall token's top-left corner by default.

## Tests

`test/rank-5-batch-91.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b699 → b700) changed only Blossoming Gore.

## Evidence

[Live evidence](phase-rank-5-batch-91-live-results.json), case `rank5Batch91`, in the `pftest` world, in combat.

| Step | Result |
| --- | --- |
| Cast on a thrall | The thrall at 0 HP; the field centred on its corner (20, 8) |
| A foe (Fortitude −40) inside starts its turn | Persistent bleed 10; the foe outside untouched |
| It ends its turn bleeding | Drained 2; the GM's line for 2 thralls |
| At 6th | Bleed 12 |

**Cleanup:** fixtures, combat and the areas removed.
