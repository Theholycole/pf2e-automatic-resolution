# Rank 3 batch 28 — Travel by Turtle, Tiny Wings, Transcribe Conflict

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Travel by Turtle (3) | A note on the caster: the conjured turtle that works as a boat. Its duration is 1 hour, then 1 day at 5th, 7 days at 7th and 30 days at 9th. |
| Tiny Wings (3) | A note on the familiar carrying PF2e's BaseSpeed fly 20 for 1 hour. A familiar that already flies gets "+15 instead", which the note leaves to the GM. |
| Transcribe Conflict (3) | A note on the caster. The initiative bonus against one kind of foe is the GM's. Its duration is 1 hour, then 8 hours at 5th and until the next daily preparations at 8th. |

## Rules

- **Spell notes (`spell-note.js`):**
  - A creature conjured and named by the spell ("You conjure an intelligent sea turtle" in Travel by Turtle) counts as conjured, and "The turtle conjured is/has …" is its statistics.
  - "Your familiar / The target / You gains a N-foot fly/swim/climb/burrow Speed." becomes a BaseSpeed rule, and the subject must be the recipient.
  - "X who already have a fly Speed instead gain a +N-foot status bonus …" is left to the GM.
  - "in combats where you face" is situational.
- **Note rules (`scripts/note-effects.js`):** `validNoteRule` accepts BaseSpeed (fly/swim/climb/burrow, a multiple of 5).
- **Heightened durations (`heightened-duration-compiler.js`):** weeks (7 days) and months (30 days) are read. This also fixes the heightened durations of Oathkeeper's Insignia, Construct Mindscape, Return Beacon and Teleportation Circle (already resolved; their 7th/9th-rank durations had been ignored).
- **Interpretations (logged):** weeks and months in days, the turtle as a note, the already-flying familiar.

## Tests

1053 pass (`test/heightened-duration.test.js` updated: a week and a month now parse). `test/rank-3-batch-28.test.js` is new, with negative cases:
- an unnamed creature's Speed;
- a Speed on the caster for the familiar's spell;
- an unconditional bonus.

A whole-corpus compile (b391 → b393) changed only these, the rank 4 batch 12 spells and the four heightened-duration fixes.

## Evidence

[Live evidence](phase-rank-3-batch-28-live-results.json), case `rank3Batch28`, in the `pftest` world.
- Travel by Turtle at 7th: the caster's note lasts 7 days.
- Tiny Wings: the target's fly Speed went from 0 to 20; the note lasts 1 hour.
- Transcribe Conflict at 5th: the note lasts 8 hours and carries no rule.
- **Cleanup:** fixtures removed.
