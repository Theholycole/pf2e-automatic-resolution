# Rank 3 batch 80 — Lightning Lasso

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Lightning Lasso (3) | Reflex rows with PF2e's 2d12 electricity (+1d12 a rank). Failure: Immobilized until the end of the caster's next turn or until it Escapes. Critical failure: Immobilized and Restrained, the same. Each later round's first Sustain deals (rank − 2) × 2 electricity to each target this cast still holds and restarts its hold to the end of the caster's next turn. |

## Rules

- **Sustained lasso (`src/compiler/sustained-lasso.js`):**
  - It reads the rows and the heightening.
  - It writes the inline damage as PF2e's item damage and the holds as "until the end of your next turn or until it Escapes".
  - It adds `resolution.sustainHold`: the degrees, the rank formula, the type and the held condition.
- **Sustain's hold (new):**
  - The native sustained record keeps the failed targets.
  - The first Sustain each round finds each one's escapable Effect from this cast. If it's still held, the module rolls the flat damage at the cast rank, applies it, and restarts the Effect (start = now, on the caster's turn).
  - Validator: a sustained degree save, its rows holding that condition with Escape, the formula, and the sentence.
- **Interpretation:** "you can Sustain … to deal" happens on every Sustain while it's held (the caster sustains or not). The critical failure's Restrained shares the failure's time. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-80.test.js` is new. It covers the rows, the hold, a non-failing degree (refused), and another heightening (not read).

A whole-corpus compile (b581 → b582) changed only Lightning Lasso.

## Evidence

[Live evidence](phase-rank-3-batch-80-live-results.json), case `rank3Batch80`, in the `pftest` world, at 4th rank (caster level 7), in combat.

| Step | Result |
| --- | --- |
| Failure | 3d12 electricity = 13, lost 13; Immobilized (escapable) |
| Next round's Sustain | 4 electricity (rank 4: (4 − 2) × 2); still Immobilized; the hold's start moved to now |

**Cleanup:** fixtures and combat removed.
