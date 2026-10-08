# Third-party features batch 10: passive features from their text

2026-10-07. The tenth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)). It opens the cast-rider family and adds two general mechanisms.

## What changed

- **Text rules** (new `src/compiler/plus-feature-rules.js` `readTextRules`, new `scripts/text-rules.js`):
  - A passive feature's rules can now follow its text: the module's rules the text contradicts are dropped and the text's are added.
  - PF2e's `ItemPF2e#prepareRuleElements` is wrapped, so this happens in memory as PF2e builds the item's rule elements. Nothing is saved to the item, and official PF2e items are left alone.
  - A form may instead find that the module's rules say what the text says (`verified`).
- **Passive cast riders** (`readPassiveCastRider`): a feat's or Effect's "When you Cast a Spell …" rule is read at every cast its holder makes, as a spellshape-style rider. It is silent when the spell isn't one it applies to.
- **The entries:**
  - **Rudimentary Perfectionism** (Wizards+): the text gives the heightened ranks as a status bonus, "or twice that amount if the spell was cast from a spell slot". The module doubled it for every non-cantrip, including heightened focus spells; the rules now double it only for a slot spell (`item:spell-slot`). The two extra cantrips are the table's.
  - **Power of Blood** (Magic+):
    - Each spell cast from a slot gives the caster persistent bleed equal to the rank, as PF2e's persistent-damage condition, made directly so the caster's immunities can't stop it.
    - Its later ticks' resistances are the GM's to ignore; the condition carries a reminder.
    - The flat-check notes now use the text's DCs: the module's first note said 8 with assistance, where the text says 7.
  - **Wayward Gifts** (Witches+): the module's Effect is verified against the text. The primal gift it lacked is added: on PF2e's Sustain action, the witch gets temporary Hit Points equal to the sustained hex's rank (asked if several) until the start of its next turn.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 9 | Batch 10 |
| --- | --- | --- |
| cast-rider | 0 / 66 | 3 / 66 |

## Tests

`test/third-party-features-batch-10.test.js` (3). All 1,812 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-10-live-results.json), case `thirdPartyFeaturesBatch10`, in the `pftest` world. A 10th-level caster:

| Step | Result |
| --- | --- |
| Rudimentary Perfectionism: Fireball 3→5 from a slot | +4 (twice 2 ranks) |
| Electric Arc 1→5 (cantrip) | +4 |
| Force Bolt 1→5 from Focus Points | 3d4+3 and +4 = +7 (the module's rule gave +8) |
| The feat's saved rules | Unchanged (the text's rules only in memory) |
| Power of Blood: Fireball at 3 from a slot, the caster resisting bleed 10 | The passive rider; 3 persistent bleed on the caster |
| Wayward Gifts (primal): PF2e's Sustain with a rank-3 hex sustained | 3 temporary Hit Points |
