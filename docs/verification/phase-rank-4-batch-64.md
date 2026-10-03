# Rank 4 batch 64 — Infectious Melody

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Infectious Melody (4) | Enemies in a 15-foot emanation that hear it save Will. PF2e's −2 status penalty to linguistic Intimidation lasts 1 round on a success, 3 rounds on a failure and 1 hour on a critical failure. Singing to speak (Perform), the flat check for linguistic abilities and "can't stay Undetected" are a note for as long. |

## Rules

- **Duration-bound penalty Effects (`compileDurationBoundPenaltyEffects`):**
  - It reads the success row's time and penalty, and "As success, but the duration is …" on the failing rows.
  - PF2e's three Effects, each with exactly that penalty, are bound by duration. The proof kind is `duration-bound-penalty-effect`.
- **Plan:** each row's "Singing along" note; a `spell-note` for "foes hearing it"; the outcome lifecycle.
- **Fix:** the success row's "nearly impossible … to remain Undetected" had compiled into granting Undetected. It's now dropped; only this spell has that wording.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-64.test.js` is new; it also checks that no row grants a condition. Its negative case is another penalty (not read).

A whole-corpus compile (b525 → b526) changed only Infectious Melody.

## Evidence

[Live evidence](phase-rank-4-batch-64-live-results.json), case `rank4Batch64`, in the `pftest` world.

| Result | Penalty Effect | Note | Undetected |
| --- | --- | --- | --- |
| Success | 1 round | 1 round | no |
| Failure | 3 rounds | 3 rounds | no |
| Critical failure | 1 hour | 1 hour | no |

**Cleanup:** fixtures removed.
