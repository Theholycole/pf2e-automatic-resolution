# Cantrip / rank 1 batch 33 — Benediction

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “You and your allies gain a +1 status bonus to AC while within the emanation.”: PF2e's aura Effect on the caster, which gives allies the bonus | Benediction (1) |
| “Once per round on subsequent turns, you can Sustain the spell to increase the emanation's radius by 10 feet.”: optional growth. The Aura's radius “5 + badge × 10” starts at the spell's 15-foot emanation, and each Sustain raises the badge. A skipped Sustain doesn't end the spell; it lasts its minute | Benediction |
| “Benediction can counteract malediction.”: a **GM:** reminder on the card | Benediction |

Bless is unchanged; it still uses its own route.

Bane and Malediction are still blocked. Their Sustain forces new saves on enemies that weren't yet affected, which the module doesn't carry out.

**Kept strict (tests):**
- A step the Aura doesn't have stays blocked.
- So does an emanation that isn't the Aura's first radius.
- So does a counteract sentence naming another spell as the subject.

## Coverage

**Census:** **515 enabled**, up from 514.
- The b116 corpus diff against b115 changed only Benediction.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 577/577 tests pass (`test/cantrip-rank-1-batch-33.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-33-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch33`, in combat:
- **At casting:** the badge was 1 and the aura 15 feet. The ally 10 feet away went from AC 20 to 21, and the card had the counteract note.
- **Caster's next turn:** the obligation read “Optional Sustain to expand Benediction”. Sustaining raised the badge to 2 and the aura to 25 feet.
- **A round without Sustaining:** the cast stayed active at 25 feet.

The first run's only failure was the obligation label, which a second code path set. That path was fixed and the case re-run.

**Regressions:** `cr1Batch7` (Protective Wards, required growth that ends when not sustained) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b116
node tools/diff-compiled-plans.mjs /tmp/phase23-b115/official-spell-compiler-report.json /tmp/phase23-b116/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b116/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch33`, then `cleanup`.
