# Rank 3 batch 65 — Annunciation of the Outer Gate

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Annunciation of the Outer Gate (3) | A 30-foot emanation. The creatures that decline the invitation or don't understand it save Will: Frightened 1, 2 or 3. Each failing row also carries a 10-minute note: its frightened value doesn't decrease after a turn in which it damaged an agreeing creature. Who understands the invitation, and the agreement among those who accept, are card notes. |

## Rules

- **Invitation save (`src/compiler/invitation-save.js` `rewriteInvitationSave`):**
  - It reads the three preamble paragraphs, the four rows and the floor sentence.
  - It writes the rows' conditions.
  - Post-compile: the floor as a note Effect for the stated minutes, and two `spell-note` reminders.
- **Validator:** a `spell-note` reminder must be one of the spell's compiled sentences. Grisly Growths' exception moved from a "PF2e data" note to the same kind, so this compile also changed Grisly Growths.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-65.test.js` is new. Its negative case is another floor (not read). Grisly Growths' test still passes.

A whole-corpus compile (b514 → b515) changed Annunciation of the Outer Gate, and Grisly Growths' reminder.

## Evidence

[Live evidence](phase-rank-3-batch-65-live-results.json), case `rank3Batch65`, in the `pftest` world.

| Result | Result |
| --- | --- |
| Success, failure, critical failure | Frightened 1, 2, 3; each with the "Frightened floor" note for 10 minutes |
| Card | Both invitation notes |

**Cleanup:** fixtures removed.
