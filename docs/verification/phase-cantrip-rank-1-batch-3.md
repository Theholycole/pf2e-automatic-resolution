# Cantrip / rank 1 batch 3 — verification

2026-09-26. The third batch of the cantrip-and-rank-1 pass.

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| “The target is pulled 10 feet closer to you unless it succeeds at a Fortitude save. On a critical failure, it's also knocked Prone.”: a save table whose failure pulls the target toward you (a **GM:** note) and whose critical failure adds Prone | Gravitational Pull (1), all three action variants |
| A variant's “The spell targets one creature and pulls the target 20 feet instead of 10.” sets that variant's distance (it must name the base distance) | Gravitational Pull (2 actions) |
| Spell-attack tables for Target “1 living creature” (living-creature eligibility) | Call of the Grave (1): Sickened 2 and Slowed 1 while Sickened on a critical hit, Sickened 1 on a hit |
| Spell-attack tables for Target “1 creature or unattended object” (creatures are targeted; objects are the GM's) | Hydraulic Push (1): double damage and knocked back 10 feet on a critical hit, full damage and 5 feet on a hit |

**Kept strict (test):** a variant's distance line that doesn't name the base distance (“instead of 15”) is refused.

**Looked at and left blocked:**
- Kinetic Ram: its 2-action variant doubles the push and adds Prone and damage in its own words.
- Tidal Surge: willing targets don't save, plus a separate water distance.
- Fire Ray: burning squares.
- Biting Words and Camel Spit: repeated attacks on later turns.
- Winter Bolt: a delayed explosion.
- Withering Grasp and Flense: object and corpse rules.
- Remaining save cantrips (Illuminate, Scrounger's Glee, Shroud of Night, Glass Shield, Tame, Murmuration, Spirit Object): GM-judged rules the module doesn't model.
- Spells whose extra row rules are behaviour (“can't use hostile actions against you”, “can't use reactions”, “must use its first action to …”): Charming Push, Debilitating Terror, Airburst, Command, Heart's Hook, Faerie Dust, Hollow Heart. See the question at the end of this batch.

## Coverage

**Census:** **476 enabled**, up from 473. Rank 1: 138 of 387. Cantrips: 55 of 120.
- The b86 corpus diff against b85 changed three plans: Call of the Grave and Hydraulic Push (route null → true), and Retrieving Hook (rank 2, still blocked by its own row).
- Gravitational Pull is enabled through its variant plans.
- No plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 510/510 tests pass. `test/cantrip-rank-1-batch-3.test.js` covers each rule and the refusal.

[Live evidence](phase-cantrip-rank-1-batch-3-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch3`:
- **Gravitational Pull:**
  - 1 action, critical failure: “pulled 10 feet toward the caster”, and Prone.
  - 2 actions, failure: “pulled 20 feet toward the caster”, no Prone.
- **Call of the Grave:** a critical hit gave Sickened 2 and Slowed 1. Removing Sickened also removed Slowed.
- **Hydraulic Push:** the critical hit took 22 (2 × 11) with a 10-foot push note, and the hit took 11 with a 5-foot note.
- **Regressions:** `spellAttack`, `attackRowRules`, `forcedMovement`, `actionVariants`, `compact`, `rank3Batch1` and `attackVariantChoices` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b86
node tools/diff-compiled-plans.mjs /tmp/phase23-b85/official-spell-compiler-report.json /tmp/phase23-b86/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b86/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch3`, then `cleanup`.
