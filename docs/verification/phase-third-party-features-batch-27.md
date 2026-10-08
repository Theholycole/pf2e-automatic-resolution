# Third-party features batch 27: essence casting, the encounter

2026-10-07. The first batch of Magic+'s essence casting ([audit](../planning/third-party-features-audit.md)), under the user's "Automate the system".

## What changed

`scripts/essence-runtime.js`, hooked in `main.js`, adds to what Magic+'s own script does with the essence pool:
- **`essenceOnCast`:** each cast by an essence caster, read with the pool from before it.
  - A full caster's 2- or 3-action essence spell at a full pool completes a cycle, and the caster's terminus applies (`terminusFor`): its Effect with the encounter's cycle as badge, asked among several termini, Renewal and Ultima under their requirements.
  - A 1-action, reaction or free essence spell is counted as a leak.
  - A draw cantrip after a cycle or a leak, without Essence Rebirth, is undone.
- **`essenceOnCombatStart`:** the pool to 0, or to the essence draw with Initial Draw; the encounter's record.
- **`essenceOnCombatEnd`:** "All essence spells end as soon as the encounter ends." — the Effects from the casters' essence spells and the encounter's termini removed, the module's ongoing records from those spells ended, the pools to 0.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Tests

`test/third-party-features-batch-27.test.js` (1). All 1,848 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-27-live-results.json), case `thirdPartyFeaturesBatch27`. Re-run (combat hooks changed): `thirdPartyFeaturesBatch20` and `rank5Batch86`, which still pass.

A 7th-level full essence caster (pool 4, draw 2) with Terminus of Power, in combat:

| Step | Essence |
| --- | --- |
| Combat starts (the pool was 3) | 0 |
| Electric Arc (a draw cantrip) | 2 |
| Breathe Fire at 2, then at 3 | 3, 4 |
| Breathe Fire at 4 | 0: cycle 1, Effect: Terminus of Power at cycle 1 |
| Electric Arc, no Essence Rebirth | 0 (refused) |
| Electric Arc, with Essence Rebirth | 2 |
| Mystic Armor at 1 | 3; its Effect on the caster |
| Sure Strike (1 action) | 0; a leak counted |
| Combat ends | 0; Mystic Armor's Effect and the terminus gone |
