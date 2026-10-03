# Cantrip / rank 1 batch 21 — current-turn timing, more mentions

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “They become Concealed against the triggering attack and until the end of the current creature's turn.” (a reaction, Target `1 willing creature`): PF2e's Concealed until the acting creature's turn ends (out of combat, 1 round), with a note | Genie's Veil (1) |
| “The path can be visible or Invisible.”: a mention (the path is an object) | Glowing Trail (cantrip): a spell note |
| “…; if a target is Concealed or Hidden from you, you automatically succeed at the flat check to target it”: a mention | Omnidirectional Scan (cantrip): a spell note |
| “you can become Hidden to a creature even if you don't have cover …” / “unless you move into cover or become Concealed before then”: what a Stealth check can achieve, the GM's call | Dim the Light (1): a spell note |

**Kept strict (test):** a size-dependent condition on a creature (Stick On's “it's Immobilized”) isn't a mention.

## Coverage

**Census:** **502 enabled**, up from 501. Note only: 361 non-ritual.
- The b104 corpus diff against b103 changed exactly these four spells.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 553/553 tests pass (`test/cantrip-rank-1-batch-21.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-21-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch21`:
- **Genie's Veil:** cast in combat on the foe's turn. The ally was Concealed during that turn and no longer Concealed once it ended.
- **Glowing Trail:** one 1-hour note on the caster, with no Invisible condition.

**Regressions:** `cr1Batch15` and `cr1Batch6` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b104
python3 tools/build-phase-spell-batches.py /tmp/phase23-b104/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch21`, then `cleanup`.
