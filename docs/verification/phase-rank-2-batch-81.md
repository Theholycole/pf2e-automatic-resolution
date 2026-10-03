# Rank 2 batch 81 — Inveigle

2026-10-01. The ritual-outcome family (batches 79–80), following the accepted ritual workflow (decision ticket 07). The GM supplies the save DC; the module never guesses it.

| Spell | Now |
| --- | --- |
| Inveigle (2, ritual) | The GM gives the result and targets 1 creature, whose level must be at most double the cast rank. **Success / Critical Success:** the GM says whether the target is willing. If it isn't, it rolls Will against the DC the GM gives, and a success negates the ritual. Otherwise the target gets PF2e's Helpful condition (an Effect, "Helpful toward" the caster) for 1 year, under a Dismissable record. The card's GM button "Asked against its nature" rolls its Will save to end it; on a critical success that save takes −4 status. A success ends the ritual. **Failure:** no effect. **Critical Failure:** the target is Hostile toward the caster for the duration (no saves). **Heightened (6th):** the GM picks what was used: blood, hair and the like (1 week) or a substantial body part (1 month). The 1-mile range and the 100 gp base cost are notes. |

## Rules

**`ritual-outcome.js`** gains:
- the target's attitude, the end-early save and the unwilling target's negating save (body);
- "The ritual succeeds and the target takes a −N status penalty to Will saves to end the effect.";
- "The ritual fails and the target instead …, becoming hostile to you for the duration.";
- the target line ("1 creature of a level no greater than double the … rank");
- the duration ("1 year or until dismissed");
- a Heightened entry: the shorter durations by what's used, plus range and cost notes.

All three body sentences, the target line and the duration are needed together.

**Runtime:**
- the target check;
- willing/unwilling (`willing`, `dc` in tests);
- the attitude Effect (GrantItem of PF2e's attitude condition);
- the native record (Dismissable, ends at its maximum) holding `ritualEnd`;
- `ritualEndSave` and its card button: the GM's DC, with the penalty as a `game.pf2e.Modifier`;
- the heightened duration (`durationDays`) and notes.

## Tests

956/956 pass. `test/rank-2-batch-81.test.js` is new. It checks:
- every degree and the heightened durations;
- that changed negate, hostility, cost or end-save rules aren't read, and that a changed attitude and penalty are.

A whole-corpus compile (b336 → b337) changed Inveigle. It also changed the two earlier rituals' plans by new empty fields (`target`, `duration`, `heightened`, `endPenalty`, `attitude`); both are still automatic.

## Coverage

**Census:** **1158 enabled** (milestone), up from 1157. Rank 2: 244 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-81-live-results.json), case `rank2Batch81`, in the `pftest` world.
- **Level 5 target at rank 2:** refused ("above level 4").
- **Willing:** Helpful, 365 days, an active Dismissable record, and the end button. The end save against DC 1 ended it; Helpful gone.
- **Unwilling, DC 1:** critical success; negated, no record.
- **Unwilling, DC 60:** critical failure; Helpful. Its end save carried `ritual-end-penalty` status −4 and ended it.
- **Critical Failure:** Hostile; no record and no button.
- **Failure:** nothing.
- **Heightened to 6, a level 5 target:** Helpful for 7 days, with the range and cost notes.
- **Cleanup:** fixtures removed. The 6 active ongoing records left in the world all predate this run.
