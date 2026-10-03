# Long-tail batch 4 — verification

2026-09-26. The fourth larger batch of unrelated general rules from the long tail, covered by one live run.

## Rules and spells

| Rule | Spell (phase) |
| --- | --- |
| Persistent-only damage by degree: “half the / the full / double the persistent <type> damage” | Blood Runs Cold, Fungal Infestation, Blood Vendetta, Blistering Invective (2) |
| A condition “until the persistent <type> damage ends” in a save row | Blood Runs Cold (2) |
| A flag-choice degree Effect after the table, with weakness per degree at the rank, lasting while the persistent damage does | Fungal Infestation (2) |
| A row Effect “Until the bleeding stops, the target has weakness 1 to piercing and slashing damage.”, inherited by “As failure” | Blood Vendetta (2) |
| “If …, it gains a +4 circumstance bonus to its save.”: the GM answers for each target before its save | Blistering Invective (2) |
| A stored trigger any number of creatures set off until the caster's next turn | Crescent Scepter (2) |

### Fix: “As success, but <Condition N>”

A row “As success, but Frightened 2.” used to keep the inherited Frightened 1 as well as Frightened 2. After “but”, a restated valued condition now replaces the inherited one of the same slug.

This changed the outcomes of 20 plans that were already blocked, among them Life Tap, Waking Nightmare, Threatening Mimicry, Glacial Heart and Vibrant Vibrato. None of them was enabled.

## Coverage

**Census:** **413 enabled**, up from 408.
- Phase 2: 222 of 588.
- Phase 3: 50 of 615 (Sustain 11 of 153).

**The b65 corpus diff against b64 changed 25 plans:**
- Newly executable saves: Blistering Invective, Blood Runs Cold, Blood Vendetta and Fungal Infestation.
- A stored trigger (counted as the ongoing route): Crescent Scepter.
- 19 blocked plans changed by the inheritance fix; Crescent Scepter's own rows changed too.
- Nightmare's save-bonus sentence is now claimed; it stays blocked for its other gaps.
- No plan lost a route.

The speed check passed, and the escape and six rule-family checks report 0 regressions.

**During the batch:** the save-row persistent-link proof first widened the attack proof to miss rows, and Charged Javelin's test caught it. Save-row proofs now carry `check: "save"`, so a spell attack keeps hit rows only.

## Evidence

**Automated:** 451/451 tests pass.
- `test/long-tail-batch-4.test.js` covers every rule above and its refusals:
  - an unstated persistent amount;
  - a weakness claim at the wrong rank or with a missing type;
  - an Effect whose weakness differs from the text;
  - a save bonus for another save, or one depending on the roll.
- `test/homebrew-guide.test.js` compiles the guide's homebrew example.

[Live evidence](phase-3-long-tail-batch-4-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `longTailBatch4`:
- **Blood Runs Cold:**
  - Persistent cold `0.5 * 1d6` / `1d6` / `2 * 1d6` for success, failure and critical failure.
  - The failure gave Slowed 1 for 1 round.
  - The critical failure gave “Blood Runs Cold: Slowed 1 (while taking persistent cold damage)”, which was removed with the persistent condition.
- **Fungal Infestation:**
  - Persistent poison `0.5 * 2d6` / `2d6` / `2 * 2d6`.
  - The success got no Effect.
  - The failure's Effect was preset to 1 (weakness 1 to fire and slashing), the critical failure's to 2 (weakness 2). PF2e names it “Spell Effect: Fungal Infestation (Critical Failure)”.
  - After the persistent poison was removed, the Effect and the weakness were gone.
- **Blood Vendetta:** persistent bleed `2d6` / `2 * 2d6`, and “Spell Effect: Blood Vendetta (Failure)” on both rows (weakness 1 to piercing and slashing). The Effect was removed when the bleeding stopped.
- **Blistering Invective:**
  - An unanswered target's save was refused.
  - Answered “No”: save modifier +10. Answered “Yes (+4)”: +14.
  - Persistent fire, with Frightened 1 and 2.
- **Crescent Scepter** in combat:
  - The marker lasted 1 round to the turn start, from the caster's initiative (30).
  - Two attackers triggered it (success: Frightened 1, failure: Frightened 2), and the spell stayed active.
  - At the caster's next turn the marker was removed and the record ended.
- **Regressions:** `persistentLinked`, `attackAdjustments`, `attackComponents`, `compact`, `longTailBatch3` and `degreeChoiceAndRift` passed, with cleanup between them. Cleanup left no fixtures and no combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b65
node tools/diff-compiled-plans.mjs /tmp/phase23-b64/official-spell-compiler-report.json /tmp/phase23-b65/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b65/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `longTailBatch4`, then `cleanup`.
