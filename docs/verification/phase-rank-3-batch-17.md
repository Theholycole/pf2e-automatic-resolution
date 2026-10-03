# Rank 3 batch 17 — Confusing Cry, Fearful Feast

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Confusing Cry (5) | Each creature in the emanation rolls a Will save. **Critical Success:** unaffected and immune to the spell for 1 minute; a recast on it is refused. **Success:** Stunned 1. **Failure:** Confused for 1 minute, with a Will save at the end of each of its turns to end it. **Critical Failure:** that, plus the note that it immediately attacks itself (that Strike gives no flat check to recover). |
| Fearful Feast (4, focus reaction) | The triggering creature rolls a Will save against 6d4 mental (+1d4 per rank). **Failure / Critical Failure:** the caster regains HP equal to half the damage the target takes, from PF2e's confirmed damage. A success heals nothing. The critical failure's Frightened increase is as before. |

## Rules

- **Row immunity (`compile-ability.js`):** "… unaffected and immune to this spell for 1 minute." is read like "… temporarily immune for …", at all three sites.
- **"As failure, and the creature immediately attacks itself." (`residual-prose.js`, `note-effects.js`):**
  - It's no longer claimed as plain inheritance (which silently dropped the self-attack). It becomes the row's behaviour note.
  - "This Strike doesn't give the creature a flat check to recover from the confusion." continues that note.
- **A caster's healing on some rows:**
  - `compile-ability.js` reads "…; you regain Hit Points equal to (half) the damage the target takes." on the rows that state it, after the residual analysis.
  - The benefit has a new `heal` kind with its `degrees`, validated in `basic-save-core.js`.
  - `basic-save-runtime.js` heals the caster without temporary HP, counting only targets on those rows.
- **Test updated:** `test/rank-5-push.test.js` asserted Fearful Feast stays blocked so "half" isn't read as the row's multiplier. It now asserts the heal benefit and still that the multiplier is 1.

## Tests

996 + 2 pass. `test/rank-3-batch-17.test.js` is new.

A whole-corpus compile (b363 → b364) changed only these two.

## Coverage

**Census:** **1193 enabled** (milestone; 1189 non-ritual), up from 1191.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-3-batch-17-live-results.json), case `rank3Batch17`, in the `pftest` world.
- **Confusing Cry:**
  - a critical success, then a recast on the same creature was refused;
  - a failure gave Confused with the end-of-turn save;
  - a critical failure gave the self-attack note.
- **Fearful Feast:** a failure took 11 and the caster healed 5 (half, rounded down); a success healed nothing; no temporary HP.
- **Run note:** the first run looked for an Effect named "immune". The immunity works (the refusal), so the assertion was dropped.
- **Cleanup:** fixtures removed.
