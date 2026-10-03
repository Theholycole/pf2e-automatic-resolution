# Rank 4 batch 59 — Clownish Curse

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Clownish Curse (4) | Will. Each failing row is a generated Effect: Acrobatics, Stealth and Thievery rolled twice keeping the worse, and a failure at one becomes a critical failure. It lasts 1 round on a success, 1 hour on a failure, and permanently on a critical failure. |

## Rules

- **Skill curse (`src/compiler/skill-curse.js` `compileSkillCurse`):**
  - It reads the three rows.
  - Each row's note carries `RollTwice` (the listed skills, keep the lower) and one `AdjustDegreeOfSuccess` (failure → critical failure) per skill, for the row's time.
  - The "varies" duration becomes per-row (outcome).
- **Note rules (`note-effects.js` `validRowNoteRule`):** RollTwice over a list of PF2e skills, and AdjustDegreeOfSuccess on one skill with that exact adjustment.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-59.test.js` is new. Its negative case is another adjustment (not read).

A whole-corpus compile (b519 → b520) changed only Clownish Curse.

## Evidence

[Live evidence](phase-rank-4-batch-59-live-results.json), case `rank4Batch59`, in the `pftest` world.

| Result | Effect |
| --- | --- |
| Success | 1 round |
| Failure | 1 hour |
| Critical failure | unlimited |

Each Effect has RollTwice and three AdjustDegreeOfSuccess rules, none ignored by PF2e.

**Cleanup:** fixtures removed.
