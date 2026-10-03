# Rank 4 batch 37 — Sacred Nimbus

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Sacred Nimbus (4) | A placed 10-foot square, sustained for 1 minute. At the end of each of the caster's turns, the area deals 5d6 spirit damage (+1d6 per rank) to each fiend, undead or spirit-weak creature inside, with no save. GM notes cover moving the cloud and the item's save. |

## Rules

- **Caster's-turn rain (`hazard-area.js`):** "The X deals NdM T damage to A, B, and creatures that have a weakness to T damage in the area at the end of your turn." is read as an automatic hazard.
  - Its traits come from a fixed plural-to-slug list; an unknown word refuses.
  - The damage must match the item's entry, with the Heightened "The damage increases by …" step.
  - It may be sustained, may be a square, and may carry a save PF2e's item lists when the text never mentions one (a note says so).
  - The Sustain move sentence is a GM note.
- **Runtime:**
  - `startRegionArea` takes `sustained`.
  - Lingering records gain the `source-turn-end` event.
  - `applyHazardDamage` skips creatures that lack the traits and PF2e's weakness to the type.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-37.test.js` is new. Its negative cases:
- a save sentence in the text;
- an unknown creature word.

A whole-corpus compile (b447 → b448) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-37-live-results.json), case `rank4Batch37`, in the `pftest` world, cast at 5th rank.
- The caster Sustained on their turn.
- As the turn ended, the undead inside took 6d6 spirit = 16. The ordinary creature inside took nothing.
- The record stayed active.
- **Cleanup:** fixtures removed.
