# Damage-derived consequences — verification

2026-09-25. This batch executes two consequences computed from a cast's own confirmed damage: death when that damage reduces a creature from positive HP to 0, and caster temporary HP or healing derived from the damage dealt. It adds no spell-name or ID dispatch.

## Coverage (5 new shared-save routes)

| Spell | Compiled consequence |
| --- | --- |
| **Vision of Death** | Will save with Frightened/Fleeing outcomes; a creature this spell reduces to 0 HP dies. |
| **Vampiric Feast** | Basic Fortitude; the caster gains temporary HP equal to half the void damage the single target takes (after IWR), lost after 1 minute. |
| **Vampiric Exsanguination** | Basic Fortitude against **living creatures in the area only**; the caster gains temporary HP equal to half the damage taken by the most-damaged creature, lost after 1 minute. |
| **Devour Life** | Basic Fortitude; dies at 0 HP. The caster regains HP equal to half the void damage taken, and any excess becomes temporary HP lost after 1 minute. |
| **All-Encompassing Hunger** | Basic Fortitude; if the creature is reduced to 0 HP it dies, and only then does the caster gain temporary HP equal to the damage dealt, lasting 1 minute. |

The [family audit](../../reports/phase-spell-batches/damage-derived-family-audit.md) covers **47 unique members**:

| Family | Members | Executable shared saves |
| --- | ---: | ---: |
| Death or destruction at 0 HP | 18 | 2 |
| Caster healing or temporary HP | 30 | 4 |
| Area damage to living creatures only | 4 | 2 |

The rest stay blocked by their own rules:
- **Drain Life:** a blood-magic interaction and the HP-lost cap.
- **Soul Siphon:** HP lost to Drained.
- **Life-Draining Roots:** 1d4 temporary HP per living creature.
- **Vampiric Revelry:** action variants.
- **Massacre, Love's Sacrifice, Seal Fate:** level thresholds and choices.

## Safety corrections

- **Caster benefits in save preambles:** these were never checked. Soul Siphon, Fallow Field and Vampiric Maiden had caster healing or temporary-HP rules that the preamble checker ignored. `preamble:caster-benefit` now blocks any such sentence unless the compiled benefit claims it exactly.
- **Area recipients:** “deal X damage to living creatures in the area” (with no Target line) previously compiled with no predicate, so non-living creatures in the area would have been eligible. The phrase now compiles `living-creature`; the undead in the live Exsanguination case was left unaffected.

## Implementation contract

- **Compiler (`damage-benefit-compiler.js`):** each accepted form is one exact sentence: temporary HP from (half) the single target's damage, from the most-damaged creature's damage, healing with an excess-as-temporary-HP sentence, or temporary HP on a kill. Exactly one benefit sentence and one matching duration sentence are required. The named damage type must be the cast's only structured damage component. A single-target benefit requires a one-creature Target line; a most-damaged benefit requires an area. Any unclaimed temporary-HP or regain-HP sentence stays a gap.
- **Basic saves:** the benefit and the exact “If this damage reduces the target to 0 Hit Points, it dies…” sentence are claimed, and the remainder must still pass the simple basic-save gate.
- **Core:** `isPostDamageDeath` accepts only `{kind: "death", threshold: 0, requiresReductionBySource: true, automatic: true}`. `isCasterDamageBenefit` accepts the exact shape, with fraction ½ or 1, and damage type matching the only structured component; a kill-conditional benefit requires the death terminal.
- **Runtime, before any damage:**
  - A single-target benefit refuses unless exactly one target participates.
  - Healing requires exactly one caster token, since PF2e's `applyDamage` needs a token.
- **Runtime, after damage:**
  - **Death:** after this target's damage, the creature is marked Dead (Dying and Unconscious cleared) only if its recorded HP before was above 0, this cast's confirmed receipt damage is above 0, and its HP is now 0.
  - **Benefit amount:** computed only from confirmed PF2e damage receipts (`damageTaken`, after IWR), rounded down, taking the most-damaged creature or the single target, and counting only killed targets for kill-conditional benefits.
  - **Healing:** goes through PF2e's receipt path (capped at max HP); any excess becomes temporary HP.
- **Temporary HP:** granted by a caster Effect with PF2e's native `TempHP` rule element and the stated duration. PF2e applies a strictly higher value and removes the remainder when the Effect ends. The runtime skips creating the Effect when existing temporary HP are equal or higher. It waits for PF2e to confirm the caster's temporary-HP source (PF2e writes it after the Effect is created), and a missing confirmation goes to review. The Effect is attached to the cast journal, and the result card reports the caster outcome.

## Evidence

**225/225 automated tests pass.** The new `test/damage-benefit.test.js` covers all five compiled shapes, detached copies, five wording negatives, a two-target benefit, the preamble gate, and forged contracts. The Speed (255), event-lifetime (111), recurring (74) and damage-derived (47) family regressions pass, with zero lost routes.

The route census gives **208 enabled nonritual routes** and **77 executable shared-save plans**; the primary worklists are Phase 2: 129 / 442 and Phase 3: 32 / 592.

[Live Foundry evidence](phase-2-3-benefit-live-results.json) on Foundry 14.367 / PF2e 8.5.0, from disposable `pftest` fixtures only:

- **Vampiric Feast, all degrees:** caster temporary HP 0 / 5 / 10 / 16 from 0 / 10 / 20 / 32 damage. With void resistance 5, 15 damage gave 7 temporary HP.
- **Stacking:** an existing 200 temporary HP was kept, with no Effect created. An existing 1 was replaced by the new value.
- **Expiry:** 18 temporary HP remained at 59 seconds, after the source spell was deleted, and were gone at 61 seconds.
- **Vampiric Exsanguination:** damage of 47 and 84 (the second after void resistance 10) gave 42 temporary HP from the most-damaged creature. The undead in the area was unaffected.
- **Devour Life:**
  - A caster at 470/500 regained 30 HP with no excess; a caster at full HP gained 30 temporary HP.
  - A 40-HP target taking 60 died (not Dying); a 500-HP target did not.
- **All-Encompassing Hunger:** a 1-HP target died, and the caster gained temporary HP equal to the damage dealt (10). A surviving target gave none.
- **Vision of Death:** a 5-HP target reduced to 0 died; a 500-HP target survived; a target already at 0 HP was not “reduced by this spell” and did not die.
- **Refusal:** two targets on the single-target benefit were refused before any HP changed.
- **Result card:** it shows the caster line, for example “Caster: 15 temporary HP (1 minute) from 30 damage”.

The live run found and fixed two runtime defects:
1. PF2e's `TempHP` actor update lands after `createEmbeddedDocuments` resolves. The runtime now decides up front by PF2e's own rule (strictly higher applies) and waits for confirmation.
2. PF2e's `applyDamage` requires a token for caster healing; the runtime now passes the caster's single token and preflights it.

Fixtures and journals were removed after export.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-benefit
node tools/diff-compiled-plans.mjs /tmp/phase23-recur/official-spell-compiler-report.json /tmp/phase23-benefit/official-spell-compiler-report.json
node tools/report-enabled-spells.mjs /tmp/phase23-benefit/official-spell-compiler-report.json
node tools/audit-condition-coverage.mjs /tmp/phase23-benefit/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-benefit/official-spell-compiler-report.json
node tools/report-composition-families.mjs /tmp/phase23-benefit/official-spell-compiler-report.json
node tools/report-cross-family-speed.mjs /tmp/phase23-benefit/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/speed-family-baseline.json
node tools/test-cross-family-speed.mjs /path/to/verified-content /tmp/phase23-benefit/official-spell-compiler-report.json reports/phase-spell-batches/speed-family-baseline.json
node tools/report-escape-family.mjs /tmp/phase23-benefit/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/escape-family-baseline.json
node tools/report-rule-family.mjs recurring-saves /tmp/phase23-benefit/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/recurring-family-baseline.json
node tools/report-rule-family.mjs damage-derived /tmp/phase23-benefit/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/damage-derived-family-baseline.json
```

Live: `const h = await import('/modules/pf2e-automatic-resolution/tools/phase23-benefit-verification.mjs')`, then `await h.runCase(name)` for `environment`, `feast`, `stacking`, `expiry`, `exsanguination`, `devour`, `hunger`, `vision`, `refusal`, and finally `cleanup`.
