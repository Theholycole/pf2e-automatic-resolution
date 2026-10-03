# Rank 5 batch 52 — Infectious Comedy

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Infectious Comedy (5) | Will, sustained up to 1 minute. Success, failure and critical failure give a "Giggling" note (no reactions while the spell lasts). Failure: Slowed 1 for the spell's duration. Critical failure: Prone, a "Doubled over" note for 1 round (no actions or reactions), then the failure's Slowed 1 for the spell. One card for the cast spreads the joke: on each round's first Sustain, the GM targets a creature within 30 feet of an affected one and starts its save, which posts no card of its own. A reminder covers "not the same creature twice". |

## Rules

- **Comedy rows (`src/compiler/comedy-rows.js`):**
  - It reads the lead (the spread on Sustain, its distance, "not twice") and the rows.
  - It produces Slowed (and Prone) for the spell's duration, the notes, and a per-cast repeatable `chainSave` without cascade (the validator accepts this evidence too).
- **Interpretation:** a lost round and no reactions are GM notes; picking a creature not yet targeted is the GM's. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-52.test.js` is new. Its negative case is another targeting rule (not read).

A whole-corpus compile (b562 → b563) changed only Infectious Comedy.

## Evidence

[Live evidence](phase-rank-5-batch-52-live-results.json), case `rank5Batch52`, in the `pftest` world, at 5th rank.

| Step | Result |
| --- | --- |
| First target fails | Slowed 1, Giggling (1 minute); one spread card |
| The spread card's target critically fails | Prone, Slowed 1, Giggling (1 minute), Doubled over (1 round); no further card |
| The card pressed again | starts another save |

**Cleanup:** fixtures removed.
