# Rank 4 batch 25 — Aromatic Lure

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Aromatic Lure (4) | A Will save. Success: Stupefied 1 for 1 round. Failure: Stupefied 2 for 1 round, plus a 1-round "Lured" note (the creature moves toward the caster's chosen square by the most direct route; the GM moves it). Critical failure: Stupefied 4, the Lured note, and a "Stays at the destination" note whose 1d4 rounds are rolled when the save resolves. |

## Rules

- **Lured (`compile-ability.js`):** "… and moves toward/to the selected location via the most direct route possible for 1 round, bypassing any obvious hazards and enemies in the way." is a 1-round note beside the row's condition. Before this, the sentence was swallowed by the condition clause and never shown.
- **Rolled stay:** "If the creature reaches the destination, it must remain in that location for 1d4 rounds but can otherwise act normally." is a note with a rolled duration (`valueRoll`) beside the row's condition.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

1092 pass. `test/rank-4-batch-25.test.js` is new, with a negative case: a stay with another rule ("can take no actions") isn't read.

A whole-corpus compile (b421 → b422) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-25-live-results.json), case `rank4Batch25`, in the `pftest` world.
- **Failure:** Stupefied 2 and the Lured note (1 round).
- **Critical failure:** Stupefied 4, Lured (1 round), and the stay note for 4 rolled rounds.
- **Cleanup:** fixtures removed.
