# Rank 4 batch 10 — Suggestion

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Suggestion (4) | **Failure:** a GM note on the target ("follows your suggestion", the finite/self-destructive endings) for 1 minute. **Critical failure:** the same note for 1 hour. Success and critical success apply nothing. Heightened (8th) up to 10 targets, one card. |

## Rules

- **Whole-row notes (`note-effects.js`):**
  - A row with "The spell has a duration of N …" takes that length.
  - "As failure, but the base duration is N" takes the named row's note for N.
  - "As failure, but the duration is …" with a length the reader can't read is now refused (it used to keep the named row's length).

## Tests

1039 + 1 = 1040 pass at the time; `test/rank-4-batch-10.test.js` is new, with a negative case (an unreadable critical-failure length stays blocked).

A whole-corpus compile (b385 → b388) changed only the batch's spells.

## Evidence

[Live evidence](phase-rank-4-batch-10-live-results.json), case `rank4Batch10`, in the `pftest` world, cast at 8th on three targets on one card.
- Success: no note. Failure: the note for 1 minute. Critical failure: the note for 1 hour.
- **Cleanup:** fixtures removed.
