# Rank 4 batch 34 — Containment, Dirge of Remembrance

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Containment (4) | One target saves (Reflex). Critical success: a GM note (the field collapses). Success: a "Force field" note on the creature, with 10 Hit Points (+5 per rank). Failure and critical failure: the field's normal 40 Hit Points (+15 per rank). Each note gives Hardness 10, immunity to critical hits and precision damage, and that the field blocks passage, for 1 minute. A card note covers willing targets. |
| Dirge of Remembrance (4) | A 30-foot cone, sustained. Only incorporeal creatures are eligible. The 4d10 sonic damage ignores every resistance (PF2e's bypass option on the roll). Failure and critical failure: a "Semi-corporeal" note until the spell ends (attacks get the ghost touch benefit). |

## Rules

- **Force field rows (`compile-ability.js`):**
  - The preamble's three sentences on the field: what it blocks, its Hardness and Hit Points, and the unwilling-target condition.
  - The success row "partially forms with N Hit Points instead of M", where M is the preamble's number.
  - The failure row "has its normal effect".
  - The Heightened line, which gives a step per result.
  Each row becomes a note whose `{amount}` is filled in at the cast rank (`rankAmount`). The residual check accepts a row's Hit Points when such a note claims it (`residual-prose.js`).
- **Trait-only area recipients:** "Each incorporeal creature in the area takes …" is read like "Each undead creature …". Its predicate is the incorporeal trait (`target-predicate-compiler.js`).
- **Resistance bypass:** `resolution.resistanceBypass {ignore: "all-damage"}`. It is validated against its compiled sentence and requires one damage component. At runtime it sets PF2e's `bypass.resistance.ignore` on the roll.
- **Semi-corporeal note:** read from the failure row, and from a critical failure row of "As failure, but double damage.".
- **Interpretations:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-34.test.js` is new, with negative cases:
- a success row whose Hit Points differ from the preamble's;
- a forged bypass sentence;
- a parenthetical other than the bypass.

A whole-corpus compile (b441 → b442) changed only these two spells.

## Evidence

[Live evidence](phase-rank-4-batch-34-live-results.json), case `rank4Batch34`, in the `pftest` world.
- **Containment:**
  - Success at 4th: a field note with 10 Hit Points.
  - Failure at 5th: 55 Hit Points.
  - Both saves were Reflex, both notes last 1 minute, and the card shows the willing-target note.
- **Dirge of Remembrance:**
  - The corporeal creature was ineligible ("requires the incorporeal trait").
  - The incorporeal creature has sonic resistance 5. It failed and lost the full 20. PF2e recorded the resistance as ignored.
  - The Semi-corporeal note lasts 1 minute.
- **Cleanup:** fixtures removed.
