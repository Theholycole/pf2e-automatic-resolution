# Third-party batch 54: Wooden Engulfment

2026-10-07. The fifty-fourth batch of the third-party modules' spells.

## What changed

- **Wooden Engulfment (Oracles+)** (new `engulfing-tree.js`, kind `engulfing-tree`; `effect-runtime.js`; `main.js`):
  - **The tree:** a token (decision 2026-10-01), Huge for the 15-foot square, placed by the caster (or `options.position`).
    - Its Hit Points and AC follow the inline rolls, which are checked against the Heightened (+1) entry: 60 HP and AC 30 at 6th rank, +10 HP and +3 AC per rank.
    - It is Immobilized, and its reach is 15 feet.
  - **The square:** creatures standing in it are moved to the nearest free adjacent space.
    - This uses a new shared helper, `moveOutOfBoxes`.
    - Garden of Crystals now uses it too, and its live case was re-run and passed.
  - **The caster's Effect** lasts the sustained minute and holds the summon. The tree's token goes when the spell ends, or when the tree drops to 0 HP.
  - **The grab** (`treeGrab`, the card's control; also at the cast when one creature within reach is targeted):
    - the caster's spell attack, with the multiple attack penalty, against the creature's Reflex DC;
    - Grabbed, or Restrained on a critical success, until the end of the caster's next turn;
    - Escape or Force Open at the spell DC is noted on the creature's Effect.
  - The tree that outlives the spell in soil is a note.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 53 | Batch 54 |
| --- | --- | --- |
| Effect | 84 | 85 |
| Not enabled | 16 | 15 |

Resolved: 212 of 227.

## Tests

`test/third-party-batch-54.test.js` (1). All 1,774 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-54-live-results.json), case `thirdPartyBatch54`, in the `pftest` world. It also holds a re-run of `thirdPartyBatch50`, which passed.

| Step | Result |
| --- | --- |
| Cast at 7th, the tree at a 3×3 square | Token 3×3, 70 HP, AC 33, Immobilized |
| A foe standing in the square | Moved beside it (and a leftover test token too) |
| The targeted foe within reach, at the cast | Success: Grabbed |
| The card's grab again, critical success | Restrained (one hold Effect) |
| The spell ends | The tree's token removed |
