# Cantrip / rank 1 batch 4 — verification

2026-09-26. The fourth batch of the cantrip-and-rank-1 pass, applying your decision on behaviour rules: a rule the module can't enforce (“can't use reactions”) may be a **GM:** note on the card, but only in a row that also applies something real (a condition, an Effect, damage or a push).

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| “The creature can't use reactions and takes a -2 status penalty to Perception checks and Will saves.”: PF2e's row Effect proves the penalty (the spell's 1-round duration when the row states none), and “It can't use reactions.” is a GM note beside it | Faerie Dust (1), all three action variants |
| “As failure, and the creature also takes a -1 status penalty … for 1 minute.”: the critical row's own Effect, plus the failure row's Effect and GM note carried into it | Faerie Dust |
| “For each additional action you use when Casting the Spell, increase the burst's radius by 5 feet.”: read for a burst or emanation area, since PF2e's variants carry each radius | Faerie Dust |
| “Any creature targeted by this spell must succeed at a Fortitude saving throw or be pushed 10 feet away from you (or 20 feet on a critical failure).”: a push save, followed only by the action-count sentence and the cast variant's own restated targets | Kinetic Ram (1), 1-action variant |
| **Guard:** the one-sentence push and pull forms refuse a base spell that still holds every action paragraph. A first version read Kinetic Ram's base spell with the 1-action rules and dropped the 2-action paragraph's extras | Kinetic Ram (base), Gravitational Pull (base) |

**Kept strict (tests):**
- A behaviour note in a row with nothing real is refused (`row-note`).
- Hollow Heart, whose rows are only behaviour, stays blocked.
- Kinetic Ram's 2-action variant (doubled push, Prone and damage in its own words) and its 3-action variant (PF2e's area data has no `type`) stay blocked, and cast-time refusal names them.
- Charming Push and Debilitating Terror stay blocked: their failure rows are behaviour only, and their success rows' “penalty … against you” has no PF2e Effect.
- Airburst, Command and Heart's Hook have other unread rules.

## Coverage

**Census:** **478 enabled**, up from 476. Rank 1: 140 of 387.
- The b87 corpus diff against b86 enables Faerie Dust; Kinetic Ram is enabled through its 1-action variant.
- Aberrant Whispers (rank 3) had its radius sentence claimed and stays blocked.
- No plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 512/512 tests pass. `test/cantrip-rank-1-batch-4.test.js` covers Faerie Dust (Effects, inheritance, notes, the refusals) and Kinetic Ram (variants and base).

[Live evidence](phase-cantrip-rank-1-batch-4-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch4`:
- **Faerie Dust (1 action):**
  - Failure: “Spell Effect: Faerie Dust (Failure)”, Will −2.
  - Critical failure: both Effects (Will −2, PF2e keeping the larger penalty).
  - The card showed “It can't use reactions.” for both.
- **Kinetic Ram (1 action):** push notes of 10 and 20 feet; the base spell's plan isn't executable.
- **Regressions:**
  - `cr1Batch1`, `rank1Batch2`–`rank1Batch5` and `actionVariants` ran after the row-proof changes.
  - `cr1Batch3`, `compact` and `actionVariants` ran after the guard.
  - All passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b87
node tools/diff-compiled-plans.mjs /tmp/phase23-b86/official-spell-compiler-report.json /tmp/phase23-b87/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b87/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch4`, then `cleanup`.
