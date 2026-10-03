# Cantrip / rank 1 batch 156 — six scope corrections

2026-09-28. User decision (the text over PF2e's data): the six remaining automatable data notes.

| Spell | PF2e | Now |
| --- | --- | --- |
| Murmuration | −2 to the next attack or skill check | Only hostile rolls (attack, attack trait, an enemy target) |
| Curse of Recoil | −2 to all ranged attacks | Only the first ranged attack's weapon, spell or ability |
| Healer's Blessing | +2 to every healing spell | Once per spell. A new cast counts afresh |
| Song of the Soul | Fast healing everywhere | Only within 15 feet of the thrall |
| Crushing Ground | Escape ends Off-Guard too | Escape ends only Immobilized |
| Hippocampus Retreat | Lasts to the start of your next turn | Ends when the caster's movement ends |

## Tests

770/770 pass, including `healingSourceOf`, `modifierLabel`, Murmuration's override, and the structured fields.

## Coverage

**Census:** **655 enabled** (unchanged).
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-156-live-results.json), case `cr1Batch156`, in the `pftest` world.
- **Murmuration:** a Hide check had no penalty and kept the Effect. A Strike took −2 and used it.
  - This used PF2e's Effect with the compiled override, created directly: the "moves closer" trigger wasn't exercised.
- **Curse of Recoil:**
  - The first bow shot took −2, and the penalty locked to the bow's id.
  - A sling shot had no penalty, and the bow again had −2.
- **Healer's Blessing:** heals of 5 from one spell gave 7, then 5. After a new cast message of that spell, it gave 7 again.
- **Song of the Soul:** the thrall was bound. Fast healing was on while near, off at 40 feet away, and on again when back.
- **Crushing Ground:** Off-Guard and Immobilized, then the Escape handler left Off-Guard only. The Effect stays and can't be escaped again.
  - The handler was called directly: no Escape roll or card was used.
- **Hippocampus Retreat:** the Effect was there after the hit and gone after the caster's token moved.
- **Cleanup:** fixtures removed, including a probe actor left from a failed experiment, and no combats left.
