# Cantrip / rank 1 batch 15 — conditions without a save

2026-09-27. You chose to finish cantrips and rank 1, spell by spell. The largest remaining group named a condition without a save. Some of those spells grant it (automated now); others only mention it (now notes).

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The ally becomes Quickened and can use the additional action to Strike, Stride, or Step.”: PF2e's Quickened on the ally for the spell's 1 round, and a note (“… Strike, Stride, or Step”). A target that isn't an ally is refused | Allegro (cantrip) |
| “You Step and become Concealed.”: Concealed on the caster for the spell's “until the end of your next turn” | Sudden Shift (1) |
| “You gain the Concealed condition during this movement and until the start of your next turn.”: the sentence's own duration | Qi Rush (1) |
| A spell that only mentions conditions is a spell note: “If the target is Grabbed, Immobilized, or Restrained, it can immediately use a reaction to attempt to Escape.”; “an Unconscious ally”; “ignoring the target's Concealment”; “You make the object Invisible.”; “An item made to look decrepit appears Broken”; an Invisible wall or disk | Liberating Command, Friendly Push, Thoughtful Gift, Shooting Star, Invisible Item, Item Facade, Carryall, Phantasmal Minion (1); House of Imaginary Walls, Root Reading (cantrips) |

The condition is applied through an Effect that grants PF2e's own condition and is timed like the save route's condition Effects. Deleting the Effect removes the condition. This route is enabled automation: the condition and its duration are proven from the text.

**Kept strict (tests):**
- Restoring or reducing a condition stays blocked (Stone to Flesh, Veil of Confidence).
- So does a Target line other than an ally or creature, and another grant wording (“might become”).
- A grant whose value doesn't match PF2e's condition is refused.
- Condition links in heightened paragraphs are checked too. A first version missed them and briefly admitted Darkness, Wall of Shadow and Shadow Jump.

## Coverage

**Census:** **494 enabled**, up from 491. Cantrips: 56 of 120. Rank 1: 154 of 387. Note only: 349 non-ritual.
- The b98 corpus diff against b97 changed exactly the 13 spells above.
- No plan became or stopped being executable on the save route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 539/539 tests pass (`test/cantrip-rank-1-batch-15.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-15-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch15`:
- **Allegro (in combat):**
  - Targeting a foe was refused (“target an ally”).
  - The ally had “Allegro: Quickened” and “Spell Note: Allegro”, and was Quickened during its own turn.
  - It was no longer Quickened at the caster's next turn.
- **Sudden Shift:** the caster was Concealed, with the note.
- **Invisible Item:** one note on the caster, and no Invisible condition on anyone.

**Regressions:** `cr1Batch14` and `cr1Batch12` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b98
node tools/diff-compiled-plans.mjs /tmp/phase23-b97/official-spell-compiler-report.json /tmp/phase23-b98/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b98/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch15`, then `cleanup`.
