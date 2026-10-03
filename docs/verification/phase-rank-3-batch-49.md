# Rank 3 batch 49 — Gasping Marsh

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Gasping Marsh (3) | A placed 10-foot burst, sustained for 1 minute. Each breathing creature that starts its turn inside takes 4d6 poison damage and saves (Fortitude). The rows are the written ones: success half, failure full and Sickened 1, critical failure double, Sickened 2 and 1d8 persistent poison. The creature is then immune for 1 minute. Notes cover breathing and moving the mist. |

## Rules

- **Written basic rows (`compile-ability.js`):** when a basic save's description writes out all four rows (unaffected, half, full, double, each with its own effects), the module compiles the basic reading first.
  - If the basic reading compiles completely, it stands. Acid Grip and others are unchanged.
  - Otherwise a copy with the save non-basic is compiled, and it is used only if it compiles completely (`compilerEvidence.writtenBasicRows`).
- **Lingering trigger (`lingering-area-compiler.js`):** "You deal NdM T damage to each (breathing) creature that starts/ends its turn in the area." followed by "Each affected creature must attempt a X save." is one trigger. "Breathing" becomes a review note.
- **Sustain sentences:** for a sustained area, "When you Sustain the Spell, the … dissipates completely from the previous area, and you can select a new area …" becomes a note, and "If you don't Sustain the Spell, … the spell ends." is the sustained spell's own end.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-49.test.js` is new. It also checks that Acid Grip keeps its basic reading. `test/compiler.test.js` now expects Gasping Marsh's table reading instead of its basic-save gate.

A whole-corpus compile (b461 → b463) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-49-live-results.json), case `rank3Batch49`, in the `pftest` world.
- The record shows the two notes.
- The creature's turn-start exposure used Fortitude. It failed: 4d6 poison = 15, Sickened 1, and the immunity Effect.
- On the next round it had no new exposure.
- **Cleanup:** fixtures removed.
