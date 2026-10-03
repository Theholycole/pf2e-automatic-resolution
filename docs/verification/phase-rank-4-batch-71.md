# Rank 4 batch 71 — Favorable Review

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Favorable Review (4) | Will; the caster can Dismiss it. Failure: a "Favorable review" note for 1 week (7 days) — the target can't speak ill of the named subject. Critical failure: the same note, unlimited, which also says the target's attitude toward the subject (or the creatures tied to it) is two steps better. A card reminder asks the caster to name the subject and says what a successful target notices. The 8th-rank heightening (more range and targets) only changes how many targets the caster picks. |

## Rules

- **Review rows (`src/compiler/review-rows.js`):**
  - It reads the lead (the subject, the save, Dismiss) and all four rows (the links in their PF2e or plain spelling).
  - The rows become "unaffected", with a note on the two failing rows.
  - The "varies" duration becomes the rows' own times.
- **Interpretation:** the attitude shift is a note and isn't applied as PF2e's attitude conditions, because it is toward a named subject rather than the caster. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-71.test.js` is new. Its negative case is a one-step attitude shift (not read).

A whole-corpus compile (b532 → b533) changed only Favorable Review.

## Evidence

[Live evidence](phase-rank-4-batch-71-live-results.json), case `rank4Batch71`, in the `pftest` world, at 8th rank (heightened).

| Result | Note |
| --- | --- |
| Critical success | — |
| Success | — |
| Failure | 7 days |
| Critical failure | unlimited, with the attitude shift |

**Cleanup:** fixtures removed.
