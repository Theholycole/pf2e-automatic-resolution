# Rank 6 batch 6 — Zealous Conviction, Scintillating Safeguard, Flaming Fusillade

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Zealous Conviction | Effect + note, now proved. PF2e's TempHP (12) and +2 status to Will saves against mental effects match the text, and their 9th-rank values (18, +3) match the Heightened entry. Obeying the caster and the repugnant task's end-of-turn save are the note. |
| Scintillating Safeguard | Proved. PF2e's damage-type ChoiceSet and its Resistance of the chosen type (10 at 6th, +1 per rank) match the text. The caster picks once for every target (asked once, or `choiceSelections`), and the Effect ends after the damage. "Up to 5 willing creatures who would be harmed by the triggering effect" are the caster's targets. |
| Flaming Fusillade | Proved. PF2e's Effect is the 9th-rank status bonus to Ignition's damage equal to the rank, matching its Heightened entry. Casting Ignition with it, and Ignition's 1-action casting, are reminders for the caster (the module resolves Ignition itself). |

## Tests

`test/rank-6-batch-6.test.js` is new. A whole-corpus compile (b726 → b727) changed only these three spells.

## Evidence

[Live evidence](phase-rank-6-batch-6-live-results.json), case `rank6Batch6`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Zealous Conviction at 9th on two creatures | Each has 18 temporary HP and the note |
| Scintillating Safeguard at 7th, fire | Fire resistance 11 |
| Flaming Fusillade at 9th | PF2e's Effect and the note on the caster |

**Cleanup:** fixtures removed.
