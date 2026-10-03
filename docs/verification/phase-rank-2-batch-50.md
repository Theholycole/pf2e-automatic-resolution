# Rank 2 batch 50 — Faerie Fire

2026-10-01.

| Spell | Now |
| --- | --- |
| Faerie Fire (2) | Each creature in the 10-foot burst (targeted when cast) gets an Effect for 5 minutes. While it's visible it can't be Concealed: a Concealed condition it has is removed when cast, and one it gains later is removed. While it's Invisible, it's Concealed instead of Undetected. This works through the Effect's grant when cast, the module's Concealed when it becomes Invisible later, and the removal of that Concealed when it stops being Invisible. The colour is the note's. |

## Rules

- **`outline.js` (new note family):** the three sentences exactly, on an area spell with a fixed duration.
- **Runtime:**
  - The `outline` executor (the Effect, with a GrantItem of Concealed predicated on being Invisible).
  - `outlineOnCondition` removes a Concealed an outlined, visible creature gains.
  - `outlineOnInvisible` adds Concealed when an outlined creature becomes Invisible, and removes it when Invisible ends. The first run showed PF2e's grant doesn't follow its predicate later; this hook was added for that.

## Tests

894/894 pass. `test/rank-2-batch-50.test.js` is new. It checks the plan, and that changed text isn't read.

A whole-corpus compile (b304 → b305) changed only Faerie Fire.

## Coverage

**Census:** **1127 enabled**, up from 1126. Rank 2: 213 of 245.

## Evidence

[Live evidence](phase-rank-2-batch-50-live-results.json), case `rank2Batch50`, in the `pftest` world.
- **When cast:** the visible creature lost its Concealed, and the Invisible creature became Concealed.
- **Later:** a Concealed the visible creature gained was removed. When the other creature stopped being Invisible, its Concealed ended.
- **The Effect:** 5 minutes.
