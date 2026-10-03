# Rank 5 batch 51 — Mind Probe

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Mind Probe (5) | Will, sustained up to 1 minute. Failure and critical failure give a "Mind probed" note for the minute, which carries a question control. Each time the caster Sustains and asks a question, the GM uses the control: the creature's Deception check against the spell DC, with a –4 circumstance penalty on a critical failure. The outcome is whispered to the GM: the answer (failure), no answer (success), or a false answer the caster believes (critical success). The note keeps "the same question gets the same result". |

## Rules

- **Mind probe rows (`src/compiler/mind-probe-rows.js`):**
  - It reads the lead and the three rows.
  - It gives each failing row a note with `questionCheck {skill: deception, penalty?}`.
- **Question control:**
  - `scripts/note-effects.js` validates the field (Deception; an optional negative penalty) and stores it with the DC.
  - `scripts/stored-trigger-runtime.js` `questionCheck` rolls the skill as a GM roll with the penalty as PF2e's Modifier, and whispers the outcome.
  - `scripts/ongoing-runtime.js` lists the control and routes "question-check".
- **Interpretation:** the question and its answer are the GM's. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-51.test.js` is new. It checks the prepared note's runtime flags. Its negative cases are:

- another skill (refused);
- another penalty scope (not read).

A whole-corpus compile (b559 → b560) changed only Mind Probe.

## Evidence

[Live evidence](phase-rank-5-batch-51-live-results.json), case `rank5Batch51`, in the `pftest` world, at 5th rank.

| Result | Deception | Question control | Penalty on the roll | Whispered |
| --- | --- | --- | --- | --- |
| Failure | –10 | critical failure: the answer | — | yes |
| Critical failure | +40 | critical success: a false answer | circumstance –4 | yes |

**Cleanup:** fixtures removed.
