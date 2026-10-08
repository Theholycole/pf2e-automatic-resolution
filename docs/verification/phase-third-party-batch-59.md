# Third-party batch 59: Shine Spotlight

2026-10-07. The fifty-ninth batch of the third-party modules' spells.

## What changed

- **Shine Spotlight (Wizards+)** (new `spotlight.js`, kind `spotlight`; `effect-runtime.js`; `main.js`):
  - **The burst:** a region for the sustained minute, which must hold a creature. Creatures in it get +1 status to Perform and −1 circumstance to Stealth.
    - These come from the text. The module's Effect gives a status penalty to a "Stealth" selector, so it isn't used.
  - **The onlookers:** each non-allied creature outside the burst and within 15 feet of it attempts the Will save.
    - A failure gives an Effect granting Fascinated and Off-Guard. Removing the Fascinated removes the Effect.
    - The Effect lasts until the spell ends (`areaLifetime`).
  - **The performer** (`spotlightPerform`, the card's control; also on the API): a creature in the spotlight Performs and Sustains the spell. Each onlooker whose Will DC its Performance exceeds is fascinated with it.
  - The off-guard that remains until a hostile action resolves is a note.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 58 | Batch 59 |
| --- | --- | --- |
| Effect | 89 | 90 |
| Not enabled | 11 | 10 |

Resolved: 217 of 227.

## Tests

`test/third-party-batch-59.test.js` (1). All 1,779 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-59-live-results.json), case `thirdPartyBatch59`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A creature in the burst | Its rules: Performance +1, Stealth −1 (its Stealth −1) |
| Onlookers within 15 feet: one fails, one saves | Fascinated and Off-Guard; the other not. Leftover test tokens nearby saved as onlookers too |
| The star Performs (40) | The one who saved is now fascinated; the ally and the distant foe aren't |
| The spell ends | Fascination and the area's rules gone |
