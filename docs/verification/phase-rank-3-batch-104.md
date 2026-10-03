# Rank 3 batch 104 — Organsight

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Organsight (3) | Ki Cutting Sight's check-mark family. The cast rolls a Recall Knowledge with Medicine (or a Lore) against the targeted creature's level DC (+2 uncommon, +5 rare, +10 unique). PF2e's Effect goes on the caster for its minute either way. Its Medicine bonus and penalty are on two toggles: a check that depends on the organs, or on seeing the skin. On a success the Effect marks the creature. The first piercing or slashing damage roll against it adds 4d6 precision (+1d6 per rank) and removes only the mark. The card's control repeats the check once on each later turn, marking the creature again (not cumulative). |

## Rules

- **Check mark (`src/compiler/check-mark.js`):** an Organsight reader handles:
  - all six sentences and the heightening;
  - PF2e's Effect: the two Medicine FlatModifiers on roll options, the damage toggle, and DamageDice `1 + @item.level` d6 precision.
- **Runtime:**
  - `#executeCheckMark` now handles the Recall Knowledge, the level DC and the persistent Effect: the mark only on a success, plus the toggles.
  - `checkMarkAgain` (also on the module API) repeats the check once per caster turn and re-adds the mark.
  - `consumeUsedEffects` honours `disarmMark`: it removes only the TokenMark. `consumeOn.options` limits it to piercing or slashing.

## Interpretation

- **The two kinds of Medicine check are toggles the roller sets.** PF2e's predicates had nothing to set them.
- **The Lore option is a parameter.** The caster passes a Lore skill instead of Medicine.

## Tests

`test/rank-3-batch-104.test.js` is new. It covers the data, and dice differing from PF2e's (not read). Batch 103's test still passes.

A whole-corpus compile (b628 → b629) changed only Organsight.

## Evidence

[Live evidence](phase-rank-3-batch-104-live-results.json), case `rank3Batch104`, in the `pftest` world.

| Step | Result |
| --- | --- |
| The cast | Medicine against level DC 20: success; the Effect lasts 1 minute with both toggles and the mark |
| A bludgeoning Strike | 1d4, no dice; still marked |
| A piercing Strike | "1d4 + 4d6 piercing"; the mark removed; the Effect stays |
| The check again | Critical success; marked again |

Ki Cutting Sight's case `rank3Batch103` was rerun and passed.

**Cleanup:** fixtures removed.
