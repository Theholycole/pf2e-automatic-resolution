# Notes batch 6: GM asides split into GM notes

2026-10-05. The user: "split those asides into separate GM notes".

`scripts/gm-notes.js` (`splitAsides`, run by `markGmNotes`) splits GM asides out of an Effect description's paragraphs and list items. It runs as the Effect is created, when its description changes, and once at world load. Paragraphs that are already GM notes, are marked `data-visibility`, or are labelled "GM / player:" are left as they are.

- **An aside in parentheses that names the GM** ("(the GM judges the line of the attack)"): removed from the sentence and added after the paragraph as a GM note: "GM: The GM judges the line of the attack."
- **A bare aside** ("(the GM's)", "(the GM)", "(GM)"): the note restates its sentence: "GM: Objects in the area take the damage too — yours to resolve."
- **A sentence that starts "The GM …"** moves whole into a GM note.
- **Visibility:** the GM notes then carry `data-visibility="gm"`, so players see the rule without the asides.

## Tests

`test/notes-batch-6.test.js` (3).

## Evidence

[Live evidence](phase-notes-batch-6-live-results.json), case `notesBatch6`, in the `pftest` world.

| Step | Result |
| --- | --- |
| An Effect with "… behind them (the GM judges the line of the attack)." and "… damage too (the GM's)." | Two GM notes split out |
| Its description as the GM sees it | Both sentences and both GM notes |
| As a player sees it | "The shrubs give standard cover to a creature behind them. Objects in the area take the damage too." |
