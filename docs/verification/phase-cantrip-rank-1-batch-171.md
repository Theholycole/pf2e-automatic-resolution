# Cantrip / rank 1 batch 171 — scene features (note-only before)

2026-09-28.

| Spell | Now |
| --- | --- |
| Wall of Shrubs | The line placed for the rank's duration; PF2e difficult terrain from 3rd rank; cover and Climb DC on the caster's Effect |
| House of Imaginary Walls | A Foundry wall blocking movement (not sight) for 1 round; disbelief and AC/Hardness/HP on the Effect |
| Hologram Cage | Four sight-blocking walls and the cage's light; a new cast replaces the last |

## Tests

786/786 pass. A whole-corpus compile (b254 → b255) changed only these 3 spells. Batch-8 is updated.

## Coverage

**Census:** **720 enabled**, up from 717.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-171-live-results.json), case `cr1Batch171`, in the `pftest` world, on a temporary scene.
- **Wall of Shrubs:**
  - Rank 1: lesser cover, no terrain behaviour, 1 minute. The line was removed with the Effect.
  - Rank 3: standard cover, a `modifyMovementCost` behaviour (walk 2), 10 minutes; the Ongoing record was ended.
- **House of Imaginary Walls:**
  - One wall along the 200×100 placement's midline (800,1050 → 1000,1050), blocking movement but not sight.
  - The Effect lasts 1 round and lists Hardness 2 and 4 HP. The wall and region were removed with the Effect.
- **Hologram Cage:**
  - Four walls block sight but not movement. The light is at the centre (1400, 1400) with bright 20 and dim 40 feet.
  - A second cast left four walls and one Effect, with the old light and region gone. Everything was removed with the Effect.
- **Cleanup:** fixtures, the temporary scene and the Ongoing record removed; no walls, combats or records left.
