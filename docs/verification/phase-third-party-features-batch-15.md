# Third-party features batch 15: Focus Points regained

2026-10-07. The fifteenth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)), in the focus-pool family.

## What changed

- **`readFocusRegain`** (`plus-feature-rules.js`): a "+" feat or action whose text regains a Focus Point ("You regain a Focus Point.", "You instantly regain/recover 1 Focus Point.", "You gain 1 Focus Point.").
  - Emergency Infusion: persistent bleed equal to half the level (rounded up) first.
  - Monastic Practices: a Religion check against the standard DC of the level first; a point only on a success. Its own inline check uses the level number as the DC, so the text's level-based DC is used instead.
  - A point that can only Energize a qi-shape (Qi-Siphoning Blow), or lasts only the turn (Flirting With Danger), isn't this.
- **`focusRegainOnCard`** (`scripts/text-rules.js`, hooked in `main.js`): posting the feature's card is its use.
  - The point is regained up to the pool's maximum.
  - Its frequency ("once per hour", "once per day") is checked against its last use; a second use within it is refused with a message.
  - The trigger or requirement ("an ally falls to 0 Hit Points") is the table's.
  - PF2e's own feats are left alone.
- **The entries:** Surging Focus+, Faith Will Vindicate Me!, Invigorative Breath, Emergency Infusion, Wield the Divine, Linked Sparks, Linked to Undeath, Linked Pilfering, Linked Jabs, Linked Beguiling, Monastic Practices.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 14 | Batch 15 |
| --- | --- | --- |
| focus-pool | 0 / 34 | 11 / 34 |

## Tests

`test/third-party-features-batch-15.test.js` (1). All 1,822 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-15-live-results.json), case `thirdPartyFeaturesBatch15`. A 7th-level character with a 3-point pool (three focus spells):

| Step | Result |
| --- | --- |
| Wield the Divine posted at 1 point | 2 |
| Posted again within the hour | Refused: still 2 |
| Emergency Infusion | 3; persistent bleed 4 |
| Wield the Divine after the hour, the pool full | Still 3 |
