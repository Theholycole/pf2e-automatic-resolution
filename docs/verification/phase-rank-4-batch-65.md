# Rank 4 batch 65 — Delusional Pride

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Delusional Pride (4) | Will, then temporarily immune for 24 hours. For 1 round (success), 10 minutes (failure) or 24 hours (critical failure), each failed attack roll or skill check the GM reports gives a −1 status penalty to attack rolls and skill checks until the end of its turn; a second failure while penalized makes it −2. |

## Rules

- **Overconfidence (`src/compiler/overconfidence.js` `rewriteOverconfidence`):**
  - It reads the lead with the 24-hour immunity and the three rows' times and penalties.
  - It writes the save with "Afterward, … immune for 24 hours." and unaffected rows.
  - Post-compile: each failing row's "Overconfidence" note with `triggeredPenalty`, and the outcome lifecycle.
- **New note control `triggeredPenalty {values, type, selectors}`:** `validNoteEffect`, the runtime flag, `storedTriggers.triggeredPenalty` and the Ongoing control "failed an attack roll or skill check (penalty)".
  - It creates the penalty Effect, or raises an existing one to the second value.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-65.test.js` is new. Its negative case is another penalized roll (not read).

A whole-corpus compile (b526 → b527) changed only Delusional Pride.

## Evidence

[Live evidence](phase-rank-4-batch-65-live-results.json), case `rank4Batch65`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Failure | "Overconfidence" note for 10 minutes; immune for 24 hours |
| First report | −1 to attack rolls and skill checks |
| Second report | −2 |

**Cleanup:** fixtures removed.
