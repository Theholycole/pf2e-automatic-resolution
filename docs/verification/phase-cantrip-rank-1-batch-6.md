# Cantrip / rank 1 batch 6 — note Effects

2026-09-26. The first batch under your new direction: whatever the module can't carry out mechanically (behaviour, attitude, a GM or player choice) becomes a generated **note Effect** on the creature. The Effect names the spell and the rule, carries the text in its description, has no rules, and lasts as the spell says. Mechanical rules (damage, conditions, saves, movement, modifiers PF2e can express) are still automated or left blocked, never turned into notes.

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| “The target can't use hostile actions against you.” becomes a note lasting the spell's “until the start of your next turn”; the critical failure adds Stunned 1 | Charming Push (1), Debilitating Terror (1) |
| “The target takes a –1 circumstance penalty to attack rolls and damage rolls against you.”: PF2e's row Effect (a penalty only against its origin, the caster) | Charming Push, Debilitating Terror |
| “The target treats no other creature as an ally for 1 round / 3 rounds.”: notes of those durations; the critical failure keeps the failure's note and adds Frightened 1 | Hollow Heart (1) |
| “… must use a single action to do as you command.” / “… must use all its actions on its next turn …”: notes to the end of the target's next turn. The preamble's command list and “It can't Delay or take any reactions until it has obeyed your command.” are added to the note | Command (1) |
| Two targets; “The creature must spend the first action on its next turn to approach its partner.” and “It can't Delay or take any reactions until it has obeyed this urge.” (notes; the second borrows the first's duration). The critical failure's “all its actions” replaces the first-action note. “… you can elect to have one automatically succeed on its saving throw.” is a **Caster:** reminder | Heart's Hook (1) |
| The same general rule elsewhere: “can't use reactions until the start of your next turn” beside half damage | Phantasmagoria (9) |
| Save-route spell durations “until the start of your next turn” / “until the end of the target's next turn” (each row carries its own timing) | the spells above |

**Kept strict (tests):**
- Clauses with unread damage or unlinked conditions stay unaccounted (Impending Doom, Wilding Word).
- A spell duration “until the end of your turn” used as a repeat-attack window is still refused (Aqueous Blast's test).
- A malformed note is refused by the runtime.

**Test updates for the new direction:**
- Touch of Obedience's “cannot Stand” is now a note.
- Hollow Heart, previously kept blocked (rows only behaviour), is now resolved by notes.

## Coverage

**Census:** **485 enabled**, up from 479. Rank 1: 146 of 387. Rank 9: 10.
- The b89 corpus diff against b88 enables exactly the six spells above.
- 114 notes exist across the corpus; most of their spells stay blocked by other rules.
- No plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 516/516 tests pass (`test/cantrip-rank-1-batch-6.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-6-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch6`:
- **Charming Push:**
  - Success: “Spell Effect: Charming Push” (1 rule).
  - Failure: the note Effect “Charming Push: No hostile actions against the caster” (0 rules, 1 round to the turn start, GM / player description).
  - Critical failure: Stunned 1 and the note.
- **Hollow Heart:** notes lasting 1, 3 and 3 rounds, and Frightened 1 on the critical failure.
- **Command:** the failure's note text includes the command list and “can't Delay”; the critical failure's note is “Actions on its next turn”, lasting to the end of the target's turn.
- **Heart's Hook:** two notes per creature, with “all its actions” on the critical failure (no first-action note), and the card's **Caster:** reminder.
- **Regressions:** `cr1Batch1`, `cr1Batch4`, `rank1Batch1`, `rank1Batch2`, `phrasings`, `sustainedConditions`, `rank2Batch1` and `attackConditionRiders`, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b89
node tools/diff-compiled-plans.mjs /tmp/phase23-b88/official-spell-compiler-report.json /tmp/phase23-b89/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b89/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch6`, then `cleanup`.
