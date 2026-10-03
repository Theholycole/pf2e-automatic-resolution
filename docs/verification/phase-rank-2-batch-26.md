# Rank 2 batch 26 — maneuvers with a spell attack roll

2026-10-01.

| Spell | Now |
| --- | --- |
| Telekinetic Maneuver (2) | The card offers Disarm, Shove, Reposition and Trip against the targeted creature, with a multiple attack penalty choice. Each button runs PF2e's own action with the spell's spellcasting statistic instead of Athletics, against the defence PF2e's action uses. The module then applies PF2e's stated result. |
| Vanish Weapon (2) | The same for Disarm (melee spell attack), as a reaction. The extradimensional space is listed on the card for the GM: the weapon disappearing, drawing it, its fall when the spell ends, Dismiss, and the Strike's damage still landing. |

## Results applied

- **Trip:** success, Prone. Critical success, Prone and 1d6 bludgeoning (rolled and applied). Critical failure, the caster falls Prone.
- **Disarm:** success, PF2e's Effect: Disarm (Success), which gives –2 circumstance to attacks with that weapon. Its weapon choice is preset when the target has one non-unarmed Strike; with several, PF2e asks; with none, the GM is told.
  - Critical success: the GM is told the item drops.
  - Critical failure: the caster is off-guard until the start of its next turn.
- **Shove / Reposition:** the GM moves the creature 5 feet (up to 10 on a critical success). Shove's critical failure knocks the caster Prone. Reposition's critical failure lets the target reposition the caster (GM).

## Rule (new family `spell-maneuver`)

"You (can) attempt to <Disarm, Shove, Reposition, or Trip> the target / the triggering creature using a (melee) spell attack roll instead of an Athletics check." for a creature target with no save and no damage.
- A reaction's Trigger paragraph must go with "the triggering creature".
- Up to one sentence of narration is allowed, plus Vanish Weapon's six exact GM sentences.

## Tests

852/852 pass. `test/rank-2-batch-26.test.js` is new. It checks both spells' data and refuses a changed wording for each.

A whole-corpus compile (b279 → b280) changed only these two spells.

## Coverage

**Census:** **1075 enabled**, up from 1073. Rank 2: 163 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-26-live-results.json), case `rank2Batch26`, in the `pftest` world.
- **Telekinetic Maneuver:**
  - The card had the four buttons and the penalty choice.
  - Six Trips each rolled +14 (the spell's spellcasting modifier) against the foe's Reflex DC 20.
  - Successes knocked it Prone. Critical successes also dealt 1d6 bludgeoning (lost 2–4 HP). A failure did nothing; a critical failure knocked the caster Prone.
  - Disarm (after a failure): success gave Effect: Disarm (Success) for the longsword, whose attack went from +8 to +6.
- **Vanish Weapon:** a Disarm button and the six GM notes.
- **Cleanup:** fixtures removed.
