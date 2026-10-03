# Rank 4 batch 24 — Retributive Pain, Conjured Clockwork

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Retributive Pain (4) | The triggering creature's basic Fortitude save. The damage is half the caster's last damage taken, rounded down, as mental damage. The card reads that amount when it's made. A caster with no recorded damage is refused. |
| Conjured Clockwork (4) | A sustained placed 10-foot burst: difficult terrain, and 2d8 slashing (basic Reflex) to each creature that enters it or ends its turn in it, once per turn. After each round's Sustain, an Ongoing control expands the region by 5 feet, once that round. |

## Rules

- **Triggered damage (`text-damage.js`, kind `save`):** "Trigger A creature in range damages you." with "The target takes <type> damage equal to half the triggering damage." on a reaction targeting "the triggering creature". This is read as text damage with `triggeredDamage` ({fraction 0.5, type, source `caster-last-damage`}). The validator checks that shape. The save card replaces the `0[type]` placeholder with half of PF2e's `damageTaken` last recorded for the caster, or `options.triggeringDamage`.
- **Optional Sustain growth (`lingering-area-compiler.js`, `isOptionalExpansion`):** "On subsequent rounds, the first time you Sustain the spell each round, you can expand the radius of the … by N feet." is read on a sustained placed burst. The record's control (`expand-area`) grows the region once a round, and only after that round's Sustain. Mandatory growth (Wildfire) now uses the same `growRegion` helper.

## Tests

1086 pass. `test/rank-4-batch-24.test.js` is new, with negative cases: another fraction ("twice") and other growth wording aren't read.

A whole-corpus compile (b415 → b416) changed only these two.

## Evidence

[Live evidence](phase-rank-4-batch-24-live-results.json), case `rank4Batch24`, in the `pftest` world.
- Retributive Pain: refused before the caster took damage. After 21 damage, the attacker's failed save cost it 10 HP (`10[mental]`).
- Conjured Clockwork: the region has difficult terrain. Expanding was refused before the Sustain; after it the radius went from 10 to 15 feet; a second expand that round was refused.
- **Regression check:** Wildfire (`cr1Batch105`) still passes with the shared helper.
- **Cleanup:** fixtures removed.
