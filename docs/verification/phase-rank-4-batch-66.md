# Rank 4 batch 66 — Unsettling Knowledge

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Unsettling Knowledge (4) | Will. **Success:** Fascinated for 1 round. **Failure:** Fascinated for 1 minute; the creature's Recall Knowledge (the chosen skill against the spell DC) ends it and makes it Frightened 2, and on a failed check its frightened can't drop below 1 for the rest of the minute. **Critical failure:** Frightened 3 instead. |

## Rules

- **Recall escape (`src/compiler/recall-escape.js` `rewriteRecallEscape`):**
  - It reads the lead (the skill list and the save) and the four rows.
  - It writes Fascinated rows and each failing row's note with `recallEscape {skills, frightened, floor}`.
- **New note control:**
  - `validNoteEffect` and the runtime flag with the DC.
  - `storedTriggers.recallEscape`: the skill check with `action:recall-knowledge`; ends this cast's Fascinated; raises Frightened to the row's value; on a failed check adds a locked granted Frightened 1 (restrict) for the note's remaining time.
  - The Ongoing control asks the owner or GM for the skill.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-66.test.js` is new. Its negative case is another floor (not read).

A whole-corpus compile (b527 → b528) changed only Unsettling Knowledge.

## Evidence

[Live evidence](phase-rank-4-batch-66-live-results.json), case `rank4Batch66`, in the `pftest` world.

| Creature | Result |
| --- | --- |
| Failure, Occultism −10, Recall Knowledge failed | Fascination ended, Frightened 2, floor; after two decreases still Frightened 1 |
| Critical failure, Occultism +30, critical success | Fascination ended, Frightened 3, no floor |

**Cleanup:** fixtures removed.
