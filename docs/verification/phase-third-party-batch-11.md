# Third-party batch 11: Eternal Slumber, Summon Jury, Sudden Outbreak

2026-10-06. The eleventh batch of the third-party modules' spells.

## What changed

- **A save from the text** (`glyph-versions.js` `fitTextSave`): Eternal Slumber's item has no save in its data, but its text says "The creature must attempt a Will save." over a full degree table.
  - When the spell as written leaves something pending, the text's save is used (not basic), with a data note.
  - This applies only when the spell has no attack, all four degree headings, and exactly one such sentence.
- **Eternal Slumber (Witches+)** (`third-party-rows.js`):
  - Success: a Drowsy note for the spell, with PF2e's –2 to Perception checks to Seek (`action:seek`). The DC 5 flat check is rolled when it casts a concentrate spell; other concentrate actions are the GM's.
  - Failure: Unconscious for the sustained spell, with a GM-played note that it doesn't wake unless it succeeds at a Will save.
  - Critical failure: Unconscious with no end, and a note naming the caster's ending condition and Wish.
  - The module's own Effect differs from the text, so the text's notes are applied (a data note says so).
- **Summon Jury (Wizards+)** (`incarnate.js`, `third-party-rows.js`, `note-effects.js`):
  - Its Arrive and Depart titles are in bold rather than PF2e's italics, and its size sentence states no Speed; both now read as an incarnate.
  - Its Heightened entries ("The status penalties increase to 2." at 5th, 3 at 9th) stay with each phase.
  - Each row is a note with PF2e's status penalty to attack rolls or saving throws. A "next" roll's penalty is removed after that roll (`removeAfterRoll`).
  - The value follows the cast rank (`rankValues`).
  - Arrive's critical failure adds a toggle that gates the penalty to its save against the Depart verdict.
- **Sudden Outbreak (Witches+)**:
  - "1 diseased creature" is confirmed by the GM (`target-predicate-compiler.js`).
  - The saves against its diseases are PF2e's afflictions, so they're the GM's: GM-played notes for the row's time, repeated on each first Sustain (`read.clears`, `sustainNotes`).

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 10 | Batch 11 |
| --- | --- | --- |
| Save | 44 | 46 |
| Effect | 52 | 53 |
| Not enabled | 75 | 72 |

## Tests

`test/third-party-batch-11.test.js` (3). All 1,714 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-11-live-results.json), case `thirdPartyBatch11`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Eternal Slumber, rank 5 | Failure: Unconscious, the waking note. Critical failure: Unconscious, the note with no end. Success: the Drowsy note (DC 5 concentrate check, the Seek penalty) |
| Summon Jury, rank 5 | Arrive, critical failure: −2 to attack rolls, the Depart toggle, −2 to that save. Depart, failure: −2 to saving throws |
| Sudden Outbreak | The GM's disease question on the card; a failure's note for the spell's minute |
