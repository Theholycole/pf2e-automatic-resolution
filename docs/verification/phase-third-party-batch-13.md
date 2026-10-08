# Third-party batch 13: Beguile, Dream Come True

2026-10-06. The thirteenth batch of the third-party modules' spells.

## What changed

- **Beguile (Witches+)** (`third-party-rows.js`):
  - The caster picks voice or appearance on the card.
  - On a failure or critical failure, Fascinated plus the pick's condition (Dazzled for appearance, Deafened for voice) last the sustained spell (`optionConditionRows`).
  - A GM-played note says a hostile action by the caster against the creature or its allies ends them.
  - The critical failure's note adds the GM's parts:
    - it can't take hostile actions against the caster;
    - the turn-start Will save;
    - the Step or Stride toward the caster;
    - the adjacency's Off-Guard.
  - A reminder names the spell's trait (visual or auditory) by the pick.
- **Dream Come True (Oracles+)**:
  - The caster picks fantasy or nightmare on the card. Each pick is a set of entries on every row (`optionSetRows`).
  - Off-Guard lasts the row's time.
  - Fantasy: Stupefied lasts while the creature is off-guard (it ends with the Off-Guard).
  - Nightmare: Frightened, with a note holding its floor of 1 for the Off-Guard's time (`conditionFloor`).
  - Critical failure: Stupefied 2 or Frightened 2. Fantasy adds Fascinated until disbelieved; nightmare adds a note that holds Confused while it's frightened (`whileCondition`).
  - Disbelief is a GM-played note.
  - The item's duration "varies" and each row states its own time, so the cast itself is instantaneous (`rowDurations`).

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 12 | Batch 13 |
| --- | --- | --- |
| Save | 49 | 51 |
| Not enabled | 69 | 67 |

## Tests

`test/third-party-batch-13.test.js` (2). All 1,719 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-13-live-results.json), case `thirdPartyBatch13`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Beguile, voice, failure | Fascinated and Deafened (not Dazzled); the GM's note |
| Dream Come True, rank 6, fantasy, success | Off-Guard and Stupefied 1, no Frightened; Off-Guard removed, Stupefied went with it |
| Dream Come True, rank 6, nightmare, critical failure | Frightened 2, Confused, the floor note; no Stupefied |
