# Rank 5 batch 49 — Whispers of a Dead Goddess

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Whispers of a Dead Goddess (5) | Will, as a sustained lingering 15-foot burst: creatures in it at the cast, or that enter it, save. Critical success: unaffected and temporarily immune for 1 hour. Success, failure and critical failure: Stunned 1. Failure adds a "Held by the whispers" note for 1 round (it won't voluntarily leave). Critical failure also adds a "Whispered suggestion" note for the sustained minute (the caster whispers a course of action with suggestion's effects; it ends if the spell stops or the creature leaves). A card reminder leaves out creatures that can't hear. |

## Rules

- **Dead whispers (`src/compiler/dead-whispers.js`):**
  - It reads the lead, the four rows and the sustained duration.
  - The preamble becomes the lingering trigger; the critical success becomes the existing row immunity; Stunned applies by condition.
  - The hold and suggestion are notes.
- **Interpretation:** the suggestion and staying put are GM-played. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-49.test.js` is new. Its negative case is another hold wording (not read).

A whole-corpus compile (b552 → b553) changed only Whispers of a Dead Goddess.

## Evidence

[Live evidence](phase-rank-5-batch-49-live-results.json), case `rank5Batch49`, in the `pftest` world, at 5th rank, in an empty corner of the scene.

| Result | Stunned | Immune | Notes |
| --- | --- | --- | --- |
| Critical success | — | yes | — |
| Failure | 1 | — | Held by the whispers, 1 round |
| Critical failure | 1 | — | Held (1 round), Whispered suggestion (1 minute) |

**Cleanup:** fixtures removed.
