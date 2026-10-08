# Third-party batch 60: Coiling Creepers

2026-10-07. The sixtieth batch of the third-party modules' spells.

## What changed

- **Coiling Creepers (Witches+)** (new `creeper-maneuver.js`, kind `creeper-maneuver`; `effect-runtime.js`; `main.js`):
  - **The burst:** a region of difficult terrain for the sustained minute.
  - **The caster's Effect** holds the card's controls (`creepersAct`, also on the API).
  - **The maneuver**, on the cast (when a creature and a maneuver are given) and on each Sustain:
    - Disarm, Reposition or Trip, rolled with the caster's spell attack modifier and multiple attack penalty against the creature's Reflex or Fortitude DC.
    - The creature must be in the area or beside it, and Huge or smaller.
    - Trip gives Prone, plus 1d6 bludgeoning on a critical success.
    - Disarm's success gives −2 with the item until the start of its turn.
    - The item drop and the Reposition's 5 or 10 feet are the GM's, from the card.
  - **A cleared square:** the targeted token's square is cut from the region as a hole. The damage that clears a square is shown at the cast rank: 10 slashing or 2 fire at 3rd, +5 and +1 a rank.
  - The squares' AC 5 and failed saves, and the lack of flanking, are notes.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 59 | Batch 60 |
| --- | --- | --- |
| Effect | 90 | 91 |
| Not enabled | 10 | 9 |

Resolved: 218 of 227.

## Tests

`test/third-party-batch-60.test.js` (1). All 1,780 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-60-live-results.json), case `thirdPartyBatch60`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 3rd, Trip a foe in the area | Prone; the region is difficult terrain; clearing needs 10 slashing or 2 fire |
| Critical Trip on a foe beside the area | Prone and 6 bludgeoning (1d6) |
| Disarm success | −2 Effect |
| Reposition success | GM note: up to 5 feet |
| A distant foe; a Gargantuan foe | Refused |
| Clear the square under a token | A hole added to the region |
