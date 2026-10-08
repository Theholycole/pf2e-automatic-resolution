# Rank 9 batch 12: groups 15 and 16

2026-10-05. PF2e's Effect plus the rest of its text (group 15), and Heartbolt (group 16).

| Spell | Now |
| --- | --- |
| Tangling Creepers | **The creepers**: the placed 40-foot burst holds PF2e's Effect (the –10-foot Speeds) for the creatures inside, for 10 minutes; leaving removes it. **The vine**, on a Sustain once per round: a melee spell attack. A hit Immobilizes for 1 round or until the creature Escapes. |
| True Target | **The designated creature**: PF2e's Effect on up to 4 attackers, its mark set on the creature the GM designates. Each attacker's first attack roll against it rolls twice and ignores circumstance penalties, then the module removes that attacker's Effect. Skipping the Concealed or Hidden flat check is a GM note. |
| Sacred Covenant | **The pact** on the caster and up to 5 willing creatures. The first time one would drop to 0 Hit Points, the module keeps it at 1. It gets PF2e's Effect (50 temporary Hit Points for 1 minute) and Wounded +1. The pact then ends for it, and it's immune until its next daily preparations. The anathema rule is a GM note. |
| Heartbolt | **The bolt and its plume**: a willing living target heals 3d10+15 (+1d10+5 per 2 ranks); an undead target gets the basic Fortitude save card for that much vitality damage. Every other creature within 20 feet of the target: living ones heal 5 × half the rank, undead ones get the basic Fortitude save card. |

New runtime:

- Card parts: **true-target**, **covenant** and **heartbolt** (`scripts/support-runtime.js`).
- A card's placed area holding PF2e's Effect.
- The covenant's hold at 0 Hit Points.
- Named sub-plans in parts (`…Spec` → `…Plan`).

## Tests

`test/rank-9-batch-12.test.js` is new. A whole-corpus compile (b798 → b799) changed only these four spells.

## Evidence

[Live evidence](phase-rank-9-batch-12-live-results.json), case `rank9Batch12`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Tangling Creepers: a creature inside, one outside; the vine's hit | PF2e's Effect on the one inside only; Immobilized |
| True Target: two attackers; one's attack roll against the mark | Both have the Effect marking the foe; the attacker's Effect used, the other's kept |
| Sacred Covenant: an ally at 20 takes 60; cast on it again | 1 Hit Point, 50 temporary, Wounded 1, not dying, the pact gone, immune; refused |
| Heartbolt: a living target with a living and an undead neighbour; an undead target | +30, +15, the undead 15 (failure); the undead target 35 (failure) |
