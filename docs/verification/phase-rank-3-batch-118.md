# Rank 3 batch 118 — Invoke the Harrow

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Invoke the Harrow (3) | The caster picks the suit's boon or bane on the card (12 options; the draw or 1d6 is a reminder). On a failed Will save, the target gets the module's Effect with it for 1 round, with its repeat save as a control: an action, and a success ends it. From 6th rank the heightened rows apply: values doubled, 1 minute, two successes to end it, and Crowns three checks. An ally accepting without the save is a reminder (record it as a failure). |

**The boons and banes:**

| Suit | Boon | Bane |
| --- | --- | --- |
| Hammers | +2 status to damage | Enfeebled |
| Keys | +1 status to AC | Clumsy |
| Shields | Temporary HP of 2 × rank | Drained |
| Books | +1 status to skill checks | Stupefied |
| Stars | +1 status to saves | Confused |
| Crowns | Roll twice, higher, once | Roll twice, lower, on a toggled check |

## Rules

- **`src/compiler/harrow-suits.js`:** `extractHarrowSuits` reads the nine lead sentences, the six suits and the 6th-rank entry. It builds both option sets of notes with rules and `endSave`, and the caster's choice; the failing rows hold the options.
- **`compileSpell`:** the base rows, plus `heightenedVariants` from 6th.
- **Validation:**
  - Harrow notes last from the cast.
  - Row-note rules now allow unpredicated status bonuses (damage, AC, skill checks, saves), TempHP `N*@item.level`, and RollTwice on a check (higher, or lower behind a toggle).
  - `endSave.successes` may be 2 or 3.
- **Runtime:** the end-save counts successes on the note before ending.

## Interpretation

- **The draw is the caster's.** The deck or the 1d6 roll is a reminder.
- **An ally accepting it is marked as a failure.**
- **The Crowns bane's "check of your choosing" is a toggle.** It's switched on for that check.

## Tests

`test/rank-3-batch-118.test.js` is new. It covers the 12 options, the rows, a boon's rule, the 6th-rank bane's value and two successes, support, and a different boon (not read).

A whole-corpus compile (b642 → b643) changed only Invoke the Harrow.

## Evidence

[Live evidence](phase-rank-3-batch-118-live-results.json), case `rank3Batch118`, in the `pftest` world.

| Rank | Pick | A failed save | The repeat save |
| --- | --- | --- | --- |
| 3rd | Keys boon | +1 status AC for 1 round | A success ended it |
| 6th | Hammers bane | Enfeebled 2 for a minute | The first success continued (1 of 2); the second ended it, and Enfeebled was removed |

**Cleanup:** fixtures removed.
