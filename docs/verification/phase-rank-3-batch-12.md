# Rank 3 batch 12 — Spectral Blade

2026-10-02. The first batch of the user's ranks 3–5 pass (the user is away; decisions go to `docs/planning/pending-user-decisions.md`).

| Spell | Now |
| --- | --- |
| Spectral Blade (3) | A ranged spell attack against one creature, dealing PF2e's 3d6 spirit damage (double on a critical hit). It's made when cast and again from the spell's card the first time the caster Sustains each later turn, for the spell's minute (the existing repeat window). The card notes that the attacks ignore the target's circumstance bonuses to AC (the GM leaves them out) and use the multiple attack penalty. **Heightened (+1):** +1d6 (PF2e's, checked). |

## Rules

- **`spectralAttack` (`sustain-attack.js`)**, a new form of the Sustain-attack family. It reads "You throw the blade when you Cast this Spell and the first time you Sustain this spell on subsequent turns, making a ranged spell attack against the AC of a creature within 20 feet." and "On a hit, you deal 3d6 spirit damage (or double damage on a critical hit)." The dice and type must be PF2e's one entry, and the Heightened step PF2e's. The circumstance-AC sentence is a note.
- **A fixed damage type in the family (`compile-ability.js`):** it keeps PF2e's own damage entry and heightening (`fixedType`), with no damage-type choice. The text-derived untyped formula and the choice remain for the others.

## Tests

980/980 pass. `test/rank-3-batch-12.test.js` is new. It checks:
- the plan;
- that changed dice, type or riders aren't read.

A whole-corpus compile (b349 → b350) changed only Spectral Blade.

## Coverage

**Census:** **1169 enabled** (milestone; 1165 non-ritual), up from 1168. Rank 3: 121 of 261.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-3-batch-12-live-results.json), case `rank3Batch12`, in the `pftest` world.
- **The cast:** a success dealt "3d6 spirit": 7 lost, with the card's notes.
- **The Sustain's attack:** a critical success, 13 doubled to 26.
- **Rank 4:** "4d6 spirit", 15 lost.
- **The spell's card:** offers "Resolve Spell Attack".
- **Cleanup:** fixtures removed.
