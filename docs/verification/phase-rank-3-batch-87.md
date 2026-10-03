# Rank 3 batch 87 — Ring of Truth

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Ring of Truth (3) | A placed 20-foot burst lasting 10 minutes. A creature in it when it's cast, or that enters, saves (Will) once: it's immune for the spell. Every result gives a note while the creature is in the area. The note carries the bell's behaviour for that creature: critical success, the bell rings even if it lies; success, it rings if the lie beats every Deception check; failure and critical failure, it never rings for a lie. The note also carries the area's –2 status penalty to Deception (PF2e's modifier). Leaving the area removes the note; re-entry is a reminder. |

## Rules

- **Truth ring (`src/compiler/truth-ring.js`):**
  - It reads the area sentence, the penalty sentence (a status or circumstance penalty to one named skill), the behaviour sentences and the save sentence, which says the save's result holds on re-entry.
  - The rows must have no numbers or rules. The missing critical failure row takes the failure's.
  - The rows are rewritten so the lingering save applies nothing itself. Post-hook: immunity for every result, for the spell's duration; a note for each degree; the re-entry reminder.
- **Interpretation:** the penalty applies to every creature in the area, so it goes on every result's note. A creature that re-enters gets its note back from the GM (the reminder), as with Overflowing Sorrow.

## Tests

`test/rank-3-batch-87.test.js` is new. It covers the lingering exposures, the immunity, each degree's note and modifier, a penalty to a non-skill (not read), and a rule among the behaviour sentences (not read).

A whole-corpus compile (b601 → b602) changed only Ring of Truth.

## Evidence

[Live evidence](phase-rank-3-batch-87-live-results.json), case `rank3Batch87`, in the `pftest` world, at 3rd rank.

| Step | Result |
| --- | --- |
| A creature in the burst when cast fails | The "never ring" note; Deception −2 |
| Another walks in and succeeds | The "still rings" note; Deception −2 |
| The first walks out | Its note gone; Deception back to normal |

**Cleanup:** fixtures, region and cast removed.
