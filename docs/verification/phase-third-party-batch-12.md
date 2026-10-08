# Third-party batch 12: Ruler of Everything, Web of Darkness, Divine Adjudication

2026-10-06. The twelfth batch of the third-party modules' spells.

## What changed

- **Ruler of Everything (Clerics+)** (`save-preamble.js`, `third-party-rows.js`):
  - "Regardless of the result, creatures are temporarily immune to this spell for 10 minutes." is read as the spell's immunity; "creatures are" is now a recognised subject.
  - "Creatures that are of nobility themselves or that serve nobility directly … receive a +2 circumstance bonus to their saves." is the GM's question for each creature.
  - On each failing row, Drop Prone gives PF2e's Prone. The rest is GM-played notes until their ends happen:
    - the success's rebuking reaction;
    - the hostility restriction;
    - the critical failure's Stand restriction.
- **Web of Darkness (Oracles+)**:
  - The –5 and –10 foot circumstance penalties are PF2e's `all-speeds` modifier, in a note for the sustained spell.
  - The failure's 30-foot tether, and the way out, are the GM's. The way out is Escaping against the spell DC, or cutting free: the strands' AC and Hit Points are given at the cast rank (`rankAmount`), with the text's Heightened (+1) step checked.
  - Immobilized lasts the spell.
  - The module's own Effect differs from the text (a data note).
- **Divine Adjudication (Clerics+)**:
  - The rows' half, full and double damage are compiled.
  - The caster's +1 to attack rolls depends on the creature's acts against the deity, which only the GM knows. It is a GM-played note on the creature for the minute.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 11 | Batch 12 |
| --- | --- | --- |
| Save | 46 | 49 |
| Not enabled | 72 | 69 |

## Tests

`test/third-party-batch-12.test.js` (3). All 1,717 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-12-live-results.json), case `thirdPartyBatch12`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Ruler of Everything, rank 4, a noble, critical failure | The +2 answered; Prone; the Stand note; temporary immunity |
| Web of Darkness, rank 6 | Failure: −10 to Speeds, the strands at AC 30 and 30 HP. Critical failure: Immobilized |
| Divine Adjudication, failure | Full damage taken; the GM's note |
