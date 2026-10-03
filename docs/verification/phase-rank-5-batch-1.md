# Rank 5 batch 1 — You're Mine

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| You're Mine (5, focus) | The target rolls a Will save. **Success:** Stunned 1. **Failure:** Stunned 1, plus a GM note Effect that the caster chooses one action it takes on its next turn. "If it has actions left, it can act normally." restates normal play. Applying Stunned 1 now is the same as on its next turn, since PF2e removes the actions when that turn starts. **Critical Failure:** Controlled for 1 round. **Heightened (7th):** failure is Controlled for 1 round; critical failure is Controlled for up to 1 minute, with a Will save at the end of each of its turns that ends it on a success. Before this, the Heightened entry only gated ranks 7 and up. |

## Rules

- **`residual-prose.js`:** "If it has actions left, it can act normally." in a row that carries a note Effect is a restatement of normal play, with no rule of its own.
- **`heightened-variants.js`:** "On a failure, the target is Controlled for 1 round. On a critical failure, the target is Controlled for up to 1 minute; it receives a new Will save at the end of each of its turns, and on a success, the spell ends." becomes a rank variant. It reuses the base critical failure's condition, timed, with the existing end-of-turn recurring-save lifetime. Any other wording keeps the rank gate.

## Tests

982/982 pass. `test/rank-5-batch-1.test.js` is new. It checks:
- the rows, the note and the rank 7 rows;
- that a changed rank 7 entry falls back to the rank gate.

A whole-corpus compile (b350 → b351) changed only You're Mine.

## Coverage

**Census:** **1170 enabled** (milestone; 1166 non-ritual), up from 1169. Rank 5: 80 of 202.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-5-batch-1-live-results.json), case `rank5Batch1`, in the `pftest` world.
- **Rank 5:**
  - success: Stunned 1;
  - failure: Stunned 1 and the note;
  - critical failure: Controlled, 1 round.
- **Rank 7 (caster level 13):**
  - failure: Controlled, 1 round, no Stunned;
  - critical failure: Controlled, 1 minute, with the end-of-turn Will save in its Effect.
- **Cleanup:** fixtures removed.
