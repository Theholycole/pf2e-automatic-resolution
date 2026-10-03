# Rank 4 batch 30 — Precious Metals

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Precious Metals (4) | PF2e's Spell Effect: Precious Metals on the creature holding the item. PF2e asks for the material (cold iron, copper, gold, iron, silver or steel; adamantine and dawnsilver from 8th), then which armor, shield or weapon (it chooses when there's one). PF2e's alterations then apply: the precious material, Hardness 1 for copper, gold or silver, or otherwise at least 10 (+2 a rank). A note Effect has the rest. Coins or loose metal are the GM's. |

## Rules

- **Readers (`effect-note-proof.js`):**
  - "The metal in the target transforms from its normal metal into <list>." is proved by the material ChoiceSet (exactly those ungated) and the owned armor/shield/weapon ChoiceSet. The holder gets the Effect.
  - "If the spell's rank is 8th or higher, add adamantine and dawnsilver to the options." is proved by the gated choices.
  - The copper/gold/silver Hardness-1 override and "Otherwise, its Hardness is increased to 10 if it was lower." are proved. The upgrade follows the heightened step "If you increase the Hardness of the object, the new Hardness is 2 higher.", read as a step.
  - "An item transmuted in this way deals damage according to its new material." is proved by the material alteration.
- **Notes:** the cold-iron example, the GM's other material effects, and the monetary value.

## Tests

1100 pass. `test/rank-4-batch-30.test.js` is new, with negative cases: a material PF2e doesn't offer, and another Hardness value, aren't proved.

A whole-corpus compile (b430 → b431) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-30-live-results.json), case `rank4Batch30`, in the `pftest` world, at 4th.
- **Materials offered:** PF2e offered exactly cold iron, copper, gold, iron, silver and steel.
- **Result:** choosing cold iron made the ally's longsword cold iron (PF2e chose the only item). The note Effect has the GM's rules.
- **Cleanup:** fixtures removed.
