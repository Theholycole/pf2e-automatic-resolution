# Rank 10 batch 2 — group 3, part 3

2026-10-05. Four more spells of feature group 3.

| Spell | Now |
| --- | --- |
| Pied Piping | A save-once emanation; the caster picks the radius (60 feet offered). Each creature inside, or entering, saves once (its card), and is then immune for 1 day. Success: Fascinated. Failure: Fascinated plus the "move toward you and compliment you" note. Critical failure: Controlled, and a minion the caster's players own. These last for the spell even outside the area and end with it (ownership and traits restored). Optional Sustain grows the radius by 5 feet; Dismiss. |
| Flesh Tsunami | A card of parts: destroy the thrall; a 60-foot cone of greater difficult terrain for 1 minute (placed); destroy a second thrall; the enemies' Fortitude save: Immobilized for 1 round or until it Escapes (the spell DC). |
| Shadow Army | A lingering 50-foot burst: enemies inside when cast, or ending their turns inside, save. Damage is 3d10 mental + 3d10 bludgeoning (half/full/double). The condition the caster picks at the start applies on a failure, until the end of the creature's next turn. A critical success takes nothing, and that creature's later saves are a degree better. |
| Vacuum | A sustained 15-foot emanation: saves when cast, on entering, and on the first Sustain each round. A "stopped holding its breath" GM control covers the rest. Success: holding its breath (a note). Failure: Stunned 1 and holding its breath with half its air. Critical failure: Unconscious and suffocating. A creature holding its breath from this spell saves a degree better. |

New runtime:

- **Save-once auras:** rows held outside the area, immunity after the save, minion control on a row, a default radius, and Dismiss.
- **Card terrain parts:** a placed shape with greater difficult terrain.
- **Lingering condition choice:** the caster's pick of the failing rows' condition.
- **`note-held` degree adjustment:** a creature holding a note from this spell saves a degree better.

Interpretations are logged in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-10-batch-2.test.js` is new. A whole-corpus compile (b775 → b776) changed only these four spells.

## Evidence

[Live evidence](phase-rank-10-batch-2-live-results.json), case `rank10Batch2`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Pied Piping at 10 feet: two creatures | A critical failure is Controlled and a minion; the other critically succeeds (nothing); both immune; still Controlled after leaving; ending the spell restores it |
| Flesh Tsunami: two thralls and an enemy | Both thralls destroyed; greater difficult terrain (3); the enemy fails: Immobilized |
| Shadow Army with Slowed chosen | A critical success takes 0 and gets the note; a failure takes 29 and is only Slowed; the first creature's next save is adjusted from failure to success |
| Vacuum: success, failure, critical failure | Holding its breath; Stunned 1 and holding; Unconscious and suffocating; on the Sustain, the holder's save adjustment applies |
