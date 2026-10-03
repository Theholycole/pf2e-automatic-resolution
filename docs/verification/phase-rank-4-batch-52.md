# Rank 4 batch 52 — Call the Blood

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Call the Blood (4) | 8d4 void (+2d4 a rank), basic Fortitude, against 1 living creature. If the target lost Hit Points, the card's button gives the caster its part. A living caster without void healing becomes Sickened 2. An undead or void-healing caster picks either half that damage as temporary Hit Points (lost after 1 minute) plus Quickened for 1 round, or Quickened for 1 minute. Either way, the extra action is limited to Step, Stride or Strike (a note). |

## Rules

- **Blood draw (`src/compiler/blood-draw.js` `rewriteBloodDraw`):**
  - It reads the damage sentence (the item's one entry) and the five sentences of the caster's part.
  - It writes the target's plain save and `resolution.casterDraw`.
- **Validator:** `isCasterDraw` in `basic-save-core.js`.
- **Runtime (`basic-save-runtime.js` `drawBlood`):**
  - It reads what the target lost from the damage receipts, and the caster's PF2e mode of being and void healing.
  - Sickened goes through PF2e's `increaseCondition`.
  - Quickened is a timed condition grant, with a note for the action limit.
  - The temporary Hit Points come from an Effect carrying PF2e's TempHP rule, so they're removed when it ends.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-52.test.js` is new. Its negative cases are another wording (not read) and a changed fraction (not executable).

A whole-corpus compile (b501 → b502) changed only Call the Blood.

## Evidence

[Live evidence](phase-rank-4-batch-52-live-results.json), case `rank4Batch52`, in the `pftest` world, at 5th rank (10d4 void).

| Caster | Result |
| --- | --- |
| Living, the target failed (26 lost) | Sickened 2 |
| Undead, the target failed (25 lost), picked temporary Hit Points | 12 temporary Hit Points (a 1-minute Effect), Quickened for 1 round |

**Cleanup:** fixtures removed.
