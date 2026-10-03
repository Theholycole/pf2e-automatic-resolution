# Cantrip / rank 1 batch 39 — Weapon Surge

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “On your next Strike with that weapon before the start of your next turn, you gain a +1 status bonus to the attack roll and the weapon deals an additional 1d6 spirit damage, and the Strike gains the sanctified trait.”: proved by PF2e's Effect. The bonus is on the chosen weapon's attack, 1d6 spirit (2d6 at 5th, 3d6 at 9th through its rank formula) on its damage, and sanctified added to that weapon's Strikes | Weapon Surge (1) |
| Target “1 weapon you're wielding”: the Effect goes on the caster, and PF2e's prompt picks the weapon | Weapon Surge |
| “Weapon surge ends once you complete this Strike or the weapon leaves your possession.”: a **PF2e data** note on the card. PF2e's Effect covers every Strike with the weapon until the start of your next turn, so the GM removes it after the first (the data-vs-text policy) | Weapon Surge |

The old `weapon-runes` blocker was a false match: “a +1 status bonus to the attack roll and the weapon”.

**Kept strict (tests):** another die, bonus value or trait isn't proved. The route then falls to guided, with the gaps pending.

## Coverage

**Census:** **521 enabled**, up from 520.
- The b122 corpus diff against b121 changed only Weapon Surge.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 589/589 tests pass (`test/cantrip-rank-1-batch-39.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-39-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch39`:
- **Prompt:** the caster held a Club and a Longsword. PF2e's prompt offered both, and the harness picked the Longsword.
- **Longsword:** a +1 status attack modifier and a 1d6 spirit damage-dice synthetic. The Club got neither.
- **Effect:** lasts 1 round to the start of a turn, and the card had the data note.

The first attempt failed on the harness, which read NPC Strikes (not built from weapon items); it now reads PF2e's rule synthetics.

**Regressions:** `cr1Batch2` (Runic Weapon and the other weapon Effects) passed in the same session. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b122
node tools/diff-compiled-plans.mjs /tmp/phase23-b121/official-spell-compiler-report.json /tmp/phase23-b122/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b122/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch39`, then `cleanup`.
