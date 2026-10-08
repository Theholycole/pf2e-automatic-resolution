# Notes batch 8: GM asides in button labels

2026-10-05. The user: "do the same for button labels too".

On a player's client, `stripCardAsides` (`scripts/gm-notes.js`) now also takes the GM asides out of a card's button labels, for example "Press (the GM picks)" becomes "Press". Only the label's text changes; each button and its handler stay as they were. Text in text areas and select menus is still left alone. The GM's view is unchanged.

## Evidence

[Live evidence](phase-notes-batch-8-live-results.json), case `notesBatch7` (updated), in the `pftest` world.

| Step | Result |
| --- | --- |
| A card with a GM aside in its text and in its button's label, seen by a player | "Objects take the damage too. The creature is pushed." and the button "Press" |
| The button pressed in the player's view | Its handler ran |
| The GM's view | Unchanged ("Press (the GM picks)") |
