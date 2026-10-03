# Rank 3 batch 54 — Overwhelming Memory

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Overwhelming Memory (3) | A Will save from the text (PF2e's item has none). The caster picks the memory on the card. On a success, failure or critical failure, the memory's condition applies until the start of the caster's next turn: Romantic is Fascinated, Terrifying is Frightened 1, Tragic is Dazzled, and Gleeful is a "can't use reactions" note Effect. A failure adds Stupefied 2 and a critical failure Stupefied 3, both for the sustained duration. |

## Rules

- **Option-condition save (`option-condition-save.js` `extractOptionConditionSave`):** it reads:
  - "… a specific type of X you choose from the list below …";
  - a list whose items are narration followed by one sentence with exactly one condition, or "can't use reactions";
  - "The target must attempt a [save] save.";
  - rows where "affected by the X until the beginning of your next turn" marks the option rows;
  - "As failure, but …" for the critical failure.
  The rest of the rows is compiled as an ordinary non-basic save.
- **Plan:** `casterChoice {kind:"option", rows}`. Each option row gets one tagged entry per option: a condition, or a note Effect.
- **Validator:** `executableCasterChoice` gains an option-rows branch. The note-Effect check accepts the choice's rows.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-54.test.js` is new. Its negative cases are:
- a row missing an option's entry (blocked);
- an option holding two conditions (not read).

A whole-corpus compile (b471 → b472) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-54-live-results.json), case `rank3Batch54`, in the `pftest` world, cast at 3rd rank.

| Memory | Result | Applied |
| --- | --- | --- |
| Terrifying | Failure | Frightened 1, Stupefied 2 |
| Gleeful | Success | "Can't use reactions" note only |
| Tragic | Critical failure | Dazzled, Stupefied 3 |
| Romantic | Critical success | Nothing |

**Cleanup:** fixtures removed.
