# Rank 3 batch 85 — Infectious Ennui

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Infectious Ennui (3) | A sustained Will save. Success: Slowed 1 until the end of the target's next turn. Failure: Slowed 1 and Frightened 1 while the spell lasts, and Frightened can't go below 1 while the spell is active. Critical failure: the same with Slowed 2 and Frightened 2. A spreading result posts a card for the cast. At each of the target's turns, the GM targets one creature within 30 feet and presses it: that creature saves (Will), a failure is Slowed 1 for 1 round, and it is then immune to this casting either way. From 5th rank, the spread's Slowed lasts as long as the original cast and ends with it. |

## Rules

- **Spreading mood (`src/compiler/spreading-mood.js`, compiled in `compileSpell` like Grisly Growths' follow-up):**
  - The rows are rewritten to wordings the compiler already reads: "until the end of its next turn", and the spell-active floor "The frightened value can't be reduced below N while the spell is active."
  - The spread becomes a plan of its own: Will save, then temporarily immune for 1 minute, the spell's longest duration; on a failure, Slowed 1 for 1 round.
  - The heightened (5th) spread plan has the same rows, with Slowed lasting the spread's minute.
  - Both plans go on `resolution.chainSave` (per cast and repeatable, for the failure and critical failure, with the heightened rank).
- **Core:** a spread chain needs the main plan to be sustained, the compiled spread sentence, and supported spread plans with their immunity.
- **Runtime:**
  - **The spread card:** after Finalize, one card for the cast when a target took a spreading result. Pressing it with creatures targeted starts the spread save (the heightened plan at its rank).
  - **Immunity:** the spread's immunity key gets the cast's id, so it covers this casting only.
  - **At 5th:** the card carries the original cast's id. The spread save's condition Effects are attached to that cast's Ongoing record (through the Ongoing queue), so they end when it does.

## Interpretations

- "temporarily immune to this casting": immune to further spreads of this casting, for up to the spell's 1 minute.
- The spread is the GM's choice of creature at the start of each of the target's turns (the card is pressed then; the module doesn't pick).

## Tests

`test/rank-3-batch-85.test.js` is new. It covers the rows, the floor, the chain and both spread plans, a tampered spread plan with no immunity (rejected), and another spread condition (not read).

A whole-corpus compile (b599 → b600) changed only Infectious Ennui.

## Evidence

[Live evidence](phase-rank-3-batch-85-live-results.json), case `rank3Batch85`, in the `pftest` world, in combat, at 3rd rank (caster level 5) and 5th (caster level 9).

| Step | Result |
| --- | --- |
| The target fails | Slowed 1, Frightened 1; the spread card posted |
| After its turn | Frightened still 1 (the floor) |
| Spread to a second creature | It fails: Slowed 1 for 1 round |
| Spread to it again | Refused: immune to this spell |
| Spread to a third creature | It succeeds: nothing |
| The cast ended | Slowed and Frightened gone |
| At 5th: the target fails, the spread fails | Slowed 1 for the minute |
| The 5th-rank cast ended | The spread's Slowed gone too |

**Cleanup:** fixtures and combat removed.
