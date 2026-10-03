# Rank 4 batch 115 — Bottle the Storm

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Bottle the Storm (4) | The reaction gives the caster an Effect lasting 1 minute, with electricity resistance 10 (15 from 7th, 20 from 10th). The resistance covers the triggering effect only: the module counts the damage it prevented, then drops the resistance. **Release:** the card's control is a spell attack against a targeted creature's AC within 60 feet. It deals electricity damage equal to the stored amount, doubled on a critical hit, and the Effect ends. **Recasting:** a new casting dissipates the earlier charge. From 7th the card says the attack can be part of the reaction. |

## Rules

- **`src/compiler/stored-burst.js` `compileStoredCharge`:** reads the trigger, the resistance, the release, the damage and the dissipation sentences, and the fixed-rank entries. `storedChargeResistance` gives the resistance at a rank.
- **Runtime:** the new kind `stored-charge`.
  - **The Effect:** a storedBurst with `charge` and `oneShot`. The existing prevented-damage counter (the `applyDamage` wrapper, after PF2e's IWR) counts it once, then clears the rules.
  - **Release:** `storedChargeRelease` rolls the spell attack and applies the damage.

## Interpretation

- **"Against the triggering effect" is the first electricity damage after the cast.** The caster casts the reaction before applying that damage.
- **The prevented amount is the smaller of the resistance and that damage of the type.** This is the same counting as Reflective Scales.
- **The immediate attack from 7th is the same Release, made at once.** The card says so.

## Tests

`test/rank-4-batch-115.test.js` is new. It covers the data, the resistance by rank (10/10/15/15/20), and a different trigger type (not read).

A whole-corpus compile (b654 → b655) changed only Bottle the Storm.

## Evidence

[Live evidence](phase-rank-4-batch-115-live-results.json), case `rank4Batch115`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 7th | Resistance 15 |
| 30 electricity | 15 taken, 15 stored, the resistance removed |
| A further 10 electricity | All 10 taken, still 15 stored |
| Release (critical hit) | The foe takes 30; the Effect is gone |
| Cast at 4th | Resistance 10 |

**Cleanup:** fixtures removed.
