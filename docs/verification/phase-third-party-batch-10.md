# Third-party batch 10: Siphoning Rivulet, Unknowable Icon, Drown, Kinetic Tow

2026-10-06. The tenth batch of the third-party modules' spells.

## What changed

- **Siphoning Rivulet (Magic+)** (`direct-damage.js`, `effect-runtime.js`):
  - PF2e's entry is persistent bleed, but the text adds 4d4 to the bleed the creature is taking now, so the module rolls it as bleed damage now.
  - PF2e reads any bleed as persistent; the roll uses PF2e's own `evaluatePersistent`, as persistent damage is when it's taken (`damage.immediate`).
  - The text heightens it by 1d4 a rank, checked against PF2e's heightening entry.
  - The caster gives the triggering bleed it saw. The caster gains that plus the bleed this dealt as temporary Hit Points until the end of its next turn (`damage.siphon`).
- **Unknowable Icon (Oracles+)** (`stored-trigger.js` `extractRuneTrigger`, `stored-trigger-runtime.js`, `ongoing-runtime.js`):
  - Casting sets the rune as a stored trigger in Ongoing spells.
  - When it activates, the GM targets every creature within 10 feet of it and uses Trigger. One card rolls them all: a basic Will save for 1d12 mental and 1d4 spirit (heightened by the item's entries), with Frightened 2 on a critical failure.
  - The item's save isn't marked basic, but the text's is; the text wins.
- **Drown (Magic+)** (`third-party-rows.js`):
  - Success: a –2 status penalty to checks with the auditory or linguistic trait until the end of its turn. This is PF2e's modifier on those item-trait roll options (`validRowNoteRule`, selector `check`).
  - Failure and critical failure: the held breath is a GM-played note for the spell (PF2e tracks no air). Its Interact re-save is the card's Fortitude control.
  - "Creatures that do not need to breathe are unaffected" and the air bubble counteract are GM reminders (`third-party-note`).
- **Kinetic Tow (Magic+)**:
  - The pulls of 10, 15 and 30 feet toward the caster's chosen creature or object are the GM's forced movement (a new `direction: "chosen"`).
  - The tether is a GM-played note for the spell, with the Interact re-save as the card's Fortitude control. The text's Athletics alternative is left to the GM.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 9 | Batch 10 |
| --- | --- | --- |
| Save | 42 | 44 |
| Effect | 51 | 52 |
| Ongoing | 2 | 3 |
| Not enabled | 79 | 75 |

## Tests

`test/third-party-batch-10.test.js` (4). All 1,711 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-10-live-results.json), case `thirdPartyBatch10`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Siphoning Rivulet, rank 4, 3 triggering bleed | 12 bleed taken now (no persistent condition); the caster 15 temporary HP until the end of its next turn |
| Unknowable Icon, triggered on two creatures, both critical failures | One card for both; each took double the 9 damage; both Frightened 2; the rune ended |
| Drown, rank 2 | Failure: the bubble's note with its Fortitude re-save. Success: −2 status on auditory and linguistic checks for 1 round |
| Kinetic Tow, rank 3, critical failure | The card's 30-foot pull toward the caster's pick; the tether note with its re-save |
