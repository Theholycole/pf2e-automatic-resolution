# Rank 7 batch 19: the end of group 8

2026-10-05. The last two mode spells.

| Spell | Now |
| --- | --- |
| Control Sand | A 5-foot sandstorm following the caster. A creature starting its turn in it or moving in saves (Fortitude). On a failure it's Dazzled while inside (removed when it leaves), and it's then immune for 10 minutes. **Sand Shield**: a held shield of sand (Hardness 14, 21 Hit Points, no AC bonus), restored by choosing it again. **Sandblast**: one creature within 30 feet, 8d6 slashing, basic Reflex, Dazzled 1 minute on a critical failure. **Sandstorm**: the area grows to 30 feet, and a creature starting its turn in it or moving in takes 6d4 slashing (basic Reflex). Suffocation is a note. Switching modes removes the shield, ends the sandstorm and shrinks the area. |
| Vibrant Vibrato | An emanation of the caster's chosen radius (up to 40 feet) following it. Each creature inside at the cast, or entering, saves (Will) once per casting, and the module keeps the result. On a success, failure or critical failure, the creature takes 5d10 sonic at the end of each of its turns inside. On a failure or critical failure, leaving the area (or the caster moving away) brings the shattering sound: 5d10 sonic (1d10 more each rank; double on a critical failure), Stunned 1 (3), and Deafened for the rest of the spell. |

New runtime:

- An area's own condition save: "while inside" and a temporary immunity.
- Mode areas that resize, start a child hazard, or hold a shield.
- A kept save per creature (`remembered`), with its turn-end damage and the leaving trigger.
- The chosen radius.

## Tests

`test/rank-7-batch-19.test.js` is new. The compile is rank-9 batch 11's (b792).

## Evidence

[Live evidence](phase-rank-7-batch-19-live-results.json), case `rank7Batch19`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Control Sand: Sand Shield; the foe's turn start | The shield (Hardness 14); Dazzled while inside; immune |
| Control Sand: Sandblast's critical failure; Sandstorm | 52 and the shield gone; radius 30 feet; 30 at the foe's next turn start |
| Control Sand: the foe leaves | The "while inside" Dazzled removed |
| Vibrant Vibrato: radius 20; the saves | Critical failure and critical success kept |
| Vibrant Vibrato: turn ends; the failing foe leaves | 32 sonic for the failing foe, 0 for the other; 72 sonic, Stunned 3, Deafened |
