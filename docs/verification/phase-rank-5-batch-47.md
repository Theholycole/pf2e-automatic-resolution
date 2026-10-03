# Rank 5 batch 47 — Sawtooth Terrain

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Sawtooth Terrain (5) | Reflex, as a lingering 20-foot burst of difficult terrain: creatures in it at the cast, or that end a turn in it, save. Success: half the slashing. Failure: the slashing (PF2e's entry, 3d6 +3d6 every 2 ranks) plus the text's persistent bleed (2d6 at 5th, +1d6 every 2 ranks), and a "Sawtooth wounds" note with PF2e's –10-foot circumstance penalty to land Speed. Critical failure: double both, and –15 feet. The Speed penalty lasts until the GM ends the note, after magical healing or a successful Administer First Aid against the spell DC. |

## Rules

- **Sawtooth rows (`src/compiler/sawtooth-rows.js`):**
  - It reads the lead (terrain; the text's slashing and bleed; the save), the four rows, and the heightening.
  - The preamble becomes the lingering trigger and the terrain. The rows carry PF2e's slashing plus the text's bleed formula, doubled on a critical failure.
  - The Speed penalties are notes with a `land-speed` FlatModifier, unlimited.
- **Interpretation:** "double damage" doubles the bleed too; the penalty ends when the GM ends the note. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-47.test.js` is new. Its negative case is another success row (not read).

A whole-corpus compile (b550 → b551) changed only Sawtooth Terrain.

## Evidence

[Live evidence](phase-rank-5-batch-47-live-results.json), case `rank5Batch47`, in the `pftest` world, at 7th rank (caster level 13, DC 30). The region had PF2e's difficult-terrain behavior.

| Result | Damage | Hit Points lost | Persistent | Land Speed |
| --- | --- | --- | --- | --- |
| Failure | 6d6 slashing | 19 | 3d6 bleed | –10, note unlimited |
| Critical failure | 6d6 slashing (double) | 24 | (2 × 3d6) bleed | –15 |

**Cleanup:** fixtures removed.
