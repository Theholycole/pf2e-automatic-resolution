# Rank 2 batch 52 — a battle form from the text

2026-10-01. Follows the user's decision of 2026-10-01: a battle form PF2e has no Effect for is generated from the text.

| Spell | Now |
| --- | --- |
| The Everfull Moon (2) | An Effect on the caster for 1 minute, built from the text as PF2e's BattleForm rule. It is Large with the beast trait, and the caster can still speak, cast and use its hands. It has AC 18 + level (ignoring armor's check penalty and Speed reduction) and 20 temporary Hit Points. Senses: darkvision, and imprecise scent 30 feet. Speed 40 feet. Jaws (reach) 2d8 piercing and claw (agile, reach) 2d6 slashing, at +10 or the caster's unarmed modifier if higher. Every 2 ranks, PF2e's brackets add 20 temporary HP, one damage die, +6 to attack and +2 AC. Separate rules give +1 status to saves and add the level to untrained Acrobatics and Athletics. The Ongoing control Fuels it: the temporary Hit Points at the cast rank, the higher kept. The lethologic mark is a lasting Effect: a silver weakness equal to the level, behind a "night (not the new moon)" toggle; healing it is the note. |

## Rules

- **`battle-form.js` (new note family):**
  - The form sentence, the trait, and "doesn't prevent you from …".
  - Every list item (AC, saves, temporary HP, senses, skills, Strikes intro, each Strike, Speed).
  - Fuel, the mark and the Heightened step, all read exactly; anything else refuses it.
  - Builds the BattleForm rule with its brackets, and the two modifiers.
- **Runtime:**
  - The `battle-form` executor (the Effect at the cast rank, and the mark once).
  - The `fuel-form` request and its Ongoing control.

## Tests

896/896 pass. `test/rank-2-batch-52.test.js` is new. It checks:
- the generated rule and its brackets, the modifiers and the mark;
- that an unknown list item refuses it.

A whole-corpus compile (b306 → b307) changed only The Everfull Moon.

## Coverage

**Census:** **1129 enabled**, up from 1128. Rank 2: 215 of 245.

## Evidence

[Live evidence](phase-rank-2-batch-52-live-results.json), case `rank2Batch52`, in the `pftest` world (a level 7 character caster).
- **At 2nd:**
  - AC 25, 20 temporary HP, Large, beast; claw and jaws at +10.
  - Fuel after the temporary HP fell to 5: back to 20.
- **At 4th:** AC 27, 40 temporary HP; claw and jaws at +16.
- **The lethologic mark:** one Effect (RollOption + Weakness).
