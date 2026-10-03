# Rank 2 batch 6 — falls a row states

2026-09-30.

| Spell | Now |
| --- | --- |
| Dimensional Drop (2) | Failure: "falls 20 feet through the void" is 10 bludgeoning falling damage. Critical failure: 40 feet, 20 bludgeoning. The target line's "standing on the ground" is the GM's question (batch 5). |
| Unrelenting Gravity (2) | Success: Encumbered for 1 round. Failure and critical failure: Prone and Encumbered for 1 round. Each row's "if this spell causes the target to fall" rule is a GM note on the card. |

## Rules

- **Falling damage:** "The target falls N feet through the void before reappearing." on a row with no damage or effects of its own deals half the distance in bludgeoning damage, PF2e's falling damage.
- **Fall riders:** "Additionally, if this spell causes the target to fall, the DC to Arrest a Fall is your spell DC." and "… the target can't Arrest a Fall, and falling damage is doubled." are GM row notes. Whether the creature falls from a height is the GM's call.
  - Following the behaviour-note rule, a fall rider is allowed only beside the row's Prone. Without it, the core refuses the note.
- **Unlinked Prone:** "The target falls prone and is encumbered for 1 round." now gives Prone as well as Encumbered.

**Considered, not in this batch:**
- **Expeditious Excavation:** its area is a cube of dirt, and the pit's descent is the creature's choice.
- **Earthbind:** its "falls safely up to 120 feet" and flight ban need a lifecycle the save route doesn't have.
- **Banishing Touch:** an attack spell, not a save.
- **Horrifying Blood Loss:** a frightened floor "until it stops bleeding" is a new floor lifetime, so it's left for a later batch.

## Tests

792/792 pass. `test/rank-2-batch-6.test.js` is new. It checks:
- Dimensional Drop's damage, and that a row with other damage isn't read as a fall;
- Unrelenting Gravity's conditions and notes, and the core's refusal of a fall rider without Prone.

A whole-corpus compile (b259 → b260) changed only Dimensional Drop and Unrelenting Gravity.

## Coverage

**Census:** **805 enabled**, up from 803. Rank 2: 70 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-6-live-results.json), case `rank2Batch6`, in the `pftest` world.
- **Dimensional Drop:** with both targets confirmed as standing on the ground, the failure lost 10 HP and the critical failure 20.
- **Unrelenting Gravity:**
  - Success: Encumbered only.
  - Failure and critical failure: Prone and Encumbered.
  - The card's GM notes read "If this spell makes it fall, the DC to Arrest a Fall is your spell DC." (failure) and "… it can't Arrest a Fall, and its falling damage is doubled." (critical failure). The success had no note.
- **Cleanup:** fixtures removed; no combats or PFTEST regions left.
