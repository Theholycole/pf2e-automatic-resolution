# Cantrip / rank 1 batch 101 — Garden of Healing

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “When you cast this spell and the first time you Sustain it on each subsequent round, you generate a pulse of renewing energy that heals each creature within the emanation for 1d4 Hit Points.”: one healing roll, applied to each creature within 10 feet and the caster, when cast and on the first Sustain each round (heightened +1d4 a rank) | Garden of Healing (1) |
| “… once this spell ends, any creature that has been affected by its healing gains a +1 circumstance bonus to saves against emotion effects for 10 minutes but does not receive any healing from additional castings of the spell while the bonus persists.”: PF2e's Effect (proved: that bonus, 10 minutes) on each creature healed, when the spell ends; a creature holding it isn't healed | Garden of Healing |

**Kept strict (tests):** it isn't read with any of these changes:
- other dice;
- another bonus value, trait or duration;
- other heightening;
- an added condition in the narration;
- an added rule after the bonus;
- a spell that isn't sustained.

**The caster is included.** An emanation's creator chooses whether it's affected. The runtime always heals the caster.

## Coverage

**Census:** **582 enabled**, up from 581.
- The b184 corpus diff against b183 changed only Garden of Healing.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 694/694 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-101-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch101`. The cast was at rank 2 (`2d4`), and every creature started 15 HP down. The creatures were:
- the caster;
- one creature 5 feet away;
- one creature 10 feet away;
- one creature 60 feet away;
- one creature 5 feet away already holding PF2e's Effect.

Results:
- **When cast:** the caster and the creatures 5 and 10 feet away each regained 8. The far creature and the one holding the Effect regained nothing.
- **First Sustain in combat:** the same three regained 5 each, and the other two nothing.
- **Second Sustain in the same round:** nobody was healed.
- **Ended:** the three healed creatures got `Spell Effect: Garden of Healing` (10 minutes). The far creature got nothing. The creature holding the Effect kept only its own.

The run left no combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b184
node tools/diff-compiled-plans.mjs /tmp/phase23-b183/official-spell-compiler-report.json /tmp/phase23-b184/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b184/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch101`, then `cleanup`.
