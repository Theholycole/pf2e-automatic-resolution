# Third-party batch 5: attacks from the text, triggered damage by rank, flat checks on casting, saves on each Sustain

2026-10-06. The fifth batch of the third-party modules' spells.

## What changed

- **Spell attacks from third-party text** (`src/compiler/spell-attack-table.js`):
  - Curly apostrophes ("your target’s AC") read as straight ones.
  - "against the AC of a target within 30 feet" is read.
  - "can choose to push the target up to 5 feet away from you" is an optional push, up to that far, away.
  - "On a hit, … (double damage on a critical hit). If you critically hit, the target is Dazzled until the end of your next turn." gives the critical row's condition.
- **Staff Striker (Wizards+)** (`fitGripVariant`): PF2e's two variants are the one- and two-handed grips. Each reads the text for its own die (1d6 or 1d8) and Heightened step.
- **Dynamic Divine Lance (Magic+):** the two- and three-action versions route. The one-action tag stays open.
- **Needle of Vengeance+ (Witches+)** (`src/compiler/stored-trigger.js`). The held trigger reads:
  - the inline damage roll, `@Damage[2[mental]]`;
  - the critical failure's "Enfeebled 1 … for the duration of the spell".

  The triggered card attaches that condition to the held spell's record (`parentCastId`), so it ends with the spell.
- **Old-Mage's Echo (Magic+).** A new triggered-damage kind, `spell-cast-rank`.
  - The caster's Ongoing control asks the rank of the spell the target cast, and deals twice that in mental damage: once on a success, each time on a failure.
  - On a critical failure, each time also gives Deafened until the start of its next turn (an Effect holding PF2e's condition).
  - The item's placeholder damage isn't rolled.
- **Silence of the Archmage (Magic+):**
  - A note holds PF2e's Stupefied 1 until the creature frees itself (success) or the curse is removed.
  - On a critical failure, a –2 status penalty to spell attack rolls and spell DCs.
  - A DC 11 flat check `casting-rules-runtime.js` rolls whenever the creature casts a spell; on a failure the spell is lost. Items and talismans are the GM's.
- **The save again on each Sustain** (Witches+: "The creature attempts a Will save when you Cast the Spell and the first time you Sustain the spell on subsequent rounds, suffering the listed effects.").
  - The cast message's "Sustain: Again" opens the save card again, once a turn, up to the spell's maximum.
  - A row ending the spell ("The target is unaffected and the spell immediately ends.") closes the repeats (`endsRepeat`).
  - **Lurking Doom:** the critical failure's "DC 5 flat check" on concentrate actions is a note. The module rolls it for the creature's concentrate spells, until the caster's next turn ends.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 4 | Batch 5 |
| --- | --- | --- |
| Save | 24 | 29 |
| Ongoing | 1 | 2 |
| Not enabled | 100 | 94 |

## Tests

`test/third-party-batch-5.test.js` (6) covers:

- Staff Striker;
- Divine Lance;
- Needle+;
- Old-Mage's Echo;
- Silence of the Archmage;
- Lurking Doom.

All 1,692 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-5-live-results.json), case `thirdPartyBatch5`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Staff Striker, two-handed, critical hit | 1d8 bludgeoning doubled; the optional push |
| Dynamic Divine Lance, three actions, critical hit | Dazzled; damage |
| Needle of Vengeance+, triggered, critical failure | Enfeebled 1; damage; gone when the spell is ended |
| Old-Mage's Echo, rank 7, critical failure, a rank-3 spell cast | 6 mental; Deafened |
| Silence of the Archmage, rank 8, critical failure | Stupefied 1; the penalties; the foe's cast rolls the DC 11 flat check |
| Lurking Doom from its cast message, critical success | The repeats close |
