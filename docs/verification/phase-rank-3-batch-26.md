# Rank 3 batch 26 — Distracting Chatter, Excise Lexicon

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Distracting Chatter (3) | Off-Guard (PF2e's condition) and a note (the auditory Perception penalty, the DC 5 flat checks) for 1 round, 3 rounds or 1 minute by the Will save. Critical success: nothing. Heightened (7th) five targets. |
| Excise Lexicon (3) | A note on the target (the excised word, the shared-language rule, the Heightened extra word) for 1 minute, 1 day or unlimited. Critical success: nothing. |

## Rules

- **The effect stated before the table, its length by the save (`compile-ability.js`):**
  - Applies when every failing row only states the length ("The duration is N." / "The spell's duration is N." / "The effect's duration is N." / "The target is affected for N.", or unlimited) and the critical success is "unaffected".
  - The preamble's effect sentences (after the narration and the save statement) become each row's note for that row's length.
  - A condition in "The target is X, …" is applied for the same length; a condition only mentioned is refused, as are damage, counteracts, immunity and Sustain.
  - A Heightened entry with no data behind it joins the note.
- **Interpretation (logged):** Distracting Chatter's auditory penalty and flat checks are in the note.

## Tests

1042 pass. `test/rank-3-batch-26.test.js` is new, with negative cases: damage in the stated effect, and a row that adds an effect, stay blocked.

A whole-corpus compile (b385 → b388) changed only Distracting Chatter and Excise Lexicon.

## Evidence

[Live evidence](phase-rank-3-batch-26-live-results.json), case `rank3Batch26`, in the `pftest` world.
- Distracting Chatter at 7th, three targets on one card: all Off-Guard; notes for 1 round, 3 rounds and 1 minute.
- Excise Lexicon at 5th: notes for 1 minute, 1 day and unlimited; the note carries the extra word.
- **Cleanup:** fixtures removed.
