# Rank 6 batch 22 — group 4, part 2

2026-10-05. Four more spells of feature group 4.

| Spell | Now |
| --- | --- |
| Calcification | A card. **Destroy the thrall**, then **Bone dust**: the save of a creature within 60 feet. Success: Slowed 1 and weakness 5 to bludgeoning for 1 round. Failure: Slowed 1 (critical failure: Slowed 2), with Petrify's escalating end-of-turn save (Petrified at its action count; ends at 0). A weakness 10 note lasts as long as the Slowed. |
| Vitrifying Blast | Reflex for 8d6 piercing (+1d6 a rank). Success: half damage and weakness 3 to sonic and bludgeoning for 1 round. Failure and critical failure: Slowed 1 or 2, escalating with an end-of-turn Fortitude save (+1/+2, −1/−2, at most 3, ending at 0). A note's weakness to sonic and bludgeoning stays at 3 × the current Slowed value and ends with it. |
| Chrysopoetic Curse | Will, for 1 minute. Encumbered behind the GM's "wearing armor or clothing?" question, and Clumsy 3 behind "holding weapons or objects?" (failure and critical failure). The Hardness −5 and the critical failure's liquid gold are notes. |
| Dread Secret | Up to 6 targets. Failure: Frightened 1; critical failure: Frightened 3. Every failing row has the secret's note (1 damage of the chosen weakness's type, or the chosen resistance lost until the end of your next turn). |

New runtime:

- **Keyed GM questions:** a gate's `key` gives each condition its own yes/no question on the card, and the apply step keeps them apart.
- **Condition-linked notes:** `withCondition` ends the note when the condition ends and keeps its Weakness at the value × the multiplier.
- **Weakness rules on row notes.**

Interpretations are logged in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-6-batch-22.test.js` is new. A whole-corpus compile (b781 → b782) changed only these four spells.

## Evidence

[Live evidence](phase-rank-6-batch-22-live-results.json), case `rank6Batch22`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Calcification: the thrall, then a failure | Thrall destroyed; Slowed 1 escalating; weakness 10; the Slowed removed → the note ends |
| Vitrifying Blast: a failure, its Slowed raised to 2, then removed | Weakness 3 → 6 → gone |
| Chrysopoetic Curse: a failure, armor yes, held no | Encumbered (PF2e's own Clumsy 1), no Clumsy 3, the Gilded gear note, both questions answered |
| Dread Secret: a failure | Frightened 1 and the Dread secret note |
