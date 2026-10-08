# Spellshape batch 1: the core

2026-10-05. The first batch of the spellshape and wand project (`docs/planning/spellshape-wand-plan.md`).

## How it works

- **The cast's spellshape.** PF2e's Spellshape selector puts `spellshape:<feat>` on the cast's roll options.
  - The module reads the feat's text into requirements and riders (`src/compiler/spellshape-readers.js`). It checks the requirements against the spell as cast and keeps both on the cast's message.
  - Then it switches the selector off: PF2e leaves it on, though a spellshape applies only to the next spell.
  - A feat PF2e gives no selector (Knockback Spell, Dizzying Spell, …) is armed by posting its card. That creates an Effect until the end of the turn, which the next cast uses up.
- **The cast's wand.** The caster's wand storing the same spell at the same rank (the one just used, when there are several). Its text is read into riders the same way.
- **A spell that doesn't qualify** gets a GM whisper ("Intimidating Spell doesn't apply: it deals no damage."), and nothing is applied.
- **Riders**, on the save card after each creature's own outcome:
  - conditions by degree (for the stated rounds through an Effect, else PF2e's condition);
  - persistent damage on a failure;
  - extra damage scaled by the save, rolled once for the cast;
  - a push reminder for the GM (away from the caster, or the burst's center).

## Feats and wands

| Feat or wand | Now |
| --- | --- |
| Intimidating Spell | A damaging area spell: Frightened 1 on a failure, Frightened 2 on a critical failure. |
| Reverberating Spell | A non-cantrip damaging area spell: 1d8 sonic more (scaled by the save) and Deafened for 1 round, or 1 minute on a critical failure. |
| Knockback Spell | A burst, cone, emanation or line with no duration and a Reflex or Fortitude save: pushed 5 feet (10 on a critical failure), away from the burst's center or the caster. |
| Thunderclap Spell | An electricity spell with no duration and a save: on a failed Reflex save Deafened for 1 round, and Prone too on a critical failure. |
| Scintillating Spell | A spell with no duration and a Reflex save, not darkness: Dazzled for 1 round, Blinded instead on a critical failure. |
| Dizzying Spell | A single-target Will spell: Stupefied 2 for 1 round, Stupefied 3 on a critical failure (read; live-tested in a later batch). |
| Wand of Smoldering Fireballs | The fireball's failures take 1d6 persistent fire (2d6, 3d6 and 4d6 for the higher-rank wands). |

## Tests

`test/spellshape-batch-1.test.js` is new. `tools/report-spellshape-coverage.mjs` counts what's read: 6 of 131 feats, 1 of 49 wand kinds.

## Evidence

[Live evidence](phase-spellshape-batch-1-live-results.json), case `spellshapeBatch1`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Fireball with Intimidating Spell (failure, critical failure) | Recorded; the selector off; Frightened 1 and 2 |
| Fireball with Reverberating Spell (failure, success) | Deafened and not; the extra sonic |
| Knockback Spell armed by its card; Fireball (failure, critical failure) | Armed; pushed 5 and 10 feet from the burst's center (reminders) |
| Lightning Bolt with Thunderclap Spell | Deafened; Deafened and Prone |
| Fireball with Scintillating Spell | Dazzled; Blinded |
| Fear with Intimidating Spell | "it deals no damage": nothing applied |
| Wand of Smoldering Fireballs (failure, success) | Recorded as the wand's cast; persistent fire on the failure only |
