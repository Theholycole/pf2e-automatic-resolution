# Cantrip / rank 1 batch 119 — Crown of Prophets

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “You gain a fangs unarmed attack that deals 1d6 piercing damage and has the agile, finesse, and versatile poison traits.”: PF2e's Effect on the caster (proved: exactly that Strike; sustained 1 minute) | Crown of Prophets (1) |
| Toxic Prophecy: “… dealing 2d4 poison damage (basic Fortitude save)” (+1d4 a rank) on the creature the caster targets: the Trigger control, any number of times while sustained | Crown of Prophets |
| Once a round, on Cast or Sustain; the Requirements (a creature within 15 feet damaged you): the GM's | Crown of Prophets |
| Serpentine Advice (Dubious Knowledge until the end of your turn, then Recall Knowledge): a note on the Effect | Crown of Prophets |

**Kept strict (tests):** it isn't read with any of these changes:
- other fangs dice;
- fewer traits;
- other poison dice;
- an added bonus.

## Coverage

**Census:** **600 enabled**, up from 599.
- The b202 corpus diff against b201 changed only Crown of Prophets.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 729/729 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-119-live-results.json), case `cr1Batch119`:
- **The marker:** PF2e's Effect on the caster (`Strike:fangs`), and the caster's actions list the fangs.
- **Toxic Prophecy, twice:** a failure (3 lost of `2d4 poison`), then a success (half of 7 is 3). The record stayed active and sustained.
- **Ending the spell:** removed the Effect.

**Regressions:** `cr1Batch79` (Draconic Barrage) and `cr1Batch81` (Glass Shield) passed.
