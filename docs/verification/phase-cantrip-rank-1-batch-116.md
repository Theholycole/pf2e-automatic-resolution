# Cantrip / rank 1 batch 116 — Flense

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Living Creature: the spell attack, 2d6 slashing (+2d6 a rank), double on a critical hit plus (rank)d4 persistent bleed | Flense (1) |
| Undead Creature: the same attack; a critical hit also Enfeebled 1 for 1 minute (a creature with the undead trait) | Flense |
| “A creature or corpse that lacks flesh, muscle, and internal organs is immune to this spell.”: the GM's question per target | Flense |
| Inanimate Corpse: a GM note | Flense |

**Kept strict (tests):** it isn't read with any of these changes:
- another bleed die;
- another heightening;
- added temporary Hit Points;
- another condition value.

## Coverage

**Census:** **597 enabled**, up from 596.
- The b199 corpus diff against b198 changed only Flense.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 723/723 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-116-live-results.json), case `cr1Batch116`:
- **Before the GM confirmed flesh:** finalizing was refused.
- **Living, critical hit:** 18 lost (double 9) and persistent `1d4` bleed, with no Enfeebled.
- **Undead, critical hit:** it was routed to the undead rows: 14 lost (double 7), Enfeebled 1, and no bleed.

**Regressions:** `spellAttack` passed.
