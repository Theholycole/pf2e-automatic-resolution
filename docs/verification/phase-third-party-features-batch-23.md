# Third-party features batch 23: Spellstrikes delivered by other Strikes

2026-10-07. The second Magus+ batch ([audit](../planning/third-party-features-audit.md)); with it, all 51 "+" spellshapes are read.

## What changed

- **`deliveredStrikeMessage`** (`spell-actions-runtime.js`, read by `basic-save-runtime.js`): the Strike or attack that delivers a cast.
  - By default, the caster's latest Strike against the target after the cast, as before.
  - Scissored Assault: the mystic duo's Strike (`strikerUuid`).
  - Big Shot: the caster's next attack roll with the makeshift spellgun, or a spell attack roll.
  - Dual-Weapon Spellstrike: the first successful of the first two Strikes, else the first.
  - Residual Spellstrike: the Strike after its card.
- **Readers:**
  - Dual-Weapon Spellstrike, Scissored Assault and Big Shot: `plus-spellshapes.js` forms, as the `spellstrike` rider's `dual`, `striker` and `kind`.
  - Residual and Reverse Spellstrike: `readActionCast`, run on their card by `actionCastOnCard`.
  - Requirements holding links are read.
- **Penalties on the caster's Strike:** Dual-Weapon's second Strike at −3 (−2 agile) and Residual's at −5 (−4 agile). Each is an Effect of −3 or −5, with the agile difference as its own modifier on agile Strikes.
- **Reverse Spellstrike:** a slot of the highest rank expended, the hostile spell borrowed in an innate entry at that rank and cast, delivered by a Spellstrike. The entry and spell go with an Effect at the end of the magus's next turn (`removesItems`, handled by `shapeTieEnded`).
- **Each cast's targets are kept on its message** (`castTargets`, by `spellActionsOnCast`).

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Census

| Family | Batch 22 | Batch 23 |
| --- | --- | --- |
| spellshape | 48 / 51 | 51 / 51 |
| spellstrike-cascade | 6 / 73 | 8 / 73 |

## Tests

`test/third-party-features-batch-23.test.js` (3). All 1,840 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-23-live-results.json), case `thirdPartyFeaturesBatch23`. Re-run: `spellFeaturesBatch8` (PF2e's Spellstrike), `thirdPartyFeaturesBatch22` and `thirdPartyFeaturesBatch4` (the mystic duo), which still pass.

| Step | Result |
| --- | --- |
| Dual-Weapon: a longsword Strike against AC 100, then a dagger (agile) against AC −20 | First a critical failure, second a critical success; −3 and +1 (agile) on the second; the second delivers |
| Residual: a Spellstrike's Strike gets a failure; Residual's card; a dagger Strike | −5 and +1 (agile); that Strike delivers |
| Reverse: a foe's Ignition at the magus; Reverse's card | The rank-3 slot goes from 2 to 1; Ignition cast by the magus (the cantrip at rank 5) and delivered; the borrowed entry removed with its Effect |
| Scissored Assault: the duo's Strike | Delivered by the duo |
| Big Shot: the caster's next attack | Delivered by it |
