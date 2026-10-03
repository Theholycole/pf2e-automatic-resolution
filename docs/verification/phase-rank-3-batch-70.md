# Rank 3 batch 70 — Crisis of Faith

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Crisis of Faith (3) | Will. The card asks the caster whether the target can cast divine spells. If yes, the damage dice are d8s (6d8, +2d8 per rank); if no, d6s (6d6, +2d6 per rank). Rows: half, full, or double. On a failure, Stupefied 1 for 1 round applies only when the answer was yes. On a critical failure, Stupefied 1 for 1 round applies regardless, plus a "Faith shaken" note (no divine spells for 1 round). A card reminder carries the anathema warning. |

## Rules

- **Faith crisis (`src/compiler/faith-crisis.js`):**
  - It reads the lead (both dice), the anathema sentence, the four rows and the heightening (both steps).
  - The rows are rewritten plainly. The failure's Stupefied is tagged `choiceGroup: "dice-upgrade-yes"`.
- **Gated condition (`scripts/basic-save-core.js`):**
  - `targetOutcomeConditions` applies a `dice-upgrade-yes` condition only when the dice question was answered yes.
  - The validator allows the tag only with that question and this evidence.
  - The dice question now also applies to this degree save.
- **Interpretation:** one answer per cast (the spell has one target). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-70.test.js` is new. Its negative cases are:

- the gated condition without its question (refused);
- another heightening (not read).

A whole-corpus compile (b554 → b555) changed only Crisis of Faith.

## Evidence

[Live evidence](phase-rank-3-batch-70-live-results.json), case `rank3Batch70`, in the `pftest` world (caster level 7), one cast per target.

| Rank | Divine caster? | Result | Damage | Stupefied | Note |
| --- | --- | --- | --- | --- | --- |
| 4 | yes | failure | 8d8 mental (36) | 1 | — |
| 3 | no | failure | 6d6 mental (26) | — | — |
| 3 | no | critical failure | 6d6 doubled (42) | 1 | Faith shaken |

**Cleanup:** fixtures removed.
