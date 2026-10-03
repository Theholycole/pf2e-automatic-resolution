# Rank 5 batch 76 — Shepherd of Souls

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Shepherd of Souls (5) | **The reaction**, used after the triggering damage. The caster picks a sacrifice (a dialog, or the `sacrifice` option): at most 15 (+5 per 2 ranks) and its own Hit Points. It loses that many Hit Points. **The target** regains twice that, back from Dying if it was. Reducing the damage by twice the sacrifice, with any excess healed, adds up to that same amount. |

## Rules

- **`src/compiler/sacrifice-heal.js`:** reads the sentences and the Heightened entry; `sacrificeMax` gives the cap at a rank.
- **Runtime:** new kind `sacrifice-heal`.

## Interpretation

- **QUESTION: after the damage.** The module can't stop damage before it lands, so the target regains the reduction afterward. The result is the same, except for an effect that triggers at 0 HP or on the damage itself (for example massive damage); the GM handles that.
- **"You lose Hit Points"** reduces the caster's HP directly (not damage: no resistances or temporary HP).

## Tests

`test/rank-5-batch-76.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b684 → b685) changed only Shepherd of Souls.

## Evidence

[Live evidence](phase-rank-5-batch-76-live-results.json), case `rank5Batch76`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A 16 HP sacrifice at 5th | Refused (at most 15) |
| 10 sacrificed on an ally at 50/100 | Caster 200 → 190; ally 70 |
| 20 sacrificed at 7th | Ally 100 (capped); caster 170 |
| 5 sacrificed on a Dying ally at 0 HP | 10 HP, no longer Dying |

**Cleanup:** fixtures removed.
