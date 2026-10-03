# Cantrip / rank 1 batch 44 — Celestial Accord

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Target “2 creatures that each have an unfriendly or worse attitude toward the other”: a GM question per target | Celestial Accord (1) |
| “A creature currently engaged in combat can't get a result worse than success, and a target that is subject to hostility from any other creature ceases to be affected by celestial accord.”: a GM-confirmed degree floor (failure and critical failure become success). The whole sentence also joins the notes | Celestial Accord |
| Success: “The creature is filled with doubt … It has a -2 status penalty to attack rolls against the other target for 1 round.”: a 1-round note (the GM applies it against that creature) | Celestial Accord |
| Failure / critical failure: the attitude and no-hostility notes for the spell's minute. The critical failure's note (“As failure, but … friendly …”) now keeps the failure's “can't make hostile actions against the other target” | Celestial Accord |

**Note inheritance.** An “As failure, but …” row whose note replaces the failure's used to drop the failure note's other rules. It now keeps them when the failure note has a behaviour rule the new one lacks. A corpus-wide note-text comparison shows only Celestial Accord changed; Charming Touch, whose failure note is only an attitude, is unchanged.

**Kept strict (tests):**
- Another floor (“worse than failure”) isn't read as a degree adjustment. It stays a reminder on the notes.
- A penalty that isn't against the other target stays unaccounted.

## Coverage

**Census:** **526 enabled**, up from 525.
- The b127 corpus diff against b126 changed only Celestial Accord.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 594/594 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-44-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch44`:
- **Questions:** every target got both GM questions.
- **Success:** the 1-round penalty note.
- **Failure:** the 1-minute attitude note.
- **Critical failure:** the attitude note, starting “As on a failure: The creature can't make hostile actions …”.
- **In-combat target (real roll):** it rolled a critical failure, and with the floor applied its result became a success.

**Regressions:** `cr1Batch11` (Charming Touch) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b127
node tools/diff-compiled-plans.mjs /tmp/phase23-b126/official-spell-compiler-report.json /tmp/phase23-b127/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b127/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch44`, then `cleanup`.
