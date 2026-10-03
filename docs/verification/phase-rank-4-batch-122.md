# Rank 4 batch 122 — Phoenix Ward

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Phoenix Ward (4) | The caster's Effect gives resistance 10 to fire for 1 minute. **Trigger:** fire damage drops the caster to 0 Hit Points (checked by the `applyDamage` wrapper after PF2e's damage). **Then:** the module leaves the caster at 1 Hit Point, out of Dying and Unconscious. The caster regains the item's 4d8 (+1d8 per rank) plus the absorbed damage: the damage after IWR beyond what would leave 1 Hit Point. The ward ends, and a 24-hour Effect refuses a new casting. |

## Rules

- **`src/compiler/death-ward.js`:** reads the five sentences and the Heightened entry (the item's healing entry and its own step). `deathWardHealing` gives the dice at a rank.
- **Runtime:**
  - **New kind `death-ward`:** the cast is refused during the lockout.
  - **`deathWardTrigger`:** the absorbed damage is each instance after the creature's immunities, weaknesses and best resistance (the ward's included). It then sets 1 HP, clears Dying and Unconscious, heals, ends the ward and adds the lockout.

## Interpretation

- **"Damage that would reduce you to 0"** is checked after PF2e applies it: the caster is at 0 and the damage had fire in it. Temporary Hit Points it used aren't counted in the absorbed damage.
- **The healing has the healing and vitality traits.**

## Tests

`test/rank-4-batch-122.test.js` is new. It covers the data, the healing by rank, and a different lockout (not read).

A whole-corpus compile (b661 → b662) changed only Phoenix Ward.

## Evidence

[Live evidence](phase-rank-4-batch-122-live-results.json), case `rank4Batch122`, in the `pftest` world, cast at 5th rank.

| Step | Result |
| --- | --- |
| Cast | Resistance 10 to fire, healing 5d8 |
| 50 fire at 30 HP | 40 after the resistance, 11 absorbed: 1 + 5d8 + 11 = 40 HP; not Dying; the ward is gone; 24-hour lockout |
| Cast again | Refused |

**Cleanup:** fixtures removed.
