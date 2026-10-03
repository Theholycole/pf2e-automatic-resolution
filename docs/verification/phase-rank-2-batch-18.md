# Rank 2 batch 18 — behaviour while the row's condition lasts

2026-09-30.

| Spell | Now |
| --- | --- |
| With Friends like These (2) | Success: Sickened 1. Failure: Sickened 2, and a note "Doesn't treat any other target of the spell as an ally (while it's sickened from this spell)". Critical failure: the same, plus "Can't end a move action within 10 feet of any other target". The notes end when the creature is no longer sickened by the spell. Heightened (+2): one more target (the save route doesn't cap targets). |

## Rule

- **Behaviour tied to a condition:** "While <condition> this way, it …" and "As failure, and it … as long as it is <condition>." become notes tied to the row's condition Effect; they end with it.
  - Only a condition the row (or the named row) applies qualifies.
  - The critical failure's "as long as it is sickened" is no longer read as a second, valueless Sickened.

**Found:** before this, the failure's "While sickened this way, it doesn't treat any other target of the spell as an ally." counted as handled because it mentions the row's condition, so the behaviour would have been dropped (the spell was blocked by its critical failure).
- **The scan:** every supported save plan was checked for a clause claimed only as a condition that states a behaviour ("can't", "doesn't", "must", "treats"). The only hit is Hollow Heart's narration ("as it realizes it can't rely on anyone but itself").

## Tests

825/825 pass. `test/rank-2-batch-18.test.js` is new. It checks:
- the notes, their tie to Sickened, and the single Sickened on the critical failure;
- that a behaviour tied to a condition the row doesn't apply isn't read, and the plan stays unsupported.

A whole-corpus compile (b271 → b272) changed only With Friends like These.

## Coverage

**Census:** **1052 enabled**, up from 1051. Rank 2: 140 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-18-live-results.json), case `rank2Batch18`, in the `pftest` world. The cast was heightened to 4th, with three targets.
- **Success:** Sickened 1, no notes.
- **Failure:** Sickened 2 and "No allies".
- **Critical failure:** Sickened 2, "Movement" and "No allies".
- **Deleting the critical target's Sickened:** removed both notes.
- **Cleanup:** fixtures removed; no combats or PFTEST regions left.
