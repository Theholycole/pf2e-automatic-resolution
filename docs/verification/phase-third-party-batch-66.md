# Third-party batch 66: Prism of Power

2026-10-07. The sixty-sixth batch of the third-party modules' spells.

## What changed

- **Prism of Power (Oracles+)** (new `power-prism.js`, kind `power-prism`; `effect-runtime.js`; `main.js`):
  - **The prism:** a 5-foot region for the minute, with the option chosen when casting (`options.mode`, or asked). The caster's Effect ends with the record.
  - **The card's control** (`prismAct`, also on the API):
    - **Scatter:** one spell attack against the AC of each of up to 2 creatures within 5 feet of the prism's square. The degrees are posted, and the spell's own card rolls the damage for each hit.
    - **Diffract:** the cone is half the feet the line had left, in 5-foot steps, at least 5. It is placed from the line spell when one is given.
    - **Refract:** a GM note; there is nothing to roll.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 65 | Batch 66 |
| --- | --- | --- |
| Effect | 96 | 97 |
| Not enabled | 4 | 3 |

Resolved: 224 of 227.

## Tests

`test/third-party-batch-66.test.js` (1). All 1,786 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-66-live-results.json), case `thirdPartyBatch66`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Scatter, attack 25 against AC 15 and AC 25 beside the prism | Critical hit; hit |
| A creature 15 feet away; three targets | Refused; refused |
| The prism's minute ends | Region and Effect gone |
| Diffract, 45 feet left | A 20-foot cone |
| Refract | The GM's note (no roll) |
