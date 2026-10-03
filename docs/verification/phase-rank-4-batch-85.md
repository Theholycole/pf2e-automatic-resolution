# Rank 4 batch 85 — Captivating Adoration

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Captivating Adoration (4) | The caster's 15-foot emanation (+15 feet a rank), the caster out of it. Each creature in it when it starts, or that enters, saves (Will rows). Failure and critical failure: Fascinated while it stays in the area. Success: Fascinated to the end of its next turn. Each creature saves once: it's immune for an hour after a success or critical success, and for the spell's minute otherwise. Reminders: exclusions (left out in the review), re-entry (its original result), the success's "next action" limit, and the critical failure's attitude step. |

## Rules

- **Adoration rows (`src/compiler/adoration-rows.js`):**
  - It reads the four preamble sentences, the rows and the heightening.
  - It rewrites the text into the lingering trigger and plain rows: the failing rows' Fascinated is "as long as it remains in the area" (leave-area).
  - It sets `excludeCaster`, the area step, and a per-degree immunity: the rows' hour, and the spell's minute for the failing rows.
- **Interpretation:**
  - "For its next action" is until the end of its next turn, with a reminder to remove it after that action.
  - "Uses the results of its original save" is no new save (the immunity). The GM re-applies Fascinated for a failed creature that comes back.
  - The attitude step is the GM's.
  - Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-85.test.js` is new. It covers the lingering declaration, the rows, the immunity per degree, the reminders, the exposures, and another re-entry rule (not read).

A whole-corpus compile (b572 → b573) changed only Captivating Adoration.

## Evidence

[Live evidence](phase-rank-4-batch-85-live-results.json), case `rank4Batch85`, in the `pftest` world, at 4th rank (caster level 7).

| Step | Result |
| --- | --- |
| Start | 15-foot emanation; the caster isn't exposed |
| Inside: failure | Fascinated; immune |
| Inside: success | Fascinated; immune |
| A creature walks in: critical failure | asked; Fascinated |
| The failed creature walks out | Fascinated ends |
| …and back in | not asked again |

**Cleanup:** fixtures removed.
