# Rank 5 batch 56 — Over the Coals

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Over the Coals (5) | The target's Will save, and a day's immunity whatever the result. On a success or worse, a note whose Ongoing control the GM uses if the target hasn't complied by the end of its next turn. It then takes the row's persistent void damage once (3d8; 6d8 on a failure or critical failure) and the row's conditions (Drained 1; Drained 2 and Doomed 1). Reminders: the demand's limit, the critical success's cantrip immunity, a later compliance (end the spell; a critical failure's conditions remain) and 9th rank's second target. |

## Rules

- **Coals demand (`src/compiler/coals-demand.js`):**
  - It reads the preamble (limit, save, immunity), the rows and the 9th-rank entry.
  - The rows become notes with `triggeredDamage` `noncompliance`: the persistent dice and the conditions.
  - The day's immunity covers every result.
- **New trigger `noncompliance`:**
  - Once, persistent, ending the note. It applies its `conditions` at their values, never lowering a higher one.
  - Validator: the PF2e condition links, values 1–4.
- **Interpretation:** a later compliance is the GM's (end the spell). The 9th rank's second target is a reminder: the save route takes the GM's targets. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-56.test.js` is new. It covers the notes, the conditions, the immunity, the reminders, a value above 4 (refused), and another heightening (not read).

A whole-corpus compile (b577 → b578) changed only Over the Coals.

## Evidence

[Live evidence](phase-rank-5-batch-56-live-results.json), case `rank5Batch56`, in the `pftest` world, at 5th rank (caster level 9).

| Step | Result |
| --- | --- |
| Critical failure | immune for a day; no conditions yet |
| The GM: it didn't comply | 6d8 persistent void on it; Drained 2; Doomed 1; the note ended |

**Cleanup:** fixtures removed.
