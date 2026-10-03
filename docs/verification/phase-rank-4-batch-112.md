# Rank 4 batch 112 — Ghostly Tragedy

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Ghostly Tragedy (4) | The caster gets an Effect for the scene's 10 minutes, carrying the reenactment's notes. Its control *The scene ends* asks the GM how many ghostly apparitions took part. The caster then takes 2d6 void damage per apparition (PF2e's damage, with IWR), and the Effect is removed. The investigation is a note. |

## Rules

- **`src/compiler/scene-cost.js`:** reads the cost sentence and the observers' sentence.
  - The narration must state no rules.
  - The spell must have no item damage, no save and no target.
- **Runtime:**
  - The new kind `scene-cost`.
  - `sceneEnd` is the GM's: it asks the count (or takes `count`), rolls `(2×count)d6`, applies it, and removes the Effect.

## Interpretation

- **The number of apparitions is the GM's.** The card shows the text's "typically" as a guide.
- **The 60-foot area is the scene's place.** It is a note; nothing in it is resolved.

## Tests

`test/rank-4-batch-112.test.js` is new. It covers the data, the notes, and a rule in the narration (not read).

A whole-corpus compile (b651 → b652) changed only Ghostly Tragedy.

## Evidence

[Live evidence](phase-rank-4-batch-112-live-results.json), case `rank4Batch112`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast | The Effect lasts 10 minutes and carries the notes |
| Scene ends with 3 apparitions | 6d6 void; the caster lost 22 HP, the same as the damage; the Effect is removed |

**Cleanup:** fixtures removed.
