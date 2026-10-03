# Rank 2 batch 14 — sustained default, Prone lifetime, "then" rows, a row's penalty

2026-09-30.

| Spell | Now |
| --- | --- |
| Laughing Fit (2) | Sustained, up to 10 minutes. Success: note (uncontrollable laughter, no reactions). Failure: Slowed 1 and a no-reactions note, while Sustained. Critical failure: Prone (until it Stands), a 1-round "can't use actions or reactions" note, and the failure's Slowed 1 and note. |
| Calm (2) | Sustained 1 minute. Success: the module's note with −1 status to attack rolls, instead of PF2e's 1-minute Spell Effect: Calm (a data note). Failure: a note (emotion effects suppressed, no hostile actions, ends on hostility). Critical failure: the same note plus "But: Hostility doesn't end the effect." |

## Rules

- **Sustained with no listed duration:** can be Sustained for up to 10 minutes (Player Core). All 25 such spells get the maximum; it alone unlocks none.
- **Prone (general runtime fix):** Prone without its own timer is unlimited and outlives the spell, as PF2e's Prone lasts until the creature Stands. Before, a linked Prone took a fixed or sustained spell's duration.
- **"It then takes the effects of a failure."** carries the failure's effects and notes. They apply immediately, since the row's own round of no actions or reactions already covers what they'd add during it.
- **A row's stated penalty:** "<…> impose(s) / The creature takes a −N status/circumstance penalty to (its) attack rolls / AC / saving throws / Perception checks (for …)." becomes the module's note with that modifier.
  - A PF2e Effect linked for exactly that modifier is replaced (user decision: the text), with a data note.
  - It's skipped when another rule already made the row's note (Sleep).
- **"As success/failure, but …"** is the named row's whole-row note plus "But: …".

## Tests

814/814 pass. `test/rank-2-batch-14.test.js` is new. It checks the 10-minute default, Laughing Fit's rows, and Calm's modifier note, replacement, data note and critical failure.
- The row-penalty rule first duplicated Sleep's existing penalty note; the corpus compile caught it, and it now skips rows that already have a note.

A whole-corpus compile (b267 → b268) changed Calm and Laughing Fit (both now supported) and 6 plans still blocked for other reasons: Behold the Weave, Enthrall, Overflowing Sorrow, Infectious Comedy, Maze of Locked Doors and Orb of Twisting Fate.

## Coverage

**Census:** **1047 enabled**, up from 1045. Rank 2: 135 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-14-live-results.json), case `rank2Batch14`, in the `pftest` world.
- **Laughing Fit:**
  - Success: one note (10 minutes).
  - Failure: Slowed 1 and the reactions note (10 minutes).
  - Critical failure: "Prone" with an unlimited duration, Slowed 1, the 1-round note and the reactions note.
  - After ending the cast (Sustain ended): the failure target lost Slowed; the critical failure target kept Prone and lost Slowed.
- **Calm:**
  - Success: "Calm: Penalty" for 1 minute, and a −1 status attack modifier.
  - Critical failure: one note ending "But: Hostility doesn't end the effect.", with no attack modifier.
- **Cleanup:** fixtures removed; no combats or PFTEST regions left.
