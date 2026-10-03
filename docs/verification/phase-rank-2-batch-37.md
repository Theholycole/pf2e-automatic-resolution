# Rank 2 batch 37 — a conjured tree as a token

2026-10-01. Follows the user's decision of 2026-10-01: a conjured creature with statistics is a temporary token the module makes, removed when the spell ends.

| Spell | Now |
| --- | --- |
| Avenging Wildwood (2) | When cast, the module makes the tree as a temporary PF2e NPC with a token in a free space within 60 feet (or where the caster chooses). It's Medium, with the plant and wood traits, AC = spell DC, saves = spell DC − 10, and 20 Hit Points (+10 every 2 ranks); it's owned like the caster. The cast and each Sustain make a spell attack from the card (the caster's spell attack modifier) against a creature within 15 feet of the tree. On a hit it deals 2d8 (+1d8 every 2 ranks) of the type picked for that attack; a critical hit doubles it. The caster's Effect lasts the spell's minute; when it ends (or is deleted when the caster stops Sustaining), the tree's token and actor are removed. Its later life as an ordinary tree, the space rule and the GM's inhospitable-situations rule are notes. |

## Rules

- **`sustain-attack.js`:** `conjuredAttack` reads exactly the tree's sentences (size, statistics, saves and Hit Points, the Strike within its reach, the type each time) and the Heightened step. The rest must be the three known notes.
- **`compile-ability.js`:** the sustain-attack plan gains `resolution.conjuredCreature`.
- **`basic-save-core.js`:** a `conjuredCreature` needs the stated size, AC, saves, Hit Points, reach and range, on a Sustain-repeated spell attack.
- **`basic-save-runtime.js`:**
  - `ensureConjuredCreature` makes the NPC, its token (`freeSpaceNear`, now exported from `effect-runtime.js`, or `options.conjurePosition`) and the caster's Effect flagged `summon`. Later attacks of the spell reuse the tree.
  - A target more than the reach from the tree is unaffected.
  - The existing `summonOnEnd` removes the tree with the Effect.

## Tests

880/880 pass. `test/rank-2-batch-37.test.js` is new. It checks:
- the plan, and that a forged statistic is refused;
- that an extra statistic in the text isn't read.

A whole-corpus compile (b290 → b291) changed only Avenging Wildwood.

## Coverage

**Census:** **1106 enabled**, up from 1105. Rank 2: 192 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-37-live-results.json), case `rank2Batch37`, in the `pftest` world (cast at 4th, DC 24).
- **First attack:** the creature 10 feet from the tree was eligible; the one 40 feet away wasn't ("more than 15 feet from the tree"). A hit dealt "3d8 slashing" (14 lost).
- **The tree:** one NPC with one token: AC 24, 30 Hit Points, Fortitude +14, Medium.
- **Second attack:** the same tree. A critical hit dealt "3d8 bludgeoning" doubled (20 lost).
- **The caster's Effect:** 1 minute. Deleting it removed the tree's token and actor.
