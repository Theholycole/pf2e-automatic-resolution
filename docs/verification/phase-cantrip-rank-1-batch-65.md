# Cantrip / rank 1 batch 65 — Untamed Shift

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Untamed claws are an unarmed attack, have the agile and finesse traits, and and deal 1d6 slashing damage.” / “Untamed jaws are an unarmed attack that deal 1d8 piercing damage.”: proved by PF2e's unarmed Strike rules (claw 1d6 slashing, agile and finesse; jaws 1d8 piercing) | Untamed Shift (1) |
| The option chosen by PF2e's prompt, from the order feats the caster has; the Effect on the caster for 1 minute | Untamed Shift |
| **PF2e data** note: PF2e offers the second and third choices by the caster's level (6, 10), not the spell's rank; choose only as many as the cast rank allows | Untamed Shift |
| “You must cast untamed shift using 2 actions for this benefit.” (Soaring Shape): a **GM:** note | Untamed Shift |

**Kept strict (tests):** another die, damage type or trait than PF2e's Strike stays unproved.

## Coverage

**Census:** **547 enabled**, up from 546.
- The b148 corpus diff against b147 changed only Untamed Shift.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 622/622 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-65-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch65`:
- **Caster:** a character with the Untamed Form and Insect Shape feats (as roll options).
- **Choice:** PF2e's prompt offered Untamed Claws and Untamed Jaws, and Jaws was picked.
- **Result:** the caster's Strikes gained `jaws` and not `claw`. The Effect lasts 1 minute.
- **Notes:** both notes were posted.

The first run used the NPC fixture caster. PF2e builds a Strike rule's attack only for characters, so no Strike appeared. The case now makes a character caster.

**Regressions:** `rank2Batch2` (Animal Feature's attack proof) and `cr1Batch33` (Benediction's counteract note) passed, with cleanup between them. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b148
node tools/diff-compiled-plans.mjs /tmp/phase23-b147/official-spell-compiler-report.json /tmp/phase23-b148/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b148/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch65`, then `cleanup`.
