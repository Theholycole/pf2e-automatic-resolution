# Rank 4 batch 44 — Darkened Eyes

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Darkened Eyes (4) | A Fortitude save, then 24 hours' immunity. **Success:** a "Vision suppressed" note Effect (darkvision or low-light vision) for 1 round. **Failure:** the same for 1 minute. **Critical failure:** the note for 1 minute, plus PF2e's Blinded for 1 minute with a save at the end of each of its turns that ends the blindness (the note stays). |

## Rules

- **Sense suppression (`sense-suppression.js` `rewriteSenseSuppression`):**
  - It reads the four written rows: the suppression for a duration, "As success, but the duration is …", and the critical failure's Blinded with its new save that ends only the blindness.
  - The result is written out as plain rows: Blinded for the duration, with "It can attempt a new save at the end of each of its turns to end the blinded condition." for the recurring-save lifetime.
  - The suppression is a note Effect on each affected row. The immunity sentence is read by the existing preamble compiler.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-44.test.js` is new. Its negative case is another suppression duration (not read).

A whole-corpus compile (b484 → b485) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-44-live-results.json), case `rank4Batch44`, in the `pftest` world, cast at 4th rank.

| Result | Note | Blinded | Immune |
| --- | --- | --- | --- |
| Success | 1 round | No | Yes |
| Failure | 1 minute | No | Yes |
| Critical failure | 1 minute | Yes | Yes |

**Cleanup:** fixtures removed.
