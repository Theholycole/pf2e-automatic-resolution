# Rank 9 batch 6 — Massacre

2026-10-04.

| Spell | Now |
| --- | --- |
| Massacre | A 60-foot line. Each living creature of 17th level or lower (19th at 10th rank) attempts a Fortitude save; others are left out. Success: 9d6 void (10d6 at 10th, PF2e's). Failure: 100 void (115 at 10th). Critical failure: dies. A creature the damage brings to 0 Hit Points dies. If the card kills no creature, the backlash: 30 void to every living creature on the card (the level-excluded ones too) and 30 void to the caster. |

Interpretations: "every living creature in the line" for the backlash is the card's targets that are living (the GM targets the line), including those above the level limit.

Runtime: a save card can end with a backlash when no target died.

## Tests

`test/rank-9-batch-6.test.js` is new. A whole-corpus compile (b762 → b763) changed only Massacre.

## Evidence

[Live evidence](phase-rank-9-batch-6-live-results.json), case `rank9Batch6`, in the `pftest` world.

| Step | Result |
| --- | --- |
| No kill: failure, success, a 19th-level creature | 100 + 30, 9d6 + 30 (58), left out + 30; the caster 30 |
| A 40-HP creature fails | Dead at 0; no backlash (the caster unharmed) |

**Cleanup:** fixtures removed.
