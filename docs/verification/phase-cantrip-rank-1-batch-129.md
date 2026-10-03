# Cantrip / rank 1 batch 129 — Hand of the Apprentice

2026-09-28. The user took the recommendations: option (A), guided.

| Rule | Spell |
| --- | --- |
| A new `weapon-throw` route (guided). PF2e's Effect goes on the caster for the chosen held melee weapon; the card rolls PF2e's spell attack. On a hit, a button rolls that weapon's own Strike damage (critical on a critical success, with its critical specialization), with Intelligence in place of Strength (PF2e's Effect; a data note says the text reads “spellcasting ability modifier”) | Hand of the Apprentice (1) |

**Kept strict (tests):** it isn't read with any of these changes:
- an added condition;
- triple damage;
- an added bonus.

PF2e's Effect proof also refuses an extra rule, an unforced modifier, and a specialization not tied to the chosen weapon.

## Coverage

**Census:** **610 enabled**, up from 609.
- The b212 corpus diff against b211 changed only Hand of the Apprentice.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 739/739 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-129-live-results.json), case `cr1Batch129`, in the `pftest` world. The caster was a character holding a dagger, against a target with AC 1.

The first run used an NPC caster. PF2e's ChoiceSet only lists weapon items, and an NPC's weapons have no Strike, so the runtime now refuses a caster without a held melee weapon Strike.

- **No target:** refused.
- **The passing run:** a hit.
  - The Effect was “Spell Effect: Hand of the Apprentice (Test Dagger)”, with the dagger selected.
  - The card's button opened PF2e's damage dialog; the roll was `1d4 piercing`, with `int` on and `str` off.
- **An earlier run:** a critical hit rolled `(2 * 1d4) piercing + 1d6 bleed`, the knife group's critical specialization, with the same ability modifiers.
  - That run's assertion failed only because it looked the Effect up by its exact name, and PF2e appends the weapon to the name. It's recorded in the live file under `earlierRuns`.
- **Cleanup:** fixtures removed.
