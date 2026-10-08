# Rank 7 batch 18: group 5, part 2

2026-10-05. Two more spells of feature group 5. Each is PF2e's Effect, plus the form's card for what the Effect doesn't do.

| Spell | Now |
| --- | --- |
| Corrosive Body | PF2e's Effect: acid immunity, the unarmed acid dice, and the extra die on acid spells (all proved against the text, including 9th rank). **Corrosive touch** on the card deals 3d6 acid (4d6 at 9th) to the targeted creature. The caster also gains 3d6 temporary Hit Points (5d6 at 9th), the first time each round. **Digesting acid** gives the same temporary Hit Points when an unarmed hit deals its acid. What's left of them ends with the spell. Acid Splash as an innate spell is a GM note. |
| One with the Land | PF2e's Effect (tremorsense 200 feet). **Terrain vengeance Strike** is the caster's spell attack against a creature within 60 feet, for 5d12 of the type chosen on the card. **Difficult terrain** places a 20-foot burst for the spell's minute. **Expelled** deals 10d6 to the caster. Cover, line of effect and the temperature action are GM notes. |

New runtime: the card's **retaliate** part (damage, then the caster's temporary Hit Points once a round), its **temp-hp** part, and temporary Hit Points that end with the form.

Interpretations are logged in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-7-batch-18.test.js` is new. A whole-corpus compile (b785 → b786) changed these two spells. It also changed the three part-1 forms, which now carry an empty list of card parts.

## Evidence

[Live evidence](phase-rank-7-batch-18-live-results.json), case `rank7Batch18`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Corrosive Body: the touch | 12 acid on the creature; 8 temporary Hit Points for the caster |
| Corrosive Body: digest in the same round, then the next round | Refused ("already this round"), then 10 rolled |
| Corrosive Body: the Effect ends | Temporary Hit Points 0 |
| One with the Land: a Strike (success), piercing | Spell attack; 34 piercing |
| One with the Land: the burst, then the expulsion | Difficult terrain on the region; 29 damage to the caster |
