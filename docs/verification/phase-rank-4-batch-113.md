# Rank 4 batch 113 — Pernicious Poltergeist

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Pernicious Poltergeist (4) | The caster gets a sustained Effect for 1 minute. The card has a button for each listed effect, usable once a round (on the cast, then the first Sustain of each later round). **Deathly Assault:** one targeted creature takes a basic Fortitude save against (4 + ⌊(rank−4)/2⌋)d10 void. **Frighten:** the targeted creatures take a Will save; a failure (or critical failure) leaves them Frightened 2. **Telekinetic Storm:** the targeted creatures take a basic Reflex save against (4 + ⌊(rank−4)/2⌋)d8 force. The poltergeist can't be hurt and is Invisible (a note); it becomes visible on Frighten (a note on the button). |

## Rules

- **`src/compiler/sustain-options.js`:** reads the "when cast and first Sustain" sentence and each listed effect.
  - Each effect has a lead: one creature or all, with damage and a basic save, or a save with a condition on a failure.
  - The narration must state no rules.
  - The Heightened entry must be each damage formula's own step.
- **`compileSpell`:** compiles each effect as a save; the inline formula is the damage (`phaseFormula` evidence, renamed from Pest Swarm's `incarnateFormula`).
- **Runtime:**
  - **New kind `sustain-options`:** the caster's sustained Effect, and the card's buttons.
  - **`sustainOption`:** once per combat round; it refuses a second effect that round.

## Interpretation

- **"Becoming Frightened 2 on a failure"** also covers a critical failure: the text gives no separate critical failure.
- **The targets are the GM's.** "Creatures in the area" means the creatures in the burst, which the GM targets.
- **The first Sustain each round is the button's once-a-round limit.** The Sustain action itself is PF2e's.

## Tests

`test/rank-4-batch-113.test.js` is new. It covers the three effects, their support, the inline formula, the non-basic Frighten, and a Heightened entry that isn't the formulas' step (not read).

A whole-corpus compile (b652 → b653) changed Pernicious Poltergeist, and Pest Swarm's evidence key only (`phaseFormula`).

## Evidence

[Live evidence](phase-rank-4-batch-113-live-results.json), case `rank4Batch113`, in the `pftest` world, cast at 6th rank, in combat.

| Step | Result |
| --- | --- |
| Deathly Assault, failure | 5d10 void |
| A second effect that round | Refused |
| Next round, Frighten, failure | Frightened 2 |
| The round after, Telekinetic Storm | 5d8 force |

**Cleanup:** fixtures and combat removed.
