# Rank 3 batch 37 — Defensive Prescience

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Defensive Prescience (3) | The triggering creature's Will save. Success: unaffected. Failure: a note Effect makes it roll its attack roll twice and keep the worse (PF2e's RollTwice, removed after the roll). If the GM reports that attack was a critical failure, it takes 3d10 force (+1d10 a rank) and the note ends. Critical failure: the same, but a failure or worse triggers the damage. |

## Rules

- **Attack-result damage (`compile-ability.js`, `basic-save-core.js` `isTriggeredDamage`):** the two rows "The creature must roll twice and use the worse result on its attack roll; if its attack is a (critical failure|failure), the target takes NdM type damage." are read.
  - Each row gets a note Effect with RollTwice (`attack-roll`, keep lower, `removeAfterRoll`). `validRowNoteRule` now allows this attack-roll-only form.
  - The trigger is `attack-result` with the results that set it off. The damage is once and ends the note.
  - The item's damage entry and its heightening must match.
- **The control (`ongoing-runtime.js`, `stored-trigger-runtime.js`):** the Ongoing control reads "…'s attack was a critical failure"; the damage message names the result.
- **Interpretation:** logged in `pending-user-decisions.md`: "a failure" on the critical failure row includes a critical failure.

## Tests

1091 pass. `test/rank-3-batch-37.test.js` is new, with a negative case: swapped results aren't read.

A whole-corpus compile (b420 → b421) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-37-live-results.json), case `rank3Batch37`, in the `pftest` world, at 4th.
- **Notes:** both attackers got the note with `attack-roll lower true`. Their triggers are `criticalFailure` and `failure/criticalFailure`.
- **Damage:** reporting the first attacker's critical failure dealt 4d10 force (31) and ended its note.
- **Cleanup:** fixtures removed.
