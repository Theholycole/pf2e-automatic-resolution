# Rank 3 batch 36 — Incendiary Ashes

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Incendiary Ashes (3) | A Fortitude save against 4d6 slashing (+2d6 a rank). A success takes half damage and gets PF2e's (Success) Effect: weakness to fire equal to the rank, until the start of the creature's next turn. A failure takes full damage and gets PF2e's (Failure) Effect for 1 minute; a critical failure is the same with double damage. Failure and critical failure also carry a GM row note: a creature killed by fire meanwhile is reduced to ashes, though its gear remains. |

## Rules

- **Weakness rows (`effect-modifier-proof.js`):** "The creature has weakness to fire 3 …" (value last) is read like "weakness 3 to fire". It is proved by `proveRowModifierClaim` at the spell's rank against an Effect whose only rules are that Weakness. The rank is stored on the proof and re-checked at application.
  - "until the start of its next turn" counts from the creature's own turn (target-turn, turn-start).
- **Damage rows (`compile-ability.js`):** "The creature takes half/full/double damage and has weakness …" offers the weakness clause as the row Effect's proof, when the row's damage multiplier is the one stated.
- **Reduced to ashes (`basic-save-core.js`, `residual-prose.js`):** "If the creature is killed by fire during this time it's reduced to ashes, though its gear remains." becomes a GM row note, allowed only beside the row's weakness Effect of that type. "As failure" rows keep it.

## Tests

1090 pass. `test/rank-3-batch-36.test.js` is new, with a negative case: a weakness value PF2e's Effect doesn't give isn't proved.

A whole-corpus compile (b419 → b420) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-36-live-results.json), case `rank3Batch36`, in the `pftest` world, at 4th.
- **Success:** 10 slashing, PF2e's (Success) Effect for 1 round, fire weakness 4.
- **Failure:** 20 slashing, PF2e's (Failure) Effect for 1 minute, fire weakness 4.
- The card shows the "reduced to ashes" note.
- **Cleanup:** fixtures removed.
