# Third-party features batch 9: Fury of a Thousand

2026-10-07. The ninth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)). It follows the user's decision of the same day.

## What changed

- **Fury of a Thousand** (Tian Xia+), read with riders for each spell; only the cast spell's riders are kept:
  - **Murmuration:**
    - "You deal both types of damage instead of piercing or sonic": the user chose "Full damage of each". The card no longer asks for a type; the rolled damage is dealt in full as piercing and again as sonic (`dual-damage`, `shapeDualFor`).
    - "On a critical failure the status penalty is –3 instead of –2": PF2e's Spell Effect: Murmuration made on the card is set to −3 (`effect-value`).
  - **Song of Strength:** "The status bonus increases to +2": PF2e's Spell Effect, both of its bonuses (Athletics, and the DCs against Athletics actions), set to +2.
  - "Depending on your selection from Birds of a Feather" is the table's.
- **Held spells keep their cast:** a spell that waits for its trigger (Murmuration) now stores the cast's message. When it triggers, the save card reads that cast's spellshapes through `shapeMessageId`. Only the spellshape riders use it; target checks and card marking don't.
- **`shapeAdjustEffects`:** changes a stated Effect value. The Effect route calls it on the Effects it makes, and `finishShapeRiders` on the card's own Effects.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 8 | Batch 9 |
| --- | --- | --- |
| spellshape | 37 / 51 | 38 / 51 |

## Tests

`test/third-party-features-batch-9.test.js` (1). All 1,809 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-9-live-results.json), case `thirdPartyFeaturesBatch9`, in the `pftest` world. It also re-ran the earlier Murmuration case (`cr1Batch118`), which still passes.

| Step | Result |
| --- | --- |
| Fury of a Thousand, Murmuration held on a foe; a failure | "2 piercing + 2 sonic": 4 lost (2 rolled, dealt as each type) |
| The same; a critical failure | The −3 Effect (PF2e's −2 raised) |
| Fury of a Thousand, Song of Strength | PF2e's Effect: Athletics +2, Fortitude/Reflex DCs +2 |
| Murmuration without the feat (cr1Batch118) | Unchanged: 1d4 sonic; −2 on a critical failure |
