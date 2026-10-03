# Rank 4 batch 26 — Dull Ambition

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Dull Ambition (4) | A Will save. Success: a note Effect with PF2e's RollTwice (keep lower) on initiative for 1 hour. Failure: the same for 1 day; the note also names downtime-activity checks, which are the GM's. Critical failure: as failure, with no end. |

## Rules

- **Initiative misfortune (`compile-ability.js`, `note-effects.js` `validRowNoteRule`):** "For N hour(s)/day(s), the target rolls twice and uses the lower result on initiative rolls [and any check to determine the success of a downtime activity]." is read as a note Effect with RollTwice on `initiative`. "As failure, but the duration is unlimited." carries the named row's note without end.
- **"varies" durations:** a save whose rows are all notes with stated times may now include a row stated as unlimited.

## Tests

1093 pass. `test/rank-4-batch-26.test.js` is new, with a negative case: another roll (Perception) isn't read.

A whole-corpus compile (b422 → b423) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-26-live-results.json), case `rank4Batch26`, in the `pftest` world.
- Success: `initiative lower 1 hours`.
- Failure: `initiative lower 1 days`, with the downtime text.
- Critical failure: `initiative lower unlimited`, with the downtime text.
- **Cleanup:** fixtures removed.
