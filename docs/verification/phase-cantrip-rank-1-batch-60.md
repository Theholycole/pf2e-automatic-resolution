# Cantrip / rank 1 batch 60 — Home Among Mulberry Leaves

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Make a melee Strike with your qi-infused fabric.” with no damage of the spell's own: the caster's own PF2e Strike decides the rows (critical hit, hit, miss) | Home Among Mulberry Leaves (1) |
| “On a success, the target is Immobilized until the start of your next turn, though it can attempt to Escape against your spell DC.”: Immobilized until the start of the caster's next turn, or an Escape, whichever is first. The Escape grammar now also reads “, though …” | Home Among Mulberry Leaves |
| “On a critical success, …, making it your choice of Clumsy 1 or Enfeebled 1 until the start of your next turn, in addition to immobilizing it.”: the success row plus the caster's pick of the two, asked on the card | Home Among Mulberry Leaves |

**Kept strict (tests):**
- “in addition to <…ing> it” must name the success row's condition (“slowing” isn't read).
- A third option isn't read.
- A save inside the success sentence isn't read.
- A condition choice outside a Strike-result plan isn't executable.

## Coverage

**Census:** **542 enabled**, up from 541.
- The b143 corpus diff against b142 changed only Home Among Mulberry Leaves.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 612/612 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-60-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch60`:
- **Critical hit** (a +20 Strike against AC 1):
  - Finalize was refused until the caster chose (“Caster: choose the condition on a critical hit before finalizing.”).
  - After choosing Enfeebled, the target had Immobilized (“until Escape”, 1 round to a turn's start) and Enfeebled 1. It did not get Clumsy.
- **Miss** (against AC 60): no conditions, and no choice was asked.

The live run didn't produce a plain (non-critical) hit. That row's compile is covered by the tests, and the card's readiness and condition filter for it are tested too.

**Regressions:** `strikeResult` (Flowing Strike) and `cr1Batch52` (Telekinetic Rend, the damage-type choice) passed, with cleanup between them. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b143
node tools/diff-compiled-plans.mjs /tmp/phase23-b142/official-spell-compiler-report.json /tmp/phase23-b143/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b143/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch60`, then `cleanup`.
