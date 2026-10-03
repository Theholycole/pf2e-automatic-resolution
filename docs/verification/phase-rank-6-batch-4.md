# Rank 6 batch 4 — Divine Decree, Petrify, Lignify

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Divine Decree | The critical failure's second Will save gets a level gate. "A creature of 10th level or lower" (+2 per rank, from the Heightened entry) attempts it; higher-level creatures don't. Its critical failure kills (as compiled). "Sent back to its home plane" is a GM row note (new kind `sent-home`), beside the row's damage and Enfeebled. Enemies only. |
| Petrify, Lignify | New reader (`escalating-rows.js`, `rewritePetrifyingRows`). The failing rows' Slowed lasts indefinitely, with an escalate end-of-turn save (failure +1, critical failure +2, success −1; at 0 it ends). New `atActions`: at the creature's action count (3, or 4 when Quickened) it gains Petrified and the spell's Effect ends. Lignify's "+2 circumstance bonus to saves against this spell" for plant creatures is a trait save bonus (`traitSaveBonus`) on its first and end-of-turn saves. Targets "made of organic material/flesh" are the GM's yes/no. |

Petrify no longer goes through the old ongoing route that matched its compendium ID (`scripts/ongoing-families.js` IDS). Its text drives the save card now. An unlimited Slowed that an end-of-turn save still moves keeps its cast tracked (it doesn't count as outliving the spell).

## Tests

`test/rank-6-batch-4.test.js` is new. A whole-corpus compile (b722 → b723) changed only these three spells.

## Evidence

[Live evidence](phase-rank-6-batch-4-live-results.json), case `rank6Batch4`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Divine Decree at 7th on levels 9 and 12, both critical failures | Only the level-9 creature attempts the second save (failed: Paralyzed); both Enfeebled 2; the home-plane note on the card |
| Petrify in combat, critical failure | Slowed 2; at the end of its turn the save card appears; a failure petrifies it and removes the spell's Effect |
| Lignify on a plant creature | Its save modifier is its Fortitude +2 |

**Cleanup:** fixtures and combat removed.
