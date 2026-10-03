# Rank 2 batch 33 — a target-animal note, a Prone mire, a bone cage

2026-10-01.

| Spell | Now |
| --- | --- |
| Impart Empathy (2) | A note on the target animal for 1 day: the Make an Impression and Request rules. At 4th it also says the spell can target plants and fungi. PF2e's Will save isn't mentioned in the text and the spell has no results, so it's a note. |
| Carrion Mire (2) | A sustained 15-foot burst. Creatures in the area when it's cast, and creatures starting their turn there (once a round), attempt a Reflex save. On a failure or critical failure they fall Prone. The vitality-healing counteract is a GM note when the spell is cast. |
| Osseous Cage (2) | Creatures in the cage's space attempt a Reflex save. On a failure they're Immobilized until they Escape (against the spell DC), and the Immobilized Effect ends with the spell. The card shows the GM the cage's other exits, its AC, Hardness and Hit Points, the lesser cover, the size limit and the Heightened (+2) step. |
| Fate's Travels (3), Painted Scout (3) | Now notes, under the same rule as Impart Empathy (their PF2e Will save appears nowhere in the text). |

## Rules

- **`spell-note.js` `bystanderSaveOnly`:** a non-basic data save that the text never mentions, with no results table, gives a note. `SINGLE_ACTOR_TARGET` accepts "1 animal" and "1 willing animal".
- **`compact-degree-table.js`:**
  - `SAVE_OR_PRONE`: "must succeed at a <save> save or fall Prone" expands to a table.
  - `expandCage`:
    - Reads the trapped sentence, the Immobilized-until-it-Escapes sentence with its other exits, the three cage sentences and the Heightened step, each exactly.
    - Allows one sentence of narration before them.
    - Gives a save table plus a `structure` reminder.
- **`lingering-area-compiler.js`:** the turn-start trigger also reads "beginning their turn". The vitality-healing counteract goes to the notes.
- **`basic-save-core.js`:** a `structure` reminder must match `compilerEvidence.structure`.

## Tests

868/868 pass. `test/rank-2-batch-33.test.js` is new. It checks:
- the notes, and that text mentioning the save isn't read as a note;
- the mire's area and rows;
- the cage's row and reminder, that a forged reminder is refused, and that changed cage wording isn't read.

A whole-corpus compile (b286 → b287) changed only these five spells.

## Coverage

**Census:** **1094 enabled**, up from 1089. Rank 2: 180 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-33-live-results.json), case `rank2Batch33`, in the `pftest` world.
- **Impart Empathy at 4th:** "Spell Note: Impart Empathy" on the target animal, 1 day, with the plants-and-fungi line.
- **Carrion Mire:**
  - The note was posted. At the cast one creature was asked; it succeeded and wasn't Prone.
  - Its turn in the same round asked nothing (once a round).
  - The caster Sustained. On its turn in round 2 it was asked again, failed and fell Prone (no damage).
  - Ending the spell removed the region.
- **Osseous Cage at 4th:**
  - The failure target was Immobilized with an Escape (DC 24); the success target wasn't.
  - The card showed the cage reminder.
  - Ending the spell removed the Immobilized.
- **Cleanup:** fixtures, combats and regions removed.
