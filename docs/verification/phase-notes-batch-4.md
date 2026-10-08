# Notes batch 4: GM notes for the GM only, and the remaining notes

2026-10-05. The user: "yes, continue with N2 and N4 and also make all GM notes only visible to the GM".

## GM notes

`scripts/gm-notes.js`, hooked in `main.js`:

- **What counts as a GM note:** an element with the class `pf2e-auto-gm-only`, or a `pf2e-auto-gm-reminder` whose label isn't addressed to the caster or player or reporting a result ("Caster:", "Strike:", "Moved:").
- **On their own:** a message made only of GM notes is whispered to the GMs when it's created (`preCreateChatMessage`).
- **Inside a shared card** (save cards, runtime cards, note cards): a player's client removes the GM notes as the card renders (`renderChatMessageHTML`). A card left empty is hidden.
- **Spell-note cards:** their "GM:" paragraphs now carry the class.
- **Note Effects:** the "GM: mark the area" line in the description uses PF2e's `data-visibility="gm"`.

## Notes carried out

| Spell | Now |
| --- | --- |
| Vacuum | A critical failure: the Suffocating Effect. At the end of each of the creature's turns it rolls PF2e's suffocation Fortitude save: DC 20, +5 each later turn; a failure deals 1d10 (+1d10 each later turn); a critical failure kills (`turnEndSaves`). The GM removes the Effect when it can breathe |
| Stone Lance | A critical hit on a creature above the ground (elevation over 0): the Immobilized grant is taken off its Effect and the condition removed |
| Pact Broker | The caster's Effect for the spell's time: –1 status to Deception to Lie, behind a "The target accepted the pact" toggle |
| Pyrotechnics | A creature targeted as the fire source takes 1d6 cold as the area starts |
| Theogeny | The foes' option: 10 spirit when it's critically hit or critically fails a save (`note-watchers.js`) |
| Musical Shift | Flat: a critical failure at a Strike, save or skill check knocks the creature Prone. Sharp: piercing or slashing damage adds 2d6 persistent bleed. Read from PF2e's Effect (`musical-shift:flat` / `musical-shift:sharp`) |

Already automated, so dropped from the list: Crisis of Faith, Return the Favor, Zealous Conviction, Unblinking Flame Aura (its healing), Shattering Gem (its shatter), Unravel Knowledge (its note controls).

## Tests

`test/notes-batch-4.test.js` (3).

## Evidence

[Live evidence](phase-notes-batch-4-live-results.json), case `notesBatch4`, in the `pftest` world. The Theogeny and Musical Shift steps use check messages built the way PF2e posts them.

| Step | Result |
| --- | --- |
| A message of a GM note; a caster's note; a card with a GM note, seen by a player | Whispered; public; public, the player sees only "PFTEST card" |
| Vacuum: a critical failure, then the creature's turn ends | Unconscious and Suffocating; its first suffocation save rolled (turns 1) |
| Stone Lance: a critical hit on a creature 10 feet up | No Immobilized |
| Pact Broker | The caster's Effect: –1, the toggle |
| Pyrotechnics: a creature as the fire source | 4 cold |
| Theogeny: the foes' option; a critical hit against it | 10 spirit |
| Musical Shift: flat, a critically failed save; sharp, slashing damage | Prone; 2d6 persistent bleed |
