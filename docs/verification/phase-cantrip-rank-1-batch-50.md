# Cantrip / rank 1 batch 50 — Undeath's Blessing

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Failure: “Effects as described above.”, with “For the duration, Harm and Heal spells treat the creature as undead. In addition, harm spells gain a +2 status bonus to the Hit Points restored to the target.”: a “Treated as undead” note for the spell's minute (with the heightened +2 per rank). The GM applies it when those spells are cast | Undeath's Blessing (1) |
| Success: “The target heals half as much from heal and takes half as much damage from harm for 1 round.”: a 1-round note | Undeath's Blessing |
| “An unwilling target can attempt a Will save to reduce the effects.”: the willing-no-save reminder | Undeath's Blessing |
| Target “1 living creature touched”: living | Undeath's Blessing |

**Side effect:** Death Ward's target, also “1 living creature touched”, is now complete. It remains guided for its Effect's condition interaction.

**Kept strict (tests):** another bonus type isn't read.

## Coverage

**Census:** **532 enabled**, up from 531.
- The b133 corpus diff against b132 changed Undeath's Blessing and Death Ward (one fewer gap, still guided).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 600/600 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-50-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch50`:
- **Success:** the 1-round halving note.
- **Failure:** the 1-minute “Treated as undead” note.
- **Card:** it showed the willing-no-save reminder.

**Regressions:** `cr1Batch46` (Eject Soul) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b133
node tools/diff-compiled-plans.mjs /tmp/phase23-b132/official-spell-compiler-report.json /tmp/phase23-b133/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b133/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch50`, then `cleanup`.
