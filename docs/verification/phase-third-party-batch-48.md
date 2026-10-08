# Third-party batch 48: Promised Renewal

2026-10-07. The forty-eighth batch of the third-party modules' spells.

## What changed

- **Promised Renewal (Oracles+)** (new `promised-renewal.js`, kind `renewal`; `effect-runtime.js`; `basic-save-runtime.js`; `main.js`):
  - **A corpse:** the growth starts at once, with no save.
  - **A dying creature:** the save card, built from the text.
    - A failure raises its Dying value by 2, a critical failure by 3. These use PF2e's own increase, so at its maximum the creature dies.
    - If the save kills it, the growth starts around it. The card's state carries `renewalGrowth`, and the `saveApplied` hook starts it.
  - **The growth:** an emanation for the spell's 4 rounds around the creature.
    - Difficult terrain.
    - Fast healing for minions with the fungus, plant or wood trait while they're inside (a member rule with that predicate).
    - Both grow by the Heightened (+2) entry: 5 feet and fast healing 2 every 2 ranks.
    - The fast healing for the caster's other creations with Hit Points (Protector Tree) is a GM note.
  - The inline roll grows the fast healing by 2 every rank, but the Heightened entry grows it by 2 every 2 ranks. The module follows the Heightened entry. The module's Effect follows the inline roll, so it isn't used.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 47 | Batch 48 |
| --- | --- | --- |
| Effect | 78 | 79 |
| Not enabled | 22 | 21 |

Resolved: 206 of 227.

## Tests

`test/third-party-batch-48.test.js` (1). All 1,768 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-48-live-results.json), case `thirdPartyBatch48`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A corpse (an NPC at 0 HP), cast at 5th | The growth at once: 20 feet, difficult terrain; a plant minion inside holds fast healing 5 |
| A character at Dying 2, cast at 3rd, failure | Dying 4: dead (`killedByRow`); the growth around it, 15 feet |
