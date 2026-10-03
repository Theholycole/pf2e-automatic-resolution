# Rank 3 batch 11 — Sculpt Sound

2026-10-02.

| Spell | Now |
| --- | --- |
| Sculpt Sound (3) | The touched creature rolls a Will save against the spell DC. The card reminds the GM that a willing target doesn't save, so its result should be set to Failure. **Success:** no change. **Failure:** the sound is altered (narrative). **Critical Failure:** also Stupefied 2 for 1 minute. The cast can be Dismissed, which ends its effects, the Stupefied included (as the module's other Dismissable save spells do). **Heightened (5th):** up to 6 targets; the GM targets them, since the save cards don't limit target counts. |

## Rules

- **Save-spell Dismiss (`compileSaveDismissal`):** "You can @UUID[…]{Dismiss} the spell." is now read like the plain "You can Dismiss the spell.", because the action's link reads as its name. Before, the link left the plan with a pending `dismissal`.
- **A willing target doesn't save (`compile-ability.js`):** for a save spell whose text says exactly "An unwilling target can attempt a Will save." with its own statistic, the existing `willing-no-save` reminder is attached.

## Tests

978/978 pass. `test/rank-3-batch-11.test.js` is new. It checks:
- the Dismiss, the reminder and the Stupefied row;
- that the reminder needs the spell's own save statistic.

A whole-corpus compile (b348 → b349) changed only Sculpt Sound.

## Coverage

**Census:** **1168 enabled** (milestone; 1164 non-ritual), up from 1167. Rank 3: 120 of 261.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-3-batch-11-live-results.json), case `rank3Batch11`, in the `pftest` world.
- **Critical failure:** the card carried the willing-target reminder. The target was Stupefied 2, in an Effect lasting 1 minute.
- **The record:** active with a Dismiss. Dismissing it ended the record and removed the Stupefied.
- **Success on another target:** nothing.
- **Cleanup:** fixtures removed.
