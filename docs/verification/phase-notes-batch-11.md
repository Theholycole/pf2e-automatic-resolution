# Notes batch 11: GM asides in roll tooltips

2026-10-05. The user: "do the same for asides in roll tooltips too".

On a player's client, `stripCardAsides` (`scripts/gm-notes.js`) now also covers roll tooltips:

- **The dice tooltip:** its text sits inside the card's content, so the existing text pass already covers it.
- **Tooltips held in attributes** (`data-tooltip`, `data-tooltip-text`, `title`, `aria-label`, as on PF2e's modifier tags and buttons): their GM asides are taken out too.

The GM's view is unchanged.

## Evidence

[Live evidence](phase-notes-batch-11-live-results.json), case `notesBatch11`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A dice tooltip "1d6 (the GM adds 2)" and a tag's tooltip "Status bonus (the GM's choice)", the GM's view | Unchanged |
| A player's view | "1d6"; "Status bonus" |
