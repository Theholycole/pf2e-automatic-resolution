# Rank 4 batch 114 — Safeguard Secret

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Safeguard Secret (4) | The caster and any number of targeted willing allies get PF2e's Spell Effect: Safeguard Secret for 1 hour. The text states two bonuses: +4 status to skill checks that conceal the secret, and +4 status to saves against spells or effects that would obtain or force it. PF2e's Effect has the skill bonus, but behind an option it never sets, and no save bonus. The module adds the toggle and the save bonus (same option). Casting it again removes the caster's earlier Effects and notes from every creature. The chosen secret is a note. |

## Rules

- **`src/compiler/effect-note-proof.js`:**
  - **Bonus sentence:** a reader for it, which checks PF2e's FlatModifier and adds the RollOption toggle and the saving-throw FlatModifier.
  - **"If you Cast this Spell again…" sentence:** a reader for it (`replacesPrevious`).
  - **The secret's sentence:** added to the notes.
  - **Splitting:** sentences now split after a closing quotation mark too.
- **`scripts/note-effects.js`:** "you and any number of willing allies" has no target limit.
- **Runtime (effect-note):** with `replacesPrevious`, the caster's earlier Effects and notes of the spell are deleted before the new cast.

## Interpretation

- **The toggle is switched on for a roll the spell covers.** That means concealing the secret, or a save against an effect that seeks it. It is the same one-option toggle for both bonuses.
- **The recipients are the targets.** They are the caster and allies who know the secret.

## Tests

`test/rank-4-batch-114.test.js` is new. It covers the proof's additions, the replacement, the recipient, the unlimited targets, and a different bonus (not proved).

A whole-corpus compile (b653 → b654) changed only Safeguard Secret.

## Evidence

[Live evidence](phase-rank-4-batch-114-live-results.json), case `rank4Batch114`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast on the caster and an ally | Both get the Effect |
| Toggle on | The ally's Deception +4 and Will save +4 |
| Cast again on the caster alone | The ally's Effect is gone; the caster has one Effect and one note |

**Cleanup:** fixtures removed.
