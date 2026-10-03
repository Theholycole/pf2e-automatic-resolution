# Rank 2 batch 49 — a light aura for allies, a tremorsense web

2026-10-01.

| Spell | Now |
| --- | --- |
| Light of Revelation (2) | An Effect on the caster for 5 minutes: bright light in 30 feet (TokenLight), and PF2e's Aura (30 feet, the caster and its allies by PF2e alliance). The Aura gives a world Effect the module keeps for the spell (made once by the GM): +1 status to Perception to Seek, the check to detect hidden or undetected creatures and features. |
| Fungal Hyphae (2) | An Effect on the caster for 1 minute: imprecise tremorsense 30 feet (PF2e's Sense rule). It's removed when the caster's token moves (the hyphae snap). From the 4th rank, its Ongoing control makes a plant Strike: the caster's spell attack (with the multiple attack penalty the caster picks) against the targeted creature's AC, 3d8 bludgeoning on a hit, doubled on a critical hit, with PF2e's IWR. Other damage types for unusual plants, and the 6th rank's simple manipulate actions, are the note. |

## Rules

- **New note families:**
  - `light-aura.js`: the two sentences exactly.
  - `hyphae.js`: the three sentences and both Heightened entries exactly.
- **Runtime:**
  - The `light-aura` executor (TokenLight, Aura, and the world Effect flagged `generatedAuraEffect`).
  - The `hyphae` executor.
  - `hyphaeOnMove` on `updateToken` (Effects flagged `endsOnMove`).
  - The `plant-strike` request and control. The first run passed a token as the roll's target; PF2e wants an actor, so it's left out (the DC is the target's AC).

## Tests

893/893 pass. `test/rank-2-batch-49.test.js` is new. It checks both plans, and that changed text isn't read.

A whole-corpus compile (b303 → b304) changed only these two spells.

## Coverage

**Census:** **1126 enabled**, up from 1124. Rank 2: 212 of 245.

## Evidence

[Live evidence](phase-rank-2-batch-49-live-results.json), case `rank2Batch49`, in the `pftest` world.
- **Light of Revelation:** the caster's token has bright light 30. The caster and the party ally have the aura's Effect; the opposition foe doesn't.
- **Fungal Hyphae at 4th:**
  - The Sense is tremorsense, imprecise, 30 feet.
  - A plant Strike was a critical hit: "2 * 3d8 bludgeoning" (8 lost).
  - Moving the caster's token removed the Effect.
