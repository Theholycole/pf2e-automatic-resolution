# Rank 3 batch 101 — One with Stone

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| One with Stone (3) | One with Plants' rule family, now read for stone as well. The cast asks the mode, and a Dismissable record holds the generated Effect: Immobilized either way. Turning into a stone is a battle form for 8 hours (Large, AC 23, no trait added) whose Reflex successes are failures. Merging is 10 minutes, Blinded. The merged caster's card expels them, and either way the spell ends: the stone took damage (10d6), or Magic Passage (no damage). |

## Rules

- **Plant form (`src/compiler/plant-form.js`):** the readers now take "plant" or "stone" throughout, and the lead sentence must name the same substance. It records `substance`, and the tree mode's `traits`: plant for a plant; none for a stone, since the text gives none.
- **Runtime (`#executePlantForm`, `plantExpel`):** the battle form's traits come from the data. The dialog, the expel button and the roll's flavor name the substance.

## Interpretation

- **A stone gains no trait.** The text gives it none.

## Tests

`test/rank-3-batch-101.test.js` is new. It covers the stone's data, One with Plants' substance and trait, and mixed words (not read).

A whole-corpus compile (b625 → b626) changed One with Stone and One with Plants, which gained `substance` and `traits` with the same behaviour.

## Evidence

[Live evidence](phase-rank-3-batch-101-live-results.json), case `rank3Batch101`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A character turns into the stone | AC 23, Large, no plant trait, Immobilized; its Reflex save against DC 1 was a failure |
| Dismissed | Back to Medium, not Immobilized |
| An NPC merges | Blinded and Immobilized; the button reads "The stone took damage" |
| Expelled | 28 damage taken; the record ended; Blinded removed |

One with Plants' case `rank2Batch77` was rerun and passed.

**Cleanup:** fixtures removed.
