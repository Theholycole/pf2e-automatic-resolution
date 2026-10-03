# Rank 5 batch 12 — Lightning Storm

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Lightning Storm (5) | The bolt: a basic Reflex save, 4d12 electricity (+1d12 per 2 ranks), for the creatures in its line, which the caster targets. The card's Sustain button calls another bolt once a round while the spell lasts (1 minute: up to 11 bolts). The card's notes cover placing the cloud, the vertical line, and two clouds outdoors (still one bolt a turn). |

## Rules

- **Sustain bolts (`sustain-bolt.js`, `compile-ability.js`):** the four sentences are read together:
  - the cloud and its one bolt;
  - "The bolt is a vertical line …, dealing NdM type damage to creatures in the line (basic X save).", which must be the item's damage and save;
  - "On subsequent rounds, the first time you Sustain the Spell each round, you can call another … bolt within the area.";
  - the outdoors sentence.
- **How it runs:** the item's basic save is repeated from the card on each Sustain (the `repeatable` window `sustain`, as Spectral Blade), for the spell's minutes × 10 + 1 bolts.
- **The card:** a save spell's Sustain button reads "Sustain: Again"; an attack still reads "Sustain: Attack".

## Tests

1096 pass. `test/rank-5-batch-12.test.js` is new, with a negative case: another Sustain sentence isn't read.

A whole-corpus compile (b426 → b427) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-12-live-results.json), case `rank5Batch12`, in the `pftest` world.
- The plan is supported, with the Sustain window (11 bolts).
- **At 5th:** the cast's failure lost 4d12 (31); the Sustain's critical failure lost double (46 from 23). The card has its notes.
- **At 7th:** 5d12 (35).
- **Cleanup:** fixtures removed.
