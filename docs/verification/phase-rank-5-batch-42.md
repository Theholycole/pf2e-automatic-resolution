# Rank 5 batch 42 — Subconscious Suggestion

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Subconscious Suggestion (5) | Will. Failure and critical failure give a "Subconscious suggestion" note, held until the caster's next daily preparations (unlimited; the GM ends it). The note says that once the caster's trigger occurs, the creature follows the suggestion for 1 minute (1 hour on a critical failure) or until it's done or harmful. A card reminder covers the trigger, the directive's limits, and what a successful target notices. The 9th-rank heightening (up to 10 targets) only changes how many targets the caster picks. |

## Rules

- **Suggestion rows (`src/compiler/suggestion-rows.js`):**
  - It reads the lead and the four rows.
  - The rows become "unaffected", with the held note on the failing rows.
  - The "varies" duration becomes the rows' own times.
- **Interpretation:** "until the next time you prepare" is an unlimited note the GM ends. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-42.test.js` is new. Its negative case is another holding time (not read).

A whole-corpus compile (b541 → b542) changed only Subconscious Suggestion.

## Evidence

[Live evidence](phase-rank-5-batch-42-live-results.json), case `rank5Batch42`, in the `pftest` world (caster level 17).

| Rank | Result | Note |
| --- | --- | --- |
| 9 | failure | unlimited, triggered for 1 minute |
| 9 | critical success | — |
| 5 | critical failure | unlimited, triggered for 1 hour |
| 5 | success | — |

**Cleanup:** fixtures removed.
