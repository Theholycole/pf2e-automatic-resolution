# Rank 10 batch 3: the end of group 5

2026-10-05. The last two battle forms of feature group 5, both generated from the text.

| Spell | Now |
| --- | --- |
| Avatar | The module's Effect with PF2e's choice of the 21 deities. Each deity has a BattleForm rule: Huge, AC 25 + level, 30 temporary Hit Points, darkvision, Athletics +35, its Speeds, its Strikes at +33 (reach, range, thrown, deadly, versatile and the other traits), and its immunities. Ignoring difficult terrain, the shields, a reload, silver and "damages only undead" are notes per deity. |
| Metamorphosis | The module's Effect for 1 minute, plus the form's card. **Take a form** casts one of the caster's own polymorph spells (no target, rank 8 or lower, at the chosen rank) by its own route. The previous form ends first, and the caster gets 40 temporary Hit Points instead of the form's. A form already used this casting is refused. Removing the Effect ends the current form. |

New runtime: PF2e's choice pre-answered on generated forms, and the card's **cast-form** part.

## Tests

`test/rank-10-batch-3.test.js` is new. A whole-corpus compile (b788 → b789) changed only these two spells. `test/phase23-coverage.test.js` now checks Blanket of Stars' table as its aura's save.

## Evidence

[Live evidence](phase-rank-10-batch-3-live-results.json), case `rank10Batch3`, in the `pftest` world. Both casters are characters, since PF2e applies BattleForm only to characters.

| Step | Result |
| --- | --- |
| Avatar (Gorum) | Huge; AC 44 (25 + 19); the greatsword Strike; immune to Immobilized |
| Metamorphosis: Monstrosity Form (phoenix) at 8th | Its Effect and Shroud of Flame; 40 temporary Hit Points |
| The same form again | Refused ("already used during this casting") |
| Elemental Form (fire) at 8th | The Monstrosity Effect gone; Elemental Form; 40 temporary Hit Points |
| Metamorphosis's Effect removed | The Elemental Form Effect ends with it |
