# Notes batch 9: GM asides in Effect names

2026-10-05. The user: "do the same for asides in Effect names too".

An Effect's name is the same for everyone, so an aside in it can't be hidden from players in place. `splitNameAsides` (`scripts/gm-notes.js`) takes it out of the name instead and adds it to the description as a GM note, which PF2e hides from players. This happens:

- as the Effect is created (`preCreateItem`);
- when it's renamed (`preUpdateItem`);
- once at world load for the Effects already on actors and scene tokens.

A bare aside, such as "(the GM's)", becomes "{name} — yours to resolve."

## Tests

`test/notes-batch-7.test.js` (`splitNameAsides`).

## Evidence

[Live evidence](phase-notes-batch-9-live-results.json), case `notesBatch9`, in the `pftest` world.

| Step | Result |
| --- | --- |
| An Effect named "PFTEST cover (the GM judges the line)" | Named "PFTEST cover"; the GM sees "The GM judges the line." in its description, a player doesn't |
| Renamed "PFTEST renamed (the GM moves it)" | Named "PFTEST renamed"; "The GM moves it." added as a GM note |
