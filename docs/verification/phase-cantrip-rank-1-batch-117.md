# Cantrip / rank 1 batch 117 — Redistribute Potential

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Creatures in either area take 4d4 damage with a basic Fortitude save.”: one roll (+1d4 a rank) | Redistribute Potential (cantrip) |
| The cold square (stolen heat) and the fire square (concentrated heat): the GM picks each creature's square on the card; the roll is cold, swapped to fire in the fire square | Redistribute Potential |
| A failure: Clumsy 1 (cold square) or Enfeebled 1 (fire square) until the start of the caster's next turn | Redistribute Potential |
| A creature in both squares: the one square the GM picks | Redistribute Potential |

**Kept strict (tests):** it isn't read with any of these changes:
- other dice;
- another duration;
- “damage from both areas”;
- another energy.

## Coverage

**Census:** **598 enabled**, up from 597.
- The b200 corpus diff against b199 changed only Redistribute Potential.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 725/725 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-117-live-results.json), case `cr1Batch117`, with the cantrip at its heightened rank:
- **Before the squares were picked:** finalizing was refused.
- **Two failures:** each lost 14 (the one roll).
- **The fire-square creature's damage:** swapped `cold → fire`.
- **Conditions:** Clumsy 1 in the cold square, Enfeebled 1 in the fire square.

**Regressions:** `energyByCreature` (Divine Armageddon's swap) and `cr1Batch116` (Flense) passed.
