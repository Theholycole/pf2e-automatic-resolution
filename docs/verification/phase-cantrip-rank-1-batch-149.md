# Cantrip / rank 1 batch 149 — Contagious Idea (and per-row save immunity)

2026-09-28. This replaces the Effect + note route.

| Rule | Spell |
| --- | --- |
| One or two creatures, not the caster, the second within 30 feet of the first. **Pleasant:** PF2e's Effect on each target (temporary HP equal to the rank; data note: the text gives 5, +1 per rank). **Terrifying:** the module's Will save card with the degree table (Frightened 1/2/3). Critical success and success make the target temporarily immune for 1 minute | Contagious Idea (cantrip) |

**General change:** a non-basic save's rows may each carry their own immunity, including "is [condition] and is then temporarily immune for N". It was previously only the critical-success "unaffected" form.
- Five pending spells (Feast of Ashes, Shadow Zombie, Cup of Dust, Subjugate Undead, Burning Blossoms) lost their `manual:temporary-immunity` item.
- Their routes are unchanged.

**Kept strict (tests):** it isn't read with any of these changes:
- a different second-target rule;
- mismatched row immunity durations (1 hour vs 1 minute);
- an added AC bonus;
- an added DC step.

## Coverage

**Census:** **654 enabled**, up from 653.
- The b232 diff changed Contagious Idea, plus the five pending-only changes above.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 760/760 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-149-live-results.json), case `cr1Batch149`, in the `pftest` world. The fixture's cantrip rank was 5.
- **Refused:** the caster as a target, and a second target 70+ feet from the first.
- **Pleasant:** both targets got PF2e's Effect and 5 temporary HP (the rank; the text would give 9).
- **Terrifying:**
  - The save card started for both targets.
  - Success gave Frightened 1 and immunity; failure gave Frightened 2 and no immunity.
  - Recasting at the immune target showed it ineligible ("temporarily immune to this spell").
- **Cleanup:** fixtures removed, and no combats left.
