# Rank 4 batch 40 — Confront Selves

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Confront Selves (4) | One target takes 4d6 mental damage (+1d6 per rank), Will save, written out as the basic save's rows. On every result except a critical success it is also Clumsy 1 until the start of the caster's next turn. The card repeats it on each Sustain for 1 minute. A note says a critical success ends the spell. |

## Rules

- **Sustain single (`sustain-bolt.js` `extractSustainSingle`):** it reads "When you Cast or Sustain this Spell, …" (narration), "They take NdM T damage (basic X save) and are C until the beginning of your next turn.", "On a critical success, the spell ends." and the Heightened step.
  - The result is four rows (the condition until the start of the caster's next turn, except on a critical success), in the sustain-bolt family's repeatable form.
  - The sustain-bolt branch now accepts written-out rows: the save is no longer basic.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-40.test.js` is new. Its negative case is the text without the critical-success sentence.

A whole-corpus compile (b459 → b460) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-40-live-results.json), case `rank4Batch40`, in the `pftest` world. The caster's level was set per cast, since a focus spell heightens to half the caster's level.

| Cast | Result | Damage taken | Clumsy |
| --- | --- | --- | --- |
| At cast (4th) | failure | 4d6 mental = 14 | 1, expiring at turn start |
| Sustain repeat | critical success | 0 | none |
| At 6th | failure | 6d6 = 29 | 1 |

The card shows the critical-success note.

**Cleanup:** fixtures removed.
