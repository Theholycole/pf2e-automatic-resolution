# Cantrip / rank 1 batch 170 — saves and areas (note-only before)

2026-09-28.

| Spell | Now |
| --- | --- |
| Verminous Lure | Tiny animals and animal swarms within range roll Will against the spell DC; those that fail are drawn to the target (the GM plays what they do) |
| Extradimensional Cover | The square's occupant has standard cover; a creature not on the caster's side that stops in it is pushed out; ends with the minute |
| Perfected Mind | A new Will save against a module-resolved mental effect on the caster; a better result swaps in the new row; once per effect |

## Tests

785/785 pass. A whole-corpus compile (b253 → b254) changed only these 3 spells. Batch-23 is updated.

## Coverage

**Census:** **717 enabled**, up from 714.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-170-live-results.json), case `cr1Batch170`, in the `pftest` world, on a temporary scene.
- **Verminous Lure:**
  - Only the Tiny rat and the Large animal swarm rolled; the Small dog and a Tiny rat out of range didn't.
  - The rat failed and got "drawn to" the bait. The swarm succeeded and got nothing. The bait has the lure's Effect.
- **Extradimensional Cover:**
  - The ally in the square had AC +2. Moved out, +0; moved back, +2.
  - An enemy moved into the square was pushed to an adjacent free space, with no cover.
  - Deleting the caster's Effect removed the square and the cover.
- **Perfected Mind:**
  - Chastising Retort's failure left the caster Stupefied.
  - The boosted new save was a critical success: the row was replaced and the caster is no longer Stupefied.
  - A second use found no effect left (once per effect).
- **Cleanup:** fixtures, regions and the temporary scene removed; no combats left.
