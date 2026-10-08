# Third-party batch 22: Dynamic Ignition, Dynamic Vampiric Feast

2026-10-06. The twenty-second batch of the third-party modules' spells: the last two multi-version "Dynamic" spells.

## What changed

- **Dynamic Ignition (Magic+)** (`glyph-versions.js` `fitIgnitionVersion`):
  - **One action:** a card with one part: the burning square, placed by the GM.
    - Each creature entering it or ending its turn there takes the text's (1 + rank) fire, with no save.
    - It lasts the 1d4 rounds rolled when it's placed.
    - The parts check now accepts a square with "enter" and "turn-end" and rolled rounds (`basic-save-core.js`); the runtime rolls the rounds (`effect-runtime.js`).
    - An incarnate card now records a PF2e variant's overlays, so each part reloads that variant, not the base item.
  - **Two actions** (ranged, and the "Melee" variant's d6s): the spell attack. A critical hit doubles the damage and adds the text's persistent fire, (rank)d4 or (rank)d6.
  - **Three actions:** the same, with the persistent fire on a hit too. It's one instance; persistent damage of one type doesn't stack.
- **Dynamic Vampiric Feast (Magic+)** (`fitFeastVersion`):
  - **One action:** a marker on the caster until the end of its next turn. Its next damaging spell's card gives temporary HP equal to half the most damage that spell dealt to one creature, at most 5 × this spell's rank, for 3 rounds; the marker is then used up (`basic-save-runtime.js`).
  - **Two and three actions:** official Vampiric Feast's wording and its basic Fortitude save (from the item's data, as PF2e's own spell has it). Half the void damage taken becomes temporary HP for 3 rounds (two actions) or 1 minute (three actions, at 60 feet).

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 21 | Batch 22 |
| --- | --- | --- |
| Save | 57 | 59 |
| Not enabled | 52 | 50 |

Resolved: 175 of 227.

## Tests

`test/third-party-batch-22.test.js` (2). All 1,738 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-22-live-results.json), case `thirdPartyBatch22`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Ignition, one action | The card's square placed on a region: an Ongoing area started |
| Ignition, two actions (rank 3 cantrip), critical hit | 22 taken (twice 11); persistent fire |
| Vampiric Feast, one action, then Ignition's hit | Marked; the hit dealt 10; 5 temporary HP; the marker used up |
| Vampiric Feast, two actions, rank 3, failure | 27 void taken; 13 temporary HP for 3 rounds |
