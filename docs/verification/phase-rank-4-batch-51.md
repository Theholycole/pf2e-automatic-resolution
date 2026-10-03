# Rank 4 batch 51 — Debilitating Dichotomy

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Debilitating Dichotomy (4) | The target and the caster each take 9d6 mental (+3d6 a rank) by a basic Will save. The target is Stunned 1 on a critical failure. The card adds the caster, whose result is one degree better. |

## Rules

- **Caster share (`src/compiler/caster-share.js` `rewriteCasterShare`):**
  - It reads "You and the target each take … with a basic … save, and the target is … if it critically fails its save." and "You get a degree of success one better than you rolled for your saving throw." on a "1 creature other than you" spell.
  - It rewrites the target's basic save with its rider, and declares `resolution.casterShare` and a `caster` degree adjustment (one better).
- **Validator:** `isCasterShare` in `basic-save-core.js`; the predicate kind `caster`.
- **Runtime:**
  - `start` adds the caster's token as one more saver, with the adjustment applying.
  - Finalize's eligibility check skips that record, since "other than you" is the spell's target rule, not the caster's.
  - The card shows "(the caster)".
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-51.test.js` is new. Its negative cases are a different shift (not read) and a changed map (not executable).

A whole-corpus compile (b500 → b501) changed only Debilitating Dichotomy.

## Evidence

[Live evidence](phase-rank-4-batch-51-live-results.json), case `rank4Batch51`, in the `pftest` world, at 5th rank (12d6 mental = 39).

| Saver | Result |
| --- | --- |
| Target, critical failure | 78 lost, Stunned 1 |
| Caster (added by the card), Will −10, rolled critical failure | Failure (one better), 39 lost, not Stunned |

**Cleanup:** fixtures removed.
