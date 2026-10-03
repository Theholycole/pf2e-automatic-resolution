# Rank 5 batch 25 — Shadow Blast

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Shadow Blast (5) | 6d8 damage (+1d8 a rank) of the type the caster picks on the card from the text's ten. It is a basic save, and each target uses its better of Reflex and Will (the target's choice). The area is the caster's choice of a 30-foot cone, a 15-foot burst within 120 feet or a 50-foot line; the caster places it, and the card notes this. |

## Rules

- **Choice blast (`choice-blast.js` `rewriteChoiceBlast`):**
  - It reads "Area varies", "Defense @Check[X|basic] or @Check[Y|basic] (target's choice)", the "Choose [inline damage rolls] damage, and choose [templates]" sentence, "The blast deals NdM damage of the type you chose to each creature in the area." and the Heightened (+1) step.
  - The inline rolls' (@item.rank+K)dM must equal the stated dice at the spell's rank.
  - The result is written out as a new text-damage form, "You deal NdM damage of one type you choose (…) to all creatures in the area, with a basic X save.", which `text-damage.js` reads into the damage-type choice.
- **Save choice:**
  - `resolution.check.saveChoice` holds `{statistics: [X, Y], chooser: "target"}`.
  - `inspectSavePlan` checks the two stated saves, the first being the check's.
  - The runtime rolls each target's higher modifier, and the card labels the save "X or Y (the target's choice: its better save)".
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-25.test.js` is new. Its negative cases are:
- a save pair that isn't the stated one (blocked);
- dice that don't match the inline rolls (not read).

A whole-corpus compile (b479 → b481) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-25-live-results.json), case `rank5Batch25`, in the `pftest` world, cast at 6th rank with cold chosen. The damage was 7d8 cold = 32.

| Creature | Saves | Modifier rolled | Result | Lost |
| --- | --- | --- | --- | --- |
| Better Will | Will +15, Reflex +0 | +15 | Failure | 32 |
| Better Reflex | Reflex +15, Will +0 | +15 | Success | 16 |

**Cleanup:** fixtures removed.
