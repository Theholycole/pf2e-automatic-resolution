# Rank 4 batch 8 — Shroud of the Mantis, Life Connection, Divine Dragon's Watch

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Shroud of the Mantis (4) | The caster is Invisible with Invisibility's restrictions as the note: 1 minute, 10 minutes from 6th, 1 hour from 8th. |
| Life Connection (3) | PF2e's Effect on the caster grants the Defend Life reaction. The failsafe, the 1-mile damage sense, one connection per creature, and "once you use the reaction, the spell ends" are notes. |
| Divine Dragon's Watch (5) | PF2e's Effect on the caster grants Dragon's Protection, with its dice raised to the cast rank. The spirit and the embedded action text are notes. |

## Rules

- **`spell-note.js`:** "You wrap yourself in a … that renders you @C, with the same restrictions as a … @S spell." is a caster grant.
- **`effect-note-proof.js`:**
  - "When the spell is cast/complete, you gain the @UUID[action] reaction; once you use the reaction, the spell ends." is PF2e's GrantItem of that action, recipient the caster, plus a note.
  - The other sentences are notes; an embedded action paragraph is a note.
- **Dice step:** "The damage increases by NdM." is checked against a DamageAlteration dice-number upgrade that grows by N each interval.

## Tests

1030 + 2 = 1032 pass. `test/rank-4-batch-8.test.js` is new, with a negative case: a 2d4 step the Effect's dice don't follow is refused.

A whole-corpus compile (b378 → b379) changed only these three.

## Evidence

[Live evidence](phase-rank-4-batch-8-live-results.json), case `rank4Batch8`, in the `pftest` world. It passed on the first run.
- **Shroud of the Mantis at 6th:** the caster was Invisible for 10 minutes.
- **Life Connection:** the caster held the Effect and the Defend Life action.
- **Divine Dragon's Watch at 6th:** the caster held the level-6 Effect and the Dragon's Protection action.
- **Cleanup:** fixtures removed.
