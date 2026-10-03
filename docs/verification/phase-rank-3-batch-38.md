# Rank 3 batch 38 — Envenom Companion

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Envenom Companion (3) | PF2e's Spell Effect: Envenom Companion on the companion or eidolon: 1d8 poison on its first unarmed hit each round (2d8 at 6th, 3d8 at 9th), behind PF2e's toggle, with a data note. The cast posts a card with a button: target the creature the poison damaged, and it rolls a Fortitude save. A failure makes it Clumsy 1 for 1 round (2 at 6th, 3 at 9th). A familiar can't be targeted. |

## Rules

- **Damage-triggered saves (`granted-save-action.js` `extractDamagedSave`, `compile-ability.js`):** "A creature that is damaged by this <type> must attempt a <save> save. On a failure, it's also <condition N> for N rounds." on a non-basic-save spell with a PF2e Effect.
  - The Effect is compiled without the item's save, and the save becomes a granted action with a plan per rank. "the <condition> value imposed on a failed save increases by N" in the Heightened entry gives the steps.
  - "This spell can't target familiars." becomes a `not-familiar` predicate, refused when the Effect is applied.
- **First-hit Effects (`unscoped-effect-trigger-compiler.js`, `direct-effect-resolution-compiler.js`):** "The first time each round the target hits a creature with an unarmed Strike that deals piercing or slashing damage, that Strike deals an additional NdM type damage." is the companion's Effect. PF2e's DamageDice (behind its `first-hit` toggle) must give that die and type, and that number at the rank (its `match/when` brackets read).
- **Per-rank buttons (`effect-runtime.js` `grantedAction`):** the cast rank picks the plan.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

1095 pass. `test/rank-3-batch-38.test.js` is new, with a negative case: another condition (Drained) isn't read as the button.

A whole-corpus compile (b425 → b426) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-38-live-results.json), case `rank3Batch38`, in the `pftest` world, at 6th.
- The companion got PF2e's Effect (level 6), and the card has the button.
- The damaged creature's save, set to a failure, gave Clumsy 2 for 1 round.
- A familiar was refused: "can't target familiars".
- **Cleanup:** fixtures removed.
