# Cantrip / rank 1 batch 146 — Protect Companion

2026-09-28. This replaces the Effect + note route.

| Rule | Spell |
| --- | --- |
| PF2e's +1 AC Effect on the caster's eidolon or minion. When the target takes damage, the caster gets a Life Block card (the numbers are read from PF2e's action: reduce by 10, lose 5 HP, +10/+5 per 2 ranks, lower tiers allowed). Using it restores the Hit Points, costs the caster's Hit Points, ends the spell, and puts a 10-minute recast lockout on the caster | Protect Companion (cantrip) |

**Kept strict (tests):**
- The spell isn't read with any of these changes: +2 AC (the Effect gives +1), a 1-hour lockout, added temporary HP, or an added save bonus.
- The action isn't read with an added 1d4.
- Tiers: 1 at rank 2, and 2 at rank 3.

## Coverage

**Census:** **651 enabled**, up from 650.
- The b229 diff changed only Protect Companion.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 757/757 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-146-live-results.json), case `cr1Batch146`, in the `pftest` world.
- **A creature that isn't a minion** was refused.
- **Cast on the minion:** AC went from 20 to 21.
- **PF2e's 15 damage:** the minion went from 30 to 15 HP, and a Life Block card with one tier (rank 1) was offered.
- **Using it:** the minion went back to 25 HP and the caster from 500 to 495. The Effect ended, and a 10-minute lockout was added.
- **Recasting was refused** under the lockout.
- **Cleanup:** fixtures removed, and no combats left.
