# Third-party batch 3: rows read into Effects, the modules' own Effects checked

2026-10-06. The third batch of the third-party modules' spells.

## What changed

- **Rows read from the text** (`src/compiler/third-party-rows.js`): each row's stated rules become a generated Effect (a note Effect with PF2e rules) for the row's own time.
  - **Cursed Mark (Clerics+).** "…the next saving throw they attempt they must roll twice and take the worse result. After this saving throw, the mark disappears." The mark is PF2e's RollTwice (keep the lower) on saving throws, removed after the roll. It lasts 1 round on a success and 1 minute on a failure; the critical failure's 2 Interact actions are on the note.
  - **Demand Compliance (Witches+).** A –1 status penalty to attack rolls, saves and skill checks until the start of the target's next turn (success), or for the spell (failure); –2 on a critical failure. The demand before the table is a GM note on the failing rows.
  - **Golden Touch (Oracles+).** Weakness to bludgeoning and electricity equal to the cast rank (doubled on a failure), and a –2 circumstance penalty to Stealth checks. Slowed 1 and Petrified last the spell's duration. What the rows say of an object target is on the note.
- **The modules' own Effects, checked** (user decision 2026-10-06, "Check each one"). `moduleEffectAt` reads a module Effect at each degree:
  - its degree ChoiceSet: "Success"-style or PF2e's degree labels, a value or an object of values, or a rollOption of degree strings;
  - its other choices;
  - its `eq` and roll-option predicates;
  - its `@item.flags.pf2e.rulesSelections` values, at the rank.

  `sameStatedRules` compares the result with the text's rules. Golden Touch's Effect matches at every degree; Demand Compliance's is chosen by hand. The module applies the text's Effect, and the data note says which case it was.
- **Hand of Judgement (Wizards+).** "If the target has broken the laws … within the last week they take a –2 circumstance penalty to their save." This is the GM's question per target on the card (`compileSaveAdjustment`: the wording without a comma).
- **Grand Finale (Wizards+).**
  - "… Blinded and deafened for 1 round, and then dazzled for 1 minute." Dazzled lasts 11 rounds from the cast; PF2e's Blinded overrides it at first.
  - Ending the required spell and centring the area are a card reminder (`required-spell`).
- **Note rules** (`scripts/note-effects.js`):
  - a Weakness at the cast rank (`@item.level`, `(@item.level±N)`, doubled);
  - RollTwice on the next saving throw;
  - a penalty to skill checks.
- **The save gate** accepts "until the end of your next turn".

PF2e's own spells are unchanged: 0 of 1,994 plans differ from before this batch, and the official census is still 1870/1870 enabled.

## Census

| Route | Batch 2 | Batch 3 |
| --- | --- | --- |
| Save | 13 | 18 |
| Not enabled | 111 | 106 |

## Tests

`test/third-party-batch-3.test.js` (5) covers:

- Cursed Mark;
- Demand Compliance (and its hand-picked Effect);
- Golden Touch (and its matching Effect);
- the module Effect reader;
- Hand of Judgement's question and Grand Finale.

All 1,681 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-3-live-results.json), case `thirdPartyBatch3`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Cursed Mark, failure | The mark for 1 minute; the next Reflex save rolled twice; the mark gone after it |
| Demand Compliance, critical failure | Will and Athletics –2; the penalty and Demand notes |
| Golden Touch, rank 4, failure | Weakness 8 to bludgeoning and electricity; Stealth –2; Slowed 1 |
| Hand of Judgement, the GM answers yes, failure | The save at –2; damage and Prone |
| Grand Finale, critical failure | Blinded and Deafened (1 round); Dazzled held for 11 rounds; double damage; the reminder |
