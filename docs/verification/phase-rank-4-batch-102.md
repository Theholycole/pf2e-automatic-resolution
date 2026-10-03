# Rank 4 batch 102 — Prophet's Luck

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Prophet's Luck (4) | A reaction. The caster foretells success or failure; the card asks when not given. The target's next save takes +1 for success or −1 for failure (status), and that save uses the modifier up. The save's result settles it for the spell's 10 minutes: if the prophecy came true, the caster gains +1 status to saving throws; if not, the target takes −1 status to its saving throws. The amount is 2 from 6th rank and 3 from 9th. |

## Rules

- **Prophecy (`src/compiler/prophecy.js`, compiled in `compileSpell`):**
  - It reads the trigger, the four sentences (the bonus, penalty and aftermath must be one amount) and the heightened amounts.
  - `prophecyValue` gives the amount at the cast rank.
- **Runtime:**
  - **New effect kind:** `prophecy`. It makes the target's Effect with a status modifier on saving throws, used up by the next save (`consumeOn` saving-throw).
  - **The aftermath:** the module's used-roll hook compares PF2e's result with the prophecy (success or critical success versus failure or critical failure). It then makes the caster's bonus Effect, or the target's penalty Effect, for the spell's duration.

## Interpretation

The heightened amount applies to the aftermath as well as the triggering save.

## Tests

`test/rank-4-batch-102.test.js` is new. It covers the amounts at 4th, 6th, 8th and 9th, the duration, the save consuming the Effect, and uneven amounts (not read).

A whole-corpus compile (b610 → b611) changed only Prophet's Luck.

## Evidence

[Live evidence](phase-rank-4-batch-102-live-results.json), case `rank4Batch102`, in the `pftest` world.

| Step | Result |
| --- | --- |
| At 4th, success foretold | The target's prophecy Effect (+1, 1 round) |
| Its Fortitude save | +1 applied; a success; the Effect used up; the caster "fortune favors" +1 for 10 minutes |
| Failure foretold on another | Its save −1; a success; it gets "fortune spurns" −1 for 10 minutes |
| At 6th | The prophecy is +2 |

**Cleanup:** fixtures removed.
