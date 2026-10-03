# Rank 4 batch 133 — Radiant Heart of Devotion

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Radiant Heart of Devotion (4) | **Sides** (PF2e's remaster has no alignment): good is the caster, its allies and holy creatures; evil is unholy creatures; neutral is the rest. The card's controls reclassify targeted creatures (good, neutral or evil). **The area:** a sustained 20-foot emanation around the caster for 1 minute, with the caster's light (bright 20 feet). **Good creatures inside** hold +1 status to attack rolls, and their Strikes deal 1d6 extra spirit (+1d6 per 2 ranks); they lose it on leaving. **Others starting a turn inside** roll PF2e's Will save against the spell DC. A neutral creature that fails is Dazzled for 1 round; an evil one, Blinded. |

## Rules

- **`src/compiler/radiant-heart.js`:** reads the three opening sentences, the three sides and the Heightened entry.
- **`ongoing-families`:**
  - **`startTargetAura`:** takes `sides`, `events`, `hazardDamage` and `sustained`.
  - **`radiantSide`:** classifies a creature, the GM's list first.
  - **`syncMemberEffect`:** grants the good side only.
  - **`applyHazardDamage`:** a `radiantSides` branch rolls the save and applies the condition Effect.
- **Runtime:**
  - **New kind `radiant-heart`:** the caster's light Effect attached to the record.
  - **`cardAction("radiant-good|neutral|evil")`:** sets the targeted creatures' side, and removes the good Effect from those that aren't.
- **Fix:** the classification is a list, because a flag key can't hold a UUID's dots.

## Interpretation

- **The alignment mapping is a QUESTION, as for Spiritual Attunement.** Good is the caster, its allies and holy creatures; evil is unholy creatures.
- **The turn-start save is PF2e's roll**, not a save card.

## Tests

`test/rank-4-batch-133.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b672 → b673) changed only Radiant Heart of Devotion.

## Evidence

[Live evidence](phase-rank-4-batch-133-live-results.json), case `rank4Batch133`, in the `pftest` world, cast at 6th rank, in combat.

| Step | Result |
| --- | --- |
| An ally inside | +1 attack and 2d6 spirit on Strikes |
| A neutral creature (Will −20), its turn starts | Dazzled |
| An unholy creature, its turn starts | Blinded |
| The GM reclassifies the neutral creature as good | It gains the bonuses |

**Cleanup:** fixtures, combat and the record removed.
