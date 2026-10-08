# Third-party batch 27: Hope Prevails

2026-10-06. The twenty-seventh batch of the third-party modules' spells: lowering a condition, with versions by the number of actions spent.

## What changed

- **Hope Prevails (Clerics+)** (new `condition-lower.js`; new resolution kind `condition-lower`; the `action-versions` card asks how many actions were spent):
  - All versions lower Frightened by 2.
  - **1 action:** the touched target.
  - **2 actions:** a target within 30 feet. It also gets the module's Effect: a +2 status bonus to saves against fear for 1 minute. The Effect is proved against its sentence when compiling and again from the live template.
  - **3 actions:** every creature within the caster's 30-foot emanation.
  - A frightened condition granted by an Effect (an ongoing effect's) is kept. The card offers the GM's counteract against it (the existing note-counteract button), as the text's "you can attempt to counteract a single fear effect".

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 26 | Batch 27 |
| --- | --- | --- |
| Effect | 61 | 62 |
| Not enabled | 44 | 43 |

Resolved: 182 of 227.

## Tests

`test/third-party-batch-27.test.js` (1). All 1,745 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-27-live-results.json), case `thirdPartyBatch27`, in the `pftest` world.

| Version | Result |
| --- | --- |
| 1 action, Frightened 3 | Frightened 1 |
| 2 actions, Frightened 2 | Removed; the module's Effect (+2 status to saves, fear, 1 minute) |
| 3 actions | Two creatures within 30 feet: Frightened 1 and 2 removed; one 60 feet away keeps Frightened 2 |
| 1 action, frightened granted by an Effect | Kept; the card offers the counteract |
