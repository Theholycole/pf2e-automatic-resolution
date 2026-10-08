# Third-party batch 42: Chorus Made Manifest

2026-10-06. The forty-second batch of the third-party modules' spells: a battle form generated from the text, with its attack as a card option.

## What changed

- **Chorus Made Manifest (Tian Xia+)** (new `swarm-form.js`; user decision 2026-10-01: battle forms without a PF2e Effect are generated from the text):
  - The caster's Effect for 1 minute. The form's rules sit behind a toggle the caster switches as it takes or leaves the form:
    - the animal and swarm traits;
    - resistance 8 to physical damage;
    - weakness 8 to area and to splash damage;
    - low-light vision and a fly Speed of 60 feet.
  - **The Choral Swarm Attack:** a card option that starts its own basic save. The targets are the creatures the GM targets in the 15-foot cone; the save is Fortitude against the text's 4d6 sonic, rolled as a text formula since the spell item has no damage of its own, and a critical failure is also Deafened for 1 round.
  - Squeezing through narrow spaces, being unable to Strike, Dismiss, and keeping mental effects are notes on the Effect.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 41 | Batch 42 |
| --- | --- | --- |
| Effect | 70 | 71 |
| Not enabled | 29 | 28 |

Resolved: 197 of 227.

## Tests

`test/third-party-batch-42.test.js` (1). All 1,760 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-42-live-results.json), case `thirdPartyBatch42`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at rank 6, the form off | No form rules |
| The form on | Animal and swarm; resistance physical 8; weakness area 8 and splash 8; fly 60 |
| The form off again | Gone |
| The Choral Swarm Attack on a foe, critical failure | 4d6 sonic, 10 doubled to 20; Deafened |
