# Notes batch 10: GM asides in chat message flavors

2026-10-05. The user: "do the same for asides in chat message flavors too".

On a player's client, `stripCardAsides` (`scripts/gm-notes.js`) now also takes the GM asides out of a message's flavor line (`.flavor-text`): parentheses naming the GM, and sentences starting "The GM". The GM's view is unchanged.

## Evidence

[Live evidence](phase-notes-batch-10-live-results.json), case `notesBatch10`, in the `pftest` world. A real message, rendered by Foundry for each view.

| Step | Result |
| --- | --- |
| Flavor "PFTEST spell: the shard flies (the GM moves it). The GM rolls in secret.", the GM's view | Unchanged |
| A player's view | "PFTEST spell: the shard flies." |
