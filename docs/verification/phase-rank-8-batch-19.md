# Rank 8 batch 19: group 11, triggers

2026-10-05. Spells that answer a trigger. Each is a card whose later triggers the module watches.

| Spell | Now |
| --- | --- |
| Bound in Death | **The life link** on the targeted foe. Each time the caster takes damage, the module rolls the foe's Will save. A failure or critical failure moves half the damage to the foe (the caster gets it back; the foe takes it with its own IWR). After a success or failure, the foe can't take damage from the link for 1 round. A critical success ends the spell. Beyond 120 feet, or either creature at 0 Hit Points, ends it. **Damage yourself** (6d8, +3d8 per 2 ranks) on a Sustain, linked as normal. A missed Sustain ends it. |
| Love's Sacrifice | **The sacrifice**: the GM answers whether the ally genuinely loves the caster (it then fails). Otherwise the module rolls its Will save. On a success the ally moves beside the caster and takes half of the damage the caster just took; on a failure, all of it. The caster's Hit Points are given back for the rest (at least 1, never Dying). An ally reduced to 0 on a failure dies. |
| Blinding Fury | **The fury**: the module rolls the creature's Will save. A success or worse gives it an Effect: it can't observe the caster until the end of its turn (the caster is Hidden to it). A failure adds a 1-minute curse: each time it damages the caster, again. A critical failure adds an unlimited curse: the first creature it damages each round, again. The module reads the damage's origin. |
| Divinity Leech | **The disruption**: Will save, Fatigued on a failure; the target is then watched. Each time it casts a divine spell, the module heals the caster 6d6 and rolls the target's Will save: Stunned 1, or Stunned for 1 round, with the GM undoing the lost spell; on a success, the GM improves the spell's targets' results. It ends with the Sustain. |
| Mimic Spell | **The counteract** against the triggering creature's spell (its latest spell card, or the GM's pick). It must be of the caster's tradition and no higher rank. On a success, the caster gets a one-use copy at this rank in a spellcasting entry of its own tradition. The copy is lost at the end of the caster's next turn unless Sustained (up to 1 minute). |
| Touch of Death | **The touch**: after the caster's unarmed Strike hits a living creature (its latest Strike, or the GM's word), the mark for the spell's month. **The word of death**, Fortitude: the critical success and success end the spell, with 24-hour immunity; the success adds Stunned 1 and 5 × rank damage. A failure is Stunned 3 and 10 × rank damage, plus 24 hours' immunity to being killed by it. A critical failure kills (a failure while that immunity holds). A new casting ends the old. |
| Unblinking Flame Emblem | **The emblem** on the struck enemy for 3 rounds. Attack rolls against it are +1: a –1 status penalty to its AC. The caster's and its allies' Strikes against it deal 1d6 fire, plus 1d10 persistent fire on a critical hit (1d8 and 1d12 from 9th). The caster is Off-Guard against other enemies. A new casting replaces the old. |

New runtime:

- Card parts: **link**, **sacrifice**, **fury**, **leech**, **mimic**, **death-mark**, **word** and **emblem** (`scripts/trigger-runtime.js`).
- Hooks for the caster's damage (the link), a cursed attacker's damage (the fury) and a watched creature's spell (the leech).
- A card part on the caster itself (`self`).
- Cards whose new casting ends the old (`replaces`).

## Tests

`test/rank-8-batch-19.test.js` is new. A whole-corpus compile (b795 → b796) changed only these seven spells.

## Evidence

[Live evidence](phase-rank-8-batch-19-live-results.json), case `rank8Batch19`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Bound in Death: 20 damage to the caster (foe critically fails); the Sustain's self-damage; the foe at 5 Hit Points | 10 each; the foe 20 in all; the link ended at 0 |
| Love's Sacrifice: a success (30 damage, the caster had 10) | The ally beside the caster takes 15; the caster at 1, not dying |
| Love's Sacrifice: a loving ally at 20 Hit Points | Failure, the caster back to 40, the ally dead |
| Blinding Fury: critical failure; it damages two creatures in a round; another's failure, then damaging the caster | Can't observe the caster, then only the first creature; can't observe the caster again |
| Divinity Leech: Fatigued; the target casts Heal | The caster heals 24; the target stunned |
| Mimic Spell: the counteract against Fear; no Sustain | A one-use Fear at rank 8; lost after the caster's next turn |
| Touch of Death: failure; critical failure while immune; a new casting; another target's critical failure | 80 and Stunned 3; read as a failure, alive; the old mark gone; dead |
| Unblinking Flame Emblem: cast, then cast again | Target AC –1, fire dice on the caster and an ally, the caster's Off-Guard; all replaced |
