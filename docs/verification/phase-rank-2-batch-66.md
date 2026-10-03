# Rank 2 batch 66 — Reaper's Lantern

2026-10-01. Follows the user's decision of 2026-10-01: the module halves the healing ("only half the normal benefit from healing effects").

| Spell | Now |
| --- | --- |
| Reaper's Lantern (2) | A lingering 5-foot emanation on the caster for 1 minute, with its light on the caster's token (bright in the area, dim to twice it). Each living creature and undead inside, at the cast or on entering, gets a card whose button rolls its Fortitude save against the spell DC, once for the whole cast. Constructs and the caster aren't asked. While inside, a living creature that failed holds an Effect that halves the healing it gets, and a failed undead is Enfeebled 1. Leaving removes them; re-entering restores them without a new save. An optional Sustain (once a round, from the next round) grows the radius and the light by 5 feet, and the creatures it now covers are asked. |

## Rules

- **`lantern-aura.js` (new family, kind `lantern-aura`):** the eight rule sentences exactly (one sentence of narration allowed). The save must be the item's.
- **`ongoing-families.js`:**
  - `startLanternAura` starts a caster-centred lingering record (optional Sustain growth, the light Effect, `lanternOutcomes`, `lanternAsked`).
  - `syncLantern` runs on every reconcile. It posts a card for each creature not yet asked and creates the failed creatures' leave-area Effects.
  - `lanternSave` is the `lantern-save` request.
  - Sustain growth also updates the light.
- **`main.js`:**
  - The save card's button.
  - A `preUpdateActor` hook. PF2e's healing update carries a negative `damageTaken`; on a creature holding the half-healing Effect, it keeps half the Hit Points (rounded down) and posts a chat line.

## Tests

926/926 pass. `test/rank-2-batch-66.test.js` is new. It checks:
- the plan;
- that a changed row, memory or growth isn't read.

A whole-corpus compile (b321 → b322) changed only Reaper's Lantern.

## Coverage

**Census:** **1143 enabled**, up from 1142. Rank 2: 229 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-66-live-results.json), case `rank2Batch66`, in the `pftest` world.
- **Asked:** the living creature and the undead inside. Not the construct, and not the creature 10 feet away. The light was 5/10.
- **Saves:** both failed. The living one holds the half-healing Effect; the undead is Enfeebled.
- **Healing:** 10 healing gave +5 inside. After leaving, the Effect was gone and 10 healing gave +10.
- **Re-entering:** the Effect was back, with no new card.
- **Sustain** on the caster's turn: radius 10 and light 10/20. The creature 10 feet away was then asked.
- **After the minute:** the Effects, the condition and the light were gone.
- **Cleanup:** fixtures removed.

## Note

The first run stood the caster where the pftest scene's many leftover test tokens were within the area, and they were all asked; the behaviour was correct. The case now uses a clear part of the scene.
