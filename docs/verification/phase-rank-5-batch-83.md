# Rank 5 batch 83 — Soulshelter Vessel

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Soulshelter Vessel (5) | **The stone's Bulk** is the caster's (a dialog, or the `bulk` option): 1 to 2, +1 per 2 ranks. It sets the pool at 40 HP per Bulk. **The creature's Effect** holds the pool for 10 minutes. **The cast** transfers 10 HP (+5 per 2 ranks) from the pool; **the card's action** repeats that. An empty pool breaks the stone and ends the Effect. **At 0 HP**, damage that would drop the creature there leaves it at the rescue amount instead (20, +10 per 2 ranks, or what's left in the pool), with no Dying or Wounded from the drop; the stone breaks. The 500-foot limit is a GM line. |

## Rules

- **`src/compiler/soul-vessel.js`:** reads every sentence and the Heightened entry; `soulVesselAt` gives the most Bulk, the transfer and the rescue.
- **`applyDamage` wrapper:** `soulRescue`.
- **Runtime:** new kind `soul-vessel`; `soulTransfer` (API and card button).

## Interpretation

- **"Would be reduced to 0"** is handled after the damage: the HP is set to the rescue amount and the Dying it caused removed.

## Tests

`test/rank-5-batch-83.test.js` is new. It covers the data, the values by rank and an unrecognised clause (not read).

A whole-corpus compile (b691 → b692) changed only Soulshelter Vessel.

## Evidence

[Live evidence](phase-rank-5-batch-83-live-results.json), case `rank5Batch83`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A 3-Bulk stone at 5th | Refused (1 to 2) |
| A 1-Bulk stone on an ally at 50/100 | +10 (60); pool 30 |
| Three transfers | Transferred, transferred, broken; 90 HP; the Effect gone |
| 7th, a 2-Bulk stone on another at 40 | +15 (55); pool 65 |
| 200 damage | 30 HP, not Dying or Wounded; the stone broken |

**Cleanup:** fixtures removed.
