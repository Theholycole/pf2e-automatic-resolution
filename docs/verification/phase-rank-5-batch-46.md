# Rank 5 batch 46 — Slither

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Slither (5) | Reflex, as a lingering 20-foot burst the caster can Dismiss: creatures in it at the cast, or that end a turn in it, save. Even a creature that's already held saves again. Success: unaffected. Failure: 3d6 piercing, persistent poison (1d6, +1d6 every 2 ranks), and Grabbed until it Escapes at the spell DC. Critical failure: double both, and Restrained until it Escapes. A card reminder covers releasing a creature by attacking a snake (AC = spell DC; destroyed by 12 damage at once, +6 every 2 ranks; snakes regrow). |

## Rules

- **Grasping snakes (`src/compiler/grasping-snakes.js`):**
  - It reads the lead (the text's damage, the two conditions, the save, the end-of-turn trigger, Dismiss), the three rows and the heightening step.
  - PF2e's two damage entries must be the text's. The rows then carry the text's formulas directly: persistent `(floor((@item.rank - 3)/2))d6`, doubled with the rest on a critical failure.
  - The preamble becomes the lingering-area trigger. The holds become "until it Escapes".
- **Interpretation:** "double damage" doubles the persistent poison too; attacking a snake is the GM's. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-46.test.js` is new. Its negative case is a structured damage entry that differs from the text (not replaced).

A whole-corpus compile (b549 → b550) changed only Slither.

## Evidence

[Live evidence](phase-rank-5-batch-46-live-results.json), case `rank5Batch46`, in the `pftest` world, at 7th rank (caster level 13, DC 30), in an empty corner of the scene.

| Result | Hit Points lost | Persistent | Condition |
| --- | --- | --- | --- |
| Failure | 13 | 2d6 poison | Grabbed (until it Escapes) |
| Critical failure | 12 (double) | (2 × 2d6) poison | Restrained |

The grabbed creature's Escape at 40 was graded against DC 30: escaped.

**Cleanup:** fixtures removed.
