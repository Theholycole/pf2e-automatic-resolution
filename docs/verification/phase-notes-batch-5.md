# Notes batch 5: GM notes hidden in Effect descriptions

2026-10-05. The user: "make Effect descriptions hide GM notes from players too".

PF2e's description renderer drops elements marked `data-visibility="gm"` for players; the GM still sees them.

`scripts/gm-notes.js` marks every GM note in an Effect's description with that attribute. A GM note is a `pf2e-auto-gm-reminder` or `pf2e-auto-gm-only` element, other than one labelled "Caster:", "Strike:" or "Moved:". The marking happens:

- as the Effect is created (`preCreateItem`);
- when its description changes (`preUpdateItem`);
- once when the world loads, for the Effects already on actors and scene tokens (the active GM).

Two descriptions that had unlabelled GM text now carry the GM label:

- the form riders' GM notes;
- the metal-attack control.

Rule text that mentions the GM inside a sentence (for example "(the GM judges the line of the attack)") stays visible, because it's part of the rule the player reads.

## Evidence

[Live evidence](phase-notes-batch-5-live-results.json), case `notesBatch5`, in the `pftest` world.

| Step | Result |
| --- | --- |
| An Effect made with a GM note and a caster's note | The GM note marked `data-visibility="gm"`; the caster's note not |
| Its description changed to another GM note | Marked |
| The description rendered for the GM, and for a player | The GM sees the note; the player doesn't, but still sees the caster's note |
