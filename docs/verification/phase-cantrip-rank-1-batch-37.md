# Cantrip / rank 1 batch 37 — Shroud of Night

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The target is shrouded in murky darkness. It treats bright light as dim light, and unless it has greater darkvision, all creatures are Concealed to it.”: a “What it can see” note for the spell's sustained minute. PF2e's Concealed isn't applied to the target, because that would conceal the target from others: the opposite of the text | Shroud of Night (cantrip) |
| “If you cast this hex on a willing ally (…), the ally can choose which result it gets without rolling.”: a **GM:** reminder to set its result | Shroud of Night |

**Correctness note:** before this batch the linked Concealed read as a condition on the target. The spell was blocked, so it was never applied.

**Kept strict (tests):**
- Another rule after the sentence blocks.
- Concealed stated on the target itself is never this note.

## Coverage

**Census:** **519 enabled**, up from 518.
- The b120 corpus diff against b119 changed only Shroud of Night.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 585/585 tests pass (`test/cantrip-rank-1-batch-37.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-37-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch37`:
- **Success:** nothing.
- **Failure:** the 1-minute note with the concealment text, and no Concealed.
- **Card:** it showed the willing-ally reminder.

**Regressions:** `cr1Batch16` (willing choice, per-row notes) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b120
node tools/diff-compiled-plans.mjs /tmp/phase23-b119/official-spell-compiler-report.json /tmp/phase23-b120/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b120/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch37`, then `cleanup`.
