# Rank 3 batch 46 — Elemental Annihilation Wave

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Elemental Annihilation Wave (3) | **2 actions:** a 30-foot cone, 1d6 fire and 3d6 bludgeoning, basic Reflex save. **3 actions:** the same written out as four rows: failure is pushed 5 feet; critical failure is pushed 10 feet and knocked Prone. The pushes grow by 5 / 10 feet per 2 ranks. Damage grows by the text's 1d6 fire and 3d6 bludgeoning per 2 ranks; PF2e's item says 1d6 bludgeoning, so the card adds the rest. The trait option is a card note. The two-round variant isn't automated. |

## Rules

- **Push variant (`action-paragraphs.js` `rewriteBasicPushVariant`):** it reads the variant's basic damage sentence, the trait option "You can replace the air trait with the metal and wood traits …" (the spell must have the trait), and the 3-action push rider.
  - It also reads the Heightened entry: "The damage increases by …, and the distance that enemies are pushed back … increases by 5 feet on a failed save and 10 feet on a critical failure."
  - Without a push, the basic save stays as it is. With one, the four rows carry the pushes, and each push row gets its own heightening step.
- **Heightening correction:** a text step larger than PF2e's step for a damage type (same die, same interval) becomes `sharedDamage.heighteningCorrection`.
  - It is validated in `basic-save-core.js`.
  - At runtime the card adds the missing dice of that type to PF2e's roll at the cast rank. A smaller text step refuses.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-46.test.js` is new and covers the 2- and 3-action variants and the correction. Its negative case is a trait the spell doesn't have.

A whole-corpus compile (b453 → b455) changed no base plan; this spell's 2- and 3-action variant plans now resolve.

## Evidence

[Live evidence](phase-rank-3-batch-46-live-results.json), case `rank3Batch46`, in the `pftest` world: the 3-action variant at 5th rank.
- The save was Reflex, and the damage was 2d6 fire + 6d6 bludgeoning (the correction applied) = 23.

| Result | Damage taken | Push | Prone |
| --- | --- | --- | --- |
| Failure | 23 | 10 feet | no |
| Critical failure | 46 | 20 feet | yes |

The card shows the trait note.

**Cleanup:** fixtures removed.
