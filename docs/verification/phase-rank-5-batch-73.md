# Rank 5 batch 73 — Mantle of the Unwavering Heart

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Mantle of the Unwavering Heart (5) | **PF2e's Spell Effect** on the caster, with the two picks (a dialog, or the `picks` option) set as its two choices. Each option's rules are proved against the text: fast healing 3 and +2 to saves against poison and disease; the 15-foot perfume aura (Sickened 1); Large, Clumsy 1, reach +5 and the 2d8 branch Strike; immunity to fascinated and +1 against mental effects. **The Grab note** is keyed to the picks (PF2e's names an option that doesn't exist). **The card's control** "Change one ability" (1 action, concentrate) replaces one pick with an unchosen option. The remaining sentences (Tiny reach, scent, disease, traits) are GM notes. |

## Rules

- **`src/compiler/option-mantle.js`:** reads the lead and each option; the catalog proves PF2e's rules.
- **Runtime:**
  - **New kind `option-mantle`.**
  - **`mantleSwap`** (API and card button): makes the Effect again with the new choices, keeping its start and duration, because PF2e grants an option's items only as the Effect is made. The card's button is repointed at the new Effect.

## Interpretation

- **The caster picks two different options**; a swap can't pick one already chosen.

## Tests

`test/rank-5-batch-73.test.js` is new. It covers the data, the Grab note's predicate and an unrecognised clause (not read).

A whole-corpus compile (b681 → b682) changed only Mantle of the Unwavering Heart.

## Evidence

[Live evidence](phase-rank-5-batch-73-live-results.json), case `rank5Batch73`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Picks Evergreen Vitality and Towering Trunk | Both options on; Large; Clumsy 1; the branch Strike; the Grab note keyed to either slot |
| Swap the trunk for Unyielding Will | Medium; no Clumsy; immune to fascinated; start kept; the button repointed |
| A swap from an option not chosen | Refused |
| Swap the vitality for the perfume | A creature 10 feet away Sickened 1 (PF2e's aura) |
| Swap the will back to the trunk | Large and Clumsy 1 again |

**Cleanup:** fixtures removed.
