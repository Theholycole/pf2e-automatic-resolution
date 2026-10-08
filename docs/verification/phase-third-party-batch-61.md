# Third-party batch 61: Long Live the Revolution

2026-10-07. The sixty-first batch of the third-party modules' spells.

## What changed

- **Long Live the Revolution (Clerics+)** (new `rally-cry.js`, kind `rally-cry`; `effect-runtime.js`; `main.js`):
  - **The act of rebellion** (asked, or `options.act`) is held on the caster's Effect for the sustained duration. The Effect has the Sustain's control for newcomers.
  - **The saves** (`rallySaves`, also on the API) are PF2e's Will saves with the spell as origin, so incapacitation applies.
    - Willing creatures take a failure.
    - Creatures opposed to the act get +4 circumstance.
    - The critical successes so far give later savers +1 circumstance each, up to +4. This doesn't stack with the opposed +4.
    - Immune or already-rebelling creatures are skipped.
  - **A failure or critical failure:** the creature's Effect grants Fascinated, with +1 status to checks completing the act behind a toggle, and the attitude note. Its controls (`rallyAct`):
    - a new Will save after witnessing what it disagrees with: a success ends it;
    - another creature's successful Diplomacy or Intimidation ends it, except on a critical failure.
  - **Immunity:** 1 hour after a success, or after the effect ends through its controls.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 60 | Batch 61 |
| --- | --- | --- |
| Effect | 91 | 92 |
| Not enabled | 9 | 8 |

Resolved: 219 of 227.

## Tests

`test/third-party-batch-61.test.js` (1). All 1,781 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-61-live-results.json), case `thirdPartyBatch61`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 4th: critical success, success, failure, willing, critical failure | 1 cheer; immune; Fascinated; willing fails, Fascinated; Fascinated |
| Sustain: an opposed guard, a newcomer, the immune one | +4; +1 (the cheer); skipped |
| A rebel's doubt, success | Ended, not Fascinated, immune |
| Persuading the critical-failure rebel | Refused |
| Persuading the willing rebel | Ended |
