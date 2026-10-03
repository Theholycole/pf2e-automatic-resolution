# Rank 6 batch 13 — Dominate, Never Mind

2026-10-03. Ranks 6–10 pass, continued.

| Spell | Now |
| --- | --- |
| Dominate | A failure: Controlled until daily preparations (1 day), ended by the end-of-turn Will save. A critical failure: Controlled for the day, with a note that a new save comes only when the caster orders something against its nature (the GM rolls it). "Doesn't act on a self-destructive order" is a GM reminder. At 10th rank (unlimited duration) the card refuses: resolve it by hand. |
| Never Mind | A success: Stupefied 2 for 1 round. A failure: Stupefied 4 with no end. A critical failure: an unlimited Effect overriding Charisma, Intelligence and Wisdom modifiers to −5 (PF2e's ActiveEffectLike), with the lost class abilities and spellcasting, and a PC becoming an NPC, in its note. "Removed only through effects that target curses" is a GM reminder. |

## Tests

`test/rank-6-batch-13.test.js` is new. A whole-corpus compile (b748 → b749) changed only these two.

## Evidence

[Live evidence](phase-rank-6-batch-13-live-results.json), case `rank6Batch13`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Dominate: failure / critical failure | Controlled for 1 day with the end-of-turn save / Controlled and the Dominated note; the reminder on the card |
| Never Mind: failure / critical failure | Stupefied 4, unlimited / Charisma, Intelligence and Wisdom modifiers −5 (no Stupefied) |

**Cleanup:** fixtures removed.
