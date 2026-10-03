# Rank 3 batch 25 — Moonlight Ray

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Moonlight Ray (3) | A ranged spell attack for 5d6 cold (silver, from PF2e's damage data), and an extra 5d6 spirit (+2d6 a rank) on a target with the unholy trait. **Critical hit:** doubles both. The counteract-along-the-path reminder is on the card. |

## Rules

- **Conditional damage (`conditional-damage.js`):** the extra-dice sentence may follow a semicolon ("…; if the target has the X trait, you deal an extra NdM T damage.").
- **Spell-attack table (`spell-attack-table.js`):**
  - That semicolon sentence is split into the damage and the conditional sentence.
  - The critical row "The target takes double X damage, as well as double Y damage if a …" means double damage, when X is the item's one type and Y the conditional's.
- **Interpretation (logged):** the critical row's "if a fiend or undead" is the older wording of the unholy condition.
- **Tests updated:** `test/conditional-damage.test.js` and `test/spell-attack.test.js` asserted Moonlight Ray stays blocked. They now assert its conditional damage and support.

## Tests

1036 + 2 updated + 1 = 1039 pass. `test/rank-3-batch-25.test.js` is new, with a negative case: a critical row naming another type stays blocked.

A whole-corpus compile (b383 → b384) changed only Moonlight Ray.

## Evidence

[Live evidence](phase-rank-3-batch-25-live-results.json), case `rank3Batch25`, in the `pftest` world, with three targets.
- The plain target lost 17 (the cold roll).
- The unholy target lost 36 (17 + 19, the extra spirit roll applied once, with no double count from PF2e's own rule).
- The critical hit on another unholy target lost 72 (double).
- The counteract reminder was on the card.
- **Cleanup:** fixtures removed.
