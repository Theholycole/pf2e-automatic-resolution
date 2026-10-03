# Cantrip / rank 1 batch 108 — Thrall Charge

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “You command the target thrall to Stride and then make a Strike that deals an additional 1d6 damage.”: a PF2e Effect on the targeted thrall adding the dice to its next Strike damage roll (2d6 from 2nd, 3d6 from 6th, 4d6 at 10th), removed after that roll | Thrall Charge (cantrip) |
| “You can destroy the thrall as part of this Strike to add a status bonus to the Strike's damage equal to this spell's rank.”: the caster's choice when casting; a status bonus equal to the rank, and the GM removes the thrall | Thrall Charge |

**Kept strict (tests):** it isn't read with any of these changes:
- typed extra damage;
- a doubled bonus;
- another die;
- an added condition.

## Coverage

**Census:** **589 enabled**, up from 588.
- The b191 corpus diff against b190 changed only Thrall Charge.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 707/707 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-108-live-results.json), case `cr1Batch108`, with a level 3 caster:
- **Rank 1:** the Effect held `DamageDice 1`. The thrall's Strike rolled `1d6 + 1d4 slashing`, and the Effect was then gone.
- **Rank 2, thrall destroyed:** `DamageDice 2` and `FlatModifier 2`. The Strike rolled `2d6 + 1d4 + 2 slashing`, then the Effect was gone.
- **No target:** refused.
