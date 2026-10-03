# Rank 2 batch 29 — an acid puddle left by a hit

2026-10-01. Follows the user's decision of 2026-10-01: area damage on entering or starting a turn is automated where Foundry detects it.

| Spell | Now |
| --- | --- |
| Disintegrating Puddle (2) | A ranged spell attack: 2d12 acid (+2d12 per 2 ranks), doubled on a critical hit. On a hit, the module draws the acid puddle over the target's space and the squares adjacent to it, for 1 minute. A creature entering it or starting its turn in it takes `floor(rank/2)d4` acid with no save, applied with PF2e's IWR. |

## Rules

- **`puddle-attack.js` (new pre-pass):** Disintegrating Puddle's sentences exactly. It produces an ordinary spell attack and the existing `groundHazard`, which another spell already uses for "the ground catches fire":
  - `where: "target-and-adjacent"` (new: the region is one square larger on each side);
  - on the hit rows;
  - `enter` and `turn-start` triggers;
  - the formula `(floor(@item.rank/2))d4`, accepted by the core. The runtime's `hazardFormula` evaluates the floor at the cast rank.
- The Heightened entry must be the item's initial step and the puddle formula's own step.

## Tests

859/859 pass. `test/rank-2-batch-29.test.js` is new. It checks the plan's hazard, refuses a forged `where`, and checks the formula at ranks 4 and 5.

A whole-corpus compile (b282 → b283) changed only Disintegrating Puddle.

## Coverage

**Census:** **1083 enabled**, up from 1082. Rank 2: 171 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-29-live-results.json), case `rank2Batch29`, in the `pftest` world, at 4th, in combat.
- **The hit:** 4d12 acid (28 lost).
- **The puddle:** a 3×3-square region centred on the target.
- **The target's turn start:** "2d4 acid" (3 lost).
- **The walker entering:** "2d4 acid" (5 lost).
- **Ending the record** removed the puddle. Fixtures, the combat and regions were cleaned up.
