# Third-party features batch 38: cast riders

2026-10-07. Single features from the spell-modifier triage ([audit](../planning/third-party-features-audit.md)).

## What changed

- **Stigmata (Clerics):**
  - Its action: persistent bleed of 1d4 per 4 levels on the cleric, and the Religion bonus while bleeding.
  - Its Harm rider: the persistent rider with `degreesByActions` (the 3-action cast only on a critical failure) and `whileCasterBleeding`; `rankFormula` reads `per4levels-d4`.
  - Its Heal part, in the new `scripts/plus-cast-riders-runtime.js`: the healed creature's persistent damage ends, or after the 3-action Heal a DC 11 flat check for each.
- **Archmemory (Magic+):** the last cast's slot given back (`refundSlot`).
- **Spell Eating (Barbarians+):** a slot consumed (its rank asked) for 1d12 Hit Points per rank, applied as PF2e's negative damage.
- **Black Book Hex (Witches):** a Spellstrike-free form in `plus-spellshapes.js`. The `self-damage` rider reads `rank` and a damage type.
- **Outsider Caller (Clerics):** after a summon spell, a card whose button opens the basic save card around the targeted summoned creature (2 × rank spirit, 15 feet).
- **The card handlers** (`actionCastOnCard` and the batch 31–37 card handlers) ignore messages with a roll context: a damage message carrying a feat as its origin had re-triggered Spell Eating.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Tests

`test/third-party-features-batch-38.test.js` (2). All unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-38-live-results.json), cases `thirdPartyFeaturesBatch38`, `thirdPartyFeaturesBatch25` and `thirdPartyFeaturesBatch26` (re-run, passing). An 8th-level cleric:

| Step | Result |
| --- | --- |
| Stigmata's card | 2d4 persistent bleed; the Religion bonus Effect |
| Harm (1 action) at a foe, a failure | The foe's 2d4 persistent bleed |
| Heal on an ally with persistent fire | The persistent fire ended |
| Heal at 1 spending a slot, then Archmemory | Slots 3 → 2 → 3 |
| Spell Eating (rank 2) | The rank-2 slot spent; Hit Points restored |
| Black Book Hex, then Evil Eye (rank 4) | 4 spirit damage taken |
| Summon Animal at 1, the burst button on the targeted creature | Basic Reflex card, 2 spirit, the foe within 15 feet caught |
