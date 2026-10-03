# Cantrip / rank 1 batch 20 — attitude step unless it saves

2026-09-27. Continuing the cantrip and rank-1 pass spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “You improve the target's attitude to you by one step (unfriendly to neutral, neutral to friendly, friendly to helpful) for the duration of the spell unless it succeeds at a Will save.”: a save whose failure rows give an **Attitude** note for the spell's duration (1 minute; 10 minutes at 3rd, 1 hour at 6th) | Tame (cantrip) |
| “Afterward, the target is temporarily immune for 1 day.”: 24 hours of temporary immunity | Tame |
| Target `1 non-hostile domesticated animal`: the animal trait, and the GM confirms it's domesticated and not hostile. “This spell works only on domesticated animals; …” and “If the socialization of the animal is in question, the decision is up to the GM.” are that rule | Tame |

**Kept strict (tests):**
- Another save than the item's, or a mechanical sentence after the rules (damage), stays blocked.
- So does another Target wording.

**Also fixed:** a note lasting the spell's duration copied from the item (rather than named in the text) now follows the heightened duration too (`noteAtRank`).

## Coverage

**Census:** **501 enabled**, up from 500. Cantrips: 57 of 120.
- The b103 corpus diff against b102 changed only Tame.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 551/551 tests pass (`test/cantrip-rank-1-batch-20.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-20-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch20`:
- The animal (confirmed by the GM) failed and got “Tame: Attitude” (1 minute) and 24-hour temporary immunity.
- A creature without the animal trait was ineligible (“requires the animal trait”) and got nothing.

The first run's harness answered the GM question for both targets, which overrides eligibility by design; the case was corrected.

**Regressions:** `cr1Batch11` and `cr1Batch5` passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b103
python3 tools/build-phase-spell-batches.py /tmp/phase23-b103/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch20`, then `cleanup`.
