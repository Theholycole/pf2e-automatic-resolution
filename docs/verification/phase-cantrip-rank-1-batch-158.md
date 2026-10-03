# Cantrip / rank 1 batch 158 — stated check bonuses (note-only before)

2026-09-28.

| Spell | Now |
| --- | --- |
| Fashionista | +1 status to Deception to Create a Diversion (+1 per 2 ranks, up to +4) on the target, for 1 hour. Dismissal is a note |
| Groom Companion | +1 status to Performance on the companion or eidolon, for 8 hours. Other creatures are refused |
| Root Reading | +1 status to Seek until the end of your next turn, and +1 to the next Track check (removed after it). What you learn is a GM note |

## Tests

772/772 pass, including values by rank and strictness. Batch-14 is updated for the new route.

## Coverage

**Census:** **662 enabled**, up from 659.
- A whole-corpus compile changed only these 3 spells.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-158-live-results.json), case `cr1Batch158`, in the `pftest` world.
- **Fashionista (rank 5):** the Effect lasts 1 hour. Create a Diversion got +3; Lie got nothing.
- **Groom Companion:** a non-companion was refused. The minion's Performance got +1.
- **Root Reading:** Seek got +1 and that Effect stays for the turn. Track got +1, and that Effect was removed.
- **Cleanup:** fixtures removed, and no combats left.
