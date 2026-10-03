# Cantrip / rank 1 batch 59 — Precious Gleam

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “On the next successful attack with that weapon during the spell's duration, the attack deals an additional 1d6 precision damage.”: proved by PF2e's `DamageDice` on the chosen weapon at the cast rank | Precious Gleam (1) |
| “You can choose for the metal to become your choice of cold iron, silver, or steel, …”: proved by PF2e's material choice and the `AdjustStrike` adding it to that weapon | Precious Gleam |
| **PF2e data notes:** PF2e's dice apply to every hit until the Effect ends (remove it after the first hit). PF2e doesn't offer steel (pick either option and the GM ignores the material) | Precious Gleam |
| Target “1 weapon that is unattended or wielded by a willing creature.” (a trailing period, now dropped) and duration “until the beginning of your next turn” (read as the start): the Effect goes on the targeted wielder | Precious Gleam |

**Kept strict (tests):**
- Another die (1d8) or damage type (fire) isn't proved.
- A longer duration doesn't put the Effect on the wielder.
- A material list PF2e doesn't match leaves PF2e's choice in place, and the card names the materials it doesn't offer.

**Side fix:** dropping the period changed Split the Tongue's Target text, so its trigger-target match now takes the period as optional. Its plan is unchanged.

## Coverage

**Census:** **541 enabled**, up from 540.
- The b142 corpus diff against b141 changed only Precious Gleam.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 610/610 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-59-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch59`:
- **Recipient:** the Effect went on the targeted ally, not the caster.
- **PF2e's prompts:** the weapon prompt offered Club and Longsword (Longsword was picked). The material prompt offered Cold Iron and Silver (Silver was picked).
- **Rules:** 1d6 precision on the Longsword and none on the Club. PF2e's material adjustment was present.
- **Duration and notes:** 1 round to the start of a turn. Both data notes were on the card.

The first run failed on a harness error: it built PF2e's deferred dice without roll parameters. It now reads the Effect's rule, as Weapon Surge's case does, and was re-run.

**Regressions:** `cr1Batch39` (Weapon Surge) and `rank1Batch1` (Split the Tongue) passed, with cleanup between them. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b142
node tools/diff-compiled-plans.mjs /tmp/phase23-b141/official-spell-compiler-report.json /tmp/phase23-b142/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b142/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch59`, then `cleanup`.
