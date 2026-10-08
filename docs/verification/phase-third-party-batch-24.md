# Third-party batch 24: Propagating Arc, Warped Visage

2026-10-06. The twenty-fourth batch of the third-party modules' spells: a damage spread around a target, and a Sustain that frightens the target's allies.

## What changed

- **Propagating Arc (Magic+)** (new `propagating-arc.js`; `areaFollowUp` extended):
  - The target takes the item's 2d12 electricity (+1d12 per rank), with a basic Reflex save.
  - If the target fails (failure or critical failure), a card offers the spread to the other creatures around the target, not the target itself:
    - The text's `(@item.level)d6` electricity, rolled at the cast rank as a text formula. The card's spell item carries the target's 2d12, so the spread has its own formula.
    - A basic Reflex save.
    - Half for creatures further than 10 feet but within 20 feet. This uses the per-target `shapeHalf` from Split Shot, set by the new `halfTargetUuids` start option.
  - With no creature within 10 feet of the target, there is no spread (`none-within`).
  - The check for this spread (`outer`, `excludeCentre`, `needsInner`) requires basic saves and the sentence the compiler read (`basic-save-core.js`).
- **Warped Visage (Witches+)** (new `sustain-ally-save.js`; `sustainAllySave`):
  - On a failure the target is Enfeebled 1, or 2 on a critical failure, for as long as the spell is sustained. The Ongoing record holds the condition, and it ends with the spell.
  - On the first Sustain each turn, one of the failed target's allies within 30 feet attempts a Will save: Frightened 1 on a failure, 2 on a critical failure. It is then temporarily immune for 10 minutes.
    - The save is the text's own plan.
    - The ally is the one the caster names (by targeting it, or in the request); otherwise the only one there, or a dialog picks one (`ongoing-families.js`).
  - The critical failure's "creatures do not treat the target as an ally while frightened" is a GM note.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 23 | Batch 24 |
| --- | --- | --- |
| Save | 59 | 61 |
| Not enabled | 48 | 46 |

Resolved: 179 of 227.

## Tests

`test/third-party-batch-24.test.js` (2). All 1,742 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-24-live-results.json), case `thirdPartyBatch24`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Propagating Arc (rank 2), target fails | 2d12 electricity, 17 taken; the spread card posted |
| The spread, both failing | 2d6 electricity, 8: the creature 5 feet away took 8, the one 15 feet away 4, the one 30 feet away nothing |
| Target succeeds | No spread card |
| Target critically fails, no one within 10 feet | No spread (`none-within`) |
| Warped Visage (rank 3), failure | Enfeebled 1; Ongoing record with the ally save |
| Round 2 Sustain, ally 10 feet away named | That ally's Will save card only; a failure: Frightened 1 and immune |
| Spell ended | Enfeebled removed |
