# Rank 3 batch 29 — Sun's Fury

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Sun's Fury (3) | PF2e's Effect on the target's wielder, proved from the text. On the chosen weapon it gives a 1d4 fire damage die and 1 spirit damage, plus a torch's light (20 feet bright, 40 dim). Dismissable (a note). |

## Rules

- **Effect proof (`effect-note-proof.js`):**
  - "The weapon deals an additional NdM T and N T damage on a successful Strike." is read as PF2e's weapon ChoiceSet plus that weapon's DamageDice and FlatModifier.
  - "the flame causes the weapon to glow as bright as a torch" is read as TokenLight 20/40.
  - "The target weapon becomes wreathed in a glowing flame." is narration; "You can Dismiss the spell." is a note.
- **Effect notes (`spell-note.js`):** the weapon's own damage sentence doesn't refuse the route; PF2e's Effect carries the dice.

## Tests

1059 pass. `test/rank-3-batch-29.test.js` is new, with a negative case: another die stays blocked.

A whole-corpus compile (b396 → b397) changed only Sun's Fury and Font of Serenity.

## Evidence

[Live evidence](phase-rank-3-batch-29-live-results.json), case `rank3Batch29`, in the `pftest` world. On an ally with a mace, PF2e's Effect chose that mace and carries ChoiceSet, DamageDice, FlatModifier and TokenLight; the ally's token light is bright 20.
- **Cleanup:** fixtures removed.
