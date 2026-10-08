# Third-party features batch 26: Don Visage, Slidecasting, Invigorate

2026-10-07. The sixth Magus+ batch ([audit](../planning/third-party-features-audit.md)): the rest of the cascades entered after a cast.

## What changed

- **Don Visage** (`readActionCast`, `actionCastOnCard`): after a spell, the Arcana check against the level's DC. On a success, the module's Effect for 3 rounds, or 4 on a critical success.
- **Slidecasting** (`readSpellstrikeFeature`; `slidecastNow` in `spell-actions-runtime.js`, on each cast and each token move in `main.js`): a cast and a move in the same combat turn give the module's Slidecast Effect once that turn, for 2/3/4 rounds, with the text's status bonus.
- **Invigorate** (`readSpellstrikeFeature`; `invigorateOnDamage` on PF2e's damage-taken messages): a creature brought to 0 Hit Points by the magus's spell, or by a Strike after its delivered Spellstrike. The card's button puts the module's Effect on the magus and its familiar.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Census

| Family | Batch 25 | Batch 26 |
| --- | --- | --- |
| spellstrike-cascade | 20 / 73 | 23 / 73 |

## Tests

`test/third-party-features-batch-26.test.js` (2). All 1,847 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-26-live-results.json), case `thirdPartyFeaturesBatch26`. Re-run: `thirdPartyFeaturesBatch25` and `thirdPartyFeaturesBatch20`, which still pass.

| Step | Result |
| --- | --- |
| Ignition, then Don Visage (a natural 20) | Effect: Arcane Cascade: Don Visage (Fire) (Fearsome), 4 rounds |
| In combat: Ignition, then a move | Slidecast Effect after the move (not before): 2 rounds, its +1 status |
| A second move that turn | Still one Effect |
| The magus's Ignition damage brings the foe to 0 | Invigorate offered; the Effect on the magus and on its familiar |
