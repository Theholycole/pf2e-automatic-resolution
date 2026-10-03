# Rank 4 batch 3 — Unbounded Sphere

2026-10-02. Part of the user's ranks 3–5 pass. Follows the user's decision that a trigger the module can't detect is a GM control.

| Spell | Now |
| --- | --- |
| Unbounded Sphere (4, focus) | The GM places the 10-foot burst, a sustained lingering area (1 minute) with no exposure when cast. When a creature tries to enter or leave, the GM uses the record's control "a creature tried to enter or leave the area (target it)". The creature rolls a Will save against the spell DC, and its row is a GM note Effect: where it appears and whether its movement ends. The critical failure adds "The creature can't attempt to enter or leave again this turn." |

## Rules

- **`lingering-area-compiler.js`:** "Whenever a creature attempts to enter or leave the area, they must attempt a Will saving throw." gives a `gmAction` with its own label and no automatic events. `basic-save-core.js` accepts a placed area whose only exposure is the GM's control. The control's and the exposure's labels use the action's label.
- **"As failure, except …" (`residual-prose.js`):** an "As success/failure, except …" sentence (other than a duration change), on a row with no conditions or damage, is no longer claimed as plain inheritance. So the whole-row note builder adds the row's own exception to the inherited note. Before, the critical failure dropped "can't attempt to enter or leave again this turn".
  - The corpus compile showed 11 plans changed: the exception now appears in Unbounded Sphere's note and Foul Miasma's (Foul Miasma is still not enabled), and 9 others changed only their claim tags. No spell's route changed.

## Tests

986 + 2 pass. `test/rank-4-batch-3.test.js` is new. It checks:
- the declaration and the critical failure's note;
- that a changed trigger isn't read.

A whole-corpus compile (b355 → b357) changed Unbounded Sphere, plus the claim-tag changes above.

## Coverage

**Census:** **1173 enabled** (milestone; 1169 non-ritual), up from 1172. Rank 4: 113 of 285.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-4-batch-3-live-results.json), case `rank4Batch3`, in the `pftest` world.
- **At the cast:** no exposure.
- **The GM's control on a creature outside:** one exposure, "tried to enter or leave the area". Its critical failure gave the note Effect with the exception.
- **The record:** sustained; ending it worked.
- **Run note:** the first run exposed the dropped exception; after the fix the rerun passed.
- **Cleanup:** fixtures removed.
