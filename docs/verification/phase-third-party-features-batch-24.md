# Third-party features batch 24: Magus+ Spellstrike features

2026-10-07. The third Magus+ batch ([audit](../planning/third-party-features-audit.md)).

## What changed

- **Whirling Wand Strike** (`plus-spellshapes.js`): a spell from a wand (the new `fromWand` fact), the Spellstrike asked (`ask`). If yes, it's delivered, with +half the rank as a status bonus to the Strike's damage (`selfRules`, `halfRank`).
- **Eat This!**: delivered, with the module's eat-this toggle on for the Strike and off after it (`rollOption`), and the scatter damage noted.
- **`readSpellstrikeFeature`** (`plus-feature-rules.js`):
  - The permissions: Second-Hand Wand (wands) and Horizon Spellshell, Starlit Span+, Flinging Figments (ranged Strikes).
  - Dealer of Death's card draw: on the first Strike of any of the caster's Spellstrikes (`spellstrikeFeatures` in `spell-actions-runtime.js`), with a deck weapon and a damaging spell: 1d6 on the text's table, and a match adds the rank (or half the level for a cantrip) of that type to the Strike's damage.
  - Slide Slice's reminder on a critical hit.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Census

| Family | Batch 23 | Batch 24 |
| --- | --- | --- |
| spellstrike-cascade | 8 / 73 | 16 / 73 |

## Tests

`test/third-party-features-batch-24.test.js` (3). All 1,843 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-24-live-results.json), case `thirdPartyFeaturesBatch24`. Re-run: `thirdPartyFeaturesBatch23` and `spellshapeBatch17` (wand spellshapes), which still pass.

| Step | Result |
| --- | --- |
| Whirling Wand Strike, then the wand's Fear | Spellstruck (delivered); the bonus +0 at rank 1 |
| Whirling Wand Strike, then Ignition (no wand) | Unmet: "it isn't cast from a wand" |
| Eat This!, then Ignition | The eat-this toggle on; the note "rank 5"; off after the Strike |
| Living Grimoire's Spellstrike with the Infused Deck (the draw fixed at 2) | Keys (fire): +5 fire to the Strike's damage; Slide Slice offered on the critical hit |
