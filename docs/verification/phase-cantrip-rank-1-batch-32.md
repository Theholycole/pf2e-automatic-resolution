# Cantrip / rank 1 batch 32 — Parch

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| PF2e flags the save basic, but the item has no damage. The text never says “basic” and has a full degree table. The flag is ignored and the table decides | Parch (1) |
| “The target takes a –1 status penalty to its checks and DCs for 1 round / 1 minute.”: a note Effect with a generated FlatModifier (`all`, status) | Parch |
| “… a –2 status penalty to its checks and DCs for 1 minute and is Dazzled as long as it has this penalty.”: PF2e's Dazzled for the same minute | Parch |
| “… if used on a creature that has the water trait or a creature made primarily of liquid (such as many oozes), the creature uses the outcome for one degree of success worse than the result.”: automatic for the water trait. Otherwise the card asks the GM whether the creature is made primarily of liquid | Parch |
| “Creatures whose bodies contain no significant moisture … are immune to parch.”: the existing GM eligibility question | Parch |
| “If a creature affected by parch drinks a liquid, …, the spell ends.” and “… can end the effect as a two-action activity …”: a new `ends-early` signal. The sentences ride on the row notes, and the GM removes the notes | Parch |

Heightened (4th) “You can target up to 4 creatures.” needs nothing: save cards resolve every targeted creature.

**The new `ends-early` signal.** Before this batch, such sentences had no signal and passed silently. They now block unless row notes carry them. The b115 diff changed 13 plans:
- Parch became executable.
- 12 already-blocked spells gained a named gap: Dehydrate, Stumbling Curse, Sage's Curse, Imprinting Hand, Haunting Spirit, Mirror's Misfortune, Mirecloak, Vindicator's Judgment, Bound in Death, Earth and Sky, Possession and Volcanic Eruption.
- No enabled spell was lost.

**Kept strict (tests):**
- A text that says “basic”, or an item with damage, keeps PF2e's flag.
- A condition lasting “as long as it stays in the area” isn't scoped.
- An unknown trait word isn't read.
- A degree shift missing its GM question is refused.

## Coverage

**Census:** **514 enabled**, up from 513.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 575/575 tests pass (`test/cantrip-rank-1-batch-32.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-32-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch32`:
- **Rows** (degrees set by the GM): every target got both GM questions (moisture and liquid body).
  - **Success:** −1 for 1 round.
  - **Failure:** −1 for 1 minute.
  - **Critical failure:** −2 and Dazzled, each for 1 minute.
  - Fortitude went 10→9, 10→9 and 10→8, and Athletics 0→−1, 0→−1 and 0→−2. The note text includes both ways to end it early.
- **Degree shift** (real rolls):
  - The water elemental rolled a failure and got a critical failure.
  - The ooze (the GM answered yes) rolled a critical success and got a success.
  - The humanoid (the GM answered no) kept its failure.

**Regressions:** `drought` (trait degree shift, moisture immunity) and `cr1Batch19` (row penalty) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b115
node tools/diff-compiled-plans.mjs /tmp/phase23-b114/official-spell-compiler-report.json /tmp/phase23-b115/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b115/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch32`, then `cleanup`.
