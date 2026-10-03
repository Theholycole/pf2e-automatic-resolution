# Rank 2 batch 45 — bleeding sealed with fire

2026-10-01.

| Spell | Now |
| --- | --- |
| Cauterize Wounds (2) | For each of up to five willing targets taking persistent bleed damage: 1 fire damage, immutable (no resistance or weakness), PF2e's Effect lowering its bleed recovery DC (to 10), and PF2e's own recovery check, which removes the bleed on a success. A target not bleeding gets nothing. A marker on the caster for the spell's minute, tracked in Ongoing spells, has the repeat control (1 action, concentrate) for one of the spell's targets; other creatures are refused. |

## Rules

- **`cauterize.js` (new note family):**
  - One sentence of narration, then the three rules exactly.
  - PF2e's Effect must be only the recovery-DC alteration for that persistent damage type.
- **Runtime:**
  - The `cauterize` executor, and `cauterizeTarget` (damage with IWR skipped, the Effect, then `rollRecovery`). The result is read from PF2e's flat-check message: the first live run showed `rollRecovery` returns nothing and removes the condition a moment later.
  - The `cauterize` request and its control.

## Tests

889/889 pass. `test/rank-2-batch-45.test.js` is new. It checks the plan, and that a changed repeat sentence isn't read.

A whole-corpus compile (b299 → b300) changed only Cauterize Wounds.

## Coverage

**Census:** **1120 enabled**, up from 1119. Rank 2: 206 of 245.

## Evidence

[Live evidence](phase-rank-2-batch-45-live-results.json), case `rank2Batch45`, in the `pftest` world.
- **The bleeding target:** lost 1 HP and got the Effect. Its recovery rolled 17 and the bleed was removed.
- **The other target:** not bleeding, so unaffected (lost 0).
- **The repeat** (the target bleeding again): 1 HP lost, the recovery rolled 6, and the bleed remained.
- **A creature that wasn't a target:** refused.
