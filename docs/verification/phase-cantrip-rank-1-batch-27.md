# Cantrip / rank 1 batch 27 — Hit Point transfer

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “When you Cast this Spell and at the start of each of your turns, if the target is below maximum Hit Points, it regains 2 Hit Points (or the difference …). You lose as many Hit Points as the target regained.” **Link (transfer Hit Points)** moves them at cast and at the start of each of the caster's turns, for 10 minutes. They're direct Hit Point changes: no modifiers, temporary Hit Points ignored. Heightened: +2 per rank | Spirit Link (1) |
| “… if you're ever at 0 Hit Points, spirit link ends automatically.”: the record ends. Dismiss is available | Spirit Link |

**Kept strict (tests):**
- Without the caster's loss, the sentence isn't read.
- An extra rule (a bonus) or another Target isn't read either.

## Coverage

**Census:** **509 enabled**, up from 508.
- The b110 corpus diff against b109 changed only Spirit Link.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 565/565 tests pass (`test/cantrip-rank-1-batch-27.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-27-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch27` (in combat):

| When | Caster HP | Friend HP |
| --- | ---: | ---: |
| Start | 500 | 495 |
| After the cast | 498 | 497 |
| After the caster's next turn start | 496 | 499 |
| Caster set to 2 HP, friend lowered, then the next turn start | 0 | 497 |

At the last step, the record ended with `caster-at-0-hp`.

The first run's 0-HP step failed on the harness setup: the friend was 1 HP from its maximum, so only 1 HP moved, correctly. The case was fixed and rerun on its own.

**Regressions:** `cr1Batch26` and `sustainArea` passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b110
python3 tools/build-phase-spell-batches.py /tmp/phase23-b110/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch27`, then `cleanup`.
