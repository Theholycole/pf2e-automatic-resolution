# Rank 4 batch 129 — Replicate

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Replicate (4) | **Who can be copied:** the targeted creature, at most level 8 (+2 per rank). An unconscious creature qualifies; otherwise the caster confirms it's willing. **The double** (user decisions 2026-10-01: conjured creatures are tokens; minions are owned by the caster): a token beside the target, copying its actor with a quarter of its Hit Points. It has the minion trait and the caster's ownership and alliance. **Duration:** while the caster Sustains (10 minutes), through the caster's summon Effect, which removes the double when it ends. **0 HP:** the double reaching 0 HP ends the spell. **Notes:** its basic-tasks-only limit, telepathic commands, shared senses and missing item bonuses. |

## Rules

- **`src/compiler/replica.js`:** reads the target line, the opening, the minion, statistics and 0 HP sentences, the five notes and the Heightened entry. `replicaMaxLevel` gives the level limit at a rank.
- **Runtime:**
  - **New kind `replica`:** an NPC's maximum HP is set directly; a character's goes through a Hit Point FlatModifier.
  - **Cleanup:** the summon Effect's existing cleanup removes the double.
  - **`main.js`:** an `updateActor` hook ends the spell when a double with `endsAtZero` reaches 0 HP.

## Interpretation

- **"One quarter of the original's Hit Points"** is a quarter of its maximum. The double starts at that maximum.
- **The item bonuses it lacks** are the GM's to leave out (a note): PF2e's copy can't tell them apart on an NPC.
- **"Willing"** is the caster's confirmation. An unconscious creature needs none.

## Tests

`test/rank-4-batch-129.test.js` is new. It covers the data, the level limit by rank, the notes, and a different HP share (not read).

A whole-corpus compile (b668 → b669) changed only Replicate.

## Evidence

[Live evidence](phase-rank-4-batch-129-live-results.json), case `rank4Batch129`, in the `pftest` world, cast at 4th rank.

| Step | Result |
| --- | --- |
| A level-9 target | Refused (above level 8) |
| A willing ally with 40 HP | The double has 10/10 HP, the minion trait, a token, and the caster's Effect |
| The double at 0 HP | The Effect and the double are gone |

**Cleanup:** fixtures removed.
