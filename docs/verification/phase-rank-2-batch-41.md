# Rank 2 batch 41 — counted wisps, stored armor

2026-10-01. Follows the user's decisions of 2026-10-01:
- An Effect + note spell counts once the module covers what PF2e's Effect doesn't.
- What the module can't detect is a GM control.

| Spell | Now |
| --- | --- |
| Flame Wisp (2) | PF2e's Effect goes on the caster without its rule adding 1d4 fire to every Strike: the text spends a wisp each time, so the text wins over the data. The Effect counts the wisps ("(3 wisps)"). Its Ongoing controls: "a Strike damaged the targeted creature" sends a wisp, dealing 1d4 fire +1d4 every 2 ranks with PF2e's resistances and weaknesses, and spends it. "You cast a fire spell" adds a wisp, up to three. |
| Instant Armor (2) | The caster's worn armor comes off when the spell is cast, its equipped state kept on PF2e's Effect, which grants Armor Up!. Using Armor Up! puts the armor back on and ends the spell. If the duration runs out, the armor stays off; that it lands on the ground under the caster is the GM's. |

## Rules

- **`wisps.js` (new note family):** the three sentences and the Heightened step. PF2e's Effect must be only the per-Strike dice of the stated type and die, which the plan removes (`ruleOverrides`).
- **`stored-armor.js` (new note family):** the four sentences exactly. PF2e's Effect must be only the GrantItem of the named action.
- **Runtime:**
  - `wisps` executor, and the `wisp` request (strike or regrow) with its two Ongoing controls.
  - `stored-armor` executor (unequips the worn armor).
  - `armorUpOnUse`: on the action's chat message, an action granted by the Effect re-equips the armor and deletes the Effect (the active GM).

## Tests

885/885 pass. `test/rank-2-batch-41.test.js` is new. It checks both plans, and that changed text isn't read.

A whole-corpus compile (b294 → b295) changed only these two spells.

## Coverage

**Census:** **1115 enabled**, up from 1113. Rank 2: 201 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-41-live-results.json), case `rank2Batch41`, in the `pftest` world.
- **Flame Wisp at 4th:**
  - The Effect started "(3 wisps)" with no rules.
  - A wisp dealt "2d4 fire" (3 lost), leaving "(2 wisps)".
  - A fire spell made it "(3 wisps)". Another was refused ("already 3 wisps").
- **Instant Armor (a character caster in Chain Mail):**
  - Cast: the armor was no longer worn, AC fell from 14 to 10, and Armor Up! was granted.
  - Using Armor Up! put the armor back on (AC 14) and removed the Effect.
