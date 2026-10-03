# Cantrip / rank 1 batch 151 — text over PF2e data (four spells)

2026-09-28. User decision: Contagious Idea follows the text (5, +1 per heightened rank), and Eat Fire, Spirit Ward and Frenzied Revelry are automated to their text rather than carrying data notes.

| Spell | PF2e's rule | Now |
| --- | --- | --- |
| Contagious Idea | TempHP = rank | 5, +1 per rank above 1st (rank 5 gives 9) |
| Eat Fire | Resistance for 1 round (to the end of the caster's next turn) | Resistance on its own Effect, ending with the current turn. The spell (Belch Smoke) lasts its duration |
| Spirit Ward | Bonus against every spell, plus spirit and haunt origins | Spirit and haunt origins only |
| Frenzied Revelry | Bonus on Will saves against mental effects | Every save against mental effects |

**General:**
- `ruleOverrides` on PF2e's linked Effects is checked by index and key.
- Turn-bound module Effects end when their combat turn is over (PF2e overwrites the start initiative with the owner's).

## Tests

763/763 pass. New tests cover:
- `thoughtTempHP`: 5/6/9 at ranks 1/2/5.
- Each spell's override data.
- `prepareNativeEffectSource` overrides: patch, removal, and refusal of a changed rule.
- `turnBoundEnded`.

## Coverage

**Census:** **655 enabled** (unchanged; these spells were already enabled).
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-151-live-results.json), in the `pftest` world. The cases `cr1Batch149`, `cr1Batch145`, `cr1Batch147` and `cr1Batch150` were re-run with added checks.
- **Contagious Idea (rank 5):** both targets got 9 temporary HP, and the Effect's TempHP rule is 9.
- **Eat Fire:**
  - The spell Effect has no rules, and the resistance Effect gives fire 5.
  - In combat, cast on another creature's turn: fire 5 during that turn. On the next turn the resistance Effect was gone and fire resistance was null, while the spell Effect stayed.
  - Unconscious ends both Effects. Belch Smoke still works.
- **Spirit Ward:** the ally's Will save carried +2 with a spirit origin and +2 with a haunt origin, and nothing against a plain spell.
- **Frenzied Revelry:** a Fortitude save against a mental effect now carries +1 (Will too), and the critical rider still works.
- **Cleanup:** fixtures removed, and no combats left.

**Found live:**
- A pftest cantrip is stored at its heightened level, so the base rank for cantrips is 1.
- PF2e resets an Effect's start initiative to its owner's. With `removeExpiredEffects` on, it still didn't remove a 0-round `turn-end` Effect on the next turn, so the module ends turn-bound Effects itself.
