# Rank 4 batch 74 — Stasis

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Stasis (4, focus) | Will. Success: Stunned 1. Failure: a "Stasis" GM note for 1 round (invulnerable, untargetable, unmovable, timers paused; the note asks the GM to hold the creature's other durations, since the module can't pause PF2e's). Critical failure: the same note for 3 rounds, with PF2e's end-of-turn Will save shortening it by 1 round (ending it on a critical success) through the Ongoing record. A card reminder says an unattended object automatically critically fails (objects up to 1 Bulk are the GM's). |

## Rules

- **Stasis rows (`src/compiler/stasis-rows.js`):**
  - It reads the lead (with the unattended-object rule), the target "1 creature or up to 1 Bulk of objects", and the four rows.
  - Stunned stays a condition. The stasis is a note per failing row; the critical failure's carries `recurringSave {turn-end, reduce, will}`.
  - The "varies" duration becomes the rows' own times.
- **Interpretation:** paused durations and invulnerability are the GM's (note). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-74.test.js` is new. Its negative case is a different reduction (not read).

A whole-corpus compile (b535 → b536) changed only Stasis.

## Evidence

[Live evidence](phase-rank-4-batch-74-live-results.json), case `rank4Batch74`, in the `pftest` world, at 4th rank (caster level 7).

| Result | Stunned | Stasis note |
| --- | --- | --- |
| Critical success | — | — |
| Success | 1 | — |
| Failure | — | 1 round |
| Critical failure | — | 3 rounds, end-of-turn Will save (reduce) |

The Ongoing record holds the cast's entries.

**Cleanup:** fixtures removed.
