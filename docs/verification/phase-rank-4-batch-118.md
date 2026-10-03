# Rank 4 batch 118 — Chromatic Armor

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Chromatic Armor (4) | The card asks the actions spent: 2, or 3 for one more color. It rolls the colors with 1d8, rerolling duplicates. An 8 is the GM's matching type (the type the target took most recently in the past minute), or a reroll. The targeted willing creature's Effect gets resistance 5 (+5 per 3 ranks) to each rolled type, and PF2e's TokenLight (bright 20 feet, dim to 40), for 1 minute. **Adjacent attackers:** the card's control, with the attacker targeted, posts its Will save (light, visual). A failure (or critical failure) leaves it Dazzled until the end of its next turn. Whatever the result, it's then temporarily immune until the end of its next turn, and a further attack in that time gets no save. |

## Rules

- **`src/compiler/color-armor.js`:** reads the nine sentences, the table (seven types and the matching color) and the Heightened entry.
- **`compileSpell`:** compiles the attacker's save, with a one-round `turn-end` temporary immunity (`turnImmunity` evidence).
- **`basic-save-core`:** accepts that immunity duration only with its sentence.
- **`basic-save-runtime`:** the immunity Effect keeps a stated expiry (the default is still `turn-start`).
- **Runtime:**
  - New kind `color-armor`; the `actions`, `colors` and `matching` options skip the prompts.
  - `colorArmorAttacker` checks the attacker is adjacent.
- **Older test updated:** `test/compiler.test.js` asserted the old unscoped link; it now asserts the new kind.

## Interpretation

- **"At the end of its action" is the GM's moment.** The GM presses the control after the attack.
- **"Rolling again" for an 8** is a reroll of 1d8, under the same no-duplicates rule.

## Tests

`test/rank-4-batch-118.test.js` is new. It covers the table, the rolls, the light, the resistance by rank, the attacker plan's support and its immunity, and an unproved immunity (refused).

A whole-corpus compile (b657 → b658) changed only Chromatic Armor.

## Evidence

[Live evidence](phase-rank-4-batch-118-live-results.json), case `rank4Batch118`, in the `pftest` world, cast at 7th rank with 3 actions.

| Step | Result |
| --- | --- |
| Rolls 1, 1, 8 (the GM: acid), 5 | Resistance 10 to fire, acid and sonic; bright light 20 feet, dim to 40 |
| Adjacent attacker, failure | Dazzled; immune for 1 round, ending at the end of its turn |
| Attacking again | Ineligible (temporarily immune) |

**Cleanup:** fixtures removed.
