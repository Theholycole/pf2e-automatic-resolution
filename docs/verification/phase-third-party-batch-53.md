# Third-party batch 53: Lucky Decision

2026-10-07. The fifty-third batch of the third-party modules' spells.

## What changed

- **Lucky Decision (Magic+)** (new `fate-roll.js`, kind `fate-roll`; `effect-runtime.js`; `main.js`):
  - **The cast:** the d20 is rolled (`options.d20` for scripted runs) and kept on the caster's Effect until the next daily preparations.
  - **The card's reactions** (`fateAct`, also on the API). Using either one ends the spell.
    - **Your Good Luck:** the caster's next attack roll, saving throw or skill check uses the kept result. This is PF2e's SubstituteRoll as a fortune effect, forced (`required`) and used up after the roll.
    - **Their Bad Luck:** the targeted enemy's Will save against the spell DC sets its next such roll:
      - success: −2 status;
      - failure: the kept result and −2;
      - critical failure: the kept result and −4.
      - The Effect is used up after the roll.
  - PF2e's SubstituteRoll takes a single selector, so there is one rule each for attack rolls, saving throws and skill checks.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 52 | Batch 53 |
| --- | --- | --- |
| Effect | 83 | 84 |
| Not enabled | 17 | 16 |

Resolved: 211 of 227.

## Tests

`test/third-party-batch-53.test.js` (1). All 1,773 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-53-live-results.json), case `thirdPartyBatch53`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Kept 17; Your Good Luck; the caster's Athletics check | Total 17 (17 + its modifier 0); the reaction's Effect used up; the spell ended |
| Kept 3; Their Bad Luck on a foe who fails; the foe's Will save | Total 11 (3 + its modifier 10 − 2); used up; the spell ended |
