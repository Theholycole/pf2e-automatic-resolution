# Cantrip / rank 1 batch 104 — Turbulent Tide

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Make a melee Strike with your improvised weapon.”: the card's Strike reminder (the caster's PF2e Strike) | Turbulent Tide (1) |
| “… each creature adjacent to you must succeed at a Fortitude saving throw against your spell DC or be pushed 5 feet away from you (10 feet on a critical failure).”: creatures in a 5-foot emanation; push table (5 / 10 feet, as the card's GM notes) | Turbulent Tide |
| “If the item has a Hardness greater than your level, or if it's an artifact, …, it doesn't break and adjacent creatures don't need to attempt Fortitude saves.”: the GM's “did the weapon break?”; “no” leaves everyone unaffected | Turbulent Tide |
| The break and “You can Stride after the target of your Strike …”: reminders | Turbulent Tide |

**Kept strict (tests):** it isn't read with any of these changes:
- an added condition on the push;
- another Hardness test;
- a different follow-up;
- an added bonus.

## Coverage

**Census:** **585 enabled**, up from 584.
- The b187 corpus diff against b186 changed only Turbulent Tide.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 700/700 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-104-live-results.json), case `cr1Batch104`:
- **Before the GM answered:** finalizing was refused.
- **“Yes”:** the card's notes pushed the failure 5 feet and the critical failure 10. The success had no note. The Strike, break and Stride reminders were shown.
- **“No”:** no push.

**Regressions:** `strikePrelude` (Booming Blast, Thunderous Strike, Pulverizing Wake) passed. No combats or `PFTEST` regions were left.
