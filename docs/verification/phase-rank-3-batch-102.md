# Rank 3 batch 102 — Thief of Fortune

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Thief of Fortune (3) | Affliction care's counteract against a spell Effect on the targeted creature, picked on the card. Only an Effect whose whole duration is 10 minutes or less can be picked. On a successful counteract, the Effect stays on the creature and the caster gains a copy of it; both last half the remaining time (in rounds, from now). On a failure, nothing is copied. The "valid target" condition and Dismissing (delete the copy) are card notes. |

## Rules

- **Affliction care (`src/compiler/affliction-care-compiler.js`):**
  - The target "one beneficial spell effect currently affecting a creature, with a duration of N or less" is the targeted creature.
  - The new sentence forms make the counteract a siphon, with `maxSeconds` from the target line.
  - Target eligibility is complete for it in `compileSpell`.
- **Validation (`affliction-care-core`):** a siphon must be a counteract against a spell effect with a positive `maxSeconds`. A `maxSeconds` with no siphon is refused.
- **Runtime (`affliction-care-runtime`):**
  - Candidates are limited by their whole duration.
  - A successful siphon updates the original Effect to half the remaining rounds and creates the copy on the caster, flagged `siphoned`.

## Interpretation

- **The halved durations apply at once.** "Each round both are affected counts for two rounds" is read that way. Ending the copy early doesn't restore the original's time.
- **"Beneficial" and "valid target" are the caster's judgement.** Both are notes.

## Tests

`test/rank-3-batch-102.test.js` is new. It covers the operation, that the plan is executable, a siphon without a limit (refused), and different wording (not read).

A whole-corpus compile (b626 → b627) changed only Thief of Fortune.

## Evidence

[Live evidence](phase-rank-3-batch-102-live-results.json), case `rank3Batch102`, in the `pftest` world.

| Step | Result |
| --- | --- |
| An hour-long Effect | Can't be picked |
| The 10-round +1 AC Effect | Countered (critical success); the ally keeps it; the caster gains it; both at 5 rounds; the caster's AC +1 |
| A failed counteract | No new copy |

**Cleanup:** fixtures removed.
