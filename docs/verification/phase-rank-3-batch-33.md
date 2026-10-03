# Rank 3 batch 33 — Roaring Applause, Isolation

2026-10-02. Part of the user's ranks 3–5 pass. (Isolation is rank 4; it's batched with the same note kinds.)

| Spell | Now |
| --- | --- |
| Roaring Applause (3) | Will save. **Success:** a "can't use reactions" note. **Failure:** Slowed 1 and the no-reactions note, plus a note that the applause has the manipulate trait and triggers manipulate reactions at the start of the target's turn. **Critical failure:** as failure, plus Fascinated. Everything lasts 10 minutes; heightened (6th) gives 10 targets. |
| Isolation (4) | Will save. **Success:** a 3-round note that the target is invisible only to its allies; PF2e's Invisible isn't applied, since it would hide the target from everyone. **Failure:** that note, plus "inaudible and imperceptible to its allies". |

## Rules

- **Note behaviours (`note-effects.js`):** "The X is so involved that it has the manipulate trait." and "This triggers reactions based on the manipulate trait at the start of the target's turn."
- **Allies-only invisibility (`compile-ability.js`):** the success row "The target becomes Invisible, but only to its allies. …" becomes a whole-row note for the spell's duration, with no condition; "As success, except the target also becomes …" adds to it.
- **Interpretation (logged):** Isolation's Invisible as a note.

## Tests

1071 pass. `test/rank-3-batch-33.test.js` is new, with a negative case: Invisible to everyone stays PF2e's condition.

A whole-corpus compile (b403 → b404) changed only these two.

## Evidence

[Live evidence](phase-rank-3-batch-33-live-results.json), case `rank3Batch33`, in the `pftest` world.
- Roaring Applause: a failure was Slowed 1, with the manipulate-trait note.
- Isolation: success and failure targets aren't Invisible; each has the 3-round note, and the failure's adds inaudibility.
- **Cleanup:** fixtures removed.
