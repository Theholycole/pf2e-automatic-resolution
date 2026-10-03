# Rank 5 batch 65 — Spellmaster's Ward

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Spellmaster's Ward (5) | The actions spent (asked when cast) set the runes: 1, 2 or 3. They sit on the caster's Effect for the sustained spell (Ongoing's Sustain, up to its minute). When a spell damages the caster (PF2e's damage-taken message, its origin a spell), runes are spent one at a time. Each restores its roll of 2d6 + (rank − 5) until that damage is gone or the runes are. The Effect shows the runes left, and the last rune ends it. Damage that isn't a spell's spends nothing. |

## Rules

- **Rune ward (`src/compiler/rune-ward.js`, compiled in `compileSpell`):** it reads the runes per action, the prevention formula (its base rank checked), the spending rule and the heightening (already in the formula's rank).
- **Runtime:**
  - **New effect kind:** `rune-ward`. It makes the caster's Effect with its runes and the formula at the cast rank, on a sustained native Ongoing record.
  - **`runeWardOnDamage` (`climb-aid-runtime.js`, on each chat message):** for a spell's damage-taken message, it rolls a rune at a time against the Hit Points (and temporary Hit Points) lost, and restores the prevented amount to Hit Points. It then updates or ends the Effect.

## Interpretation

"Prevent … of that spell's damage" happens after PF2e applies the damage: the prevented amount is restored right away.

## Tests

`test/rank-5-batch-65.test.js` is new. It covers the kind's data, and another formula (not read).

A whole-corpus compile (b615 → b616) changed only Spellmaster's Ward.

## Evidence

[Live evidence](phase-rank-5-batch-65-live-results.json), case `rank5Batch65`, in the `pftest` world, at 6th rank (caster level 11).

| Step | Result |
| --- | --- |
| 2 actions | "(2 runes)", formula 2d6 + (6 − 5) |
| 30 fire damage from Fireball | 2 runes (11 and 7) prevent 18; Hit Points 188 (200 − 30 + 18); the Effect gone |
| 3 actions, then 10 slashing not from a spell | Hit Points 190; 3 runes kept |

**Cleanup:** fixtures removed.
