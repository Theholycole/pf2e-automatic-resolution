# Third-party features batch 29: essence casting E3a

2026-10-07. The third batch of Magic+'s essence casting ([audit](../planning/third-party-features-audit.md)): incantations and the essence items.

## What changed

All in `scripts/essence-runtime.js`, hooked in `main.js`:
- **`readEssenceActivation`:** the Incantations action and the bell's, amulet's and chalice's activations, read from their texts.
- **`essenceActivationOnCard`:** the card arms the next essence spell.
  - It refuses an incantation during an encounter and an item used twice in a day.
  - It opens the pool for an incantation and asks normal or long.
- **`essenceArmedCast`:** that cast.
  - The pool is put back.
  - A normal incantation adds 1 to Maintaining Incantations, unless Incantation Mastery applies.
  - A new incantation ends the earlier long one.
  - The chalice's healing is free for that cast.
- **`incantationsOnRefocus`:** Refocus asks whether to dismiss the incantations, then gives back the reductions of those ended, dismissed or without a duration.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Tests

`test/third-party-features-batch-29.test.js` (1). All 1,850 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-29-live-results.json), case `thirdPartyFeaturesBatch29`. Re-run: `thirdPartyFeaturesBatch28` and `thirdPartyFeaturesBatch7`, which still pass.

A 7th-level divine essence caster (pool 4, draw 2) with Incantations, Incantation Mastery and Life Essence Reservoir, a Magic Bell and a Magic Chalice:

| Step | Result |
| --- | --- |
| Incantation, then Breathe Fire at 1 (Mastery: below the draw, no duration) | The pool opened to 4, put back to 0; no reduction |
| Incantation, then Mystic Armor at 1 | The pool back to 0; Maintaining Incantations 1; the armor's Effect |
| Refocus (dismiss) | Maintaining Incantations gone; the armor ended |
| In combat: Incantations | Refused: not during an encounter |
| The bell, then Breathe Fire at 1 | The pool opened to 4, back to 0; no reduction |
| The bell again | Refused: already used today |
| The chalice, then Heal; 10 healing to an ally at 5 (reservoir 12) | The ally at 15; the reservoir still 12 |
