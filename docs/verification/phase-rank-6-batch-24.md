# Rank 6 batch 24: group 7, part 1

2026-10-05. Teleports on the battle map: the module moves the tokens (the 2026-10-03 decision).

| Spell | Now |
| --- | --- |
| Unexpected Transposition | The Will save. On a failure, the card's **Swap places** trades the caster and the creature, and marks both immune for 1 minute. Willing creatures (set to a failure) and the redirected attack are GM reminders. |
| Collective Transposition | The Will save. On a failure or critical success, the card's **Teleport within the area** moves the targeted creature to a clicked space: entirely within 30 feet of the caster and unoccupied. A space too far is refused. |
| Magnetic Dominion | The Reflex save. On a failure, the card's **Relocate a target** moves it within 100 feet; it's pressed again on each Sustain. **Magnetic Repulsion (rank 8) on yourself** casts that spell by its own route. |
| All is One, One is All | A card: **Switch positions** (two targeted creatures swap) and **Distribute Hit Points**. The total is kept, and each creature gets from 1 to its maximum; a wrong split is refused. |
| Proximal Shift | A card: **The crater** (Reflex: 5 bludgeoning and Prone on a failure), **The jump** (the caster to a clicked space within 60 feet), **The debris** (6d6 basic Reflex at the arrival), and **Difficult terrain** for 1 minute. Matter brought along and the failure with a creature are GM notes. |

New runtime: `teleport-runtime.js` (pick and check a space, move a token at once, swap two tokens, change elevation), and the card's **teleport**, **hp-share**, **descend** and **elevate** parts.

## Tests

`test/rank-6-batch-24.test.js` is new. A whole-corpus compile (b789 → b790) changed only these five spells.

## Evidence

[Live evidence](phase-rank-6-batch-24-live-results.json), case `rank6Batch24`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Unexpected Transposition: a failure, then the swap | Caster and decoy traded places; both immune |
| Collective Transposition: a failure; a space 50 feet away, then one in the area | Refused ("the spell allows 30"), then moved |
| Magnetic Dominion: a failure; Magnetic Repulsion | Moved 40 feet; Magnetic Repulsion applied to the caster |
| All is One, One is All: swap; 0/500, then 250/250 | Swapped; the bad split refused; 250 and 250 |
| Proximal Shift: crater failure, the jump, debris failure, terrain | 5 and Prone; caster moved 30 feet; 29 damage; difficult terrain |
