# Third-party batch 49: Instant Surgery

2026-10-07. The forty-ninth batch of the third-party modules' spells.

## What changed

- **Instant Surgery (Wizards+)** (new `instant-surgery.js`, kind `attribute-surgery`; `effect-runtime.js`):
  - The caster's spell attack is rolled against the target's AC.
  - It gets +2 circumstance while the caster holds View Internal Anatomy's Effect aimed at that creature.
  - **The picks:** a dialog, or `options.attributes`.
    - A critical hit: two different attributes, each boosted or depleted.
    - A hit: one of each. A pick that breaks this is refused.
  - **The result:** the target's Effect for 1 minute, with a status FlatModifier on each attribute's `-based` selector: ±1, or ±2 from 8th rank (Heightened).
  - The willing creature's Aid with Medicine is a note.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 48 | Batch 49 |
| --- | --- | --- |
| Effect | 79 | 80 |
| Not enabled | 21 | 20 |

Resolved: 207 of 227.

## Tests

`test/third-party-batch-49.test.js` (1). All 1,769 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-49-live-results.json), case `thirdPartyBatch49`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Critical hit at 4th: Strength and Wisdom boosted | "Strength +1, Wisdom +1"; Athletics +1 |
| Hit at 8th: Dexterity boosted, Constitution depleted | "Dexterity +2, Constitution –2"; Fortitude –2 |
| Hit asking for two boosts | Refused |
| View Internal Anatomy's Effect aimed at the patient | The attack shows +2 circumstance; a miss gives no Effect |
