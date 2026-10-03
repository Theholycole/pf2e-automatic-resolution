# Rank 4 batch 84 — Remember the Lost

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Remember the Lost (4) | Enemies in the emanation take PF2e's 6d6 mental damage (basic Will save), and are Frightened 1 on a critical failure. For each enemy, the caster answers on the card whether they chanted the name of one of its victims. A "yes" makes that enemy's damage the larger dice: (2 × (rank − 1))d10 mental, scaled by its result. The GM confirms each creature knows someone who died with a grievance toward it (otherwise it's immune). The rule against guessing a murderer is a reminder. |

## Rules

- **Lost names (`src/compiler/lost-names.js`):**
  - It reads the lead, the naming sentence (its `@Damage` formula), the immunity and the heightening ("2d6 (or 2d10 …)").
  - It rewrites the lead to an ordinary basic save with the critical failure's condition.
  - It adds `resolution.targetUpgrade`, an enemy predicate and a GM-confirmed predicate for the immunity.
- **Per-target larger dice (new, `targetUpgrade`):**
  - Each damaged target's card row asks the caster's question; Finalize waits for the answers.
  - At Finalize the larger formula is rolled once (at the cast rank), and each "yes" target takes it in place of the shared roll, scaled by its own result.
  - Validator: a basic save with one damage entry of the same type, a rank formula, and the compiled sentence.
- **Interpretation:** a named enemy takes only the larger dice (not both). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-84.test.js` is new. It covers the plan, a wrong-type formula (refused), the readiness wait, an answer after the damage roll (refused), and another heightening (not read).

A whole-corpus compile (b568 → b569) changed only Remember the Lost, plus Asterism's reminder wording from batch 83.

## Evidence

[Live evidence](phase-rank-4-batch-84-live-results.json), case `rank4Batch84`, in the `pftest` world.

| Cast | Target | Result |
| --- | --- | --- |
| 5th (caster level 9) | named, failure | 8d10 = 41, lost 41 |
| 5th | not named, failure | 8d6 = 34, lost 34 |
| 5th | named, critical failure | lost 82 (double), Frightened 1 |
| 4th (caster level 7) | named, failure | 6d10 = 35, lost 35 |

**Cleanup:** fixtures removed.
