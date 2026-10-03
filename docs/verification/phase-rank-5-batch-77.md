# Rank 5 batch 77 — Spiritual Guardian

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Spiritual Guardian (5) | **The guardian** is a token with 50 Hit Points (+20 per 2 ranks), placed within 120 feet of the caster. The caster's sustained Effect removes it when it ends. **The card's Attack** has three buttons, one per multiple attack penalty: the caster's melee spell attack against a creature adjacent to the guardian, dealing 3d8 (+1d8 per 2 ranks) damage of the type picked (a weapon's physical type, or spirit), doubled on a critical hit. It ends any protection. **The card's Protect** marks a targeted creature: when it takes damage while the guardian is adjacent, up to 10 of that damage comes back to it and off the guardian's Hit Points instead. If that reaches 0 the guardian is destroyed and the spell ends. |

## Rules

- **`src/compiler/guardian.js`:** reads every sentence, the two commands and the Heightened entry; `guardianAt` gives the Hit Points and dice at a rank.
- **`applyDamage` wrapper:** `guardianAbsorb` runs after damage to a protected creature (HP first, then temporary HP back). A drop to 0 that the guardian prevented isn't Dying or Wounded.
- **Runtime:** new kind `guardian`; `guardianAct` (API and card buttons).

## Interpretation

- **The damage type:** the GM's call (the weapon's type or spirit) is a pick on the card.
- **The guardian's movement** is the GM's (drag its token); one command per Cast or Sustain is the GM's to keep.
- **The guardian has no other statistics**: it loses Hit Points only through the protection.

## Tests

`test/rank-5-batch-77.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b685 → b686) changed only Spiritual Guardian.

## Evidence

[Live evidence](phase-rank-5-batch-77-live-results.json), case `rank5Batch77`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 5th | The guardian, 50 HP |
| Attack (slashing) an adjacent foe (AC 5) | Critical hit, 22 damage |
| Protect an ally; it takes 25 beside the guardian | Ally −15; guardian 40 |
| 4 more | Ally −0; guardian 36 |
| The ally moves away; 10 | Ally −10 |
| Attack again | The protection ends |
| The caster's Effect deleted | The guardian's token gone |
| Cast at 7th | 70 HP, 4d8 |

**Cleanup:** fixtures removed.
