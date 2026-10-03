# Cantrip / rank 1 batch 77 — Magic's Vessel

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The target gains a +1 status bonus to saving throws.”: PF2e's Effect on the target (sustained, 1 minute) | Magic's Vessel (1) |
| “Each time you Cast a Spell from your spell slots, you automatically Sustain this spell and grant its target resistance to damage from spells equal to the spell's rank, until the start of your next turn.”: an Ongoing control grants PF2e's resistance Effect (proved: a rank choice and spell resistance of that rank, 1 round) to the target, and records this round's Sustain | Magic's Vessel |

**Kept strict (tests):**
- Another trigger (a scroll) isn't read.
- Another benefit isn't read.

## Coverage

**Census:** **559 enabled**, up from 558.
- The b160 corpus diff against b159 changed only Magic's Vessel.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 646/646 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-77-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch77`:
- **The Effect:** the ally got “Spell Effect: Magic's Vessel” (+1 status to saves, 1 minute).
- **The control:** it granted “Magic's Vessel (Resistance)” for 1 round, giving resistance 1 to spells. PF2e offered only one rank to the 1st-level caster and chose it without a prompt.

The first run found the plan unsupported: PF2e's compendium links the resistance Effect by id, while the compiler matched the name-style link of the exported data. It now matches the link's label and was re-run.

**Regressions:** `cr1Batch29` (Echoing Weapon, Ongoing controls) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b160
node tools/diff-compiled-plans.mjs /tmp/phase23-b159/official-spell-compiler-report.json /tmp/phase23-b160/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b160/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch77`, then `cleanup`.
