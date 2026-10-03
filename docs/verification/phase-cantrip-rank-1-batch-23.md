# Cantrip / rank 1 batch 23 — bystanders' saves in notes

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| A save made only by bystanders the GM picks, never by the spell's targets, with no results table: “If a light source is attended by an unwilling creature, that creature can attempt a Reflex save to snuff the light out before it becomes noticeable.” The spell is a note, and the GM runs that save | Illuminate (cantrip) |
| “Tiny animals and animal swarms of any size within range must attempt a Will save. On a failure, …”: the same | Verminous Lure (1) |

**Kept strict (tests):**
- A save the target makes stays off the note route.
- So does damage beside a bystander's save.

## Coverage

**Census:** **503 enabled**, unchanged. Note only: 367 non-ritual.
- The b106 corpus diff against b105 changed only these two spells.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 557/557 tests pass (`test/cantrip-rank-1-batch-23.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-23-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch23`:
- **Illuminate (instantaneous):** its card showed the rules, including the attending creature's Reflex save.
- **Verminous Lure:** one 10-minute note. It went on the caster, marked “(area)”, since the Target line includes “or object”.

**Regressions:** `cr1Batch8` passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b106
python3 tools/build-phase-spell-batches.py /tmp/phase23-b106/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch23`, then `cleanup`.
