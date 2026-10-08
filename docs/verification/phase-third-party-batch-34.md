# Third-party batch 34: Enchanting Rhapsody

2026-10-06. The thirty-fourth batch of the third-party modules' spells: an aura whose rows last while the creature is in it and for a round after it leaves.

## What changed

- **Enchanting Rhapsody (Oracles+)** (new `rhapsody-aura.js`):
  - The caster's 20-foot emanation. Enemies in it when the spell is cast, or ending their turns in it, attempt a Will save.
  - Each row is a note while the creature is in the area and for 1 round after it leaves:
    - **Success:** −1 status to saves against mental effects.
    - **Failure:** −2, and Fascinated (granted by the note).
    - **Critical failure:** as failure, and the first-action dance (Perform) is a GM note.
  - A critical success is temporarily immune for 1 minute.
  - The module's own Effect picks its row through roll options of its own, so the module builds the rows from the text.
- **"And for 1 round after":** the area's note can carry `afterLeaveRounds` (`note-effects.js`). When the creature leaves, the note runs that many rounds more instead of ending (`ongoing-families.js` `clearLeaveArea`).
- **Note rules:** a status penalty to saves against effects of one trait is now an accepted note rule (`validRowNoteRule`).

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 33 | Batch 34 |
| --- | --- | --- |
| Ongoing | 6 | 7 |
| Not enabled | 37 | 36 |

Resolved: 189 of 227.

## Tests

`test/third-party-batch-34.test.js` (1). All 1,752 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-34-live-results.json), case `thirdPartyBatch34`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A foe fails | −2 to mental saves; Fascinated |
| A foe succeeds | −1; not Fascinated |
| A foe critically succeeds | Immune; no note |
| The failed foe leaves the area | Its note now lasts 1 round; still Fascinated |
