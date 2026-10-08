# Third-party batch 62: Unleash True Power

2026-10-07. The sixty-second batch of the third-party modules' spells.

## What changed

- **Unleash True Power (Witches+)** (new `true-power.js`, kind `true-power`; `effect-runtime.js`; `spellshape-runtime.js`; `main.js`):
  - **The caster's Effect** lasts the sustained minute. While it lasts, every other spell the caster casts is shaped one rank higher, up to 10th.
    - The castShaper from Fractal Frosting now accepts `spellSlug: "*"` with an `except`.
    - The `rank-change` rider now takes a numeric `cap`.
  - **A spell through the patron** (`truePowerCast`, the card's control; also at the cast with `options.patronSpell`):
    - one of the caster's spells of 2 actions or less, at its rank +1;
    - the caster's basic Fortitude save against its own spell DC, taking 1d6 spirit per rank of that spell.
  - **The end:** when the Effect is deleted, the compiled save card for 10d6 spirit, basic Fortitude, covers the caster and every creature within 10 feet.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 61 | Batch 62 |
| --- | --- | --- |
| Effect | 92 | 93 |
| Not enabled | 8 | 7 |

Resolved: 220 of 227.

## Tests

`test/third-party-batch-62.test.js` (1). All 1,782 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-62-live-results.json), case `thirdPartyBatch62`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast; Fireball (3rd) through the patron, failure | Rank 4, `4d6`: 14 spirit taken |
| Fireball cast from the sheet at 3rd | Shaped to rank 4 by Unleash True Power |
| The Effect ends | Save card for the caster, the near foe and leftover test tokens within 10 feet; not the distant foe |
