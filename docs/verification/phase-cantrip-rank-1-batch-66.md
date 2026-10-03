# Cantrip / rank 1 batch 66 — Shields of the Spirit

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “You Raise your Shield, …” / “The shields last until the start of your next turn or until you're no longer raising your shield, whichever comes first.” / “While one of your allies is in your champion's aura, the shields grant them a +1 status bonus to AC, …”: PF2e's Effect on the caster, proved to hold exactly its Aura (allies, not self), the +1 status AC and the granted Raise a Shield, for 1 round | Shields of the Spirit (1) |
| “… each time an enemy makes an attack against the ally, the enemy takes 1d4 spirit damage (even if it misses).”: the retaliation route with PF2e's Effect as the marker. Retaliate (target the attacker) deals the item's damage, +1d4 per 2 ranks | Shields of the Spirit |

**Kept strict (tests):**
- Another AC bonus or die isn't read.
- “(if it hits)” isn't read.
- An added rule isn't read.

## Coverage

**Census:** **548 enabled**, up from 547.
- The b149 corpus diff against b148 changed only Shields of the Spirit.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 624/624 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-66-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch66`:
- **Marker:** the caster got PF2e's Effect (1 round to a turn's start) and its Raise a Shield Effect.
- **Retaliate:** it rolled 1d4 spirit (1), and the attacking foe lost 1 Hit Point.

**Regressions:** `cr1Batch62` (Defended by Spirits, the other new retaliation form) passed, with cleanup between them. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b149
node tools/diff-compiled-plans.mjs /tmp/phase23-b148/official-spell-compiler-report.json /tmp/phase23-b149/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b149/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch66`, then `cleanup`.
