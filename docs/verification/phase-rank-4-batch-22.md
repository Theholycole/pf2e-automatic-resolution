# Rank 4 batch 22 — Elephant Form, Swarm Form

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Elephant Form (4) | PF2e's Spell Effect: Elephant Form (its battle form: Large, Huge at 5th, Gargantuan at 7th, with the foot, trunk and tusk Strikes). The Grabbing Trunk ability, including its Grapple sentence, is the form's own Note on a trunk hit. |
| Swarm Form (4) | PF2e's Spell Effect: Swarm Form (the swarm trait, resistance 5 to slashing and piercing, weakness 5 to area and splash damage, +5 per 2 ranks). The crawl action gets its own card with a button: target the creature, and it rolls a Fortitude save against the spell DC. A failure makes it Sickened 1, a critical failure Sickened 2. The button works while the Effect lasts. |

## Rules

- **Battle-form ability Notes (`direct-effect-resolution-compiler.js`):** an action link (Grapple) inside a `<strong>Name</strong>` paragraph is covered when PF2e's battle form has a Note titled `PF2E.BattleForm.Note.<Name>.Title`. PF2e's form shows the ability's text on the hit.
- **Granted save actions (`granted-save-action.js`):** "you can … as a single action. That creature must attempt a <save> save against your spell DC or become <condition N> (<condition M> on a critical failure)." The Effect is proved without these two sentences. The action is compiled as its own non-basic save on 1 creature: success unaffected, failure N, critical failure M. Casting posts a card with a button per action (`grantedAction`). The button needs one targeted creature and is refused once the spell's Effect is gone.

## Tests

1082 pass. `test/rank-4-batch-22.test.js` is new, with negative cases: without PF2e's Note, Elephant Form isn't automatic; a save sentence worded differently isn't read as an action.

A whole-corpus compile (b413 → b414) changed only these two.

## Evidence

[Live evidence](phase-rank-4-batch-22-live-results.json), case `rank4Batch22`, in the `pftest` world, cast by characters (PF2e's battle form applies only to characters).
- Elephant Form at 5th: the caster became Huge with 20 temporary HP, and the form has the trunk Note.
- Swarm Form at 6th: slashing resistance 10. The crawl button's save, set to a critical failure, made the target Sickened 2. After the Effect was deleted, the button was refused ("Swarm Form has ended.").
- **Cleanup:** fixtures removed.
