# Rank 8 batch 17: the end of group 7

2026-10-05. The last four movement spells.

| Spell | Now |
| --- | --- |
| Heaving Earth | The explosion's basic Reflex save for 12d10. A failure has Prone and the 10-foot push reminder; from 9th rank, a second target. The card's **The tremors** is the line's Reflex save, with a 10-foot push on a failure. "On the ground" and the solid surface are GM notes. |
| Earth and Sky | The Fortitude save, with PF2e's falling damage for the 100-foot launch on the rows: 50 bludgeoning and Prone on a success or failure, 100 on a critical failure. The card's **Rise** lifts the caster 100 feet. Arrest a Fall, a shorter rise and the gentle landing are GM notes. |
| Deluge | The Reflex save, with a 50-foot push from the burst's centre on a failure. The card's **Flyers forced down** lowers the targeted flying creatures 50 feet (10 more each rank). One stopped by the ground takes the feet it fell as bludgeoning damage and is Prone. |
| Amalgamizing Leap | The Fortitude save, with Enfeebled 1 on a success and Sickened 1 on a critical failure. The card's **The leap** moves the caster within 60 feet. **A piece of the target** gives 20 temporary Hit Points until the end of the caster's next turn. **Fused together** hides the target and gives the caster 40 temporary Hit Points and +5 reach until the end of its next turn; the target then returns beside it. |

New runtime: the card's **fuse** part (and the target's return when it ends), and Earth and Sky's fall damage rolled from the text.

## Tests

`test/rank-8-batch-17.test.js` is new. A whole-corpus compile (b790 → b791) changed only these four spells.

## Evidence

[Live evidence](phase-rank-8-batch-17-live-results.json), case `rank8Batch17`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Heaving Earth: explosion failure, tremors failure | 60 and Prone, push reminder; tremors push reminder, no damage |
| Earth and Sky: success, critical failure, critical success; the rise | 50 and Prone; 100 and Prone; 0; caster at 100 feet |
| Deluge: failure; flyers at 30 and 80 feet | Push reminder; 30 and Prone at the ground; 80 → 30 unharmed |
| Amalgamizing Leap: success, then failure | Enfeebled 1 and 20 temporary Hit Points; moved 30 feet, target hidden, 40 temporary Hit Points, +5 reach; the target back beside the caster |
