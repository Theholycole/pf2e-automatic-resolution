# Rank 3 batch 89 — Ibex's Harvest

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Ibex's Harvest (3) | When cast, the card asks for the actions spent. **1 action:** the targeted willing creature gains 10 temporary Hit Points for 1 minute (PF2e's TempHP rule on an Effect). **2 actions:** two targeted willing creatures gain 10 each. **3 actions:** the targeted creature gets a basic Will save card for 2d8 mental damage, and every other creature in the caster's 10-foot emanation (the caster too) gains 5. Each rank above 3rd adds 3 temporary Hit Points and 1d8 damage. |

## Rules

- **Action tale (`src/compiler/action-tale.js`, compiled in `compileSpell`):**
  - It reads the lead sentence, the three action paragraphs, the heightening, and the 3-action save and damage (both checked against PF2e's data).
  - PF2e's broken link to "Spell Effect: Ibex's Harvests" (a name, not an id) is set aside; the module makes its own temporary Hit Points.
  - The 3-action save is compiled as a plan of its own: a basic save of the item's damage on one creature.
- **Runtime:**
  - **New effect kind:** `action-tale`.
  - **Actions:** asked in a dialog when not given.
  - **Temporary Hit Points:** Effects with the heightened amount.
  - **The 3-action save:** the chosen creature's card is started with that plan.
- **Interpretation:** the caster is in its own emanation, so it gains the 3-action temporary Hit Points too. Willing targets are the caster's call.

## Tests

`test/rank-3-batch-89.test.js` is new. It covers the data for each action count, the save plan, a heightening PF2e's data doesn't have (not read), and another save (not read).

A whole-corpus compile (b607 → b608) changed only Ibex's Harvest.

## Evidence

[Live evidence](phase-rank-3-batch-89-live-results.json), case `rank3Batch89`, in the `pftest` world.

| Step | Result |
| --- | --- |
| 1 action at 3rd | The target: 10 temporary Hit Points (its HP shows 10 temporary) |
| 2 actions at 4th | Two targets: 13 each |
| 3 actions at 3rd | The caster and the creature beside it 5 each; the targeted foe none; the far creature none. The foe's card: a failure, 2d8 mental (9 lost of 9). |

**Cleanup:** fixtures removed.
