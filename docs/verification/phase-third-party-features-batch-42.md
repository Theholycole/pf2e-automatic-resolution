# Third-party features batch 42: PF2e's catalysts

2026-10-08. Built here at the user's request ([audit](../planning/third-party-features-audit.md)). The fixture `.cache/pf2e-spell-features/pf2e-catalysts.json` holds the 107 catalysts from PF2e's equipment pack.

## What changed

- **`src/compiler/catalysts.js`** (new): `readCatalyst`, first in `readItemSpellshape`. A catalyst's card arms the next cast of its linked spell(s) with the text's rank limits.
  - Its riders: persistent damage, conditions, push, damage-type swaps, flat damage, reminder Effects, and terrain on the area.
  - PF2e's Effect goes on the caster at the cast when it changes the spell, or on the creatures when it's theirs.
  - Thunderbird Tuft's retaliation, Wood-Rotted Root's spores, Deadlock Mint's push save and Defiled Costa's card are read too.
  - The rest is a note to the GM at the cast.
- **`scripts/spellshape-runtime.js`:**
  - `flat-damage` by degree; the `crit-fail-card` rider.
  - Notes `atCast` go out with the cast.
  - `healed-reduce`, and a once-only `healed-effect`.
- **`src/compiler/spellshape-readers.js`:** spell names compare case-insensitively.
- **`scripts/item-spellshape-runtime.js`:**
  - `retaliate` without a save, on a hit, with a metal-weapon formula, skipping reach weapons.
  - `hurt-spores` and `catalystSporesOnDamage`, with `installDamageTypeMemory` (PF2e's applyDamage records the damage types it is given).
  - `cast-push-save`.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Tests

`test/third-party-features-batch-42.test.js` (2). All unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-42-live-results.json), case `thirdPartyFeaturesBatch42`. Re-run: `spellFeaturesBatch4a` (the grimoires, Sparking Grimoire's retaliation), `thirdPartyFeaturesBatch7`, `32` and `38`, all passing.

| Step | Result |
| --- | --- |
| Firestarter Pellets, Fireball at 3: a failure and a critical failure | 1d6 and 2d6 persistent fire |
| Dragon Eye, Breathe Fire at 3: a failure | PF2e's Effect: Dragon Eye on the caster; Frightened 1 |
| Thunderbird Tuft (Moderate), Thunderstrike; a foe's claw hits the caster | The nimbus for 10 rounds; the foe takes electricity damage |
| Wood-Rotted Root (Lesser), Oaken Resilience; 5 slashing to the caster | The DC 15 Fortitude card for the foe within 5 feet |
| Courier's Cryptex, Imaginary Lockbox | Its text whispered to the GM |
