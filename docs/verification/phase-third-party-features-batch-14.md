# Third-party features batch 14: the table's cast riders, Embodiment

2026-10-07. The fourteenth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)).

## What changed

- **The table's** (`readPassiveCastRider`, `tableOnly`): features whose rule is the holder's or the GM's own doing. They are read, but nothing is applied at the cast:
  - a staff attuned in daily preparations (Prophet's Staff);
  - a slot regained after counterspelling (Magical Feedback);
  - a teamwork Ready (Spellshaping Synergy);
  - air underwater (Aquatic Spellcaster; the module's range rule kept);
  - holograms giving the subtle trait (Concealing Holograms);
  - the duo's position as the point of casting (Ranged Resonance);
  - another tradition's spell gaining the cursebound trait (Pantraditional Knowledge);
  - a spell held in a glyph (Glyph-Triggered Spell);
  - the Consulted Spell's stance (Consult Tome, Stance: Consult Tome);
  - a stance entered after a cast (Arcane Vitalization);
  - the Warping runes' new point of origin.
- **Embodiment** (a power ring rune), as a worn item's passive rider: a battle form (polymorph) gives the caster a status bonus to Strike attack rolls equal to the ring's item bonus, for the spell's duration.
  - Worn (and invested) equipment can now carry passive riders.
- **Effect: Embodiment Ring Rune:** the module's Effect gave an item bonus to every attack; its rules are now a status bonus to Strikes, from the text.
- **A guard:** the form lists of `plus-feature-rules.js` and `plus-spellshapes.js` are checked as the module loads. A missing comma between two forms, which made one of them disappear silently, now stops the load.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 13 | Batch 14 |
| --- | --- | --- |
| cast-rider | 20 / 66 | 31 / 66 |
| item-cast | 12 / 122 | 16 / 122 |

## Tests

`test/third-party-features-batch-14.test.js` (2). All 1,821 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-14-live-results.json), case `thirdPartyFeaturesBatch14`:

| Step | Result |
| --- | --- |
| A worn Power Ring (Silver) with its Embodiment rune; Animal Form at 2 from a slot | +2 status to Strike attack rolls for 10 rounds |
| Glyph-Triggered Spell on the same caster | Not among the cast's shapes (the table's) |
