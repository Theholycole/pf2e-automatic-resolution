# Rank 2 batch 78 — Illusory Creature

2026-10-01. Follows the user's decisions of 2026-10-01:
- A conjured creature with statistics gets a token.
- Disbelief is a Disbelieve control.

| Spell | Now |
| --- | --- |
| Illusory Creature (2) | A sustained record holds an NPC token beside the caster, at the size chosen (up to Large, one size larger per rank above 2, at most Gargantuan). Its AC is the spell DC and its saves are the DC − 10. The card's GM buttons, used on the targeted creature: **Strike** rolls the caster's spell attack against that creature's AC; a hit deals 3d4 mental (+1d4 per rank above 2), nonlethal, unless the creature disbelieved, and the damage is tracked per creature. **Disbelieve** rolls the creature's Perception against the spell DC; a success heals half the damage the image dealt it and makes it immune to further damage. The spell ends (removing the token and its actor) when the image is hit by an attack, fails a save, or is more than 500 feet from the caster. The voice, mimicry checks, flanking, the GM's early-disbelief and believed-resistance rules are notes. |

## Rules

- **`illusory-creature.js` (new pre-pass, kind `illusory-creature`):** all 21 sentences of the text, sentence by sentence, and the Heightened (+1) entry. `illusoryAt` gives the maximum size and the Strike's dice at a cast rank.
- **Runtime:**
  - `#executeIllusoryCreature`: the size (`size` in tests), the NPC actor and token, and the sustained native record (10 minutes at most) whose entries are the token and the actor.
  - `illusoryAct` and the card's two buttons.
  - `illusoryCheck`, from the active GM's `createChatMessage` (an attack roll hitting the image, or a save it failed) and `updateToken` (the distance to the caster) hooks.

## Tests

950/950 pass. `test/rank-2-batch-78.test.js` is new. It checks:
- the image's statistics, the Strike, Disbelieve, and heightening at ranks 2, 3 and 6;
- that a changed size or save offset is read (the text's), and that changed nonlethal, healing or heightening text isn't.

A whole-corpus compile (b333 → b334) changed only Illusory Creature.

## Coverage

**Census:** **1155 enabled**, up from 1154. Rank 2: 241 of 245; the 4 left are rituals.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-78-live-results.json), case `rank2Batch78`, in the `pftest` world.
- **Size limit:** a Huge image at rank 2 was refused ("at most Large").
- **Heightened (rank 3), Huge:** AC 24 (the DC), Reflex +14, 3 squares wide, Strike 4d4.
- **Strike:** hit for 13; the creature lost 13.
- **Disbelieve:** success; it recovered 6 (half). A second hit dealt nothing.
- **Failed save:** the image's Reflex save failed; the spell ended and its token and actor were removed.
- **Range:** a second image with its range narrowed to 20 feet for the scene stayed active nearby, then ended when moved farther away.
- **Cleanup:** fixtures removed; no combats, regions or lights left.
