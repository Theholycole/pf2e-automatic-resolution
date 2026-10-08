# Third-party batch 6: the Witches+ hexes that save again on each Sustain

2026-10-06. The sixth batch of the third-party modules' spells: the four other hexes that use batch 5's "save again on each Sustain".

## What changed

- **Holding Glyph:**
  - The rows' "–1/–2 status penalty against forced movement effects" is a status penalty to its saves (so also their DCs against Shove and Reposition). It applies while the GM's toggle "against a forced movement effect" is on.
  - "Each time the creature takes an action with the move trait, it takes 1 force damage" (+1 a rank, doubled on a critical failure) is a new triggered-damage kind, `move-action`, reported by the GM.
  - Both last until the next Sustain's save (the end of the caster's next turn).
  - The module's Effect (its `forced-movement` predicate is nothing PF2e sets) is checked and replaced.
- **Realityflicker** (`compileFlickerRoll`, `src/compiler/condition-roll.js`):
  - The rows' "[[/r 1d4]]" picks Clumsy 1, Enfeebled 1 or Stupefied 1, with a 4 the caster's choice, until the end of the creature's next turn.
  - A critical failure rolls a second time (`conditionRoll.criticalSecond`). A repeat of the first result becomes the caster's choice of another, on the card.
- **Lost in the Crowd** (`src/compiler/third-party-rows.js`):
  - On a failure, for the round, the creature is off-guard against the caster only, and can't flank: PF2e's `canFlank` set to false, the rule from the module's Effect.
  - On a critical failure, it gets PF2e's Off-Guard instead.
  - A successful Seek ends the flanking note. The caster's Ongoing control rolls Perception against the spell DC (a new Perception option of the disbelief control that ends only that note).
- **Judge Soul** (`compileJudgeLead`):
  - The text's 6d6 void damage overrides the item's bludgeoning: the card retypes PF2e's roll before it's rolled (`damageTypeFrom.kind: "text"`). Undead or void-healing creatures take vitality (the damage swap).
  - A creature reduced to 0 Hit Points dies (PF2e's death at 0 HP). The permanence, the shades and the caster's reincarnation are a GM note.
  - "is Drained 1 or increases its drained value by 1 if it was already drained" raises Drained by that much (`conditionIncreases`).
  - A success ("…, then the spell ends") closes the repeats.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 5 | Batch 6 |
| --- | --- | --- |
| Save | 29 | 33 |
| Not enabled | 94 | 90 |

## Tests

`test/third-party-batch-6.test.js` (4) covers the four hexes. All 1,696 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-6-live-results.json), case `thirdPartyBatch6`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Holding Glyph, failure | The note; Fortitude –2 with the toggle on; a reported move action: 1 force damage |
| Realityflicker, critical failure, 1 rolled twice | Clumsy 1; Enfeebled 1 (the caster's choice); damage |
| Lost in the Crowd, critical failure | Off-Guard; can't flank; a successful Seek: can flank again |
| Judge Soul, rank 10, on an undead, failure twice | 6d6 void, swapped to vitality; damage; Drained 1, then 2 |
