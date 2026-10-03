# Rank 2 batch 77 — One with Plants

2026-10-01. Follows the user's decisions of 2026-10-01:
- A battle form PF2e has no Effect for is generated from the text.
- A trigger the module can't detect (the plant taking damage) is a GM control.

| Spell | Now |
| --- | --- |
| One with Plants (2) | The cast asks which mode. Either way a generated Effect goes on the caster, held by a Dismissable record for the mode's duration. Both modes make the caster Immobilized ("can't move"). **Turn into a Plant** (8 hours) is a PF2e battle form: AC 20, Large, the plant trait, no hands. Its successes and critical successes on Reflex saves become failures. **Merge with Plants** (10 minutes) makes the caster Blinded (hearing only). The card's GM buttons expel it: the plant took damage (10d6, applied) or Magic Passage (no damage). Either ends the spell. The casting and line-of-effect limits, touching the plant, the true-nature checks and "ends if outside" are notes. |

## Rules

- **`plant-form.js` (new pre-pass, kind `plant-form`):** the three lead sentences and both list items, sentence by sentence.
- **Runtime:**
  - `#executePlantForm` — the mode (`mode` in tests), the Effect's rules (GrantItem Immobilized, plus Blinded or the BattleForm and AdjustDegreeOfSuccess), and the Dismissable native record (`endsAtMaximum`).
  - `plantExpel` and its two card buttons.
- The 10d6 is rolled as PF2e's untyped damage (a bare `{10d6}`). A first try with an `[untyped]` flavor was treated as a missing type. PF2e also applies no damage to a creature at 0 HP, so the merged half of the test uses an NPC caster.

## Tests

948/948 pass. `test/rank-2-batch-77.test.js` is new. It checks:
- both modes;
- that a changed AC is read (the text's), and that a changed expulsion or save isn't.

A whole-corpus compile (b332 → b333) changed only One with Plants.

## Coverage

**Census:** **1154 enabled**, up from 1153. Rank 2: 240 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-77-live-results.json), case `rank2Batch77`, in the `pftest` world.
- **The tree (a character):** AC 20, Large, the plant trait, Immobilized. A Reflex save against DC 1 came out a failure.
- **Dismiss:** the Effect went; Medium again, not Immobilized.
- **Merged (an NPC caster):** Blinded and Immobilized.
- **The damaged plant:** it rolled 40, the caster lost 40, and the spell ended (Blinded gone).
- **Cleanup:** fixtures removed.
