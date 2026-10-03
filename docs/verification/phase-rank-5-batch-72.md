# Rank 5 batch 72 — Moon Frenzy

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Moon Frenzy (5) | **PF2e's Spell Effect** on each of up to 5 willing targets at the cast rank: temporary HP, weakness to silver, fangs and claws (agile, finesse), the critical bleed, and the full-moon size toggle. The compiler proves each number against the text at 5th, 6th and 10th. **Text over data:** the +10-foot status bonus is to every Speed (PF2e's rule names only the land Speed), and the attacks' dice are written into the Strike rules at the cast rank. **The card's control** per target "X tries to end it": its Will save against the spell DC; on a success its Effect ends. The concentrate restriction is a GM note. |

## Rules

- **`src/compiler/frenzy.js`:** reads every sentence and both Heightened entries; the catalog proves PF2e's rules.
- **Runtime:**
  - **New kind `frenzy`:** PF2e's Effect with the overrides.
  - **`frenzyEnd`:** API and card button.

## Interpretation

- **The attacks' dice:** on an NPC, PF2e makes the Strike with its own dice whatever the rule says. On a character the written dice are used (3d8 at 6th).
- **The full moon** is PF2e's own toggle on the Effect (a GM note says to switch it on).

## Tests

`test/rank-5-batch-72.test.js` is new. It covers the data, the overrides and an unrecognised clause (not read).

A whole-corpus compile (b680 → b681) changed only Moon Frenzy.

## Evidence

[Live evidence](phase-rank-5-batch-72-live-results.json), case `rank5Batch72`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 5th on two allies | Two Effects: 5 temporary HP, silver weakness 5, `all-speeds` (its fly Speed +10), fangs and claws |
| A strong-willed ally tries to end it | Ended (Effect gone) |
| A weak-willed ally | Kept |
| Cast at 6th | 10 temporary HP; a character's fangs "3d8 piercing" |

**Cleanup:** fixtures removed.
