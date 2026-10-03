# Rank 3 batch 3 — Personal Blizzard

2026-10-02. The first rank 3 spell of this pass (rank 3 batches 1–2 are from an earlier phase).

| Spell | Now |
| --- | --- |
| Personal Blizzard (3, focus hex) | Targets 1 creature, which rolls its Fortitude save against the spell DC; the GM can correct the result. **Critical Success:** unaffected. **Success:** 1d6 cold, and the spell ends. **Failure:** 1d6 cold and 1d6 persistent cold. The target is Concealed through an Effect, which also carries a note that others are concealed to it. A sustained record (1 minute) holds the Effect and the persistent-damage condition, so both end with the spell. **Critical Failure:** the same with 2d6 and 2d6. **Heightened (+1):** +1 to each formula (+2 on a critical failure). This is the text's flat step, which PF2e's data matches. |

The earlier general compile read the critical failure as 1d6 rather than the text's 2d6, and was blocked by its unused structured damage. The new pre-pass replaces it.

## Rules

- **`sustained-save-damage.js` (new pre-pass, kind `sustained-save-damage`):** the save sentence, every row sentence by sentence, and the Heightened (+N) flat step. `sustainedSaveDamageAt` gives a degree's formulas at a cast rank.
- **Runtime `#executeSustainedSaveDamage`:**
  - the target (exactly 1);
  - the save, with the GM's `degree` correction;
  - PF2e's DamageRoll applied with `applyDamage`, which creates the persistent condition;
  - the Concealed Effect (GrantItem, with an attack-roll note);
  - the sustained native record holding the Effect and the persistent condition.

## Tests

960/960 pass. `test/rank-3-batch-3.test.js` is new. It checks:
- every row and the heightened formulas at ranks 3 and 5;
- that changed riders, persistence or heightening aren't read, and that a changed critical failure die is.

A whole-corpus compile (b338 → b339) changed only Personal Blizzard.

## Coverage

**Census:** **1160 enabled** (milestone; 1156 non-ritual), up from 1159. Rank 3: 112 of 261.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-3-batch-3-live-results.json), case `rank3Batch3`, in the `pftest` world.
- **Two targets:** refused.
- **Fortitude +60:** critical success, no damage.
- **Fortitude −30:** critical failure. It dealt "2d6 cold + 2d6 persistent cold" and the creature lost 10, the direct part. It was Concealed, with a 2d6 cold persistent condition, under an active sustained record. Ending the record removed both.
- **Rank 4, success (the GM's result):** "1d6 + 1 cold", 5 lost, no record, not Concealed.
- **Rank 4, failure:** "(1d6 + 1) cold + (1d6 + 1) persistent cold", 3 lost, the persistent condition "(1d6 + 1)", Concealed.
- **Run note:** the first run's assertions expected the raw formula strings; PF2e reports its display form. The assertions were corrected; the behaviour was unchanged. The case was first written as `rank3Batch1`, but an earlier phase already has that name, so it was renamed.
- **Cleanup:** fixtures removed.
