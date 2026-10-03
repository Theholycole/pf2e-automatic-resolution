# Rank 6 batch 3 — Desiccate, Unfolding Wind Crash, Devouring Void, Field of Life, Stone to Flesh, Hasted Assault, Skeleton Army

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Desiccate | Rewritten (`save-rewrites.js`) to the basic save on living targets. Creatures with the water or plant trait get one degree worse. A creature without significant moisture is the GM's question (immune). |
| Unfolding Wind Crash | Rewritten to the basic Reflex save in a 20-foot emanation, Prone on a critical failure. The jump is the caster's reminder: move the token, then target the creatures around it. |
| Devouring Void | Extra-lingering reader: a placed sustained area, saved against when cast and on each Sustain. New `livingOnly` filter: the undead and constructs are never exposed. Leaving the area (its Reflex save) is a note. |
| Field of Life | Hazard-area family, new `life-field` control. As each turn starts inside, the living regain the dice and the undead take them as vitality damage (no save). Sustained. The fixed heightened dice (1d10 at 8th, 1d12 at 9th) come from the text, checked against the item. |
| Stone to Flesh | New kind `restore-condition`: the targeted creature's Petrified is removed (with any Effect granting it). With no creature targeted, the object's change is the GM's note. |
| Hasted Assault | Condition-note grant: the caster is Quickened for 1 minute, with the Stride/Strike limit as the note. |
| Skeleton Army | Incarnate. Each phase's damage comes from the text (the item has none), so each phase rolls the text's formula (the existing `phaseFormula` route). Arrive: 4d8 slashing, with persistent bleed on a critical failure. Depart: 6d6 piercing, Frightened 2 on a critical failure. |

## Tests

`test/rank-6-batch-3.test.js` is new. A whole-corpus compile (b717 → b719) changed only these seven spells.

## Evidence

[Live evidence](phase-rank-6-batch-3-live-results.json), case `rank6Batch3`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Desiccate on a plant, a plain creature and an undead | The undead is ineligible; the plant's adjustment applies, the other's doesn't; the moisture question is pending |
| Unfolding Wind Crash, critical failure | Damage and Prone; the jump reminder is on the plan |
| Devouring Void with a living and an undead creature inside | Only the living creature is exposed |
| Field of Life at 8th in combat | 1d10; the living creature healed, the undead damaged as their turns start |
| Stone to Flesh on a petrified creature | Petrified removed |
| Hasted Assault | The caster is Quickened |
| Skeleton Army Arrive, critical failure | Damage and persistent bleed |

**Cleanup:** fixtures, combat and regions removed.
