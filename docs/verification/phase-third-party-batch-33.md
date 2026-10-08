# Third-party batch 33: Discern Secrets+

2026-10-06. The thirty-third batch of the third-party modules' spells: a choice between a check bonus and stripping a creature's concealment.

## What changed

- **Discern Secrets+ (Witches+)** (`stated-effect.js` `secrets`; `effect-runtime.js`):
  - The caster chooses one of two uses, while the spell is sustained:
    - **Secrets:** +1 status bonus on the targets' Recall Knowledge, Seek and Sense Motive rolls, as PF2e's own Discern Secrets Effect reads the sentence.
    - **Concealment:** each target's Concealed is removed. A Concealed an Effect grants stays, and the card offers the GM's counteract (the existing button).
  - One target, two from 5th rank (`maxTargets`, checked when cast).
  - The module's links name three Effects PF2e no longer has. The Effect is built from the text, and the reader claims the dead links (`ignoresLinks`).

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 32 | Batch 33 |
| --- | --- | --- |
| Effect | 64 | 65 |
| Not enabled | 38 | 37 |

Resolved: 188 of 227.

## Tests

`test/third-party-batch-33.test.js` (1). All 1,751 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-33-live-results.json), case `thirdPartyBatch33`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Rank 1, secrets on an ally | A sustained Effect; its Seek roll's modifier 0 → 1; a plain Perception roll still 0 |
| Rank 1, two targets | Refused: at most 1 target |
| Rank 5, concealment on two foes | The plain Concealed removed; the Effect-granted one kept, with the counteract button |
