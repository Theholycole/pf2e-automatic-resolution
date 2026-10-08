# Notes batch 7: GM asides in chat cards

2026-10-05. The user: "do the same for asides in chat cards".

As a shared card renders on a player's client, `hideGmNotes` (`scripts/gm-notes.js`) does two things:

- It takes the GM asides out of the card's text: parentheses naming the GM, and sentences starting "The GM" (`stripAsides`).
- It then removes the GM notes.

It works text node by text node, so the card's buttons and their handlers stay as they were. Text inside buttons, form fields, GM notes and "GM / player" notes is left alone. The GM's view is unchanged: the GM still reads the asides in place.

## Tests

`test/notes-batch-7.test.js` (1).

## Evidence

[Live evidence](phase-notes-batch-7-live-results.json), case `notesBatch7`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A public card: "Objects take the damage too (the GM moves them). The creature is pushed. The GM deletes this marker to keep it.", a GM note, a button | |
| The GM's view | Unchanged |
| A player's view | "Objects take the damage too. The creature is pushed." and the button; no GM note |
| The button pressed in the player's view | Its handler ran |
