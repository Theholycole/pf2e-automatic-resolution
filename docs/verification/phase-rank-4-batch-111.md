# Rank 4 batch 111 — Crystallized Vapors

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Crystallized Vapors (4) | The ball of ice is PF2e's ranged spell attack, dealing the item's two entries: 1d12 cold and 1d12 bludgeoning, +1d12 of each per 3 ranks. It is made when cast, and again from the card on the first Sustain of each later turn. The first attack also makes the 15-foot emanation around the caster. It is a region that moves with the caster's token for the spell's minute. It is difficult terrain for every other creature, and the caster is exempt. |

## Rules

- **`src/compiler/sustain-attack.js` `vaporAttack`:**
  - Reads the terrain, launch and hit sentences.
  - The hit must match the item's two entries and their heightening.
  - The emanation must be the item's area.
- **`compileSpell`:** the attack plan without the area, plus `terrainAura` with its evidence.
- **`basic-save-core`:** the `terrain-aura` check (a sustained spell attack, its radius and sentence).
- **Runtime:** `#ensureTerrainAura` runs with the first attack.
  - **The region:** a circle following the caster's token, with the selective terrain (difficulty 2 for everyone, 1 for the caster). It is an Ongoing region area for the spell's duration.
  - **Only one emanation per caster:** a later attack finds the existing region.

## Interpretation

- **The emanation is made with the first attack.** That attack is the cast's own: PF2e's card for this spell is the attack.
- **"You're immune to this difficult terrain"** gives the caster's token the normal cost there.

## Tests

`test/rank-4-batch-111.test.js` is new. It covers the attack plan, its support and the sustain window. It also checks the emanation data, a malformed emanation (refused), and different damage (not read).

A whole-corpus compile (b650 → b651) changed only Crystallized Vapors.

## Evidence

[Live evidence](phase-rank-4-batch-111-live-results.json), case `rank4Batch111`, in the `pftest` world, cast at 7th rank.

| Step | Result |
| --- | --- |
| First attack, hit | 2d12 cold + 2d12 bludgeoning, all taken |
| Walking 10 feet through the emanation | The foe pays 20 feet; the caster pays 10 |
| The caster moves 2 squares | The region moves 2 squares with it |
| Second attack | No second emanation |

**Cleanup:** fixtures and the region removed.
