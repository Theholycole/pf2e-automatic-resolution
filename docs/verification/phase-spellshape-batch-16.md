# Spellshape batch 16: forced movement and the watching wands

2026-10-05. The user: "automate as much as you can" and "for any forced movement make sure no two tokens end in the same space. If one token moves into another's space they instead end adjacent".

Forced movement (`scripts/forced-movement.js`): the module moves a pushed or pulled token square by square in the nearest of the 8 directions away from (or toward) the origin, diagonals 5/10 feet, stopping at walls and the scene's edge. A token that would end in another creature's space ends instead in the free space adjacent to that creature nearest where it was going (then nearest where it came from). Used by save-card pushes and pulls (from the caster, a template's centre, or the spellshape's origin), Knockback Spell, Forceful Hand's Shove, the launch push-back and the ongoing hazard pushes. Optional, "up to", any-direction, per-hit and action-limited moves stay the GM's.

Wands that were GM notes, now automated (`spellshape-runtime.js`; each a watching Effect with `flags.<module>.spellshapeWatch`):

- Wand of Hawthorn: an unarmed Strike that hits the Oaken Resilience target: 1d4 piercing to the attacker ("otherwise touches" and the engulfing creature stay the GM's).
- Wand of Shocking Haze: a creature adjacent to the caster failing a flat check: 5 electricity.
- Wand of the Spider: a failed Athletics check or Reflex save by a creature in the web's template: 1d6 poison.
- Wand of Traitorous Thoughts: the probe target's first Deception success (or critical success) becomes one step worse on its message; the GM is told what the caster learns.
- Wand of Shardstorm: at the start of each of the caster's turns for 1 minute, a card: the 1-action force barrage's shards (1 + 1 per 2 ranks above 1st), shared among the targeted creatures, 1d4+1 force each.
- Wand of Thundering Echoes: the template's area kept; at the start of each of the caster's turns, the spell again in that area one rank lower (one fewer d10), until below 2d10.
- Wand of Continuation: the cast's Effects (the module's, or PF2e's from the spell) made within 10 minutes last half again as long (1 minute becomes 15 rounds).

## Tests

`test/forced-movement.test.js` (3) and `test/spellshape-batch-16.test.js` (4): the readers' riders, the duration scaling, the dice at a lower rank.

## Evidence

[Live evidence](phase-spellshape-batch-16-live-results.json), case `spellshapeBatch16`, in the `pftest` world. Hawthorn, Shocking Haze, the Spider and Traitorous Thoughts are driven by check messages carrying PF2e's context (type, outcome, domains, options), as PF2e posts them.

| Step | Result |
| --- | --- |
| A Reflex card's failure: pushed 10 feet from the caster at (5,4), the foe at (6,4), a blocker at (8,4) | The foe ends at (7,4), beside the blocker |
| Hawthorn: the foe's unarmed hit on the ally | 2 piercing to the foe |
| Shocking Haze: the adjacent foe fails a flat check | 5 electricity |
| Spider: Athletics failures in the web and outside it | 4 poison; nothing |
| Traitorous Thoughts: the foe's Deception success | Recorded as a failure; the Effect used up |
| Shardstorm (3rd): the caster's turn | 2 shards; 7 force to the targeted foe |
| Thundering Echoes (3rd), Noise Blast: the caster's turn | Noise Blast's card again at 2nd rank in the area |
| Continuation (3rd), Heroism: PF2e's Heroism Effect | 10 minutes → 15 minutes |
