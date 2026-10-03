# Rank 4 batch 31 — Rebounding Barrier

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Rebounding Barrier (4) | A reaction to being hit by a physical Strike. The caster picks the Strike's physical damage type. An Effect gives resistance 10 (+2 a rank) to that type, removed by the Strike's damage or at the end of the turn. The attacker (targeted) takes 5 damage (+1 a rank) of that type now, through PF2e's damage application. |

## Rules

- **Rebound barrier (`damage-reactions.js` `compileReboundBarrier`, kind `rebound-barrier`):** the sentences read are:
  - "Trigger You are hit by a physical Strike.";
  - "You gain resistance N against one physical damage type the triggering attack deals.";
  - "Your attacker takes N damage of the same type.";
  - "Heightened (+1) The resistance increases by 2. Damage dealt to your attacker increases by 1.".
  One opening sentence of narration is allowed, with no numbers or links. `reboundAt` gives the values at a rank.
- **Runtime (`effect-runtime.js`):** the Effect uses the existing consume-on-damage-taken path (as Interposing Earth).

## Tests

1101 pass. `test/rank-4-batch-31.test.js` is new, with a negative case: another rebound rule isn't read.

A whole-corpus compile (b431 → b432) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-31-live-results.json), case `rank4Batch31`, in the `pftest` world, at 5th.
- Against a slashing Strike: resistance 12 to slashing, and the attacker lost 6.
- The Strike's 20 slashing then cost the caster 8, and removed the Effect.
- **Cleanup:** fixtures removed.
