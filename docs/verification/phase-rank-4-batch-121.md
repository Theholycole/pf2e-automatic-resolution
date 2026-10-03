# Rank 4 batch 121 — Rusting Grasp

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Rusting Grasp (4) | The card asks what was touched. **A metal creature or hazard (targeted):** its basic Fortitude save card for 8d6 untyped damage, +2d6 per rank (the text's formula; PF2e's item has no damage). A failure or critical failure adds 2d6 persistent damage (not doubled). **A metal item** (objects rolled on the card, user decision 2026-10-01): its holder rolls PF2e's basic Reflex save against the spell DC; an unattended item is a critical failure. The card rolls 2d6, times the result's multiplier, for the GM to apply to the item, ignoring Hardness. It also states the item's maximum Bulk at the cast rank and the iron/steel item HP. On a failure, the card's *Roll the rust* repeats the 1d6 persistent for the end of the holder's (or the caster's) turns. The GM's notes about which targets qualify are on the card. |

## Rules

- **`src/compiler/rust-grasp.js`:**
  - Reads the creature and item sentences, the persistent sentence, its timing, and the Heightened entry.
  - Every other sentence must be one of the GM notes.
- **`compileSpell`:** the creature's save, in Acid Grip's wording (inline persistent damage on the failing rows), with the `phaseFormula` evidence.
- **Runtime:**
  - **New kind `rust-grasp`:** the creature card, and the item roll.
  - **A generic card roll:** `cardRoll`, a button bound in `main.js` for a roll the card states, for the GM.

## Interpretation

- **"Plus 2d6 persistent on a failed save"** applies on a failure and a critical failure, and isn't doubled.
- **The persistent damage is untyped.** The text gives no type.
- **The item's save is PF2e's roll.** It isn't a save card, because the result only scales a number the GM applies.

## Tests

`test/rank-4-batch-121.test.js` is new. It covers the creature plan's support, formula and rows, the item data, and a changed sentence (not read).

A whole-corpus compile (b660 → b661) changed only Rusting Grasp.

## Evidence

[Live evidence](phase-rank-4-batch-121-live-results.json), case `rank4Batch121`, in the `pftest` world, cast at 5th rank.

| Step | Result |
| --- | --- |
| A metal creature, failure | 10d6 (43 taken) and 2d6 persistent |
| An unattended item | Critical failure: 7 rolled, 14 to apply |
| The rust's roll | 4 |

**Cleanup:** fixtures removed.
