# Rank 10 batch 5: group 13, revival

2026-10-05. Spells that bring creatures back, each as a card.

| Spell | Now |
| --- | --- |
| Raise Dead | **The return**: for a dead creature up to the level for the rank (13, then 15, 17, 19, 21), the GM answers whether its soul returns. If not, the spell fails and the cost isn't spent. If so, it lives with 1 Hit Point. An Effect grants Clumsy 2, Drained 2 and Enfeebled 2 for a week; they can't be removed while it lasts. The cost and lost resources are GM notes. |
| Revival | **The burst**: one 10d8+40 roll. Living targets heal; undead are skipped. Each dead target the GM confirms comes back with that many temporary Hit Points and no others, plus Raise Dead's debilitation. The module holds any other healing or temporary Hit Points it would gain. When the spell ends (a missed Sustain or its minute), it loses them and dies. |
| Shock to the System | **The jolt**: a corpse that died within the last round (the GM confirms) comes back. Dying is cleared, Wounded goes up by 1, and its initiative is placed just before the caster's. Then 8d8 healing (+2d8 per rank) wakes it. For 1 minute it is Quickened and can cast Thunderstrike (rank 5, +1 per rank) as an innate spell at the caster's DC. A cloud in its space makes creatures inside Hidden until the end of its next turn. |
| Moment of Renewal | **The day's recovery** for up to 6 creatures. Effects that would end within 24 hours and impose conditions or penalties end (not running spells). Each regains a day's rest of Hit Points (Constitution modifier, at least 1, × twice the level). Fatigued is removed, Drained and Doomed go down by 1, and Wounded is removed at full Hit Points. Then each is immune for a day. |

New runtime:

- Card parts: **raise**, **revive**, **shock** and **renewal** (`scripts/revival-runtime.js`).
- A hold on healing and temporary Hit Points (`noHealing`).
- The raised creatures' death when the spell ends.
- A region area that ends at the end of a creature's next turn.
- Fix: PF2e adds a value to an existing condition, so the module's new code passes the difference when raising a condition to a stated value. This covers Rainbow Fumarole's added effects, Divinity Leech's Stunned 1 and Touch of Death's Stunned.

## Tests

`test/rank-10-batch-5.test.js` is new. A whole-corpus compile (b796 → b797) changed only these four spells.

## Evidence

[Live evidence](phase-rank-10-batch-5-live-results.json), case `rank10Batch5`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Raise Dead: a level-1 corpse returns; a level-20 corpse; a refusal | 1 Hit Point, alive, Clumsy/Drained/Enfeebled 2; refused (above 13); still dead |
| Revival: a hurt creature and a corpse | Both 87: healed, and alive at 0 with 87 temporary; healing and temporary Hit Points held; dead again after the missed Sustain |
| Shock to the System: a corpse (Wounded 1) | Alive with 41, Wounded 2, Quickened, Thunderstrike at rank 5, initiative just before the caster, Hidden in the cloud |
| Moment of Renewal: Fatigued, Drained 2, a 10-minute Sickened Effect and a 2-day penalty; then again | +2 Hit Points, Fatigued gone, Drained 1, the short Effect ended (the long one kept); then immune |
