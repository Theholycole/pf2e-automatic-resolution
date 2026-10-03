# Rank 5 batch 26 — Elemental Breath

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Elemental Breath (5) | Each PF2e element variant reads its own list item as the basic Reflex save of its damage (+1d10 a rank): **Air** 6d10 electricity, failing rows pushed 10 feet away; **Earth** 5d10 bludgeoning, failing rows Prone (only on the ground: a GM note); **Fire** 7d10 fire; **Metal** 5d10 slashing, metal creatures get a result one degree worse (unattended metal objects: GM note); **Water** 3d10 cold + 3d10 bludgeoning; **Wood** 3d10 piercing + 3d10 slashing, and the GM places the cone's difficult terrain for 1 minute from the card. For Water and Wood, the caster splits the heightened dice between the two types. The element roll (or choice with 3 actions) is the caster's. |

## Rules

- **Element variant (`element-variant.js` `rewriteElementVariant`):**
  - It reads the roll lead, the area's basic save, the list (one item per die face), and the Heightened entry.
  - The variant's trait picks its item. That item's inline damage must be the variant's entries, and its step must match PF2e's heightening (the first entry for two types).
  - The item's riders become:
    - push or Prone: written-out rows;
    - metal: "Creatures with the metal trait get a result one degree of success worse than they rolled.", the degree-adjustment sentence;
    - terrain: `resolution.areaTerrain`;
    - two types: `sharedDamage.diceSplit`.
- **Runtime:**
  - The dice split is a caster question before damage (0 to N heightened dice for the second type). The rolled formula moves that many dice.
  - Area terrain is a button after Finalize. `placeAreaTerrain(card, region)` starts an Ongoing region area with difficult terrain for the stated time.
  - Both are exposed on the saves API.
- **Validators:** `inspectSavePlan` checks:
  - the terrain's stated sentence and time;
  - the split's two types against the entries, plus the Heightened sentence.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-26.test.js` is new. Its negative cases are:
- a split to a type the variant doesn't have (blocked);
- variant data that isn't the item's damage (not read).

A whole-corpus compile (b481 → b482) changed only Elemental Breath's six variants.

## Evidence

[Live evidence](phase-rank-5-batch-26-live-results.json), case `rank5Batch26`, in the `pftest` world.

| Variant | Check | Result |
| --- | --- | --- |
| Water, 7th, 1 die to bludgeoning | Damage | 4d10 cold + 4d10 bludgeoning = 47; failure lost 47 |
| Wood, 5th | Terrain | Placed on the selected region with difficult terrain for 60 seconds |
| Metal, 5th, metal creature | Degree | Rolled failure, became critical failure: double 23 = 46 |

**Cleanup:** fixtures removed.
