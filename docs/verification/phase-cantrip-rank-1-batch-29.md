# Cantrip / rank 1 batch 29 — a discharge by the Strikes that hit

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “If a creature is wielding the weapon at the end of its turn, the weapon discharges a burst of sound targeting one creature adjacent to the wielder. The sonic damage dealt is equal to the number of successful Strikes …” with “1: …, 2: …, 3: …, 4: …” (ceil(rank/2) per Strike). A **Retaliate** control asks how many Strikes hit and deals that entry to the targeted creature | Echoing Weapon (1) |

**Kept strict (tests):**
- A list missing an entry isn't read.
- Neither is a heightened rule other than “+1 per Strike”.

## Coverage

**Census:** **511 enabled**, up from 510.
- The b112 corpus diff against b111 changed only Echoing Weapon.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 569/569 tests pass (`test/cantrip-rank-1-batch-29.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-29-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch29`:
- Retaliating without a count was refused (“choose how many Strikes hit (1–4)”).
- With 3 Strikes, the foe took exactly 3 sonic damage.

**Regressions:** `cr1Batch28` passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b112
python3 tools/build-phase-spell-batches.py /tmp/phase23-b112/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch29`, then `cleanup`.
