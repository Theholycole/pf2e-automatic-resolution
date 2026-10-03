# Rank 2 batch 58 — Blazing Blade

2026-10-01. A repeated attack for the whole duration (deferred earlier). It needed no new user decision.

| Spell | Now |
| --- | --- |
| Blazing Blade (2) | The card's button makes a melee spell attack against the targeted creature, as one action (attack, concentrate), any number of times and on any turn, until the spell's minute runs out. Then the button reads "Attacks Used". PF2e's own damage is rolled: 1d6 fire + 1d6 spirit + the spellcasting modifier, with fire 2d6/3d6/4d6 at 4th/6th/8th, doubled on a critical hit. From 4th, a critical hit also deals 1d6/2d6/3d6 persistent spirit damage (the 4th-rank entry's inline roll). |

## Rules

- **`blade-attack.js` (new pre-pass):**
  - It reads the window sentence, the roll, the hit (two damage entries, the second with the modifier) and the critical-success sentence.
  - Each fixed heightened entry's fire dice must be the item's own heightening, and each entry's persistent dice must be the 4th-rank inline roll at that rank.
  - It becomes an ordinary melee spell attack. A second compile with the critical persistent damage gives a heightened variant of the rows from 4th.
- **`basic-save-core.js`:**
  - The new repeat window `duration`: one action, no total, a fixed duration, and the compiled sentence.
  - A heightened variant may carry its own damage proof (`compilerEvidence`), merged in the inspection and in `heightenedPlanAt`.
- **`main.js`:** the window `duration` allows an attack on any turn until the duration ends. The label is "Attack (1 action) — N".

## Tests

907/907 pass. `test/rank-2-batch-58.test.js` is new. It checks:
- the plan, and the rows at 3rd (doubling only) and at 4th (persistent spirit);
- that a changed persistent die, fire step or damage isn't read.

A whole-corpus compile (b312 → b313) changed only Blazing Blade.

## Coverage

**Census:** **1135 enabled**, up from 1134. Rank 2: 221 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-58-live-results.json), case `rank2Batch58`, in the `pftest` world, in combat, from the chat card's button.

**At 2nd:**
- Three attacks on the caster's turn and a fourth on the foe's turn were all made.
- The hit was "1d6 fire + 1d6 spirit" (7 lost).
- The critical hit was doubled (10 → 20 lost), with no persistent damage.

**At 4th:** a critical hit with "2d6 fire + 1d6 spirit" left the foe with persistent "1d6 spirit".

**After 61 seconds:** no attack was made, and the button read "Attacks Used".

**A probe:** a caster with Charisma +4 rolled "1d6 fire + (1d6 + 4) spirit".

**Cleanup:** fixtures and the combat were removed.
