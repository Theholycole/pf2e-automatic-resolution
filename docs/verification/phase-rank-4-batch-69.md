# Rank 4 batch 69 — Vision of Beauty

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Vision of Beauty (4) | Will. Success: Stupefied 1 for 1 round. Failure: Stupefied 1 for 1 round, Fascinated for 2 rounds (the moving round and the round after) and an "Entranced" note for its next turn (it moves toward the image by the most direct route, bypassing obvious hazards and enemies). Critical failure: Stupefied 2 for 1 round, Fascinated for 1 minute and the note. The heightened extra targets are just more targets on the card. |

## Rules

- **Entranced rows (`src/compiler/entranced-rows.js`):**
  - It reads the lead (an image only the target sees, the save) and the three rows.
  - The rows are rewritten as their conditions; Fascinated starts at the cast and covers the movement round.
  - The movement is a note Effect on the failing rows, until the end of the target's next turn.
- **Interpretation:** "then Fascinated for 1 round" counts from the cast as 2 rounds; the critical failure's 1 minute also starts at the cast. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-69.test.js` is new. Its negative case is a failure row whose Stupefied value differs from the success row's (not read).

A whole-corpus compile (b530 → b531) changed only Vision of Beauty.

## Evidence

[Live evidence](phase-rank-4-batch-69-live-results.json), case `rank4Batch69`, in the `pftest` world: two targets at 6th rank (heightened), two at 4th.

| Result | Stupefied | Fascinated | Entranced note |
| --- | --- | --- | --- |
| Critical success | — | — | — |
| Success | 1 (1 round) | — | — |
| Failure | 1 (1 round) | 2 rounds | 1 round, turn end |
| Critical failure | 2 (1 round) | 1 minute | 1 round, turn end |

**Cleanup:** fixtures removed.
