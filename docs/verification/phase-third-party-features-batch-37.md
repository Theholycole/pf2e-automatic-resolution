# Third-party features batch 37: counteract features

2026-10-07. The first build from the spell-modifier triage ([audit](../planning/third-party-features-audit.md)).

## What changed

- **`scripts/plus-counteract-runtime.js`** (new):
  - `readCounteractFeature` reads four forms.
  - The feature's card posts a counteract card. Its button lists the targeted creature's candidates (asked when several), rolls the feature's modifier against the Effect's caster's DC, and compares ranks by PF2e's rule (`counteracts`). A success ends the Effect.
  - Snuff Out's other button opens the void basic-save card and makes the creature immune for a minute.
  - Spell Pyrophore's success opens the burn card: the first damage type, then the second as an extra-damage rider.
- **`main.js`** hooks it; **the census** reads it.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Tests

`test/third-party-features-batch-37.test.js` (1). All unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-37-live-results.json), case `thirdPartyFeaturesBatch37` (dice fixed at a natural 20).

| Step | Result |
| --- | --- |
| Dismiss Paltry Magic (18th) on a rank-3 spell Effect | Critical success — counteracted; the Effect gone |
| Oracle's Eyes on an illusion Effect granting Invisible | Counteracted; the Effect and Invisible gone |
| Snuff Out's creature button | The basic Fortitude card 6d6 void; immune |
| Spell Pyrophore (Minor) on a rank-1 spell Effect | Counteracted; the burn card DC 19 Fortitude, 1d4 fire with an extra 1d4 spirit |
