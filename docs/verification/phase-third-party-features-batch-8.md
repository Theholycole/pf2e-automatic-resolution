# Third-party features batch 8: the Power Ring runes

2026-10-07. The eighth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)).

## What changed

- **Hone Spell** (Precision rune): needs an area spell with a Reflex or Fortitude save.
  - On the card, the caster picks one target and the others are excluded (`assignShapeTargets`).
  - That target's save is replaced by the caster's spell attack against its AC, with the power ring's item bonus. A critical hit counts as a critical failure, a hit as a failure, and a miss as no effect (a critical success). This is a new branch in `basic-save-runtime.js`'s `rollSave`.
- **Veracious Summon** (Calling rune): needs a summon spell. The summoned creature gets a status bonus to its Strikes equal to the power ring's item bonus, through the summon route's new `shapeSummonedAfter` hook.
  - "You cannot use Veracious Spell until the summon spell ends" is the table's.
  - The module's Effect gives the bonus to every attack roll and reads the ring's flag, so the text's Strikes-only bonus is built instead.
- **`powerRingBonus`:** the best Veracious Spell item bonus among the power rings the caster wears invested.

On the honed attack, PF2e also shows the ring's own Veracious Spell modifier. Both are item bonuses, so only one applies.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 7 | Batch 8 |
| --- | --- | --- |
| item-cast | 10 / 122 | 12 / 122 |

## Tests

`test/third-party-features-batch-8.test.js` (1). All 1,808 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-8-live-results.json), case `thirdPartyFeaturesBatch8`, in the `pftest` world. A 10th-level caster wearing Power Ring (Silver), invested:

| Step | Result |
| --- | --- |
| Hone Spell, Fireball at 3 on two foes (AC 5), the first picked | The second excluded; the caster's attack with "power ring +2" a critical hit, read as a critical failure: 56 damage (2 × 28); the second 0 |
| Veracious Summon, Summon Animal at 1 | The Swamp Beetle +2 status to Strikes |
