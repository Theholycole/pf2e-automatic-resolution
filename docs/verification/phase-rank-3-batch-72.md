# Rank 3 batch 72 — Heart's Desire

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Heart's Desire (3, focus) | Will. Success: Stupefied 2 for 1 round, plus a "Heart's desire" note (–2 status to checks that determine its reactions' effects). Failure: Stupefied 2 for 1 minute, plus a note that it can't use reactions. Critical failure: the same, and the note adds that every space is difficult terrain for it. The heightened extra targets only change how many the caster picks. |

## Rules

- **Desire rows (`src/compiler/desire-rows.js`):**
  - It reads the lead and the four rows. The Stupefied value must match across rows.
  - It rewrites the rows as Stupefied for their time, plus a note per affected row for the same time.
  - The "varies" duration becomes the rows' own times.
- **Interpretation:** the reaction penalty, the lost reactions and the per-creature difficult terrain are GM notes (no PF2e rule fits). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-72.test.js` is new. Its negative case is a mismatched Stupefied value (not read).

A whole-corpus compile (b560 → b561) changed only Heart's Desire.

## Evidence

[Live evidence](phase-rank-3-batch-72-live-results.json), case `rank3Batch72`, in the `pftest` world (caster level 9).

| Rank | Result | Stupefied | Note |
| --- | --- | --- | --- |
| 5 | success | 2, 1 round | 1 round, the penalty |
| 5 | critical failure | 2, 1 minute | 1 minute, difficult terrain |
| 3 | failure | 2, 1 minute | 1 minute, no reactions |

**Cleanup:** fixtures removed.
