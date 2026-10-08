# Spellshape batch 10: family G and the rank

2026-10-05. Feats that single out some of the spell's targets, or change its rank or DC.

- **Targets singled out on the card** (`assignShapeTargets`, before it's posted):
  - Split Shot's second target: half damage, the row's damage only (`shapeHalf`, `shapeDamageOnly`);
  - Tempest-Sun Redirection's spared targets: the damage less the rank (`shapeReduce`, PF2e's addend), and the caster's resistance against them after.
- **The rank:** Split Hex, Simple Mastery and Mythic Heightening change the rank recorded with the cast (`shaping.castRank`), and the card resolves at it.
- **The DC:** mythic proficiency (level + 10) in place of the spell's proficiency (`mythicDC`).

| Feat | Now |
| --- | --- |
| Split Shot | The second target: half damage, nothing more. |
| Tempest-Sun Redirection | The spared targets take the rank less; the caster resists twice the rank of their damage until its next turn. |
| Split Hex | 2 ranks lower. |
| Mythic Heightening | The highest rank the caster can cast; the DC with mythic proficiency. |
| Mythic Casting | The DC with mythic proficiency. |
| Simple Mastery | 1 rank higher, up to the highest. |
| Contagious Spell, Heightened Captivation | Read (the table's; the GM's note). |

## Tests

`test/spellshape-batch-10.test.js` is new. Coverage: 86 of 131 feats read.

## Evidence

[Live evidence](phase-spellshape-batch-10-live-results.json), case `spellshapeBatch10`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Split Shot on Holy Light, two hits | 26; the second 13 |
| Tempest-Sun Redirection on Fireball, the ally spared | The foe 24, the ally 21; the caster's resistance 6 |
| Split Hex on Evil Eye (3rd) | 1st |
| Mythic Heightening on Fireball (3rd) | 5th; DC 17 → 25 |
| Simple Mastery on Fireball (3rd) | 4th |
| Contagious Spell, Heightened Captivation | Read |
