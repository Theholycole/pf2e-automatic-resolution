# Rank 4 batch 2 — Haunting Spirit

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Haunting Spirit (4) | A lingering record on the living target for 1 minute. At the start of each of its turns the GM confirms the exposure, and it rolls a Will save against the spell DC (none when cast). **Critical Success:** the spell ends. **Success:** Off-Guard for 1 round. **Failure:** that, plus (rank)d8 spirit. **Critical Failure:** that, plus (rank×2)d8 spirit. The note that the target can spend its whole turn running away to end the spell is whispered to the GM, who ends it in Ongoing spells when it does. |

## Rules

- **The target-turn save (`lingering-area-compiler.js`):**
  - It also reads "At the start of each of the target's turns, it must attempt a Will saving throw.".
  - It allows "1 living creature".
  - It reads "The target can spend its entire turn running as far away as possible to escape the spirit and end the spell early." as a note.
- **A row that ends the spell:** "The spell immediately ends." as a whole row of a lingering save is flagged `endsSpell` (`compile-ability.js`, in the lingering block). The core accepts it only for a lingering exposure. The save card's outcome snapshot keeps it (`basic-save-runtime.js`), so the record ends on that result. The first live run showed the snapshot dropped it.
- **Test updated:** `test/long-tail-batch-2.test.js` asserted that this spell stays blocked as "not a one-time save". It now asserts the lingering route, still not a one-time save.

## Tests

984 + 2 pass. `test/rank-4-batch-2.test.js` is new. It checks:
- the declaration, the ending row and the note;
- that a changed trigger isn't read.

A whole-corpus compile (b353 → b355) changed only Haunting Spirit.

## Coverage

**Census:** **1172 enabled** (milestone; 1168 non-ritual), up from 1171. Rank 4: 112 of 285.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-4-batch-2-live-results.json), case `rank4Batch2`, in the `pftest` world.
- **At the cast:** no exposure; the run-away note was whispered.
- **The target's first turn:** a failure, 23 lost (4d8 at rank 4), and Off-Guard.
- **Its next turn:** a critical success, and the record ended.
- **Run note:** the card's damage formula is null for inline row damage, so the case checks the HP lost.
- **Cleanup:** fixtures and the combat removed.
