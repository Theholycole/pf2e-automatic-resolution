# Rank 5 batch 41 — Hallucination

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Hallucination (5) | Will. Success, failure and critical failure each give a "Hallucination" note for the spell's 1 hour. Each time the creature Seeks or interacts with the hallucination, the GM uses the Disbelieve control (a Will save against the spell DC; a success ends the spell). On a critical failure that save takes the text's –4 circumstance penalty, applied as a PF2e modifier on the roll. The success note says the creature knows what the hallucination is. A card reminder covers the caster's choice and the 6th/8th-rank options (more targets, or the longer duration, which the GM applies by extending the notes). |

## Rules

- **Hallucination rows (`src/compiler/hallucination-rows.js`):**
  - It reads both preamble paragraphs, the four rows, and the two heightened entries.
  - It gives each affected row a note with `disbelieve {will, needs: success}`, plus the critical failure's `penalty`.
- **Disbelieve penalty:**
  - `scripts/note-effects.js` accepts an optional negative circumstance or status `penalty`, not with automatic disbelief.
  - `scripts/stored-trigger-runtime.js` adds it to the roll as PF2e's `Modifier`.
- **Interpretation:** the heightened choice between targets and duration is the caster's; a longer duration is extended by the GM. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-41.test.js` is new. Its negative cases are:

- a positive penalty (refused);
- another penalty wording (not read).

A whole-corpus compile (b539 → b540) changed only Hallucination.

## Evidence

[Live evidence](phase-rank-5-batch-41-live-results.json), case `rank5Batch41`, in the `pftest` world (caster level 15).

| Rank | Result | Note | Disbelieve |
| --- | --- | --- | --- |
| 8 | critical failure | 1 hour, –4 circumstance penalty | Will +30 with the –4 modifier on the roll: disbelieved, spell ended |
| 5 | success | 1 hour, "knows what the hallucination is" | — |

**Cleanup:** fixtures removed.
