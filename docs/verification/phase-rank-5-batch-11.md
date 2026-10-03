# Rank 5 batch 11 — Untwisting Iron Roots

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Untwisting Iron Roots (5) | A basic Reflex save for each creature in the caster's 10-foot emanation: 2d6 bludgeoning (+1d6 a rank); a failure or critical failure also knocks it Prone. The card places a region of difficult terrain over the emanation, centred on the caster's space. The region stays after the spell, for the GM to remove. A GM note says the caster moves through it normally. |

## Rules

- **Left terrain (`compile-ability.js` `leftTerrain`, `basic-save-core.js`):** "The affected area becomes difficult terrain[, but you can move through the difficult terrain normally]." is read on an instantaneous basic save whose area is an emanation. The sentence is set aside before the save is compiled. If the save compiles, the plan carries `leftTerrain`; otherwise it's a gap (`left-terrain`). The validator requires the plan's own emanation.
- **The card:** creates the region (a circle of the emanation's radius beyond the caster's space) with Foundry's movement-cost behaviour, and whispers the GM.
- **Interpretation:** logged in `pending-user-decisions.md`. The terrain has no duration, so it stays; Foundry's region can't exempt one token, so the caster's exemption is a note.

## Tests

1088 pass. `test/rank-5-batch-11.test.js` is new, with a negative case: "greater difficult terrain" isn't read.

A whole-corpus compile (b417 → b418) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-11-live-results.json), case `rank5Batch11`, in the `pftest` world.
- At 6th, the adjacent creature's save was set to a failure: it lost 8 (3d6) and is Prone.
- The region has the movement-cost behaviour, is centred on the caster, and has a radius of 12.5 feet (10 feet beyond the Medium space).
- The GM note was whispered.
- **Cleanup:** region and fixtures removed.
