# Rank 3 batch 62 — Undertow

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Undertow (3) | A lingering water burst. A creature starting its turn inside makes a Fortitude save. **Success:** 2d6 bludgeoning. **Failure:** 4d6 bludgeoning and PF2e's Spell Effect: Undertow (−2 circumstance to Swim checks, −10-foot swim Speed) until it leaves the area. **Critical failure:** as failure, with a "Pulled down" GM note. The depth and Swim DC are area notes. |

## Rules

- **Undertow (`undertow-rows.js` `rewriteUndertow`):**
  - It reads the three lead sentences, the rows with their inline damage, the swim-penalty sentence, the Effect link and "As failure, and the creature is pulled N feet down."
  - It writes a lingering trigger and plain rows. The failing rows' Effect becomes an `area-penalty-effect` with `leaveArea`.
  - The swim sentence becomes the Effect's claim (no longer a manual instruction). The pull is a note.
- **Proof (`native-outcome-effect-compiler.js`):** `proveAreaPenalty` gains the swim form: exactly a FlatModifier on Athletics with predicate `action:swim` and one on `swim-speed`, matching the sentence's values. The runtime re-proves it.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-62.test.js` is new. Its negative case is a penalty other than the Effect's (not proved).

A whole-corpus compile (b492 → b493) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-62-live-results.json), case `rank3Batch62`, in the `pftest` world, in combat at 3rd rank.

| Step | Result |
| --- | --- |
| The creature starts its turn in the water | Exposure reviewed |
| Failure | Lost 14 (4d6), Effect applied (flagged to the area) |
| It leaves the area | Effect removed; the record is still active |

**Cleanup:** fixtures removed.
