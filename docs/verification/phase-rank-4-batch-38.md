# Rank 4 batch 38 — Hot Air

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Hot Air (4) | One target takes 4d6 fire damage (+1d6 per rank) with a basic Fortitude save. On a failure or critical failure, a "Burns when it speaks" note lasts for the sustained spell (1 minute). Its Ongoing control deals the spell's rank in fire damage each time the GM reports an auditory action or a non-subtle spell. |

## Rules

- **Speech rider (`compile-ability.js` `compileSpeechRider`):** the rider sentence is "On a failed save, the target also burns whenever they speak, causing them to take @Damage[@item.rank[fire]] damage whenever they use an action with the auditory trait or Cast a Spell, unless their spell is subtle." It is read only when:
  - the spell is a basic save on one creature;
  - before the rider, only narration and the damage sentence appear, and nothing comes after it;
  - the Heightened entry equals the item's step and the +1 of the rank formula.

  The failing rows get a note with the existing `auditory-or-cast` triggered damage, and its `{amount}` is the cast rank.
- **Sustained basic save:** a basic save carrying this rider counts as a sustained-condition plan (`isSustainedConditionPlan`).
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-38.test.js` is new. Its negative case is a Heightened step other than the item's.

A whole-corpus compile (b449 → b450) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-38-live-results.json), case `rank4Batch38`, in the `pftest` world, cast at 5th rank.

| Target | Result | Damage taken | Speech note |
| --- | --- | --- | --- |
| A | success | 10 (half) | none |
| B | failure | 21 (5d6 fire) | "takes 5 fire damage", 1 minute |

When the GM reported an auditory action for target B, the control rolled 5 fire and it lost 5.

**Cleanup:** fixtures removed.
