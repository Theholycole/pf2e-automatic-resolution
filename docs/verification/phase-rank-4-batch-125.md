# Rank 4 batch 125 — Bridge of Vines

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Bridge of Vines (4) | The GM draws the bridge (a 60-foot line, 10 feet wide, from the caster) as a region and selects it. It becomes an Ongoing lingering area for 10 minutes, and the caster can Dismiss it. **Who saves:** creatures other than the caster and its allies, on entering it; the GM reviews the exposure, as for other lingering areas. **Results:** a success or worse makes the bridge difficult terrain for that creature, as the region's own per-creature movement cost. A failure also knocks it Prone. A critical failure adds Grabbed until it Escapes, ending with the spell. **The bridge's statistics** (AC = spell DC, Hardness 10, 20 HP +10 per rank) are a GM note. |

## Rules

- **`src/compiler/bridge-rows.js`:** reads the seven sentences, the four rows and the Heightened entry. It rewrites them as a lingering enter save with plain rows; the area is a line for the compiler.
  - **Declaration additions:** `enemiesOnly`, `excludeCaster`, `drawnArea`, `dismissible`, and `rowTerrain` (the terrain rows, until the spell ends).
  - **The target check:** gets the enemy predicate.
- **`basic-save-core`:** validates `drawnArea` and `rowTerrain` (degrees, `spell` or `next-turn-start`, and the sentence the compiler read).
- **`ongoing-families`:**
  - **Region:** `startLingering` takes the selected region for a drawn area.
  - **Terrain:** `finalizeSave` adds the row terrain per creature (`addRowTerrain`: a `modifyMovementCost` behavior with `selectiveTerrain` on each of the record's regions).
  - **Clearing:** `clearRowTerrain` is called at the creature's turn start, for the `next-turn-start` form.

## Interpretation

- **"Any other creatures"** are the caster's non-allies. Neutral creatures are the GM's review, as for any enemies-only area.
- **"Attempt to use the bridge"** is entering the region.

## Tests

`test/rank-4-batch-125.test.js` is new. It covers the lingering declaration, its row terrain, the critical failure's conditions, and unproved row terrain (refused).

A whole-corpus compile (b664 → b665) changed only Bridge of Vines.

## Evidence

[Live evidence](phase-rank-4-batch-125-live-results.json), case `rank4Batch125`, in the `pftest` world.

| Step | Result |
| --- | --- |
| An ally walks onto the bridge | Not exposed |
| An enemy enters, failure | Prone; walking 10 feet along the bridge costs it 20 |
| The ally walking the same distance | Costs 10 |

**Cleanup:** fixtures, the record and the region removed.
