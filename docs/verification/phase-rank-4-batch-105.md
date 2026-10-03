# Rank 4 batch 105 — Reflective Scales

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Reflective Scales (4) | The caster picks the type. Its Effect gives resistance 5 (+5 per 2 ranks) and counts the damage it prevents: for each damage, that type's total, up to the resistance (main.js's damage wrapper). The card's Explode posts a basic Reflex save of 1d6 per 10 prevented (to 10d6, +5d6 per 2 ranks), of the type, for the targeted creatures within 20 feet, and ends the spell. |

## Rules

- **`src/compiler/stored-burst.js`:** `compileStoredBurst` reads the choose, resistance, store, explode, save and end sentences and the heightening. `storedBurstAt` gives the resistance and the dice cap at a rank.
- **`compileSpell`:** compiles the burst as a basic save of an emanation (an item damage entry), kept with the plan.
- **Runtime:**
  - The new kind `stored-burst`: the Effect with the Resistance rule, plus a card carrying the burst plan.
  - `storedBurstPrevented` counts from PF2e's `applyDamage` wrapper.
  - `storedBurstExplode` gives the burst plan the stored dice as its formula and starts it on the targeted creatures, then deletes the Effect.

## Interpretation

- **"Damage prevented" is the type's damage in each hit, up to the resistance.** PF2e applies resistance per damage type.
- **The explosion's targets are the creatures the caster targets in the emanation.**

## Tests

`test/rank-4-batch-105.test.js` is new. It covers the data, the burst plan's support, the values at 6th, and a different heightening (not read).

A whole-corpus compile (b644 → b645) changed only Reflective Scales.

## Evidence

[Live evidence](phase-rank-4-batch-105-live-results.json), case `rank4Batch105`, in the `pftest` world, cast at 4th rank.

| Step | Result |
| --- | --- |
| The cast (fire) | Resistance 5, cap 10d6 |
| Four 20-fire hits | 15 lost each; 20 prevented |
| A cold hit | 10 lost; nothing prevented |
| Explode at a foe | A basic save of 2d6 fire; the Effect ended |

**Cleanup:** fixtures removed.
