# Rank 4 batch 108 — Vital Seed

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Vital Seed (4) | The card rolls PF2e's spell attack against the target's AC; a willing target (the caster asked) is hit automatically. On a hit, the drain is the item's basic Fortitude save (2d12 void, +1d12 per 2 ranks) for every other creature within 15 feet of the target, and the seed's Effect on the target carries Erupt. Erupt, once the saves are finalized, reads that save card and heals a living target twice the most damage any one creature took; an undead target takes that much vitality damage instead. |

## Rules

- **`src/compiler/seed-drain.js`:** reads the attack, the willing sentence, the drain, the eruption and the undead sentence, and the heightening, which must match the item's interval.
- **`compileSpell`:** compiles the drain as a basic save of the item's own damage entry, in a 15-foot emanation.
- **Runtime:** the new kind `seed-drain`; `seedErupt` reads the drain card's damage receipts.

## Interpretation

- **The creatures drained are found automatically.** They are every other creature whose token is within 15 feet of the target, using PF2e's token distance. This includes the caster if the caster is that close.
- **"The damage a single creature took" is the damage applied.** It is the amount after resistances and weaknesses, from each creature's damage receipt.
- **Erupt waits for the saves.** It is refused until the drain card is finalized. With no creature in range, Erupt does nothing.

## Tests

`test/rank-4-batch-108.test.js` is new. It covers the data, the drain plan's support, and a different multiplier (not read).

A whole-corpus compile (b647 → b648) changed only Vital Seed.

## Evidence

[Live evidence](phase-rank-4-batch-108-live-results.json), case `rank4Batch108`, in the `pftest` world, cast at 4th rank.

| Step | Result |
| --- | --- |
| A willing living ally | Drains only the creature beside it (2d12 void, failed save: 20); the ally recovers 40 HP; the seed Effect is removed |
| An undead host | Drains the creature beside it (10); the host takes 20 vitality damage |

**Cleanup:** fixtures removed.
