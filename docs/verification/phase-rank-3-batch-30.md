# Rank 3 batch 30 — Conjured Conveyance, Disruptive Transfer, Caster's Imposition

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Conjured Conveyance (3) | A note on the caster for 1 hour: the vehicle and its statistics are the GM's. |
| Disruptive Transfer (3) | The card reminds the caster to teleport and the GM to target the creatures adjacent to the starting space. Will save: on a failure or critical failure, Dazzled for 1 minute. |
| Caster's Imposition (3) | Will save. On a failure or critical failure, a note: the target can't take part in rituals or coven spells. It lasts 1 minute, then 1 hour at 4th and 1 day at 5th. |

## Rules

- **Spell notes (`spell-note.js`):** a conjured vehicle's stat block ("Large Skiff—Space … Crew 1 pilot …") is the GM's.
- **Compact tables (`compact-degree-table.js`):**
  - "Each of them must succeed …" is read only right after "Creatures adjacent to your initial location …"; elsewhere it is still refused.
  - "On a failed save, the target can't …" (with only narration before it) becomes the table, and its failure rows are notes.
- **Caster movement (`compile-ability.js`):** "Teleport to an empty square you can see within range." with the adjacent-creatures sentence is a reminder.
- **Targets:** "1 creature within N feet" is read.
- **Heightened durations:** "Increase the duration to N" is read.
- **Interpretation (logged):** the vehicle as a note.

## Tests

1064 pass (`test/compact-degree-table.test.js` updated for the narrowed "Each of them"). `test/rank-3-batch-30.test.js` is new, with negative cases:
- a resistance outside the stat blocks;
- a failed-save rule with a number.

A whole-corpus compile (b397 → b399) changed only this batch, rank 4 batch 15 and Plasma Whirl's variants.

## Evidence

[Live evidence](phase-rank-3-batch-30-live-results.json), case `rank3Batch30` (one case for rank 3 batch 30, rank 4 batch 15 and rank 5 batch 9), in the `pftest` world.
- Conjured Conveyance: the note lasts 1 hour.
- Disruptive Transfer: the reminder was on the card; a failure was Dazzled for 1 minute.
- Caster's Imposition at 5th: the failure note lasts 1 day.
- **Cleanup:** fixtures removed.
