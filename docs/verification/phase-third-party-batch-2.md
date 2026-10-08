# Third-party batch 2: frightened held, the caster's features, a plural immunity

2026-10-06. The second batch of the third-party modules' spells.

## What changed

- **Residual Bad Luck (Clerics+).**
  - Text: "If the target fails an attack roll or skill check before the end of their next turn, they do not reduce their frightened condition by 1 at the end of their turn."
  - At the table: on the failing rows, a note Effect watches the creature's checks (`conditionHold`).
  - After a failed attack roll or skill check, its frightened is put back to that value once PF2e's end-of-turn reduction settles (`scripts/note-watchers.js`, on `pf2e.endTurn`).
- **Wreak Havok (Magus+)** (`src/compiler/basic-feature-riders.js`):
  - **The damage type.** "The damage dealt by this spell is the same type as your Arcane Cascade." The untyped damage takes the caster's Arcane Cascade stance choice, or force (the stance's own) when none is chosen, before it's rolled.
  - **The area.** "Creatures in a 5-foot emanation, 10-foot cone, or 15-foot line of you take 2d4 damage." This is the caster's choice of area, shown to the GM.
  - **Off-guard.** "Creatures that fail their save are Off-Guard to you until the beginning of your next turn." The failing creatures get a –2 circumstance penalty to AC (PF2e's off-guard slug) only against the caster's attacks (`origin:signature:` of the caster), until the caster's next turn.
- **Creature's Howl (Oracles+)** (`src/compiler/save-preamble.js`):
  - "All enemies in the area that can hear your howl must attempt a Will save. Regardless of their result, they become temporarily immune for 1 minute."
  - The plural subject is read for the temporary immunity, and the hearing qualifier is the GM's question per creature.

PF2e's own spells are unchanged: 0 of 1,994 plans differ from before this batch.

## Census

| Route | Batch 1 | Batch 2 |
| --- | --- | --- |
| Save | 10 | 13 |
| Not enabled | 114 | 111 |

## Tests

`test/third-party-batch-2.test.js` (5) covers:

- the older link forms;
- Personal Blizzard+'s heightening;
- Residual Bad Luck's note;
- Wreak Havok's three rules;
- Creature's Howl's immunity.

## Evidence

[Live evidence](phase-third-party-batch-2-live-results.json), case `thirdPartyBatch2`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Residual Bad Luck, failure | Frightened 1 and its note. The foe fails an Athletics check; its turn ends and it's still Frightened 1 |
| Wreak Havok, failure, the caster in no stance | "2d4 force"; the off-guard rule predicated on the caster's signature |
| Creature's Howl, failure (the GM answers that it can hear) | Frightened 2; immune for 1 minute |
