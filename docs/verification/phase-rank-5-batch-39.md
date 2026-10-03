# Rank 5 batch 39 — Blister

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Blister (5) | Fortitude: 1 blister on a success, 2 on a failure, 4 on a critical failure. Popping one (a card button) is a basic Fortitude save: 7d6 acid (+1d6 a rank) to the target and the creatures in a 15-foot cone from it. The spell ends with the last blister or after 1 minute. |

## Rules

- **Pop save (`src/compiler/pop-save.js` `extractPopSave`):**
  - It reads the save, the success row's five sentences (count, the pop action, the cone's damage, its direction, the ending), the failing rows' counts and the heightening.
  - The compile pre-step builds the target's plan (rows without effects) and the pop's basic-save plan (a 15-foot cone).
  - It sets `resolution.popSave`.
- **Validator:** in `inspectSavePlan` (the pop plan must itself be executable).
- **Runtime:**
  - Finalize posts the card with the count for the target's result.
  - `popSave` requires the target among the targeted tokens, takes one charge and starts the pop's saves.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-39.test.js` is new. Its negative cases are another count wording (not read) and a zero count (not executable).

A whole-corpus compile (b513 → b514) changed only Blister.

## Evidence

[Live evidence](phase-rank-5-batch-39-live-results.json), case `rank5Batch39`, in the `pftest` world, at 6th rank.

| Step | Result |
| --- | --- |
| The target fails | 2 blisters |
| First pop | 8d6 acid = 20: the target succeeds (10 lost), the other fails (20 lost) |
| Second pop, then a third | 0 left; "No blisters are left: the spell has ended." |

**Cleanup:** fixtures removed.
