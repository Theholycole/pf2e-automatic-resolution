# Rank 4 batch 57 — Outcast's Curse

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Outcast's Curse (4) | Will. **Success:** PF2e's Effect rolling Deception, Diplomacy, Intimidation and Performance twice (keep the lower) for 10 minutes. **Failure:** the permanent Effect. **Critical failure:** the permanent Effect too. The initial attitudes (one step worse; two on a critical failure) are notes. |

## Rules

- **Skill roll-twice (`native-outcome-effect-compiler.js` `compileSkillRollTwiceEffects`):**
  - It reads the success row (the minutes and the skills), "As success, but the effect is permanent." and PF2e's two linked Effects.
  - Each Effect's only rule must roll exactly those skills twice keeping the lower. The minutes' Effect goes to the success row and the unlimited one to the failing rows, told apart by duration.
  - The proof kind is `skill-roll-twice-effect` (`native-outcome-effects.js`).
- **Attitudes:** each row's note replaces the generic attitude note, which read only the success row.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-57.test.js` is new. Its negative case is other skills (not read).

A whole-corpus compile (b517 → b518) changed only Outcast's Curse.

## Evidence

[Live evidence](phase-rank-4-batch-57-live-results.json), case `rank4Batch57`, in the `pftest` world.

| Result | Effect | Attitude note |
| --- | --- | --- |
| Success | 10 minutes | one step |
| Failure | unlimited | one step |
| Critical failure | unlimited | two steps |

**Cleanup:** fixtures removed.
