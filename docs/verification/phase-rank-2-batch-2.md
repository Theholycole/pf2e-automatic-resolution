# Rank 2 batch 2 — verification

2026-09-26. The second rank-order batch: Effect-route spells whose extra sentences the linked PF2e Effect's rules state exactly.

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| “… a +1 status bonus to Athletics checks, Intimidation checks to Demoralize, and Fortitude saves.”: the bonus list is only skill checks (optionally “to <Action>[ or <Action>]”) and saves, and each action is a FlatModifier of that value and type on that skill with its `action:` predicate | Spirit of the Beast (2), Inscrutable Mask (3) |
| “… Stealth checks to Hide in areas of dim light or darkness”: also needs the Effect's `lighting:dim-light` and `lighting:darkness` predicates | Inscrutable Mask |
| “Claws You gain a claw attack that deals 1d6 slashing damage and has the agile, finesse, and unarmed traits.”: a Strike rule with that base type, damage and traits (plus PF2e's `magical`) | Animal Feature (2) |

**Kept strict:**
- Honeyed Words stays blocked: its list also has “against Perception checks to discern …” and “you add your level”.
- An action the Effect doesn't name (test: Coerce) is refused.
- A lighting qualifier without matching predicates (test: “in bright light”) is refused.
- An attack whose die or traits differ from the Strike rule is refused.
- Illusory Shroud's action part is now proved, but it stays blocked by its Hidden and Concealed rules.

**Tried and withdrawn:** applying PF2e's same-named Effect when the text links none. The survey was wrong: almost every such spell already links its Effect, and its Effect stays unscoped for other reasons. The rule changed only Penumbral Disguise, which stays blocked, so it was removed.

**What stays blocked at ranks 1–3 on the Effect route is bespoke:**
- Effects for thralls (Muscle Barrier, Song of the Soul);
- targets such as “yourself or your animal companion” or “1 willing creature with an unarmed claw Strike”;
- trigger wording (“the first time each round”, “then”);
- Dismiss without an Effect ending;
- per-wisp resources (Flame Wisp).

## Coverage

**Census:** **460 enabled**, up from 457. Rank 2: 62 of 245. Rank 3: 59.
- The b81 corpus diff against b80 changed 4 plans: the three spells above (level) and Illusory Shroud (one pending code fewer). The diff tool's route field covers save routes only, and no save route changed.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 497/497 tests pass. `test/rank-2-batch-2.test.js` covers both rules and their refusals.

[Live evidence](phase-rank-2-batch-2-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `rank2Batch2`. PF2e's ChoiceSet prompt (`PickAThingPrompt`) was answered by clicking its button.
- **Inscrutable Mask:** the Intimidation roll modifier went 0 → +1 with `action:demoralize` and stayed 0 without it.
- **Spirit of the Beast:**
  - On the companion, the prompt offered the three aspects, and Aspect of Might was chosen.
  - Athletics went 0 → +1 and Intimidation to Demoralize 0 → +1, while plain Intimidation stayed 0.
  - The caster got nothing.
- **Animal Feature:** at rank 1 the prompt offered Cat Eyes, Claw and Jaws (the rank-4 options are hidden). Claw gave “Spell Effect: Animal Feature (Claw)” and a claw Strike (1d6 + 1 slashing: agile, finesse, magical, unarmed).
- **Regressions:** `terrainBatch1` (Song of Strength's “such as” note, Honeyed Words), `durationBuffs`, `reactionBuffs`, `heightenedDuration`, `rank1Batch1` (Wooden Fists, Ant Haul) and `cantripBatch2` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b81
node tools/diff-compiled-plans.mjs /tmp/phase23-b80/official-spell-compiler-report.json /tmp/phase23-b81/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b81/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `rank2Batch2`, then `cleanup`.
