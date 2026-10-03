# Rank 3 batch 71 — Shift Blame

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Shift Blame (3, reaction) | Will. The caster targets the creature the triggering attack or failed check was against. Every result makes it temporarily immune for 24 hours. A failure (and so a critical failure, which has no row of its own) gives a "Shifted blame" note: it remembers the creature the caster chose as responsible, which the GM plays. A card reminder covers the trigger, naming the creature to blame, and what a successful target notices. |

## Rules

- **Blame shift (`src/compiler/blame-shift.js`):**
  - It reads the trigger, the body (the save and the 24-hour immunity) and the three rows.
  - Every result gets immunity; the failure and critical failure get the note.
  - Targeting is the trigger's target.
- **Interpretation:** the missing critical-failure row is the failure's (PF2e's rule). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-71.test.js` is new. Its negative case is another immunity time (not read).

A whole-corpus compile (b555 → b556) changed only Shift Blame.

## Evidence

[Live evidence](phase-rank-3-batch-71-live-results.json), case `rank3Batch71`, in the `pftest` world.

| Result | Immunity | Note |
| --- | --- | --- |
| Critical success | 24 hours | — |
| Failure | 24 hours | Shifted blame (unlimited) |
| Critical failure | 24 hours | Shifted blame (unlimited) |

**Cleanup:** fixtures removed.
