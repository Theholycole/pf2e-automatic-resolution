# Third-party batch 31: Unhelpful Nudge

2026-10-06. The thirty-first batch of the third-party modules' spells: a push with no table, and a second save only if the GM says the creature collided.

## What changed

- **Unhelpful Nudge (Magic+)** (`glyph-versions.js` `fitNudge`):
  - The text has no table. Under the user's ruling of 2026-10-03, a failure or critical failure gets the effect: a push of 10 feet. The caster chooses where, during the Stride (`direction: "chosen"`).
  - **The collision:** the failing rows carry a second Reflex save, asked of the GM first: "Was it pushed into another creature or object?" A failure on that save is Prone.
- **Gated second saves** (`basic-save-core.js`, `basic-save-runtime.js`):
  - A row's follow-up save can carry a GM-question gate. The question joins the row's other questions, and the second save opens only on a yes (`synchronizeSecondary`, re-run after the answer).
  - The card's snapshot keeps the gate.
  - The check accepts only a gate made of its question and source sentence.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 30 | Batch 31 |
| --- | --- | --- |
| Save | 63 | 64 |
| Not enabled | 40 | 39 |

Resolved: 186 of 227.

## Tests

`test/third-party-batch-31.test.js` (1). All 1,749 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-31-live-results.json), case `thirdPartyBatch31`, in the `pftest` world.

| Case | Result |
| --- | --- |
| Failure, the GM answers yes | The push note; the second save opened; a failure: Prone |
| Critical failure, the GM answers no | The push note; no second save; not Prone |
| Success | No push, no question |
