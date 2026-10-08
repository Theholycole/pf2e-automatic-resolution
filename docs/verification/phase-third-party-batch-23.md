# Third-party batch 23: Winter's Cold Embrace, Aura of Violent Light

2026-10-06. The twenty-third batch of the third-party modules' spells: two lingering areas.

## What changed

- **Winter's Cold Embrace (Magic+)** (`glyph-versions.js` `fitColdEmbrace`):
  - The 40-foot burst lasts 1 minute. A creature ending its turn in it takes the item's 12d4 cold (+2d4 per rank), with a basic Fortitude save.
  - A creature that is immune or resistant to cold and has neither darkvision nor greater darkvision takes spirit damage instead. The swap reads PF2e's own immunities, resistances and senses (`damageSwap` `resistant-no-darkvision`, `basic-save-core.js`).
  - The darkness's light rules are a reminder.
- **Aura of Violent Light (Witches+)** (new `violent-light.js`):
  - The willing ally the cast targets is the centre of a 5-foot aura. Each enemy that ends its turn within it saves (basic Fortitude) against the item's 2 fire and 2 spirit, +1 each per rank. These match the text's `(1+@item.level)`.
  - The first Sustain each round, on later turns, grows the aura by 5 feet, up to 15.
  - The module's Effect goes on the ally. Its Aura rule (5 × badge) and its badge labels (5, 10, 15 feet) are proved against the text when compiling and again from the live template. The badge rises with each growth (`ongoing-families.js`).
  - An enemy or the caster can't be the centre.
  - The lingering-area check accepts this aura only with the sentences the compiler read (`basic-save-core.js`).

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 22 | Batch 23 |
| --- | --- | --- |
| Ongoing | 3 | 5 |
| Not enabled | 50 | 48 |

Resolved: 177 of 227.

## Tests

`test/third-party-batch-23.test.js` (2). All 1,740 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-23-live-results.json), case `thirdPartyBatch23`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Cold Embrace (rank 6): cold-resistant foe, no darkvision, failure | Swapped cold → spirit; 31 of 31 taken |
| Cold Embrace: plain foe, failure | 12d4 cold, 32 of 32 taken |
| Aura of Violent Light (rank 6), an enemy as centre | Refused: "targets 1 willing ally" |
| Aura: enemy 5 feet from the ally ends its turn, failure | 7 fire + 7 spirit, 14 taken |
| Aura: enemy 10 feet away, round 1 | Not exposed |
| Aura: Sustain in round 2 | 10 feet; the module Effect's badge 2 |
| Aura: the 10-foot enemy ends its turn | Exposed |
| Aura ended | The ally's Effect removed |
