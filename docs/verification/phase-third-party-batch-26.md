# Third-party batch 26: View Internal Anatomy

2026-10-06. The twenty-sixth batch of the third-party modules' spells: a caster Effect against one creature, an information reveal, and an Aid option.

## What changed

- **View Internal Anatomy (Wizards+)** (`stated-effect.js` `anatomy`; `effect-runtime.js`; `reveal-runtime.js`):
  - **The caster's Effect** lasts 1 minute and gives precision damage equal to the rank (1 at 1st, +1 per rank, from the text):
    - on Strikes (`strike-damage`);
    - on damaging spell attacks (`spell-damage`, `item:trait:attack`);
    - only against the targeted creature (`target:signature:…`).
    - The stated-effect route gains `againstTarget`: exactly one other target, whose signature and the cast rank's amount are filled into the rules.
    - The module's own Effects apply to every target, which the text doesn't say, so the module builds its own from the text.
  - **The reveal:** the creature's weakest save, resistances, weaknesses and immunities are whispered to the GM only, as a successful Recall Knowledge about its biology that the GM answers (user decision 2026-10-03b). The GM's whisper also includes the disguise rule (new reveal kind `anatomy`).
  - **The GM option:** "Aided an ally's Strike" gives the targeted ally the same precision damage on Strikes against that creature for 1 round. This uses the existing `gmOptions` buttons, now also on stated-effect cards.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 25 | Batch 26 |
| --- | --- | --- |
| Effect | 60 | 61 |
| Not enabled | 45 | 44 |

Resolved: 181 of 227.

## Tests

`test/third-party-batch-26.test.js` (1). All 1,744 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-26-live-results.json), case `thirdPartyBatch26`, in the `pftest` world. The damage was rolled for real with Shift held, which skips the dialog; PF2e's formula preview leaves out the target's modifiers.

| Step | Result |
| --- | --- |
| Cast at 2nd on a foe | The caster's Effect: +2 precision, Strike and spell-attack damage, against that foe only |
| Reveal | GM-only whisper: resistances fire 5, weaknesses cold 3, weakest save |
| Caster's Strike vs the foe / another creature | `1d6 + 2 slashing` / `1d6 slashing` |
| GM option on the ally | 1-round Effect; the ally's Strike vs the foe / another: `1d6 + 2 slashing` / `1d6 slashing` |
