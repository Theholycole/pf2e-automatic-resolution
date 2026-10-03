# Rank 5 batch 82 — Blink Charge

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Blink Charge (5) | **The teleport:** the caster's token moves to a free space beside the target (within 60 feet, +60 per 2 ranks). **The Strike:** PF2e's Spell Effect on the chosen equipped weapon (its extra 2d8 force, +1d8 per 2 ranks, proved against the text at both ranks). PF2e's Strike and, on a hit, PF2e's damage (doubled on a critical hit). **A failure:** 1d8 force (+1d8 per 2 ranks) to the target. **A critical failure:** that force to the caster. The Effect ends after the Strike. A critical success's 5-foot teleport of the target is a GM line. |

## Rules

- **`src/compiler/blink-strike.js`:** reads every sentence and row; the catalog proves the Effect's ChoiceSet and dice formula. `blinkStrikeAt` gives the range and the rows' force.
- **Runtime:** new kind `blink-strike`.

## Interpretation

- **The weapon** is the caster's pick among its equipped weapons (the only one, if there's just one).
- **The landing space** is the first free space beside the target (or the `teleportTo` option); the GM can move it.

## Tests

`test/rank-5-batch-82.test.js` is new. It covers the data and formulas and an unrecognised clause (not read).

A whole-corpus compile (b690 → b691) changed only Blink Charge.

## Evidence

[Live evidence](phase-rank-5-batch-82-live-results.json), case `rank5Batch82`, in the `pftest` world (a character with a longsword).

| Step | Result |
| --- | --- |
| 30 feet from a foe (AC 1) | Beside it; critical hit "(2 * 1d8) slashing + (2 * 2d8) force"; the Effect gone |
| A foe out of reach of the attack | Critical failure: the caster takes 1d8 force |
| 80 feet away at 5th | Refused (60 feet) |
| At 7th | 2d8 force on the miss |

**Cleanup:** fixtures removed.
