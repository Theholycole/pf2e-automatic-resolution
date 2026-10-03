# Rank 4 batch 72 — Unsettling Perspective

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Unsettling Perspective (4, focus) | Will. PF2e's item has no damage entry, so the damage is the text's: 2d10 mental, +1d10 every 2 ranks. The rows apply it: none, half, full, or double with Stunned 1 on a critical failure. A card reminder says what the GM tells the caster on each result, including the critical failure's Recall Knowledge check at the next Refocus. |

## Rules

- **Insight rows (`src/compiler/insight-rows.js`):**
  - It reads the lead (narration, then the damage and save), the four rows, and the heightening step.
  - The rows become damage scales and the condition. What the caster learns is a `spell-note` reminder.
  - With no PF2e damage, it builds the text damage component and the formula `(2+floor((@item.rank - 4)/2)*1)d10[mental]`, and adds a data note.
- **Validator (`scripts/basic-save-core.js`):** a text-derived formula may carry the text's own type with no caster choice. It must be the formula the compiler read for these rows.
- **Interpretation:** information the caster learns is told by the GM (user decision 2026-10-01, "info: whisper GM+caster" — here a reminder, since PF2e has no data for it). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-72.test.js` is new. Its negative case is another heightening step (not read).

A whole-corpus compile (b533 → b534) changed only Unsettling Perspective.

## Evidence

[Live evidence](phase-rank-4-batch-72-live-results.json), case `rank4Batch72`, in the `pftest` world. The focus spell was heightened by the caster's level: 7 for 4th rank, 11 for 6th.

| Rank | Damage | Result | Hit Points lost | Stunned |
| --- | --- | --- | --- | --- |
| 4 | 2d10 mental = 9 | success | 4 | — |
| 4 | 2d10 mental = 9 | failure | 9 | — |
| 6 | 3d10 mental = 17 | critical failure | 34 | 1 |
| 6 | 3d10 mental = 17 | critical success | 0 | — |

**Cleanup:** fixtures removed.
