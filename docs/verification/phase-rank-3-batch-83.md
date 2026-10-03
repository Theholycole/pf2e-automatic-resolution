# Rank 3 batch 83 — Impending Doom

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Impending Doom (3) | A Will save; the doom lasts 3 rounds. The save applies each result's immediate conditions for the spell's duration: Off-Guard on a failure; Off-Guard and Frightened 3 on a critical failure. Each later round's conditions arrive as that round of the spell begins, at the caster's turn. Success: Off-Guard in round 2, Frightened 1 in round 3. Failure: Frightened 2, then Stunned 1. Critical failure: Stunned 1, then Paralyzed. When the third round is over, 6d6 mental damage (2d6 more per rank) is rolled once and dealt at half, full or double, and the cast ends. A critical success is unaffected. |

## Rules

- **Doom timeline (`src/compiler/doom-timeline.js`):**
  - It reads the preamble: the conclusion in N rounds, the save sentence, and the end's damage, which must match PF2e's damage part.
  - It reads the heightened step.
  - It reads each result row: an immediate part, "On the second/third round, it (also) becomes …" steps, and "At the end of the third round, it takes half/full/double damage."
  - Conditions are resolved through the table's own links, so plain "off-guard" and "stunned 1" get the linked UUIDs.
  - The rows are rewritten to their immediate conditions, and the damage part is moved into `resolution.timeline`.
- **Core:** `isDoomTimeline` checks the rounds against the duration, the dice and their per-rank step, and each step's round order and conditions.
- **Save runtime:** the cast's Ongoing record carries the timeline for each target whose degree has one: the cast's world time and initiative, the dice at the cast rank, and the steps.
- **Ongoing:** the native reconcile runs `reconcileTimeline` before deciding whether the cast is over. A cast with no Effects yet isn't ended while its timeline runs.
  - Round r begins at the cast's time plus 6×(r−1) seconds, once the turn order reaches the caster's initiative.
  - A step's conditions become Effects granting each condition for the cast. Frightened decays at the end of the creature's turns and Stunned gets the action-loss reminder, as the save rows' conditions do.
  - Each step is recorded before it's applied, so it applies at most once.
  - When the last round is over, the damage is rolled once, split per target (half rounded down), dealt with IWR, and the cast is ended.

## Tests

`test/rank-3-batch-83.test.js` is new. `test/cantrip-rank-1-batch-1.test.js` and `-batch-6` now use a variant of Impending Doom with a wording the timeline doesn't read, as their example of unaccounted text. The new test covers:

- the immediate conditions;
- the steps and multipliers;
- the damage;
- a tampered round (rejected);
- a step past the duration (not read);
- another damage wording (not read).

A whole-corpus compile (b597 → b598) changed only Impending Doom.

## Evidence

[Live evidence](phase-rank-3-batch-83-live-results.json), case `rank3Batch83`, in the `pftest` world, in combat, at 3rd rank (caster level 5) and 4th (caster level 7). The three creatures took a success, a failure and a critical failure.

| When | Success | Failure | Critical failure |
| --- | --- | --- | --- |
| Cast | – | Off-Guard | Off-Guard, Frightened 3 |
| Round 2, caster's turn | Off-Guard | Off-Guard, Frightened 2 | Off-Guard, Frightened 2, Stunned 1 |
| Round 3 | Off-Guard, Frightened 1 | Off-Guard, Frightened 1, Stunned 1 | Off-Guard, Frightened 1, Stunned 1, Paralyzed |
| Round 4 | 11 (half of 23) | 23 | 46 |

- **At 3rd rank:** the round-4 damage is from 6d6 rolling 23; every Effect is gone and the cast is ended.
- **At 4th rank:** 8d6 rolled 26, giving 13, 26 and 52.

**Cleanup:** fixtures and combats removed.
