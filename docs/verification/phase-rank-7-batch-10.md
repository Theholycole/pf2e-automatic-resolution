# Rank 7 batch 10 — Entrancing Eyes

2026-10-03. Ranks 6–10 pass, continued.

| Spell | Now |
| --- | --- |
| Entrancing Eyes | A sustained 30-foot emanation on the caster: a creature ending its turn inside attempts the Will save. A critical success makes it immune to this caster's casting for the spell's minute (the area then skips it). A failure: Stupefied 2 and Fascinated until the end of its next turn; a critical failure: Stupefied 4 and Fascinated, with a note that it can't take reactions and everything else is Concealed from it. The Sustain focus action is the GM's control: it exposes the targeted creature to the save at once, and the failing rows carry the note that a creature already Fascinated by the eyes is also Paralyzed for 1 round. |

Runtime: an area's immunity key now includes the caster when the immunity is per caster, so the area skips a creature immune to that caster's casting.

## Tests

`test/rank-7-batch-10.test.js` is new. A whole-corpus compile (b747 → b748) changed only Entrancing Eyes.

## Evidence

[Live evidence](phase-rank-7-batch-10-live-results.json), case `rank7Batch10`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Round 1: two creatures end their turns inside | Both save: one critically succeeds (immune), one critically fails (Stupefied 4, Fascinated, the Entranced note) |
| Round 2 | Only the non-immune creature saves again |
| The focus control on a creature outside the turn order and the immune one | The first is exposed; the immune one is refused |

**Cleanup:** fixtures removed.
