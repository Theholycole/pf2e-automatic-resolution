# Rank 4 batch 29 — Runic Impression

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Runic Impression (4) | PF2e's Spell Effect: Runic Impression on the caster. PF2e asks for unarmed attacks or a held weapon, then the rune: Corrosive, Flaming, Frost, Ghost Touch, Returning, Shock or Thundering. At 8th, keen and the greater runes are also offered. PF2e's AdjustStrike adds the chosen property rune. A note Effect covers the early ending (no longer holding the weapon, except a thrown returning one) and the property-rune limits. |

## Rules

- **Rune choice (`effect-note-proof.js`):** "Your unarmed attacks or your weapon gain the benefits of a weapon rune you choose when you cast this spell: <list>." is proved by PF2e's choices and AdjustStrike rules:
  - the unarmed-or-weapon ChoiceSet, and the held-weapon choice behind it;
  - a rune ChoiceSet offering every listed name ungated, with any others gated;
  - the two AdjustStrike rules adding the chosen rune.
- **8th rank:** "Add keen to the list of runes you can choose as well as the greater versions of …" is claimed when exactly those choices are gated to the Effect's level 8.
- **Notes:** the ending and the two rune-limit sentences are notes.
- **Runtime (`effect-runtime.js`):** a weapon ChoiceSet behind another choice (its own predicate) is left to PF2e, instead of being preset or refused when the caster holds no weapon.

## Tests

1099 pass. `test/rank-4-batch-29.test.js` is new, with a negative case: a rune PF2e doesn't offer (Vorpal) isn't proved.

A whole-corpus compile (b429 → b430) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-29-live-results.json), case `rank4Batch29`, in the `pftest` world, at 4th.
- PF2e offered "Unarmed Attack" or "Weapon", then exactly the seven runes (no greater runes or keen).
- Choosing Flaming on unarmed attacks gave one strike adjustment. The note Effect has the ending and limits.
- **Cleanup:** fixtures removed.
