# Rank 8 batch 15 — group 4, part 1 (lasting states)

2026-10-05. The first four spells of feature group 4 (lasting curses and states). Each save leaves its state as a row note Effect: PF2e's rules where they exist, the module's runtime where it can act, and text for the rest.

| Spell | Now |
| --- | --- |
| Undermine Reality | Quasi-real until the end of its next turn (success), for 1 minute with an end-of-turn Will save that ends it (failure), or unlimited (critical failure). Its skill-check critical successes become successes (PF2e's rule). The module halves its Strike damage, and saves on the module's cards against its spells are a degree better. |
| Fabricated Truth | Up to 5 targets. Failure: believes the statement for 1 week. Critical failure: believes it with unlimited duration. Critical success: the "knows you tried to trick it" note, whispered to the GM. Choosing the statement and the counteract of an earlier casting are GM notes. |
| Cursed Metamorphosis | Success: Sickened 1. Failure: a harmless-animal transformation for 1 minute (keeps its mind), with its own Will save to end it after a turn of concentrating. Critical failure: transformed body and mind, unlimited. |
| Remake Physiology | 1 round, 1 minute or permanent: −20 status to all Speeds, Clumsy 1, Drained 1, Enfeebled 1, Stupefied 1 and Dazzled (PF2e's rules), and a DC 5 flat check as each turn starts (Slowed 1 for the round on a failure). |

New runtime:

- **Note flags:** `halfStrikes` (Strike damage only), `sourceSavesBetter` (the module's save cards a degree better against the creature's spells), and `turnStartFlat` (a flat check giving a condition for the round).
- **Lifecycle:** spells whose duration "varies" take each row note's time (the outcome lifecycle).

Interpretations are logged in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-8-batch-15.test.js` is new. A whole-corpus compile (b780 → b781) changed only these four spells.

## Evidence

[Live evidence](phase-rank-8-batch-15-live-results.json), case `rank8Batch15`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Undermine Reality: a failure | Quasi-real (the skill-check rule, the end-of-turn Will save) |
| Its Strike for 20, its spell for 20 | 10 and 20 |
| A save card it casts | Its target's degree adjustment applies |
| Fabricated Truth: a failure and a critical success | Believes for 7 days; the knowing whispered |
| Cursed Metamorphosis: a success and a failure | Sickened 1; transformed for 10 rounds with the Will save to end it |
| Remake Physiology: a failure; its flat check forced to fail | −20 Speeds, the five conditions, 10 rounds; Slowed 1 as its turn starts |
| A real NPC Strike's damage message | Carries `item:type:melee`, which the halving reads |
