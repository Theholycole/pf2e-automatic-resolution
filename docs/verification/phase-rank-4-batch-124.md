# Rank 4 batch 124 — Life's Fresh Bloom

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Life's Fresh Bloom (4) | The placed burst is a sustained Ongoing region area for 5 rounds. At the start of a creature's turn inside: **living (not a nindoru) on the ground** (elevation 0): it recovers 1d6 Hit Points (1d8 from 7th, 1d10 from 10th) and gets PF2e's Spell Effect: Life's Fresh Bloom (+5-foot status to Speed until the end of its next turn). **Undead and nindoru fiends:** PF2e's Fortitude save against the spell DC; a failure makes them Sickened 1 (2 from 7th, 3 from 10th). |

## Rules

- **`src/compiler/bloom-area.js`:**
  - Reads the heal and harm sentences, and the Heightened entries (fixed ranks).
  - Proves PF2e's linked Effect: one land-speed FlatModifier of the stated value and type, lasting 1 round to the end of the turn.
  - Checks the item's healing entry.
- **`compileSpell`:** the kind `bloom-area` with the Effect's uuid; the link is no longer an unscoped Effect.
- **`ongoing-families`:** `applyHazardDamage`'s `bloom` branch. The save and condition go to the harmed creatures. Living creatures on the ground get the Effect, then the existing healing path.
- **Runtime:** `#executeBloom` starts the region area (turn-start, sustained) with the rank's dice and value.

## Interpretation

- **"Standing on the ground" means token elevation 0.**
- **The undead's save is PF2e's roll at turn start**, not a save card, as with Radiant Field's start-of-turn saves.
- **Living** is PF2e's mode of being. Constructs neither heal nor save.

## Tests

`test/rank-4-batch-124.test.js` is new. It covers the data, the dice and value by rank, the Effect, and a different Speed bonus (not proved).

A whole-corpus compile (b663 → b664) changed only Life's Fresh Bloom.

## Evidence

[Live evidence](phase-rank-4-batch-124-live-results.json), case `rank4Batch124`, in the `pftest` world, cast at 4th rank, in combat.

| Creature, at its turn start | Result |
| --- | --- |
| Living, wounded | Healed 3 (1d6) and holds the Speed Effect |
| Flying (elevation 10) | Not healed |
| Undead (Fortitude −20) | Sickened 1 |

**Cleanup:** fixtures, combat and the region removed.
