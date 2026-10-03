# Cantrip / rank 1 batch 153 — value, type, attribute and next-turn corrections

2026-09-28. User decision (the text over PF2e's data): four more data notes become automation.

| Spell | PF2e | Now |
| --- | --- | --- |
| Reinforce Eidolon | Resistance `floor(rank/2)` (0 at rank 1) | `max(1, floor(rank/2))` |
| Sting of the Sea | −2 circumstance to visual Perception | −2 untyped |
| Hand of the Apprentice | +Intelligence to the weapon's damage | +the caster's spellcasting attribute |
| Swampcall | Lasts to the start of the caster's next turn | Ends after the creature's next turn (or when it leaves) |

## Tests

765/765 pass. `turnBoundEnded` has a next-turn test, and the earlier data-note assertions are now structured.

## Coverage

**Census:** **655 enabled** (unchanged).
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-153-live-results.json), case `cr1Batch153`, in the `pftest` world.
- **Reinforce Eidolon (rank 1):** the eidolon's all-damage resistance is 1.
- **Sting of the Sea:** on a success, the Effect's modifier type is `untyped`.
- **Hand of the Apprentice:** a Charisma caster's Effect has an ability modifier of `cha`.
- **Swampcall** (in combat, caster first):
  - The critically failing creature's Effect carried `turnBound` with its actor.
  - It stayed through that creature's turn, and was gone when the next round's turn began.
- **Cleanup:** fixtures, combats and PFTEST regions removed.
