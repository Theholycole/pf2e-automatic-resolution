# Third-party batch 63: Mystic Bomb

2026-10-07. The sixty-third batch of the third-party modules' spells.

## What changed

- **Mystic Bomb (Magus+)** (new `mystic-bomb.js`, kind `mystic-bomb`; `effect-runtime.js`; `main.js`):
  - **The bomb:** a region at the placed burst. Its damage type comes from the Arcane Cascade Effect's choice, or is asked, or `options.damageType`.
  - **Creatures inside:** it explodes at once. The save card comes from a variant of the spell carrying the dice and the type: 4d6, +1d6 per rank above 6th, plus the Aid dice, with a basic Reflex save. The bomb is then gone.
  - **No creatures inside:** the caster's Effect holds it for the sustained duration, with its controls (`bombAct`, also on the API):
    - explode, after a Sustain moves its region, if creatures are in it;
    - grow by 5 feet, up to 20;
    - an ally within 60 feet Aids with the higher of Athletics and Arcana against the level's standard DC. A success adds 1d6, a critical success 2d6 counting twice. Each ally Aids once, and there are 3 uses plus 1 per rank above 6th.
  - Expansive Spellstrike is a note.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 62 | Batch 63 |
| --- | --- | --- |
| Effect | 93 | 94 |
| Not enabled | 7 | 6 |

Resolved: 221 of 227.

## Tests

`test/third-party-batch-63.test.js` (1). All 1,783 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-63-live-results.json), case `thirdPartyBatch63`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 7th onto a foe | Explodes at once: `5d6` fire save card |
| Cast at an empty spot | It waits |
| Four Aids: success, critical success, success, success | +1, +2, +1, then no Aid left |
| Grow | 10 feet |
| Its region moved onto a foe; explode | `9d6` fire save card; the bomb gone |
