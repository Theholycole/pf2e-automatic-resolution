# Cantrip / rank 1 batch 58 — Tether

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Success The target takes a –5-foot circumstance penalty to its Speed as long as it's within 30 feet of you.”: a note for the spell's minute with a −5-foot circumstance modifier to land Speed. The 30-foot condition stays in the note | Tether (1) |
| “Failure … a –10-foot circumstance penalty to its Speed and can't move more than 30 feet away from you until it Escapes or the spell ends.”: the same, at −10 feet, and the limit is in the note | Tether |
| “Critical Failure The target is Immobilized until it Escapes or the spell ends.”: PF2e's Immobilized for the spell's minute, or until it Escapes, whichever comes first | Tether |
| The preamble (Escape, the tethers' AC 15 and 10 Hit Points, and the caster's 30-foot limit): added to each note, with the Heightened (+1) line for the tethers' AC and Hit Points | Tether |

**Kept strict (tests):**
- A Speed penalty that isn't in 5-foot steps from −5 to −30 isn't generated.
- A Speed row with a different condition (“for 1 hour” instead of “as long as it's within 30 feet of you”) stays blocked.

**Changed test:** `test/compiler.test.js` expected Tether's Immobilized in the old form. It now expects the Escape lifetime (`endsWhen ["escape"]`, `expirationMode "first"`, 1 minute).

## Coverage

**Census:** **540 enabled**, up from 539.
- The b141 corpus diff against b140 changed only Tether.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 608/608 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-58-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch58`:
- **Success:** land Speed went from 25 to 20, with a 1-minute note.
- **Failure:** land Speed went from 25 to 15, with a 1-minute note.
- **Critical failure:** Immobilized for 1 minute, ending on an Escape. Its Speed stayed at 25.

**Regressions:** `rank1Batch10` and `cantripBatch2` (the Escape family) passed, with cleanup between them. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b141
node tools/diff-compiled-plans.mjs /tmp/phase23-b140/official-spell-compiler-report.json /tmp/phase23-b141/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b141/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch58`, then `cleanup`.
