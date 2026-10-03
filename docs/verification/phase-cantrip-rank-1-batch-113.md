# Cantrip / rank 1 batch 113 — Forge

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| 3d6 fire by the Fortitude save (unaffected / half / full / double), +2d6 a rank | Forge (1) |
| Critical failure: “if it's a metal creature, it gains weakness 2 to physical damage until the end of your next turn”: PF2e's Effect (proved: `2*level` physical weakness, +2 a rank, 1 round), only on a creature with the metal trait | Forge |
| “If the target is a metal object, reduce its Hardness by an amount equal to the damage dealt until the end of your next turn.”: a GM reminder | Forge |
| Target “1 creature or unattended metal object”: any creature (objects are the GM's) | Forge |

**Kept strict (tests):** it isn't read with any of these changes:
- another weakness;
- another heightening;
- another material;
- an added condition.

The last case exposed an unlinked-condition gap in the preamble check, now closed. No other spell changed.

## Coverage

**Census:** **594 enabled**, up from 593.
- The b196 corpus diff against b195 changed only Forge (newly executable).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 717/717 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-113-live-results.json), case `cr1Batch113`:
- **Two critical failures:** each lost 24 (double 12).
- **The metal creature:** got PF2e's weakness Effect (1 round, ending at turn end).
- **The other creature:** didn't get it.
- **Card:** it carried the Hardness reminder.
