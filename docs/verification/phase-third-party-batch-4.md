# Third-party batch 4: Ray of Light, module Effects proved, the "Dynamic" spells' versions

2026-10-06. The fourth batch of the third-party modules' spells.

## What changed

- **Ray of Light (Oracles+)** (`src/compiler/basic-feature-riders.js`). Its basic save's other sentences:
  - "Creatures with the shadow trait or with light blindness take a –2 status penalty to their save." This is the GM's question per creature on the card.
  - "Creatures that fail their save are also Dazzled for 1 round, or Blinded for 1 round and then dazzled for 1 minute if it was a critical failure." On a critical failure, Dazzled lasts 11 rounds from the cast; PF2e's Blinded overrides it at first.
  - The ambient light is a GM reminder.
  - The line's longer length at higher ranks is a reminder to the caster.
- **Third-party condition riders** (`readConditionRider`):
  - "If the creature critically fails the save, it is also Enfeebled 1 until the start of your next turn."
  - "If a target critically fails the save, it's also deafened for 1 minute."
  - "If the target fails its save, it is also off-guard until the end of your next turn."
  - "On a failed save, the target is Enfeebled 1 … (Enfeebled 2 on a critical failure)."

  These become PF2e's conditions for the stated time. "On a failure" also covers a critical failure.
- **Effect + note spells proved against their module's Effect** (`src/compiler/effect-note-proof.js`):
  - **Cosmic Tune (Witches+):** the ally's +1 to attack rolls and Will saves, and Fascinated. Heightened (7th) gives +2.
  - **Virtue's Light (Clerics+):** the GM targets the unholy creatures in the emanation. Their holy weakness is twice the rank, added to any holy weakness they already have (the runtime reads it, since PF2e keeps only the higher of two).
  - **Glutton For Blood (Magic+):** the caster's fast healing, +1 a rank. Its end (the target stops bleeding or leaves range) is a GM note.
  - **Dual-Pattern Strike (Magus+):** the caster's two Strikes are a note, and the card asks whether both hit. The caster picks the weakness's type; the old names negative and positive are PF2e's void and vitality.
    - The module's Effect has an extra choice for a feat the text doesn't name. That choice is removed, and the weakness set to the text's value: 2, +1 per 2 ranks.
  - Other proof changes:
    - A heightened entry worded "Increase the fast healing by 1." is read.
    - A module's "Note:" line after it is ignored.
    - A Heightened paragraph before the table no longer counts as part of the spell's rules.
- **Module Effects in the current PF2e** (`scripts/native-outcome-effects.js`): third-party Effects read choices at `flags.pf2e.rulesSelections`, but PF2e now keeps them at `flags.system.rulesSelections`. The path is rewritten when such an Effect is made. Without this, Dual-Pattern Strike's weakness had no type.
- **Plain-text degree headings** ("<p>Failure The target is …") and Ravaging End's misspelt "Critical Failura" are read as PF2e's headings. Explosive Crescendo (Oracles+) now routes.
- **The "Dynamic" spells (Magic+)** (`src/compiler/glyph-versions.js`). Each spell lists its 1-, 2- and 3-action versions in one description, behind PF2e's action glyphs, with a PF2e variant per action count.
  - When a spell as written leaves something pending, a fixed-count variant reads only its own version:
    - "As the two-action version, except the range is 60 feet. Additionally, …" is resolved from the two-action version's text.
    - The lead's "fire damage … basic Reflex save" is joined with the version's dice and area, when the area is the variant's own.
    - The Heightened entry keeps what it says of that version.
    - A version with no damage gets its own degree table, and its "immune to the one-action version" immunity applies to that version only.
    - A version after a section break isn't read (Kinetic Ram's doubled push stays blocked).
  - Where the text's heightening differs from the variant's data, the card rolls the text's formula. Breathe Fire's two-action version steps 2d6 a rank, not 1d6.
  - Dynamic Daze's one-action version: off-guard against the caster's next attack (a note, removed by `note-watchers.js` after that attack roll).
  - Routed:
    - Breathe Fire (1–3), Daze (1–3), Void Warp (1–3) and Haunting Hymn (1–3);
    - Lightning Bolt (1–2) and Fireball (1–2);
    - Vitality Lash (1–2) and Frostbite (2).
- **Targets:** "1 willing ally" is the caster's pick, and "1 creature taking persistent bleed damage" requires persistent bleed damage. Temporal Twin's eligibility gap closes; its route is unchanged.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs from before this batch, and only in its pending list: Temporal Twin's "one willing ally".

## Census

| Route | Batch 3 | Batch 4 |
| --- | --- | --- |
| Save | 18 | 24 |
| Effect | 45 | 49 |
| Effect + note | 11 | 7 |
| Not enabled | 106 | 100 |

The census counts a spell with variants once. Many of the "Dynamic" spells' versions are now routed within spells already counted.

## Tests

`test/third-party-batch-4.test.js` (5) covers:

- Ray of Light;
- the four proofs;
- the headings;
- the Dynamic versions (15 variants);
- the condition riders.

All 1,686 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-4-live-results.json), case `thirdPartyBatch4`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Ray of Light, critical failure, the GM answers yes | The save at –2; Blinded; Dazzled held for 11 rounds; damage; both reminders |
| Cosmic Tune on an ally | Will +1; Fascinated |
| Virtue's Light on an unholy foe with weakness 5 to holy | Holy weakness 7 |
| Dual-Pattern Strike, both hit, fire | Weakness 2 to fire |
| Explosive Crescendo, rank 6, critical failure | Stunned 3; Deafened |
| Dynamic Daze, one action, failure | The off-guard note (immunity key `daze:1-action`), removed after the caster's attack roll |
| Dynamic Breathe Fire, two actions, rank 2, failure | 4d6 fire |
