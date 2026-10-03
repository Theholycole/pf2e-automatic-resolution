# Rank 5 batch 63 — Celestial Brand

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Celestial Brand (5) | The target must be unholy (PF2e's trait); otherwise the cast is refused. PF2e's Effect (Spell Effect: Celestial Brand) goes on the caster and on each of its allies on the scene, its TokenMark on the target: a +1 status bonus to attack rolls and skill checks against the target, and for a holy holder 1d4 spirit damage on its damage (more at higher ranks), all PF2e's own rules at the cast rank. The brand lasts its round, tracked in Ongoing spells. The target is then immune to the spell for a minute after it (a second brand is refused). |

## Rules

- **Brand mark (`src/compiler/brand-mark.js`, compiled in `compileSpell`):**
  - It reads the target's trait, the bonus sentence, the holy creature's extra damage, the immunity and the heightening.
  - It proves PF2e's Effect, found by its link's name in the catalog. Exactly four rules: the TokenMark; the bonus against the mark; the holy holder's damage dice against the mark; the heightened step `floor((@item.level - 5) / 2)`. Its duration is the spell's.
- **Runtime (effect kind `brand-mark`):**
  - It checks the trait and the immunity.
  - It makes PF2e's Effect on the caster and each scene ally, its TokenMark set to the target token, at the cast rank.
  - The target's immunity lasts the brand's rounds plus the stated time.
  - Ongoing tracks the brand's Effects.

## Interpretation

"Your allies" are every creature on the scene allied with the caster (PF2e's alliance), so each one holds PF2e's Effect.

## Tests

`test/rank-5-batch-63.test.js` is new. It covers the kind and its data, a bonus PF2e's Effect doesn't give (not read), and other holy dice (not read).

A whole-corpus compile (b609 → b610) changed only Celestial Brand.

## Evidence

[Live evidence](phase-rank-5-batch-63-live-results.json), case `rank5Batch63`, in the `pftest` world, at 5th rank.

| Step | Result |
| --- | --- |
| The brand on an unholy fiend | PF2e's Effect on the caster and the ally, both marking the fiend; the fiend immune. The record holds 7 entries: the caster and every allied token on the shared scene. |
| The ally's Strike at the fiend | Includes the +1 status bonus "Spell Effect: Celestial Brand" |
| A second brand on it | Refused: temporarily immune |
| A creature that isn't unholy | Refused |
| The cast ended | The brand Effects gone; the immunity stays |

**Cleanup:** fixtures removed.
