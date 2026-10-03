# Rank 4 batch 78 — Shared Nightmare

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Shared Nightmare (4, focus) | Will. Critical success: the caster is Confused for 1 round (an Effect on the caster granting PF2e's Confused). Success: a card reminder that the caster spends their first action next turn Confused, which the GM plays (PF2e has no one-action Confused). Failure: a "Shared nightmare" note on the target for 1 minute (its first action each turn is Confused). Critical failure: the target is Confused for 1 minute. |

## Rules

- **Nightmare swap (`src/compiler/nightmare-swap.js`):**
  - It reads the lead (the condition named by its link) and the four rows.
  - The critical success becomes a timed caster condition. The failure becomes a note, and the critical failure the target's condition for its minute.
- **Timed caster condition:**
  - `isCasterConditionTimed` (`scripts/basic-save-core.js`) checks "You are X for N round(s)." with the link, duration and expiry.
  - The runtime grants it through an Effect on the caster for that time.
  - The card's caster line says "the spell ends" only when the row ends it. That also fixes the wording for the existing "caster condition only" rows.
- **Interpretation:** one-action Confused is GM-played. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-78.test.js` is new. Its negative cases are:

- another duration on the caster's entry (refused);
- another caster time in the text (not read).

A whole-corpus compile (b544 → b545) changed only Shared Nightmare.

## Evidence

[Live evidence](phase-rank-4-batch-78-live-results.json), case `rank4Batch78`, in the `pftest` world, at 4th rank (caster level 7), one cast per result.

| Result | Caster | Target |
| --- | --- | --- |
| Critical success | Confused, Effect 1 round; card "Caster: Confused for 1 round." | — |
| Success | — | — |
| Failure | — | Shared nightmare note, 1 minute |
| Critical failure | — | Confused, 1 minute |

**Cleanup:** fixtures removed.
