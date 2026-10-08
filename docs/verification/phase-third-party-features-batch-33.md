# Third-party features batch 33: cast riders

2026-10-07. The first of the cast-rider triage ([audit](../planning/third-party-features-audit.md)).

## What changed

- **Arcane Generator and Transmogrification Boost** (Inventors+):
  - A PASSIVE form in `plus-feature-rules.js`, needing a save, damage, no duration and a single target (`hasSave` is new in `unmetRequirement`).
  - The `borrowed-damage` rider adds the caster's Overdrive (PF2e's Effect: Overdrive) or Offensive Boost damage on the first failure, doubled on a critical failure.
- **Essence Strike** (Magic+): the `essence-strike` action kind. Its card makes a RollTwice Effect for the next spell attack roll this turn and 10 minutes' immunity to Sure Strike, and is refused while that immunity lasts.
- **Essence Mystic Dedication** (Magus+): the `havok-choice` rider. A conflux spell (a magus focus spell: the `conflux` trait alias) is given the havok trait at the caster's choice, and the module's Effect is put on (toggle on, until the next turn). Havok Cascade's damage doubles under it.
- **Geojibom's Guidance** (Tian Xia+): the NAMED item cast reads "once per day, plus overcharge". After Revealing Light, the caster gets a TokenLight Effect for a minute, with the Detect Magic note.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged. cast-rider is now 37 of 66; the rest are triaged in the audit.

## Tests

`test/third-party-features-batch-33.test.js` (2). All 1,858 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-33-live-results.json), cases `thirdPartyFeaturesBatch33` and `thirdPartyFeaturesBatch25` (Havok Cascade, re-run, still passing).

A 7th-level caster with Overdrive (a success) and Offensive Boost (fire):

| Step | Result |
| --- | --- |
| Void Warp at 4 at a foe, a failure | +1d6 fire (Offensive Boost), +2 void (Overdrive) |
| A critical failure | +(1d6)×2 fire, +4 void |
| Essence Strike, then Hydraulic Push's attack | RollTwice on spell-attack-roll, spent by the roll; immune to Sure Strike; a second use refused |
| Force Fang at 4 under Havok Cascade, given the havok trait | 14 damage taken (2 × level); the Effect's toggle on |
| Geojibom's Guidance's cast button | Revealing Light cast; TokenLight 10/20 for 10 rounds |
