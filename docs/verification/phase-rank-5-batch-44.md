# Rank 5 batch 44 — Wave of Despair

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Wave of Despair (5) | Will. Success, failure and critical failure each give a "Despair" note: 1 round on a success, 1 minute otherwise. The note says the creature can't use reactions (the GM's to enforce). At the start of each of its turns while the note lasts, the module prepares a Will save; on a failure, it grants Slowed 1 for that turn only. A critical failure also gives Slowed 1 for 1 minute at once. The 7th-rank heightening (a 60-foot cone) only changes who the caster targets. |

## Rules

- **Despair rows (`src/compiler/despair-rows.js`):**
  - It reads the lead and the rows; the critical failure's condition must equal the success row's, for the failure's time.
  - It gives each affected row a note with `recurringSave {timing: turn-start, mode: turn-condition, condition: Slowed 1}`.
  - The critical failure's Slowed 1 lasts 1 minute.
- **Start-of-turn save with a condition for the turn:**
  - `scripts/note-effects.js` validates the new timing and mode with their condition.
  - `scripts/recurring-save-recovery.js` adds the obligation when the bearer's own turn begins. On a failed save it grants the condition through an Effect that lasts until that turn ends.
- **Interpretation:** "can't use reactions" is a note (PF2e has no rule for it). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-44.test.js` is new. Its negative cases are:

- an end-of-turn timing for this mode (refused);
- another critical failure condition (not read).

A whole-corpus compile (b543 → b544) changed only Wave of Despair.

## Evidence

[Live evidence](phase-rank-5-batch-44-live-results.json), case `rank5Batch44`, in the `pftest` world, at 7th rank, in combat.

| Creature | Result | Note | Start-of-turn saves |
| --- | --- | --- | --- |
| Despair failure | failure | 1 minute | turn 1: failure, Slowed 1 during the turn and gone after it; turn 2: success, not Slowed |
| Despair critical failure | critical failure | yes | Slowed 1 for 1 minute at once |

**Cleanup:** fixtures removed.
