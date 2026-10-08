# Third-party features batch 31: power ring runes

2026-10-07. Magic+'s power ring runes, first of the item-cast triage ([audit](../planning/third-party-features-audit.md)).

## What changed

- **`src/compiler/plus-feature-rules.js`:**
  - Five PASSIVE forms for the worn runes, read with the rune's ChoiceSet selection. PASSIVE builders now get the source.
  - The `attack-crit` rider: Immobilizing (trait, DC 24 Fortitude or Slowed 1 until the end of the caster's next turn), Ramming (DC 22/32, pushed 10/20 feet), Scourging (the rune's damage type, 1d10 persistent), Perishing (a natural 20: Die!, DC 37, incapacitation at the rune's level).
  - The `natural-crit` rider: Overwhelming, with Veracious Spell only. A text rule drops the module's AdjustDegreeOfSuccess, which covered every spell attack.
- **`src/compiler/plus-spellshapes.js`:** Veracious Spell's rider is marked `veracious`.
- **`scripts/spellshape-runtime.js`:**
  - `attack-crit` in `applyShapeRiders`: a save card at the rune's DC (`startShapeCard`), or the persistent damage. Die! is asked first.
  - The Energy rune (`readEnergyRune`, `gatherPower`, `releasePower`, `energyRuneOnCard`): after a Veracious cast dealing energy damage, a Gather Power button gives a 1-minute charge Effect. Release Power is a spell attack (5d4 of that type, the ring's item bonus); posting the rune's card while charged offers it again.
- **`scripts/basic-save-runtime.js`:** the spell attack's natural 19 becomes a critical success with Overwhelming. The card's attack bonus can be typed (item).
- **`tools/third-party-features-census.mjs`:** reads `readEssenceActivation` and `readEnergyRune`. item-cast is now 61 of 122.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Tests

`test/third-party-features-batch-31.test.js` (3). All 1,854 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-31-live-results.json), case `thirdPartyFeaturesBatch31`. Re-run: `thirdPartyFeaturesBatch7` and `thirdPartyFeaturesBatch8` (the power ring), which still pass.

A 10th-level arcane caster with a Power Ring (Silver), each rune worn in turn, against a foe:

| Step | Result |
| --- | --- |
| Immobilizing (Cold), Hydraulic Push given the cold trait, a critical hit | DC 24 Fortitude card; failed: Slowed 1 |
| Ramming, a critical hit | DC 22 card; failed: pushed 20 feet (Hydraulic Push's own 10, then the rune's 10) |
| Scourging (Fire), Ignition at 5, a critical hit | 1d10 persistent fire, beside Ignition's own |
| Perishing, a natural 20 | Die!'s card: DC 37 Fortitude, rank 9 |
| Overwhelming, a natural 19 that succeeds | With Veracious Spell: critical success; without: success |
| Energy, Veracious Ignition | Gather Power: "Gathered Power (fire)"; Release Power: +2 item, 5d4 fire taken; the charge spent |
