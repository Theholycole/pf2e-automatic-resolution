# Rank 5 batch 10 — Incarnate Faerie Revelers, Incarnate Skeletal Giant, Incarnate Shadow Minuet

2026-10-02. Part of the user's ranks 3–5 pass. (Incarnate Shadow Minuet is rank 4.) This is the incarnate family: rank 6–10 incarnates may follow with more phase forms.

| Spell | Now |
| --- | --- |
| Incarnate Faerie Revelers (5) | The cast posts a card with an Arrive button and a Depart button. Each button opens a save card for the creatures the GM targets. **Arrive (Mischief):** a Will table, Stupefied and Clumsy 1–3 for 1 round. **Depart (Mischance):** a Will table; a failure gets a 1-round note carrying PF2e's RollTwice on attack rolls and skill checks, gone after the first roll; a critical failure keeps it for every roll that round. |
| Incarnate Skeletal Giant (5) | **Arrive:** a Fortitude table (Prone, Clumsy 1–2). **Depart:** up to 2 targets within 30 feet take 6d6 bludgeoning (basic Reflex; +2d6 a rank). |
| Incarnate Shadow Minuet (4) | **Arrive:** a Will table; Off-Guard for 1 round, with full (failure) or double (critical failure) of the item's 4d6 spirit (+2d6 a rank). **Depart:** the darkness globe is a note (the GM's lighting); it has no button. |

## Rules

- **Incarnates (`incarnate.js`, new):**
  - The spell must have the incarnate trait and last "until the end of your next turn".
  - The opening paragraph is narration plus the manifestation's space and Speed (a note).
  - Then come the Arrive and Depart paragraphs with their rows; each phase gets its own save (basic or a table), and the item's damage only where the phase states it.
  - "Up to N different targets within M feet of the …" sets the targets and adds a reminder.
  - Row damage that is once or twice the item's one entry becomes full or double damage of the shared roll. The Heightened step ("…by 2d6 on a failure and 4d6 on a critical failure") must be that entry's step.
  - A phase without a save, conditions or damage is a note.
- **Compile (`compile-ability.js`):** each phase is compiled as its own spell copy and must be a save with nothing pending. The plan's kind is `incarnate`.
- **Row notes:** "For N rounds, the first time / each time the target attempts an attack roll or skill check, it must roll twice and use the worse result." is a note carrying PF2e's RollTwice (removed after the roll for "the first time"); `validRowNoteRule` accepts it.
- **Runtime:**
  - The card has a button per save phase (`incarnatePhase`, also in the API); each phase can be pressed once.
  - The kind is registered in runtime-core.
- **Interpretations (logged):** the placement, the phase buttons, and the darkness note.

## Tests

1077 pass. `test/rank-5-batch-10.test.js` is new, with a negative case: row damage that isn't the item's stays blocked.

A whole-corpus compile (b406 → b408) changed only these three.

## Evidence

[Live evidence](phase-rank-5-batch-10-live-results.json), case `rank5Batch10`, in the `pftest` world.
- Faerie Revelers: two buttons. Arrive's failure gave Stupefied 2 and Clumsy 2. Depart's critical failure gave the RollTwice note. A second Depart was refused.
- Skeletal Giant: Arrive's failure gave Prone and Clumsy 1. Depart dealt 21 (failure) and 10 (success, half).
- Shadow Minuet: one button. Arrive's failure dealt 8 and Off-Guard. The card names the darkness.
- **Cleanup:** fixtures removed.
