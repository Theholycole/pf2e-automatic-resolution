# Rank 4 batch 132 — Chromatic Ray

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Chromatic Ray (4) | The caster's spell attack against the target's AC. On a hit the color is rolled: 1d4, or 1d8 from 6th rank. **Red / Orange / Yellow / Green:** 30 fire / 40 acid / 50 electricity / 25 poison, +10 from 6th, doubled on a critical hit. Green also posts its Fortitude save (Enfeebled 1 for 1 minute, Enfeebled 2 on a critical failure). **Blue / Indigo:** the borrowed spell's own resolution at the cast rank and the caster's DC: Petrify; Confusion, or Warp Mind on a critical hit. When the module doesn't resolve that spell yet, the card names it for the GM. A critical blue adds a Clumsy 1 Effect the GM removes with the petrification. **Violet:** Slowed 1 for 1 minute, and a Will save whose failure pushes it 120 feet away (the teleport, the GM places it). **Intense Color:** Dazzled until the end of the caster's next turn (Blinded on a critical hit), then another color (8s rerolled). |

## Rules

- **`src/compiler/color-ray.js`:** reads the four lead sentences, the four low colors and the Heightened entry. The raised damage must be each color's own +10. It then reads the four high colors.
- **`compileSpell`:** the green's and violet's saves as plans of their own.
- **Runtime:**
  - **New kind `color-ray`:** the attack, the color rolls (the `colors` option presets them), and each color's effects.
  - **`#ruleEffect`:** takes an `expiry`, and a 0-second Effect is unlimited.

## Interpretation

- **"Teleported 120 feet directly away"** is a 120-foot push away from the caster that the GM carries out (nearest open space).
- **Petrify and Warp Mind are rank 6 and 7 spells the module doesn't resolve yet.** At 6th rank and above, those colors are the GM's until it does.
- **"Clumsy 1 as long as it's Slowed by the flesh to stone effect"** is an Effect the GM removes with the petrification.

## Tests

`test/rank-4-batch-132.test.js` is new. It covers the dice, the colors, the damage, the save plans' support, the violet push, the borrowed spells, and a different raise (not read).

A whole-corpus compile (b671 → b672) changed only Chromatic Ray.

## Evidence

[Live evidence](phase-rank-4-batch-132-live-results.json), case `rank4Batch132`, in the `pftest` world (every attack a critical hit against AC 5).

| Cast | Result |
| --- | --- |
| 4th, green | 50 poison (25 doubled) and its Fortitude card |
| 6th, intense then red (an 8 rerolled) | Blinded, then 80 fire (40 doubled) |
| 6th, indigo | The borrowed spell is Warp Mind (critical hit) |

**Cleanup:** fixtures removed.
