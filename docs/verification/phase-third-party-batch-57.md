# Third-party batch 57: Dream Logic

2026-10-07. The fifty-seventh batch of the third-party modules' spells.

## What changed

- **Dream Logic (Oracles+)** (new `dream-table.js`, kind `dream-table`; `effect-runtime.js`):
  - **The save:** each creature in the caster's 30-foot aura when it's cast (or the given targets) attempts the Will save. A willing creature takes a failure.
  - **The table:** a failure rolls 1d4. A critical failure rolls twice and the caster picks between the two results.
  - **The entries:**
    1. Object Fallacy: +1 circumstance to Make a Request and Demoralize until the start of its next turn, with the object-speech note.
    2. Static Time: the creature's timed Effects get 1d4 more rounds.
    3. Untethered To Ground: the module's Effect, a fly Speed equal to the land Speed until the end of its next turn. The compiler checks it against the text.
    4. Warped Energy: until the end of its turn, each of acid, cold, electricity, fire and sonic is replaced by a type rolled from the other four (`DamageAlteration`). Choosing which type is altered when several are dealt is a note.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 56 | Batch 57 |
| --- | --- | --- |
| Effect | 87 | 88 |
| Not enabled | 13 | 12 |

Resolved: 215 of 227.

## Tests

`test/third-party-batch-57.test.js` (1). All 1,777 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-57-live-results.json), case `thirdPartyBatch57`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Failure, rolled 1 | Object Fallacy Effect |
| Failure, rolled 2; its 1-round Effect, Static Time die 3 | That Effect now 4 rounds |
| Critical failure, rolled 3 and 4; the caster picks 3 | Untethered: fly Speed 25 |
| Failure, rolled 4; swap dice 1, 2, 3, 4, 1 | acid → cold, fire → sonic |
| Success | Unaffected |
| Willing | Failure; rolled 1 |
