# Rank 5 batch 30 — Ancestral Winds

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Ancestral Winds (5) | A sustained 20-foot burst exposing living creatures when cast and wherever it's moved on the first Sustain each round (up to 30 feet; the GM moves the region). They take 5d6 void + 1d6 mental by their Will save. **Success:** half and Frightened 1. **Failure:** full and Frightened 2. **Critical failure:** double, Frightened 2 and Stunned 1. Nonliving creatures are refused. |

## Rules

- **Moved-area save (`moved-area-save.js` `rewriteMovedAreaSave`):**
  - It reads the living-creatures damage-and-save sentence (each part must be one of the item's entries), the nonliving immunity, the four rows, and the Sustain move paragraph after them.
  - It writes "When you Cast the Spell and the first time you Sustain it each round, each living creature in the area must attempt a … save." and plain rows. The move is a note.
- **Lingering subject:** `MOMENT_SUBJECT` also reads "each living creature in the area". This also gives Tear the Veil (rank 10) a lingering declaration, though it stays unresolved by its other gaps.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-30.test.js` is new. Its negative case is another move (not read). `test/lingering-area.test.js` no longer expects Tear the Veil to have no lingering declaration; it now checks only that the plan isn't executable.

A whole-corpus compile (b495 → b496) changed Ancestral Winds, and Tear the Veil as noted above.

## Evidence

[Live evidence](phase-rank-5-batch-30-live-results.json), case `rank5Batch30`, in the `pftest` world, at 5th rank.

| Creature inside when cast | Result |
| --- | --- |
| Living, failure | 1d6 mental + 5d6 void = 24 lost, Frightened 2 |
| Construct | Refused (nonliving) |

**Cleanup:** fixtures removed.
