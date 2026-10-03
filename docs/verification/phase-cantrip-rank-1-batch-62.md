# Cantrip / rank 1 batch 62 — Defended by Spirits

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Target “1 ally and 1 enemy” and “Each time the enemy attacks and damages the ally, the enemy takes 1d6 spirit damage.”: the retaliation route with the marker on the ally. The enemy is recorded at the cast, and Retaliate always hits it (the item's damage, heightened +1d6 per 2 ranks) | Defended by Spirits (1) |
| “The enemy is aware of these spirits and has a general sense that attacking the ally will draw the spirits' ire.”: narration | Defended by Spirits |
| Sustained for up to 1 minute: a Sustain control each turn; a missed Sustain ends it and removes the marker | Defended by Spirits |

**Kept strict (tests):**
- Another die isn't read.
- “attacks the ally” (without “and damages”) isn't read.
- An added rule in the narration isn't read.
- Another Target (“2 allies and 1 enemy”) isn't read.
- At the cast, two targets that aren't one ally and one enemy are refused.

**Side change:** the new “1 ally and 1 enemy” target also clears the target-eligibility gap for three spells that already had it as their Target:
- Foresee the Path and Omnidirectional Scan: spell notes on the caster.
- Forbidding Ward: an Effect + note.

Their routes and the census counts for notes are unchanged.

## Coverage

**Census:** **544 enabled**, up from 543.
- The b145 corpus diff against b144 made only Defended by Spirits executable. The other three changed only in their pending list.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 616/616 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-62-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch62`:
- **Targets:** two enemies were refused (“target 1 ally and 1 enemy”).
- **Marker:** it went on the ally, “Defended by Spirits (against … spirits foe)”, and not on the caster.
- **Retaliate:**
  - It refused another foe (“it only harms … spirits foe.”).
  - On the recorded foe it rolled 1d6 spirit (3), and the foe lost 3 Hit Points.
- **Sustain:**
  - In combat, the caster's turn asked for Sustain. After sustaining, the spell stayed active.
  - The next missed Sustain ended it (`missed-sustain`) and removed the marker.

**Earlier runs:**
- The first run failed on a harness lookup: it read `castId` from the wrong result.
- The second run behaved correctly, but its name assertion missed the fixture's name prefix.
- Both were corrected and the case re-run.
- A later run added an Omnidirectional Scan note check, which found that spell's note goes on the caster (by design). The check and a note-limit change it motivated were removed, since no spell relies on them.

**Regressions:** `cr1Batch29` (Echoing Weapon, the existing retaliation route) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b145
node tools/diff-compiled-plans.mjs /tmp/phase23-b144/official-spell-compiler-report.json /tmp/phase23-b145/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b145/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch62`, then `cleanup`.
