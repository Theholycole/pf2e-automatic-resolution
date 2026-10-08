# Third-party batch 32: Targeted Ward

2026-10-06. The thirty-second batch of the third-party modules' spells: the caster's bonus against one foe, set by that foe's save.

## What changed

- **Targeted Ward (Magic+)** (new `targeted-ward.js`; the save card's new `casterWard`):
  - The card asks how many actions were spent (`action-versions`). Each version is the opponent's Will save card: 30 feet, 30 feet, or 60 feet.
  - At Finalize the caster gets an Effect for 4 rounds:
    - its ChoiceSet picks the defense (AC, Fortitude, Reflex or Will saves);
    - the row's status bonus (+1, +2 or +3, none on a critical success, one more from 5th rank) applies to that defense against the opponent (`origin:signature:…`).
  - **One action:** the bonus is behind a toggle the caster switches on when the opponent uses the action it focused on.
  - **Three actions:** the one change of defense is a note on the Effect.
  - The check requires each row's bonus, the time and the sentences the compiler read (`basic-save-core.js`).

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 31 | Batch 32 |
| --- | --- | --- |
| Effect (action versions) | 63 | 64 |
| Not enabled | 39 | 38 |

Resolved: 187 of 227.

## Tests

`test/third-party-batch-32.test.js` (1). All 1,750 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-32-live-results.json), case `thirdPartyBatch32`, in the `pftest` world. The attacks were rolled for real; the AC is the one in PF2e's attack-roll message.

| Step | Result |
| --- | --- |
| Rank 2, two actions, AC, the foe fails | +2 status to AC against the foe |
| The foe's Strike on the caster | AC 20 before, 22 after |
| Another creature's Strike | 18 before and after (its own baseline) |
| Rank 5, Will, the foe succeeds | +2 (+1 from 5th rank) |
| The foe's Daze on the caster | Will modifier 10 → 12 |
