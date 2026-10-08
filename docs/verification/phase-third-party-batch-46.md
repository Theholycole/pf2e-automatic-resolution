# Third-party batch 46: proxy spells

2026-10-07. The forty-sixth batch of the third-party modules' spells: spells whose effect is another spell's.

## What changed

- **New kind `proxy-cast`** (new `proxy-cast.js`; `compile-ability.js`; `runtime-core.js`; `effect-runtime.js`). The caster picks the spell. The module then resolves it by its own route: Ongoing family, lingering area, Effect or save card.
- **Coalesce Form (Magic+):** the daily "anatomical configuration" is asked when cast. The choices are the polymorph spells of PF2e and the "+" modules, cast at Coalesce Form's rank.
- **Untamed Aspect Shift (Magic+):**
  - The choices are the spells the text names: Pest Shift, plus Animal Shift from 2nd rank. Each is cast at this spell's rank.
  - The +2 status bonus for using your own attack modifier is a toggle on the caster for the form's time.
  - Shapes added by druid feats are the GM's.
- **Witch's Bottle (Witches+):**
  - The choices are the caster's own hex spells, cast on the triggering target at their own rank.
  - The caster becomes Slowed 1 for a two-action hex, or Slowed 2 for a three-action hex, until the end of its next turn.
  - The Sustain line is a note.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 45 | Batch 46 |
| --- | --- | --- |
| Effect | 73 | 76 |
| Not enabled | 25 | 22 |

Resolved: 203 of 227.

## Tests

`test/third-party-batch-46.test.js`. All 1,764 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-46-live-results.json), case `thirdPartyBatch46`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Untamed Aspect Shift, rank 1 | Pest Shift picked; its Effect applied, plus the RollOption + FlatModifier toggle |
| Coalesce Form, rank 1 | Pest Form picked; Spell Effect: Pest Form applied |
| Witch's Bottle with Evil Eye (1 action) | The hex's card prepared; caster not Slowed |
| Witch's Bottle with Malicious Shadow (2 actions) | The hex started; caster Slowed 1 |
