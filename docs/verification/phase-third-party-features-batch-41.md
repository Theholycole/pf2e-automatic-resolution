# Third-party features batch 41: exploits and Channel Smite+

2026-10-08. Built here at the user's request ("build exploits and Channel Smite … here too"); before, recorded for the ability module ([audit](../planning/third-party-features-audit.md)).

## What changed

- **`scripts/plus-exploit-runtime.js`** (new):
  - `readExploit` reads the Cost and each exploit's text; `readChannelSmite` reads Channel Smite+.
  - The feat's card posts a card with Rebuttal and Unravel (or 1, 2 and 3 actions). Its button pays with a slot meeting the Cost (asked when several; prepared spells expended, spontaneous slots spent), then:
    - Fickle Fate: the status bonus and penalty on the targeted creature, or a 15-foot aura for a minute (`exploitAuraTurnStart`).
    - Adaptable Energy: resistance of the spell's energy type, 2 × rank, on the target, or on the caster and allies within 30 feet for rank rounds.
    - Impromptu Incarnation: the expended summon spell's creature, two sizes larger (PF2e's size rule and its token), reach +10, Immobilized, departing after 1 or 3 turns.
    - Force Disruption: rank d6 force, basic Reflex, pushed 5/10 feet, in a 10-foot emanation or on the targeted creatures.
    - Immortality Clause: its Effect for a minute, regeneration deactivated by force or spirit.
    - Dimensional Jump: the distance; Babbling Profusion: the 30-foot emanation's reminder for rank rounds.
  - Channel Smite+: the Harm or Heal is expended and the next melee Strike armed (`channelSmiteOnStrike`). A hit deals half of, or all of, rank d8 spirit; for 3 actions, the basic Reflex card on the targeted creatures.
- **`main.js`** hooks it; **the census** reads it.

## Tests

`test/third-party-features-batch-41.test.js` (2). All unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-41-live-results.json), case `thirdPartyFeaturesBatch41`. A 20th-level wizard with prepared Sure Strike, Force Barrage, Summon Animal (rank 1), Fireball (3) and Fear (10):

| Step | Result |
| --- | --- |
| Fickle Fate, Rebuttal at the foe | Sure Strike expended; +2 misfortune / −2 fortune on the foe |
| Adaptable Energy, Unravel | Fireball expended; fire resistance 6 on the wizard and the ally |
| Force Disruption, Rebuttal | Force Barrage expended; basic Reflex 1d6 force for the foe within 10 feet |
| Immortality Clause, Unravel | Fear (10) expended; its Effect, regeneration deactivated by force and spirit |
| Impromptu Incarnation, Rebuttal | Summon Animal expended; the small beetle summoned large (2×2), Immobilized |
| Dimensional Jump, Rebuttal | Sure Strike expended; teleport up to 10 feet |
| A cleric's Channel Smite+ (2 actions), then a Longsword hit | The rank-2 slot spent; 2d8 spirit taken |
