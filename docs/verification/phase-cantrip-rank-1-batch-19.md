# Cantrip / rank 1 batch 19 — Sleep, row penalties, rank gates

2026-09-27. Sleep needed three general rules, and the third one also fixes a latent problem in three already-enabled spells.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The creature falls unconscious. If it's still unconscious after 1 minute (1 hour), it wakes up automatically.”: PF2e's Unconscious for that time, and a “Wakes up” note (it can wake earlier as PF2e's rules allow). The preamble's “doesn't fall Prone or release what it's holding” and Perception-check sentences are added to the note | Sleep (1) |
| “The creature takes a –1 status penalty to Perception checks for 1 round.”: a note Effect carrying a generated FlatModifier (Perception, status, −1) for 1 round. Also accepted: saving throws, a named save, AC, attack rolls or a skill; −1 to −4 status or circumstance | Sleep |
| **Rank gate:** a fixed-rank Heightened entry that changes the rows (“Heightened (4th) The creatures fall unconscious for 1 round on a failure …”) and isn't read otherwise: the card refuses at that rank and above (“Resolve it by hand”); the lower ranks are automated | Sleep (4th+) |

**The gate on already-enabled spells.** The gate is a correctness fix. At these ranks, the module used to apply the spells' base rows:
- **Horrific Visage (3):** at 5th rank and above, its rows become Frightened 1/2/3 and Fleeing.
- **Divine Plagues (1):** at 5th and above, the plague is virulent and the condition values are 2.
- **Stormburst (5):** at 7th and above, a critical failure is Stunned 2.

Those ranks now refuse, and the lower ranks are unchanged. Heightened durations the module reads (Tangle Vine) don't gate.

**Kept strict (tests):**
- A penalty to a statistic the rule doesn't map (spell DCs) stays unaccounted.
- An item-typed penalty, or one past −4, isn't generated.
- A tampered gate is refused.

## Coverage

**Census:** **500 enabled**, up from 499. Rank 1: 159 of 387.
- The b102 corpus diff against b101 made Sleep executable.
- Gates were added to 11 plans: the three above plus 8 still-blocked spells.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 549/549 tests pass (`test/cantrip-rank-1-batch-19.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-19-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch19`:
- **Success:** “Sleep: Perception penalty” for 1 round took Perception from +0 to −1.
- **Failure:** Unconscious, with “Sleep: Unconscious” and “Sleep: Wakes up”, each lasting 1 minute.
- **Critical failure:** the same, each lasting 1 hour.
- **Sleep at 4th rank:** refused, with “at rank 4 and above its heightened rules aren't automated (“The creatures fall unconscious for 1 round on a failure …”)”.

**Regressions:** `cr1Batch6`, `cr1Batch16` and `rank3Batch1` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b102
node tools/diff-compiled-plans.mjs /tmp/phase23-b101/official-spell-compiler-report.json /tmp/phase23-b102/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b102/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch19`, then `cleanup`.
