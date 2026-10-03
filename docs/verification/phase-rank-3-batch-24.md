# Rank 3 batch 24 — Subjugate Undead, Sudden Recollection, Rewrite Memory

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Subjugate Undead (3) | Targets an undead of level ≤ the caster's level − 4 (checked). **Failure:** a minion under the caster's control for 1 minute (decision 6: the note's minion control). **Critical failure:** 10 minutes. **Critical success:** immune for 24 hours. The other controller's save and recasting are GM reminders; the hostile-action dismissal is in the note. |
| Sudden Recollection (3), Rewrite Memory (4) | **Failure / critical failure:** the row's whole text as a GM note on the target until the GM ends it (the spell is unlimited). **Success / critical success:** nothing applied (they're narrative). |

## Rules

- **`minion-control.js` `extractSubjugation`:** it reads "It can attempt a X save to resist the effect." / the controller's save / recasting, the minion rows (failure N minutes with the dismissal, critical failure "As failure, except the duration is N minutes"), and the target "one X creature with a level of no more than your level −N".
- **Inner compile (`compile-ability.js`):** manual instructions only on rows the minion note claims whole are the note's.
- **Caster-relative level (core + runtime):** the target predicate `level-at-most-caster`; the runtime passes the caster's level.
- **Whole-row notes (`note-effects.js`):** they accept the caster's choice the row describes ("You choose …", "If the target was willing, you can instead choose …"). An unlimited spell gives an unlimited note. An unlimited spell whose every lasting part is such a note is resolved by outcome.

## Tests

1034 + 2 = 1036 pass. `test/rank-3-batch-24.test.js` is new, with the level limit checked both ways (5 eligible and 6 refused for a level-9 caster).

A whole-corpus compile (b380 → b381) changed only these three.

## Evidence

[Live evidence](phase-rank-3-batch-24-live-results.json), case `rank3Batch24`, in the `pftest` world. It passed on the first run.
- **Subjugate Undead, level-9 caster:**
  - A level-1 undead failed and got the 1-minute minion note, with the minion trait.
  - A level-6 undead was ineligible.
  - Ownership: the world has no player user to own the token, so "owned" was false.
- **Sudden Recollection and Rewrite Memory:** the failures got the unlimited GM note.
- **Cleanup:** fixtures removed.
