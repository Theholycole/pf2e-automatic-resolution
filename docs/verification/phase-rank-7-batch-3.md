# Rank 7 batch 3 — Hungry Depths, Mask of Terror

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Hungry Depths | Extra-lingering reader: a placed 5-foot burst saved against when cast. Creatures it moves through on a Sustain use the GM's control (once per round each), so there are no turn events. Growing its radius (to 15 feet), moving it, and its underwater cylinder are notes. The core accepts a "GM control only" area that also saves when cast, if it's sustained, moves, and hits each creature once per round. |
| Mask of Terror | Repeat-save, new variant: the Effect goes on the masked creature (up to 5 from 8th). The card's button rolls the acting creature's Will save: Frightened 2 on a failure; on a critical failure also a GM row note (new kind `action-wasted`: void the action). Immune until the end of its next turn (a 1-round immunity), so a second press on it is refused. |

## Tests

`test/rank-7-batch-3.test.js` is new. A whole-corpus compile (b724 → b725) changed only these two spells.

## Evidence

[Live evidence](phase-rank-7-batch-3-live-results.json), case `rank7Batch3`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Hungry Depths placed | No turn events, initial save, the vortex control, once per round, moves on Sustain |
| Mask of Terror; an attacker critically fails | The masked creature's Effect; the attacker is Frightened 2 with the "void the action" note and a 1-round immunity; a second press is refused |

**Cleanup:** fixtures and region removed.
