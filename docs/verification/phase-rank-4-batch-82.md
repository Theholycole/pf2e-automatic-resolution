# Rank 4 batch 82 — Waking Dream

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Waking Dream (4, focus) | Will, sustained up to 1 minute. Success: a "Dream visions" note for 1 round (all other creatures are Concealed to it). A card reminder says the caster can't Sustain the spell then. Failure: Confused for the spell's duration, ending early when its end-of-turn Will save succeeds. Critical failure: Confused for the spell's duration with no save. Both failing rows also get a note: it may attack thin air, and others are Concealed to it for a round after the confusion ends. |

## Rules

- **Waking visions (`src/compiler/waking-visions.js`):**
  - It reads the lead and the rows, and rewrites the failing rows as "Confused for the spell's duration" (the failure keeps its save sentence).
  - The success's concealment becomes a note rather than a condition: PF2e's Concealed on the target would be the reverse of the text.
- **A recurring save on a spell-lifetime condition:**
  - `recurring-save-lifetime.js` attaches an "end" save to a condition that ends with the spell.
  - `isRecurringSaveLifetime` accepts that combination. The ternary was checked so an "end" save on a spell lifetime needs no fixed timer.
  - The corpus compile changed only this spell.

## Tests

`test/rank-4-batch-82.test.js` is new. Its negative case is another save timing (not read).

A whole-corpus compile (b558 → b559) changed only Waking Dream.

## Evidence

[Live evidence](phase-rank-4-batch-82-live-results.json), case `rank4Batch82`, in the `pftest` world, at 4th rank (caster level 7), in combat.

| Result | Confused | Note | After the target's turn |
| --- | --- | --- | --- |
| Failure | yes | 1 minute | its Will save (success) ended the confusion |
| Critical failure | yes | 1 minute | still Confused |
| Success | — | 1 round | — |

**Cleanup:** fixtures removed.
