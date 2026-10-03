# Rank 3 batch 53 — Rend Magic

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Rend Magic (3) | A melee spell attack for 3d10 force damage (+2d10 per 2 ranks), double on a critical hit. A hit or critical hit adds a "Rent magic" note for 1 minute. Each time the GM reports the target Casting a Spell, it takes (ceil(rank/2) − 1)d10 force damage, doubled after a critical hit. The note says the spell ends if the target ends a turn without casting. |

## Rules

- **Cast punishment (`cast-punish.js` `rewriteCastPunish`):** it reads the attack sentence with its damage, the cast damage "@Damage[(ceil(@item.rank/2)-1)dX[type]] … each time it Casts a Spell for N minutes", the critical doubling, and the ending sentence.
  - The Heightened entry must give the item's own initial step and 1dX a step, every 2 ranks.
  - The result is written out as the attack's table. The hit rows' note carries `triggeredDamage` with the new `spell-cast` trigger (the critical row's formula doubled) and the dice at the cast rank in its text.
- **Runtime:** `isTriggeredDamage` accepts `spell-cast` as it accepts `auditory-or-cast`, and the Ongoing control is labelled "Cast a Spell".
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-53.test.js` is new. Its negative case is a cast-damage step other than 1d10.

A whole-corpus compile (b469 → b470) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-53-live-results.json), case `rank3Batch53`, in the `pftest` world, cast at 5th rank.

| Result | Initial damage | Note | Reported spell |
| --- | --- | --- | --- |
| Hit | 5d10 force = 26 | 2d10 | 2d10 force = 9 |
| Critical hit | double 29 = 58 | double 2d10 | 2 × 2d10 = 24 |

**Cleanup:** fixtures removed.
