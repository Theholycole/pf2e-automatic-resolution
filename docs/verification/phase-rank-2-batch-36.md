# Rank 2 batch 36 — daily damage, an illusion's Disbelieve control, minion control

2026-10-01. Follows the user's decisions of 2026-10-01:
- What the module can't detect is a GM control.
- An illusion's disbelief is a Disbelieve control.
- A spell that makes a creature the caster's minion gives an Effect with its statistics, and the caster's player owns the token until it ends.

| Spell | Now |
| --- | --- |
| Feast of Ashes (2) | A Fortitude save. Critical success: unaffected and temporarily immune for 1 hour. Success: Fatigued for 1 round. On a failure or critical failure the target is Fatigued for the spell's week (7 days). It also gets a 7-day note whose Ongoing control deals the day's damage when the GM reports a day passed: 1d4 (+1d4 a rank), or 2d4 (+2d4 a rank) on a critical failure. That the damage can't be healed until the hunger is sated is in the note. |
| Phantasmal Treasure (2) | A Will save: Fascinated until the end of its turn (success) or for 1 minute (failure, critical failure). Each of those rows gets a Disbelieve note. Its Ongoing control rolls the creature's Perception against the spell DC when the GM says it touches, Seeks or speaks to the treasure; a success ends the spell and every Effect with it. The critical failure also gets the behaviour note (each action focused on the treasure). Who can see the treasure is a reminder. |
| Shadow Zombie (2) | Targets a zombie of level 1 or lower (5 or lower at 4th), read from PF2e's level at the cast rank. A Will save. Critical success: temporarily immune for 24 hours. Failure (1 minute) and critical failure (10 minutes): a note with resistance 8 to physical damage, immunity to precision and a fly Speed of 10 feet as PF2e rules, and the action limits as its text. The caster's owners get OWNER on the zombie, and it gets the minion trait; both are restored when the note ends. Reminders: a target already the caster's minion gets Critical Failure without a save, and a controller's save is rolled too, using the better result. |

## Rules

- **Compiler:**
  - Feast of Ashes' rows become notes with `triggeredDamage` `daily`; a week becomes 7 days.
  - `illusion-disbelief.js` (new): the plain rows plus notes with `disbelieve`.
  - `minion-control.js` (new): the state sentence's resistance and immunity, the fly Speed, and the target's trait and level limit (by rank, from PF2e's own heightened target).
- **Core:**
  - The `level-at-most` target predicate (with `byRank`; the runtime passes the cast rank).
  - `daily` triggered damage.
  - Note rules `Immunity` and `BaseSpeed`.
  - The note fields `disbelieve` and `minionControl`.
- **Runtime:**
  - The `disbelieve` request and its Ongoing control (`stored-trigger-runtime.js`).
  - `minion-control-runtime.js` (new): grants the control at the note's creation, and restores it from the `deleteItem` hook. A user with no previous level goes back to INHERIT.
  - The note's DC is carried for the Disbelieve control.
  - **Fix:** a condition lasting a spell measured in weeks now gets that many days. PF2e's Effects have no "weeks"; the first live run showed the error.

## Tests

879/879 pass. `test/rank-2-batch-36.test.js` is new. It checks:
- the daily triggers;
- the Disbelieve notes, that another statistic is refused, and that changed text isn't read;
- the minion note's rules;
- the level limit at 2nd and 4th.

A whole-corpus compile (b289 → b290) changed only these three spells.

## Coverage

**Census:** **1105 enabled**, up from 1102. Rank 2: 191 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-36-live-results.json), case `rank2Batch36`, in the `pftest` world.
- **Feast of Ashes at 3rd:**
  - The failure and the critical failure are Fatigued for 7 days, with 7-day notes. The critical success is temporarily immune.
  - The day's damage: "2d4" (5 lost) and "4d4" (7 lost). The notes remain.
- **Phantasmal Treasure (DC 5):**
  - Both targets were Fascinated. The critical failure has both notes.
  - Disbelieve succeeded, the spell ended, and neither is Fascinated any more.
- **Shadow Zombie:**
  - The level 1 zombie was eligible; a level 3 zombie and a living creature weren't.
  - On a failure: a 1-minute note (Resistance physical 8, Immunity precision, fly 10). Player2 (the caster's owner) owned the zombie, and it had the minion trait.
  - Deleting the note restored both.
- **Cleanup:** fixtures removed.
