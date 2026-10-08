# Third-party batch 38: Channel Imperial Dragon

2026-10-06. The thirty-eighth batch of the third-party modules' spells: a self Effect that depends on a class pick, with a Sustain bonus.

## What changed

- **Channel Imperial Dragon (Tian Xia+)** (`stated-effect.js` `imperialDragon`; `effect-runtime.js`; `main.js`):
  - The caster's Effect for 1 minute, built from the text:
    - the dragon trait and the dragon type's creature trait;
    - resistance to its damage type equal to half the level (at least 1);
    - +1 status to saves against effects with that trait.
  - **The dragon:** a class pick. It's read from the caster's Imperial Dragon Emissary flag when present (no question), otherwise asked from that dedication's five dragons and their trait and damage type (`presetFlag`).
  - **The Sustain:** a GM option on the card puts the Diplomacy and Intimidation status bonus on the caster until the end of its next turn. The bonus is +1, one more every 3 ranks. GM options can now apply to the caster (`self`) and carry an expiry.
  - The spell gaining the dragon's tradition is a note. The module's Effects read class flags, so the module builds the Effect from the text, and the reader claims the links (`ignoresLinks`).

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 37 | Batch 38 |
| --- | --- | --- |
| Effect | 67 | 68 |
| Not enabled | 33 | 32 |

Resolved: 193 of 227.

## Tests

`test/third-party-batch-38.test.js` (1). All 1,756 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-38-live-results.json), case `thirdPartyBatch38`, in the `pftest` world.

| Cast | Result |
| --- | --- |
| Level 6, Sea Dragon on its sheet, rank 3 | No question; dragon and water traits; cold resistance 3; +1 to saves against water; Sustain +1, until the end of its next turn |
| Level 12, no pick, Sky chosen, rank 6 | Electricity resistance 6; Sustain +2 |
