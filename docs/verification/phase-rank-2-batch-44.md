# Rank 2 batch 44 — a save deferred to the GM's control

2026-10-01. Follows the user's decision of 2026-10-01: what the module can't detect is a GM control.

| Spell | Now |
| --- | --- |
| Albatross Curse (2) | Casting puts PF2e's Spell Effect: Albatross Curse on the one target: its +1 circumstance bonus to attacks against the target, for attackers within 30 feet. The save waits for the GM's Ongoing control, "the target killed the albatross (it saves)". The control rolls the target's Will save against the spell DC (or the GM gives the result) and removes the first Effect. Success: Stupefied 1 for 1 round. Failure: PF2e's Failure Effect, roll twice and keep the lower, for 1 minute. Critical failure: PF2e's Critical Failure Effect for 1 hour. The module adds `removeAfterRoll` to the RollTwice rule, because the text says only the next Will save (PF2e's Effects would roll twice on every one). |

## Rules

- **`deferred-save.js` (new):**
  - Reads the four preamble sentences and the four rows exactly.
  - PF2e's three Effects must be: the ephemeral attackers' Effect, and a roll twice, keep lower, on the save's statistic, lasting the row's 1 minute or 1 hour.
  - The attackers' Effect it hands out is checked in the catalog by id: the stated bonus within the stated distance. A unit test showed that a changed bonus was still being read; that is fixed.
- **`compile-ability.js`:** a pre-pass, only for text with that trigger sentence, reads the spell's linked Effects and returns the `deferred-save` plan.
- **Runtime:**
  - The `deferred-save` executor puts the first Effect on the target, recording the DC.
  - `deferredSave` (request and control) rolls the save and applies the row.

## Tests

888/888 pass. `test/rank-2-batch-44.test.js` is new. It checks the plan and the `removeAfterRoll` override, and that a changed bonus isn't read.

The whole-corpus compile b297 → b298 changed only Albatross Curse. b299, after the bonus check, is identical to b298.

## Coverage

**Census:** **1119 enabled**, up from 1118. Rank 2: 205 of 245.

## Evidence

[Live evidence](phase-rank-2-batch-44-live-results.json), case `rank2Batch44`, in the `pftest` world (DC 20). Each target got the first Effect, and the control removed it.
- **Success:** Stupefied 1 for 1 round.
- **Failure:** the Failure Effect for 1 minute, its RollTwice with `removeAfterRoll`.
- **Critical failure:** the Critical Failure Effect for 1 hour.
- **A real PF2e save:** it failed and got the Failure Effect.
