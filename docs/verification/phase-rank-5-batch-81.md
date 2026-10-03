# Rank 5 batch 81 — Mantle of the Magma Heart

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Mantle of the Magma Heart (5) | **PF2e's Spell Effect** on the caster with the two picks as its choices (the `option-mantle` runtime of batch 73). Each option is proved against PF2e's rules. **Text over data:** Enlarging Eruption also grants Clumsy 1 and +5 reach (PF2e's Effect has neither). It can't be picked by a caster already Large or larger. **Heart of Fire** is the card's control "a creature touched it or hit it in melee (target it)": 2d6 fire, refused when the option isn't chosen. **The swap** is the card's control (a Sustain, once per round). |

## Rules

- **`src/compiler/magma-mantle.js`:** reads the lead and each option, proves PF2e's rules, and adds the text's reach (an override) and Clumsy (a GrantItem keyed to the picks).
- **Runtime (`option-mantle`):**
  - The Effect takes `ruleAdditions`; the cast and the swap enforce `sizeLimit`.
  - **`mantleRetaliate`** (API and card button).

## Interpretation

- **Heart of Fire's trigger** (a touch, or a melee unarmed or non-reach weapon hit) is the GM's call.

## Tests

`test/rank-5-batch-81.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b689 → b690) changed only Mantle of the Magma Heart.

## Evidence

[Live evidence](phase-rank-5-batch-81-live-results.json), case `rank5Batch81`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Picks Enlarging Eruption and Heart of Fire | Large, Clumsy 1, reach 10 |
| A creature that hit the caster | Burned for 7 |
| Swap Heart of Fire for Warming Flames | Resistance 5 to cold and fire; the burn refused |
| Swap the eruption for Fiery Grasp | Medium, no Clumsy; the lava fist |
| A Large caster picks the eruption | Refused |

**Cleanup:** fixtures removed.
