# Cantrip / rank 1 batch 81 — Glass Shield

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “This counts as using the Raise a Shield action, giving you a +1 circumstance bonus to AC until the start of your next turn …” / “You can Shield Block with the glass shield. It has Hardness 2.” and the Heightened Hardness (4, 7, 10, 12 at ranks 3, 5, 7, 9): PF2e's shield Effect on the caster, proved, and used as the stored trigger's marker until the start of the caster's next turn | Glass Shield (cantrip) |
| “When you Shield Block, the shield explodes … the shards deal 1d4 piercing damage to that creature with a basic Reflex save. After you use Shield Block, the spell ends …”: Trigger opens the basic save card for the creature that broke it (PF2e's damage at the cast rank), and the spell ends | Glass Shield |
| The 5-foot range, the magical-effect reaction and “you can't cast it again for 10 minutes”: notes on the marker | Glass Shield |

**Kept strict (tests):**
- Another Hardness at the base rank or a heightened rank isn't read.
- Another AC bonus isn't read.
- An added rule isn't read.

## Coverage

**Census:** **563 enabled**, up from 562.
- The b164 corpus diff against b163 changed only Glass Shield, now on the stored-trigger route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 654/654 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-81-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch81`:
- **The marker:** the caster's shield was raised (AC 1, Hardness 2), and the Effect carried the cooldown note.
- **The Shield Block trigger:** the save card rolled `1d4 piercing` (1), and the failing foe lost 1.
- **The end:** the spell ended and the Effect was removed.

**Regressions:** `cr1Batch79` (Draconic Barrage, the other Effect marker) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b164
node tools/diff-compiled-plans.mjs /tmp/phase23-b163/official-spell-compiler-report.json /tmp/phase23-b164/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b164/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch81`, then `cleanup`.
