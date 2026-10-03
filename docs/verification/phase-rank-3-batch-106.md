# Rank 3 batch 106 — Bone Flense

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Bone Flense (3) | Both of PF2e's Effects go on the weapon's wielder: the targeted creature, or the caster. The weapon is picked on the card (a weapon or a Strike), and its id is written into the rules, replacing PF2e's weapon choice. The Damage Effect's bleed dice (1d6, +1d6 per 2 ranks) are made persistent, as the text says, and put on a toggle for a creature with a skeleton or exoskeleton. The Reaction Effect grants Erupting Spurs with PF2e's dice. Who may be targeted is the GM's note. |

## Rules

- **Weapon imbue (`src/compiler/weapon-imbue.js`, compiled in `compileSpell`):**
  - **The text:** the skeleton, bleed and reaction sentences, the heightening, and the two Effect links.
  - **PF2e's Damage Effect:** a weapon ChoiceSet; DamageDice of the bleed type and die, uncategorized, `(floor((@item.level-1)/2))`.
  - **PF2e's Reaction Effect:** the granted action, plus the spurs' DamageAlteration step.

  It returns the Effects with a `persistent` override and the toggle addition.
- **Runtime:** the new kind `weapon-imbue`. Each Effect is prepared with its overrides and additions, and the weapon ChoiceSet becomes its selection written into the predicates (PF2e prunes a selection with no ChoiceSet).

## Interpretation

- **The bleed is persistent.** The text says persistent, and PF2e's data adds ordinary bleed.
- **"A creature with a skeleton or exoskeleton" is the roller's toggle.** PF2e's predicate named an option nothing set.
- **The weapon may be an NPC's Strike.** PF2e's ChoiceSet lists only weapon items, so the card picks it instead.

## Tests

`test/rank-3-batch-106.test.js` is new. It covers the overrides and additions, and differing spurs damage (not read).

A whole-corpus compile (b630 → b631) changed only Bone Flense.

## Evidence

[Live evidence](phase-rank-3-batch-106-live-results.json), case `rank3Batch106`, in the `pftest` world, cast at 5th rank.

| Step | Result |
| --- | --- |
| The cast | Both Effects; Erupting Spurs granted |
| A Strike, toggle off | 1d4 slashing |
| Toggle on | "1d4 slashing + 2d6 bleed", the bleed instance persistent |

**Cleanup:** fixtures removed.
