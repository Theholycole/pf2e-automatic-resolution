# Cantrip / rank 1 batch 127 — Grease

2026-09-28. The user took the recommendations: option (A).

| Rule | Spell |
| --- | --- |
| The area branch as a Reflex degree save on the creatures the caster targets on the 4 squares: failure or critical failure falls Prone. Reminders: a creature may use Acrobatics instead (the GM sets its result), the later Balance checks and the Step/Crawl exemption, and the object branch | Grease (1) |

**Kept strict (tests):** it isn't read with any of these changes:
- another condition;
- a Fortitude save;
- damage in the object branch;
- an added rule on the surface.

## Coverage

**Census:** **608 enabled**, up from 607.
- The b210 corpus diff against b209 changed only Grease.
- The escape and six rule-family checks report 0 regressions.
- The speed check passes, after the fix below.

## Correction: the speed check (batches 120–126)

While checking this batch's pipeline, I found the cross-family speed test (`tools/test-cross-family-speed.mjs`) had been failing since batch 120, with “Manifest Will: full-family route expectation”.
- **Cause:** batch 120's progress entry lists Manifest Will, whose route is the Effect + note (user decision). The test expected every spell listed in a batch after the speed baseline to gain a save route, except lingering areas and stored triggers. The same would have applied to Wish Market (`offer-effect`) and Stick On (`size-bond`).
- **Why it went unnoticed:** the pipeline only searched the test's output for a passing line, so a failure printed nothing. Batches 120–126 wrongly said the speed check passed.
- **Fix:**
  - An audited spell whose route isn't a save must *not* have a one-time save, the same exemption lingering areas and stored triggers have.
  - A run with batches up to 119 only doesn't fail on Manifest Will, which confirms it started with batch 120.
  - The pipeline now prints “speed PASSED” or “speed FAILED” with the assertion.
- Each of batches 120–126's verification docs now carries a correction note. Their `.sha256` manifests predate the note.

## Evidence

**Automated:** 737/737 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-127-live-results.json), case `cr1Batch127`, in the `pftest` world.
- **Three creatures:** success, failure and critical failure gave Prone `[false, true, true]`.
- **The card:** it showed the Acrobatics alternative, the Balance rule and the object branch.
- **Cleanup:** fixtures removed.
