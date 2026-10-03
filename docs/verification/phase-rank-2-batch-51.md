# Rank 2 batch 51 — Glacial Causeway

2026-10-01. Follows the user's decision of 2026-10-01: terrain for only some creatures is the region for everyone, plus an exemption Effect.

| Spell | Now |
| --- | --- |
| Glacial Causeway (2) | The caster places the 120-foot line. Its region is difficult terrain (walking) for the minute. The caster gets an Effect saying the path isn't difficult terrain for them; the GM adjusts their movement. When the caster's turn ends with its token on the path, it gets Quickened until the end of its next turn, with a note that the extra action is only to Stride. |

## Rules

- **`causeway.js` (new note family):** the three sentences exactly. The line must be the item's area.
- **`ongoing-families.js`:** `startRegionArea` takes `casterTurnEnd`. At the end of the caster's turn, if its token is in the area, it gets an Effect granting the condition until the end of its next turn, once per turn.
- **Runtime:** the `causeway` executor (the region, its difficult terrain, and the exemption Effect).

## Tests

895/895 pass. `test/rank-2-batch-51.test.js` is new. It checks the plan, and that changed text isn't read.

A whole-corpus compile (b305 → b306) changed only Glacial Causeway.

## Coverage

**Census:** **1128 enabled**, up from 1127. Rank 2: 214 of 245.

## Evidence

[Live evidence](phase-rank-2-batch-51-live-results.json), case `rank2Batch51`, in the `pftest` world.
- The region had difficult terrain (walk ×2), and the caster had the exemption Effect.
- When the caster's turn ended on the path, it became Quickened (an Effect for 1 round, ending at turn end).
- Ending the spell removed the region.
