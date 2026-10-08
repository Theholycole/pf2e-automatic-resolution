# Third-party batch 58: Honorable Death

2026-10-07. The fifty-eighth batch of the third-party modules' spells.

## What changed

- **Honorable Death (Clerics+)** (new `honor-duel.js`, kind `honor-duel`; `effect-runtime.js`; `main.js`):
  - **The cast:** the champion is the caster or an ally within 30 feet (asked, or `options.champion`). The target attempts its Will save; a critical success leaves it unaffected.
  - **The target's Effect** lasts until the end of its turn on a success, 4 rounds on a failure, and 1 minute on a critical failure.
  - **The end-of-turn control** (`honorAct`, also on the API):
    - No hostile action against the caster or champion: twice the cast rank in spirit damage, with a basic Will save. On a success row the spell then ends.
    - On the failure and critical failure rows, the Will save to shorten it follows: a success removes 1 round, a critical success ends it.
  - **At 0 HP:** the target is killed while the Effect lasts (`honorDeath`, through an `updateActor` hook). Its dying, unconscious and wounded conditions are removed, and it is marked dead.
  - **For review:** the text says "a creature", which the module reads as the target. This is logged in pending decisions.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 57 | Batch 58 |
| --- | --- | --- |
| Effect | 88 | 89 |
| Not enabled | 12 | 11 |

Resolved: 216 of 227.

## Tests

`test/third-party-batch-58.test.js` (1). All 1,778 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-58-live-results.json), case `thirdPartyBatch58`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Failure at 4th | 4 rounds; no hostile action: 8 spirit on a failed basic save; its save shortens it to 3 rounds |
| Next turn: it fought; its save a critical success | No damage; the spell ends |
| Success | 4 spirit on a successful basic save; the spell ends; no recovery save |
| Critical failure; the target at 0 HP | 1 minute; dead, not dying |
