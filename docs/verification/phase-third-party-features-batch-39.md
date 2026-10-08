# Third-party features batch 39: hex familiar abilities

2026-10-07. The 17 witch familiar abilities that act "When you Cast or Sustain a hex" ([audit](../planning/third-party-features-audit.md)).

## What changed

- **`scripts/plus-hex-familiar-runtime.js`** (new): `readHexFamiliar` sorts each ability into a mode. `hexFamiliarOnCast` (hooked in `main.js`) runs the witch's abilities on a hex cast or PF2e's Sustain card, then whispers a summary to the GM.
  - aura: the module's Effect on the creatures within the distance of the familiar, the witch excluded.
  - target, familiar, familiar-and-target: the module's Effect on the targeted creature and/or the familiar.
  - target-condition: Sunlit Dawn's dazzled until the witch's next turn.
  - target-choice: Reprising Melody (frightened reduced, or deafened).
  - target-push: Stumbling Steps, 5 feet away from the familiar for an off-guard creature, or off-guard when it can't move.
  - note: a GM reminder in words.
  - Each ability runs on its own: one failing doesn't stop the rest.
- **The census** reads `readHexFamiliar`.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Tests

`test/third-party-features-batch-39.test.js` (1). All unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-39-live-results.json), case `thirdPartyFeaturesBatch39`. A witch with seven familiar abilities casts Evil Eye at a foe (off-guard, frightened 2) standing 5 feet from the familiar:

| Ability | Result |
| --- | --- |
| Churning Saltwater | Its Effect on the foe (the witch, 10 feet away, excluded) |
| Sunlit Dawn | The foe dazzled |
| Reprising Melody (reduce) | Frightened 2 → 1 |
| Stumbling Steps | The foe pushed 5 feet |
| Murky Worlds | Its Effect on the foe |
| Keen Senses+ | Its Effect on the familiar (scent chosen) |
| Ticking Parts | The GM's reminder |
