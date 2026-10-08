# Third-party features batch 21: Celestial Shift and Aberration Shift

2026-10-07. Found during the aspect work ([audit](../planning/third-party-features-audit.md)): two third-party spells that had compiled as notes.

## What changed

- **`normalizeLegacyLinks(item, catalog)`** (`compile-ability.js`): a module's Effect linked without its name ("@UUID[Compendium.pf2e-team-plus-magic.misc.GNSz5ksf9fux0j7u]") is named from the native Effect catalog, when the catalog knows that id as an Effect ("Spell Effect: …" or "Effect: …"). It's then read as the module's other Effect links are.
- **Celestial Shift** and **Aberration Shift** (Magic+) now apply their aspect battle form Effects, as the other 13 aspect forms do. They had been note-only.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227, now note 51 and effect 102 (was 53 and 100).

## Tests

`test/third-party-features-batch-21.test.js` (1). All 1,834 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-21-live-results.json), case `thirdPartyFeaturesBatch21`. An 8th-level divine caster, each spell at 4, each form's choices answered with their first option:

| Step | Result |
| --- | --- |
| Celestial Shift (angel) | effect route; Spell Effect: Celestial Shift (Angel) |
| Aberration Shift (eldritch) | effect route; Spell Effect: Aberration Shift (Eldritch Aspect) (Flier); the granted Aberrant Lair's own choice prompted by PF2e (answered) |
