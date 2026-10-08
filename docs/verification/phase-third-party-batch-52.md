# Third-party batch 52: Mind's Eye Wink

2026-10-07. The fifty-second batch of the third-party modules' spells.

## What changed

- **Mind's Eye Wink (Oracles+)** (new `dream-hazard.js`, kind `dream-hazard`; `effect-runtime.js`; `note-effects.js`; `ongoing-families.js`; `basic-save-core.js`):
  - The caster picks the area or the object (`options.branch`, or asked).
  - **Area:** the text is rewritten into a lingering Will save for each creature in the GM's drawn squares when cast, or entering them. It runs through the usual lingering workflow (`startLingering`).
    - A failure gives Stupefied 1 while inside and for 1 round after leaving (`whileInArea`, `afterLeaveRounds`).
    - A critical failure gives Stupefied 2 while inside, then Stupefied 1 for that round. A new note option, `afterLeaveRules`, swaps the Effect's grants when the creature leaves.
    - Disbelief after a Seek is the area's Perception control (lingering `disbelief`).
  - **Object:** the holder's Will save is rolled on the card (decision 2026-10-01). A failure gives −1 circumstance to checks that use the object, −2 on a critical failure, behind a "Using the object" toggle for the minute.
  - The validators accept the drawn area and the disbelief from this spell's evidence.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 51 | Batch 52 |
| --- | --- | --- |
| Effect | 82 | 83 |
| Not enabled | 18 | 17 |

Resolved: 210 of 227.

## Tests

`test/third-party-batch-52.test.js` (1). All 1,772 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-52-live-results.json), case `thirdPartyBatch52`, in the `pftest` world.

| Step | Result |
| --- | --- |
| The area in drawn 2×2 squares, two foes inside | Critical failure: Stupefied 2; failure: Stupefied 1 |
| The critical-failure foe leaves | Stupefied 1, its Effect 1 round; the other still Stupefied 1 inside |
| The object: its holder fails | −1 circumstance Effect (RollOption toggle + FlatModifier) |
