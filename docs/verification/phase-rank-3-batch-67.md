# Rank 3 batch 67 — Censure Falsehoods

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Censure Falsehoods (3) | Fortitude. **Success:** Sickened 1. **Failure:** Sickened 2, and the flat check on speech (a note while it's sickened). **Critical failure:** the same, and each Deception or Stealth check raises its sickened value by 1, to a maximum of 4 (the GM's control; the module raises it). Who may be targeted is a card note. |

## Rules

- **Censure rows (`src/compiler/censure-rows.js` `rewriteCensureRows`):**
  - It reads the five preamble sentences and the four rows.
  - It writes the Sickened rows.
  - Post-compile: the "Choking animals" note (`whileCondition: sickened`), the critical failure's "Lies make it sicker" note with `triggeredIncrease`, and a `spell-note` reminder.
- **New note control `triggeredIncrease {slug, maximum, trigger}`:** `validNoteEffect`, the runtime flag, `storedTriggers.triggeredIncrease` (PF2e's increaseCondition, adding 1 clamped to the maximum) and the Ongoing control.
- **Fix:** Call the Blood's Sickened 2 now raises only to 2, because PF2e's increaseCondition adds its value. Re-verified live in the same run.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-67.test.js` is new. Its negative case is another increase (not read).

A whole-corpus compile (b522 → b523) changed only Censure Falsehoods.

## Evidence

[Live evidence](phase-rank-3-batch-67-live-results.json), cases `rank3Batch67` and the re-run `rank4Batch52`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Success, failure, critical failure | Sickened 1, 2, 2; notes 0, 1, 2 |
| The lies control ×3 | Sickened 3, 4, 4 |
| Call the Blood re-run | Living caster: Sickened 2; undead caster: temporary Hit Points and Quickened |

**Cleanup:** fixtures removed.
