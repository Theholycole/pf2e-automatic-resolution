# Third-party features batch 40: slot, heal and surge features

2026-10-07. The last builds from the spell-modifier triage; the rest is recorded in the [audit](../planning/third-party-features-audit.md).

## What changed

- **Consume Item Magic (Wizards+):** the `consume-item-slot` action. A held magical consumable is consumed (asked if several), and a spent slot up to half its level sharing a trait with it is given back (asked if several).
- **Vital Pululation (Oracles+):** the `free-heal` action. With cursebound 2+ in an encounter, it opens PF2e's 3-action Heal at the second highest rank through the caster's entry, with no slot spent and the oracle excluded.
- **Ancient Surge and Bizarre Surge (Summoners+):** `surgeAddonOnCreate`. When Evolution Surge's Spell Effect is put on a creature, the caster's surge feats add their Spell Effects with the same duration; their choice is the Effect's prompt.
- **The audit** records the triage's remaining entries: the ability module's, the table's, and PF2e's data.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Tests

`test/third-party-features-batch-40.test.js` (1). All unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-40-live-results.json), case `thirdPartyFeaturesBatch40`.

| Step | Result |
| --- | --- |
| A 10th-level wizard with Fireball spent at rank 3, holding a level-6 magical fire consumable: Consume Item Magic | Fireball prepared again; the consumable gone |
| A 12th-level oracle (cursebound 2) in an encounter: Vital Pululation | The Heal card at rank 5 for the creatures within 30 feet, the oracle not among them; no slot spent |
| Evolution Surge's Effect on a summoner's eidolon | Spell Effect: Ancient Surge (Tremorsense) beside it |
