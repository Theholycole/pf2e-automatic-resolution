# Rank 5 batch 28 — Glacial Heart

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Glacial Heart (5) | 10d6 cold (+2d6 a rank), Fortitude, then immune for 1 day. **Success:** half and Slowed 1 for 1 round. **Failure:** full and Slowed 1. **Critical failure:** double and Slowed 2. On a failure or critical failure, the save at the end of each of its turns moves Slowed: +1 on a failure, +2 on a critical failure (at most 4), −1 on a success. At 0 the spell ends. The encasing ice is a GM note. |

## Rules

- **Escalating rows (`escalating-rows.js` `rewriteEscalatingRows`):**
  - It reads the damage lead, the immunity, the success row ("… The spell ends."), the failure row's escalation sentences, the ice paragraph, and the critical failure's "initially Slowed 2".
  - It writes plain rows and attaches `recurringSave: {mode: "escalate", steps, maximum}` to the failing rows' Slowed.
- **Recurring save `escalate` mode:**
  - The validator (`isRecurringSaveLifetime`) accepts the degree steps (each at most ±2), the maximum (1–4) and a valued condition.
  - The condition Effect's metadata carries the steps, the maximum and the slug.
  - `finalizeRecurringSave` updates the granted condition's value and ends the Effect at 0.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-28.test.js` is new. Its negative case is a maximum past the stated cap (blocked).

A whole-corpus compile (b490 → b491) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-28-live-results.json), case `rank5Batch28`, in the `pftest` world, in combat at 5th rank.

| Step | Slowed |
| --- | --- |
| Cast, failure | 1 |
| End of its turn: failure | 2 |
| End of its turn: success | 1 |
| End of its turn: success | 0 (the Effect ended) |

**Cleanup:** fixtures removed.
