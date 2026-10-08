# Third-party features batch 18: the Wildblood instinct

2026-10-07. The eighteenth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)), in the cast-rider and spellshape families.

## What changed

- **Wildblood Instinct's rage damage on spells** (`readTextRules`, `plus-feature-rules.js`): the module's rules are checked against the text and kept (`verified`). They give a spell damage modifier while raging (slug `wildblood-rage`: 2, 4 from 7th level, 8 with greater weapon specialization, for a barbarian) and no rage damage on Strikes without the infusion.
- **Effect: Wildblood Infusion** (`readPassiveCastRider`): after every cast, the module's Effect on the caster (until the end of the next turn). Its damage type is the spell's, asked when there are several; with no damage, the type rule is left out. It replaces an earlier Infusion (`self-effect` rider: `choiceFromDamage`, `replace`).
- **Explosive Blood** (`plus-spellshapes.js`): requires raging (the new `raging` fact and requirement) and a damaging spell. It doubles the `wildblood-rage` spell damage and the melee Strikes' rage damage until the end of the caster's next turn, this spell included. "Would also damage you" is the table's.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 17 | Batch 18 |
| --- | --- | --- |
| spellshape | 44 / 51 | 45 / 51 |
| cast-rider | 32 / 66 | 33 / 66 |

## Tests

`test/third-party-features-batch-18.test.js` (3). All 1,829 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-18-live-results.json), case `thirdPartyFeaturesBatch18`. An 8th-level wildblood barbarian with Fireball:

| Step | Result |
| --- | --- |
| Fireball's damage, not raging | 6d6 fire |
| Raging | 6d6 + 4 fire |
| Fireball cast | Effect: Wildblood Infusion (Fire) |
| Explosive Blood, then Fireball | Explosive Blood: rage damage doubled (to the end of the next turn); 6d6 + 8 fire; still one Infusion |
