# Rank 2 batch 39 — Effect + note spells proved

2026-10-01. Follows the user's decision of 2026-10-01: an Effect + note spell counts once the module covers what PF2e's Effect doesn't.

| Spell | Now |
| --- | --- |
| Lifelink Surge (2) | PF2e's Effect on the targeted eidolon (a creature without the eidolon trait is refused): Fast Healing 4 for 4 rounds, +2 a rank. The text's numbers are checked against the Effect's `@item.level * 2` at every rank. |
| Warping Pull (2) | PF2e's Effect on the targeted ally: resistance 5 to all damage, +5 every 2 ranks (checked against `5*floor(@item.level / 2)`). The Effect is removed once the creature has taken the triggering damage: PF2e's applied-damage message, even when resisted to 0, or a damage update. The teleport (an unoccupied square up to 10 feet closer) is the GM's note. |
| Everlight (2) | PF2e's Effect on the caster, who holds the gem: bright light 20 feet and dim to 40, as the text says. The colour and "the spell ends if the gemstone is broken" are the note. |

## Rules

- **`effect-note-proof.js`:**
  - `ruleValueAt` evaluates a rule's `@item.level` formula (numbers, + − × ÷, floor, ceil only).
  - A scaled reader checks the base value and each heightened step at every rank up to 10.
  - Readers may state the recipient (the caster, or the target with a trait) and that the Effect ends after damage.
- **`compile-ability.js`:** a proved plan takes the stated recipient, and its scope, recipient and target questions are cleared.
- **Runtime:**
  - The Effect + note executor checks the target's trait and flags `endsAfterDamage`.
  - `main.js` removes such Effects on PF2e's applied-damage message or a damage update (the active GM).

## Tests

883/883 pass. `test/rank-2-batch-39.test.js` is new. It checks:
- the recipients and the after-damage end;
- the formula evaluator;
- that a changed step isn't proved.

A whole-corpus compile (b292 → b293) changed only these three spells.

## Coverage

**Census:** **1111 enabled**, up from 1108. Rank 2: 197 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-39-live-results.json), case `rank2Batch39`, in the `pftest` world.
- **Lifelink Surge at 3rd:**
  - A target without the eidolon trait was refused ("isn't your eidolon").
  - The eidolon got the Effect: 4 rounds, level 3 (Fast Healing `@item.level * 2` = 6).
- **Warping Pull at 4th:**
  - The ally had all-damage resistance 10.
  - 15 fire damage took 5 HP, and the Effect was then gone.
- **Everlight:** the caster's token sheds bright light 20 and dim 40.
