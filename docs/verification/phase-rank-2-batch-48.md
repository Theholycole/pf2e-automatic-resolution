# Rank 2 batch 48 — objects: taken apart, hidden in a pack

2026-10-01. Follows the user's decisions of 2026-10-01:
- An object's result is the card's.
- Note-only spells count as resolved.

| Spell | Now |
| --- | --- |
| Dismantle (2) | The caster picks the item: a non-magical object in their possession of 1 Bulk or less, with Hit Points. It's Broken (its Hit Points lowered to its Broken Threshold) until the caster's Effect ends. The Effect lasts 1 minute, 10 minutes at 4th, or until daily preparations (1 day) at 6th; deleting it Dismisses the spell. When it ends, the object's Hit Points are restored. The failure cases, hiding the pieces and where it reappears are the note. |
| Empty Pack (2) | A spell note for its hour (until daily preparations at 4th). The invisibility and undetectability of the items in a container are things PF2e doesn't track for items. |

## Rules

- **`dismantle.js` (new note family):** the six sentences exactly and the heightened durations (read by the duration parser).
- **`spell-note.js`:** two mentions for items in a container, so Empty Pack's conditions on items don't block the note.
- **Runtime:**
  - The `dismantle` executor (the item from `options.itemId`, the only candidate, or a choice).
  - `dismantleOnEnd` on `deleteItem` restores the Hit Points (the active GM).

## Tests

892/892 pass. `test/rank-2-batch-48.test.js` is new. It checks:
- Dismantle's durations and Bulk, and that changed text isn't read;
- Empty Pack's note.

A whole-corpus compile (b302 → b303) changed only these two spells.

## Coverage

**Census:** **1124 enabled**, up from 1122. Rank 2: 210 of 245.

## Evidence

[Live evidence](phase-rank-2-batch-48-live-results.json), case `rank2Batch48`, in the `pftest` world.
- **Dismantle at 4th, on a Shovel (10 HP, Broken Threshold 5):** at 5 HP and Broken, Effect 10 minutes. Deleting the Effect restored 10 HP.
- **Empty Pack:** a 1-hour note on the caster.
