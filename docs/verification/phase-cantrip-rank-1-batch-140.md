# Cantrip / rank 1 batch 140 — Pyroclastic Truth (user decision)

2026-09-28. The user decided to build it, with an automated Effect for the Lethologic Mark and a note on how to heal it.

| Rule | Spell |
| --- | --- |
| A basic Reflex save for 2d12 fire (+2d12 a rank). Creatures that lose Hit Points are marked by fire for 1 minute. Fuel (an Ongoing control) deals (rank)d12 persistent fire to each marked creature. The caster's Lethologic Mark Effect: fire damage → Frightened 1; fire damage to 0 HP → dead; healing it (an atone ritual) is in its description | Pyroclastic Truth (1) |

**Kept strict (tests):** it isn't read with any of these changes:
- an added condition on the mark;
- a d8 Fuel die;
- 2d10 instead of 2d12.

**Found by the pipeline:** the damage-derived and self-help checks rename a copy of each spell. The first version required the Fuel sentence to name the item, so the renamed copy changed route and both checks failed without printing a result. The name check was dropped, and the pipeline now prints FAILED for any check with no result.

## Coverage

**Census:** **645 enabled**, up from 644.
- The b223 diff changed only Pyroclastic Truth.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions, after the fix.

## Evidence

**Automated:** 751/751 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-140-live-results.json), case `cr1Batch140`, in the `pftest` world.
- **The burst:** the creature set to failure was marked by fire; the one set to critical success wasn't.
- **The caster:** got “Lethologic Mark (Pyroclastic Truth)”, whose description has the atone-ritual note.
- **Fuel:** only the marked creature took `1d12 fire` persistent damage.
- **The mark's rules:**
  - 3 fire damage made the caster Frightened 1.
  - After Frightened was cleared, 3 cold damage didn't frighten.
  - 100 fire damage left 0 HP and Dying 4, its maximum.
- **Cleanup:** fixtures removed.
