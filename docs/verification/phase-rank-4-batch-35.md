# Rank 4 batch 35 — Dust Storm

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Dust Storm (4) | A placed 20-foot burst for 1 minute with Mist's concealment. A creature entering the area, or starting its turn there, takes 1d6 slashing damage (+1d6 per 2 ranks). Creatures with the water trait take double. GM notes cover the unbreathable air and liquid creatures. |

## Rules

- **Borrowed obscuring (`borrowed-spell.js`):** "The X obscures vision, with the effect of @UUID[…]{Mist}." on a no-save area is now read. When Mist's own text compiles as a concealing area, the sentence becomes that concealment rule (`rewriteBorrowedObscure`).
- **Concealing area hazard (`concealing-area.js`):** the compiler now reads:
  - "Creatures entering or starting their turn in the X take NdM type damage." It must match the item's one damage entry.
  - The Heightened damage step.
  - "Creatures that have the X trait or that are made primarily of liquid take double damage." The trait is automatic; liquid creatures are a note.
  - The unbreathable-air sentence, as a note.
- **Runtime:** `startCloud` takes `hazardDamage`, with the events enter and turn-start. `applyHazardDamage` doubles the roll for the trait (PF2e's `alter`) and says so in the chat card.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-35.test.js` is new. Its negative cases:
- without Mist's source, the borrowed concealment isn't read;
- damage that differs from the item's is refused.

A whole-corpus compile (b443 → b444) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-35-live-results.json), case `rank4Batch35`, in the `pftest` world, cast at 6th rank.
- The creature inside became Concealed. The GM notes were posted.
- A water-trait creature entered and took 2 × 2d6 = 16. The chat card says the damage was doubled for the water trait.
- In combat, a creature starting its turn inside took 2d6 = 3.
- **Cleanup:** fixtures removed.
