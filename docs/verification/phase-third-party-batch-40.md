# Third-party batch 40: Secret of the Forebearers

2026-10-06. The fortieth batch of the third-party modules' spells: an Aid the caster's forebearers give once a turn.

## What changed

- **Secret of the Forebearers (Witches+)** (`stated-effect.js` `forebearers`; `effect-runtime.js`; `main.js`):
  - The caster's Effect for 1 minute. The patron's skill is a class pick, asked at the cast.
  - **The forebearers' Aid** (a card option, once a turn):
    - The roll uses the chosen skill against the Aid DC (15). A failure becomes a success.
    - A caster legendary in that skill critically succeeds without a roll.
    - The Aid bonus (+1; on a critical success +2, +3 at master, +4 at legendary; −1 on a critical failure) applies to the caster's next attack roll or skill check that turn.
    - This is the new `aid-roll` GM-option kind; the chosen skill is filled into it.
  - **After an aided success:** the second option makes the caster Concealed until the start of its next turn. That it can't Hide or Sneak with it is a note.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 39 | Batch 40 |
| --- | --- | --- |
| Effect | 69 | 70 |
| Not enabled | 31 | 30 |

Resolved: 195 of 227.

## Tests

`test/third-party-batch-40.test.js` (1). All 1,758 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-40-live-results.json), case `thirdPartyBatch40`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Expert in Occultism, Occultism chosen; the Aid | Success, +1 circumstance on its next check |
| A second Aid that turn | Refused |
| The concealment option | Concealed |
| Legendary in Occultism; the Aid | Critical success without a roll, +4 |
