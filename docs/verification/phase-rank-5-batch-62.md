# Rank 5 batch 62 — Pressure Zone

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Pressure Zone (5) | A placed 20-foot burst lasting 1 minute. A living creature in it when cast, or entering, saves (Fortitude); after any result it's immune for an hour, so it isn't asked again. **Success:** Deafened and Clumsy 1 until the end of its next turn. **Failure:** Deafened and Clumsy 2 until it succeeds at a Fortitude save at the end of one of its turns, which it gets only while outside the zone; a success ends both. **Critical failure:** Deafened and Clumsy 2 for the spell's minute. On every row, Deafened has its own 1-action Fortitude save (popping its ears), which loses only the Deafened. Creatures whose anatomy has no inner ears or joints are the GM's (a reminder). |

## Rules

- **Pressure zone (`src/compiler/pressure-zone.js`):**
  - It reads the living creatures' save sentence, the four rows, the pop-the-ears paragraph and the anatomy sentence.
  - The rows are rewritten to their conditions. Post-hook:
    - the lingering declaration (placed, initial and enter);
    - immunity for an hour after any result;
    - the failure's conditions lasting until their end-of-turn save, with `outsideArea`;
    - the critical failure's fixed minute;
    - `actionSave` on Deafened;
    - the living-creature predicate;
    - the reminder.
- **Core:**
  - A recurring save may carry `outsideArea` (end mode, turn end).
  - A condition may carry `actionSave` (a save and its sentence).
- **Runtime:**
  - **Effect metadata:** the save's Effect records the lingering cast as the recurring save's area, and records each condition's action save with the spell DC.
  - **The outside-only gate:** the recurring-save reconcile skips a turn's save while the creature's token is inside that cast's area.
  - **The action-save control:** an Ongoing control per condition with its own save. On a success it removes just that grant (unlinked first, so the Effect and its other conditions stay), or deletes the Effect if that was its only condition (`condition-growth.js removeGrant`).

## Interpretations

- "After which it's temporarily immune for 1 hour" applies to every result here, so a creature that keeps the effects isn't asked again on re-entering.
- The failure's conditions last until the save; the zone's end lets that save happen (it's no longer in the zone).

## Tests

`test/rank-5-batch-62.test.js` is new. It covers the lingering exposures, the living predicate, the immunity, each row's conditions with the action save and the outside-only recurring save, a tampered save mode (rejected), a bad action save (rejected), the reminder, and a save not tied to leaving (not read).

A whole-corpus compile (b606 → b607) changed only Pressure Zone.

## Evidence

[Live evidence](phase-rank-5-batch-62-live-results.json), case `rank5Batch62`, in the `pftest` world, in combat, at 5th rank.

| Step | Result |
| --- | --- |
| Three creatures in the burst when cast | Success: Deafened, Clumsy 1. Failure: Deafened, Clumsy 2. Critical failure: Deafened, Clumsy 2. |
| The critical failure pops its ears (success) | Deafened gone, Clumsy 2 stays |
| The failure's turn ends inside the zone | No save |
| It steps out; its turn ends outside | Its save; a success ends both |

**Cleanup:** fixtures, region and combat removed.
