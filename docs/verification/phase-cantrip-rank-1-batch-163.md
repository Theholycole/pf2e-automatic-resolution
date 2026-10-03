# Cantrip / rank 1 batch 163 — check helpers (note-only before)

2026-09-28.

| Spell | Now |
| --- | --- |
| Extend Boost | The tradition's skill against the caster's level DC. The next Boost/Reinforce Eidolon lasts 4/3/1 rounds; a failure refunds the Focus Point |
| Lingering Composition | The same with Performance, against the highest-level ally's DC, for the next cantrip composition |
| Share Burden | The ally's next emotion save is one degree better (PF2e's rule), then removed |
| Counter Performance | Performance against the recent auditory or visual saves of you and allies within 60 feet. Better results are listed for the GM |
| Foresee the Path | Perception against the enemy's higher Will or Deception DC, then enemy immunity. On a success, the ally's reaction note and a bonus toggle |

## Tests

778/778 pass. A whole-corpus compile changed only these 5 spells.

## Coverage

**Census:** **683 enabled**, up from 678.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-163-live-results.json), case `cr1Batch163`, in the `pftest` world.
- **Extend Boost:**
  - Arcana against DC 15 failed: the next Reinforce Eidolon lasted 1 round.
  - Against DC 1, a critical success: the next one lasted 4 rounds.
- **Share Burden:** the ally's emotion save went from a critical failure to a failure (one degree better), and the Effect was then gone.
- **Counter Performance:** the ally's auditory save critically failed against DC 35. The caster's Performance (52) gave a critical success, listed as better.
- **Foresee the Path:** DC 20, the higher of Will and Deception. A failure gave no ally Effect, and a second cast was refused (immunity).
- **Cleanup:** fixtures removed, and no combats left.
