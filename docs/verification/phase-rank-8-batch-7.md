# Rank 8 batch 7 — Divine Aura

2026-10-03. Growing areas.

| Spell | Now |
| --- | --- |
| Divine Aura | The caster's sustained 10-foot emanation. Each of the caster's allies inside holds an Effect: +1 status to AC and saves. It has two toggles: against a creature of the opposite alignment, +2; against such a creature's effect imposing Controlled, or a creature it summoned, +4. PF2e keeps the highest status bonus. The GM's control for "an opposite creature hit a target in melee" opens that creature's Will save: Blinded for 1 minute on a failure or critical failure. Whatever the result, it's then immune for 1 minute. Each Sustain grows the aura 10 feet. |

Interpretation: PF2e's creatures no longer carry alignment traits, so "opposite alignment" is the GM's call: the allies' toggles and the melee-hit control. The alignment choice and the deity requirement are a note on the Effect.

Runtime: a lingering area's own rules can go to the caster's allies inside only (`memberAllies`); a GM-action area can be the caster's emanation.

## Tests

`test/rank-8-batch-7.test.js` is new. A whole-corpus compile (b758 → b759) changed only Divine Aura.

## Evidence

[Live evidence](phase-rank-8-batch-7-live-results.json), case `rank8Batch7`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast (rank 8) | The ally inside: AC +1; the enemy and the caster: no Effect |
| The ally's opposite-alignment toggle | AC +2 |
| The GM's melee-hit control on the enemy; it fails its Will save | Blinded |
| The control again | Refused (immune for 1 minute) |
| Sustain (in combat) | 20 feet |
| End | The ally's Effect removed |

**Cleanup:** fixtures and combat removed.
