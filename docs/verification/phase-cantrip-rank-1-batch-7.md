# Cantrip / rank 1 batch 7 — Sustain-growing auras

2026-09-26. Your direction: fully automate auras that expand on Sustain, such as Protective Wards.

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| “Each time you Sustain the spell, the emanation's radius increases by 5 feet, to a maximum of 30 feet.”: proved by PF2e's Aura rule (radius `5 * @item.badge.value`) and its counter badge (1 to 6). The cast is sustained, each Sustain raises the badge (so the aura grows), and a missed Sustain ends the spell | Protective Wards (1) |

**Kept strict (tests):** a stated step or maximum that the Aura's radius and badge can't give (10 feet per step, or a 40-foot maximum) stays blocked.

**Not changed:** Bless keeps its existing Bless-only profile. Moving it to this general rule would need its “you can increase the radius” wording and 10-foot steps from a 5-foot base (`5 + @item.badge.value * 10`) to be read. That's listed as a follow-up.

## Coverage

**Census:** **486 enabled**, up from 485. Rank 1: 147 of 387.
- The b90 corpus diff against b89 changed only Protective Wards (unsupported → automatic).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 517/517 tests pass (`test/cantrip-rank-1-batch-7.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-7-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch7` (in combat):
- When cast, the caster's “Aura: Protective Wards” had badge 1 and radius 5, with an active sustained record.
- On the caster's next turn, the Sustain obligation appeared, and Sustaining raised the badge to 2 (radius 10).
- A second Sustain that round was refused.
- The next caster turn passed without a Sustain, and the record ended (`missed-sustain`) with the aura removed.
- A probe showed PF2e's aura didn't pass its ally Effect to tokens in this headless test without movement, so the case checks the aura's radius (the part the module drives), not the allies' Effect.
- **Regressions:** `durationBuffs`, `reactionBuffs`, `sustainedConditions` and `rank2Batch2` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b90
python3 tools/build-phase-spell-batches.py /tmp/phase23-b90/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch7`, then `cleanup`.
