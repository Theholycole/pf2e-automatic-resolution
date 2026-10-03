# Cantrip / rank 1 batch 137 — Figment, Light, Read Aura, Fishing Spot

2026-09-28. This continues the push to 100%. These four were on the Effect + note route.

| Rule | Spell |
| --- | --- |
| PF2e's Create a Diversion bonus on the caster; the illusion is a GM note | Figment (cantrip) |
| PF2e's token light on the targeted creature; the orb's placement, colour, moving and the four-lights limit are notes | Light (cantrip) |
| PF2e's Identify Magic bonus on the caster; what's magical is a GM note | Read Aura (cantrip) |
| The module rolls 1d8 and answers PF2e's fish choice; the Effect goes on the eater; cooking and eating are GM notes | Fishing Spot (1) |

**Kept strict (tests):** it isn't read with any of these changes:
- a 1d6 roll against the 8 fish;
- added damage (twice).

## Coverage

**Census:** **639 enabled**, up from 635.
- The b220 diff changed only these four.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 747/747 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-137-live-results.json), case `cr1Batch137`, in the `pftest` world. The session dropped before the run, and I rejoined as Gamemaster.
- **Figment:** the caster got the Effect.
- **Read Aura:** the caster got the Effect.
- **Light:** the caster targeted itself; its token's bright light went from 0 to 20.
- **Fishing Spot:** the roll was 5 (“dashing dace”). There was no PF2e prompt; the eater got “Spell Effect: Fishing Spot (Dashing Dace)” with that selection.
- **Cleanup:** fixtures removed.
