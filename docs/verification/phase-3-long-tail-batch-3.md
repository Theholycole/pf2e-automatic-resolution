# Long-tail batch 3 — verification

2026-09-26. The third larger batch of unrelated general rules from the long tail, covered by one live run.

## Rules and spells

| Rule | Spell (phase) |
| --- | --- |
| Target `any number of creatures` | Weird (2) |
| A “varies” duration whose table uses a self-limiting Frightened | Attacked from Within (2) |
| A rolled condition value, `Drained [[/r 1d4]]` | Wails of the Damned (2) |
| A degree-choice Effect with a Weakness at the rank, lasting the sustained spell; a success row ending “until the end of your next turn” with “The spell can't be sustained.” | Leaden Steps (3, Sustain) |
| A spell that waits for its trigger, then makes the triggering creature save and ends | Animus Mine, Bandit's Doom (3) |
| “Frightened 3 and Fleeing for 1 round”: the timer is Fleeing's only | Fear (2) |

### Fix: trailing timers on Frightened and Sickened

Fear gave Frightened 3 a 1-round timer taken from “… and Fleeing for 1 round”. The timer is now skipped for a valued Frightened or Sickened when another condition lies between them. Such a condition has no timer and PF2e lowers it. Conditions with their own timer keep it.

Blocked spells with the same change: Deathless March, Summon Stampede, Hypnopompic Terrors, Roar of the Dragon, Unfathomable Song and Trim the Blight. Trim the Blight's “Sickened 1 and Slowed 1 for 1 round” is the arguable one; it stays blocked for its reach rule. No enabled spell's outcomes changed, apart from Distracting Decoy and Ill Omen recording `outcomeRule.rank`.

## Coverage

**Census:** **408 enabled**, up from 402.
- Phase 2: 217 of 588.
- Phase 3: 50 of 615 (Sustain 11 of 153).
- Stored-trigger spells count as the ongoing route.

**The b64 corpus diff against b63 changed 24 plans:**
- Newly executable: Fear, Leaden Steps, Attacked from Within, Wails of the Damned and Weird.
- Stored triggers: Animus Mine and Bandit's Doom.
- 10 blocked spells lost only their `item-duration-grammar` gap (the “varies” rule).
- Overwhelming Presence and Phantasmagoria lost only `target-eligibility`.
- 5 blocked spells changed only the Frightened/Sickened timers above.
- No plan lost a route.

The speed check now expects an audited stored-trigger spell to have no one-time save route, as it already did for lingering areas. It passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 445/445 tests pass.
- `test/long-tail-batch-3.test.js` covers every rule above: the refused extra trigger sentence, `ruleValueAtRank` and Fear's timers.
- `test/homebrew-guide.test.js` compiles the guide's stored-trigger example.

[Live evidence](phase-3-long-tail-batch-3-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `longTailBatch3`:
- **Weird:** rolled 51. A success lost 25 and gained Frightened 1; a failure lost 51 and gained Frightened 2.
- **Attacked from Within:** a critical failure lost 124 (double 62), with Frightened 2 and Off-Guard for 1 round.
- **Wails of the Damned:** a failure rolled Drained 1d4 (4), posted and applied as Drained 4; a critical failure gave Drained 4.
- **Leaden Steps:**
  - Failure: the Effect was preset to “failure”, with weakness 2 and Encumbered carried by the Effect (none applied by the module).
  - Success: 1 round ending at the turn's end, with weakness 2.
  - A missed Sustain ended the spell and removed the Effect.
- **Animus Mine:**
  - The marker “Animus Mine (waiting for its trigger)” lasted 1 hour.
  - Trigger: the creature rolled 13, lost 26 (double) and was Stunned 1. The spell ended, the marker was removed and the GM note was whispered.
- **Bandit's Doom:** a second casting superseded the first (ended as `superseded`), leaving one marker.
- **Fear:** Frightened 3 and Fleeing. After a round, Frightened 2, and Fleeing ended.
- **Regressions:** `degreeChoiceAndRift`, `longTailBatch2`, `sustainedConditions`, `counteractWards` and `healOrHarm` passed, each run after cleanup. Cleanup left no fixtures.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b64
node tools/diff-compiled-plans.mjs /tmp/phase23-b63/official-spell-compiler-report.json /tmp/phase23-b64/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b64/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `longTailBatch3`, then `cleanup`.
