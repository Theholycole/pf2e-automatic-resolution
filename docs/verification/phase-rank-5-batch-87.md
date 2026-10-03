# Rank 5 batch 87 — Diadem of Divine Radiance

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Diadem of Divine Radiance (5) | **PF2e's Spell Effect** on the caster for 1 minute (its light, bright 60 and dim 120 feet, proved against the text). **The disc** is the card's throw (with the cast if a target is given, and on each Sustain): the caster's ranged spell attack, with its proficiency raised to mythic (level + 10), against the target's AC within 120 feet. A hit deals 4d8 spirit (+2d8 per 2 ranks), doubled on a critical hit, and 1d4 persistent spirit (+1d4 per 2 ranks), not doubled. The target is Dazzled for 1 round (3 on a critical hit). The darkness counteract is a GM line. |

## Rules

- **`src/compiler/disc-throw.js`:** reads every sentence and the Heightened entry; the catalog proves the Effect's light. `discThrowAt` gives the formulas.
- **Runtime:** new kind `disc-throw`; `discThrow` (API and card button).

## Interpretation

- **Mythic proficiency** replaces the caster's proficiency modifier with level + 10, as for Banishing Touch. An NPC's spell attack has no proficiency modifier to raise.

## Tests

`test/rank-5-batch-87.test.js` is new. It covers the data, the formulas by rank and an unrecognised clause (not read).

A whole-corpus compile (b695 → b696) changed only Diadem of Divine Radiance.

## Evidence

[Live evidence](phase-rank-5-batch-87-live-results.json), case `rank5Batch87`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 5th with a foe (AC 5) targeted | The Effect: bright 60, dim 120; critical hit "(2 * 4d8) spirit + 1d4 persistent spirit"; Dazzled 3 rounds |
| The card's throw again | Hit |
| At 7th | "(2 * 6d8) spirit + 2d4 persistent spirit" |

**Cleanup:** fixtures removed.
