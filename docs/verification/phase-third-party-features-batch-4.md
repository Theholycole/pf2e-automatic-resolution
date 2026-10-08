# Third-party features batch 4: the mystic duo and Ally Form

2026-10-07. The fourth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)). It covers Magic+'s mystic duo spellshapes and Ally Form, which send a spell's benefit to another creature.

## What changed

- **The mystic duo** (`spellshape-runtime.js`):
  - `mysticLinkEffect` finds Magic+'s Effect: Mystic Link.
  - `mysticDuoOf` finds the duo: the other creature on the scene holding a link. It looks for the link the caster made, then the creature that made the caster's link, then the only linked creature.
  - A "Requirements Your mystic link is active" is now checked (`mysticLink`). Whatever else the Requirements says stays the table's.
- **`plus-spellshapes.js`**, five new forms:
  - **Eldritch Resilience:** the module's Effect on the duo. Its temporary Hit Points are the rank times 2 (times 1 for a cantrip), and the Effect is tied to the duo's link.
  - **Spell and Steel:** damage added to the spell's, scaled with each save: twice the rank (the rank for a cantrip). Its type is the duo's weapon's, asked at the cast.
  - **Linked Target Spell:** needs a cantrip, or a spell at least 1 rank below the highest. The spell's self Effect goes to the duo instead, tied to the link; using it again ends the earlier one.
  - **Twinned Target Spell:** needs a spell at least 2 ranks below the highest. The self Effect goes to both, the duo's tied to the link.
  - **Ally Form:** needs a battle form (polymorph) from a slot. The form's Effect goes to an adjacent ally (asked), lasting at most 1 minute.
- **Effect route** (`effect-runtime.js`): a self-only Effect asks `shapeSelfRecipients` for its recipients, and `shapeSelfAfter` ties, caps or ends the copies.

The modules' own rules on these spellshapes only add text. The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 3 | Batch 4 |
| --- | --- | --- |
| spellshape | 21 / 51 | 26 / 51 |

## Tests

`test/third-party-features-batch-4.test.js` (3). All 1,802 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-4-live-results.json), case `thirdPartyFeaturesBatch4`, in the `pftest` world. A 10th-level caster and its duo, linked with Magic+'s Effect:

| Step | Result |
| --- | --- |
| Eldritch Resilience without a link | Refused: the mystic link isn't active |
| Eldritch Resilience, Fireball at 3 | 6 temporary Hit Points on the duo; the Effect gone when the link ends |
| Spell and Steel, Fireball at 3, the foe failing (the duo's longsword) | 18 + 6 slashing = 24 |
| Linked Target Spell, Mystic Armor at 1 | On the duo, not the caster; tied to the link. A second use leaves one |
| Twinned Target Spell, Mystic Armor at 1 | On both; the duo's gone with the link |
| Ally Form, Animal Form (ape) at 2 | The adjacent ally's form, 1 minute; the caster's none |
