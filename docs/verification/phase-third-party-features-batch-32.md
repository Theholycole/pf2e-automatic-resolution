# Third-party features batch 32: catalyst and ammunition

2026-10-07. The last two item casts to build; the rest of the family is triaged ([audit](../planning/third-party-features-audit.md)).

## What changed

- **Blue Salt Crystal** (Magic+):
  - Its catalyst form in `readPlusItemSpellshape` (`src/compiler/item-spellshape.js`): its card arms the next Drown.
  - The `spell-persistent` rider (`scripts/spellshape-runtime.js`): an affected target takes persistent acid equal to the rank, granted by an Effect lasting the spell's duration (cascade-deleted with it).
- **Gray Dust Ammunition** (Alchemists+), in the new `scripts/plus-ammo-runtime.js`:
  - `readBackfireAmmo` reads the item; its card arms the shooter's next Strike (actor flag `backfireAmmo`).
  - A hit marks the target for a minute.
  - The marked creature's next cast opens the basic save card through its own spellcasting entry, with the critical failure's Stupefied 2 for 1 round.
- **`startShapeCard`** takes an optional `entryId`, since PF2e rolls a spell's damage only through a spellcasting entry.
- **The census** reads `readBackfireAmmo`. item-cast is now 64 of 122, and the other 58 are triaged in the audit.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Tests

`test/third-party-features-batch-32.test.js` (2). All 1,856 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-32-live-results.json), case `thirdPartyFeaturesBatch32`. Re-run: `spellshapeBatch12` (the shape cards) and `thirdPartyFeaturesBatch31`, which still pass.

| Step | Result |
| --- | --- |
| Blue Salt Crystal's card, then Drown at 2, failed | "Blue Salt Crystal: 2 persistent acid (Drown)", 10 rounds; persistent 2 acid; the Effect deleted: the persistent damage gone |
| Gray Dust Ammunition (Lesser)'s card, then a Strike hits a level-5 caster | Marked for 10 rounds; the shooter disarmed |
| The caster casts Electric Arc | The DC 25 basic Fortitude card (8d4 force) on itself; a critical failure: double damage taken, Stupefied 2; the mark gone |
