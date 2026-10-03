# Cantrip / rank 1 batch 157 — difficult-terrain areas (note-only before)

2026-09-28. User request: work on all the note-only cantrips and rank 1 spells. This batch adds the note-family dispatcher and its first family.

| Spell | Now |
| --- | --- |
| 500 Toads | A 15-foot burst of difficult terrain for 1 round. Traps and the rebuilt toads are notes |
| Mud Pit | A 15-foot burst of difficult terrain for 1 minute |
| Earthworks | A 5, 10 or 15-foot burst by actions; from 4th rank, flying creatures too. Clearing a square is a note |
| Warped Terrain | A 5, 10 or 15-foot burst by actions; from 4th rank, flying creatures too. Disbelief is a note |

## Tests

771/771 pass: sizes by actions, flying by rank, and strictness (added damage, a changed action sentence, a wrong maximum).

## Coverage

**Census:** **659 enabled**, up from 655.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-157-live-results.json), case `cr1Batch157`, in the `pftest` world.
- **Mud Pit:** the region got walk 2 and fly 1, and an Ongoing record started.
- **Earthworks (rank 4, 1 action):** radius 5, with walk 2 and fly 2.
- **500 Toads (in combat):**
  - The record stayed active through the other creature's turn.
  - It ended at the start of the caster's next turn, and the region was removed.
- **Cleanup:** fixtures, combats and PFTEST regions removed.
