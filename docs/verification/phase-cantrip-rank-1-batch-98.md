# Cantrip / rank 1 batch 98 — Gust of Wind

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Large or smaller creatures in the area must attempt a Fortitude save. Large or smaller creatures that later move into the gust must attempt the save on entering.”: a lingering 60-foot line, ending at the start of the caster's next turn. Creatures inside when it's cast, and those moving in, save; a Huge or larger creature is unaffected | Gust of Wind (1) |
| Success “can't move against the wind”: a note until the caster's next turn | Gust of Wind |
| Failure: Prone. “If it was flying, it takes the effects of critical failure instead.”: the GM answers on the card | Gust of Wind |
| Critical failure: 2d6 bludgeoning, pushed 30 feet away from the caster (the wind's direction), Prone | Gust of Wind |
| The wind's effect on fires, fog and objects: a GM reminder | Gust of Wind |

**Kept strict (tests):**
- A push toward the caster isn't read.
- Other damage isn't read.
- Mismatched sizes aren't read.
- Another flying rule isn't read.
- Wind pushing creatures isn't read.

## Coverage

**Census:** **579 enabled**, up from 578.
- The b181 corpus diff against b180 changed only Gust of Wind.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 688/688 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-98-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch98`:
- **When cast:** the walker, the flyer and the giant were exposed.
- **The walker:** failed and went Prone, with no damage.
- **The flyer:** failed; the GM said it was flying, so it became a critical failure. It was knocked Prone and lost 5 (the rolled 2d6).
- **The giant (Huge):** unaffected (“too large”).
- **A creature moving into the line later:** saved, failed and went Prone.

**Regressions:** `drought` and `cr1Batch88` (lingering areas) passed, with cleanup between runs. The runs left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b181
node tools/diff-compiled-plans.mjs /tmp/phase23-b180/official-spell-compiler-report.json /tmp/phase23-b181/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b181/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch98`, then `cleanup`.
