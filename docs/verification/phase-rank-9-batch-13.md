# Rank 9 batch 13: the user's answers

2026-10-05. The four QUESTIONs from groups 5, 9, 10 and 11, answered.

| Question | Answer | Now |
| --- | --- | --- |
| Unbreaking Wave Containment: the crush on every Sustain? | Every Sustain | Already the card's behaviour (the crush part repeats on each Sustain). |
| Bound in Death: the moved damage's type when PF2e doesn't record it? | The GM picks | The module asks the GM for the type and applies the foe's resistances and weaknesses to it. Love's Sacrifice uses the same transfer, so it asks too. |
| Cataclysm: "resistances … 10 lower"? | The module applies it | The save card reads each resistance PF2e applied and the creature's resistance value. Each resistance then stops only min(damage, resistance − 10), and the rest is given back as damage. The GM note is gone. |
| Monstrosity Form: the extra die at 9th for Spine Rake and the shroud? | Yes | Heightened (9th)'s "increase damage by one damage die" now raises the form's own damaging abilities too: the shroud's 2d6 → 3d6, Spine Rake's 4d8+10 → 5d8+10. PF2e's Effect already raises the Strikes. |

## Tests

`test/rank-9-batch-13.test.js` is new. A whole-corpus compile (b799 → b800) changed only Cataclysm and Monstrosity Form. Bound in Death's change is in the runtime.

## Evidence

[Live evidence](phase-rank-9-batch-13-live-results.json), case `rank9Batch13`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cataclysm (ground, failure): a creature without resistances and one with fire 10 and acid 5 | Both lost 96 (15 given back to the resisting one) |
| Bound in Death: 20 untyped damage to the caster; the GM picks fire; the foe has fire weakness 5 | Caster 10, foe 15 |
| Monstrosity Form at 9th: the phoenix's shroud; the sea serpent's Spine Rake (failure) | 3d6; 5d8+10, 32 damage |
