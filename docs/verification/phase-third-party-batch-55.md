# Third-party batch 55: Famed Figure

2026-10-07. The fifty-fifth batch of the third-party modules' spells.

## What changed

- **Famed Figure (Witches+)** (`illusory-creature.js`, new `compileFamedFigure`, kind `illusory-creature`; `effect-runtime.js`):
  - Illusory Creature's token, record and card, read from this spell's own text:
    - Medium or smaller, one size more per rank, up to Gargantuan;
    - the image ends more than 30 feet from the caster;
    - AC is the spell DC and saves are the spell DC − 10;
    - the image ends when hit or when it fails a save.
  - **Strikes:** melee (1+rank)d4 mental, and a ranged Strike of rank d4 mental within 30 feet of the image (`data-act="ranged"`). Both are nonlethal.
  - The multiple attack penalty is asked for each Strike (`illusoryAct` takes `map`). Illusory Creature itself is unchanged: no penalty is asked.
  - Casting it again ends the caster's earlier image ("or you Cast this spell again, the spell ends").
  - The voice, the GM-judged checks, resistances, and the recovery when the spell ends while observed are notes.
- **Illusory Creature's live case** (`rank2Batch78`): its fixed 2-second waits for the image's end are now polls. In the crowded test world each reconcile resets 231 actors (~0.6 s), so the end lands a little later. The case passes.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 54 | Batch 55 |
| --- | --- | --- |
| Effect | 85 | 86 |
| Not enabled | 15 | 14 |

Resolved: 213 of 227.

## Tests

`test/third-party-batch-55.test.js` (1). All 1,775 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-55-live-results.json), case `thirdPartyBatch55`, in the `pftest` world. It also holds a re-run of `rank2Batch78`, which passed.

| Step | Result |
| --- | --- |
| Cast at 2nd: a Medium image | Card with Strike, ranged Strike and Disbelieve |
| Melee Strike, no penalty | `3d4` mental |
| Ranged Strike, −5 | `2d4` mental |
| Cast again | The first image's token gone, its record ended; the second image there |
