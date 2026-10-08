# Spellshape batch 6: family E, the caster's benefits

2026-10-05. Feats that protect or help the caster or an ally as the spell is cast.

- **Cast riders:** run as the cast is recorded (`applyCastRiders`): a resistance on the caster (chosen, or the spell's elements), PF2e's Effect on the caster (its choice from the spell's traits), a benefit by the spell's tradition, and an Effect on the caster or an ally within reach. A choice can be given on the feat's armed Effect; otherwise the GM is asked.
- **Vampiric Spell:** after the card, half the most damage any creature took, as temporary Hit Points for 1 minute (removed with the Effect).
- **Safeguard Spell:** the caster isn't a target on the spell's save card.
- **Requirements added:** "deals at least one type of energy damage (…)"; "has at least one element trait (…)"; "with the air or water trait"; "with an area"; "from your spell slots"; a named composition cantrip; a grave spell (a necromancer's focus spell).

| Feat | Now |
| --- | --- |
| Vampiric Spell | Temporary Hit Points: half the most damage, for 1 minute. |
| Energy Ablation | Resistance to the chosen energy type equal to the rank, until the end of the caster's next turn. |
| Elemental Defense | Resistance to the spell's elements, twice the rank, until the caster's next turn starts. |
| Current Spell | PF2e's Effect (+1 AC or +2 against ranged attacks; saves), its element the spell's. |
| Dualistic Synergy | Arcane: +1 (+2 from 7th rank) to Recall Knowledge this turn. Primal: the rank in temporary Hit Points for 1 round. |
| Safeguard Spell | The caster isn't affected. |
| Familiar's Resolve | The caster or a chosen ally within 30 feet: +2 (+3 from 14th level) to saves against doomed or frightened for 1 round. |
| Skeletal Extension | PF2e's Effect: reach +10 this turn. The 15-foot Step is the table's. |
| Gusting Spell, Defensive Coordination | Read; the table's. |

## Tests

`test/spellshape-batch-6.test.js` is new. Coverage: 38 of 131 feats and 12 of 49 wand kinds read.

## Evidence

[Live evidence](phase-spellshape-batch-6-live-results.json), case `spellshapeBatch6`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Vampiric Spell on Fireball (12 the most) | 6 temporary Hit Points, timed |
| Energy Ablation (cold) on Fireball (3rd) | Cold resistance 3 |
| Elemental Defense on Fireball | Fire resistance 6 |
| Current Spell on Gust of Wind | PF2e's Effect, air |
| Dualistic Synergy: Fireball (arcane), Gust of Wind (primal) | +1 Recall Knowledge; 1 temporary Hit Point |
| Safeguard Spell on Fireball, the caster and a foe targeted | Only the foe on the card |
| Familiar's Resolve (the ally) | The ally's +2 |
| Skeletal Extension on Bone Spear | Reach +10 |
| Gusting Spell on Gust of Wind | Read; met |
