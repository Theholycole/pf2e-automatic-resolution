# Third-party features batch 3: targets, areas and damage types

2026-10-07. The third batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)): seven spellshapes that change who the spell reaches, its area, or its damage.

## What changed

- **`plus-spellshapes.js`**, seven new forms:
  - **Safe Spell** (Feats+): the caster picks up to 2 allies among the targets, plus one at 10th level and every 4 levels after. Those allies are excluded from the spell.
  - **Compressed Spell** (Wizards+): the caster picks one creature in the area; the others are excluded. That creature takes a −2 status penalty to its save, or −3 when the burst, cone or line is over 30, 45 or 60 feet. The penalty is removed once the card is finished.
    - The module's own Effect makes the −3 untyped and lasting, so the text's penalty is used instead.
  - **Reshaped Spell** (Feats+): the cast's template changes shape. A cone becomes a 5-foot-wide line twice its length; a line becomes a cone half its length.
  - **Huddle Channel** (Clerics+): checks a 1-action Harm or Heal on one creature. Applying PF2e's roll to the second creature is the table's.
  - **The Lurking Storm** (Oracles+): the rolled damage is split, half bludgeoning and half electricity. Persistent damage is kept apart.
  - **Sacrificial Spell** (Oracles+): a d12 rule for Heal's healing, on the caster. It is removed with the spell's next damage or healing roll.
  - **Transmute Spell** (Feats+): the essence and type are asked at the cast, among those whose damage the spell deals:
    - Matter: physical becomes acid, cold, electricity or fire.
    - Mind: energy becomes mental, plus mental damage equal to the rank.
    - Spirit: physical becomes spirit, and no damage to a creature without a weakness to holy, spirit or unholy.
    - Life: energy becomes vitality or void.
- **Runtime:**
  - `assignShapeTargets` gained `exclude-allies`, `compress` and Spirit's no-damage targets.
  - `shapeTypeSwapFor` gained `transmute`.
  - New `shapeSplitFor`, applied to the card's roll.
  - `widenCastTemplate` gained `reshape`.
  - `self-rules` gained `untilRoll`, with a new `shapeRollSpent` hook in `main.js`.

The modules' own rules for these spellshapes don't double the riders:
- Transmute Spell's and Sacrificial Spell's `DamageDice` overrides wait for options the cast never sets once the selector is off.
- The rest only add text.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 2 | Batch 3 |
| --- | --- | --- |
| spellshape | 14 / 51 | 21 / 51 |

## Tests

`test/third-party-features-batch-3.test.js` (3). All 1,799 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-3-live-results.json), case `thirdPartyFeaturesBatch3`, in the `pftest` world. A 10th-level caster:

| Step | Result |
| --- | --- |
| Safe Spell, Fireball at 3 on two foes and two allies | The allies excluded (0 damage); the foes 20 each |
| Compressed Spell, Breathe Fire on two foes, the first picked | −2 status to its save during the card, gone after; the second excluded |
| Reshaped Spell, Breathe Fire's 15-foot cone template | Placed as a 30-foot line |
| The Lurking Storm, Lightning Bolt at 3 | 27 split: 14 bludgeoning, 13 electricity |
| Sacrificial Spell, Heal at 1 | PF2e rolls 1d12; the rule gone after |
| Transmute Spell, Matter: fire on Pummeling Rubble | Fire damage |
| Transmute Spell, Mind on Fireball at 3 | 25 mental, and 3 mental more (28) |
| Transmute Spell, Spirit on Pummeling Rubble, a foe without the weakness | No damage |
