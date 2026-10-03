# Rank 3 batch 35 — Threatening Mimicry

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Threatening Mimicry (3) | Each non-allied creature in the 10-foot emanation saves (Will). Success, failure and critical failure give Frightened 1, 2 and 3. Each also gets a note Effect while it's frightened: its Frightened doesn't decrease at the end of a turn in which it damaged the caster (the GM keeps the value). The caster and its allies are left out. |

## Rules

- **Non-allied targets (`target-predicate-compiler.js`, `basic-save-core.js`, `validate-plan.js`):** "Each non-allied creature in the area must attempt …" gives the predicate `non-ally-of-caster`. The caster and creatures of the caster's PF2e alliance are ineligible. Neutral creatures are eligible without a question (unlike "enemy").
- **Fear kept (`compile-ability.js`):** "This condition doesn't decrease at the end of its turn if it damaged you during that turn." is read on rows with Frightened, its own or inherited through "As success, but …". It gives a note tied to the row's Frightened, like Friends to Foes' "fear of allies".

## Tests

1089 pass. `test/rank-3-batch-35.test.js` is new, with a negative case: another decrement condition isn't read.

A whole-corpus compile (b418 → b419) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-35-live-results.json), case `rank3Batch35`, in the `pftest` world.
- The caster's ally (alliance party) was ineligible: "an ally of the caster".
- The foe's save, set to a failure, gave Frightened 2 and the fear-kept note.
- **Cleanup:** fixtures removed.
