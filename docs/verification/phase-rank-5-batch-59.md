# Rank 5 batch 59 — Steal the Sky

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Steal the Sky (5) | The struck flying creature's Fortitude save. The descent is a note: 60 feet, +20 a rank. The GM answers for each creature whether its descent hit a surface. If so, it takes the fall: half the descent as bludgeoning (30 at 5th, +10 a rank), doubled on a critical failure. On a failure it's also Prone, with a minute's note that it can't Fly or leave the ground. A surface nearer than the full descent is a reminder (adjust the damage). |

## Rules

- **Sky steal (`src/compiler/sky-steal.js`):**
  - It reads the trigger, the narration, the four rows and the heightening.
  - It writes the fall as a rank formula (whole numbers only) and the rows' Prone.
  - Post-hook: every row's fall formula and the Prone carry the GM's surface question. The descent and grounding are notes; there is a reminder.
- **Gated row damage (extended):**
  - A row may gate only its damage (the success), with this spell's sentence.
  - `gmQuestionGate` also reads a gated damage formula, so the card asks the question.
  - The question gate accepts this spell's sentence.
- **Interpretation:** "as if it had fallen" assumes the full descent; a nearer surface is the GM's adjustment. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-59.test.js` is new. It covers the formulas, the gates, the card's question for a damage-only row, and an odd step (not read).

A whole-corpus compile (b592 → b593) changed only Steal the Sky.

## Evidence

[Live evidence](phase-rank-5-batch-59-live-results.json), case `rank5Batch59`, in the `pftest` world, at 6th rank (caster level 11).

| Target | Result |
| --- | --- |
| Failure, hit a surface (yes) | lost 40 (half of 80 feet); Prone; the grounding note |
| Critical failure, didn't (no) | lost 0; not Prone |

**Cleanup:** fixtures removed.
