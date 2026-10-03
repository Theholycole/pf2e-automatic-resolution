# Rank 2 batch 60 — Expeditious Excavation

2026-10-01. Follows the earlier Grease pattern (a degree save of the creatures the caster targets, with "save or skill" as a reminder). It needed no new user decision.

| Spell | Now |
| --- | --- |
| Expeditious Excavation (2) | A degree save (Reflex) for the creatures the caster targets on the dirt. Only Medium or smaller creatures are eligible below 8th; a Large one is eligible from 8th, when the four cubes beneath it are possible. A failure is Prone. A critical failure is Prone plus the fall from the 5-foot pit: 2 bludgeoning, which is half the distance (PF2e's falling damage). |

The card reminds the GM of three things:
- A creature may use Acrobatics instead (set its result on the card).
- Where a creature ends up.
- That a deeper pit of stacked cubes adds half the extra distance, and a Large creature saves only over four excavated cubes.

## Rules

- **`pit-excavation.js` (new pre-pass):** the "Area (continued)" line, the two sentences, the three rows, and the Heightened (+2) entry, all exactly.
  - It becomes a degree table with Prone, and the fall on a critical failure.
- **Target predicate `size-at-most`:** it may now carry `byRank` (like `level-at-most`). The save runtime passes the cast rank for it, and the plan validator and core check its shape.

## Tests

911/911 pass. `test/rank-2-batch-60.test.js` is new. It checks:
- the rows and the fall, and the Large creature refused at 2nd and allowed at 8th;
- that another size, fall or cube count isn't read.

A whole-corpus compile (b315 → b316) changed only Expeditious Excavation.

## Coverage

**Census:** **1137 enabled**, up from 1136. Rank 2: 223 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-60-live-results.json), case `rank2Batch60`, in the `pftest` world.
- **At 2nd:**
  - The Medium and Small creatures were eligible; the Large one wasn't.
  - The Medium creature failed: Prone, no damage.
  - The Small creature critically failed: Prone, and 500 → 498 HP.
- **At 8th:** the Large creature was eligible.
- **Cleanup:** fixtures removed.

## Limit

The fall is from one cube's depth (5 feet). When the caster stacks cubes at higher ranks, the GM adds the extra distance, as the card says.
