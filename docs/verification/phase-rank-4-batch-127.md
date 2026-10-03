# Rank 4 batch 127 — Ephemeral Hazards

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Ephemeral Hazards (4) | The four 10-foot squares are placed (or given) as one lingering area for 1 minute. A creature entering one or starting its turn in one saves (Will), at most once per turn. **Damage:** the item's 4d6 mental (+1d6 per rank) by the rows. **Critical success:** temporarily immune for the spell's minute (no more saves). **Success:** half damage, plus an Effect with PF2e's degree adjustment on its Will saves against this spell, for the spell's time. A failure or critical failure then becomes a success, unless it rolls a critical success. **Failure / critical failure:** the hazards are difficult terrain for it, as each region's per-creature cost. **Notes:** the critical failure's "can't pass through a hazard's square", and the chosen damage type's believed resistances and weaknesses. |

## Rules

- **`src/compiler/hazard-squares.js`:** reads the Area paragraph, the six sentences and the four rows. It rewrites them as a lingering enter/turn-start save with plain rows.
  - **Declaration additions:** `areaCount`, `separateAreas`, `oncePerTurn`, `rowTerrain` and `successLock`.
- **`lingering-area-compiler`:** square areas are accepted. The corpus diff shows no other spell changed by it.
- **`compileSpell`:** the critical success's immunity for the spell's minutes; the `rowTerrain` evidence.
- **`basic-save-core`:** validates `successLock` and `oncePerTurn`.
- **`ongoing-families`:**
  - **`finalizeSave`:** a success gives the creature an `AdjustDegreeOfSuccess` Effect on its saves predicated on this spell's `item:slug`. The Effect ends with the record.
  - **`prepareSave`:** a once-per-turn area keys a creature's save by turn instead of by round. This also applies to the existing once-per-turn areas, whose text says "once per turn".

## Interpretation

- **"Treats the square as difficult terrain"** covers every hazard square for that creature.
- **"Continues to use this result unless it rolls a critical success"** means a later failure or critical failure becomes a success. It is PF2e's own adjustment on the roll, so a natural critical success stays.

## Tests

`test/rank-4-batch-127.test.js` is new. It covers the lingering declaration, the row terrain, the lock, the immunity, and an unproved lock (refused).

A whole-corpus compile (b666 → b667) changed only Ephemeral Hazards.

## Evidence

[Live evidence](phase-rank-4-batch-127-live-results.json), case `rank4Batch127`, in the `pftest` world, in combat.

| Step | Result |
| --- | --- |
| A enters a hazard, failure | 4d6 mental (14); one square costs it 10 feet |
| B enters, success | Half (8) and the lock Effect |
| B on the next turn (Will −20) | PF2e's roll comes out a success; half damage again |

**Cleanup:** fixtures, combat, the record and the regions removed.
