# Cantrip / rank 1 batch 134 — Sure Strike, Unimpeded Stride, Scholarly Recollection

2026-09-28. This continues the push to 100%. These three were on the Effect + note route.

| Rule | Spell |
| --- | --- |
| PF2e's RollTwice on the caster's attack rolls, with circumstance penalties suppressed. The flat check against Concealed or Hidden is a GM note, and a data note says to remove the Effect after the attack. Immune for 10 minutes | Sure Strike (1) |
| PF2e's Effect: difficult terrain ignored and Speed penalties suppressed. Escaping magical Immobilized or Grabbed, and the Stride, are a GM note | Unimpeded Stride (1) |
| PF2e's RollTwice for the triggering Seek or Recall Knowledge, removed after the roll | Scholarly Recollection (1) |

**Kept strict (tests):** it isn't read with any of these changes:
- added damage;
- a teleport instead of the Stride;
- “three times”.

An older test that used Sure Strike as its Effect + note example now uses Muscle Barrier.

## Coverage

**Census:** **628 enabled**, up from 625.
- The b217 diff changed only these three.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 744/744 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-134-live-results.json), case `cr1Batch134`, in the `pftest` world.
- **Sure Strike:** the caster got the Effect and the immunity marker; a second cast was refused.
- **Unimpeded Stride:** the caster got the Effect, and the card noted ending Immobilized/Grabbed.
- **Scholarly Recollection:** the caster got the Effect (two RollTwice rules). After a Perception check tagged as Seek, PF2e had removed it.
- **Cleanup:** fixtures removed.
