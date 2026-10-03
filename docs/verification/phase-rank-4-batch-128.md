# Rank 4 batch 128 — Wall of Mirrors

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Wall of Mirrors (4) | The card tells the GM to draw the wall (up to 50 feet long, 20 high). Each 10-foot section has AC 10, Hardness 10 and 40 HP (+10 per rank, at the cast rank), and is immune to critical hits and precision damage. The placement rule and the concealment across the wall are notes. The card's control *A creature Struck the wall* (with that creature targeted) posts its basic Will save against the item's 4d4 mental. |

## Rules

- **`src/compiler/struck-wall.js`:** reads the six sentences (the damage must be the item's entry) and the Heightened entry.
- **`compileSpell`:** the striker's basic save, from the item's damage.
- **Runtime:**
  - **New kind `struck-wall`:** the card with the section HP at the cast rank.
  - **`cardAction("struck-wall")`:** the save card for the targeted creature. `cardAction` now takes options (targets).
- **Test fixture:** PF2e's pack names it "Wall Of Mirrors".

## Interpretation

- **The wall has no stated duration.** It lasts until the GM removes it or it's destroyed; its control stays on the card.
- **"Concealed from creatures on the opposite side" is a note.** It depends on each viewer's side, which is the GM's.

## Tests

`test/rank-4-batch-128.test.js` is new. It covers the data, the strike plan's support and its basic save, and different damage (not read).

A whole-corpus compile (b667 → b668) changed only Wall of Mirrors.

## Evidence

[Live evidence](phase-rank-4-batch-128-live-results.json), case `rank4Batch128`, in the `pftest` world, cast at 6th rank.

| Step | Result |
| --- | --- |
| The card | The sections have 60 HP |
| A foe Struck the wall, failure | 4d4 mental (12 taken) |

**Cleanup:** fixtures removed.
