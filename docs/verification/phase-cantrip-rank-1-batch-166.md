# Cantrip / rank 1 batch 166 — summons (note-only before)

2026-09-28.

| Spell | Now |
| --- | --- |
| Summon Animal, Construct, Fey, Plant or Fungus, Undead (rank 1); Summon Elemental (2); Summon Celestial, Dragon, Entity, Fiend, Giant, Monitor (5) | The caster picks a common compendium creature with the trait, at most the summon trait's level for the cast rank. It's placed within range with the summoned and minion traits, and removed when the sustained Effect ends |
| Summon Lesser Servitor | A celestial, fiend or monitor, or an animal that gains the chosen traits; levels from its heightened entries |
| Phantasmal Minion | The named creature, sustained up to 10 minutes |

## Tests

781/781 pass. A whole-corpus compile changed only these 14 spells (all to `summon`). Batch-8 is updated.

## Coverage

**Census:** **702 enabled**, up from 688.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-166-live-results.json), case `cr1Batch166`, in the `pftest` world, on a temporary scene.
- **Summon Animal at rank 1, through the list:**
  - The list offered 41 creatures, all level –1. The first (Angry Fox) was imported with the animal, summoned and minion traits and a linked token.
  - It was placed adjacent to the caster, with the caster's disposition. The caster's Effect is sustained.
  - Deleting the Effect removed the token and the actor.
- **Summon Animal at rank 2:** a level 1 animal was summoned; a level 2 animal was refused.
- **Summon Lesser Servitor:** a level –1 animal with the fiend and unholy traits.
- **Phantasmal Minion:** the Phantasmal Minion, 10 minutes. Each was removed with its Effect.
- **Found live:** the summoned creature was hostile to a friendly caster, because PF2e takes a token's disposition from the actor's alliance. The creature now gets the caster's alliance.
- **Cleanup:** fixtures, summoned actors and the temporary scene removed; no combats left.
