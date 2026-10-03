# Rank 3 batch 84 — Coral Scourge

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Coral Scourge (3) | A Reflex save; the spell lasts 1 minute. Success: Clumsy 1 until the target Interacts. Failure: Clumsy 2, which grows by 1 as each of the target's turns begins, to 4. At 4 the target is also Paralyzed until the spell ends. The target's Interact ends the spell. Critical failure: the same growth, but each Interact lowers Clumsy by 1. At 0 the spell goes on with no Clumsy, and the next turn's growth starts again at 1. |

## Rules

- **Growing condition (`src/compiler/condition-growth.js`):**
  - It reads the four rows: the Interact that ends the spell; the growth by a step to a maximum at each turn start; the further condition granted at that maximum; and the critical failure's lowering Interact.
  - The rows are rewritten to their condition with the standard Interact ending.
  - `growth` goes on the failing rows' condition: the timing, step and maximum; the further condition at the maximum; and whether the Interact ends or lowers it.
  - All of the sentences must name the same condition, and the growth's maximum must equal the one that grants the further condition.
- **Core:** `isConditionGrowth` checks the growth: the timing; a step of 1 or more; a maximum of 2–4 that's at least the starting value; an Interact that ends or lowers it; and the further condition's link.
- **Runtime:**
  - The save carries `growth` onto the condition's Effect.
  - Ongoing's `reconcileConditionGrowth` (`scripts/condition-growth.js`):
    - As the creature's turn begins, it raises the Effect's granted condition by the step: the rule's badge value and the condition, once per turn boundary.
    - At the maximum, it grants the further condition through its own Effect, which lasts the cast.
    - It records the turn it has seen.
  - **The Interact control:**
    - An ending Interact deletes the Effect and ends the cast, with any further condition.
    - A lowering Interact reduces the value by 1. At 0 the grant is unlinked and the condition removed, while the Effect and the cast stay. The next growth grants the condition again at 1.

## Interpretations

- "becomes Paralyzed" when Clumsy reaches 4 lasts until the spell ends; lowering Clumsy doesn't remove it.
- The success's Interact ends the spell by ending its only Effect.

## Tests

`test/rank-3-batch-84.test.js` is new. It covers the three rows' conditions and their Interacts, the growth, a tampered maximum (rejected), a growth without a maximum (not read), and a maximum the paralysis doesn't share (not read).

A whole-corpus compile (b598 → b599) changed only Coral Scourge.

## Evidence

[Live evidence](phase-rank-3-batch-84-live-results.json), case `rank3Batch84`, in the `pftest` world, in combat, at 3rd rank. There were three casts, one per creature.

| Step | Result |
| --- | --- |
| The casts | Failure Clumsy 2, critical failure Clumsy 2, success Clumsy 1 |
| Eight turns | Each failing creature's Clumsy rose by 1 at the start of its own turn, to 3 and then to 4 with Paralyzed |
| The critical failure's four Interacts | 3, 2, 1, 0; Paralyzed stays and the cast stays active |
| Its next turn | Clumsy 1 again |
| The failure's Interact | Clumsy and Paralyzed gone; the cast ended |
| The success's Interact | Clumsy gone; the cast ended |

**Cleanup:** fixtures and combat removed.
