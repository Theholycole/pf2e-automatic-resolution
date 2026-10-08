# Third-party features batch 28: essence casting E2

2026-10-07. The second batch of Magic+'s essence casting ([audit](../planning/third-party-features-audit.md)).

## What changed

All in `scripts/essence-runtime.js`, hooked in `main.js`:
- **Channel Essence Leak** (`channelLeak`): on each leak, +1 status to the caster's AC and saves, or −1 to a creature the spell targeted, until the end of the caster's next turn.
- **Essence Conduit** (`essenceConduitOnCard`, `essenceOnCast`): its card arms the next 1- or 2-action cast. It raises the essence by 1 for a focus spell, a cantrip or a 1-action essence spell, and the 1-action spell doesn't leak.
- **Weave Conduit**: on Essence Conduit, the benefit of one of the tradition's essences. Life gives temporary Hit Points equal to the level; Spirit gives a spiritsense. The rest is the table's.
- **Life Essence Reservoir**:
  - `lifeReservoirRank`: its size is kept from the actor's healing spells.
  - `lifeReservoirOnHealing`: an essence spell's healing spends it, and healing beyond it is taken back.
  - `lifeReservoirOnRefocus`: Refocus restores the rank × 4, 6 or 8.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Tests

`test/third-party-features-batch-28.test.js` (1). All 1,849 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-28-live-results.json), case `thirdPartyFeaturesBatch28`. Re-run: `thirdPartyFeaturesBatch27` and `spellFeaturesBatch8`, which still pass.

A 7th-level divine essence caster with Essence Rebirth, Channel Essence Leak, Weave Conduit, Essence Conduit and Life Essence Reservoir, in combat:

| Step | Result |
| --- | --- |
| Electric Arc, then Sure Strike (1 action) | 2, then 0 (a leak); +1 AC and saves (Channel Essence Leak) |
| Electric Arc, Essence Conduit (Weave: life), then Sure Strike | 2; 7 temporary Hit Points; 3, no leak (still one counted) |
| The reservoir | Heal in the repertoire at 1: maximum 12 |
| 20 healing from the essence Heal to an ally at 5 Hit Points (reservoir 12) | The ally at 17; the reservoir 0 |
| Refocus | The reservoir 4 |
