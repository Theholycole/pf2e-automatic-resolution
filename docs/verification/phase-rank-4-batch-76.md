# Rank 4 batch 76 — Roar of the Dragon

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Roar of the Dragon (4, focus) | Will, for enemies in the area other than dragons (dragons are left out automatically; a card reminder leaves dragon-tied creatures to the GM). The rows give Frightened 1, 2 or 3, with Fleeing for 1 round on a critical failure. PF2e's "Spell Effect: Roar of the Dragon" goes on the caster once per cast, for 10 minutes. Its +2 circumstance bonus to Diplomacy against dragons is gated on an option nothing in PF2e sets, so the module adds a toggle ("against a dragon that was in the area") for the caster to switch on. |

## Rules

- **Dragon roar (`src/compiler/dragon-roar.js`):**
  - It reads the grant sentence, the Effect link, the dragon-ties sentences and the "all enemies other than dragons" sentence.
  - It checks that PF2e's Effect states exactly that bonus (skill, type, value, trait, 10 minutes); the area option is read from the Effect's own predicate, not the spell's name.
- **Caster Effect of the cast:**
  - `casterRowEffect` with `kind: "cast"` covers every result. Its matcher is in `caster-row-effect.js`, and the validator accepts the shape only with this evidence.
  - The runtime adds the toggle `RollOption` to the created Effect, and the card's line reads accordingly.
- **Targeting:** an enemy of the caster without the dragon trait.
- **Interpretation:** the added toggle supplies the option PF2e's Effect expects but never sets. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-76.test.js` is new. Its negative cases are:

- a mismatched bonus (refused by the matcher);
- a +3 text (not read).

A whole-corpus compile (b538 → b539) changed only Roar of the Dragon.

## Evidence

[Live evidence](phase-rank-4-batch-76-live-results.json), case `rank4Batch76`, in the `pftest` world, at 4th rank (caster level 7).

| Creature | Eligible | Result |
| --- | --- | --- |
| Enemy (success) | yes | Frightened 1 |
| Enemy (failure) | yes | Frightened 2 |
| Enemy (critical failure) | yes | Frightened 3, Fleeing |
| Dragon | no | — |

The caster's Effect lasted 10 minutes. Its option was absent before the toggle and present after.

**Cleanup:** fixtures removed.
