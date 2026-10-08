# Third-party batch 65: Seeds of Divinity

2026-10-07. The sixty-fifth batch of the third-party modules' spells.

## What changed

- **Seeds of Divinity (Oracles+)** (new `divine-seeds.js`, kind `divine-seeds`; `effect-runtime.js`; `main.js`):
  - **The caster's Effect** lasts the sustained minute and holds the 4 seeds, the bushes, and the maximum cursebound value (asked when casting).
  - **Sprouting** (`seedsAct` "sprout"; `options.positions` at the cast, or a placed square later): each seed becomes a bush token. Bushes have 10 × rank HP and AC 10 + 2 × rank, matching the inline rolls and the Heightened entry. They are removed when the spell ends.
  - **Growing** (`seedsAct` "grow", the Sustain's control): a bush at least a round old, once only:
    - hazardous: its square becomes a region where each creature entering takes 2 × rank piercing and 2 × rank poison;
    - bountiful: one fruit.
  - **Eating** (`seedsAct` "eat"): the creature gets 2 × rank + 2 temporary HP and a status bonus to damage equal to the maximum cursebound, until the spell ends.
  - The concealment is a note.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 64 | Batch 65 |
| --- | --- | --- |
| Effect | 95 | 96 |
| Not enabled | 5 | 4 |

Resolved: 223 of 227.

## Tests

`test/third-party-batch-65.test.js` (1). All 1,785 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-65-live-results.json), case `thirdPartyBatch65`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 3rd, two seeds sprout | Two bushes, 30 HP, AC 16; 2 seeds left |
| Grow at once | Refused (after a round) |
| A round later, hazardous; a foe moves in | 12 lost (6 piercing and 6 poison) |
| Bountiful; an ally eats the fruit | 8 temporary HP; Effect TempHP 8 and +2 damage |
| A second fruit | None left |
| The last two seeds; one more | 0 left; refused |
| The spell ends | Every bush removed |
