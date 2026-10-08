# Rank 9 batch 11: group 8, part 1

2026-10-05. Mode cards: spells whose effect is chosen on the cast and on each Sustain. The card's area holds the current mode's state; each mode sets that state and runs its own action.

| Spell | Now |
| --- | --- |
| Storm Lord | A 100-foot storm following the caster (and affecting it). **Calm.** **Fog**: Concealed. **Rain**: −2 to Acrobatics and Perception. **Wind**: −4 to ranged attacks, and difficult terrain for flyers. **Lightning bolt** once a round: 10d6 electricity, basic Reflex, Deafened 1 round on a failure. |
| Wrathful Storm | The placed cloud (1,000 feet at 10th) applies PF2e's Effect (−4 to physical ranged attacks) to the creatures under it. **Blizzard**: 4d8 cold, no save, plus concealment and difficult terrain. **Hail**: 4d10 bludgeoning, basic Fortitude. **Lightning**: up to 10 creatures, 7d6 electricity, basic Reflex. **Tornado**: thrown 40 feet up, then PF2e's falling. Never the same mode twice in a row. |
| Storm of Vengeance | The placed cloud's −4 to ranged attacks (generated). **Acid Rain**: 4d8 acid, no save. **Hail.** **Lightning**: up to 10. **Rain and Wind**: difficult terrain and Concealed. **Thunderclap**: Fortitude or Deafened 10 minutes. Never twice in a row. |
| Musical Shift | PF2e's Effect on the creatures in the 20-foot emanation, with the key signature for enemies and the time signature for allies, each changed on its own. |
| Dancing Fountain | A 30-foot burst where the caster stands. **Chasing Jets**: one creature's Reflex save or moved 15 feet. **Flashing Spray**: Concealed inside. **Power Rings**: 10d6 bludgeoning, basic Reflex, in a 10-foot burst. Never twice in a row. |
| Impaling Briars | The 100-foot briars around the caster. **Ensnare**: foes' Reflex save; −10 feet to Speeds, or Immobilized for 1 round unless they Escape. **Impede**: difficult terrain. **Wall**: a wall of thorns, greater difficult terrain, for 1 round. **Impale** once a round: a spell attack for 10d6 piercing and −10 feet; a critical hit doubles the damage and Immobilizes. |

New runtime:

- **Mode areas:** a region following the caster, fixed, or placed, whose member Effects (generated or PF2e's, in slots) and terrain each mode sets.
- **Mode parts** with hidden action parts, and "never twice in a row".
- **The launch part:** thrown up, then PF2e's falling.

The live run was repeated on the final code after the batch 19 changes.

## Tests

`test/rank-9-batch-11.test.js` is new. A whole-corpus compile (b791 → b792) changed these six spells and the two of rank-7 batch 19.

## Evidence

[Live evidence](phase-rank-9-batch-11-live-results.json), case `rank9Batch11`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Storm Lord: Rain, then Wind; the bolt's failure | −2 on the creatures and the caster; Rain replaced by Wind and flyers' terrain; damage and Deafened |
| Wrathful Storm: the cloud, Hail, Hail again, Tornado, Blizzard | PF2e's Effect on those under it; their saves; refused; 20 and Prone; cold, Concealed and difficult terrain |
| Storm of Vengeance: Thunderclap's failure, Acid Rain, Acid Rain again | Deafened and the −4; acid; refused |
| Musical Shift: Natural, Triple, then Flat | The foe's natural, the ally's triple; then flat for the foe, the ally unchanged |
| Dancing Fountain: Power Rings, again, Flashing Spray | Damage; refused; Concealed |
| Impaling Briars: Impede, Ensnare's critical failure, Impale | Difficult terrain; Immobilized; 10d6 piercing |
