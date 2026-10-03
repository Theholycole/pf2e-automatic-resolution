# Rank 5 batch 53 — Geyser

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Geyser (5) | Reflex, in the 10-foot-radius cylinder: bludgeoning and fire (PF2e's two entries, +1d6 each per rank). Success: half. Failure: full, plus 10 bludgeoning from falling back after the 20-foot push (half the height). Critical failure: double, plus 20 from the 40-foot push. A card reminder says to undo the fall for a creature that flies or stays aloft, and to mark the steam (concealment both ways) for 1 round. |

## Rules

- **Geyser rows (`src/compiler/geyser-rows.js`):**
  - It reads the area line, the lead (both damage entries, the fall rule, the steam) and the four rows.
  - The failing rows get the shared damage plus the fall as a fixed bludgeoning formula (half the push), not scaled by the row.
- **Interpretation:** falling damage is applied by default; staying aloft and the steam are the GM's. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-53.test.js` is new. Its negative case is another push and multiplier (not read).

A whole-corpus compile (b563 → b564) changed only Geyser.

## Evidence

[Live evidence](phase-rank-5-batch-53-live-results.json), case `rank5Batch53`, in the `pftest` world, at 6th rank (caster level 11): 4d6 bludgeoning + 5d6 fire = 38.

| Result | Hit Points lost |
| --- | --- |
| Success | 19 (half) |
| Failure | 48 (38 + 10) |
| Critical failure | 96 (76 + 20) |

**Cleanup:** fixtures removed.
