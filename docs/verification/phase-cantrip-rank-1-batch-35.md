# Cantrip / rank 1 batch 35 — Waking Nightmare

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Rows: Frightened 1 / 2 / 3 (existing) | Waking Nightmare (1) |
| “If it's asleep, it wakes up and is Paralyzed for 1 round.” (failure, and the critical failure “As failure, …”): Paralyzed for 1 round only for a creature asleep at Finalize, meaning PF2e's Unconscious with Hit Points above 0 (not knocked out). That creature's Unconscious ends; any other creature gets a card note | Waking Nightmare |
| “A creature frightened by this spell takes 1 additional mental damage each time it's hit by a Strike.”: a “Hit while frightened” note on each row. It lasts its Frightened value in the creature's turns, ending at the end of its turn. The heightened +1 per rank is in the note | Waking Nightmare |

**Kept strict (tests):**
- Another gate condition (“If it's prone”) isn't read.
- A tampered gate is refused.
- Extra damage on another trigger (“each time it attacks”) stays unaccounted.

## Coverage

**Census:** **517 enabled**, up from 516.
- The b118 corpus diff against b117 changed only Waking Nightmare.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 581/581 tests pass (`test/cantrip-rank-1-batch-35.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-35-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch35`:
- **Success:** Frightened 1, with a 1-round note.
- **Awake failure:** Frightened 2 and a 2-round note. No Paralyzed; the card says “the creature wasn't asleep”.
- **Sleeping critical failure:** Frightened 3 and a 3-round note. Paralyzed; its Unconscious removed, and the card says “It was asleep: it wakes up.”

**Regressions:** `rank1Batch1` (Thunderstrike's gated condition) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b118
node tools/diff-compiled-plans.mjs /tmp/phase23-b117/official-spell-compiler-report.json /tmp/phase23-b118/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b118/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch35`, then `cleanup`.
