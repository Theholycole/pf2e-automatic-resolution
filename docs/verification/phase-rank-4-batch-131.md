# Rank 4 batch 131 — Dutiful Challenge

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Dutiful Challenge (4) | **The caster:** PF2e's Spell Effect: Dutiful Challenge at the cast rank. It marks the targeted enemy and gives −1 status (−2 from 7th, −3 from 10th) to attack rolls, damage rolls and skill checks against any other creature. **The enemy:** an Effect with the same penalty against all but the caster (PF2e's `target:signature`). **Exemption:** the card's control (with the other creature targeted) rolls the enemy's Will save against the spell DC when another creature's hostile action affects it. A success exempts that creature from the enemy's penalty. **Ending:** either the caster or the enemy at 0 HP ends both Effects; Dismiss is deleting them. |

## Rules

- **`src/compiler/challenge.js`:** reads the penalty sentence, the three exemption sentences and the Heightened entry. It proves PF2e's Effect: its TokenMark, and the penalty's selectors, predicate and value at every rank. `challengePenalty` gives the penalty at a rank.
- **Runtime:**
  - **New kind `challenge`:** the user's target is set first, so PF2e's mark takes it. Both Effects carry `challengeCast`.
  - **`challengeExempt`:** adds `{not: target:signature:…}` to the enemy's rule.
  - **`main.js`:** an `updateActor` hook ends both Effects when either holder reaches 0 HP.

## Interpretation

- **"Defeated"** is 0 Hit Points.
- **The enemy's penalty against all but the caster** is PF2e's target signature, so a roll without a target takes the penalty (as PF2e's own Effect does for the caster).

## Tests

`test/rank-4-batch-131.test.js` is new. It covers the data, the penalty by rank, and a different penalty (not proved against PF2e's Effect).

A whole-corpus compile (b670 → b671) changed only Dutiful Challenge.

## Evidence

[Live evidence](phase-rank-4-batch-131-live-results.json), case `rank4Batch131`, in the `pftest` world, cast at 7th rank.

| Step | Result |
| --- | --- |
| Cast | The caster's PF2e Effect (mark, level 7); the enemy's −2 against all but the caster |
| An ally's hostile action, Will success | The ally is exempted (a second signature in the predicate) |
| The enemy at 0 HP | Both Effects removed |

**Cleanup:** fixtures removed.
