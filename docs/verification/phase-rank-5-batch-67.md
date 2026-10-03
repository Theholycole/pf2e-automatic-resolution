# Rank 5 batch 67 — Chromatic Wall

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Chromatic Wall (5) | **The color** is rolled at the cast rank (1d4; 1d8 at 7th or higher, when it lasts 1 hour). A Reroll result is rerolled and keeps its −2 circumstance penalty to the crossing creatures' saves. **The card** names the color, its crossing effect and the GM's notes: draw the wall (60 by 30 feet, its light), what the color stops, and the spell that counteracts it. **The card's control** "Creatures passed through the wall (target them)": red, orange and yellow are a basic Reflex save against the color's damage (+10 at 7th); green is a basic Fortitude save against 10 poison damage, with Enfeebled 1 for 1 minute on a failure; violet is a Will save or Slowed 1 for 1 minute (a critical failure is a GM line for Interplanar Teleport); blue and indigo use the borrowed spell's own resolution (Petrify, Warp Mind), or a GM line when the module doesn't resolve it. |

## Rules

- **`src/compiler/color-wall.js`:** reads every lead sentence, each color and the Heightened entry (the named colors' raised damage checked against their own plus the extra).
- **`compile-ability`:** each color's save is a compiled plan built from the text (the item has no damage: a `formula` shared damage with the `phaseFormula` evidence); damaging colors have a base plan and a heightened one.
- **Runtime:** new kind `color-wall`; `cardAction("color-wall")`.

## Interpretation

- **QUESTION: the Reroll's "−2 circumstance penalty to their saves".** Applied as an Effect on each crossing creature until the end of its turn, covering the wall's own save.
- **Violet's critical failure** isn't Slowed (the text says "instead"); the save card leaves it unaffected, and a GM line names Interplanar Teleport.
- **Crossing is the GM's call** (the module can't detect a creature passing through a drawn wall).

## Tests

`test/rank-5-batch-67.test.js` is new. It covers the colors, the sub-plans' formulas and an unrecognised clause (not read).

A whole-corpus compile (b675 → b676) changed only Chromatic Wall.

## Evidence

[Live evidence](phase-rank-5-batch-67-live-results.json), case `rank5Batch67`, in the `pftest` world.

| Step | Result |
| --- | --- |
| 5th, green; a crossing creature fails its Fortitude save | 10 poison damage, Enfeebled 1; the wall lasts 10 minutes |
| 7th, Reroll then red; it fails its Reflex save | The −2 circumstance to saves Effect; 30 fire damage; 1 hour |
| 7th, violet; it fails its Will save | Slowed 1 |
| 7th, blue | Petrify's own resolution |

**Cleanup:** fixtures removed.
