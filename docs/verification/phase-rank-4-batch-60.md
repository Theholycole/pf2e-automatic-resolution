# Rank 4 batch 60 — Sage's Curse

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Sage's Curse (4) | Will. **Success:** PF2e's Effect rolling Arcana, Lore, Occultism and Society twice (keep the lower) for 10 minutes. **Failure:** the permanent Effect, set to "failure". **Critical failure:** the permanent Effect, set to "critical failure", whose own rule makes Recall Knowledge one degree worse. The true and erroneous knowledge is a note on each row. |

## Rules

- **Skill roll-twice, recall variant (`compileSkillRollTwiceEffects`):**
  - It reads the success row with its Recall Knowledge sentence and the critical failure's "one degree of success worse".
  - The permanent Effect must have its RollTwice, a ChoiceSet of failure and critical-failure, and PF2e's AdjustDegreeOfSuccess gated on the critical-failure choice.
  - Lore maps to `lore-skill-check`.
  - Each failing row's proof selects its choice.
- **Runtime proof (`skill-roll-twice-effect` with `recallChoice`):** it returns the selection `{rollOption, value}`.
- **Plan:** Recall Knowledge notes for each row's time; the "varies" duration becomes per-row.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-60.test.js` is new. Its negative case is another critical failure (not read). Outcast's Curse's test still passes.

A whole-corpus compile (b520 → b521) changed only Sage's Curse.

## Evidence

[Live evidence](phase-rank-4-batch-60-live-results.json), case `rank4Batch60`, in the `pftest` world.

| Result | Effect | Roll option | Note |
| --- | --- | --- | --- |
| Success | 10 minutes | — | Recall Knowledge |
| Failure | unlimited | `sages-curse-result:failure` | Recall Knowledge |
| Critical failure | unlimited | `sages-curse-result:critical-failure` | Recall Knowledge |

**Cleanup:** fixtures removed.
