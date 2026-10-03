# Rank 2 batch 19 — a repeated compulsion with an end-of-turn save; introduction rules

2026-09-30.

| Spell | Now |
| --- | --- |
| Charitable Urge (2) | The GM confirms each target has items on its person (otherwise the spell fails for it). Success: Stunned 1. Failure: a "Compelled" note for its next turn (present the nearest creature with an item, or choose to be stunned for 1 round instead). Critical failure: the same for 4 rounds, repeated each turn, with a Will save at the end of each of its turns that shortens it by a round (a critical success ends it). |
| Retrieving Hook (2) | Its "If the target is a willing ally or unattended object, they automatically fail the save." is now a card reminder. Before, the sentence wasn't recorded. |

## Rules

- **Next-turn compulsion:** "On its next turn, before it does anything else, the target must …" (a row with nothing else) is a note for the creature's next turn.
  - A condition it "can choose to be" instead was read as a grant (Stunned on the failure); now it's the creature's option.
- **Repeated with a save:** "As failure, except the duration is N rounds, and the target must repeat the effects of a failure on each of its turns. At the end of each of its turns, the target can attempt a new <save> to reduce the remaining duration by 1 round, ending the effects entirely on a critical success."
  - It becomes the failure's note for N rounds, carrying the end-of-turn save.
  - The Ongoing record's existing recurring-save runtime prepares the save card at the end of the creature's turn and shortens or ends the note.
- **From the introduction:**
  - "If the target has no X on its person, the spell fails." is a GM question per target.
  - "If the target is a willing ally …, they automatically fail the save." is a card reminder.

## Introduction scan

Supported save plans were checked for introduction sentences with a rule word (if, unless, fails, can't, must, only, whenever, immune, instead) that the plan doesn't record.
- **Excluded:** the save statements and attack-damage sentences.
- **Already handled in another form:** Déjà Vu's repetition, Turbulent Tide's push, Purifying Icicle's undead damage, Gravity Well's pull, Vision of Death's death at 0 HP, Tame's domesticated question and Equal Footing's Speed check.
- **Flavour or narration:** Phantasmal Killer's "only the target can see", Binding Muzzle's single mouth, Signal Skyrocket's sight distances, Sleep's waking clarification.
- **Real gaps (fixed here):** Charitable Urge's "no items" and Retrieving Hook's auto-failure.

## Tests

827/827 pass. `test/rank-2-batch-19.test.js` is new. It checks:
- Charitable Urge's rows, notes, end-of-turn save and question;
- Retrieving Hook's reminder, and the refusal of a forged reminder.

A whole-corpus compile (b272 → b273) changed only Charitable Urge and Retrieving Hook.

## Coverage

**Census:** **1053 enabled**, up from 1052. Rank 2: 141 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-19-live-results.json), case `rank2Batch19`, in the `pftest` world, in a started combat.
- **Charitable Urge:**
  - The card shows the items question.
  - Success: Stunned 1.
  - Failure: "Compelled" until the end of its turn (0 rounds, turn-end, since its turn comes later this round), and no Stunned.
  - Critical failure: "Compelled" for 4 rounds, with the recurring Will save.
  - When the critical target's turn ended, Ongoing spells prepared "urge critical: end-of-turn will save (Charitable Urge)"; a success left 3 rounds.
- **Retrieving Hook:** the card shows the auto-failure reminder.
- **Cleanup:** fixtures and the combat removed; no PFTEST regions left.
