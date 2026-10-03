# Rank 5 batch 86 — Tree of Life and Death

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Tree of Life and Death (5) | **The trees** are tokens in two free squares at least 20 feet apart within range (or the `positions` option). Each has AC 10, 50 HP (+10 per rank), immunity to critical hits and precision, and resistance 10 to all damage for its Hardness. **Each canopy** (10-foot emanation) is a region following its tree, run as an Ongoing area. A living creature entering or starting its turn under the Tree of Death takes (rank)d4 void with a basic Fortitude save; under the Tree of Life it regains (rank)d4 HP. Once per round each. **Either tree at 0 HP, or the end of the caster's Effect**, removes both trees, their regions and the areas. |

## Rules

- **`src/compiler/tree-pair.js`:** reads every sentence, the two trees and the Heightened entry.
- **`applyHazardDamage`:** `living` (skips a creature that isn't living) and `basic` (the creature's save first; PF2e's `multiplier` for its result).
- **Summons:**
  - `summonOnEnd` removes the `extra` summons too.
  - `main.js` ends the summon's `ongoingCastIds`.
  - The trees' `endsAtZero` ends the spell.
- **Runtime:** new kind `tree-pair`.

## Interpretation

- **Hardness as resistance to all damage:** the same reduction per hit.
- **Creatures already under a canopy when it's cast** haven't entered it; they're affected as their turns start.

## Tests

`test/rank-5-batch-86.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b694 → b695) changed only Tree of Life and Death.

## Evidence

[Live evidence](phase-rank-5-batch-86-live-results.json), case `rank5Batch86`, in the `pftest` world, in combat.

| Step | Result |
| --- | --- |
| Cast at 5th | Trees: 50 HP, AC 10, resistance 10; nothing at the cast |
| A creature (Fortitude −40) starts its turn under the Tree of Death | 14 void. **Corrected in [rank 3 batch 120](phase-rank-3-batch-120.md):** the critical failure's double damage was not applied. On the rerun it took 20 (doubled). |
| An ally starts its turn under the Tree of Life | +11 HP |
| An undead creature under the Tree of Life | Nothing |
| The Tree of Death at 0 HP | Both trees, both regions and both records gone |

**Cleanup:** fixtures and combat removed.
