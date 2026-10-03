# Cantrip / rank 1 batch 40 — Funeral Flames

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “While you wield the target weapon, it becomes a +1 weapon, gains the versatile fire trait, and sheds light as brightly as a torch.”: proved by PF2e's Effect (+1 potency and versatile fire on the chosen club or staff, and a torch's light) | Funeral Flames (1) |
| “Whenever you successfully Strike a creature with the weapon, you can Dismiss the spell as a free action to deal 1d6 persistent fire damage to the target; if the target is undead, increase the persistent damage dice to d8s.”: proved by PF2e's toggle, which adds 1d6 fire (+1d6 per 2 ranks) to the weapon's damage, d8s against undead. A **PF2e data** note says the dice are ordinary fire damage, not persistent, and that the GM removes the Effect after using it | Funeral Flames |
| Target “one club or staff you're wielding”: the Effect goes on the caster, and PF2e's choice is limited to the club group | Funeral Flames |

**A stricter check.** The Effect-completeness damage check missed “1d6 persistent fire damage” (two words between the dice and “damage”). A changed text that no longer matches PF2e's rules could have passed without a gap. The check now allows up to two words. The b123 diff shows no other plan changed.

**Kept strict (tests):** changing the potency, the trait, the undead die or the damage type leaves the Effect unproved.

## Coverage

**Census:** **522 enabled**, up from 521.
- The b123 corpus diff against b122 changed only Funeral Flames.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 590/590 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-40-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch40`:
- **Choice:** the caster held a Club and a Longsword. PF2e chose the Club itself, as the only valid choice.
- **Club:** potency 1, versatile-fire, and the dismiss damage dice.
- **Longsword:** unchanged.
- **Card:** the toggle and torch light were present, and the card had the data note.

**Regressions:** `cr1Batch39` (Weapon Surge) and `cr1Batch2` (weapon Effects) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b123
node tools/diff-compiled-plans.mjs /tmp/phase23-b122/official-spell-compiler-report.json /tmp/phase23-b123/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b123/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch40`, then `cleanup`.
