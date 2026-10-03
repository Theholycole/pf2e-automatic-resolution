# Rank 5 batch 20 — Inevitable Disaster

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Inevitable Disaster (5) | One target takes 55 damage (+10 per rank) with a basic Fortitude save. A card reminder says the GM rolls 1d4 rounds secretly and resolves the card when the accident happens, wherever the target is. The GM picks the accident's damage type on the card. |

## Rules

- **Delayed accident (`compile-ability.js` `compileDelayedAccident`):** it reads three sentences:
  - "Some kind of strange accident occurs [[/gmr XdY #rounds]]{XdY rounds} later, dealing N damage to the creature, with a basic X save.", where N is the item's one untyped entry;
  - "This happens regardless of where the target is located …";
  - the GM's paragraph on timing and type.

  The result is a save-timing reminder plus a damage-type choice on the card for the item's untyped damage (the existing `casterChoice`).
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-20.test.js` is new. Its negative case is a damage amount other than the item's.

A whole-corpus compile (b452 → b453) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-20-live-results.json), case `rank5Batch20`, in the `pftest` world, cast at 6th rank.
- The card shows the secret-delay reminder and the damage-type choice.
- The GM picked bludgeoning. On a failure the target took 65 bludgeoning.
- **Cleanup:** fixtures removed.
