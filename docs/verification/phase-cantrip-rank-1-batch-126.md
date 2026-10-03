# Cantrip / rank 1 batch 126 — Stick On

2026-09-28. The user took the recommendations: option (A).

| Rule | Spell |
| --- | --- |
| A new `size-bond` route. The caster and the target are stuck together until the target Escapes (spell DC), the minute ends, or the caster Dismisses. Casting compares PF2e's sizes: a smaller target is Immobilized; the same size gives both a difficult-terrain note; a larger target leaves the caster Immobilized. Being pulled along and object targets are the GM's | Stick On (1) |

**Kept strict (tests):** it isn't read with any of these changes:
- Grabbed instead of Immobilized;
- damage in the narration;
- an added bonus;
- a Speed penalty instead of difficult terrain;
- an added Heightened entry.

## Coverage

**Census:** **607 enabled**, up from 606.
- The b209 corpus diff against b208 changed only Stick On.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 736/736 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-126-live-results.json), case `cr1Batch126`, in the `pftest` world. The caster is Medium, with DC 24.
- **No target:** refused (“target the one creature you touch …”).
- **Small target:**
  - The target was Immobilized (its bond Effect); the caster had nothing.
  - A scripted Escape at 24 matched the bond, and ending it on the Escape card removed the bond and Immobilized. The record ended.
- **Medium target:**
  - Both had a bond Effect, and neither was Immobilized.
  - Ending the record (Dismiss) removed both.
- **Large target:**
  - The caster was Immobilized; the target wasn't.
  - The target's scripted Escape removed its bond and the caster's Effect and Immobilized, and the record ended.
- **Cleanup:** fixtures removed.

**Correction (2026-09-28, batch 127):** the speed check did not pass for this batch; the Coverage line above is wrong about it. The check failed on “Manifest Will: full-family route expectation”: batch 120 recorded Manifest Will, whose route is the Effect + note, and the test expected every audited batch spell to gain a save route. The pipeline only searched the output for a passing line, so the failure printed nothing. The escape and rule-family checks were unaffected. Batch 127 fixed the test (see its [verification](phase-cantrip-rank-1-batch-127.md)), and it now passes. This batch's `.sha256` manifest predates this note.
