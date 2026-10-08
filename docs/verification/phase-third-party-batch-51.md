# Third-party batch 51: Gruesome Marionettist

2026-10-07. The fifty-first batch of the third-party modules' spells.

## What changed

- **Gruesome Marionettist (Magic+)** (new `blood-marionette.js`, kind `marionette`; `effect-runtime.js`; `main.js`):
  - The caster names the prohibited and directed actions, from a dialog or `options.actions`.
  - The target rolls its Fortitude save against the spell DC. The item calls the save basic, but the text's own rows are used.
  - **The target's Effect** holds the result:
    - Critical success: unaffected.
    - Success: half the bleed, `floor((Nd10)/2)`, until the caster's next turn.
    - Failure: full bleed, for the sustained minute.
    - Critical failure: double bleed, `(Nd10)*2`, for the sustained minute.
    - N is 5, plus 1 per rank above 5th.
  - **The card's controls** (`marionetteAct`, also on the API):
    - The prohibited action taken applies the persistent bleed as PF2e's persistent damage.
    - The directed action taken makes the creature immune to it until the beginning of its next turn.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 50 | Batch 51 |
| --- | --- | --- |
| Effect | 81 | 82 |
| Not enabled | 19 | 18 |

Resolved: 209 of 227.

## Tests

`test/third-party-batch-51.test.js` (1). All 1,771 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-51-live-results.json), case `thirdPartyBatch51`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Failure at 6th; Stride prohibited | Sustained 1-minute Effect; persistent `6d10 bleed` |
| Strike (directed), then Stride | Immune: no bleed |
| Critical failure | Persistent `(6d10 * 2) bleed` |
| Success | Persistent `floor((6d10)/2) bleed`; Effect 1 round, not sustained |
| Critical success | Unaffected; no Effect |
