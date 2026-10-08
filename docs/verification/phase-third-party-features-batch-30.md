# Third-party features batch 30: essence casting E3b

2026-10-07. The last batch of Magic+'s essence casting ([audit](../planning/third-party-features-audit.md)).

## What changed

All in `scripts/essence-runtime.js`:
- **Unstable Draw** (`unstableDrawOnCard`, `unstableOnCast`): the next draw cantrip draws 1 above the draw and rolls the DC 10 flat check. Short of a critical success, the next essence spell leaks. A critical failure's stupefied 1 and Unstable Aura's reminder last until that spell.
- **Terminus of Life** (`lifeTerminusOnCast`): temporary Hit Points on a cast that raises the essence and heals no one, by the Effect's cycle.
- **Essence Summoner** (`essenceSummoned`, called by `effect-runtime.js`'s summon): +2 or +1 status to the summon by the essence before the cast (kept on the cast as `essenceBefore`).
- **The essence spells' 1-day temporary immunity** (`essenceImmunity`, `essenceGrantsImmunity`): counteracting and removal spells; an immune target left out of the cast (`targetMisses`).

With batches 27–29, the essence system is done. The rest is the table's (see the audit).

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Tests

`test/third-party-features-batch-30.test.js` (1). All 1,851 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-30-live-results.json), case `thirdPartyFeaturesBatch30`. Re-run: `thirdPartyFeaturesBatch19` (summons), `thirdPartyFeaturesBatch27` and `thirdPartyFeaturesBatch8`, which still pass.

A 7th-level primal essence caster (pool 4, draw 2), in combat:

| Step | Result |
| --- | --- |
| Unstable Draw, then Electric Arc (the flat check fixed at 12) | Essence 3; a success pending; Unstable Aura's reminder |
| Breathe Fire at 3 | Essence 0: a leak counted; the reminder gone |
| Terminus of Life at cycle 1, then Electric Arc at 4 | 8 temporary Hit Points |
| Summon Animal at 1 with 2 essence | The animal +1 (Essence Summoner) |
| Cleanse Affliction at an ally, then again | The ally immune for a day; the second cast leaves it out |
