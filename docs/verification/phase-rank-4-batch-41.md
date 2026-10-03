# Rank 4 batch 41 — Ordained Purpose

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Ordained Purpose (4) | Enemies in a 30-foot emanation take 4d6 mental damage (+2d6 per rank), Will save. The written rows are read as the table. For each target the card asks the GM to pick one degree worse, one degree better, or neither. Failure and critical failure get a "Compelled" note: Drop Prone as its first action next turn, and on a critical failure it can't Stand that turn. |

## Rules

- **Described shifts (`degree-adjustment.js`):** "(At the GM's discretion,) a creature … uses the outcome one degree of success worse/better than the result of its saving throw." is read.
  - One such sentence becomes a GM question.
  - A worse and a better sentence become `predicate.kind: "gm-choice"` with two options (each with its map) plus the "neither" identity map. It claims both sentences.
- **GM choice at runtime:**
  - The card shows a button per option plus "Neither", through the `adjustment-choice` correction with the option key.
  - `applyDegreeAdjustment` uses the chosen option's map, and `isDegreeAdjustment` validates the form.
- **Drop Prone compulsion (`compile-ability.js`):** "takes full/double damage (and) must Drop Prone as its first action on its next turn(, and can't Stand during its next turn)." keeps the row's damage and adds a note for the creature's next turn.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-41.test.js` is new. Its negative case is two shifts in the same direction.

A whole-corpus compile (b463 → b465) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-41-live-results.json), case `rank4Batch41`, in the `pftest` world. The card asked the GM's question; the caster's ally was ineligible. The damage was 7.

| GM's pick | Rolled | Final | Damage taken | Compelled note |
| --- | --- | --- | --- | --- |
| worse | failure | critical failure | 14 | yes |
| better | success | critical success | 0 | no |
| neither | failure | failure | 7 | yes |

**Cleanup:** fixtures removed.
