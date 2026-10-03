# Rank 3 batch 112 — Wall of Wind

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Wall of Wind (3) | A lingering line the GM places (60 feet), difficult terrain for walking. A creature moving into it saves Fortitude; the GM leaves out creatures not flying through. A success leaves a note: through, but the wall is difficult terrain for it. A failure leaves a "stopped" note (its remaining movement wasted). A critical failure is the same note plus the card's 10-foot push, its direction the GM's (away from the wall). The ammunition, javelin −2 circumstance, massive weapons, gases and shape are a card reminder. |

## Rules

- **`src/compiler/twin-illusion.js`:** `rewriteWindWall` reads the five lead sentences, the three list items and the four rows. It returns:
  - the lingering wording and unaffected rows;
  - the line area;
  - turn-long row notes;
  - the critical failure's push and the reminder.
- **`compileSpell`:** the twin step sets the area before compiling, then adds the push to its row.

## Interpretation

- **The save is for flyers only.** Moving overland, the wall is only difficult terrain; the GM leaves walkers out at review.
- **The push is "any" direction.** The card's push; the GM moves it away from the wall.
- **The −2 to bigger ranged weapons is a reminder.** It depends on the attack's path.

## Tests

`test/rank-3-batch-112.test.js` is new. It covers the area, the event, the terrain, the push, the notes and the reminder, and a different push (not read).

A whole-corpus compile (b636 → b637) changed only Wall of Wind.

## Evidence

[Live evidence](phase-rank-3-batch-112-live-results.json), case `rank3Batch112`, in the `pftest` world.

| Step | Result |
| --- | --- |
| The plan | A 60-foot line; walking terrain; the 10-foot push; the reminder |
| The region | modifyMovementCost ×2 |
| A flyer moves in and critically fails | The "stopped" note; push 10 |
| Another succeeds | The "difficult terrain for it" note |

**Cleanup:** fixtures and region removed.
