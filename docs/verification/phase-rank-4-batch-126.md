# Rank 4 batch 126 — Life's Flowing River

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Life's Flowing River (4) | The river is a 120-foot line, an Ongoing lingering area for 1 minute. A creature entering it or starting its turn in it saves (Will). **Damage:** only undead and nindoru creatures take the rows' damage, 4d6 mental (+1d6 per rank, the text's formula; PF2e's item has none); the rest take none. **Rows:** a success or worse makes the river difficult terrain for that creature until its turn starts. A failure also knocks it Prone. A critical failure adds a 20-foot push away from the caster (the flow). A critical success makes it immune until the start of its next turn (no new exposure). The dim light is a note. |

## Rules

- **`src/compiler/river-rows.js`:** reads the four sentences, the four two-part rows (the rule, then the undead or nindoru damage) and the Heightened entry. It rewrites them as a lingering enter/turn-start save with plain rows (the push in the pushed-and-Prone wording).
- **`compileSpell`:**
  - The area is a line.
  - The formula damage (`phaseFormula`).
  - `damageTraits` (evidence).
  - The `next-turn-start` row terrain.
  - The critical success's one-round temporary immunity (`turnImmunity`).
- **`basic-save-core`:**
  - Validates `damageTraits`.
  - The one-round immunity may also end at the turn's start.
  - `damageMultiplierForTarget` is 0 for a target without the traits.
- **`basic-save-runtime`:** marks each target's `traitDamage` when the card opens; the state carries `damageTraits`.

## Interpretation

- **"Pushed 20 feet along the river's path in the direction of flow"** is a push away from the caster, since the river runs away from the caster.
- **"Ignores the river's effects until the start of its next turn"** is no new exposure until then. The terrain it already had stays until its turn starts.

## Tests

`test/rank-4-batch-126.test.js` is new. It covers the lingering declaration, the trait damage, the formula, the immunity, the push, the multiplier for a non-matching target, and unproved trait damage (refused).

A whole-corpus compile (b665 → b666) changed only Life's Flowing River.

## Evidence

[Live evidence](phase-rank-4-batch-126-live-results.json), case `rank4Batch126`, in the `pftest` world, in combat.

| Step | Result |
| --- | --- |
| A living creature enters, failure | No damage, Prone; walking 10 feet along the river costs it 20 |
| An undead enters, failure | 4d6 mental (16 taken), Prone |
| The living creature's turn starts | The river costs it 10 again |

**Cleanup:** fixtures, combat, the record and the region removed.
