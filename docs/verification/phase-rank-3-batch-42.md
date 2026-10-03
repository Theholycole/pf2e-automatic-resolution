# Rank 3 batch 42 — Trade Items

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Trade Items (3) | A spell note. It's instantaneous, so the note card is posted. The note includes the swap and the unwilling holder's Reflex save to prevent it (the GM runs it); at 5th, the Heightened entry (1 Bulk, and the +2 to the save). |

## Rules

- **Unwilling saves (`spell-note.js` `bystanderSaveOnly`):** "If the second item is in the possession of a creature unwilling to relinquish it, they can prevent the transposition with a successful X save." is a save that only keeps the spell off.
- **Item targets (`target-predicate-compiler.js`):** "… in another creature's possession …" no longer makes an item target a creature target.

## Tests

1108 pass. `test/rank-3-batch-42.test.js` is new, with a negative case: an unwilling save with another result isn't a note.

A whole-corpus compile (b438 → b439) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-42-live-results.json), case `rank3Batch42`, in the `pftest` world, at 5th.
- The note card has the save and the 5th-rank Heightened text.
- **Cleanup:** fixtures removed.
